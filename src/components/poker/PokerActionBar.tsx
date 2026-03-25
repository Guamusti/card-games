"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerStore } from "@/engine/poker/store";
import { useHaptic } from "@/hooks/useHaptic";

export default function PokerActionBar() {
  const {
    phase, players, activePlayerIndex, pot, minRaise, bigBlind,
    deal, fold, check, call, raise, allIn, skipHand, newRound, leaveTable, winnerIds,
  } = usePokerStore();

  const [showRaisePanel, setShowRaisePanel] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const haptic = useHaptic();

  const playerIdx = players.findIndex((p) => p.isHuman);
  const player = players[playerIdx];
  const isPlayerTurn = activePlayerIndex === playerIdx;

  // Betting screen
  if (phase === "betting") {
    return (
      <div className="flex justify-center">
        <button
          onClick={deal}
          className="px-8 py-3 text-base font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-150 rounded-lg"
        >
          Deal
        </button>
      </div>
    );
  }

  // Dealing (cards being dealt)
  if (phase === "dealing") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 w-full px-4 min-h-[5.5rem]">
        <span className="text-sm text-muted text-center animate-pulse">Dealing...</span>
      </div>
    );
  }

  // Settled
  if (phase === "settled") {
    const playerFolded = player.folded;
    const playerWon = winnerIds.includes("player");
    const busted = player.chips <= 0;

    const handleNextHand = () => {
      newRound();
      // Auto-deal after a short delay for the state to reset
      setTimeout(() => {
        usePokerStore.getState().deal();
      }, 100);
    };

    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full px-4 min-h-[5.5rem]">
        <div className="text-center">
          {playerWon && (
            <span className="text-base sm:text-lg font-semibold text-correct">You win!</span>
          )}
          {!playerWon && !playerFolded && (
            <span className="text-base sm:text-lg font-semibold text-accent">You lose</span>
          )}
          {busted && (
            <span className="text-base sm:text-lg font-semibold text-accent block mt-1">Out of chips!</span>
          )}
        </div>
        <div className="flex gap-2">
          {busted ? (
            <button
              onClick={leaveTable}
              className="px-8 py-3 text-base font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
            >
              Leave Table
            </button>
          ) : (
            <>
              <button
                onClick={leaveTable}
                className="px-5 py-2.5 text-sm font-semibold uppercase tracking-widest border border-border text-muted hover:text-foreground hover:border-foreground transition-colors rounded-lg"
              >
                Leave
              </button>
              <button
                onClick={handleNextHand}
                className="px-8 py-3 text-base font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
              >
                Next Hand
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Not player's turn
  if (!isPlayerTurn || player.folded || player.isAllIn) {
    if (player.folded) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 w-full px-4 min-h-[5.5rem]">
          <span className="text-sm text-muted">You folded</span>
          <button
            onClick={skipHand}
            className="px-5 py-2.5 text-sm font-semibold uppercase tracking-widest border border-border text-muted hover:text-foreground hover:border-foreground transition-colors rounded-lg"
          >
            Skip to End
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 w-full px-4 min-h-[5.5rem]" />
    );
  }

  // Player's turn
  const maxBet = Math.max(...players.map((p) => p.currentBet));
  const toCall = Math.max(0, maxBet - player.currentBet);
  const canCheck = toCall === 0;
  const minRaiseTotal = Math.max(maxBet + minRaise, bigBlind * 2);
  const maxRaise = player.chips + player.currentBet;
  const effectiveRaise = raiseAmount > 0 ? raiseAmount : minRaiseTotal;

  // BB button adds 1BB to current raise amount each click
  const addOneBB = () => {
    const current = raiseAmount > 0 ? raiseAmount : minRaiseTotal;
    setRaiseAmount(Math.min(current + bigBlind, maxRaise));
  };
  const halfPot = maxBet + Math.floor(pot / 2);
  const potRaise = maxBet + pot;

  const potOdds = toCall > 0 ? Math.round((toCall / (pot + toCall)) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2 w-full px-4 min-h-[5.5rem]">
      {/* Pot odds hint */}
      {toCall > 0 && !showRaisePanel && (
        <span className="text-xs sm:text-sm text-muted tabular-nums">
          {toCall} to call · pot odds {potOdds}%
        </span>
      )}
      {/* Raise panel */}
      <AnimatePresence>
        {showRaisePanel && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="flex flex-col gap-2 w-full max-w-md bg-surface border border-border rounded-xl p-3"
          >
            {/* Slider row */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted tabular-nums min-w-[3.5rem]">↑ {effectiveRaise}</span>
              <input
                type="range"
                min={minRaiseTotal}
                max={maxRaise}
                step={bigBlind}
                value={effectiveRaise}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                className="flex-1 accent-foreground h-1"
              />
              <button
                onClick={() => {
                  raise(effectiveRaise);
                  setShowRaisePanel(false);
                  setRaiseAmount(0);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors text-sm"
                aria-label={`Raise to ${effectiveRaise}`}
              >
                ✓
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2">
              <button
                onClick={addOneBB}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                +1 BB
              </button>
              <button
                onClick={() => setRaiseAmount(Math.min(halfPot, maxRaise))}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                ½ Pot
              </button>
              <button
                onClick={() => setRaiseAmount(Math.min(potRaise, maxRaise))}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                Pot
              </button>
              <button
                onClick={() => {
                  haptic.heavy();
                  setShowRaisePanel(false);
                  setRaiseAmount(0);
                  allIn();
                }}
                className="flex-1 py-2 text-sm font-bold rounded-lg bg-border/50 hover:bg-border text-correct transition-colors"
              >
                All-in
              </button>
              <button
                onClick={() => {
                  setShowRaisePanel(false);
                  setRaiseAmount(0);
                }}
                className="w-10 py-2 text-sm font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main action buttons — compact Check/Call + Raise */}
      <div className="flex justify-center gap-2 w-full max-w-xs">
        {canCheck ? (
          <button
            onClick={() => { haptic.tap(); check(); }}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => { haptic.tap(); call(); }}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
          >
            Call {toCall}
          </button>
        )}

        <button
          onClick={() => {
            haptic.tap();
            setShowRaisePanel(!showRaisePanel);
            setRaiseAmount(0);
          }}
          disabled={player.chips <= toCall}
          className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:border-border disabled:text-border disabled:cursor-not-allowed transition-all"
        >
          Raise
        </button>
      </div>

      {/* Fold - separate, less prominent */}
      <button
        onClick={() => { haptic.tap(); setShowRaisePanel(false); fold(); }}
        className="text-xs text-muted hover:text-accent transition-colors uppercase tracking-widest"
      >
        Fold
      </button>
    </div>
  );
}
