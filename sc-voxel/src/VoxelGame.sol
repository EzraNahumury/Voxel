// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title VoxelGame
/// @notice Celo card-guessing game. Players deposit native CELO to receive internal
///         VOXEL credits, play card-guessing rounds that cost a credit fee, earn more
///         credits on a win, and redeem remaining credits back to CELO.
/// @dev    VOXEL credits are an internal accounting balance only: NOT an ERC-20 token,
///         NOT transferable, and with no existence outside this contract. Credits are
///         redeemable for CELO at `voxelPerCelo`, bounded by the contract's CELO balance.
///
///         ┌──────────────────────────────────────────────────────────────────────┐
///         │  SECURITY WARNING — TESTNET MVP ONLY                                   │
///         │  The winning card is chosen with on-chain PSEUDO-randomness (see        │
///         │  `_drawWinningCard`). It is PREDICTABLE and MANIPULABLE by validators   │
///         │  and sophisticated callers. Replace it with a VRF provider or a         │
///         │  commit-reveal scheme before ANY value-bearing / mainnet deployment.    │
///         │  This contract is NOT audited.                                          │
///         └──────────────────────────────────────────────────────────────────────┘
contract VoxelGame is Ownable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/

    struct LevelConfig {
        uint8 cardCount; // number of cards (e.g. 3 / 5 / 7)
        uint256 fee; // play fee in VOXEL credits
        uint256 reward; // win reward in VOXEL credits
        bool enabled;
    }

    struct PlayerStats {
        uint256 totalPlayed;
        uint256 totalWins;
        uint256 totalLosses;
        uint256 totalFeesPaid; // in VOXEL
        uint256 totalRewardWon; // in VOXEL
    }

    struct Round {
        address player;
        uint8 level;
        uint8 cardCount;
        uint8 playerPick;
        uint8 winningCard;
        uint256 fee; // VOXEL
        uint256 reward; // VOXEL
        bool won;
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint8 public constant LEVEL_BEGINNER = 1;
    uint8 public constant LEVEL_MEDIUM = 2;
    uint8 public constant LEVEL_HARD = 3;

    /// @dev 1 CELO == 1e18 wei; used for the credit/CELO conversion.
    uint256 private constant WEI_PER_CELO = 1e18;

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice VOXEL credit balance per user.
    mapping(address => uint256) public creditBalance;

    /// @notice Per-level configuration.
    mapping(uint8 => LevelConfig) public levels;

    /// @notice Lifetime stats per player.
    mapping(address => PlayerStats) public playerStats;

    /// @notice Round history by id.
    mapping(uint256 => Round) public rounds;

    /// @notice Credits minted per 1 CELO deposited (owner-configurable). Default 1000.
    uint256 public voxelPerCelo = 1000;

    /// @notice Auto-incrementing id assigned to the next round.
    uint256 public nextRoundId;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(address indexed user, uint256 celoAmount, uint256 voxelCredited);
    event Withdrawn(address indexed user, uint256 voxelBurned, uint256 celoAmount);
    event RoundPlayed(
        uint256 indexed roundId,
        address indexed user,
        uint8 level,
        uint8 cardCount,
        uint8 playerPick,
        uint8 winningCard,
        bool won,
        uint256 fee,
        uint256 reward
    );
    event LevelUpdated(uint8 indexed level, uint8 cardCount, uint256 fee, uint256 reward, bool enabled);
    event ConversionRateUpdated(uint256 voxelPerCelo);
    event PrizePoolFunded(address indexed funder, uint256 celoAmount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAmount();
    error DepositTooSmall();
    error WithdrawTooSmall();
    error InsufficientCredits();
    error InsufficientLiquidity();
    error TransferFailed();
    error LevelNotEnabled();
    error InvalidPick();
    error InvalidCardCount();
    error InvalidRate();
    error DirectTransferNotAllowed();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploys the game with the deployer as owner and seeds the default levels.
    constructor() Ownable(msg.sender) {
        // Default economics (in VOXEL credits), configurable later via setLevel.
        _setLevel(LEVEL_BEGINNER, 3, 10, 25, true);
        _setLevel(LEVEL_MEDIUM, 5, 25, 100, true);
        _setLevel(LEVEL_HARD, 7, 50, 300, true);
    }

    /*//////////////////////////////////////////////////////////////
                             PLAYER ACTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit native CELO and receive VOXEL credits at the current rate.
    /// @dev credited = msg.value * voxelPerCelo / 1e18.
    function depositCELO() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        uint256 credited = (msg.value * voxelPerCelo) / WEI_PER_CELO;
        if (credited == 0) revert DepositTooSmall();

        creditBalance[msg.sender] += credited;
        emit Deposited(msg.sender, msg.value, credited);
    }

    /// @notice Redeem VOXEL credits back to CELO at the current rate.
    /// @dev Follows checks-effects-interactions; the CELO transfer is the final step.
    ///      Payout is bounded by the contract's CELO balance ("withdraw if allowed").
    /// @param voxelAmount Amount of VOXEL credits to burn.
    function withdraw(uint256 voxelAmount) external nonReentrant {
        if (voxelAmount == 0) revert ZeroAmount();

        uint256 balance = creditBalance[msg.sender];
        if (voxelAmount > balance) revert InsufficientCredits();

        uint256 celoOut = (voxelAmount * WEI_PER_CELO) / voxelPerCelo;
        if (celoOut == 0) revert WithdrawTooSmall();
        if (address(this).balance < celoOut) revert InsufficientLiquidity();

        // Effects
        creditBalance[msg.sender] = balance - voxelAmount;
        emit Withdrawn(msg.sender, voxelAmount, celoOut);

        // Interaction
        (bool ok,) = payable(msg.sender).call{value: celoOut}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice Play one card-guessing round at the given level.
    /// @dev The fee is always deducted; the reward is credited only on a win.
    ///      `playerPick` is 0-indexed in [0, cardCount). No external calls are made,
    ///      so this function is not reentrant.
    /// @param level The level id (1 = Beginner, 2 = Medium, 3 = Hard).
    /// @param playerPick The 0-indexed card the player guesses.
    /// @return roundId The id assigned to this round.
    function playRound(uint8 level, uint8 playerPick) external returns (uint256 roundId) {
        LevelConfig memory cfg = levels[level];
        if (!cfg.enabled || cfg.cardCount == 0) revert LevelNotEnabled();
        if (playerPick >= cfg.cardCount) revert InvalidPick();

        uint256 balance = creditBalance[msg.sender];
        if (balance < cfg.fee) revert InsufficientCredits();

        // Effects: deduct fee before resolving the round.
        balance -= cfg.fee;

        roundId = nextRoundId++;
        uint8 winningCard = _drawWinningCard(cfg.cardCount, roundId);
        bool won = playerPick == winningCard;

        PlayerStats storage stats = playerStats[msg.sender];
        stats.totalPlayed += 1;
        stats.totalFeesPaid += cfg.fee;

        uint256 reward = 0;
        if (won) {
            reward = cfg.reward;
            balance += reward;
            stats.totalWins += 1;
            stats.totalRewardWon += reward;
        } else {
            stats.totalLosses += 1;
        }

        creditBalance[msg.sender] = balance;

        rounds[roundId] = Round({
            player: msg.sender,
            level: level,
            cardCount: cfg.cardCount,
            playerPick: playerPick,
            winningCard: winningCard,
            fee: cfg.fee,
            reward: reward,
            won: won,
            timestamp: block.timestamp
        });

        emit RoundPlayed(roundId, msg.sender, level, cfg.cardCount, playerPick, winningCard, won, cfg.fee, reward);
    }

    /*//////////////////////////////////////////////////////////////
                             ADMIN ACTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Configure a level's economics.
    /// @dev `cardCount` must be >= 2 (a guessing game needs at least two cards).
    function setLevel(uint8 level, uint8 cardCount, uint256 fee, uint256 reward, bool enabled) external onlyOwner {
        _setLevel(level, cardCount, fee, reward, enabled);
    }

    /// @notice Update the CELO -> VOXEL conversion rate.
    /// @dev Does not retroactively change existing balances; affects future
    ///      deposits and the value of withdrawals. Use with care in production.
    function setConversionRate(uint256 newVoxelPerCelo) external onlyOwner {
        if (newVoxelPerCelo == 0) revert InvalidRate();
        voxelPerCelo = newVoxelPerCelo;
        emit ConversionRateUpdated(newVoxelPerCelo);
    }

    /// @notice Seed CELO liquidity so winnings can be redeemed. Owner-only.
    function fundPrizePoolCELO() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit PrizePoolFunded(msg.sender, msg.value);
    }

    /*//////////////////////////////////////////////////////////////
                                  VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @notice VOXEL credit balance of `user`.
    function getCreditBalance(address user) external view returns (uint256) {
        return creditBalance[user];
    }

    /// @notice Lifetime stats of `user`.
    function getPlayerStats(address user) external view returns (PlayerStats memory) {
        return playerStats[user];
    }

    /// @notice Configuration of `level`.
    function getLevel(uint8 level) external view returns (LevelConfig memory) {
        return levels[level];
    }

    /// @notice Round data for `roundId`.
    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    /// @notice Current CELO liquidity available for redemptions.
    function contractLiquidity() external view returns (uint256) {
        return address(this).balance;
    }

    /*//////////////////////////////////////////////////////////////
                                INTERNAL
    //////////////////////////////////////////////////////////////*/

    function _setLevel(uint8 level, uint8 cardCount, uint256 fee, uint256 reward, bool enabled) internal {
        if (cardCount < 2) revert InvalidCardCount();
        levels[level] = LevelConfig({cardCount: cardCount, fee: fee, reward: reward, enabled: enabled});
        emit LevelUpdated(level, cardCount, fee, reward, enabled);
    }

    /// @dev INSECURE pseudo-randomness — testnet MVP only. Predictable and manipulable.
    ///      Replace with a VRF provider or commit-reveal before any value-bearing deployment.
    function _drawWinningCard(uint8 cardCount, uint256 roundId) private view returns (uint8) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, roundId)));
        // rand % cardCount < cardCount <= 255, so the uint8 cast never truncates.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint8(rand % cardCount);
    }

    /*//////////////////////////////////////////////////////////////
                          NATIVE TRANSFER GUARD
    //////////////////////////////////////////////////////////////*/

    /// @dev Reject bare CELO transfers so funds can only enter via depositCELO /
    ///      fundPrizePoolCELO, which track intent. Prevents accidental loss.
    receive() external payable {
        revert DirectTransferNotAllowed();
    }
}
