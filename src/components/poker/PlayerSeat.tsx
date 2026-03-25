"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PokerPlayer } from "@/engine/poker/types";
import type { Card as CardType } from "@/engine/types";
import { suitColor } from "@/engine/types";

interface PlayerSeatProps {
  player: PokerPlayer;
  isDealer: boolean;
  isActive: boolean;
  showCards: boolean;
  isWinner: boolean;
}

function MiniCard({ card, dimmed }: { card: CardType; dimmed?: boolean }) {
  const sc = suitColor(card.suit);
  return (
    <div
      className={`w-9 h-12 sm:w-11 sm:h-[3.75rem] rounded border border-border bg-surface flex flex-col items-center justify-center gap-0 select-none transition-opacity ${dimmed ? "opacity-30" : ""}`}
      style={{ color: sc }}
    >
      <span className="text-xs sm:text-sm font-semibold leading-none">{card.rank}</span>
      <span className="text-[10px] sm:text-xs leading-none">{card.suit}</span>
    </div>
  );
}

export default function PlayerSeat({
  player, isDealer, isActive, showCards, isWinner,
}: PlayerSeatProps) {
  const dimmed = player.folded;

  return (
    <div className={`flex flex-col items-center gap-1 transition-opacity min-w-[3.5rem] ${dimmed ? "opacity-40" : ""}`}>
      {/* Last action text — simple, Offsuit style */}
      <div className="h-4 flex items-center justify-center">
        {player.lastAction && !player.folded ? (
          <span className="text-[10px] sm:text-xs font-medium text-muted capitalize">
            {player.lastAction === "all-in" ? "All-in" : player.lastAction}
          </span>
        ) : player.folded ? (
          <span className="text-[10px] sm:text-xs font-medium text-accent">Fold</span>
        ) : null}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={`text-3xl sm:text-4xl transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
          {player.avatar}
        </div>
        {isDealer && (
          <span className="absolute -bottom-0.5 -right-1.5 text-[9px] bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center font-bold">
            D
          </span>
        )}
      </div>

      {/* Name */}
      <span className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-foreground" : "text-muted"}`}>
        {player.name}
      </span>

      {/* Current bet in accent color / Chips */}
      <div className="h-4 flex items-center justify-center">
        {player.isAllIn && !player.folded ? (
          <span className="text-[10px] sm:text-xs font-bold text-correct tabular-nums">
            {player.chips}
          </span>
        ) : player.currentBet > 0 ? (
          <span className="text-[10px] sm:text-xs font-semibold text-accent tabular-nums">
            {player.currentBet}
          </span>
        ) : (
          <span className="text-[10px] sm:text-xs tabular-nums text-muted">
            {player.chips}
          </span>
        )}
      </div>

      {/* Cards at showdown */}
      <AnimatePresence>
        {showCards && player.cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-0.5 mt-0.5"
          >
            {player.cards.map((card, i) => (
              <MiniCard key={`${card.rank}${card.suit}-${i}`} card={card} dimmed={!isWinner && showCards} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand result name */}
      <AnimatePresence>
        {player.result && showCards && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] sm:text-xs text-center max-w-[6rem] leading-tight ${isWinner ? "text-correct font-semibold" : "text-muted"}`}
          >
            {player.result.name}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
