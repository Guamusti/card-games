"use client";

import { useRef, useState, useCallback } from "react";
import { useGameStore } from "@/engine/store";
import { canSplit, type Action } from "@/engine/types";
import { getOptimalAction } from "@/engine/strategy";

export default function ActionBar() {
  const { phase, hands, activeHandIndex, dealer, hit, stand, double, split, deal, newRound } =
    useGameStore();

  if (phase === "betting") {
    return (
      <div className="flex justify-center">
        <button
          onClick={deal}
          className="px-8 py-3 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background active:bg-foreground active:text-background transition-colors duration-150"
        >
          Deal
        </button>
      </div>
    );
  }

  if (phase === "settled") {
    return (
      <div className="flex justify-center">
        <button
          onClick={newRound}
          className="px-8 py-3 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background active:bg-foreground active:text-background transition-colors duration-150"
        >
          Next Hand
        </button>
      </div>
    );
  }

  if (phase !== "playing") return null;

  const hand = hands[activeHandIndex];
  const canDbl = hand.cards.length === 2;
  const canSpl = canSplit(hand);

  // Get optimal action for peek feedback
  const dealerUpcard = dealer.cards[0];
  const optimal = dealerUpcard
    ? getOptimalAction(hand.cards, dealerUpcard, canDbl, canSpl)
    : null;

  return (
    <div className="flex justify-center gap-2 sm:gap-3 w-full px-4">
      <ActionButton label="Hit" action="hit" onClick={hit} optimal={optimal} />
      <ActionButton label="Stand" action="stand" onClick={stand} optimal={optimal} />
      <ActionButton label="Double" action="double" onClick={double} disabled={!canDbl} optimal={optimal} />
      <ActionButton label="Split" action="split" onClick={split} disabled={!canSpl} optimal={optimal} />
    </div>
  );
}

function ActionButton({
  label,
  action,
  onClick,
  disabled = false,
  optimal,
}: {
  label: string;
  action: Action;
  onClick: () => void;
  disabled?: boolean;
  optimal: Action | null;
}) {
  const [peeking, setPeeking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didPeekRef = useRef(false);

  const isCorrect = optimal === action;

  const startPeek = useCallback(() => {
    if (disabled) return;
    didPeekRef.current = false;
    timerRef.current = setTimeout(() => {
      setPeeking(true);
      didPeekRef.current = true;
    }, 400);
  }, [disabled]);

  const endPeek = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (peeking) {
      setPeeking(false);
    }
  }, [peeking]);

  const handleClick = useCallback(() => {
    if (didPeekRef.current) {
      didPeekRef.current = false;
      return; // Don't execute action after a long-press peek
    }
    onClick();
  }, [onClick]);

  // Peek indicator styles
  const peekBorder = peeking
    ? isCorrect
      ? "border-correct ring-1 ring-correct"
      : "border-accent ring-1 ring-accent"
    : "";

  return (
    <div className="relative flex-1 max-w-28">
      <button
        onClick={handleClick}
        onMouseDown={startPeek}
        onMouseUp={endPeek}
        onMouseLeave={endPeek}
        onTouchStart={startPeek}
        onTouchEnd={endPeek}
        onTouchCancel={endPeek}
        disabled={disabled}
        className={`w-full py-3 sm:py-2.5 text-xs sm:text-sm font-medium uppercase tracking-wider border transition-all duration-150 select-none ${
          disabled
            ? "border-border text-border cursor-not-allowed"
            : peeking
            ? peekBorder
            : "border-foreground text-foreground hover:bg-foreground hover:text-background active:bg-foreground active:text-background"
        }`}
      >
        {label}
      </button>

      {/* Peek tooltip */}
      {peeking && (
        <div
          className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap z-10 ${
            isCorrect
              ? "bg-correct text-white"
              : "bg-accent text-white"
          }`}
        >
          {isCorrect ? "✓ Correct" : `✗ Play: ${optimal?.charAt(0).toUpperCase()}${optimal?.slice(1)}`}
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              isCorrect ? "border-t-correct" : "border-t-accent"
            }`}
          />
        </div>
      )}
    </div>
  );
}
