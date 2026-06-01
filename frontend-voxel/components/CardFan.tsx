"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

type Card = {
  rank: string;
  glyph: string;
  name: string;
  accent: string;
  center?: boolean;
};

// A drawn hand — refined occult palette (one bright green "winning" card at center).
const FAN: Card[] = [
  { rank: "II", glyph: "♆", name: "The Tide", accent: "#8b6cff" },
  { rank: "V", glyph: "♥", name: "The Heart", accent: "#e23d4b" },
  { rank: "✦", glyph: "✦", name: "The Winning Draw", accent: "#f0476a", center: true },
  { rank: "VII", glyph: "♦", name: "The Gilded", accent: "#fcff52" },
  { rank: "IX", glyph: "♣", name: "The Thorn", accent: "#34d3c0" },
];

// Per-card arc transform (index 2 is the raised center).
const T = [
  { r: -16, x: -310, y: 64, s: 0.95, z: 1 },
  { r: -8, x: -160, y: 18, s: 0.99, z: 2 },
  { r: 0, x: 0, y: -20, s: 1.09, z: 5 },
  { r: 8, x: 160, y: 18, s: 0.99, z: 2 },
  { r: 16, x: 310, y: 64, s: 0.95, z: 1 },
];

export default function CardFan() {
  return (
    <div className="pointer-events-none relative flex w-full justify-center">
      <div className="pointer-events-auto origin-bottom scale-[0.5] sm:scale-[0.72] lg:scale-100">
        <div className="relative h-[300px] w-[760px]">
          {FAN.map((card, i) => {
            const t = T[i];
            return (
              <div key={card.name} className="absolute left-1/2 top-0 -translate-x-1/2">
                <motion.div
                  custom={i}
                  initial={{ opacity: 0, y: 140, rotate: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    x: t.x,
                    y: t.y,
                    rotate: t.r,
                    scale: t.s,
                    transition: { duration: 1, ease, delay: 0.35 + i * 0.09 },
                  }}
                  whileHover={{ y: t.y - 26, scale: t.s + 0.05, transition: { duration: 0.35, ease } }}
                  style={{ zIndex: card.center ? 50 : t.z }}
                >
                  <motion.div
                    animate={{ y: [0, -9, 0], rotate: [0, i % 2 === 0 ? 1.1 : -1.1, 0] }}
                    transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: 1 + i * 0.25 }}
                  >
                    <FaceCard card={card} index={i} />
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FaceCard({ card, index }: { card: Card; index: number }) {
  const { accent, center } = card;
  return (
    <div
      className="relative aspect-[5/7] w-44 overflow-hidden rounded-[1.1rem] border bg-cover bg-center p-4"
      style={{
        backgroundImage: "url('/cardluar.png')",
        borderColor: center ? "rgba(240,71,106,0.6)" : `${accent}45`,
        boxShadow: center
          ? "0 0 0 1px rgba(240,71,106,0.35), 0 30px 80px -26px rgba(240,71,106,0.65), inset 0 1px 0 rgba(255,255,255,0.06)"
          : `0 24px 60px -30px ${accent}80, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* hue tint — recolour the red card art toward this card's accent */}
      {!center && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: accent, opacity: 0.25, mixBlendMode: "color" }}
        />
      )}
      {/* legibility veil */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/65" />
      {/* glow wash */}
      <div
        className="pointer-events-none absolute -inset-px opacity-70"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${accent}26 0%, transparent 55%)`,
        }}
      />

      {/* periodic sheen sweep */}
      <div
        className="card-sheen pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-transparent via-white/12 to-transparent"
        style={{ animationDelay: `${index * 1.4}s` }}
      />
      {/* winning card — breathing core glow */}
      {center && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "radial-gradient(58% 42% at 50% 42%, rgba(255,95,135,0.3), transparent 62%)" }}
        />
      )}

      {/* corner rank */}
      <div
        className="relative flex items-start justify-between font-display text-lg"
        style={{ color: accent, textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}
      >
        <span className="leading-none">{card.rank}</span>
        <span className="text-sm opacity-80">{card.glyph}</span>
      </div>

      {/* footer */}
      {center ? (
        <div className="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-2">
          <span
            className="text-center font-mono text-[0.5rem] uppercase tracking-[0.3em] text-[#ffd3dd]"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
          >
            The winning draw
          </span>
          <Link
            href="/app"
            className="group flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-green-bright to-green px-4 py-2.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-void shadow-[0_10px_26px_-10px_rgba(240,71,106,0.85)] transition hover:to-green-bright"
          >
            Get Started
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M3 8h9M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      ) : (
        <div
          className="absolute inset-x-4 bottom-4 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-white/75"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
        >
          {card.name}
        </div>
      )}
    </div>
  );
}
