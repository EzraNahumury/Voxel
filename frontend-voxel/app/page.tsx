"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { LEVELS, VOXEL_ADDRESS } from "@/lib/voxel";
import CardFan from "@/components/CardFan";
import { Reveal, SplitWords } from "@/components/Reveal";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

// Purely decorative, client-only atmosphere — code-split and skipped on the
// server so the hero paints first and initial JS stays small.
const Particles = dynamic(() => import("@/components/reactbits/Particles"), { ssr: false });
const Owls = dynamic(() => import("@/components/Owls"), { ssr: false });
const ForestAtmosphere = dynamic(() => import("@/components/ForestAtmosphere"), { ssr: false });

const ease = [0.16, 1, 0.3, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease, delay: 0.15 + i * 0.08 } }),
};

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const contentY = useTransform(heroP, [0, 1], [0, -90]);
  const contentOpacity = useTransform(heroP, [0, 0.65], [1, 0]);
  const fanY = useTransform(heroP, [0, 1], [0, -170]);
  const fanScale = useTransform(heroP, [0, 1], [1, 0.85]);
  const fanRotate = useTransform(heroP, [0, 1], [0, -4]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* scroll progress */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-green via-green-bright to-gold"
        style={{ scaleX: scrollYProgress }}
      />
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* universal textured backdrop — bg2, gently breathing so it reads as a live scene */}
        <div
          className="animate-kenburns-2 fixed inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url('/bg2.png')" }}
        />
        <div className="fixed inset-0 bg-void/80" />
        {/* forest fog drifting over bg2 */}
        <div
          className="animate-drift fixed inset-x-0 bottom-0 h-[55vh] opacity-60"
          style={{ background: "radial-gradient(60% 80% at 50% 100%, rgba(160,80,200,0.10), transparent 70%)" }}
        />
        <div
          className="animate-drift fixed inset-x-0 top-[28%] h-[50vh] opacity-40"
          style={{
            background: "radial-gradient(70% 70% at 30% 50%, rgba(120,70,180,0.08), transparent 72%)",
            animationDelay: "-14s",
          }}
        />
        {/* living forest atmosphere — drifting fog, fireflies, breathing tint */}
        <ForestAtmosphere />

        {/* eclipse over the top, masked so it dissolves into the backdrop below */}
        <div
          className="animate-kenburns absolute inset-x-0 top-0 h-[94vh] bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: "url('/bg1.png')",
            maskImage: "linear-gradient(to bottom, #000 52%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 52%, transparent 90%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[94vh] bg-gradient-to-b from-void/50 via-void/72 to-transparent" />
        {/* drifting mist */}
        <div
          className="animate-drift absolute inset-x-0 top-[42vh] h-[46vh] opacity-50"
          style={{ background: "radial-gradient(70% 100% at 50% 60%, rgba(226,61,75,0.10), transparent 72%)" }}
        />
        <div
          className="animate-drift absolute inset-x-0 top-[58vh] h-[40vh] opacity-40"
          style={{
            background: "radial-gradient(80% 100% at 40% 50%, rgba(120,140,160,0.06), transparent 75%)",
            animationDelay: "-12s",
          }}
        />
        <div className="absolute inset-0 grid-veil opacity-40" />
        <div className="absolute inset-0">
          <Particles
            className="absolute inset-0"
            particleColors={["#e23d4b", "#fcff52", "#ece6d8"]}
            particleCount={45}
            particleSpread={12}
            speed={0.05}
            particleBaseSize={48}
            sizeRandomness={1}
            alphaParticles
            disableRotation={false}
          />
        </div>
        <Owls />
      </div>

      <Nav />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col items-center px-6 pb-28 pt-36 text-center md:px-12"
      >
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-20 flex w-full flex-col items-center"
        >
          {/* headline — clean sans, one cursive initial, monochrome */}
          <motion.h1
            variants={rise}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-7 font-fancy text-[clamp(2.9rem,8.8vw,7.2rem)] font-bold leading-[0.95] tracking-[-0.015em]"
          >
            <span className="block text-ink">Find the Card.</span>
            <span className="block text-[#9aa39c]">
              <span className="font-semibold italic">W</span>in the Prize.
            </span>
          </motion.h1>

          {/* subcopy */}
          <motion.p
            variants={rise}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-7 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-mute"
          >
            A Celo card-guessing game where you deposit CELO, conjure <span className="text-ink">VOXEL credits</span>,
            choose your odds, and draw the one card that pays.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={rise}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/app"
              className="group relative overflow-hidden rounded-full bg-green px-7 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-void transition hover:bg-green-bright"
            >
              <span className="relative z-10">Launch App →</span>
              <span className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
            </Link>
            <a
              href="#ritual"
              className="rounded-full border border-edge px-7 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-mute transition hover:border-green/40 hover:text-ink"
            >
              The ritual
            </a>
          </motion.div>
        </motion.div>

        {/* card fan — the drawn hand */}
        <motion.div
          style={{ y: fanY, scale: fanScale, rotate: fanRotate }}
          className="relative z-[5] mt-28 flex w-full justify-center md:mt-36"
        >
          <CardFan />
        </motion.div>
      </section>

      <Ritual />
      <Levels />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-14">
        <Link href="/" className="flex items-center gap-2.5">
          <Sigil />
          <span className="font-display text-xl font-semibold tracking-tight">Voxel</span>
        </Link>
        <nav className="hidden items-center gap-9 font-mono text-xs uppercase tracking-[0.18em] text-mute md:flex">
          <a href="#ritual" className="transition hover:text-ink">The Ritual</a>
          <a href="#levels" className="transition hover:text-ink">Levels</a>
          <a
            href={`https://celoscan.io/address/${VOXEL_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-ink"
          >
            Contract
          </a>
        </nav>
        <Link
          href="/app"
          className="rounded-full bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-void transition hover:bg-green"
        >
          Launch App
        </Link>
      </div>
    </header>
  );
}

function Sigil() {
  return (
    <Image
      src="/logo-new.png"
      alt="Voxel"
      width={36}
      height={36}
      priority
      className="h-9 w-9 rounded-lg object-contain"
    />
  );
}

function Ritual() {
  const steps = [
    {
      n: "01",
      t: "Deposit CELO",
      d: "Send native CELO to the Voxel contract and receive VOXEL credits at 1 CELO = 1000 VOXEL.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
          <path d="M9 12h6M10 9.5h4M10 14.5h4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      n: "02",
      t: "Choose your odds",
      d: "Beginner, Medium or Hard. More cards means a steeper climb — and a richer reward.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      n: "03",
      t: "Draw & settle",
      d: "Pick one card. Find the winning draw and your reward is credited. Withdraw to CELO anytime.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="3" width="14" height="18" rx="3" />
          <path
            d="M12 8l1.1 2.3 2.5.3-1.8 1.7.5 2.4L12 13.7 9.7 15l.5-2.4-1.8-1.7 2.5-.3z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      ),
    },
  ];
  return (
    <section id="ritual" className="relative mx-auto max-w-[1500px] px-6 py-28 md:px-14">
      <Header eyebrow="How it works" title="A three-line ritual" />
      <motion.div
        className="mt-14 grid gap-5 md:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ show: { transition: { staggerChildren: 0.14 } } }}
      >
        {steps.map((s) => (
          <motion.div
            key={s.n}
            variants={{ hidden: { opacity: 0, y: 46 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
          >
            <SpotlightCard className="group h-full bg-gradient-to-b from-surface-2/70 to-void/40 p-8 shadow-[0_28px_70px_-44px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1.5 hover:border-green/30">
              <span className="pointer-events-none absolute -right-3 -top-6 select-none font-display text-[7rem] leading-none text-green/[0.07]">
                {s.n}
              </span>
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green/40 to-transparent" />
              <div className="relative z-10">
                <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-green/25 bg-gradient-to-b from-green/20 to-green/5 text-green shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  {s.icon}
                </span>
                <p className="mt-7 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-green/70">Step {s.n}</p>
                <h3 className="mt-2.5 font-display text-[1.7rem] leading-tight text-ink">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{s.d}</p>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Levels() {
  const tone: Record<string, string> = {
    green: "text-green border-green/30",
    gold: "text-gold border-gold/30",
    blood: "text-blood border-blood/30",
  };
  const glow: Record<string, `rgba(${number}, ${number}, ${number}, ${number})`> = {
    green: "rgba(240, 71, 106, 0.22)",
    gold: "rgba(252, 255, 82, 0.16)",
    blood: "rgba(226, 61, 75, 0.22)",
  };
  return (
    <section id="levels" className="relative mx-auto max-w-[1500px] px-6 py-28 md:px-14">
      <Header eyebrow="Three fates" title="Pick your level" />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {LEVELS.map((l, i) => (
          <motion.div
            key={l.key}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease, delay: i * 0.08 }}
          >
            <SpotlightCard
              spotlightColor={glow[l.tone]}
              className="glass h-full rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="relative z-10">
                <div
                  className={`mb-6 inline-flex rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest ${tone[l.tone]}`}
                >
                  {l.odds}
                </div>
                <h3 className="font-display text-3xl text-ink">{l.name}</h3>
                <p className="mt-2 text-sm text-mute">{l.blurb}</p>
                <dl className="mt-8 space-y-3 font-mono text-sm">
                  <Row k="Cards" v={`${l.cards}`} />
                  <Row k="Play fee" v={`${l.fee} VOXEL`} />
                  <Row k="Reward" v={`${l.reward} VOXEL`} accent />
                </dl>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-edge pt-3">
      <dt className="text-mute">{k}</dt>
      <dd className={accent ? "text-green" : "text-ink"}>{v}</dd>
    </div>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <Reveal>
        <p className="eyebrow mb-4">{eyebrow}</p>
      </Reveal>
      <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.95] tracking-tight text-ink">
        <SplitWords text={title} delay={0.08} />
      </h2>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-edge">
      <motion.div
        className="mx-auto max-w-[1500px] px-6 py-16 md:px-14"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <Sigil />
              <span className="font-display text-xl font-semibold">Voxel</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-mute">
              An experimental on-chain card game built for the Celo Proof of Ship program. Not audited.
              MVP randomness is for entertainment only — not a real-money gambling product.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
            <p className="mb-3 text-faint">Contract · Celo Mainnet</p>
            <a
              href={`https://celoscan.io/address/${VOXEL_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-green transition hover:text-green-bright"
            >
              {VOXEL_ADDRESS}
            </a>
            <Link href="/app" className="mt-6 block text-ink underline-offset-4 hover:underline">
              Launch App →
            </Link>
          </div>
        </div>
        <p className="mt-14 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          © {new Date().getFullYear()} Voxel — Deposit. Pick your level. Find the card.
        </p>
      </motion.div>
    </footer>
  );
}
