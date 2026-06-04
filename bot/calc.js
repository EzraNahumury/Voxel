// Economics + mode comparison: play-spam vs deposit-spam.
// Uses gas units measured from real on-chain txs, scaled to the LIVE gas price.
//
//   node calc.js
import { CONFIG } from "./src/config.js";
import { publicClient, formatGwei } from "./src/chain.js";

const WALLETS = CONFIG.WALLET_COUNT;
const FUND = Number(CONFIG.FUND_PER_WALLET);
const BUDGET = FUND * WALLETS; // total CELO
const RUNS = CONFIG.CRON_RUNS_PER_DAY; // cron fires/day
const depTxDay = CONFIG.DEPOSITS_PER_RUN * RUNS; // deposits/day/wallet
const playTxDay = CONFIG.PLAYS_PER_RUN * RUNS; // plays/day/wallet

// Gas units measured from real Celo txs (see screenshots):
//   playRound  0.04302883 CELO @ ~202.5 gwei -> ~212,000 gas
//   depositCELO 0.00657963 CELO @ ~202.5 gwei -> ~32,500 gas
const GAS_PLAY = 212000;
const GAS_DEPOSIT = 32500;
const DEPOSIT_VALUE = Number(CONFIG.DEPOSIT_MIN); // 0.001 CELO, recoverable as credits

const gwei = Number(formatGwei(await publicClient.getGasPrice()));
const gasCost = (units) => (units * gwei) / 1e9; // CELO

const playGas = gasCost(GAS_PLAY);
const depGas = gasCost(GAS_DEPOSIT);
const depNative = depGas + DEPOSIT_VALUE; // native consumed per deposit (value recoverable)

const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

console.log("");
console.log(`VOXEL spam economics — live gas ${gwei.toFixed(1)} gwei, budget ${BUDGET} CELO (${WALLETS} wallets)`);
console.log("=".repeat(64));
console.log("");
console.log("mode            gas/tx CELO   native/tx CELO   tx per budget   real burn");
console.log("-".repeat(64));
console.log(
  "play-spam".padEnd(15),
  playGas.toFixed(5).padStart(11),
  playGas.toFixed(5).padStart(15),
  fmt(BUDGET / playGas).padStart(14),
  "   gas only",
);
console.log(
  "deposit-spam".padEnd(15),
  depGas.toFixed(5).padStart(11),
  depNative.toFixed(5).padStart(15),
  fmt(BUDGET / depNative).padStart(14),
  `   gas only (value ${DEPOSIT_VALUE} recoverable)`,
);
console.log("");

const ratio = playGas / depGas;
console.log(`Deposit gas is ${ratio.toFixed(1)}x cheaper than play -> ~${ratio.toFixed(1)}x more tx for the same CELO.`);
console.log("");

// Days at the configured cron cadence.
const depDaysNative = FUND / (depNative * depTxDay);
const playGasReserve = FUND - Number(CONFIG.DEPOSIT_CELO);
const playDaysGas = playGasReserve / (playGas * playTxDay);
console.log(`Cron fires ${RUNS}x/day:`);
console.log(
  `  deposit-spam: ${depTxDay} tx/day/wallet (${depTxDay * WALLETS} fleet) -> runs ~${depDaysNative.toFixed(0)} days` +
    ` (then withdraw to reclaim piled credits)`,
);
console.log(
  `  play-spam:    ${playTxDay} tx/day/wallet (${playTxDay * WALLETS} fleet) -> runs ~${playDaysGas.toFixed(0)} days` +
    ` (gas reserve ${playGasReserve} CELO)`,
);
console.log("");
console.log("Note: deposit-spam = tx volume + credits, NOT game-plays (no totalPlayed/leaderboard).");
console.log("");
