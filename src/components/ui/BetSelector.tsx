"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/engine/store";
import { useWalletStore } from "@/engine/wallet";

const PRESETS = [25, 50, 100, 250, 500];

export default function BetSelector() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { currentBet, setBet, numHands, setNumHands } = useGameStore();
  const { balance, rebuy } = useWalletStore();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-light tabular-nums w-28 text-center">—</span>
        </div>
      </div>
    );
  }

  if (balance <= 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-muted">Out of chips</span>
        <button
          onClick={rebuy}
          className="px-6 py-2.5 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
        >
          Rebuy $10,000
        </button>
      </div>
    );
  }

  const handleManualBet = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const commitBet = () => {
    setEditing(false);
    const val = parseInt(inputRef.current?.value || "0");
    if (!isNaN(val) && val > 0) {
      setBet(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitBet();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Current bet display */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBet(Math.max(10, currentBet - 25))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors text-lg leading-none"
          aria-label="Decrease bet"
        >
          -
        </button>

        {editing ? (
          <div className="w-28 text-center">
            <input
              ref={inputRef}
              type="number"
              defaultValue={currentBet}
              onBlur={commitBet}
              onKeyDown={handleKeyDown}
              min={10}
              max={balance}
              className="w-full text-2xl sm:text-3xl font-light tabular-nums text-center bg-transparent border-b border-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={handleManualBet}
            className="text-2xl sm:text-3xl font-light tabular-nums w-28 text-center hover:opacity-70 transition-opacity"
            title="Click to enter custom bet"
          >
            ${currentBet}
          </button>
        )}

        <button
          onClick={() => setBet(Math.min(balance, currentBet + 25))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors text-lg leading-none"
          aria-label="Increase bet"
        >
          +
        </button>
      </div>

      {/* Preset chips + All-in */}
      <div className="flex gap-2 flex-wrap justify-center">
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
        <button
          onClick={() => setBet(balance)}
          disabled={balance <= 0}
          className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border transition-colors ${
            currentBet === balance
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted hover:border-foreground hover:text-foreground"
          }`}
        >
          All in
        </button>
      </div>

      {/* Hand count selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs text-muted uppercase tracking-widest">Hands</span>
        <div className="flex gap-1.5">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => setNumHands(n)}
              disabled={currentBet * n > balance}
              className={`px-2.5 py-1 text-xs tabular-nums rounded-full border transition-colors ${
                numHands === n
                  ? "border-foreground bg-foreground text-background"
                  : currentBet * n > balance
                  ? "border-border text-border cursor-not-allowed"
                  : "border-border text-muted hover:border-foreground hover:text-foreground"
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>

      {/* Total bet indicator for multi-hand */}
      {numHands > 1 && (
        <p className="text-[10px] sm:text-xs text-muted tabular-nums">
          Total: ${currentBet * numHands}
        </p>
      )}
    </div>
  );
}
