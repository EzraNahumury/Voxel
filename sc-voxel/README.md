# Voxel Game — Smart Contracts (`sc-voxel`)

Solidity contracts for **Voxel**, a Celo card-guessing game: deposit native CELO → receive internal **VOXEL credits** → play card-guessing rounds → redeem credits back to CELO. Built with **Foundry** + **OpenZeppelin**.

> Full product docs live in the root project README: [`../README.md`](../README.md).

---

## 🚀 Live deployment — Celo Mainnet

| Item | Value |
|---|---|
| **Contract** | [`0x0298c67E83f7E21456fb0cEc68Bb62abf2720504`](https://celoscan.io/address/0x0298c67E83f7E21456fb0cEc68Bb62abf2720504) |
| **Network** | Celo Mainnet (chainId **42220**) |
| **Owner / deployer** | `0x5Aea061d814A72de9EE9171bE86F45f48e1E2f5d` |
| **Conversion rate** | `voxelPerCelo = 1000` (1 CELO → 1000 VOXEL) |
| **Levels (seeded)** | Beginner `3 / 10 / 25` · Medium `5 / 25 / 100` · Hard `7 / 50 / 300` (cards / fee / reward, in VOXEL) |
| **Prize pool** | 0.3 CELO — fund tx [`0x4ecd4a53…b7c3ce6`](https://celoscan.io/tx/0x4ecd4a530dc4e7e3af93e4a06fd983049d04e147658e4e46bab3ffd8eb7c3ce6) |
| **Verification** | Sourcify `exact_match` ✅ ([source](https://sourcify.dev/#/lookup/0x0298c67E83f7E21456fb0cEc68Bb62abf2720504)) |
| **Deployed** | 2026-05-31 |

**Frontend env:**

```bash
NEXT_PUBLIC_VOXEL_CONTRACT_ADDRESS=0x0298c67E83f7E21456fb0cEc68Bb62abf2720504
NEXT_PUBLIC_CHAIN_ID=42220
```

> **Celoscan UI badge:** source is verified on Sourcify. To also show "Verified" on Celoscan, set `CELOSCAN_API_KEY` and run the verify command in [Verify](#verify).

---

## ⚠️ Security status

This is an **unaudited MVP**. The winning card is chosen with **insecure on-chain pseudo-randomness** (`_drawWinningCard` = `keccak256(block.timestamp, block.prevrandao, msg.sender, roundId) % cardCount`). On mainnet this is **predictable** — a sophisticated caller can compute the winning card and win every round, draining a funded prize pool.

- The mainnet prize pool is intentionally kept tiny (0.3 CELO) as a "demo budget".
- **Do not fund a meaningful pool** until randomness is replaced with a VRF provider or commit-reveal, and the contract is audited.
- Not a real-money gambling product. See the compliance disclaimer in [`../README.md`](../README.md).

---

## Contract overview — `VoxelGame.sol`

VOXEL credits are an **internal accounting balance only** — not an ERC-20 token, not transferable, no existence outside the contract. They are redeemable for CELO at `voxelPerCelo`, bounded by the contract's CELO balance.

### Functions

| Function | Access | Purpose |
|---|---|---|
| `depositCELO()` payable | public | Mint VOXEL = `msg.value * voxelPerCelo / 1e18`. |
| `playRound(uint8 level, uint8 playerPick)` → `roundId` | public | Deduct fee, draw winning card, credit reward on a win. `playerPick` is **0-indexed** `[0, cardCount)`. |
| `withdraw(uint256 voxelAmount)` | public | Burn VOXEL, send `voxelAmount * 1e18 / voxelPerCelo` CELO (liquidity-bounded). |
| `getCreditBalance(address)` view | public | VOXEL balance of a user. |
| `getPlayerStats(address)` view | public | Lifetime stats. |
| `getLevel(uint8)` / `getRound(uint256)` view | public | Level config / round data. |
| `contractLiquidity()` view | public | Contract CELO balance. |
| `setLevel(uint8,uint8,uint256,uint256,bool)` | owner | Configure a level (cardCount ≥ 2). |
| `setConversionRate(uint256)` | owner | Update CELO↔VOXEL rate. |
| `fundPrizePoolCELO()` payable | owner | Seed CELO liquidity for redemptions. |

### Events

`Deposited` · `Withdrawn` · `RoundPlayed` · `LevelUpdated` · `ConversionRateUpdated` · `PrizePoolFunded`

### Safety properties

- OpenZeppelin `Ownable` + `ReentrancyGuard` (on `depositCELO` / `withdraw`).
- Checks-Effects-Interactions: balances updated before the CELO transfer; native send via checked low-level `call`.
- Cannot play with credits below the level fee; cannot withdraw more than held; payout reverts if contract CELO liquidity is insufficient.
- `receive()` rejects bare CELO transfers (funds enter only via `depositCELO` / `fundPrizePoolCELO`).

---

## Project layout

```
sc-voxel/
├── src/VoxelGame.sol          # the contract
├── script/VoxelGame.s.sol     # deploy script (VoxelGameScript)
├── test/VoxelGame.t.sol       # 20 Foundry tests
├── foundry.toml               # solc 0.8.24, evm paris, optimizer
├── remappings.txt             # @openzeppelin/ , forge-std/
└── lib/                       # forge-std, openzeppelin-contracts (v5.1.0)
```

---

## Setup

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
# install dependencies (forge-std is vendored; add OpenZeppelin)
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0

# build & test
forge build
forge test          # 20 passed
forge fmt --check
```

### Environment

Copy `.env.example` → `.env` and fill it in. **`.env` is gitignored — never commit a private key. Use a dedicated deployer wallet.**

```bash
PRIVATE_KEY=0x...
CELO_RPC_URL=https://forno.celo.org                              # chainId 42220 (mainnet)
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org # chainId 11142220 (testnet)
CELOSCAN_API_KEY=                                                # optional, for Celoscan verify
```

---

## Deploy

```bash
# Celo Mainnet
forge script script/VoxelGame.s.sol:VoxelGameScript \
  --rpc-url "$CELO_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast

# (testnet) swap in $CELO_SEPOLIA_RPC_URL
```

After deploy (owner actions, as needed):

```bash
# seed the prize pool (real CELO)
cast send <CONTRACT> "fundPrizePoolCELO()" --value 0.3ether \
  --rpc-url "$CELO_RPC_URL" --private-key "$PRIVATE_KEY"
```

## Verify

```bash
# Sourcify (keyless) — what this deployment used
forge verify-contract <CONTRACT> src/VoxelGame.sol:VoxelGame \
  --chain-id 42220 --verifier sourcify --watch

# Celoscan (needs an API key)
forge verify-contract <CONTRACT> src/VoxelGame.sol:VoxelGame \
  --chain-id 42220 --etherscan-api-key "$CELOSCAN_API_KEY" --watch
```

---

## License

MIT.
