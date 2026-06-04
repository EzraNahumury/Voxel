// Cheap tx-volume mode: each wallet spams min-value depositCELO calls.
// ~6.5x cheaper gas than playRound. The 0.001 CELO value becomes VOXEL credits
// (recoverable via withdraw), so the real per-tx cost is just gas.
//
//   node spam-deposit.js
import { parseEther } from "viem";
import { CONFIG } from "./src/config.js";
import {
  publicClient,
  makeWallet,
  loadWallets,
  contract,
  pool,
  formatEther,
  short,
  log,
} from "./src/chain.js";

const wallets = loadWallets();
const value = parseEther(CONFIG.DEPOSIT_MIN); // min deposit -> >=1 credit (floor 0.001 CELO)
const perRun = CONFIG.DEPOSITS_PER_RUN;

// Per-tx native need = value + gas headroom. Skip a wallet that can't cover it.
const gasPrice = await publicClient.getGasPrice();
const gasHeadroom = 60000n * gasPrice; // ~2x a 32.5k-gas deposit, safe margin
const needPerTx = value + gasHeadroom;

log(`Deposit-spam: ${wallets.length} wallets x ${perRun} deposit(s) of ${CONFIG.DEPOSIT_MIN} CELO each.`);

const stat = { deposits: 0, skipped: 0, errors: 0 };

const results = await pool(wallets, CONFIG.CONCURRENCY, async (w) => {
  const { client, account } = makeWallet(w.privateKey);
  for (let i = 0; i < perRun; i++) {
    const native = await publicClient.getBalance({ address: w.address });
    if (native < needPerTx) {
      stat.skipped++;
      log(`#${w.index} ${short(w.address)}  SKIP: native ${formatEther(native)} CELO too low`);
      break;
    }
    const hash = await client.writeContract({
      ...contract,
      functionName: "depositCELO",
      value,
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    stat.deposits++;
    log(`#${w.index} ${short(w.address)}  deposit ${CONFIG.DEPOSIT_MIN}  ${hash}`);
  }
});

results.forEach((r, i) => {
  if (r.status === "rejected") {
    stat.errors++;
    log(`#${wallets[i].index} ${short(wallets[i].address)}  ERROR: ${r.reason?.shortMessage || r.reason?.message}`);
  }
});

log(`Deposit-spam done. deposits=${stat.deposits} skipped=${stat.skipped} errors=${stat.errors}`);
if (stat.deposits === 0 && stat.errors > 0) process.exit(1);
