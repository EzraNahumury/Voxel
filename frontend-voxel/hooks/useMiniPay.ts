"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

/**
 * MiniPay integration.
 * "Integrated" = (1) detect `window.ethereum.isMiniPay`, and
 * (2) auto-connect + hide the Connect Wallet button inside MiniPay.
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const eth = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (!eth?.isMiniPay) return;
    setIsMiniPay(true);
    if (isConnected) return;
    const injected =
      connectors.find((c) => c.id === "injected") ??
      connectors.find((c) => c.type === "injected") ??
      connectors[0];
    if (injected) connect({ connector: injected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors, isConnected]);

  return { isMiniPay };
}
