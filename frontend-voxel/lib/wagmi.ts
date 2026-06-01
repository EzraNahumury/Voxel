import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo } from "viem/chains";
import { http } from "wagmi";

/**
 * RainbowKit + wagmi config — Celo Mainnet only.
 * `getDefaultConfig` auto-registers installed wallets (EIP-6963) plus
 * MetaMask / Rabby / Coinbase / OKX / WalletConnect, etc.
 *
 * For WalletConnect (mobile QR) set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * (free at https://cloud.reown.com). Installed browser wallets work without it.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Voxel",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "voxeldemo0000000000000000000000",
  chains: [celo],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
  },
  ssr: true,
});

export const CELO_CHAIN = celo;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
