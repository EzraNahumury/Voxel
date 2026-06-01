"use client";

import type { CSSProperties } from "react";

// All motion is CSS (compositor-only) — no JS animation loops, light on the main thread.

const FOG = [
  { top: "2%", size: 720, color: "rgba(150,70,200,0.13)", dur: 46, delay: 0 },
  { top: "40%", size: 900, color: "rgba(120,60,185,0.15)", dur: 60, delay: 8 },
  { top: "66%", size: 700, color: "rgba(205,90,150,0.12)", dur: 52, delay: 16 },
];

const RAYS = [
  { left: "20%", w: 110, rot: -18, dur: 12, dl: 0 },
  { left: "50%", w: 150, rot: -20, dur: 10, dl: 3 },
  { left: "78%", w: 90, rot: -16, dur: 14, dl: 1.5 },
];

const ORBS = [
  { l: "24%", t: "40%", s: 340, c: "rgba(170,90,220,0.16)", dur: 10, dl: 0 },
  { l: "74%", t: "58%", s: 400, c: "rgba(130,80,210,0.15)", dur: 13, dl: 2 },
];

const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({
  l: `${((i * 41) % 96) + 2}%`,
  t: `${((i * 57) % 66) + 22}%`,
  s: 2 + (i % 3),
  dur: 9 + (i % 6),
  dl: (i % 8) * 0.8,
}));

const SPORES = Array.from({ length: 18 }, (_, i) => ({
  l: `${((i * 53) % 98) + 1}%`,
  t: `${((i * 37) % 76) + 16}%`,
  dur: 15 + (i % 7),
  dl: (i % 10) * 1.1,
}));

export default function ForestAtmosphere() {
  return (
    <div className="forest-fx pointer-events-none fixed inset-0 overflow-hidden">
      {/* breathing tint */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 50% 30%, rgba(140,60,190,0.12), transparent 70%)",
          animation: "orbPulse 16s ease-in-out infinite",
        }}
      />

      {/* god rays */}
      <div className="absolute inset-0 mix-blend-screen">
        {RAYS.map((r, i) => (
          <div
            key={i}
            className="absolute -top-[25%] h-[150%] blur-xl"
            style={
              {
                left: r.left,
                width: r.w,
                "--rot": `${r.rot}deg`,
                background:
                  "linear-gradient(to bottom, rgba(214,170,255,0.22), rgba(214,170,255,0.05) 55%, transparent 80%)",
                animation: `rayShimmer ${r.dur}s ease-in-out ${-r.dl}s infinite`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* drifting fog */}
      {FOG.map((f, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            top: f.top,
            left: "50%",
            width: f.size,
            height: f.size * 0.6,
            marginLeft: -f.size / 2,
            background: `radial-gradient(closest-side, ${f.color}, transparent 75%)`,
            animation: `${i % 2 ? "fogB" : "fogA"} ${f.dur}s ease-in-out ${-f.delay}s infinite`,
          }}
        />
      ))}

      {/* glow orbs */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            left: o.l,
            top: o.t,
            width: o.s,
            height: o.s,
            marginLeft: -o.s / 2,
            background: `radial-gradient(closest-side, ${o.c}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out ${-o.dl}s infinite`,
          }}
        />
      ))}

      {/* ground mist */}
      <div
        className="absolute inset-x-[-12%] bottom-0 h-[36vh] blur-2xl"
        style={{
          background: "linear-gradient(to top, rgba(150,80,200,0.20), transparent)",
          animation: "mistSweep 38s ease-in-out infinite",
        }}
      />

      {/* dust / spores */}
      {SPORES.map((p, i) => (
        <span
          key={`s${i}`}
          className="absolute rounded-full"
          style={{
            left: p.l,
            top: p.t,
            width: 1.5,
            height: 1.5,
            background: "rgba(220,185,255,0.6)",
            animation: `floatUp ${p.dur}s ease-in-out ${-p.dl}s infinite`,
          }}
        />
      ))}

      {/* fireflies */}
      {FIREFLIES.map((f, i) => (
        <span
          key={`f${i}`}
          className="absolute rounded-full"
          style={{
            left: f.l,
            top: f.t,
            width: f.s,
            height: f.s,
            background: "#ecd6ff",
            boxShadow: "0 0 9px 2px rgba(224,170,255,0.75)",
            animation: `floatUp ${f.dur}s ease-in-out ${-f.dl}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
