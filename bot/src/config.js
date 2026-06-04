import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const BOT_DIR = resolve(__dirname, "..");

// Load bot/.env explicitly so scripts work from any cwd.
dotenv.config({ path: resolve(BOT_DIR, ".env") });

const num = (v, d) => (v === undefined || v === "" ? d : Number(v));
const str = (v, d) => (v === undefined || v === "" ? d : v);
// Private keys must be 0x-prefixed for viem; tolerate a key pasted without it.
const key = (v) => {
  const k = (v || "").trim();
  return k && !k.startsWith("0x") ? "0x" + k : k;
};

export const CONFIG = {
  RPC_URL: str(process.env.RPC_URL, "https://forno.celo.org"),
  FUNDER_PRIVATE_KEY: key(process.env.FUNDER_PRIVATE_KEY),

  FUND_PER_WALLET: str(process.env.FUND_PER_WALLET, "0.5"), // CELO sent to each wallet
  DEPOSIT_CELO: str(process.env.DEPOSIT_CELO, "0.2"), // CELO each wallet deposits -> credits
  PLAYS_PER_RUN: num(process.env.PLAYS_PER_RUN, 1), // plays per wallet per invocation
  LEVEL: num(process.env.LEVEL, 1), // 1=beginner

  // Deposit-spam mode (cheap tx volume): min-value deposits per wallet per run.
  DEPOSIT_MIN: str(process.env.DEPOSIT_MIN, "0.001"), // contract floor: value -> >=1 credit
  DEPOSITS_PER_RUN: num(process.env.DEPOSITS_PER_RUN, 1),

  // How many times the cron fires per day (must match the workflow schedule).
  // tx/day/wallet = (DEPOSITS_PER_RUN or PLAYS_PER_RUN) x CRON_RUNS_PER_DAY.
  CRON_RUNS_PER_DAY: num(process.env.CRON_RUNS_PER_DAY, 4),
  MIN_GAS_RESERVE: str(process.env.MIN_GAS_RESERVE, "0.02"), // CELO floor before skipping
  CONCURRENCY: num(process.env.CONCURRENCY, 8),
  WALLET_COUNT: num(process.env.WALLET_COUNT, 100),

  // Steady-state gas estimate for a beginner playRound; used only by calc.js/status.js.
  // The live bot relies on viem's own estimation, not this number.
  GAS_PER_PLAY: num(process.env.GAS_PER_PLAY, 180000),

  WALLETS_FILE: resolve(BOT_DIR, "wallets.json"),
  PUBLIC_FILE: resolve(BOT_DIR, "wallets.public.json"),
  LOG_FILE: resolve(BOT_DIR, "play-activity.log"),
};
