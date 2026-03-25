"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGameStore } from "@/engine/store";
import { useWalletStore } from "@/engine/wallet";
import { useStatsStore } from "@/engine/stats";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function TopBar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const walletBalance = useWalletStore((s) => s.balance);
  const currentBet = useGameStore((s) => s.currentBet);
  const bjStats = useStatsStore((s) => s.bj);
  const { dark, toggle } = useDarkMode();

  const accuracy = bjStats.totalDecisions > 0
    ? Math.round((bjStats.correctDecisions / bjStats.totalDecisions) * 100)
    : null;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border safe-top">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors group"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </Link>

      <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm tabular-nums">
        {mounted && accuracy !== null && (
          <span className={`font-medium ${accuracy >= 90 ? "text-correct" : accuracy >= 70 ? "text-foreground" : "text-accent"}`} title={`${bjStats.correctDecisions}/${bjStats.totalDecisions} correct · ${bjStats.handsPlayed} hands · ${bjStats.wins}W ${bjStats.losses}L`}>
            {accuracy}%
          </span>
        )}
        <span className="text-muted">
          Bet <span className="text-foreground font-medium">${mounted ? currentBet : "—"}</span>
        </span>
        <span className="text-muted">
          <span className="text-foreground font-medium">${mounted ? walletBalance.toLocaleString() : "—"}</span>
        </span>
        <button
          onClick={toggle}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
          aria-label="Toggle theme"
        >
          <span className="text-xs">{dark ? "L" : "D"}</span>
        </button>
      </div>
    </div>
  );
}
