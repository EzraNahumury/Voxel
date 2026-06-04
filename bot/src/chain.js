import { readFileSync } from "node:fs";
import { appendFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, formatEther, formatGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { CONFIG } from "./config.js";
import { VOXEL_ABI, VOXEL_ADDRESS } from "./abi.js";

export { VOXEL_ABI, VOXEL_ADDRESS, formatEther, formatGwei };

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(CONFIG.RPC_URL),
});

export const contract = { address: VOXEL_ADDRESS, abi: VOXEL_ABI };

/** Build a wallet client bound to one private key. */
export function makeWallet(privateKey) {
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({ account, chain: celo, transport: http(CONFIG.RPC_URL) });
  return { account, client, address: account.address };
}

/**
 * Load the wallet fleet.
 * In CI, set the VOXEL_WALLETS secret to the JSON contents of wallets.json.
 * Locally, it reads wallets.json. Each entry: { index, address, privateKey }.
 */
export function loadWallets() {
  const raw = process.env.VOXEL_WALLETS?.trim();
  let data;
  if (raw) {
    data = JSON.parse(raw);
  } else {
    try {
      data = JSON.parse(readFileSync(CONFIG.WALLETS_FILE, "utf8"));
    } catch {
      throw new Error(
        `No wallets found. Run \`npm run generate\` to create wallets.json, ` +
          `or set the VOXEL_WALLETS env/secret (JSON array).`,
      );
    }
  }
  const list = Array.isArray(data) ? data : data.wallets;
  if (!Array.isArray(list) || list.length === 0) throw new Error("Wallet list is empty or malformed.");
  return list;
}

/** Bounded-concurrency map. Returns Promise.allSettled results in input order. */
export async function pool(items, size, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (err) {
        results[i] = { status: "rejected", reason: err };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

const ts = () => new Date().toISOString();

/** Console + append to play-activity.log (best-effort; ignored if FS read-only). */
export function log(msg) {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(CONFIG.LOG_FILE, line + "\n");
  } catch {
    /* ignore (e.g. read-only CI fs) */
  }
}

export const short = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
