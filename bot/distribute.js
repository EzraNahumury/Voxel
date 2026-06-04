// Distribute native CELO from the funder wallet to every fleet wallet.
// Idempotent: a wallet already at/above the target is skipped; below-target wallets
// are topped up to the target. Safe to re-run.
//
//   node distribute.js
import { parseEther } from "viem";
import { CONFIG } from "./src/config.js";
import { publicClient, makeWallet, loadWallets, formatEther, short, log } from "./src/chain.js";

if (!CONFIG.FUNDER_PRIVATE_KEY || !CONFIG.FUNDER_PRIVATE_KEY.startsWith("0x")) {
  console.error("Set FUNDER_PRIVATE_KEY in bot/.env (the wallet holding the test CELO).");
  process.exit(1);
}

const wallets = loadWallets();
const target = parseEther(CONFIG.FUND_PER_WALLET);
const funder = makeWallet(CONFIG.FUNDER_PRIVATE_KEY);

const funderBal = await publicClient.getBalance({ address: funder.address });
const need = target * BigInt(wallets.length);
log(`Funder ${short(funder.address)} balance: ${formatEther(funderBal)} CELO`);
log(`Target: ${CONFIG.FUND_PER_WALLET} CELO x ${wallets.length} = ${formatEther(need)} CELO (+ gas)`);

if (funderBal < need) {
  log(`WARNING: funder balance below total target. Will fund as far as it goes, then stop.`);
}

// Sequential send keeps the funder's nonce simple and avoids "nonce too low" races.
let nonce = await publicClient.getTransactionCount({ address: funder.address });
let funded = 0,
  skipped = 0,
  failed = 0;

for (const w of wallets) {
  try {
    const bal = await publicClient.getBalance({ address: w.address });
    if (bal >= target) {
      skipped++;
      continue;
    }
    const topUp = target - bal;

    const remaining = await publicClient.getBalance({ address: funder.address });
    if (remaining <= topUp) {
      log(`Funder exhausted at wallet #${w.index}. Stopping. (${funded} funded)`);
      break;
    }

    const hash = await funder.client.sendTransaction({ to: w.address, value: topUp, nonce });
    nonce++;
    await publicClient.waitForTransactionReceipt({ hash });
    funded++;
    log(`#${w.index} ${short(w.address)}  +${formatEther(topUp)} CELO  ${hash}`);
  } catch (err) {
    failed++;
    log(`#${w.index} ${short(w.address)}  FAILED: ${err.shortMessage || err.message}`);
  }
}

log(`Distribute done. funded=${funded} skipped=${skipped} failed=${failed}`);
