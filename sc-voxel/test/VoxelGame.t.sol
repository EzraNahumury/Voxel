// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {VoxelGame} from "../src/VoxelGame.sol";

contract VoxelGameTest is Test {
    VoxelGame internal voxel;
    address internal alice;

    uint8 internal constant BEGINNER = 1;
    uint8 internal constant MEDIUM = 2;
    uint8 internal constant HARD = 3;

    // Mirrors the defaults seeded in the constructor.
    uint256 internal constant BEGINNER_FEE = 10;
    uint256 internal constant BEGINNER_REWARD = 25;
    uint8 internal constant BEGINNER_CARDS = 3;

    function setUp() public {
        voxel = new VoxelGame(); // owner == address(this)
        alice = makeAddr("alice");
        vm.deal(alice, 100 ether);
        vm.deal(address(this), 100 ether); // for funding the prize pool
    }

    // Replicates the contract's pseudo-random draw so wins/losses can be forced
    // deterministically. Valid only within the same block (no warp/roll between
    // this call and playRound), which holds inside a single test.
    function _expectedWinningCard(address player, uint8 cardCount, uint256 roundId) internal view returns (uint8) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, roundId)));
        // rand % cardCount < cardCount <= 255, so the uint8 cast never truncates.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint8(rand % cardCount);
    }

    /*//////////////////////////////////////////////////////////////
                                 DEPOSIT
    //////////////////////////////////////////////////////////////*/

    function test_DepositCreditsExactAtDefaultRate() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}();
        assertEq(voxel.getCreditBalance(alice), 1000, "1 CELO -> 1000 VOXEL");

        vm.prank(alice);
        voxel.depositCELO{value: 0.5 ether}();
        assertEq(voxel.getCreditBalance(alice), 1500, "0.5 CELO -> +500 VOXEL");

        assertEq(address(voxel).balance, 1.5 ether, "contract holds deposited CELO");
    }

    function test_DepositZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(VoxelGame.ZeroAmount.selector);
        voxel.depositCELO{value: 0}();
    }

    function test_DepositTooSmallReverts() public {
        // 0.0001 CELO * 1000 / 1e18 == 0 credits.
        vm.prank(alice);
        vm.expectRevert(VoxelGame.DepositTooSmall.selector);
        voxel.depositCELO{value: 0.0001 ether}();
    }

    /*//////////////////////////////////////////////////////////////
                                  PLAY
    //////////////////////////////////////////////////////////////*/

    function test_PlayRequiresEnoughCredits() public {
        vm.prank(alice);
        vm.expectRevert(VoxelGame.InsufficientCredits.selector);
        voxel.playRound(BEGINNER, 0);
    }

    function test_PlayInvalidPickReverts() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(VoxelGame.InvalidPick.selector);
        voxel.playRound(BEGINNER, BEGINNER_CARDS); // pick == cardCount is out of range
    }

    function test_PlayDisabledLevelReverts() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(VoxelGame.LevelNotEnabled.selector);
        voxel.playRound(99, 0); // unset level
    }

    function test_PlayWinAddsReward() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}(); // 1000 credits

        uint256 roundId = voxel.nextRoundId();
        uint8 winning = _expectedWinningCard(alice, BEGINNER_CARDS, roundId);

        vm.prank(alice);
        voxel.playRound(BEGINNER, winning);

        assertEq(voxel.getCreditBalance(alice), 1000 - BEGINNER_FEE + BEGINNER_REWARD, "net win = -fee +reward");

        VoxelGame.PlayerStats memory s = voxel.getPlayerStats(alice);
        assertEq(s.totalPlayed, 1);
        assertEq(s.totalWins, 1);
        assertEq(s.totalLosses, 0);
        assertEq(s.totalFeesPaid, BEGINNER_FEE);
        assertEq(s.totalRewardWon, BEGINNER_REWARD);
    }

    function test_PlayLoseDeductsOnlyFee() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}(); // 1000 credits

        uint256 roundId = voxel.nextRoundId();
        uint8 winning = _expectedWinningCard(alice, BEGINNER_CARDS, roundId);
        uint8 wrong = uint8((winning + 1) % BEGINNER_CARDS);

        vm.prank(alice);
        voxel.playRound(BEGINNER, wrong);

        assertEq(voxel.getCreditBalance(alice), 1000 - BEGINNER_FEE, "loss = -fee only");

        VoxelGame.PlayerStats memory s = voxel.getPlayerStats(alice);
        assertEq(s.totalPlayed, 1);
        assertEq(s.totalWins, 0);
        assertEq(s.totalLosses, 1);
        assertEq(s.totalRewardWon, 0);
    }

    /*//////////////////////////////////////////////////////////////
                                WITHDRAW
    //////////////////////////////////////////////////////////////*/

    function test_WithdrawSendsCelo() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}(); // alice: 99 ether, 1000 credits

        vm.prank(alice);
        voxel.withdraw(1000); // 1000 VOXEL -> 1 CELO

        assertEq(voxel.getCreditBalance(alice), 0, "credits burned");
        assertEq(alice.balance, 100 ether, "full CELO returned");
        assertEq(address(voxel).balance, 0, "contract drained");
    }

    function test_WithdrawMoreThanBalanceReverts() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(VoxelGame.InsufficientCredits.selector);
        voxel.withdraw(1001);
    }

    function test_WithdrawInsufficientLiquidityReverts() public {
        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}(); // contract balance == 1 ether, alice 1000 credits

        // Force a win so alice holds more credits than the contract can currently back.
        uint256 roundId = voxel.nextRoundId();
        uint8 winning = _expectedWinningCard(alice, BEGINNER_CARDS, roundId);
        vm.prank(alice);
        voxel.playRound(BEGINNER, winning); // alice now holds 1015 credits, contract still 1 ether

        uint256 credits = voxel.getCreditBalance(alice);
        vm.prank(alice);
        vm.expectRevert(VoxelGame.InsufficientLiquidity.selector);
        voxel.withdraw(credits); // needs 1.015 CELO, only 1 available

        // Owner seeds the pool, then redemption succeeds.
        voxel.fundPrizePoolCELO{value: 1 ether}();
        vm.prank(alice);
        voxel.withdraw(credits);
        assertEq(voxel.getCreditBalance(alice), 0);
        assertEq(alice.balance, 99 ether + (credits * 1e18) / voxel.voxelPerCelo());
    }

    /*//////////////////////////////////////////////////////////////
                              ADMIN / ACCESS
    //////////////////////////////////////////////////////////////*/

    function test_OnlyOwnerCanSetLevel() public {
        vm.prank(alice);
        vm.expectRevert(); // OZ Ownable: OwnableUnauthorizedAccount
        voxel.setLevel(BEGINNER, 4, 1, 2, true);
    }

    function test_OnlyOwnerCanSetConversionRate() public {
        vm.prank(alice);
        vm.expectRevert();
        voxel.setConversionRate(2000);
    }

    function test_SetConversionRateAffectsNewDeposits() public {
        voxel.setConversionRate(2000);
        assertEq(voxel.voxelPerCelo(), 2000);

        vm.prank(alice);
        voxel.depositCELO{value: 1 ether}();
        assertEq(voxel.getCreditBalance(alice), 2000, "rate applied to new deposit");
    }

    function test_SetConversionRateZeroReverts() public {
        vm.expectRevert(VoxelGame.InvalidRate.selector);
        voxel.setConversionRate(0);
    }

    function test_SetLevelInvalidCardCountReverts() public {
        vm.expectRevert(VoxelGame.InvalidCardCount.selector);
        voxel.setLevel(BEGINNER, 1, 10, 25, true); // < 2 cards
    }

    function test_FundPrizePoolIncreasesLiquidity() public {
        voxel.fundPrizePoolCELO{value: 5 ether}();
        assertEq(voxel.contractLiquidity(), 5 ether);
    }

    function test_DefaultLevelsSeeded() public view {
        VoxelGame.LevelConfig memory b = voxel.getLevel(BEGINNER);
        assertEq(b.cardCount, 3);
        assertEq(b.fee, 10);
        assertEq(b.reward, 25);
        assertTrue(b.enabled);

        VoxelGame.LevelConfig memory h = voxel.getLevel(HARD);
        assertEq(h.cardCount, 7);
        assertEq(h.fee, 50);
        assertEq(h.reward, 300);
    }

    /*//////////////////////////////////////////////////////////////
                            NATIVE GUARD / MISC
    //////////////////////////////////////////////////////////////*/

    function test_DirectTransferReverts() public {
        vm.prank(alice);
        (bool ok,) = address(voxel).call{value: 1 ether}("");
        assertFalse(ok, "bare CELO transfer must be rejected");
    }

    function testFuzz_DepositWithdrawRoundtrip(uint96 amount) public {
        // Keep amount large enough to mint >= 1 credit and within alice's balance.
        amount = uint96(bound(uint256(amount), 0.001 ether, 50 ether));

        vm.prank(alice);
        voxel.depositCELO{value: amount}();
        uint256 credits = voxel.getCreditBalance(alice);
        assertGt(credits, 0);

        uint256 before = alice.balance;
        vm.prank(alice);
        voxel.withdraw(credits);

        // Redeemed CELO equals credits / rate * 1e18 (floor); never more than deposited.
        uint256 redeemed = (credits * 1e18) / voxel.voxelPerCelo();
        assertEq(alice.balance, before + redeemed);
        assertLe(redeemed, amount, "cannot redeem more than deposited");
    }

    // Allow this test contract to receive CELO if ever needed.
    receive() external payable {}
}
