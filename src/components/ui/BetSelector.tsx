"use client";

import { useGameStore } from "@/engine/store";

const PRESETS = [25, 50, 100, 250, 500];

export default function BetSelector() {
  const { currentBet, balance, setBet } = useGameStore();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Current bet display */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBet(Math.max(10, currentBet - 25))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors text-lg leading-none"
        >
          -
        </button>
        <span className="text-2xl sm:text-3xl font-light tabular-nums w-28 text-center">
          ${currentBet}
        </span>
        <button
          onClick={() => setBet(Math.min(balance, currentBet + 25))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex gap-2">
        {PRESETS.map((amount) => (
          <button
            key={amount}
            onClick={() => setBet(amount)}
            disabled={amount > balance}
            className={`px-2.5 py-1 text-xs tabular-nums rounded-full border transition-colors ${
              currentBet === amount
                ? "border-foreground bg-foreground text-background"
                : amount > balance
                ? "border-border text-border cursor-not-allowed"
                : "border-border text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}
