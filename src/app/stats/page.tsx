"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useStatsStore } from "@/engine/stats";
import { useWalletStore } from "@/engine/wallet";
import { usePnLStore } from "@/engine/pnlHistory";
import { ACHIEVEMENTS, useAchievementStore } from "@/engine/achievements";
import { useDailyLoginStore } from "@/engine/dailyLogin";
import SparklineChart from "@/components/ui/SparklineChart";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";
import { useCustomizeStore } from "@/engine/customize/store";
import { activateSocial, subscribeSocial } from "@/engine/mus/social";
import { useMusStatsStore, type MusStats } from "@/engine/mus/stats";
import { LANCES, LANCE_LABEL, type Lance } from "@/engine/mus/types";

function pct(num: number, den: number): string {
  if (den === 0) return "—";
  return Math.round((num / den) * 100) + "%";
}

function rating(stats: MusStats) { return stats.elo ?? 1000; }
function ratingName(elo: number) {
  if (elo >= 1200) return "Maestro";
  if (elo >= 1100) return "Experto";
  if (elo >= 1020) return "Jugador";
  return "Aprendiz";
}

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useDarkMode();
  const { bj, poker, slots, resetStats } = useStatsStore();
  const mus = useMusStatsStore();
  const walletBalance = useWalletStore((s) => s.balance);
  const unlockedIds = useAchievementStore((s) => s.unlockedIds);
  const dailyStreak = useDailyLoginStore((s) => s.streak);
  const pnlEntries = usePnLStore((s) => s.entries);
  const { username, setUsername, friends, addFriend, removeFriend } = useCustomizeStore();
  const [friendName, setFriendName] = useState("");
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [friendMusStats, setFriendMusStats] = useState<Map<string, MusStats>>(new Map());
  useEffect(() => { if (username) void activateSocial(username); return subscribeSocial((online, _, sharedMusStats) => { setOnlineFriends(online); setFriendMusStats(sharedMusStats); }); }, [username]);
  const bjAccuracy = bj.totalDecisions > 0
    ? Math.round((bj.correctDecisions / bj.totalDecisions) * 100) : null;
  const bjWinRate = bj.handsPlayed > 0
    ? Math.round((bj.wins / bj.handsPlayed) * 100) : null;

  const pokerWinRate = poker.handsPlayed > 0
    ? Math.round((poker.wins / poker.handsPlayed) * 100) : null;
  const vpip = poker.handsPlayed > 0
    ? Math.round((poker.vpipHands / poker.handsPlayed) * 100) : null;
  const pfr = poker.handsPlayed > 0
    ? Math.round((poker.pfrCount / poker.handsPlayed) * 100) : null;
  const wtsd = poker.handsPlayed > 0
    ? Math.round((poker.showdowns / poker.handsPlayed) * 100) : null;
  const wsd = poker.showdowns > 0
    ? Math.round((poker.showdownWins / poker.showdowns) * 100) : null;

  const pokerFoldTotal = poker.foldPreflop + poker.foldPostflop;
  const foldPreflopPct = pokerFoldTotal > 0 ? Math.round((poker.foldPreflop / pokerFoldTotal) * 100) : 0;
  const foldPostflopPct = pokerFoldTotal > 0 ? Math.round((poker.foldPostflop / pokerFoldTotal) * 100) : 0;

  const netChips = poker.totalChipsWon - poker.totalChipsLost;
  const musWinRate = mus.gamesPlayed > 0 ? Math.round((mus.gamesWon / mus.gamesPlayed) * 100) : null;
  const musHandWinRate = mus.handsPlayed > 0 ? Math.round((mus.handsWon / mus.handsPlayed) * 100) : null;
  const musRanking = [
    { username: username || "Tú", stats: mus, self: true },
    ...friends.filter((friend) => onlineFriends.has(friend)).map((friend) => ({ username: friend, stats: friendMusStats.get(friend), self: false })),
  ].filter((entry): entry is { username: string; stats: MusStats; self: boolean } => !!entry.stats).sort((a, b) => rating(b.stats) - rating(a.stats) || (b.stats.rankedWins ?? 0) - (a.stats.rankedWins ?? 0));

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
        {!mounted ? (
          <div className="flex justify-center py-20">
            <span className="text-muted text-sm animate-pulse">Loading...</span>
          </div>
        ) : (
        <div className="max-w-lg mx-auto flex flex-col gap-8 sm:gap-10">
          <Section title="Amigos" delay={0.02}>
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <label className="text-xs text-muted">Tu usuario de Mus</label>
              <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 16))} placeholder="tu_usuario" className="rounded-lg border border-border px-3 py-2 text-sm bg-transparent outline-none" />
              <div className="flex gap-2 pt-1"><input value={friendName} onChange={(e) => setFriendName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 16))} placeholder="Añadir por usuario" className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-transparent outline-none" /><button onClick={() => { addFriend(friendName); setFriendName(""); }} className="rounded-lg bg-foreground px-3 text-xs text-background">Añadir</button></div>
              {friends.length === 0 ? <span className="text-xs text-muted">Aún no tienes amigos.</span> : friends.map((friend) => { const isOnline = onlineFriends.has(friend); return <div key={friend} className="flex items-center gap-2 text-sm py-1"><span className={`h-2 w-2 rounded-full ${isOnline ? "bg-correct" : "bg-muted"}`} /><span className="flex-1">@{friend}</span><span className="text-[10px] text-muted">{isOnline ? "Online" : "Offline"}</span><button onClick={() => removeFriend(friend)} className="text-muted">×</button></div>; })}
            </div>
          </Section>
          <Section title="Mus" delay={0.07}>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="ELO privado" value={mus.elo.toString()} color="text-correct" />
              <StatCard label="Victoria" value={musWinRate === null ? "—" : `${musWinRate}%`} color={musWinRate !== null && musWinRate >= 50 ? "text-correct" : undefined} />
              <StatCard label="Ranked" value={`${mus.rankedWins}/${mus.rankedGames}`} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Manos" value={mus.handsPlayed.toString()} small />
              <StatCard label="Manos ganadas" value={musHandWinRate === null ? "—" : `${musHandWinRate}%`} small />
              <StatCard label="Piedras" value={mus.stonesWon.toString()} small />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"><span className="text-xs text-muted">Órdagos ganados</span><span className="text-sm font-semibold tabular-nums">{mus.ordagosWon}</span></div>
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <span className="text-[10px] uppercase tracking-widest text-muted">Rendimiento por lance</span>
              {LANCES.map((lance: Lance) => { const stat = mus.lances?.[lance] ?? { played: 0, won: 0, stones: 0 }; return <div key={lance} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs"><span>{LANCE_LABEL[lance]}</span><span className="text-muted">{stat.won}/{stat.played}</span><span className="tabular-nums">+{stat.stones} piedras</span></div>; })}
            </div>
          </Section>
          <Section title="Ranking de amigos · Mus" delay={0.09}>
            <div className="flex flex-col overflow-hidden rounded-xl border border-border">
              {musRanking.map((entry, index) => { const elo = rating(entry.stats); return <div key={entry.username} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0"><span className="w-4 text-xs text-muted">{index + 1}</span><span className={`h-2 w-2 rounded-full ${entry.self || onlineFriends.has(entry.username) ? "bg-correct" : "bg-muted"}`} /><span className="flex-1 text-sm">{entry.self ? "Tú" : `@${entry.username}`} <span className="text-[10px] text-muted">{ratingName(elo)}</span></span><span className="text-xs font-medium tabular-nums">{elo} ELO</span></div>; })}
              {musRanking.length === 1 && <span className="px-3 py-3 text-xs text-muted">Solo aparecen tus amigos que estén conectados. Cread una sala de 4 y elegid «Con ELO» para competir.</span>}
            </div>
          </Section>
          {/* ─── Portfolio Hero (Robinhood style) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {pnlEntries.length >= 2 ? (
              <PnLHero entries={pnlEntries} currentBalance={walletBalance} />
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Portfolio</span>
                <span className="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight">
                  ${walletBalance.toLocaleString()}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted">$0.00</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted/10 text-muted font-medium">0.0%</span>
                </div>
                <div className="h-[140px] flex items-center justify-center border border-dashed border-border rounded-xl mt-3">
                  <span className="text-xs text-muted">Play some hands to see your chart</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* ─── Blackjack ─── */}
          <Section title="Blackjack" delay={0.1}>
            {bj.handsPlayed === 0 ? (
              <p className="text-xs text-muted text-center">No hands played yet</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Key metrics row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Hands" value={bj.handsPlayed.toString()} />
                  <StatCard label="Win Rate" value={bjWinRate !== null ? bjWinRate + "%" : "—"} color={bjWinRate !== null && bjWinRate >= 45 ? "text-correct" : undefined} />
                  <StatCard label="Accuracy" value={bjAccuracy !== null ? bjAccuracy + "%" : "—"} color={bjAccuracy !== null ? (bjAccuracy >= 90 ? "text-correct" : bjAccuracy >= 70 ? "text-foreground" : "text-accent") : undefined} />
                </div>
                {/* Detail row */}
                <div className="grid grid-cols-4 gap-2">
                  <StatCard label="Wins" value={bj.wins.toString()} small />
                  <StatCard label="Losses" value={bj.losses.toString()} small />
                  <StatCard label="Pushes" value={bj.pushes.toString()} small />
                  <StatCard label="BJ" value={bj.blackjacks.toString()} small />
                </div>
                {/* Decisions */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <span className="text-xs text-muted">Correct decisions</span>
                  <span className="text-xs font-semibold tabular-nums">{bj.correctDecisions} / {bj.totalDecisions}</span>
                </div>
              </div>
            )}
          </Section>

          {/* ─── Poker ─── */}
          <Section title="Poker" delay={0.15}>
            {poker.handsPlayed === 0 ? (
              <p className="text-xs text-muted text-center">No hands played yet</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Hands" value={poker.handsPlayed.toString()} />
                  <StatCard label="Win Rate" value={pokerWinRate !== null ? pokerWinRate + "%" : "—"} color={pokerWinRate !== null && pokerWinRate >= 30 ? "text-correct" : undefined} />
                  <StatCard label="Net P/L" value={(netChips >= 0 ? "+" : "") + netChips.toLocaleString()} color={netChips >= 0 ? "text-correct" : "text-accent"} />
                </div>
                {/* Poker-specific stats (inspired by poker tracker) */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="VPIP" value={vpip !== null ? vpip + "%" : "—"} small hint="Voluntarily Put $ In Pot" />
                  <StatCard label="PFR" value={pfr !== null ? pfr + "%" : "—"} small hint="Pre-Flop Raise %" />
                  <StatCard label="AFq" value={poker.handsPlayed > 0 ? Math.round(((poker.handsPlayed - poker.folds) / poker.handsPlayed) * 100) + "%" : "—"} small hint="Aggression Frequency" />
                </div>
                {/* Showdown stats */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="WTSD" value={wtsd !== null ? wtsd + "%" : "—"} small hint="Went To Showdown" />
                  <StatCard label="WSD" value={wsd !== null ? wsd + "%" : "—"} small hint="Won at Showdown" />
                  <StatCard label="All-in" value={poker.allInCount.toString()} small />
                </div>
                {/* Fold frequency */}
                <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg border border-border">
                  <span className="text-xs text-muted font-medium">Fold Frequency</span>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <RingChart pct={foldPreflopPct} size={40} />
                      <span className="text-[9px] text-muted">Preflop</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <RingChart pct={foldPostflopPct} size={40} />
                      <span className="text-[9px] text-muted">Postflop</span>
                    </div>
                  </div>
                </div>
                {/* Extra */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <span className="text-xs text-muted">Biggest pot won</span>
                  <span className="text-xs font-semibold tabular-nums">{poker.biggestPot.toLocaleString()}</span>
                </div>
              </div>
            )}
          </Section>

          {/* ─── Slots ─── */}
          {slots.totalSpins > 0 && (
            <Section title="Slots" delay={0.2}>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Spins" value={slots.totalSpins.toString()} />
                <StatCard label="Won" value={slots.totalWon.toLocaleString()} />
                <StatCard label="Jackpots" value={slots.jackpots.toString()} />
              </div>
            </Section>
          )}

          {/* ─── Streaks ─── */}
          <Section title="Streaks" delay={0.22}>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="BJ Streak" value={bj.currentStreak.toString()} small hint="Current correct decisions in a row" />
              <StatCard label="Best" value={bj.bestStreak.toString()} small hint="Best BJ decision streak" />
              <StatCard label="Daily Login" value={dailyStreak.toString()} small hint="Consecutive daily logins" />
            </div>
            {bj.currentStreak >= 5 && (
              <div className="px-3 py-2 rounded-lg border border-correct/30 bg-correct/5 text-center">
                <span className="text-xs font-semibold text-correct">
                  XP Multiplier: x{bj.currentStreak >= 25 ? 4 : bj.currentStreak >= 10 ? 3 : 2}
                </span>
                <span className="text-[10px] text-muted ml-1">
                  ({bj.currentStreak} correct in a row)
                </span>
              </div>
            )}
          </Section>

          {/* ─── Achievements ─── */}
          <Section title={`Achievements (${unlockedIds.length}/${ACHIEVEMENTS.length})`} delay={0.25}>
            <div className="flex flex-col gap-1.5">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = unlockedIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      unlocked ? "border-correct/30 bg-correct/5" : "border-border opacity-50"
                    }`}
                  >
                    <span className={`text-xl ${unlocked ? "" : "grayscale"}`}>{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold block">{a.name}</span>
                      <span className="text-[10px] text-muted">{a.description}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] text-amber-500 font-medium">+{a.reward}</span>
                      {a.gemReward && <span className="text-[10px] text-blue-500 font-medium">+{a.gemReward}◆</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Reset */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col gap-2">
            <button
              onClick={() => { if (confirm("Reset all statistics? This cannot be undone.")) resetStats(); }}
              className="w-full py-2.5 text-xs text-muted hover:text-accent border border-border hover:border-accent rounded-lg transition-colors uppercase tracking-widest"
            >
              Reset Statistics
            </button>
            <button
              onClick={() => {
                if (confirm("Reset EVERYTHING? This will reset your balance to $10,000 and clear all statistics. This cannot be undone.")) {
                  resetStats();
                  useWalletStore.getState().rebuy();
                }
              }}
              className="w-full py-2.5 text-xs text-muted hover:text-accent border border-border hover:border-accent rounded-lg transition-colors uppercase tracking-widest"
            >
              Reset Account
            </button>
          </motion.div>
        </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-3">
      <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </motion.section>
  );
}

function StatCard({ label, value, color, small, hint }: { label: string; value: string; color?: string; small?: boolean; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg border border-border" title={hint}>
      <span className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider">{label}</span>
      <span className={`${small ? "text-sm sm:text-base" : "text-lg sm:text-xl"} font-semibold tabular-nums leading-none ${color || ""}`}>
        {value}
      </span>
    </div>
  );
}

type TimeFilter = "all" | "50" | "20";

function PnLHero({ entries, currentBalance }: { entries: { timestamp: number; balance: number; game: string }[]; currentBalance: number }) {
  const [filter, setFilter] = useState<TimeFilter>("all");

  const allBalances = entries.map((e) => e.balance);
  const filtered = filter === "all" ? allBalances : allBalances.slice(-parseInt(filter));
  const chartData = filtered.length >= 2 ? filtered : allBalances;

  const startBal = chartData[0];
  const endBal = currentBalance;
  const peak = Math.max(...chartData);
  const low = Math.min(...chartData);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted font-medium px-1">Portfolio</span>

      {/* Interactive chart with balance hero built-in */}
      <SparklineChart data={chartData} height={160} />

      {/* Time filter pills */}
      <div className="flex items-center gap-1.5 mt-2 px-1">
        {([
          { id: "20" as TimeFilter, label: "Last 20" },
          { id: "50" as TimeFilter, label: "Last 50" },
          { id: "all" as TimeFilter, label: "All" },
        ]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full transition-colors ${
              filter === f.id
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-muted tabular-nums">{chartData.length} hands</span>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg border border-border">
          <span className="text-[9px] text-muted uppercase tracking-wider">High</span>
          <span className="text-sm font-semibold tabular-nums text-correct">${peak.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg border border-border">
          <span className="text-[9px] text-muted uppercase tracking-wider">Low</span>
          <span className="text-sm font-semibold tabular-nums text-accent">${low.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg border border-border">
          <span className="text-[9px] text-muted uppercase tracking-wider">Start</span>
          <span className="text-sm font-semibold tabular-nums">${startBal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function RingChart({ pct, size }: { pct: number; size: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-foreground)" strokeWidth={3} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}
