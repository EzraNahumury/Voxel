// Fleet snapshot: native CELO + VOXEL credits + lifetime plays per wallet, totals,
// and a live days-left estimate at the current gas price.
//
//   node status.js
import { parseEther } from "viem";
import { CONFIG } from "./src/config.js";
import { publicClient, loadWallets, contract, pool, formatEther, formatGwei, short } from "./src/chain.js";

const wallets = loadWallets();

const rows = await pool(wallets, CONFIG.CONCURRENCY, async (w) => {
  const [native, credits, stats] = await Promise.all([
    publicClient.getBalance({ address: w.address }),
    publicClient.readContract({ ...contract, functionName: "getCreditBalance", args: [w.address] }),
    publicClient.readContract({ ...contract, functionName: "getPlayerStats", args: [w.address] }),
  ]);
  return { i: w.index, addr: w.address, native, credits, played: stats.totalPlayed, wins: stats.totalWins };
});

let totNative = 0n,
  totCredits = 0n,
  totPlayed = 0n,
  totWins = 0n,
  funded = 0;

for (const r of rows) {
  if (r.status !== "fulfilled") continue;
  const v = r.value;
  totNative += v.native;
  totCredits += v.credits;
  totPlayed += v.played;
  totWins += v.wins;
  if (v.native > 0n) funded++;
}

// Deposit-spam basis: native burn per deposit = ~32.5k gas + the 0.001 value.
const gasPrice = await publicClient.getGasPrice();
const depTxDayFleet = wallets.length * CONFIG.DEPOSITS_PER_RUN * CONFIG.CRON_RUNS_PER_DAY;
const nativePerDepWei = 32500n * gasPrice + parseEther(CONFIG.DEPOSIT_MIN);
const dailyNativeWei = BigInt(depTxDayFleet) * nativePerDepWei;
const daysLeft = dailyNativeWei === 0n ? Infinity : Number(totNative) / Number(dailyNativeWei);

console.log("");
console.log(`Fleet: ${wallets.length} wallets, ${funded} funded`);
console.log(`Gas price now: ${Number(formatGwei(gasPrice)).toFixed(1)} gwei`);
console.log("-".repeat(56));
console.log(`Native CELO total  : ${formatEther(totNative)}`);
console.log(`VOXEL credits total: ${totCredits}  (recoverable via withdraw)`);
console.log(`Rounds played total: ${totPlayed}  (wins ${totWins})`);
console.log("-".repeat(56));
console.log(`Deposit-spam: ${depTxDayFleet} tx/day fleet`);
console.log(`Fleet runs out in  : ~${daysLeft.toFixed(1)} days (native/gas)`);
console.log("");
