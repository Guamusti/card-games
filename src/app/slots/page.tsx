"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useWalletStore } from "@/engine/wallet";
import { useStatsStore } from "@/engine/stats";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";

const STORAGE_KEY = "card-trainer-slots";

const SYMBOLS = ["7", "BAR", "♦", "♣", "♥", "♠", "★", "A", "K", "Q"];
const WEIGHTS = [1, 2, 3, 3, 3, 3, 2, 4, 4, 4]; // 7 is rarest

const PAYOUTS: Record<string, number> = {
  "7-7-7": 5000,    // Jackpot
  "★-★-★": 1000,
  "BAR-BAR-BAR": 500,
  "♥-♥-♥": 200,
  "♦-♦-♦": 200,
  "♣-♣-♣": 200,
  "♠-♠-♠": 200,
  "A-A-A": 100,
  "K-K-K": 75,
  "Q-Q-Q": 50,
};

const MAX_DAILY_TICKETS = 5;

function getTicketData(): { count: number; lastDate: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { count: MAX_DAILY_TICKETS, lastDate: "" };
}

function saveTicketData(count: number, date: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lastDate: date })); } catch { /* ignore */ }
}

function pickSymbol(): string {
  const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

export default function SlotsPage() {
  const [mounted, setMounted] = useState(false);
  const { dark, toggle } = useDarkMode();
  const { balance, addChips } = useWalletStore();
  const { recordSlotSpin } = useStatsStore();

  const [tickets, setTickets] = useState(0);
  const [reels, setReels] = useState(["★", "★", "★"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ amount: number; isJackpot: boolean } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().slice(0, 10);
    const data = getTicketData();
    if (data.lastDate !== today) {
      setTickets(MAX_DAILY_TICKETS);
      saveTicketData(MAX_DAILY_TICKETS, today);
    } else {
      setTickets(data.count);
    }
  }, []);

  const spin = useCallback(() => {
    if (spinning || tickets <= 0) return;

    setSpinning(true);
    setResult(null);

    const newTickets = tickets - 1;
    setTickets(newTickets);
    const today = new Date().toISOString().slice(0, 10);
    saveTicketData(newTickets, today);

    // Animate reels
    let frame = 0;
    const totalFrames = 20;
    const finalReels = [pickSymbol(), pickSymbol(), pickSymbol()];

    const interval = setInterval(() => {
      frame++;
      const current = [
        frame >= totalFrames - 6 ? finalReels[0] : pickSymbol(),
        frame >= totalFrames - 3 ? finalReels[1] : pickSymbol(),
        frame >= totalFrames ? finalReels[2] : pickSymbol(),
      ];
      setReels(current);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setReels(finalReels);

        const key = finalReels.join("-");
        const payout = PAYOUTS[key] || 0;
        const allSame = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
        const twoPair = finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2];
        const finalPayout = payout > 0 ? payout : (allSame ? 25 : (twoPair ? 10 : 0));
        const isJackpot = key === "7-7-7";

        if (finalPayout > 0) {
          addChips(finalPayout);
        }

        recordSlotSpin(finalPayout, isJackpot);
        setResult({ amount: finalPayout, isJackpot });
        setSpinning(false);
      }
    }, 80);
  }, [spinning, tickets, addChips, recordSlotSpin]);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6 sm:gap-8">
        {!mounted ? (
          <span className="text-muted text-sm animate-pulse">Loading...</span>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-1">
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Daily Spin</h1>
              <p className="text-xs sm:text-sm text-muted">
                {tickets} ticket{tickets !== 1 ? "s" : ""} remaining today
              </p>
            </motion.div>

            {/* Reels */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 sm:gap-3"
            >
              {reels.map((symbol, i) => (
                <div
                  key={i}
                  className={`w-20 h-24 sm:w-24 sm:h-28 flex items-center justify-center rounded-xl border-2 ${
                    spinning ? "border-muted" : "border-foreground"
                  } bg-surface text-2xl sm:text-3xl font-bold transition-colors ${
                    spinning ? "animate-pulse" : ""
                  }`}
                >
                  {symbol}
                </div>
              ))}
            </motion.div>

            {/* Result */}
            <div className="h-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key={result.amount}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    {result.amount > 0 ? (
                      <span className={`text-lg sm:text-xl font-bold ${result.isJackpot ? "text-correct" : "text-foreground"}`}>
                        {result.isJackpot ? "JACKPOT! " : ""}+${result.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">No match — try again!</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spin button */}
            <button
              onClick={spin}
              disabled={spinning || tickets <= 0}
              className="px-10 py-3.5 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:border-border disabled:text-border disabled:cursor-not-allowed transition-colors rounded-lg"
            >
              {tickets <= 0 ? "Come Back Tomorrow" : spinning ? "Spinning..." : "Spin"}
            </button>

            {/* Tickets visual */}
            <div className="flex gap-2">
              {Array.from({ length: MAX_DAILY_TICKETS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < tickets ? "bg-foreground" : "bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Paytable toggle */}
            <button
              onClick={() => setShowPaytable(!showPaytable)}
              className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest"
            >
              {showPaytable ? "Hide" : "Show"} Paytable
            </button>

            <AnimatePresence>
              {showPaytable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-xs overflow-hidden"
                >
                  <div className="flex flex-col gap-1 p-3 rounded-xl border border-border">
                    {Object.entries(PAYOUTS).map(([combo, payout]) => (
                      <div key={combo} className="flex items-center justify-between text-xs">
                        <span className="font-mono tracking-wider">{combo.split("-").join(" ")}</span>
                        <span className={`font-semibold tabular-nums ${payout >= 5000 ? "text-correct" : ""}`}>
                          ${payout.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-xs border-t border-border pt-1 mt-1">
                      <span className="text-muted">Any triple</span>
                      <span className="font-semibold tabular-nums">$25</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Any pair</span>
                      <span className="font-semibold tabular-nums">$10</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
