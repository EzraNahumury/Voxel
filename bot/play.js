// THE CRON ENTRY. Each fleet wallet plays PLAYS_PER_RUN beginner rounds with a
// random pick. Per-wallet errors are isolated; the fleet keeps going.
// Skips wallets out of credits (< fee) or out of gas (< MIN_GAS_RESERVE).
//
//   node play.js
import { parseEther, parseEventLogs } from "viem";
import { CONFIG } from "./src/config.js";
import {
  publicClient,
  makeWallet,
  loadWallets,
  contract,
  VOXEL_ABI,
  pool,
  formatEther,
  short,
  log,
} from "./src/chain.js";

const wallets = loadWallets();
const level = CONFIG.LEVEL;
const minGas = parseEther(CONFIG.MIN_GAS_RESERVE);

// Chain is source of truth for fee/cardCount.
const lvl = await publicClient.readContract({ ...contract, functionName: "getLevel", args: [level] });
const cardCount = Number(lvl.cardCount);
const fee = lvl.fee;
if (!lvl.enabled || cardCount < 2) {
  log(`Level ${level} not playable (enabled=${lvl.enabled}, cards=${cardCount}). Abort.`);
  process.exit(1);
}
log(
  `Run start: ${wallets.length} wallets, level ${level} (${cardCount} cards, fee ${fee}), ` +
    `${CONFIG.PLAYS_PER_RUN} play(s) each.`,
);

const stat = { plays: 0, wins: 0, losses: 0, skipCredits: 0, skipGas: 0, errors: 0 };

const results = await pool(wallets, CONFIG.CONCURRENCY, async (w) => {
  const [credits, native] = await Promise.all([
    publicClient.readContract({ ...contract, functionName: "getCreditBalance", args: [w.address] }),
    publicClient.getBalance({ address: w.address }),
  ]);

  if (native < minGas) {
    stat.skipGas++;
    log(`#${w.index} ${short(w.address)}  SKIP gas: ${formatEther(native)} CELO < ${CONFIG.MIN_GAS_RESERVE}`);
    return;
  }
  if (credits < fee) {
    stat.skipCredits++;
    log(`#${w.index} ${short(w.address)}  SKIP credits: ${credits} < fee ${fee}`);
    return;
  }

  const { client, account } = makeWallet(w.privateKey);
  let localCredits = credits;

  for (let p = 0; p < CONFIG.PLAYS_PER_RUN; p++) {
    if (localCredits < fee) {
      stat.skipCredits++;
      break;
    }
    const pick = Math.floor(Math.random() * cardCount);
    const hash = await client.writeContract({
      ...contract,
      functionName: "playRound",
      args: [level, pick],
      account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    let won = false;
    let reward = 0n;
    try {
      const evs = parseEventLogs({ abi: VOXEL_ABI, eventName: "RoundPlayed", logs: receipt.logs });
      if (evs.length) {
        won = evs[0].args.won;
        reward = evs[0].args.reward;
      }
    } catch {
      /* receipt without decodable event — still counts as a play */
    }

    stat.plays++;
    localCredits = localCredits - fee + (won ? reward : 0n);
    if (won) stat.wins++;
    else stat.losses++;
    log(`#${w.index} ${short(w.address)}  pick ${pick}  ${won ? "WIN +" + reward : "loss"}  ${hash}`);
  }
});

results.forEach((r, i) => {
  if (r.status === "rejected") {
    stat.errors++;
    log(`#${wallets[i].index} ${short(wallets[i].address)}  ERROR: ${r.reason?.shortMessage || r.reason?.message}`);
  }
});

log(
  `Run done. plays=${stat.plays} wins=${stat.wins} losses=${stat.losses} ` +
    `skipGas=${stat.skipGas} skipCredits=${stat.skipCredits} errors=${stat.errors}`,
);

// Fail the job only if nothing succeeded AND something errored (real outage),
// so a few bad wallets don't red-X the whole cron run.
if (stat.plays === 0 && stat.errors > 0) process.exit(1);
