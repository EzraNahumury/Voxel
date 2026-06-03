// Each fleet wallet deposits DEPOSIT_CELO into VoxelGame -> VOXEL credits.
// Idempotent: a wallet already holding >= target credits is skipped.
//
//   node deposit.js
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
const depositWei = parseEther(CONFIG.DEPOSIT_CELO);

const voxelPerCelo = await publicClient.readContract({ ...contract, functionName: "voxelPerCelo" });
const targetCredits = (depositWei * voxelPerCelo) / 10n ** 18n;
log(`Depositing ${CONFIG.DEPOSIT_CELO} CELO/wallet -> ~${targetCredits} credits each (rate ${voxelPerCelo}/CELO).`);

const results = await pool(wallets, CONFIG.CONCURRENCY, async (w) => {
  const credits = await publicClient.readContract({
    ...contract,
    functionName: "getCreditBalance",
    args: [w.address],
  });
  if (credits >= targetCredits) return { skipped: true };

  const native = await publicClient.getBalance({ address: w.address });
  if (native < depositWei) {
    log(`#${w.index} ${short(w.address)}  SKIP: native ${formatEther(native)} < deposit ${CONFIG.DEPOSIT_CELO}`);
    return { skipped: true };
  }

  const { client, account } = makeWallet(w.privateKey);
  const hash = await client.writeContract({
    ...contract,
    functionName: "depositCELO",
    value: depositWei,
    account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  log(`#${w.index} ${short(w.address)}  deposited ${CONFIG.DEPOSIT_CELO} CELO  ${hash}`);
  return { deposited: true };
});

const deposited = results.filter((r) => r.status === "fulfilled" && r.value?.deposited).length;
const skipped = results.filter((r) => r.status === "fulfilled" && r.value?.skipped).length;
const failed = results.filter((r) => r.status === "rejected").length;
results.forEach((r, i) => {
  if (r.status === "rejected") log(`#${wallets[i].index} FAILED: ${r.reason?.shortMessage || r.reason?.message}`);
});
log(`Deposit done. deposited=${deposited} skipped=${skipped} failed=${failed}`);
