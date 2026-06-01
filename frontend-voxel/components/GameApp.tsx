"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, useConfig, useSwitchChain, useWriteContract } from "wagmi";
import { simulateContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { decodeEventLog, parseEther, type Log } from "viem";
import {
  VOXEL_ABI,
  VOXEL_ADDRESS,
  CELO_CHAIN_ID,
  LEVELS,
  getLevelMeta,
  fmtVoxel,
  fmtCelo,
  voxelToCelo,
} from "@/lib/voxel";
import { useVoxel } from "@/hooks/useVoxel";
import { useMiniPay } from "@/hooks/useMiniPay";
import { WalletButton } from "@/components/WalletButton";

const TarotCanvas = dynamic(() => import("@/components/TarotCanvas"), { ssr: false });

type Phase = "choose" | "shuffling" | "picking" | "submitting" | "revealed";
type Outcome = { won: boolean; winningCard: number; reward: bigint; fee: bigint };

const ease = [0.16, 1, 0.3, 1] as const;

function parseRound(logs: readonly Log[]) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== VOXEL_ADDRESS.toLowerCase()) continue;
    try {
      const d = decodeEventLog({ abi: VOXEL_ABI, data: log.data, topics: log.topics });
      if (d.eventName === "RoundPlayed") return d.args as unknown as Outcome & { playerPick: number };
    } catch {
      /* not our event */
    }
  }
  return null;
}

const errMsg = (e: unknown) => {
  const m = (e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? "Transaction failed";
  return m.length > 120 ? m.slice(0, 120) + "…" : m;
};

export default function GameApp() {
  const { isMiniPay } = useMiniPay();
  const { isConnected } = useAccount();
  const v = useVoxel();
  const [modal, setModal] = useState<"deposit" | "withdraw" | "stats" | null>(null);
  const ready = isConnected && v.onCelo;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aura left-[12%] top-[-6%] h-[44vh] w-[44vh] bg-green/10" />
        <div className="aura right-[8%] top-[30%] h-[40vh] w-[40vh] bg-gold/6" />
        <div className="absolute inset-0 grid-veil opacity-50" />
      </div>

      <AppHeader v={v} ready={ready} onOpen={setModal} />

      <main className="mx-auto max-w-[920px] px-5 pb-24 pt-28 md:px-10">
        {!isConnected ? (
          <ConnectGate />
        ) : !v.onCelo ? (
          <NetworkGate />
        ) : (
          <Stage v={v} />
        )}
      </main>

      <AnimatePresence>
        {modal && ready && <WalletModal kind={modal} v={v} onClose={() => setModal(null)} />}
      </AnimatePresence>

      {isMiniPay && (
        <p className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-faint">
          MiniPay connected
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ header */
function AppHeader({
  v,
  ready,
  onOpen,
}: {
  v: ReturnType<typeof useVoxel>;
  ready: boolean;
  onOpen: (m: "deposit" | "withdraw" | "stats") => void;
}) {
  const items: { k: "deposit" | "withdraw" | "stats"; label: string }[] = [
    { k: "deposit", label: "Deposit" },
    { k: "withdraw", label: "Withdraw" },
    { k: "stats", label: "Record" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-4 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-green/30 bg-green/10 font-display font-bold text-green">
            V
          </span>
          <span className="font-display text-lg font-semibold">Voxel</span>
        </Link>

        {ready && (
          <nav className="flex items-center gap-1 rounded-full border border-edge bg-surface/50 p-1">
            {items.map((it) => (
              <button
                key={it.k}
                onClick={() => onOpen(it.k)}
                className="rounded-full px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-mute transition hover:bg-green/10 hover:text-green md:px-4 md:text-xs md:tracking-[0.15em]"
              >
                {it.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-3">
          {ready && (
            <div className="hidden items-center gap-2 rounded-full border border-edge bg-surface/60 px-4 py-2 font-mono text-xs lg:flex">
              <span className="text-green">{fmtVoxel(v.credits)}</span>
              <span className="text-faint">VOXEL</span>
              <span className="mx-1 text-edge">·</span>
              <span className="text-ink">{fmtCelo(v.celo?.value)}</span>
              <span className="text-faint">CELO</span>
            </div>
          )}
          <WalletButton size="sm" />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ gates */
function ConnectGate() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center pt-20 text-center">
      <div className="aura left-1/2 top-10 h-64 w-64 -translate-x-1/2 bg-green/15" />
      <p className="eyebrow mb-5">Enter the parlor</p>
      <h1 className="font-display text-5xl leading-tight">
        Connect to <span className="display-italic text-green">play</span>
      </h1>
      <p className="mt-5 max-w-sm text-mute">
        Voxel runs on Celo. Connect a wallet — or open inside MiniPay — to deposit, draw, and win.
      </p>
      <div className="mt-9">
        <WalletButton />
      </div>
    </div>
  );
}

function NetworkGate() {
  const { switchChain, isPending } = useSwitchChain();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center pt-20 text-center">
      <div className="aura left-1/2 top-10 h-64 w-64 -translate-x-1/2 bg-blood/12" />
      <p className="eyebrow mb-5">Almost there</p>
      <h1 className="font-display text-5xl">Wrong network</h1>
      <p className="mt-5 max-w-sm text-mute">
        Voxel lives on <span className="text-ink">Celo Mainnet</span>. Switch your wallet to continue.
      </p>
      <button
        onClick={() => switchChain({ chainId: CELO_CHAIN_ID })}
        disabled={isPending}
        className="mt-9 rounded-full bg-green px-9 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-void transition hover:bg-green-bright disabled:opacity-50"
      >
        {isPending ? "Switching…" : "Switch to Celo"}
      </button>
      <div className="mt-6">
        <WalletButton size="sm" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stage */
function Stage({ v }: { v: ReturnType<typeof useVoxel> }) {
  const [levelId, setLevelId] = useState<1 | 2 | 3 | null>(null);
  const [phase, setPhase] = useState<Phase>("choose");
  const [order, setOrder] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = useConfig();

  const level = levelId ? getLevelMeta(levelId) : null;
  const credits = v.credits ?? 0n;
  const canAfford = level ? credits >= BigInt(level.fee) : false;

  // Continuously shuffle the card slots while in the shuffling phase.
  useEffect(() => {
    if (phase !== "shuffling") return;
    const id = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
      });
    }, 360);
    return () => clearInterval(id);
  }, [phase]);

  const startRound = (id: 1 | 2 | 3) => {
    setLevelId(id);
    setOrder(Array.from({ length: getLevelMeta(id).cards }, (_, i) => i));
    setPicked(null);
    setOutcome(null);
    setError(null);
    setPhase("shuffling");
  };

  const reset = (full = false) => {
    setPicked(null);
    setOutcome(null);
    setError(null);
    if (full) {
      setLevelId(null);
      setPhase("choose");
    } else if (level) {
      setOrder(Array.from({ length: level.cards }, (_, i) => i));
      setPhase("shuffling");
    }
  };

  const play = async (index: number) => {
    if (!levelId || phase !== "picking" || !canAfford) return;
    setPicked(index);
    setPhase("submitting");
    setError(null);
    try {
      const { request } = await simulateContract(config, {
        address: VOXEL_ADDRESS,
        abi: VOXEL_ABI,
        functionName: "playRound",
        args: [levelId, index],
        account: v.address,
        chainId: CELO_CHAIN_ID,
      });
      const hash = await writeContract(config, request);
      const receipt = await waitForTransactionReceipt(config, { hash });
      const ev = parseRound(receipt.logs);
      if (ev) setOutcome({ won: ev.won, winningCard: Number(ev.winningCard), reward: ev.reward, fee: ev.fee });
      setPhase("revealed");
      v.refetchAll();
    } catch (e) {
      setError(errMsg(e));
      setPhase("picking");
      setPicked(null);
    }
  };

  if (!level) return <LevelPicker credits={credits} onPick={startRound} />;

  return (
    <section className="glass rounded-3xl p-6 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onClick={() => reset(true)} className="eyebrow mb-2 transition hover:text-ink">
            ← All levels
          </button>
          <h2 className="font-display text-3xl">{level.name}</h2>
        </div>
        <div className="flex gap-2 font-mono text-xs">
          <Pill label="Cards" value={`${level.cards}`} />
          <Pill label="Fee" value={`${level.fee} VX`} />
          <Pill label="Reward" value={`${level.reward} VX`} accent />
        </div>
      </div>

      {!canAfford && (
        <Notice tone="warn">
          You need {level.fee} VOXEL to play {level.name}. Deposit CELO in the panel
          {typeof window !== "undefined" && window.innerWidth < 1024 ? " below" : " on the right"}.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <Board
        order={order}
        interactive={phase === "picking" && canAfford}
        submitting={phase === "submitting"}
        revealed={phase === "revealed"}
        picked={picked}
        outcome={outcome}
        onPick={play}
      />

      <div className="mt-8 flex min-h-[56px] flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "shuffling" && (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={() => setPhase("picking")}
                disabled={!canAfford}
                className="animate-pulse-ring rounded-full bg-green px-10 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-void transition hover:bg-green-bright disabled:opacity-40"
              >
                Pilih Kartu
              </button>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-faint">
                Cards shuffling — tap to stop
              </p>
            </motion.div>
          )}
          {phase === "picking" && (
            <motion.p
              key="pick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono text-xs uppercase tracking-[0.25em] text-green"
            >
              Pick one card
            </motion.p>
          )}
          {phase === "submitting" && (
            <motion.p
              key="sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono text-sm text-mute"
            >
              Drawing on-chain…
            </motion.p>
          )}
          {phase === "revealed" && outcome && (
            <ResultBar outcome={outcome} onAgain={() => reset(false)} onChange={() => reset(true)} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function LevelPicker({ credits, onPick }: { credits: bigint; onPick: (id: 1 | 2 | 3) => void }) {
  const tone: Record<string, string> = {
    green: "hover:border-green/50 hover:shadow-[0_0_50px_-20px] hover:shadow-green",
    gold: "hover:border-gold/50 hover:shadow-[0_0_50px_-20px] hover:shadow-gold",
    blood: "hover:border-blood/50 hover:shadow-[0_0_50px_-20px] hover:shadow-blood",
  };
  const dot: Record<string, string> = { green: "text-green", gold: "text-gold", blood: "text-blood" };
  return (
    <section>
      <div className="mb-7">
        <p className="eyebrow mb-2">Choose your fate</p>
        <h2 className="font-display text-4xl">Pick a level</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((l, i) => {
          const ok = credits >= BigInt(l.fee);
          return (
            <motion.button
              key={l.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, ease, duration: 0.6 } }}
              onClick={() => onPick(l.id)}
              className={`glass group relative overflow-hidden rounded-3xl p-7 text-left transition ${tone[l.tone]}`}
            >
              <div className={`mb-6 font-mono text-xs uppercase tracking-widest ${dot[l.tone]}`}>{l.odds}</div>
              <h3 className="font-display text-3xl">{l.name}</h3>
              <p className="mt-2 text-sm text-mute">{l.blurb}</p>
              <div className="mt-7 flex items-end justify-between font-mono text-sm">
                <span className="text-mute">
                  {l.fee} <span className="text-faint">VX fee</span>
                </span>
                <span className={dot[l.tone]}>+{l.reward} VX</span>
              </div>
              {!ok && (
                <span className="mt-4 block font-mono text-[0.65rem] uppercase tracking-widest text-blood/80">
                  Deposit to unlock
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ board */
function Board({
  order,
  interactive,
  submitting,
  revealed,
  picked,
  outcome,
  onPick,
}: {
  order: number[];
  interactive: boolean;
  submitting: boolean;
  revealed: boolean;
  picked: number | null;
  outcome: Outcome | null;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {order.map((identity) => (
        <motion.div
          key={identity}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="w-[27%] max-w-[150px] sm:w-[140px]"
        >
          <PlayCard
            identity={identity}
            revealed={revealed}
            isWinner={outcome ? identity === outcome.winningCard : false}
            isPicked={picked === identity}
            won={outcome?.won ?? false}
            interactive={interactive}
            loading={submitting && picked === identity}
            onPick={() => onPick(identity)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function PlayCard({
  identity,
  revealed,
  isWinner,
  isPicked,
  won,
  interactive,
  loading,
  onPick,
}: {
  identity: number;
  revealed: boolean;
  isWinner: boolean;
  isPicked: boolean;
  won: boolean;
  interactive: boolean;
  loading: boolean;
  onPick: () => void;
}) {
  const ring = isPicked
    ? won && revealed
      ? "ring-2 ring-green"
      : revealed
        ? "ring-2 ring-blood"
        : "ring-2 ring-green/60"
    : "";

  return (
    <button
      onClick={interactive ? onPick : undefined}
      disabled={!interactive}
      style={{ perspective: 1000 }}
      className={`relative aspect-[2/3] w-full rounded-xl ${ring} ${
        interactive ? "cursor-pointer transition hover:-translate-y-1.5" : "cursor-default"
      }`}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.7, ease, delay: revealed ? identity * 0.06 : 0 }}
      >
        {/* back (face-down) — Voxel card art */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-green/20 bg-cover bg-center"
          style={{ backfaceVisibility: "hidden", backgroundImage: "url('/cardluar.png')" }}
        >
          {loading && (
            <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(240,71,106,0.14)" }} />
          )}
        </div>

        {/* front (revealed) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {isWinner ? (
            <div className="relative h-full w-full bg-gradient-to-b from-bone to-[#cfc6b4]">
              <TarotCanvas className="h-full w-full" target={2.4} />
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[0.55rem] uppercase tracking-[0.25em] text-void/70">
                Three of Swords
              </span>
            </div>
          ) : (
            <div className="h-full w-full bg-[#f4f4f2]" />
          )}
        </div>
      </motion.div>
    </button>
  );
}

function ResultBar({
  outcome,
  onAgain,
  onChange,
}: {
  outcome: Outcome;
  onAgain: () => void;
  onChange: () => void;
}) {
  return (
    <motion.div
      key="res"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="text-center">
        {outcome.won ? (
          <h3 className="font-display text-3xl text-green">
            You won +{fmtVoxel(outcome.reward)} VOXEL
          </h3>
        ) : (
          <h3 className="font-display text-3xl text-blood">Not this time</h3>
        )}
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-faint">
          {outcome.won ? "Reward credited to your balance" : `${fmtVoxel(outcome.fee)} VOXEL spent`}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAgain}
          className="rounded-full bg-green px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-void transition hover:bg-green-bright"
        >
          Play again
        </button>
        <button
          onClick={onChange}
          className="rounded-full border border-edge px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-mute transition hover:text-ink"
        >
          Change level
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ wallet modal */
function WalletModal({
  kind,
  v,
  onClose,
}: {
  kind: "deposit" | "withdraw" | "stats";
  v: ReturnType<typeof useVoxel>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-1 z-20 grid h-9 w-9 place-items-center rounded-full border border-edge bg-surface text-mute transition hover:border-green/40 hover:text-ink"
        >
          ✕
        </button>
        {kind === "stats" ? (
          <div className="flex flex-col gap-4">
            <BalanceCard v={v} />
            <StatsCard v={v} />
          </div>
        ) : (
          <DepositWithdraw v={v} initialTab={kind} />
        )}
      </motion.div>
    </div>
  );
}

function BalanceCard({ v }: { v: ReturnType<typeof useVoxel> }) {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6">
      <div className="aura right-[-20%] top-[-30%] h-40 w-40 bg-green/15" />
      <p className="eyebrow">Your credits</p>
      <p className="mt-2 font-display text-5xl text-green">{fmtVoxel(v.credits)}</p>
      <p className="mt-1 font-mono text-xs text-faint">
        ≈ {voxelToCelo(v.credits ?? 0n, v.rate).toFixed(3)} CELO redeemable
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-edge pt-4 font-mono text-sm">
        <span className="text-mute">Wallet</span>
        <span className="text-ink">{fmtCelo(v.celo?.value)} CELO</span>
      </div>
    </div>
  );
}

function DepositWithdraw({
  v,
  initialTab = "deposit",
}: {
  v: ReturnType<typeof useVoxel>;
  initialTab?: "deposit" | "withdraw";
}) {
  const [tab, setTab] = useState<"deposit" | "withdraw">(initialTab);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3600);
    return () => clearTimeout(t);
  }, [msg]);

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const submit = async () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    setBusy(true);
    setMsg(null);
    try {
      let hash: `0x${string}`;
      if (tab === "deposit") {
        hash = await writeContractAsync({
          address: VOXEL_ADDRESS,
          abi: VOXEL_ABI,
          functionName: "depositCELO",
          chainId: CELO_CHAIN_ID,
          value: parseEther(amount),
        });
      } else {
        hash = await writeContractAsync({
          address: VOXEL_ADDRESS,
          abi: VOXEL_ABI,
          functionName: "withdraw",
          chainId: CELO_CHAIN_ID,
          args: [BigInt(Math.floor(val))],
        });
      }
      await waitForTransactionReceipt(config, { hash });
      setOk(true);
      setMsg(tab === "deposit" ? "Deposit confirmed" : "Withdrawal confirmed");
      setAmount("");
      v.refetchAll();
    } catch (e) {
      setOk(false);
      setMsg(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const preview =
    tab === "deposit"
      ? amount && Number(amount) > 0
        ? `→ ${(Number(amount) * Number(v.rate)).toLocaleString()} VOXEL`
        : "1 CELO = 1000 VOXEL"
      : amount && Number(amount) > 0
        ? `→ ${voxelToCelo(BigInt(Math.floor(Number(amount) || 0)), v.rate).toFixed(3)} CELO`
        : "Redeem VOXEL for CELO";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-5 flex gap-1 rounded-full border border-edge p-1">
        {(["deposit", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setAmount("");
              setMsg(null);
            }}
            className={`flex-1 rounded-full py-2 font-mono text-xs uppercase tracking-[0.18em] transition ${
              tab === t ? "bg-green text-void" : "text-mute hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="eyebrow mb-2 block">{tab === "deposit" ? "CELO amount" : "VOXEL amount"}</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        inputMode="decimal"
        placeholder="0.0"
        className="w-full rounded-xl border border-edge bg-void/60 px-4 py-3 font-mono text-lg text-ink outline-none transition focus:border-green/50"
      />
      <p className="mt-2 font-mono text-xs text-faint">{preview}</p>

      <button
        onClick={submit}
        disabled={busy || !amount || Number(amount) <= 0}
        className="mt-5 w-full rounded-xl bg-green py-3 font-mono text-sm uppercase tracking-[0.2em] text-void transition hover:bg-green-bright disabled:opacity-40"
      >
        {busy ? "Confirming…" : tab === "deposit" ? "Deposit CELO" : "Withdraw"}
      </button>
      <AnimatePresence>
        {msg && <Toast key={msg} msg={msg} ok={ok} onClose={() => setMsg(null)} />}
      </AnimatePresence>
    </div>
  );
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  const accent = ok ? "#ff5d86" : "#e23d4b";
  return (
    <motion.div
      initial={{ y: -28, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -22, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="fixed left-1/2 top-6 z-[80] -translate-x-1/2"
    >
      <button
        onClick={onClose}
        className="relative flex max-w-[min(90vw,440px)] items-center gap-3 overflow-hidden rounded-2xl border bg-void/85 px-4 py-3 text-left backdrop-blur-xl"
        style={{ borderColor: `${accent}55`, boxShadow: `0 18px 50px -16px ${accent}66, 0 0 0 1px ${accent}22` }}
      >
        <motion.span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: `${accent}22`, color: accent }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 500, damping: 16 }}
        >
          {ok ? (
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </motion.span>
        <span className="font-mono text-xs leading-snug tracking-wide text-ink">{msg}</span>
        <motion.span
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left"
          style={{ background: accent }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 3.6, ease: "linear" }}
        />
      </button>
    </motion.div>
  );
}

function StatsCard({ v }: { v: ReturnType<typeof useVoxel> }) {
  const s = v.stats;
  const played = Number(s?.totalPlayed ?? 0n);
  const wins = Number(s?.totalWins ?? 0n);
  const rate = played ? Math.round((wins / played) * 100) : 0;
  return (
    <div className="glass rounded-3xl p-6">
      <p className="eyebrow mb-4">Your record</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Played" value={played} />
        <Stat label="Wins" value={wins} accent />
        <Stat label="Win %" value={`${rate}`} />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-edge pt-4 font-mono text-xs">
        <span className="text-mute">Prize pool</span>
        <span className="text-gold">{fmtCelo(v.liquidity)} CELO</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ atoms */
function Pill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="rounded-full border border-edge bg-void/40 px-3 py-1.5">
      <span className="text-faint">{label} </span>
      <span className={accent ? "text-green" : "text-ink"}>{value}</span>
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl ${accent ? "text-green" : "text-ink"}`}>{value}</div>
      <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-faint">{label}</div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "error"; children: React.ReactNode }) {
  const c = tone === "error" ? "border-blood/40 text-blood" : "border-gold/40 text-gold";
  return <div className={`mb-5 rounded-xl border ${c} bg-void/40 px-4 py-3 text-sm`}>{children}</div>;
}
