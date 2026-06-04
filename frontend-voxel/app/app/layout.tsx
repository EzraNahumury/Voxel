import { Providers } from "../providers";

// Web3 stack (wagmi + RainbowKit + react-query) is scoped to the /app segment
// only, so the marketing landing page never loads or hydrates that bundle.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
