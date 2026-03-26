"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerStore } from "@/engine/poker/store";
import { useTournamentStore } from "@/engine/poker/tournament";
import { useHaptic } from "@/hooks/useHaptic";
import { estimateEquity } from "@/engine/poker/equity";

export default function PokerActionBar() {
  const {
    phase, players, activePlayerIndex, pot, minRaise, bigBlind, community,
    deal, fold, check, call, raise, allIn, skipHand, newRound, leaveTable, winnerIds,
  } = usePokerStore();
  const isTournament = useTournamentStore((s) => s.isTournament);
  const tournamentPlacement = useTournamentStore((s) => s.playerPlacement);
  const tournamentOver = useTournamentStore((s) => s.tournamentOver);

  const [showRaisePanel, setShowRaisePanel] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const haptic = useHaptic();

  const playerIdx = players.findIndex((p) => p.isHuman);
  const player = players[playerIdx];
  const isPlayerTurn = activePlayerIndex === playerIdx;

  // Compute visible community cards based on phase
  const revealedCount =
    phase === "preflop" || phase === "dealing" || phase === "betting"
      ? 0
      : phase === "flop"
      ? 3
      : phase === "turn"
      ? 4
      : 5;
  const visibleCommunity = community.slice(0, revealedCount);

  const activeOpponents = players.filter((p) => !p.isHuman && !p.folded).length;

  // Equity calculation (expensive, memoized)
  const equity = useMemo(() => {
    if (
      !player ||
      player.cards.length < 2 ||
      visibleCommunity.length === 0 ||
      activeOpponents < 1 ||
      phase === "betting" ||
      phase === "dealing" ||
      phase === "settled" ||
      phase === "showdown" ||
      phase === "preflop"
    ) {
      return -1;
    }
    return estimateEquity(player.cards, visibleCommunity, activeOpponents, 700);
  }, [player?.cards, visibleCommunity.length, activeOpponents, phase]);

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

    // Tournament: player eliminated
    if (isTournament && busted && tournamentOver) {
      const totalPlayers = useTournamentStore.getState().totalPlayers;
      const place = tournamentPlacement;
      const isWinner = place === 1;
      return (
        <div className="flex flex-col items-center justify-center gap-3 w-full px-4 min-h-[5.5rem]">
          <div className="text-center">
            {isWinner ? (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-lg sm:text-xl font-bold text-correct"
              >
                You won the tournament!
              </motion.span>
            ) : (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-base sm:text-lg font-semibold text-accent"
              >
                You finished {ordinal(place)}{place <= Math.ceil(totalPlayers / 2) ? " — nice run!" : ""}
              </motion.span>
            )}
          </div>
          <button
            onClick={() => {
              useTournamentStore.getState().endTournament();
              leaveTable();
            }}
            className="px-8 py-3 text-base font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full px-4 min-h-[5.5rem]">
        <div className="text-center">
          {playerWon && (
            <span className="text-base sm:text-lg font-semibold text-correct">You win!</span>
          )}
          {!playerWon && !playerFolded && (
            <span className="text-base sm:text-lg font-semibold text-accent">You lose</span>
          )}
          {busted && !isTournament && (
            <span className="text-base sm:text-lg font-semibold text-accent block mt-1">Out of chips!</span>
          )}
        </div>
        <div className="flex gap-2">
          {busted && !isTournament ? (
            <button
              onClick={leaveTable}
              className="px-8 py-3 text-base font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
            >
              Leave Table
            </button>
          ) : (
            <>
              {!isTournament && (
                <button
                  onClick={leaveTable}
                  className="px-5 py-2.5 text-sm font-semibold uppercase tracking-widest border border-border text-muted hover:text-foreground hover:border-foreground transition-colors rounded-lg"
                >
                  Leave
                </button>
              )}
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
      <div className="flex flex-col items-center justify-center gap-2 w-full px-4 min-h-[5.5rem]">
        {equity >= 0 && <EquityBadge equity={equity} />}
      </div>
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
      {/* Pot odds + equity hint */}
      {!showRaisePanel && (
        <div className="flex items-center gap-2 text-xs sm:text-sm tabular-nums">
          {toCall > 0 && (
            <span className="text-muted">
              {toCall} to call · pot odds {potOdds}%
            </span>
          )}
          {equity >= 0 && <EquityBadge equity={equity} />}
        </div>
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
              <span className="text-sm text-muted tabular-nums min-w-[3.5rem]">{"\u2191"} {effectiveRaise}</span>
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
                {"\u2713"}
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
                {"\u00BD"} Pot
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
                {"\u2715"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main action buttons -- compact Check/Call + Raise */}
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

/** Small equity badge component */
function EquityBadge({ equity }: { equity: number }) {
  const color =
    equity > 50 ? "text-correct" : equity >= 30 ? "text-amber-500" : "text-accent";
  return (
    <span className={`text-xs sm:text-sm font-semibold tabular-nums ${color}`}>
      Equity {equity}%
    </span>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
