"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { usePokerStore } from "@/engine/poker/store";
import { useTournamentStore } from "@/engine/poker/tournament";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCustomizeStore } from "@/engine/customize/store";
import { useXPStore } from "@/engine/xp";
import CommunityCards from "./CommunityCards";
import PlayerSeat from "./PlayerSeat";
import PokerActionBar from "./PokerActionBar";
import PokerCard from "./PokerCard";
import WinStats from "./WinStats";
import HandRankings from "./HandRankings";
import { useWalletStore } from "@/engine/wallet";

const FELT_COLORS: Record<string, string | undefined> = {
  none: undefined, subtle: "#1a1a1a", green: "#0a2e1a", blue: "#0a1a2e", wine: "#2e0a1a",
};

export default function PokerTable() {
  const {
    players, community, phase, pot, dealerIndex,
    activePlayerIndex, showAllCards, winnerIds,
    bigBlind, smallBlind, setBlinds, leaveTable,
  } = usePokerStore();
  const walletBalance = useWalletStore((s) => s.balance);
  const gems = useWalletStore((s) => s.gems);
  const level = useXPStore((s) => s.level);
  const { dark, toggle } = useDarkMode();
  const tableFelt = useCustomizeStore((s) => s.tableFelt);
  const feltBg = FELT_COLORS[tableFelt];

  // Tournament state
  const isTournament = useTournamentStore((s) => s.isTournament);
  const tournamentLevel = useTournamentStore((s) => s.currentLevel);
  const tournamentHandsAtLevel = useTournamentStore((s) => s.handsAtLevel);
  const tournamentPlayersRemaining = useTournamentStore((s) => s.playersRemaining);
  const tournamentTotalPlayers = useTournamentStore((s) => s.totalPlayers);
  const tournamentBlinds = useTournamentStore((s) => s.blindLevels);

  const playerIdx = players.findIndex((p) => p.isHuman);
  const player = players[playerIdx];
  const aiPlayers = players.filter((p) => !p.isHuman);
  const activeOpponents = players.filter((p) => !p.isHuman && !p.folded).length;
  const isPlayerTurn = activePlayerIndex === playerIdx;

  const showTable = phase !== "betting";
  const revealedCount = phase === "preflop" || phase === "dealing" ? 0 : phase === "flop" ? 3 : phase === "turn" ? 4 : 5;
  const visibleCommunity = community.slice(0, revealedCount);

  // Current blind level info for tournament banner
  const currentBlindLevel = isTournament ? tournamentBlinds[tournamentLevel] : null;
  const handsUntilNext = currentBlindLevel ? currentBlindLevel.duration - tournamentHandsAtLevel : 0;

  const handleStartTournament = () => {
    const store = usePokerStore.getState();
    // Set up tournament blinds (level 0: 10/20)
    const tStore = useTournamentStore.getState();
    const playerNames = [
      { id: "player", name: "You" },
      ...store.players.filter((p) => !p.isHuman).map((p) => ({ id: p.id, name: p.name })),
    ];
    tStore.startTournament(playerNames);

    // Set poker store blinds to tournament level 0
    const blinds = tStore.getCurrentBlinds();
    store.setBlinds(blinds.small, blinds.big);
  };

  const handleLeaveTable = () => {
    if (isTournament) {
      useTournamentStore.getState().endTournament();
    }
    leaveTable();
  };

  return (
    <div
      className="relative flex flex-col min-h-[100dvh] overflow-y-auto"
      style={feltBg ? { backgroundColor: feltBg } : undefined}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-border safe-top">
        <Link
          href="/"
          onClick={showTable ? handleLeaveTable : undefined}
          className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
        <div className="flex items-center gap-2.5 sm:gap-3.5 text-sm sm:text-base tabular-nums">
          <div className="flex items-center gap-1">
            <span className="text-amber-500 text-xs">{"\u25CF"}</span>
            <span className="text-foreground font-medium">
              {showTable ? player.chips.toLocaleString() : walletBalance.toLocaleString()}
            </span>
          </div>
          {!isTournament && (
            <div className="flex items-center gap-1">
              <span className="text-blue-500 text-xs">{"\u25C6"}</span>
              <span className="text-foreground font-medium">{gems}</span>
            </div>
          )}
          <span className="text-muted text-sm">
            {smallBlind}/{bigBlind}
          </span>
          <Link
            href="/battlepass"
            className="flex items-center gap-1 px-2 py-1 rounded-full border border-border hover:border-foreground transition-colors"
          >
            <span className="text-xs font-bold">{level}</span>
          </Link>
          <button
            onClick={toggle}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
          >
            <span className="text-xs">{dark ? "L" : "D"}</span>
          </button>
        </div>
      </div>

      {/* Tournament banner */}
      {isTournament && showTable && currentBlindLevel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 px-4 py-1.5 bg-foreground/5 border-b border-border text-xs sm:text-sm"
        >
          <span className="font-semibold text-foreground">Tournament</span>
          <span className="text-muted">{"\u2014"}</span>
          <span className="text-foreground tabular-nums">
            Level {tournamentLevel + 1} ({currentBlindLevel.small}/{currentBlindLevel.big})
          </span>
          <span className="text-muted">{"\u2014"}</span>
          <span className="text-muted tabular-nums">
            {tournamentPlayersRemaining}/{tournamentTotalPlayers} players
          </span>
          <span className="text-muted">{"\u2014"}</span>
          <span className="text-muted tabular-nums">
            {handsUntilNext} hands to next level
          </span>
        </motion.div>
      )}

      <main className="flex-1 flex flex-col items-center px-3 py-3 sm:py-6 gap-3 sm:gap-4">
        {!showTable ? (
          /* --- Lobby --- */
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
              Texas Hold&apos;em
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-xs text-center leading-relaxed">
              Play against 5 AI opponents. Win probability shown in real time.
            </p>

            {/* Table selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] sm:text-xs text-muted uppercase tracking-widest">Choose Table</span>
              <div className="flex gap-2">
                {([
                  { sb: 1, bb: 2, chips: 200, label: "200" },
                  { sb: 5, bb: 10, chips: 1000, label: "1K" },
                  { sb: 10, bb: 20, chips: 2000, label: "2K" },
                ] as const).map((table) => {
                  const canAfford = walletBalance >= table.sb + table.bb;
                  return (
                    <button
                      key={table.chips}
                      onClick={() => setBlinds(table.sb, table.bb)}
                      disabled={!canAfford}
                      className={`flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-lg border transition-all duration-150 ${
                        !canAfford
                          ? "border-border text-border cursor-not-allowed"
                          : bigBlind === table.bb
                          ? "border-foreground text-foreground bg-foreground/5"
                          : "border-border text-muted hover:border-foreground/50"
                      }`}
                    >
                      <span className="text-sm sm:text-base font-semibold tabular-nums">{table.label}</span>
                      <span className="text-[9px] sm:text-[10px] tabular-nums">{table.sb}/{table.bb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted tabular-nums">
              Buy-in: <span className="text-foreground font-semibold">${Math.min(bigBlind * 100, walletBalance).toLocaleString()}</span>
              <span className="text-muted/60"> / ${walletBalance.toLocaleString()} balance</span>
            </p>

            {/* Tournament button */}
            <div className="flex flex-col items-center gap-2 mt-1">
              <span className="text-[10px] sm:text-xs text-muted uppercase tracking-widest">Or</span>
              <button
                onClick={handleStartTournament}
                className="flex flex-col items-center gap-0.5 px-6 py-3 rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-150"
              >
                <span className="text-sm sm:text-base font-semibold uppercase tracking-widest">Tournament</span>
                <span className="text-[9px] sm:text-[10px] text-inherit opacity-60">
                  1,500 chips {"\u00B7"} 6 players {"\u00B7"} rising blinds
                </span>
              </button>
            </div>

            <PokerActionBar />
            <HandRankings />
          </div>
        ) : (
          <>
            {/* --- Opponents row --- */}
            <div className="flex justify-around w-full pt-1">
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

            {/* Spacer to push community cards toward center */}
            <div className="flex-1" />

            {/* --- Community cards --- */}
            <div className="flex flex-col items-center gap-1.5">
              <CommunityCards cards={community} phase={phase} />
              {pot > 0 && (
                <span className="text-xs sm:text-sm text-muted tabular-nums">
                  Pot <span className="text-foreground font-semibold">{pot}</span>
                </span>
              )}
            </div>

            {/* --- Player area (bottom) --- */}
            <div className="flex flex-col items-center gap-2 w-full mt-auto">
              {/* Action bar */}
              <PokerActionBar />

              {/* Player cards + stats (swipe up to fold) */}
              <SwipeFoldCards
                cards={player.cards}
                canFold={isPlayerTurn && !player.folded && !player.isAllIn && phase !== "settled"}
                onFold={() => usePokerStore.getState().fold()}
              >
                <WinStats
                  holeCards={player.cards}
                  community={visibleCommunity}
                  numOpponents={activeOpponents}
                  phase={phase}
                />
              </SwipeFoldCards>

              {/* Player info bar */}
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{player.avatar}</span>
                <span className="text-base sm:text-lg font-semibold tabular-nums">
                  {player.chips}
                </span>
                {dealerIndex === playerIdx && (
                  <span className="text-[9px] bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    D
                  </span>
                )}
                {player.folded && (
                  <span className="text-sm text-accent font-semibold uppercase">Fold</span>
                )}
              </div>

            </div>
          </>
        )}
      </main>

      <footer className="py-2 sm:py-3 text-center text-[10px] sm:text-xs text-muted border-t border-border safe-bottom">
        {isTournament ? (
          <>Tournament {"\u00B7"} {tournamentPlayersRemaining} Players {"\u00B7"} No Limit</>
        ) : (
          <>Texas Hold&apos;em {"\u00B7"} 6 Players {"\u00B7"} No Limit</>
        )}
      </footer>
    </div>
  );
}

/** Swipe-up-to-fold wrapper for player hole cards */
function SwipeFoldCards({
  cards,
  canFold,
  onFold,
  children,
}: {
  cards: { rank: string; suit: string }[];
  canFold: boolean;
  onFold: () => void;
  children: React.ReactNode;
}) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, -120], [1, 0.2]);
  const scale = useTransform(y, [0, -120], [1, 0.85]);
  const [hintVisible, setHintVisible] = useState(false);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (canFold && (info.offset.y < -80 || info.velocity.y < -300)) {
        onFold();
      }
      setHintVisible(false);
    },
    [canFold, onFold],
  );

  const handleDrag = useCallback(
    (_: unknown, info: { offset: { y: number } }) => {
      setHintVisible(canFold && info.offset.y < -20);
    },
    [canFold],
  );

  return (
    <div className="flex items-end justify-center gap-3 relative">
      {/* Fold hint */}
      <AnimatePresence>
        {hintVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-accent font-semibold uppercase tracking-widest pointer-events-none z-10"
          >
            Fold
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable cards */}
      <motion.div
        drag={canFold ? "y" : false}
        dragConstraints={{ top: -140, bottom: 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={canFold ? { y, opacity, scale } : undefined}
        className="flex gap-1.5 cursor-grab active:cursor-grabbing touch-none"
      >
        {cards.map((card, i) => (
          <PokerCard
            key={`${card.rank}${card.suit}-${i}`}
            card={card as import("@/engine/types").Card}
            delay={i * 0.15}
            large
          />
        ))}
        {cards.length === 0 && (
          <>
            <div className="player-card-size rounded-lg border border-border/30" />
            <div className="player-card-size rounded-lg border border-border/30" />
          </>
        )}
      </motion.div>

      {/* Win probability */}
      {children}
    </div>
  );
}
