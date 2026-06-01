"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { zeroAddress } from "viem";
import { VOXEL_ABI, VOXEL_ADDRESS, CELO_CHAIN_ID } from "@/lib/voxel";

export interface PlayerStats {
  totalPlayed: bigint;
  totalWins: bigint;
  totalLosses: bigint;
  totalFeesPaid: bigint;
  totalRewardWon: bigint;
}

/** Aggregated on-chain reads for the connected player. */
export function useVoxel() {
  const { address, isConnected, chainId } = useAccount();
  const enabled = Boolean(address);

  const credits = useReadContract({
    address: VOXEL_ADDRESS,
    abi: VOXEL_ABI,
    functionName: "getCreditBalance",
    args: [address ?? zeroAddress],
    chainId: CELO_CHAIN_ID,
    query: { enabled, refetchInterval: 12_000 },
  });

  const stats = useReadContract({
    address: VOXEL_ADDRESS,
    abi: VOXEL_ABI,
    functionName: "getPlayerStats",
    args: [address ?? zeroAddress],
    chainId: CELO_CHAIN_ID,
    query: { enabled },
  });

  const rate = useReadContract({
    address: VOXEL_ADDRESS,
    abi: VOXEL_ABI,
    functionName: "voxelPerCelo",
    chainId: CELO_CHAIN_ID,
  });

  const liquidity = useReadContract({
    address: VOXEL_ADDRESS,
    abi: VOXEL_ABI,
    functionName: "contractLiquidity",
    chainId: CELO_CHAIN_ID,
    query: { refetchInterval: 20_000 },
  });

  const celo = useBalance({ address, chainId: CELO_CHAIN_ID, query: { enabled, refetchInterval: 12_000 } });

  const refetchAll = () => {
    credits.refetch();
    stats.refetch();
    liquidity.refetch();
    celo.refetch();
  };

  return {
    address,
    isConnected,
    onCelo: chainId === CELO_CHAIN_ID,
    credits: credits.data as bigint | undefined,
    stats: stats.data as PlayerStats | undefined,
    rate: (rate.data as bigint | undefined) ?? 1000n,
    liquidity: liquidity.data as bigint | undefined,
    celo: celo.data,
    isLoading: credits.isLoading || stats.isLoading,
    refetchAll,
  };
}
