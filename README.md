# Voxel

> **Deposit. Pick your level. Find the card. Win the prize.**

**Voxel — a Celo-based, multi-token card-guessing game, built as a MiniApp for MiniPay.**

![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)
![Hackathon](https://img.shields.io/badge/Proof%20of%20Ship-Celo%20Builder%20Program-35D07F)
![Chain](https://img.shields.io/badge/chain-Celo-FCFF52)
![Wallet](https://img.shields.io/badge/wallet-MiniPay-2775CA)
![Contracts](https://img.shields.io/badge/contracts-Foundry%20%2B%20OpenZeppelin-orange)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%2B%20React%2019-black)
![License](https://img.shields.io/badge/license-MIT-blue)

> **⚠️ Honest status:** Voxel is an **MVP in active development** for the **Celo Proof of Ship** builder program. The repository currently contains the committed **scaffolds** (a Next.js 16 app and a Foundry contract project) plus the **complete technical design** for the game. Component-by-component status is tracked in the [Project Status](#project-status) matrix below. This README documents the target architecture; sections use a status legend so nothing is overclaimed.
>
> **Legend:** ✅ implemented &nbsp;·&nbsp; 🚧 in progress &nbsp;·&nbsp; 🗺️ planned

---

## Table of Contents

1. [One-liner](#one-liner)
2. [Problem](#problem)
3. [Solution](#solution)
4. [Why Voxel fits Proof of Ship](#why-voxel-fits-proof-of-ship)
5. [Project status](#project-status)
6. [Key features](#key-features)
7. [Supported tokens](#supported-tokens)
8. [Game levels](#game-levels)
9. [User flow](#user-flow)
10. [Demo flow](#demo-flow)
11. [Architecture](#architecture)
12. [Smart contract design](#smart-contract-design)
13. [Frontend design](#frontend-design)
14. [Tech stack](#tech-stack)
15. [Security model](#security-model)
16. [Randomness disclaimer](#randomness-disclaimer)
17. [Compliance disclaimer](#compliance-disclaimer)
18. [Installation](#installation)
19. [Environment variables](#environment-variables)
20. [Smart contract deployment](#smart-contract-deployment)
21. [Frontend development](#frontend-development)
22. [Testing checklist](#testing-checklist)
23. [Repository structure](#repository-structure)
24. [Roadmap](#roadmap)
25. [Team](#team)
26. [License](#license)
27. [Hackathon submission checklist](#hackathon-submission-checklist)

---

## One-liner

Voxel is a mobile-first, multi-token **card-guessing game** on Celo: connect a MiniPay wallet, deposit one of four supported tokens, choose a difficulty level, and try to find the winning card to grow your in-game balance.

---

## Problem

Most onchain "games" on mobile wallets are either heavy DeFi dashboards or one-off click-to-earn loops. They are slow to understand, hard to play on a phone, and rarely give a casual user a reason to make a real onchain transaction in under a minute.

MiniPay reaches **14M+ self-custodial users** who already hold stablecoins, but there is a shortage of **simple, fun, mobile-native experiences** that:

- onboard a user into a real onchain action in seconds,
- work natively inside the MiniPay wallet,
- and are easy to grasp without any DeFi knowledge.

---

## Solution

Voxel turns a single onchain interaction into a **fast, luck-based card game**:

1. Deposit a supported token into the Voxel game contract.
2. Pick a difficulty: **Beginner (3 cards)**, **Medium (5 cards)**, or **Hard (7 cards)**.
3. Play a round: one card is the winner. Higher difficulty = higher play fee, but a bigger prize.
4. Win → the prize is credited to your in-game balance. Lose → only the play fee is deducted.
5. Withdraw your remaining balance to your wallet at any time.

It is intentionally **simple and mobile-first** — aligned with the Proof of Ship guidance that *"the simpler, the better."* Voxel is positioned squarely in the program's **Games** category — it is **not** a DeFi yield product, **not** a reward-farming app, and **not** a real-money gambling product. See the [Compliance disclaimer](#compliance-disclaimer).

---

## Why Voxel fits Proof of Ship

This project targets the **Proof of Ship — Celo Builder Program (Season 2, April–July 2026)**, whose brief is to *"ship real products"* as **MiniApps for MiniPay**.

| Program signal (from `Docs_Hackaton.md`) | How Voxel responds |
|---|---|
| Wanted category: **Games** | Voxel is a casual luck-based card game — a direct fit, not a DeFi/finance app. |
| **MiniApp built with the MiniPay hook** | Built as a MiniApp; wallet connection targets MiniPay's injected provider (via wagmi/viem). 🚧 |
| **Onchain activity** required | Every deposit, play, and withdrawal is a real onchain transaction on Celo. |
| **Deploy on Celo Mainnet, verified contract** | `VoxelGame.sol` targets Celo Mainnet with source verification on Celoscan. 🗺️ |
| **Open source, public GitHub** | This repository is public and MIT-licensed. |
| **"Simpler is better"** | One focused loop: deposit → pick level → play → win/lose → withdraw. |
| **Mobile-first** | Dark, rounded, thumb-friendly UI designed for the MiniPay in-wallet browser. |

> Avoided on purpose: the program explicitly does **not** seek *DeFi apps by solo builders*, *reward-farming apps*, or non-functional *demos / bot engagement*. Voxel is framed and built as a **functional game**, with deposits/fees/prizes as **in-game mechanics on testnet**, not as a financial or farming product.

---

## Project status

| Area | Component | Status |
|---|---|---|
| Repo | Two-package layout (`frontend-voxel/`, `sc-voxel/`) committed | ✅ |
| Repo | Full technical design (structs, functions, events, levels) specified | ✅ |
| Frontend | Next.js 16 + React 19 + Tailwind v4 scaffold | ✅ |
| Frontend | MiniPay-compatible wallet connection (wagmi/viem injected connector) | 🚧 |
| Frontend | Dashboard, deposit/withdraw, game lobby, game screen, result modal | 🚧 |
| Frontend | Framer Motion shuffle/flip animations | 🗺️ |
| Frontend | Leaderboard from contract events | 🗺️ |
| Contracts | Foundry project scaffold (`forge` + `forge-std`) | ✅ |
| Contracts | `VoxelGame.sol` (deposits, withdraw, play, stats, admin) | 🚧 |
| Contracts | OpenZeppelin `SafeERC20` / `Ownable` / `ReentrancyGuard` integration | 🚧 |
| Contracts | Foundry unit tests | 🗺️ |
| Deploy | Celo Sepolia (dev/QA) deployment | 🗺️ |
| Deploy | **Celo Mainnet** deployment + Celoscan verification (eligibility) | 🗺️ |
| Security | Secure randomness (VRF / commit-reveal) | 🗺️ |
| Security | External audit | 🗺️ (out of MVP scope) |

---

## Key features

- 🚧 **Multi-token deposits** — USDm, USDC, USDT (ERC-20 `approve` + deposit) and native CELO (`payable` deposit).
- 🚧 **In-game balance system** — play is funded from your deposited balance, never directly from your wallet.
- 🚧 **Three difficulty levels** — Beginner (3 cards), Medium (5), Hard (7), with configurable fee and prize per level.
- 🚧 **Card-guessing round** — one winning card per round; pick it to win the prize.
- 🚧 **Withdraw anytime** — pull your unused balance back to your wallet.
- 🚧 **Player stats** — total played, wins, losses, win rate, total prize won.
- 🚧 **Owner/admin configuration** — supported tokens and level economics are configurable onchain.
- 🚧 **Events for indexing** — `Deposited`, `Withdrawn`, `RoundPlayed`, `LevelUpdated`, `TokenUpdated` for a frontend/leaderboard to consume.
- 🗺️ **Leaderboard** — rank, wallet, plays, wins, win rate, total prize won (read from contract events).
- 🚧 **MiniPay-native, mobile-first UI** — dark theme, neon-green Celo accent, large touch targets.

---

## Supported tokens

| Token | Name | Type | Deposit method |
|---|---|---|---|
| **USDm** | Mento Dollar | ERC-20 | `approve` → `depositERC20` |
| **USDC** | USD Coin | ERC-20 | `approve` → `depositERC20` |
| **USDT** | Tether USD | ERC-20 | `approve` → `depositERC20` |
| **CELO** | Celo native token | Native | `depositCELO` (payable) |

Token addresses are **never hardcoded** — they are read from environment variables and registered onchain via the admin `setToken` function.

> **Testnet note:** On **Celo Sepolia** you can fund **CELO** from the [Celo faucet](https://faucet.celo.org/celo-sepolia) and **USDC** from the [Circle faucet](https://faucet.circle.com/). USDm and USDT may require mock ERC-20 tokens on testnet; production token addresses are configured for **Celo Mainnet**.

---

## Game levels

| Level | Cards | Win chance | Example play fee | Example prize |
|---|---:|---:|---:|---:|
| **Beginner** | 3 | 33.33% | 0.1 | 0.2 |
| **Medium** | 5 | 20.00% | 0.2 | 0.7 |
| **Hard** | 7 | 14.28% | 0.5 | 2.5 |

> Fees and prizes above are **example defaults** and are **configurable onchain** by the contract owner per level (`setLevel`). Values are expressed in the selected token's units; token decimals are handled per token (see [Security model](#security-model)).

---

## User flow

```
Open app  →  Connect wallet  →  Choose token  →  Deposit token
   →  Select level  →  Play round  →  Pick a card  →  Win or lose
   →  Balance updates  →  Play again  /  Withdraw
```

1. **Connect wallet** — the app reads your wallet balances (USDm, USDC, USDT, CELO) and your in-contract deposit balances.
2. **Deposit** — choose a token and amount. ERC-20 tokens require an `approve` then `deposit`; CELO uses a native payable deposit.
3. **Choose token & level** — the lobby shows card count, play fee, possible prize, and your deposit balance.
4. **Play** — cards are shown face-down and shuffled; you pick one; the round is submitted onchain; the winning card is revealed.
5. **Result** — win credits the prize to your balance; loss deducts only the play fee. The result is recorded in your stats.
6. **Withdraw** — withdraw any unused deposit balance back to your wallet at any time.

---

## Demo flow

A ~60-second judge/demo walkthrough:

1. Open Voxel inside MiniPay (or a browser wallet on Celo Sepolia for local testing).
2. Connect wallet → balances load.
3. Deposit a small amount of a test token (e.g. 1 USDC) → confirm the onchain deposit transaction.
4. Open the lobby → select **Medium (5 cards)** → review fee `0.2` and prize `0.7`.
5. Start the round → watch the shuffle → pick a card → submit the play transaction.
6. See the **Win/Lose** modal and the updated in-game balance.
7. Withdraw the remaining balance → confirm the onchain withdrawal.

> **Demo narration (from the project doc):** *"Voxel is a Celo-based multi-token card game. Deposit USDm, USDC, USDT, or CELO, choose Beginner / Medium / Hard, and find the winning card. Higher difficulty means a higher fee but a bigger prize. Win and the prize is added to your balance; lose and only the fee is deducted. Withdraw anytime."*

---

## Architecture

```
                       ┌─────────────────────────────────────┐
                       │            MiniPay wallet            │
                       │   (Opera, self-custodial, mobile)    │
                       └───────────────────┬─────────────────┘
                                           │ injected provider
                                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  frontend-voxel/   Next.js 16 (App Router) · React 19 · Tailwind v4    │
│                                                                        │
│   Pages: Landing · Dashboard · Play · Leaderboard                      │
│   wagmi + viem  ──── read balances / send tx ────┐                     │
│   Framer Motion (card shuffle/flip)              │                     │
└──────────────────────────────────────────────────┼─────────────────────┘
                                                    │ JSON-RPC
                                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  sc-voxel/   Foundry · Solidity · OpenZeppelin                          │
│                                                                        │
│   VoxelGame.sol                                                        │
│     • depositERC20 / depositCELO / withdraw                            │
│     • playRound (fee → outcome → prize)                                │
│     • per-token deposit balances · player stats · rounds              │
│     • admin: setToken / setLevel / fundPrizePool*                      │
│     • events: Deposited / Withdrawn / RoundPlayed / ...                │
└───────────────────────────────────────────────────┬────────────────────┘
                                                     ▼
                                  Celo  (Sepolia for dev · Mainnet for eligibility)
```

The repository is a **two-package layout**:

- **`frontend-voxel/`** — the MiniApp (Next.js).
- **`sc-voxel/`** — the smart contracts (Foundry).

---

## Smart contract design

**Contract:** `sc-voxel/src/VoxelGame.sol` (🚧 in development; the repo currently ships the Foundry `Counter` scaffold to be replaced).

### Responsibilities

1. Accept ERC-20 deposits (USDm, USDC, USDT) and native CELO deposits.
2. Track per-user, per-token deposit balances.
3. Allow withdrawals per token.
4. Play a round with a selected token and level: validate, deduct fee, determine outcome, credit prize on win.
5. Track player stats and round history.
6. Let the owner configure level economics and supported tokens.
7. Emit events for the frontend and leaderboard.

### Core types

```solidity
struct TokenConfig {
    bool    supported;
    bool    isNative;
    address tokenAddress;
    string  symbol;
}

struct LevelConfig {
    uint8   cardCount;
    uint256 playFee;
    uint256 prize;
    bool    enabled;
}

struct PlayerStats {
    uint256 totalPlayed;
    uint256 totalWins;
    uint256 totalLosses;
    uint256 totalVolume;
    uint256 totalPrizeWon;
}

struct Round {
    address player;
    bytes32 tokenId;
    uint8   level;
    uint8   cardCount;
    uint8   playerPick;
    uint8   winningCard;
    uint256 fee;
    uint256 prize;
    bool    won;
    uint256 timestamp;
}
```

### Token & level identifiers

```solidity
bytes32 public constant TOKEN_USDM = keccak256("USDm");
bytes32 public constant TOKEN_USDC = keccak256("USDC");
bytes32 public constant TOKEN_USDT = keccak256("USDT");
bytes32 public constant TOKEN_CELO = keccak256("CELO");

uint8 public constant LEVEL_BEGINNER = 1;
uint8 public constant LEVEL_MEDIUM   = 2;
uint8 public constant LEVEL_HARD     = 3;
```

### Functions

| Function | Purpose |
|---|---|
| `depositERC20(bytes32 tokenId, uint256 amount)` | Deposit a supported ERC-20 token (after `approve`). |
| `depositCELO() payable` | Deposit native CELO. |
| `withdraw(bytes32 tokenId, uint256 amount)` | Withdraw an ERC-20 or native CELO from your deposit balance. |
| `playRound(bytes32 tokenId, uint8 level, uint8 playerPick) returns (uint256 roundId)` | Validate, deduct fee, determine the winning card, credit prize on win, record stats. |
| `getDepositBalance(address user, bytes32 tokenId) view returns (uint256)` | Read a user's deposit balance for a token. |
| `getPlayerStats(address user) view returns (PlayerStats)` | Read a user's stats. |
| `setToken(...) onlyOwner` | Add / update / disable a supported token. |
| `setLevel(...) onlyOwner` | Configure card count, fee, prize, and enabled flag per level. |
| `fundPrizePoolERC20(bytes32 tokenId, uint256 amount)` | Seed the ERC-20 prize liquidity. |
| `fundPrizePoolCELO() payable` | Seed the native CELO prize liquidity. |

### Events

`Deposited`, `Withdrawn`, `RoundPlayed`, `LevelUpdated`, `TokenUpdated` — indexed for efficient frontend and leaderboard queries.

### Invariants enforced

- A user cannot withdraw more than their deposit balance.
- A user cannot play if their deposit balance is below the level's play fee.
- A prize is paid **only** if contract liquidity for that token is sufficient (prize-pool check) — the game cannot pay out into insolvency.

---

## Frontend design

**Package:** `frontend-voxel/` (Next.js 16 App Router, React 19, Tailwind v4).

### Pages

| Page | Route | Contents |
|---|---|---|
| Landing | `/` | Title, tagline, Connect Wallet, Start Playing, View Levels. |
| Dashboard | `/dashboard` | Wallet address, wallet balances, deposit balances, player stats, deposit/withdraw/play actions. |
| Play | `/play` | Game lobby (token + level), game screen (cards, shuffle, pick, reveal), result modal. |
| Leaderboard | `/leaderboard` | Rank, wallet, plays, wins, win rate, total prize won (mock first → events later). |

### Components

`ConnectWalletButton`, `TokenBalanceCard`, `DepositCard`, `WithdrawCard`, `GameLevelCard`, `GameLobby`, `CardTable`, `PlayingCard`, `ResultModal`, `PlayerStatsCard`, `LeaderboardTable`, `TokenSelector`.

### Visual theme

Dark, rounded, mobile-first, **arcade / game-show** vibe (not a finance dashboard), with a neon-green Celo accent and smooth card flip/shuffle animations.

| Token | Hex |
|---|---|
| Background | `#090E0B` |
| Surface | `#121A16` |
| Card surface | `#18231D` |
| Primary green | `#35D07F` |
| Celo yellow | `#FCFF52` |
| Blue accent | `#2775CA` |
| Text | `#F8FAFC` |
| Muted text | `#94A3B8` |
| Danger | `#EF4444` |
| Success | `#22C55E` |

---

## Tech stack

| Layer | Choice |
|---|---|
| Wallet / host | **MiniPay** (Opera self-custodial wallet) |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 🗺️ |
| Web3 client | wagmi + viem (MiniPay-compatible injected connector) 🚧 |
| Contracts | Solidity + **Foundry** (`forge`) |
| Libraries | OpenZeppelin (`SafeERC20`, `Ownable`, `ReentrancyGuard`) |
| Network | Celo — **Sepolia** for dev/QA, **Mainnet** for eligibility |
| Verification | Celoscan |

> **Note on tooling:** the project doc originally referenced Hardhat; the committed contract package (`sc-voxel/`) uses **Foundry**, so all contract commands in this README are Foundry commands. The Celo [`celo-composer`](https://github.com/celo-org/celo-composer) starter kit is a useful reference for MiniPay + Hardhat if you prefer that path.

---

## Security model

Voxel is an **unaudited MVP for a builder program**. The design follows standard safeguards, but it is **not** production-hardened.

**Implemented by design (🚧 as `VoxelGame.sol` is built):**

- **`SafeERC20`** for all ERC-20 transfers (handles non-standard tokens).
- **`ReentrancyGuard`** on state-changing, fund-moving functions.
- **Checks-Effects-Interactions** ordering: balances are updated before external transfers.
- **Access control** via `Ownable` for token/level configuration.
- **Liquidity check** before paying any prize (no insolvent payouts).
- **Per-token decimals handled per token** — Voxel does **not** assume all tokens share 18 decimals (USDC/USDT are commonly 6). Decimals are configured per token; fee/prize values are set in the token's units.

**Known risks / limitations (explicitly disclosed):**

- ❌ **Not audited.** No third-party security audit has been performed.
- ⚠️ **Custodial contract.** The contract holds user deposits and the prize pool; mitigated by withdraw-anytime, but custody risk exists.
- ⚠️ **Admin powers.** The owner can configure tokens and level economics — centralization/admin-key risk. Production should use a multisig/timelock.
- ⚠️ **Pseudo-random outcomes.** See [Randomness disclaimer](#randomness-disclaimer).

**Operational security (per Proof of Ship guidance):**

- **Never use a personal wallet for development or deployment.** Always use a dedicated, separate wallet, and keep `PRIVATE_KEY` out of version control.

We deliberately avoid claims like *"fully secure"*, *"audited"*, *"guaranteed fair"*, or *"risk-free"*.

---

## Randomness disclaimer

For the MVP, the winning card is derived from on-chain pseudo-randomness:

```solidity
// WARNING: NOT secure for production. Replace before mainnet deployment with
// real funds — e.g. a VRF provider or a commit-reveal scheme.
winningCard = uint8(
    uint256(keccak256(abi.encodePacked(
        block.timestamp, block.prevrandao, msg.sender, nextRoundId
    ))) % cardCount
);
```

This is **predictable / manipulable by miners/validators and sophisticated callers** and is suitable **only for a testnet demo**. Any deployment that pays out value of consequence **must** replace it with **verifiable randomness (VRF)** or a **commit-reveal** protocol. This is tracked in the [Roadmap](#roadmap).

---

## Compliance disclaimer

**Voxel is an experimental, testnet game built for the Celo Proof of Ship builder program. It is not a financial product, not a real-money gambling service, and not investment or yield-bearing software.**

- The deposit / play-fee / prize mechanics are **in-game mechanics** intended for **testnet tokens** during the program.
- A game that takes a fee and pays a variable prize based on chance may be classified as **gambling, betting, or a lottery** in many jurisdictions. **Deploying Voxel with real funds, on mainnet, with prize payouts, may require legal and regulatory review**, and potentially licensing, KYC/AML, geofencing, age verification, and responsible-gaming controls — depending on jurisdiction.
- Voxel does **not** provide such controls in its MVP form.
- Nothing here is legal advice. Operators are solely responsible for compliance in their jurisdiction before any real-money or mainnet-with-value deployment.

> Positioning: within Proof of Ship, Voxel is presented as a **Game** (a wanted category) — explicitly **not** a DeFi-by-solo-builder product and **not** a reward-farming app (categories the program does not seek).

---

## Installation

**Prerequisites:** Node.js 20+, npm, [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`), git, and a dedicated (non-personal) wallet funded with Celo Sepolia test tokens.

```bash
# Clone
git clone <your-repo-url> Voxel
cd Voxel

# Frontend
cd frontend-voxel
npm install
cd ..

# Contracts (Foundry)
cd sc-voxel
forge install OpenZeppelin/openzeppelin-contracts   # add OZ (forge-std already vendored)
forge build
cd ..
```

> Add an OpenZeppelin remapping in `sc-voxel/remappings.txt` (or `foundry.toml`), e.g.
> `@openzeppelin/=lib/openzeppelin-contracts/`.

---

## Environment variables

The repo is split into two packages, so environment files are split too.

### Frontend — `frontend-voxel/.env.local`

```bash
# Wallet / connection
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
NEXT_PUBLIC_CHAIN_ID=11142220            # Celo Sepolia (dev). Celo Mainnet = 42220

# Contract
NEXT_PUBLIC_VOXEL_CONTRACT_ADDRESS=

# Token addresses (do NOT hardcode in source)
NEXT_PUBLIC_USDM_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_USDT_ADDRESS=
NEXT_PUBLIC_CELO_NATIVE=true
```

### Contracts — `sc-voxel/.env`

```bash
# Deployment (use a DEDICATED wallet, never a personal one)
PRIVATE_KEY=

# RPC endpoints
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_RPC_URL=https://forno.celo.org

# Verification
CELOSCAN_API_KEY=
```

> ⚠️ Add both env files to `.gitignore`. Never commit a private key.

---

## Smart contract deployment

> Status: 🗺️ `VoxelGame.sol` and its deploy script (`sc-voxel/script/VoxelGame.s.sol`) are part of the build-out; commands below reflect the intended Foundry workflow.

```bash
cd sc-voxel

# Build & test
forge build
forge test

# Deploy to Celo Sepolia (dev/QA)
forge script script/VoxelGame.s.sol:VoxelGameScript \
  --rpc-url "$CELO_SEPOLIA_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

# Deploy to Celo Mainnet (eligibility) + verify on Celoscan
forge script script/VoxelGame.s.sol:VoxelGameScript \
  --rpc-url "$CELO_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --verify \
  --etherscan-api-key "$CELOSCAN_API_KEY"
```

**Post-deploy (owner):**

1. `setToken(...)` for each supported token (USDm, USDC, USDT, CELO).
2. `setLevel(...)` for Beginner / Medium / Hard.
3. `fundPrizePoolERC20` / `fundPrizePoolCELO` to seed prize liquidity.
4. Copy the deployed address into `frontend-voxel/.env.local`.

---

## Frontend development

```bash
cd frontend-voxel
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
```

For MiniPay testing, expose the dev server (e.g. via a tunnel) and open it inside the MiniPay in-wallet browser, or use a standard browser wallet on **Celo Sepolia** for local iteration.

---

## Testing checklist

Use this as the QA pass before submission.

**Contract (Foundry):**

- [ ] Deposit ERC-20 (USDm/USDC/USDT) increases deposit balance by the exact amount.
- [ ] Deposit CELO via payable increases native deposit balance.
- [ ] Withdraw fails when amount > deposit balance.
- [ ] `playRound` reverts when deposit balance < play fee.
- [ ] On win, prize is credited and stats update (`totalWins`, `totalPrizeWon`).
- [ ] On loss, only the fee is deducted and stats update (`totalLosses`).
- [ ] Prize payout reverts when prize-pool liquidity is insufficient.
- [ ] Only owner can call `setToken` / `setLevel`.
- [ ] Reentrancy attempt on withdraw/play is blocked.
- [ ] Token decimals handled correctly for 6- and 18-decimal tokens.
- [ ] Events emitted with correct args for `Deposited`/`Withdrawn`/`RoundPlayed`.

**Frontend:**

- [ ] Wallet connects inside MiniPay and reads balances.
- [ ] ERC-20 deposit requires `approve` then `deposit`; CELO is single-step.
- [ ] Lobby shows card count, fee, prize, and current deposit balance.
- [ ] Game screen renders the correct card count per level (3 / 5 / 7).
- [ ] Result modal matches the onchain outcome.
- [ ] Withdraw returns funds and updates UI.
- [ ] Mobile layout is usable at common phone widths.

---

## Repository structure

```
Voxel/
├── README.md                  # this file
├── Docs_Hackaton.md           # Proof of Ship program brief (source of truth for criteria)
├── garisbesarproject.md       # full Voxel product & contract design doc
│
├── frontend-voxel/            # MiniApp — Next.js 16 + React 19 + Tailwind v4
│   ├── app/                   # App Router pages
│   │   ├── layout.tsx
│   │   └── page.tsx           # (scaffold → Landing)
│   ├── public/
│   ├── package.json
│   └── ...                    # planned: components/, hooks/, lib/, dashboard/, play/, leaderboard/
│
└── sc-voxel/                  # Contracts — Foundry
    ├── foundry.toml
    ├── src/                   # VoxelGame.sol (in development; Counter.sol scaffold present)
    ├── script/                # VoxelGame.s.sol (deploy)
    ├── test/                  # VoxelGame.t.sol (planned)
    └── lib/forge-std/
```

> The single-folder Hardhat layout in `garisbesarproject.md` was the early plan; the **actual** repository uses the two-package (Foundry + Next.js) layout shown above.

---

## Roadmap

**MVP (Proof of Ship submission)**

- 🚧 Implement `VoxelGame.sol` (deposits, withdraw, `playRound`, stats, admin, events).
- 🚧 Foundry tests covering the [testing checklist](#testing-checklist).
- 🚧 MiniPay wallet connection + deposit/withdraw/lobby/game/result UI.
- 🗺️ Deploy + verify on **Celo Mainnet**; seed prize pool; generate real onchain activity.

**Post-MVP / production-readiness**

- 🗺️ Replace pseudo-randomness with **VRF or commit-reveal**.
- 🗺️ Leaderboard from contract events (indexer/subgraph).
- 🗺️ Owner controls behind a **multisig + timelock**.
- 🗺️ Independent **security audit**.
- 🗺️ Legal/compliance review before any real-money operation.
- 🗺️ Responsible-gaming controls (limits, cooldowns, age/geo gating) if pursued beyond a game demo.

---

## Team

- **Project Leader:** Ezra Kristanto Nahumury
- **Builder profile / Proof of Humanity:** via [Talent App](https://talent.app/) (Self human checkmark) — required for Proof of Ship eligibility.

*Building in public — progress shared via the Proof of Ship [Telegram group](https://t.me/proofofship).*

---

## License

[MIT](LICENSE) — open source, as required by Proof of Ship.

---

## Hackathon submission checklist

Tracking the **Proof of Ship — Celo Builder Program** eligibility requirements:

- [ ] Smart contract **deployed on Celo Mainnet** and **verified** on Celoscan.
- [ ] Project is a **MiniApp built with the MiniPay hook**.
- [ ] Repository is **open source** with an active public GitHub repo.
- [ ] **Onchain activity** present (real deposit / play / withdraw transactions).
- [ ] Every builder has **Proof of Humanity** (Self human checkmark / Talent App credential).
- [ ] Builder profile created on [Talent App](https://talent.app/~/earn/celo-proof-of-ship).
- [ ] Project page created on Talent App with contributors, GitHub repo, and ≥1 Celo smart contract.
- [ ] Project registered on the **Proof of Ship** campaign page.
- [ ] Rewards claim wallet (MiniPay) ready for the Project Leader.
- [ ] Built in public (progress shared on Telegram / socials).
- [ ] A dedicated (non-personal) wallet used throughout development and deployment.

---

<sub>Voxel is an experimental testnet game built for the Celo Proof of Ship builder program. Not audited. Not a real-money gambling product. See the [Compliance disclaimer](#compliance-disclaimer) and [Randomness disclaimer](#randomness-disclaimer).</sub>
