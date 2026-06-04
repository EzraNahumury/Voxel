// Generate the wallet fleet. Writes wallets.json (SECRET — gitignored) and
// wallets.public.json (addresses only, safe to inspect/commit).
//
// Usage:
//   node generate-wallets.js            # refuses to overwrite an existing wallets.json
//   node generate-wallets.js --force    # regenerate (DESTROYS old keys — funds become unreachable)
import { existsSync, writeFileSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { CONFIG } from "./src/config.js";

const force = process.argv.includes("--force");

if (existsSync(CONFIG.WALLETS_FILE) && !force) {
  console.error(
    `Refusing to overwrite ${CONFIG.WALLETS_FILE}.\n` +
      `It already holds keys that may control real CELO. Re-run with --force only if you are certain.`,
  );
  process.exit(1);
}

const count = CONFIG.WALLET_COUNT;
const wallets = [];
const publicOnly = [];

for (let i = 0; i < count; i++) {
  const privateKey = generatePrivateKey();
  const { address } = privateKeyToAccount(privateKey);
  wallets.push({ index: i, address, privateKey });
  publicOnly.push({ index: i, address });
}

writeFileSync(CONFIG.WALLETS_FILE, JSON.stringify(wallets, null, 2));
writeFileSync(CONFIG.PUBLIC_FILE, JSON.stringify(publicOnly, null, 2));

console.log(`Generated ${count} wallets.`);
console.log(`  Secret keys -> ${CONFIG.WALLETS_FILE}  (gitignored — DO NOT share/commit)`);
console.log(`  Addresses   -> ${CONFIG.PUBLIC_FILE}`);
console.log("");
console.log("Next: fund the funder wallet, set FUNDER_PRIVATE_KEY in .env, then `npm run distribute`.");
console.log("For GitHub Actions: put the contents of wallets.json into the VOXEL_WALLETS repo secret.");
