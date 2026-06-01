import { formatEther } from "viem";

/** Deployed VoxelGame — Celo Mainnet (chainId 42220). */
export const VOXEL_ADDRESS =
  "0x0298c67E83f7E21456fb0cEc68Bb62abf2720504" as const;

export const CELO_CHAIN_ID = 42220 as const;

export const VOXEL_ABI = [
  { type: "function", name: "depositCELO", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "voxelAmount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "playRound",
    stateMutability: "nonpayable",
    inputs: [
      { name: "level", type: "uint8" },
      { name: "playerPick", type: "uint8" },
    ],
    outputs: [{ name: "roundId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getCreditBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "voxelPerCelo", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "contractLiquidity", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "getPlayerStats",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "totalPlayed", type: "uint256" },
          { name: "totalWins", type: "uint256" },
          { name: "totalLosses", type: "uint256" },
          { name: "totalFeesPaid", type: "uint256" },
          { name: "totalRewardWon", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getLevel",
    stateMutability: "view",
    inputs: [{ name: "level", type: "uint8" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "cardCount", type: "uint8" },
          { name: "fee", type: "uint256" },
          { name: "reward", type: "uint256" },
          { name: "enabled", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "RoundPlayed",
    inputs: [
      { name: "roundId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "level", type: "uint8", indexed: false },
      { name: "cardCount", type: "uint8", indexed: false },
      { name: "playerPick", type: "uint8", indexed: false },
      { name: "winningCard", type: "uint8", indexed: false },
      { name: "won", type: "bool", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "reward", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "celoAmount", type: "uint256", indexed: false },
      { name: "voxelCredited", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "voxelBurned", type: "uint256", indexed: false },
      { name: "celoAmount", type: "uint256", indexed: false },
    ],
  },
] as const;

export type LevelKey = "beginner" | "medium" | "hard";

export interface LevelMeta {
  id: 1 | 2 | 3;
  key: LevelKey;
  name: string;
  cards: number;
  fee: number; // VOXEL (default; chain is source of truth)
  reward: number; // VOXEL
  odds: string;
  tone: "green" | "gold" | "blood";
  blurb: string;
}

/** Display metadata — mirrors the on-chain defaults seeded in the contract. */
export const LEVELS: LevelMeta[] = [
  {
    id: 1,
    key: "beginner",
    name: "Beginner",
    cards: 3,
    fee: 10,
    reward: 25,
    odds: "1 in 3",
    tone: "green",
    blurb: "Three cards. The kindest odds. A gentle first draw.",
  },
  {
    id: 2,
    key: "medium",
    name: "Medium",
    cards: 5,
    fee: 25,
    reward: 100,
    odds: "1 in 5",
    tone: "gold",
    blurb: "Five cards, a heavier stake, a richer reward.",
  },
  {
    id: 3,
    key: "hard",
    name: "Hard",
    cards: 7,
    fee: 50,
    reward: 300,
    odds: "1 in 7",
    tone: "blood",
    blurb: "Seven cards. Long odds. The fate worth chasing.",
  },
] as const;

export const getLevelMeta = (id: number) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];

/** Credits are whole VOXEL (no decimals); display with thin separators. */
export const fmtVoxel = (v?: bigint) =>
  v === undefined ? "—" : v.toLocaleString("en-US");

/** Format wei → CELO with a fixed precision for the UI. */
export const fmtCelo = (wei?: bigint, dp = 3) =>
  wei === undefined ? "—" : Number(formatEther(wei)).toFixed(dp);

/** voxel credits → CELO value (rate is voxelPerCelo). */
export const voxelToCelo = (voxel: bigint, rate: bigint) =>
  rate === 0n ? 0 : Number(voxel) / Number(rate);
