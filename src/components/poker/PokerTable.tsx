"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerStore } from "@/engine/poker/store";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCustomizeStore } from "@/engine/customize/store";
import CommunityCards from "./CommunityCards";
import PlayerSeat from "./PlayerSeat";
import PokerActionBar from "./PokerActionBar";
import PokerCard from "./PokerCard";
import WinStats from "./WinStats";
import HandRankings from "./HandRankings";

const FELT_COLORS: Record<string, string | undefined> = {
  none: undefined, subtle: "#1a1a1a", green: "#0a2e1a", blue: "#0a1a2e", wine: "#2e0a1a",
};

export default function PokerTable() {
  const {
    players, community, phase, pot, dealerIndex,
    activePlayerIndex, showAllCards, lastAction, winnerIds,
    bigBlind, smallBlind,
  } = usePokerStore();
  const { dark, toggle } = useDarkMode();
  const tableFelt = useCustomizeStore((s) => s.tableFelt);
  const feltBg = FELT_COLORS[tableFelt];

  const playerIdx = players.findIndex((p) => p.isHuman);
  const player = players[playerIdx];
  const aiPlayers = players.filter((p) => !p.isHuman);
  const activeOpponents = players.filter((p) => !p.isHuman && !p.folded).length;

  const showTable = phase !== "betting";

  return (
    <div
      className="relative flex flex-col min-h-[100dvh] overflow-y-auto"
      style={feltBg ? { backgroundColor: feltBg } : undefined}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-border safe-top">
        <Link
          href="/"
          className="text-muted hover:text-foreground transition-colors"
        >
          ←
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm tabular-nums">
          {showTable && (
            <span className="text-muted">
              Pot <span className="text-foreground font-semibold">{pot}</span>
            </span>
          )}
          <span className="text-muted">
            {smallBlind}/{bigBlind}
          </span>
          <button
            onClick={toggle}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
          >
            <span className="text-xs">{dark ? "L" : "D"}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-between px-3 py-3 sm:py-6 gap-3">
        {!showTable ? (
          /* ─── Lobby ─── */
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
              Texas Hold&apos;em
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-xs text-center leading-relaxed">
              Play against 5 AI opponents. Win probability shown in real time.
            </p>
            <div className="text-xs text-muted text-center tabular-nums">
              <span>Starting chips: {players[0]?.chips || 200}</span>
              <span className="mx-2">·</span>
              <span>Blinds: {smallBlind}/{bigBlind}</span>
            </div>
            <PokerActionBar />
            <HandRankings />
          </div>
        ) : (
          <>
            {/* ─── Opponents row ─── */}
            <div className="flex justify-center gap-3 sm:gap-5 flex-wrap">
              {aiPlayers.map((ai) => (
                <PlayerSeat
                  key={ai.id}
                  player={ai}
                  isDealer={dealerIndex === players.indexOf(ai)}
                  isActive={activePlayerIndex === players.indexOf(ai) && phase !== "settled"}
                  showCards={showAllCards}
                  isWinner={winnerIds.includes(ai.id)}
                />
              ))}
            </div>

            {/* ─── Community cards ─── */}
            <div className="flex flex-col items-center gap-1.5">
              <CommunityCards cards={community} phase={phase} />
              <div className="flex items-center gap-3">
                <span className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-widest">
                  {phase === "preflop" ? "Pre-flop"
                    : phase === "flop" ? "Flop"
                    : phase === "turn" ? "Turn"
                    : phase === "river" ? "River"
                    : "Showdown"}
                </span>
                {showTable && pot > 0 && (
                  <span className="text-xs sm:text-sm font-semibold tabular-nums">{pot}</span>
                )}
              </div>
            </div>

            {/* ─── Last action ─── */}
            <AnimatePresence>
              {lastAction && phase !== "settled" && (
                <motion.div
                  key={`${lastAction.player}-${lastAction.action}-${Date.now()}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] sm:text-xs text-muted"
                >
                  {lastAction.player}{" "}
                  <span className="font-medium text-foreground">
                    {lastAction.action}
                    {lastAction.amount ? `s ${lastAction.amount}` : "s"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Winner ─── */}
            <AnimatePresence>
              {phase === "settled" && winnerIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-semibold text-center"
                >
                  {winnerIds.includes("player") ? (
                    <span className="text-correct">You win!</span>
                  ) : (
                    <span className="text-accent">
                      {players.find((p) => p.id === winnerIds[0])?.name || "Opponent"} wins
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Player area (bottom) ─── */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Action bar */}
              <PokerActionBar />

              {/* Player cards + stats */}
              <div className="flex items-end justify-center gap-3">
                {/* Hole cards */}
                <div className="flex gap-1">
                  {player.cards.map((card, i) => (
                    <PokerCard
                      key={`${card.rank}${card.suit}-${i}`}
                      card={card}
                      delay={i * 0.1}
                    />
                  ))}
                  {player.cards.length === 0 && (
                    <>
                      <div className="card-size rounded-lg border border-border/30" />
                      <div className="card-size rounded-lg border border-border/30" />
                    </>
                  )}
                </div>

                {/* Win probability */}
                <WinStats
                  holeCards={player.cards}
                  community={community}
                  numOpponents={activeOpponents}
                  phase={phase}
                />
              </div>

              {/* Player info bar */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{player.avatar}</span>
                <span className="text-xs sm:text-sm font-medium">
                  {player.chips}
                </span>
                {dealerIndex === playerIdx && (
                  <span className="text-[8px] bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    D
                  </span>
                )}
                {player.folded && (
                  <span className="text-xs text-accent font-semibold uppercase">Fold</span>
                )}
              </div>

              {/* Hand rankings link */}
              {phase !== "settled" && <HandRankings />}
            </div>
          </>
        )}
      </main>

      <footer className="py-2 sm:py-3 text-center text-[10px] sm:text-xs text-muted border-t border-border safe-bottom">
        Texas Hold&apos;em &middot; 6 Players &middot; No Limit
      </footer>
    </div>
  );
}
