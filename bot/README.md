# VOXEL spam-bot

Automated player fleet for **VoxelGame** on **Celo Mainnet** (`0x0298c67E83f7E21456fb0cEc68Bb62abf2720504`).
100 wallets each deposit CELO → VOXEL credits, then play beginner rounds **2×/day** via a GitHub Actions cron.

## Two spam modes

| mode | call | gas/tx | tx per 100 CELO | game-plays? |
|---|---|---|---|---|
| **deposit-spam** (default cron) | `depositCELO(0.001)` | ~0.0066 CELO | **~13,000** | no — tx volume + credits |
| play-spam | `playRound(1, pick)` | ~0.043 CELO | ~2,300 | yes — `totalPlayed`++ |

Deposit gas is **6.5× cheaper** (measured on-chain), so the cron defaults to **deposit-spam** for max cheap volume. The 0.001 CELO each deposit moves is **recoverable** via `withdraw`, so real cost = gas only. Run `node calc.js` for the live comparison. Switch to real plays by pointing the workflow at `node play.js`.

## How it works

1. `generate-wallets.js` — makes 100 EOAs → `wallets.json` (**secret**) + `wallets.public.json` (addresses).
2. `distribute.js` — funder wallet sends `FUND_PER_WALLET` CELO to each of the 100. _(local, one-time)_
3. **cron entry** — one of:
   - `spam-deposit.js` — each wallet does min-value `depositCELO` ×N. _(default, cheap)_
   - `play.js` — each wallet plays `playRound(1, randomPick)`. _(needs credits; run `deposit.js` once first)_
4. GitHub Actions (`.github/workflows/voxel-cron.yml`) runs it 4× a day (every 6h).

`status.js` = fleet snapshot + days-left. `calc.js` = play-vs-deposit economics at live gas.

## Economics (50 CELO budget, 100 wallets × 0.5 CELO, cron 4×/day = 4 tx/day/wallet)

Always run `node calc.js` — it pulls the **live** Celo gas price. At ~200 gwei:

| mode | gas/tx | tx per 50 CELO | runs (4/day/wallet) |
|---|---|---|---|
| deposit-spam | ~0.0066 CELO | ~6,600 | **~16 days** (400 tx/day fleet) |
| play-spam | ~0.043 CELO | ~1,200 | ~2 days |

Deposit-spam is gas-cheap; it drains native slowly and piles recoverable credits — `withdraw` them back when done. Cadence is set by the workflow `schedule:` (4 cron entries) — keep `CRON_RUNS_PER_DAY` in `.env`/config in sync so `calc.js`/`status.js` estimate correctly.

## Setup

Already done: `npm install`, `npm run generate` (100 wallets exist).

### 1. Fund the funder wallet
Put **~50.3 CELO** (50 to distribute + ~0.3 gas) into one wallet you control.

### 2. Configure `.env`
```bash
cp .env.example .env
```
Set `FUNDER_PRIVATE_KEY=0x...` (the funded wallet). Adjust `FUND_PER_WALLET` / `DEPOSIT_CELO` if desired.

### 3. Distribute (local, one-time)
```bash
npm run distribute   # funder -> 100 wallets, 0.5 CELO each (idempotent, re-runnable)
npm run status       # verify balances
```
For **deposit-spam** (default) nothing else is needed — the cron deposits as it spams.
For **play-spam**, also run `npm run deposit` once (seeds 0.2 CELO → 200 credits/wallet).

### 4. Wire up the cron on GitHub
- Push this repo (`wallets.json` and `.env` stay local — gitignored).
- Repo → **Settings → Secrets and variables → Actions → New repository secret**:
  - `VOXEL_WALLETS` = the **entire contents** of `bot/wallets.json`.
  - _(optional)_ `RPC_URL` = a dedicated Celo RPC if you don't want to rely on forno.
- The workflow auto-runs at 00:00 / 06:00 / 12:00 / 18:00 UTC (07:00 / 13:00 / 19:00 / 01:00 WIB). Trigger manually first via **Actions → voxel-spam-cron → Run workflow**.

## Operating

```bash
node calc.js     # days-until-broke at live gas
node status.js   # per-fleet balances, credits, rounds played, days left
```
Watch live runs under the repo **Actions** tab.

## Stop / recover funds
- **Pause**: disable the workflow (Actions → ··· → Disable) or delete the `schedule:` block.
- **Recover credits**: call `withdraw(voxelAmount)` per wallet (redeems credits → CELO, bounded by contract liquidity). Native CELO can be swept with a normal transfer. (No sweep script ships yet — ask if you want one.)

## ⚠️ Security

- `wallets.json` = **100 real private keys controlling mainnet CELO**. Gitignored. Never commit, never paste anywhere public. Anyone with it drains every wallet.
- `FUNDER_PRIVATE_KEY` is the highest-value key — keep it **only** in local `.env`, never in GitHub.
- `VOXEL_WALLETS` lives in GitHub Secrets (encrypted at rest). Anyone with repo admin / Actions write can exfiltrate it — keep the repo **private** and restrict collaborators.
- The game contract self-declares **testnet-grade pseudo-randomness** and is **unaudited**. You own it; deposits are recoverable via `withdraw` only up to the contract's CELO liquidity.
- This funds & plays **your own** game. Don't point it at contracts you don't control.
