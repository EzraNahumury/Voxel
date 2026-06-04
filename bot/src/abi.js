// VoxelGame — Celo Mainnet (chainId 42220). Mirrors frontend-voxel/lib/voxel.ts.
export const VOXEL_ADDRESS = "0x0298c67E83f7E21456fb0cEc68Bb62abf2720504";
export const CELO_CHAIN_ID = 42220;

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
];
