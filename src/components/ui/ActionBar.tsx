"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/engine/store";
import { canSplit, type Action } from "@/engine/types";
import { getOptimalAction } from "@/engine/strategy";
import { getBJActionProbabilities, type BJActionProbs } from "@/engine/bjProbability";
import { useHaptic } from "@/hooks/useHaptic";
import { useCustomizeStore } from "@/engine/customize/store";

export default function ActionBar() {
  const { phase, hands, activeHandIndex, dealer, hit, stand, double, split, deal, newRound } =
    useGameStore();
  const showProbabilities = useCustomizeStore((s) => s.showProbabilities);

  // Compute these every render so hooks are always called in the same order
  const hand = phase === "playing" ? hands[activeHandIndex] : null;
  const canDbl = hand ? hand.cards.length === 2 : false;
  const canSpl = hand ? canSplit(hand) : false;
  const dealerUpcard = phase === "playing" ? dealer.cards[0] : undefined;

  const optimal = hand && dealerUpcard
    ? getOptimalAction(hand.cards, dealerUpcard, canDbl, canSpl)
    : null;

  const probs = useMemo(() => {
    if (!hand || !dealerUpcard) return null;
    return getBJActionProbabilities(hand.cards, dealerUpcard, canDbl, canSpl);
  }, [hand, dealerUpcard, canDbl, canSpl]);

  if (phase === "dealing") return null;

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

  if (phase !== "playing" || !hand) return null;

  return (
    <div className="flex justify-center gap-2 sm:gap-3 w-full px-4">
      <ActionButton label="Hit" action="hit" onClick={hit} optimal={optimal} probs={showProbabilities ? probs : null} />
      <ActionButton label="Stand" action="stand" onClick={stand} optimal={optimal} probs={showProbabilities ? probs : null} />
      <ActionButton label="Double" action="double" onClick={double} disabled={!canDbl} optimal={optimal} probs={showProbabilities ? probs : null} />
      <ActionButton label="Split" action="split" onClick={split} disabled={!canSpl} optimal={optimal} probs={showProbabilities ? probs : null} />
    </div>
  );
}

function ActionButton({
  label,
  action,
  onClick,
  disabled = false,
  optimal,
  probs,
}: {
  label: string;
  action: Action;
  onClick: () => void;
  disabled?: boolean;
  optimal: Action | null;
  probs: BJActionProbs | null;
}) {
  const [peeking, setPeeking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didPeekRef = useRef(false);

  const isCorrect = optimal === action;
  const actionProb = probs
    ? action === "split"
      ? probs.split
      : probs[action]
    : null;

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

  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (didPeekRef.current) {
      didPeekRef.current = false;
      return; // Don't execute action after a long-press peek
    }
    haptic.tap();
    onClick();
  }, [onClick, haptic]);

  // Peek indicator styles
  const peekBorder = peeking
    ? isCorrect
      ? "border-correct ring-1 ring-correct"
      : "border-amber-500 ring-1 ring-amber-500"
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
          className={`absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap z-10 flex flex-col items-center gap-0.5 ${
            isCorrect
              ? "bg-correct text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          <span>{isCorrect ? "Good play" : `Optimal: ${optimal}`}</span>
          {actionProb !== null && (
            <span className="text-[9px] font-normal opacity-90">Win {actionProb}%</span>
          )}
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              isCorrect ? "border-t-correct" : "border-t-amber-500"
            }`}
          />
        </div>
      )}
    </div>
  );
}
