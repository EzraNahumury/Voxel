// Read-only: derive the funder address from bot/.env and report its balance
// and whether it covers the test budget. Spends nothing.
//
//   node check-funder.js
import { parseEther } from "viem";
import { CONFIG } from "./src/config.js";
import { publicClient, makeWallet, formatEther } from "./src/chain.js";

if (!CONFIG.FUNDER_PRIVATE_KEY.startsWith("0x") || CONFIG.FUNDER_PRIVATE_KEY.length < 10) {
  console.error("FUNDER_PRIVATE_KEY missing/invalid in bot/.env");
  process.exit(1);
}

const f = makeWallet(CONFIG.FUNDER_PRIVATE_KEY);
const bal = await publicClient.getBalance({ address: f.address });

const distrib = parseEther(String(Number(CONFIG.FUND_PER_WALLET) * CONFIG.WALLET_COUNT));
const gasBuffer = parseEther("0.3");
const need = distrib + gasBuffer;

console.log("");
console.log("Funder address :", f.address);
console.log("Funder balance :", formatEther(bal), "CELO");
console.log("Need to distribute:", formatEther(distrib), "CELO  (+ ~0.3 gas)");
console.log(bal >= need ? "=> ENOUGH ✓  ready to distribute" : `=> SHORT by ${formatEther(need - bal)} CELO`);
console.log("");
