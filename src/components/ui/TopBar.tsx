"use client";

import { useGameStore } from "@/engine/store";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function TopBar() {
  const balance = useGameStore((s) => s.balance);
  const currentBet = useGameStore((s) => s.currentBet);
  const { dark, toggle } = useDarkMode();

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border safe-top">
      <span className="text-sm font-semibold tracking-tight">BJ</span>

      <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm tabular-nums">
        <span className="text-muted">
          Bet <span className="text-foreground font-medium">${currentBet}</span>
        </span>
        <span className="text-muted">
          <span className="text-foreground font-medium">${balance.toLocaleString()}</span>
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
