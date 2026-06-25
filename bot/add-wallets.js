// Append N NEW wallets to wallets.json WITHOUT touching existing keys.
// Safe to run on a live fleet — old wallets (and their funds/credits) are preserved.
//
//   node add-wallets.js <count>
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { CONFIG } from "./src/config.js";

const n = parseInt(process.argv[2] || "0", 10);
if (!n || n < 1) {
  console.error("usage: node add-wallets.js <count>");
  process.exit(1);
}
if (!existsSync(CONFIG.WALLETS_FILE)) {
  console.error(`No ${CONFIG.WALLETS_FILE}. Run generate-wallets.js first.`);
  process.exit(1);
}

const wallets = JSON.parse(readFileSync(CONFIG.WALLETS_FILE, "utf8"));
const startIdx = wallets.length;

for (let i = 0; i < n; i++) {
  const privateKey = generatePrivateKey();
  const { address } = privateKeyToAccount(privateKey);
  wallets.push({ index: startIdx + i, address, privateKey });
}

writeFileSync(CONFIG.WALLETS_FILE, JSON.stringify(wallets, null, 2));
writeFileSync(
  CONFIG.PUBLIC_FILE,
  JSON.stringify(
    wallets.map((w) => ({ index: w.index, address: w.address })),
    null,
    2,
  ),
);

console.log(`Added ${n} new wallets (index ${startIdx}..${startIdx + n - 1}). Total now ${wallets.length}.`);
console.log("Next: update VOXEL_WALLETS secret, then distribute.");
