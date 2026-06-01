import type { Metadata } from "next";
import { Bodoni_Moda, Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const fancy = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voxel",
  description:
    "A Celo card-guessing game. Deposit CELO, receive VOXEL credits, pick a card, and test your luck. Built as a MiniApp for MiniPay.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${fancy.variable}`}
    >
      <body className="min-h-screen bg-void font-body text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
