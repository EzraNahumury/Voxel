import type { Metadata } from "next";
import GameApp from "@/components/GameApp";

export const metadata: Metadata = {
  title: "Voxel — Play",
  description: "Deposit CELO, draw a card, win VOXEL. Live on Celo Mainnet.",
};

export default function Page() {
  return <GameApp />;
}
