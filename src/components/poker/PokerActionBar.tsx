"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerStore } from "@/engine/poker/store";
import { useHaptic } from "@/hooks/useHaptic";

export default function PokerActionBar() {
  const {
    phase, players, activePlayerIndex, pot, minRaise, bigBlind,
    deal, fold, check, call, raise, allIn, skipHand, newRound, winnerIds,
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
          className="px-8 py-3 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-150 rounded-lg"
        >
          Deal
        </button>
      </div>
    );
  }

  // Dealing (cards being dealt)
  if (phase === "dealing") {
    return <div className="text-xs text-muted text-center animate-pulse">Dealing...</div>;
  }

  // Settled
  if (phase === "settled") {
    const playerFolded = player.folded;
    const playerWon = winnerIds.includes("player");

    return (
      <div className="flex flex-col items-center gap-3 w-full px-4">
        <div className="text-center">
          {playerWon && (
            <span className="text-sm sm:text-base font-semibold text-correct">You win!</span>
          )}
          {!playerWon && !playerFolded && (
            <span className="text-sm sm:text-base font-semibold text-accent">You lose</span>
          )}
        </div>
        <div className="flex gap-2">
          {playerFolded && (
            <button
              onClick={skipHand}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest border border-border text-muted hover:text-foreground hover:border-foreground transition-colors rounded-lg"
            >
              Skip
            </button>
          )}
          <button
            onClick={newRound}
            className="px-8 py-3 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
          >
            Next Hand
          </button>
        </div>
      </div>
    );
  }

  // Not player's turn
  if (!isPlayerTurn || player.folded || player.isAllIn) {
    if (player.folded) {
      return (
        <div className="flex flex-col items-center gap-2 w-full px-4">
          <span className="text-xs text-muted">You folded</span>
          <button
            onClick={skipHand}
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest border border-border text-muted hover:text-foreground hover:border-foreground transition-colors rounded-lg"
          >
            Skip to End
          </button>
        </div>
      );
    }
    if (player.isAllIn) {
      return <div className="text-xs text-muted text-center">All-in — waiting...</div>;
    }
    return <div className="text-xs text-muted text-center animate-pulse">Opponent thinking...</div>;
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

  return (
    <div className="flex flex-col items-center gap-2 w-full px-4">
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
              <span className="text-xs text-muted tabular-nums min-w-[3rem]">↑ {effectiveRaise}</span>
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
                className="w-8 h-8 flex items-center justify-center rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                ↑
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2">
              <button
                onClick={addOneBB}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                +1 BB
              </button>
              <button
                onClick={() => setRaiseAmount(Math.min(halfPot, maxRaise))}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                ½ Pot
              </button>
              <button
                onClick={() => setRaiseAmount(Math.min(potRaise, maxRaise))}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                Pot
              </button>
              <button
                onClick={() => {
                  setShowRaisePanel(false);
                  setRaiseAmount(0);
                }}
                className="w-10 py-2 text-xs font-medium rounded-lg bg-border/50 hover:bg-border transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main action buttons */}
      <div className="flex justify-center gap-2 w-full max-w-md">
        {canCheck ? (
          <button
            onClick={() => { haptic.tap(); check(); }}
            className="flex-1 py-3 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => { haptic.tap(); call(); }}
            className="flex-1 py-3 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
          >
            Call {toCall}
          </button>
        )}

        <button
          onClick={() => {
            haptic.tap();
            if (showRaisePanel) {
              raise(effectiveRaise);
              setShowRaisePanel(false);
              setRaiseAmount(0);
            } else {
              setShowRaisePanel(true);
            }
          }}
          disabled={player.chips <= toCall}
          className="flex-1 py-3 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:border-border disabled:text-border disabled:cursor-not-allowed transition-all"
        >
          Raise {showRaisePanel ? effectiveRaise : ""}
        </button>

        <button
          onClick={() => {
            haptic.heavy();
            setShowRaisePanel(false);
            allIn();
          }}
          className="w-12 py-3 text-sm font-medium rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all"
          title="All-in"
        >
          ↑
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
