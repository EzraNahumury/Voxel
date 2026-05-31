# Voxel

> **Deposit. Pick your level. Find the card. Win the prize.**

**Voxel — a Celo card-guessing game powered by an on-chain VOXEL credit system, built as a MiniApp for MiniPay.**

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
7. [Deposit asset & VOXEL credits](#deposit-asset--voxel-credits)
8. [Economy & gas model](#economy--gas-model)
9. [Game levels](#game-levels)
10. [User flow](#user-flow)
11. [Demo flow](#demo-flow)
12. [Architecture](#architecture)
13. [Smart contract design](#smart-contract-design)
14. [Frontend design](#frontend-design)
15. [Tech stack](#tech-stack)
16. [Security model](#security-model)
17. [Randomness disclaimer](#randomness-disclaimer)
18. [Compliance disclaimer](#compliance-disclaimer)
19. [Installation](#installation)
20. [Environment variables](#environment-variables)
21. [Smart contract deployment](#smart-contract-deployment)
22. [Frontend development](#frontend-development)
23. [Testing checklist](#testing-checklist)
24. [Repository structure](#repository-structure)
25. [Roadmap](#roadmap)
26. [Team](#team)
27. [License](#license)
28. [Hackathon submission checklist](#hackathon-submission-checklist)

---

## One-liner

Voxel is a mobile-first **card-guessing game** on Celo: **deposit CELO once**, receive in-game **VOXEL credits**, then play many fast on-chain rounds — paying a small credit fee each round and earning more credits when you find the winning card.

---

## Problem

Most onchain "games" on mobile wallets are either heavy DeFi dashboards or one-off click-to-earn loops. They are slow to understand, hard to play on a phone, and rarely give a casual user a reason to make *repeated* real onchain transactions.

MiniPay reaches **14M+ self-custodial users** who already hold stablecoins and CELO, but there is a shortage of **simple, fun, mobile-native experiences** that:

- onboard a user into a real onchain action in seconds,
- work natively inside the MiniPay wallet,
- and generate **sustained onchain activity** (many transactions per user) rather than a single tap.

---

## Solution

Voxel converts **one deposit into many rounds** using an internal credit system:

1. **Deposit CELO** → receive **VOXEL credits** (default rate: `1 CELO = 1000 VOXEL`).
2. **Pick a level**: Beginner (3 cards), Medium (5), or Hard (7).
3. **Play on-chain** → each round pays a fee **in VOXEL credits**; find the winning card to earn a bigger VOXEL reward.
4. **Withdraw** remaining value: redeem VOXEL credits back to CELO at the fixed rate (subject to contract liquidity).

Because the play fee is denominated in **internal credits**, a single deposit funds **many rounds** — e.g. **~100 Beginner rounds from 1 CELO** — and each round is a real `playRound()` transaction on Celo. This directly produces the **onchain activity** Proof of Ship asks for, while keeping the experience cheap and casual.

Voxel sits in the program's **Games** category. It is **not** a DeFi yield product, **not** a reward-farming app, and **not** a real-money gambling service. See the [Compliance disclaimer](#compliance-disclaimer).

---

## Why Voxel fits Proof of Ship

Targeting the **Proof of Ship — Celo Builder Program (Season 2, April–July 2026)**: *ship real products as MiniApps for MiniPay.*

| Program signal (from `Docs_Hackaton.md`) | How Voxel responds |
|---|---|
| Wanted category: **Games** | A casual luck-based card game — not a DeFi/finance app. |
| **MiniApp built with the MiniPay hook** | Built as a MiniApp; detects `window.ethereum.isMiniPay`, auto-connects the injected wallet, and hides the Connect Wallet button inside MiniPay. 🚧 |
| **Onchain activity** required | **Each round is an onchain `playRound()` tx.** One CELO deposit ≈ 100 Beginner rounds ≈ ~100 transactions. High, sustained activity per user. |
| **Deploy on Celo Mainnet, verified contract** | `VoxelGame.sol` targets Celo Mainnet with source verification on Celoscan. 🗺️ |
| **Open source, public GitHub** | This repository is public and MIT-licensed. |
| **"Simpler is better"** | Single deposit asset (CELO), single internal currency (VOXEL), one loop. |
| **Mobile-first** | Dark, rounded, thumb-friendly UI for the MiniPay in-wallet browser. |

> Avoided on purpose: the program explicitly does **not** seek *DeFi apps by solo builders*, *reward-farming apps*, or non-functional *demos / bot engagement*. Voxel is framed and built as a **functional game**, with deposits/fees/rewards as **in-game mechanics on testnet**, not a financial or farming product.

### Effect on the Proof of Ship onchain metrics

Builder activity is tracked on [Talent App](https://talent.app/) (Transactions, DAU, Gas Fees). The VOXEL credit model is designed to lift these **honestly**:

| Metric | Effect of the credit model | Why |
|---|---|---|
| **Transactions** | ↑ | Each `playRound()` is **one onchain transaction**. `1 CELO = 1000 VOXEL` and a Beginner round costs `10 VOXEL`, so one funded session is ~100 rounds ≈ ~100 transactions. A low per-round fee removes friction so real players play many rounds. |
| **Gas Fees** | ↑ (proportional) | Every round still pays **CELO gas** (kept low because `playRound()` only updates internal balances — but never zero). More rounds → more total gas. |
| **DAU** | — (not by itself) | Daily Active Users counts **distinct wallets**. One person replaying 1,000 rounds is still **1 DAU**. DAU grows only with real onboarding, not replays. |

> **Integrity note — this is not transaction farming.** The credit model does **not invent** transactions; it makes each round cheap enough that *genuine* users play many. Inflating the Transactions count by self-playing or scripting rounds from one wallet is exactly the **"bot engagement / reward farming"** pattern the program rejects (`Docs_Hackaton.md`). The real, defensible signal is **real users × several rounds each** — which lifts Transactions *and* DAU together.

---

## Project status

| Area | Component | Status |
|---|---|---|
| Repo | Two-package layout (`frontend-voxel/`, `sc-voxel/`) committed | ✅ |
| Repo | Technical design (credit economy, structs, functions, events) specified | ✅ |
| Frontend | Next.js 16 + React 19 + Tailwind v4 scaffold | ✅ |
| Frontend | MiniPay integration — detect `window.ethereum.isMiniPay`, auto-connect, hide Connect button | 🚧 |
| Frontend | Dashboard, CELO deposit, VOXEL balance, game lobby, game screen, result modal | 🚧 |
| Frontend | Framer Motion shuffle/flip animations | 🗺️ |
| Frontend | Leaderboard from contract events | 🗺️ |
| Contracts | Foundry project scaffold (`forge` + `forge-std`) | ✅ |
| Contracts | `VoxelGame.sol` (CELO deposit → credits, play, withdraw, stats, admin) | 🚧 |
| Contracts | OpenZeppelin `Ownable` / `ReentrancyGuard` integration | 🚧 |
| Contracts | Foundry unit tests | 🗺️ |
| Deploy | Celo Sepolia (dev/QA) deployment | 🗺️ |
| Deploy | **Celo Mainnet** deployment + Celoscan verification (eligibility) | 🗺️ |
| Security | Secure randomness (VRF / commit-reveal) | 🗺️ |
| Security | External audit | 🗺️ (out of MVP scope) |
| Roadmap | Multi-token deposits (USDm/USDC/USDT → VOXEL) | 🗺️ |

---

## Key features

- 🚧 **CELO deposit → VOXEL credits** — deposit native CELO once and receive in-game credits at a configurable rate (default `1 CELO = 1000 VOXEL`).
- 🚧 **Internal credit ledger** — VOXEL is an **internal accounting balance**, not a transferable ERC-20 token. `playRound()` only mutates internal numbers, keeping gas low.
- 🚧 **Many rounds per deposit** — one deposit funds ~100 Beginner rounds → high, sustained onchain transaction count.
- 🚧 **Three difficulty levels** — Beginner (3 cards), Medium (5), Hard (7), with configurable credit fee and credit reward per level.
- 🚧 **Card-guessing round** — one winning card per round; find it to earn the level's VOXEL reward.
- 🚧 **Redeem / withdraw** — convert remaining VOXEL credits back to CELO at the fixed rate, subject to contract liquidity.
- 🚧 **Player stats** — total played, wins, losses, win rate, total credits won.
- 🚧 **Owner/admin configuration** — conversion rate and per-level economics are configurable onchain.
- 🚧 **Events for indexing** — `Deposited`, `Withdrawn`, `RoundPlayed`, `LevelUpdated`, `ConversionRateUpdated` for a frontend/leaderboard to consume.
- 🗺️ **Leaderboard** — rank, wallet, plays, wins, win rate, total credits won (from contract events).
- 🗺️ **Multi-token deposits** — accept USDm/USDC/USDT and convert to VOXEL credits (future).

---

## Deposit asset & VOXEL credits

| Concept | Detail |
|---|---|
| **Deposit asset** | **CELO** (native), via a `payable` deposit. |
| **Game currency** | **VOXEL credits** — an internal balance tracked per player in the contract. |
| **Conversion rate** | Default **`1 CELO = 1000 VOXEL`**, owner-configurable (`setConversionRate`). |
| **Redeemable?** | Yes — VOXEL → CELO at the same fixed rate on withdrawal, **subject to contract liquidity** ("if allowed"). |

> **What VOXEL is — and is not.** VOXEL credits are **internal game accounting**, not an ERC-20 token. They are **not transferable** between users, **not listed**, and have **no existence outside the Voxel contract**. They exist only to denominate play fees and rewards cheaply, and are redeemable for the deposited CELO at the configured rate while the prize pool remains solvent. This keeps Voxel a **game**, not a token project.

---

## Economy & gas model

### Credit economy (example, configurable)

| Action | Cost / Reward |
|---|---|
| Deposit 1 CELO | **+1000 VOXEL** |
| Beginner — play fee | −10 VOXEL |
| Beginner — win reward | +25 VOXEL |
| Medium — play fee | −25 VOXEL |
| Medium — win reward | +100 VOXEL |
| Hard — play fee | −50 VOXEL |
| Hard — win reward | +300 VOXEL |

**One deposit, many rounds:** `1 CELO = 1000 VOXEL`, and a Beginner round costs `10 VOXEL`, so a single deposit funds **~100 Beginner rounds** — great for transaction count and onchain activity.

> On each round the fee is deducted; on a win the reward is added. Net win (Beginner) = `+25 − 10 = +15 VOXEL`; net loss = `−10 VOXEL`. Level economics are configured so the prize pool stays sustainable on average (see [Security model](#security-model)).

### Two separate costs — game fee ≠ gas

There are **two distinct costs** in Voxel, and they are not the same thing:

| Cost | Paid in | Goes to | Notes |
|---|---|---|---|
| **Game fee** | VOXEL credits (internal) | The Voxel prize pool | Just an internal ledger update. |
| **Network gas fee** | CELO (or a Celo-supported fee token) | Celo validators / the network | Required for every transaction. |

**Important:** the VOXEL game fee **does not replace gas**. Every `playRound()` is still a blockchain transaction and still costs network gas, paid in CELO. Because `playRound()` only updates internal balances (no token transfers in the hot path), its **gas cost is kept low** — but it is never zero.

---

## Game levels

| Level | Cards | Win chance | Play fee (VOXEL) | Win reward (VOXEL) |
|---|---:|---:|---:|---:|
| **Beginner** | 3 | 33.33% | 10 | 25 |
| **Medium** | 5 | 20.00% | 25 | 100 |
| **Hard** | 7 | 14.28% | 50 | 300 |

> Fees and rewards are denominated in **VOXEL credits** and are **configurable onchain** by the owner per level (`setLevel`).

---

## User flow

```
Connect wallet
   ↓
Deposit CELO
   ↓
Receive VOXEL game credits        (1 CELO = 1000 VOXEL)
   ↓
Choose level                      (Beginner / Medium / Hard)
   ↓
Play on-chain                     (playRound tx)
   ↓
Pay fee in VOXEL credits          (+ network gas in CELO)
   ↓
Win → more VOXEL credits  /  Lose → only fee deducted
   ↓
Play again  /  Withdraw remaining value (VOXEL → CELO, if liquidity allows)
```

1. **Connect wallet** — the app reads your CELO wallet balance and your in-contract VOXEL credit balance.
2. **Deposit CELO** — send native CELO; the contract credits your VOXEL balance at the current rate.
3. **Choose a level** — the lobby shows card count, play fee (VOXEL), possible reward (VOXEL), and your credit balance.
4. **Play** — cards are shown face-down and shuffled; you pick one; the round is submitted onchain (gas in CELO); the winning card is revealed.
5. **Result** — a win credits the reward; a loss deducts only the fee. The result is recorded in your stats.
6. **Withdraw** — redeem remaining VOXEL credits back to CELO at the fixed rate, subject to contract liquidity.

---

## Demo flow

A ~60-second judge/demo walkthrough:

1. Open Voxel inside MiniPay (or a browser wallet on Celo Sepolia for local testing).
2. Connect wallet → CELO balance and VOXEL credits load.
3. Deposit a small amount of CELO (e.g. 0.1 CELO → 100 VOXEL) → confirm the onchain deposit transaction.
4. Open the lobby → select **Medium (5 cards)** → review fee `25 VOXEL` and reward `100 VOXEL`.
5. Start the round → watch the shuffle → pick a card → submit the play transaction (gas in CELO).
6. See the **Win/Lose** modal and the updated VOXEL balance.
7. Play several quick rounds to show sustained onchain activity, then withdraw remaining credits back to CELO.

> **Demo narration:** *"Voxel is a Celo card game. Deposit CELO once and get VOXEL credits — 1 CELO is 1000 VOXEL. Pick Beginner, Medium, or Hard, then find the winning card. Each round costs a few VOXEL, so one deposit plays ~100 rounds. Win and your credits grow; withdraw back to CELO anytime liquidity allows."*

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
│   wagmi + viem  ──── read CELO + VOXEL / send tx ────┐                 │
│   Framer Motion (card shuffle/flip)                  │                 │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                        │ JSON-RPC
                                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  sc-voxel/   Foundry · Solidity · OpenZeppelin                          │
│                                                                        │
│   VoxelGame.sol                                                        │
│     • depositCELO  (CELO → VOXEL credits)                              │
│     • playRound    (fee in VOXEL → outcome → reward in VOXEL)          │
│     • withdraw     (VOXEL → CELO, liquidity-checked)                   │
│     • per-user credit balance · player stats · rounds                 │
│     • admin: setLevel / setConversionRate / fundPrizePoolCELO          │
│     • events: Deposited / Withdrawn / RoundPlayed / ...               │
└───────────────────────────────────────────────────┬────────────────────┘
                                                     ▼
                                  Celo  (Sepolia for dev · Mainnet for eligibility)
```

The repository is a **two-package layout**: **`frontend-voxel/`** (the MiniApp) and **`sc-voxel/`** (the contracts).

---

## Smart contract design

**Contract:** `sc-voxel/src/VoxelGame.sol` (🚧 in development; the repo currently ships the Foundry `Counter` scaffold to be replaced).

### Responsibilities

1. Accept native **CELO deposits** and credit VOXEL at the conversion rate.
2. Track per-user **VOXEL credit balances**.
3. Play a round at a selected level: validate, deduct the credit fee, determine the outcome, credit the reward on a win.
4. Allow **withdrawal** by redeeming VOXEL → CELO at the fixed rate, bounded by contract liquidity.
5. Track player stats and round history.
6. Let the owner configure the conversion rate and per-level economics.
7. Emit events for the frontend and leaderboard.

### Core types

```solidity
struct LevelConfig {
    uint8   cardCount;   // 3 / 5 / 7
    uint256 fee;         // play fee in VOXEL credits
    uint256 reward;      // win reward in VOXEL credits
    bool    enabled;
}

struct PlayerStats {
    uint256 totalPlayed;
    uint256 totalWins;
    uint256 totalLosses;
    uint256 totalFeesPaid;     // in VOXEL
    uint256 totalRewardWon;    // in VOXEL
}

struct Round {
    address player;
    uint8   level;
    uint8   cardCount;
    uint8   playerPick;
    uint8   winningCard;
    uint256 fee;         // VOXEL
    uint256 reward;      // VOXEL
    bool    won;
    uint256 timestamp;
}
```

### State & constants

```solidity
mapping(address => uint256)      public creditBalance;   // VOXEL credits per user
mapping(uint8 => LevelConfig)    public levels;
mapping(address => PlayerStats)  public playerStats;
mapping(uint256 => Round)        public rounds;

uint256 public voxelPerCelo = 1000; // 1 CELO -> 1000 VOXEL (owner-configurable)
uint256 public nextRoundId;
address public owner;

uint8 public constant LEVEL_BEGINNER = 1;
uint8 public constant LEVEL_MEDIUM   = 2;
uint8 public constant LEVEL_HARD     = 3;
```

### Functions

| Function | Purpose |
|---|---|
| `depositCELO() payable` | Deposit native CELO; mint VOXEL credits = `msg.value * voxelPerCelo / 1e18`. |
| `playRound(uint8 level, uint8 playerPick) returns (uint256 roundId)` | Validate, deduct the credit fee, determine the winning card, add the reward on a win, record stats. |
| `withdraw(uint256 voxelAmount)` | Burn VOXEL credits and send `voxelAmount * 1e18 / voxelPerCelo` CELO, if contract liquidity allows. |
| `getCreditBalance(address user) view returns (uint256)` | Read a user's VOXEL credit balance. |
| `getPlayerStats(address user) view returns (PlayerStats)` | Read a user's stats. |
| `setLevel(uint8 level, uint8 cardCount, uint256 fee, uint256 reward, bool enabled) onlyOwner` | Configure level economics (in VOXEL). |
| `setConversionRate(uint256 newVoxelPerCelo) onlyOwner` | Update the CELO↔VOXEL rate. |
| `fundPrizePoolCELO() payable` | Seed CELO liquidity so winnings can be redeemed. |

### Events

```solidity
event Deposited(address indexed user, uint256 celoAmount, uint256 voxelCredited);
event Withdrawn(address indexed user, uint256 voxelBurned, uint256 celoAmount);
event RoundPlayed(
    uint256 indexed roundId,
    address indexed user,
    uint8   level,
    uint8   cardCount,
    uint8   playerPick,
    uint8   winningCard,
    bool    won,
    uint256 fee,
    uint256 reward
);
event LevelUpdated(uint8 indexed level, uint8 cardCount, uint256 fee, uint256 reward, bool enabled);
event ConversionRateUpdated(uint256 voxelPerCelo);
```

### Invariants enforced

- A user cannot play if their **VOXEL balance < the level fee**.
- A user cannot withdraw more VOXEL than they hold.
- A withdrawal (and any net winnings) is paid **only if contract CELO liquidity is sufficient** — the game cannot pay out into insolvency.
- The fee is always deducted; the reward is added **only** on a win (Checks-Effects-Interactions before the CELO transfer on withdrawal).

---

## Frontend design

**Package:** `frontend-voxel/` (Next.js 16 App Router, React 19, Tailwind v4).

### MiniPay integration

MiniPay injects an EIP-1193 provider flagged with **`window.ethereum.isMiniPay`**. Voxel treats the MiniPay integration as **"integrated" only when both** of the following are true in code:

1. **Detection** — the app checks `window.ethereum?.isMiniPay` to recognize it is running inside MiniPay.
2. **Auto-connect + hidden button** — when running inside MiniPay, the app **auto-connects** the injected wallet and **hides the Connect Wallet button** (MiniPay is already a connected, self-custodial wallet — no manual connect step).

```tsx
// hooks/useMiniPay.ts
"use client";
import { useEffect, useState } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect } = useConnect();

  useEffect(() => {
    // MiniPay injects window.ethereum with isMiniPay === true
    const inMiniPay =
      typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
    if (inMiniPay) {
      setIsMiniPay(true);
      connect({ connector: injected() }); // auto-connect; no Connect button needed
    }
  }, [connect]);

  return { isMiniPay };
}
```

```tsx
// components/ConnectWalletButton.tsx
const { isMiniPay } = useMiniPay();
if (isMiniPay) return null; // hide Connect Wallet button when opened from MiniPay
return <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>;
```

### Pages

| Page | Route | Contents |
|---|---|---|
| Landing | `/` | Title, tagline, Connect Wallet, Start Playing, View Levels. |
| Dashboard | `/dashboard` | Wallet address, CELO balance, **VOXEL credit balance**, player stats, deposit/withdraw/play actions. |
| Play | `/play` | Game lobby (level select), game screen (cards, shuffle, pick, reveal), result modal. |
| Leaderboard | `/leaderboard` | Rank, wallet, plays, wins, win rate, total credits won (mock first → events later). |

### Components

`ConnectWalletButton`, `CeloBalanceCard`, `VoxelCreditCard`, `DepositCard`, `WithdrawCard`, `GameLevelCard`, `GameLobby`, `CardTable`, `PlayingCard`, `ResultModal`, `PlayerStatsCard`, `LeaderboardTable`.

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
| Libraries | OpenZeppelin (`Ownable`, `ReentrancyGuard`; `SafeERC20` when multi-token lands) |
| Network | Celo — **Sepolia** for dev/QA, **Mainnet** for eligibility |
| Verification | Celoscan |

> **Note on tooling:** the project doc originally referenced Hardhat; the committed contract package (`sc-voxel/`) uses **Foundry**, so all contract commands in this README are Foundry commands. The Celo [`celo-composer`](https://github.com/celo-org/celo-composer) starter kit is a useful reference for MiniPay + Hardhat if you prefer that path.

---

## Security model

Voxel is an **unaudited MVP for a builder program**. The design follows standard safeguards, but it is **not** production-hardened.

**Implemented by design (🚧 as `VoxelGame.sol` is built):**

- **`ReentrancyGuard`** on fund-moving functions (`depositCELO`, `withdraw`).
- **Checks-Effects-Interactions** ordering: credit balances are updated before any CELO transfer, and native CELO is sent via a checked low-level `call`.
- **Access control** via `Ownable` for rate/level configuration.
- **Liquidity check** before any CELO payout — no insolvent withdrawals.
- **Sustainable economics** — per-level fee/reward are configured so the prize pool is not drained on average; the owner seeds liquidity via `fundPrizePoolCELO`.

**Known risks / limitations (explicitly disclosed):**

- ❌ **Not audited.** No third-party security audit has been performed.
- ⚠️ **Custodial contract.** It holds deposited CELO and the prize pool; mitigated by withdraw-anytime (liquidity permitting), but custody risk exists.
- ⚠️ **Admin powers.** The owner can change the conversion rate and level economics — centralization/admin-key risk. Production should use a multisig + timelock, and the rate should not be changeable in a way that retroactively harms existing balances.
- ⚠️ **Solvency dependence.** Net winnings are only redeemable while the CELO pool is funded ("withdraw if allowed").
- ⚠️ **Pseudo-random outcomes.** See [Randomness disclaimer](#randomness-disclaimer).

**Operational security (per Proof of Ship guidance):**

- **Never use a personal wallet for development or deployment.** Always use a dedicated, separate wallet, and keep `PRIVATE_KEY` out of version control.

We deliberately avoid claims like *"fully secure"*, *"audited"*, *"guaranteed fair"*, or *"risk-free"*.

---

## Randomness disclaimer

For the MVP, the winning card is derived from on-chain pseudo-randomness:

```solidity
// WARNING: NOT secure for production. Replace before mainnet deployment with
// real value at stake — e.g. a VRF provider or a commit-reveal scheme.
winningCard = uint8(
    uint256(keccak256(abi.encodePacked(
        block.timestamp, block.prevrandao, msg.sender, nextRoundId
    ))) % cardCount
);
```

This is **predictable / manipulable by validators and sophisticated callers** and is suitable **only for a testnet demo**. Any deployment that redeems credits for real value **must** replace it with **verifiable randomness (VRF)** or a **commit-reveal** protocol. Tracked in the [Roadmap](#roadmap).

---

## Compliance disclaimer

**Voxel is an experimental, testnet game built for the Celo Proof of Ship builder program. It is not a financial product, not a real-money gambling service, and not investment or yield-bearing software. VOXEL credits are internal game points, not a token, security, or currency.**

- The deposit / play-fee / reward mechanics are **in-game mechanics** intended for **testnet** during the program.
- A game that takes a fee and pays a variable reward based on chance — where credits are redeemable for CELO — may be classified as **gambling, betting, or a lottery** in many jurisdictions. **Deploying Voxel with real funds, on mainnet, with redeemable winnings, may require legal and regulatory review**, and potentially licensing, KYC/AML, geofencing, age verification, and responsible-gaming controls — depending on jurisdiction.
- Voxel does **not** provide such controls in its MVP form.
- Nothing here is legal advice. Operators are solely responsible for compliance in their jurisdiction before any real-money or mainnet-with-value deployment.

> Positioning: within Proof of Ship, Voxel is presented as a **Game** (a wanted category) — explicitly **not** a DeFi-by-solo-builder product and **not** a reward-farming app (categories the program does not seek).

---

## Installation

**Prerequisites:** Node.js 20+, npm, [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`), git, and a dedicated (non-personal) wallet funded with Celo Sepolia test CELO.

```bash
# Clone
git clone https://github.com/EzraNahumury/Voxel.git
cd Voxel

# Frontend
cd frontend-voxel
npm install
cd ..

# Contracts (Foundry)
cd sc-voxel
forge install OpenZeppelin/openzeppelin-contracts   # forge-std already vendored
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

# Economy (display only; source of truth is on-chain)
NEXT_PUBLIC_VOXEL_PER_CELO=1000
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

> ⚠️ Add both env files to `.gitignore`. Never commit a private key. Confirm the exact Celo Sepolia RPC host against the current Celo docs before deploying.

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

1. `setConversionRate(1000)` (or your chosen rate).
2. `setLevel(...)` for Beginner / Medium / Hard (fees and rewards in VOXEL).
3. `fundPrizePoolCELO{value: ...}()` to seed CELO so winnings can be redeemed.
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

- [ ] `depositCELO` credits VOXEL = `msg.value * voxelPerCelo / 1e18` (exact).
- [ ] `playRound` reverts when VOXEL balance < level fee.
- [ ] On win, the reward is credited and stats update (`totalWins`, `totalRewardWon`).
- [ ] On loss, only the fee is deducted and stats update (`totalLosses`, `totalFeesPaid`).
- [ ] `withdraw` burns VOXEL and sends the correct CELO amount.
- [ ] `withdraw` reverts when amount > VOXEL balance.
- [ ] `withdraw` / payout reverts when contract CELO liquidity is insufficient.
- [ ] Only owner can call `setLevel` / `setConversionRate`.
- [ ] Reentrancy attempt on `withdraw` is blocked.
- [ ] CELO is sent via a checked low-level `call` (success required).
- [ ] Events emitted with correct args for `Deposited` / `Withdrawn` / `RoundPlayed`.

**Frontend:**

- [ ] Inside MiniPay: `window.ethereum.isMiniPay` is detected, the wallet auto-connects, and the Connect Wallet button is hidden.
- [ ] Wallet connects inside MiniPay and reads CELO + VOXEL balances.
- [ ] CELO deposit shows the resulting VOXEL credit (rate applied).
- [ ] Lobby shows card count, VOXEL fee, VOXEL reward, and current credit balance.
- [ ] Game screen renders the correct card count per level (3 / 5 / 7).
- [ ] Result modal matches the onchain outcome and updates the VOXEL balance.
- [ ] Withdraw redeems VOXEL → CELO and updates UI.
- [ ] UI makes clear that gas (CELO) is separate from the VOXEL game fee.
- [ ] Mobile layout is usable at common phone widths.

---

## Repository structure

```
Voxel/
├── README.md                  # this file
├── Docs_Hackaton.md           # Proof of Ship program brief (source of truth for criteria)
├── garisbesarproject.md       # original Voxel product & contract design doc
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

> The single-folder, multi-token Hardhat layout in `garisbesarproject.md` was the early plan; the **current** design is a CELO→VOXEL credit game in a two-package (Foundry + Next.js) repository.

---

## Roadmap

**MVP (Proof of Ship submission)**

- 🚧 Implement `VoxelGame.sol` (CELO deposit → VOXEL credits, `playRound`, `withdraw`, stats, admin, events).
- 🚧 Foundry tests covering the [testing checklist](#testing-checklist).
- 🚧 MiniPay wallet connection + deposit/credit/lobby/game/result UI.
- 🗺️ Deploy + verify on **Celo Mainnet**; seed the CELO pool; generate real onchain activity.

**Post-MVP / production-readiness**

- 🗺️ **Multi-token deposits** — accept USDm/USDC/USDT and convert to VOXEL credits.
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
- [ ] Project is a **MiniApp built with the MiniPay hook** — code detects `window.ethereum.isMiniPay` and hides the Connect Wallet button when opened from MiniPay.
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

<sub>Voxel is an experimental testnet game built for the Celo Proof of Ship builder program. VOXEL credits are internal game points, not a token. Not audited. Not a real-money gambling product. See the [Compliance disclaimer](#compliance-disclaimer) and [Randomness disclaimer](#randomness-disclaimer).</sub>
