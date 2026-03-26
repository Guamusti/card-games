"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useStatsStore } from "@/engine/stats";
import { useWalletStore } from "@/engine/wallet";
import { usePnLStore } from "@/engine/pnlHistory";
import { ACHIEVEMENTS, useAchievementStore } from "@/engine/achievements";
import { useDailyLoginStore } from "@/engine/dailyLogin";
import { useCustomizeStore } from "@/engine/customize/store";
import SparklineChart from "@/components/ui/SparklineChart";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";

function pct(num: number, den: number): string {
  if (den === 0) return "—";
  return Math.round((num / den) * 100) + "%";
}

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { dark, toggle } = useDarkMode();
  const { bj, poker, slots, resetStats } = useStatsStore();
  const walletBalance = useWalletStore((s) => s.balance);
  const unlockedIds = useAchievementStore((s) => s.unlockedIds);
  const dailyStreak = useDailyLoginStore((s) => s.streak);
  const pnlEntries = usePnLStore((s) => s.entries);
  const { nickname, setNickname, autoDealDelay, setAutoDealDelay, showProbabilities, setShowProbabilities, animationSpeed, setAnimationSpeed, hapticFeedback, setHapticFeedback } = useCustomizeStore();

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
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-1">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Statistics</h1>
          </motion.div>

          {/* ─── Bankroll ─── */}
          <Section title="Bankroll" delay={0.05}>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-light tabular-nums">${walletBalance.toLocaleString()}</span>
            </div>
          </Section>

          {/* ─── Session P&L ─── */}
          <Section title="Session P&L" delay={0.07}>
            {pnlEntries.length === 0 ? (
              <p className="text-xs text-muted text-center">Play some hands to see your P&L chart</p>
            ) : (() => {
              const balances = pnlEntries.map((e) => e.balance);
              const startBal = balances[0];
              const currentBal = balances[balances.length - 1];
              const sessionPL = currentBal - startBal;
              const peak = Math.max(...balances);
              const low = Math.min(...balances);
              return (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-border p-2">
                    <SparklineChart data={balances} height={120} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard
                      label="Session P/L"
                      value={(sessionPL >= 0 ? "+$" : "-$") + Math.abs(sessionPL).toLocaleString()}
                      color={sessionPL >= 0 ? "text-correct" : "text-accent"}
                    />
                    <StatCard label="Peak" value={"$" + peak.toLocaleString()} small />
                    <StatCard label="Low" value={"$" + low.toLocaleString()} small />
                  </div>
                </div>
              );
            })()}
          </Section>

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

          {/* ─── Settings ─── */}
          <Section title="Settings" delay={0.28}>
            <div className="flex flex-col gap-3">
              {/* Nickname */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                <span className="text-xs text-muted">Nickname</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                  placeholder="Player"
                  maxLength={16}
                  className="text-xs font-semibold text-right bg-transparent border-none outline-none w-28 placeholder:text-border"
                />
              </div>
              {/* Auto-deal */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Auto-deal</span>
                  <span className="text-[9px] text-border">Auto next hand after settling</span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => setAutoDealDelay(s)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                        autoDealDelay === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:border-foreground"
                      }`}
                    >
                      {s === 0 ? "Off" : `${s}s`}
                    </button>
                  ))}
                </div>
              </div>
              {/* Show probabilities */}
              <ToggleRow label="Show win probabilities" hint="BJ action button peek" value={showProbabilities} onChange={setShowProbabilities} />
              {/* Haptic feedback */}
              <ToggleRow label="Haptic feedback" hint="Vibration on actions" value={hapticFeedback} onChange={setHapticFeedback} />
              {/* Animation speed */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                <span className="text-xs text-muted">Animation speed</span>
                <div className="flex gap-1">
                  {(["slow", "normal", "fast"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAnimationSpeed(s)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border capitalize transition-colors ${
                        animationSpeed === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
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

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
      <div className="flex flex-col">
        <span className="text-xs text-muted">{label}</span>
        {hint && <span className="text-[9px] text-border">{hint}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-correct" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "left-5" : "left-0.5"}`} />
      </button>
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
