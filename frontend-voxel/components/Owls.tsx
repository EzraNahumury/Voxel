"use client";

import { motion, useReducedMotion } from "framer-motion";

// Owl silhouettes gliding across the eclipse sky — flapping wings, glowing eyes.
// Sits behind the UI; reads against the red glow, fades into the dark.

type B = { top: string; scale: number; dur: number; delay: number; dir: 1 | -1 };

const OWLS: B[] = [
  { top: "13%", scale: 1.05, dur: 28, delay: 0, dir: 1 },
  { top: "21%", scale: 0.9, dur: 30, delay: 12, dir: -1 },
  { top: "27%", scale: 0.7, dur: 35, delay: 6, dir: 1 },
];

function Owl({ scale }: { scale: number }) {
  return (
    <svg
      width={66 * scale}
      height={50 * scale}
      viewBox="0 0 66 50"
      fill="none"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 9px rgba(226,61,75,0.28))" }}
    >
      {/* wings — flap from the shoulders */}
      <motion.path
        d="M27 27 C17 18 8 17 3 27 C11 25 20 26 27 31 Z"
        fill="#06070d"
        style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
        animate={{ rotate: [-7, 17, -7] }}
        transition={{ duration: 0.62, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M39 27 C49 18 58 17 63 27 C55 25 46 26 39 31 Z"
        fill="#06070d"
        style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        animate={{ rotate: [7, -17, 7] }}
        transition={{ duration: 0.62, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* body */}
      <path d="M24 21 C24 12 42 12 42 21 L42 28 C42 41 24 41 24 28 Z" fill="#080912" />
      {/* head */}
      <circle cx="33" cy="17" r="10.5" fill="#080912" />
      {/* ear tufts */}
      <path d="M24.5 10 L27.5 2 L31 12 Z" fill="#080912" />
      <path d="M41.5 10 L38.5 2 L35 12 Z" fill="#080912" />

      {/* glowing eyes */}
      <motion.g
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 4px #ffd56b)" }}
      >
        <circle cx="29" cy="17" r="3.1" fill="#ffe49a" />
        <circle cx="37" cy="17" r="3.1" fill="#ffe49a" />
      </motion.g>
      {/* pupils */}
      <circle cx="29" cy="17" r="1.2" fill="#1a1206" />
      <circle cx="37" cy="17" r="1.2" fill="#1a1206" />
      {/* beak */}
      <path d="M33 19 L31 22 L35 22 Z" fill="#e2a23d" />
    </svg>
  );
}

export default function Owls() {
  // Decorative only — skip entirely when the user prefers reduced motion.
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-screen overflow-hidden">
      {OWLS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute left-0 top-0 will-change-transform"
          style={{ top: b.top }}
          // Animate transform (x) instead of `left` so motion stays on the
          // compositor and never triggers layout/paint each frame.
          initial={{ x: b.dir === 1 ? "-15vw" : "115vw" }}
          animate={{ x: b.dir === 1 ? "115vw" : "-15vw", y: [0, -16, 8, 0] }}
          transition={{
            x: { duration: b.dur, repeat: Infinity, ease: "linear", delay: b.delay },
            y: { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: b.delay },
          }}
        >
          <div style={{ transform: b.dir === -1 ? "scaleX(-1)" : undefined }}>
            <Owl scale={b.scale} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
