"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSwitchChain } from "wagmi";
import { CELO_CHAIN_ID } from "@/lib/voxel";
import { useMiniPay } from "@/hooks/useMiniPay";

/**
 * Styled trigger for RainbowKit's auto-populated wallet modal.
 * Keeps the Voxel look while delegating wallet discovery to RainbowKit/wagmi.
 * Hidden inside MiniPay (already connected via the injected provider).
 */
export function WalletButton({ size = "md" }: { size?: "sm" | "md" }) {
  const { isMiniPay } = useMiniPay();
  const { switchChain } = useSwitchChain();
  const pad = size === "sm" ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return <div aria-hidden className={`${pad} pointer-events-none opacity-0`}>…</div>;
        }

        if (isMiniPay && connected) return null;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className={`group relative overflow-hidden rounded-full bg-green ${pad} font-mono uppercase tracking-[0.18em] text-void transition hover:bg-green-bright`}
            >
              <span className="relative z-10">Connect Wallet</span>
              <span className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={() => switchChain({ chainId: CELO_CHAIN_ID })}
              className={`rounded-full bg-blood/90 ${pad} font-mono uppercase tracking-[0.18em] text-white transition hover:bg-blood`}
            >
              Switch to Celo
            </button>
          );
        }

        return (
          <button
            onClick={openAccountModal}
            className={`glass flex items-center gap-2 rounded-full ${pad} font-mono text-ink transition hover:border-green/50`}
          >
            <span className="h-2 w-2 rounded-full bg-green animate-pulse-ring" />
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
