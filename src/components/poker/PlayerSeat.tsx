"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PokerPlayer } from "@/engine/poker/types";

interface PlayerSeatProps {
  player: PokerPlayer;
  isDealer: boolean;
  isActive: boolean;
  showCards: boolean;
  isWinner: boolean;
}

export default function PlayerSeat({
  player, isDealer, isActive, showCards, isWinner,
}: PlayerSeatProps) {
  const dimmed = player.folded;

  return (
    <div className={`flex flex-col items-center gap-1 transition-opacity ${dimmed ? "opacity-40" : ""}`}>
      {/* Avatar */}
      <div className="relative">
        <div className={`text-2xl sm:text-3xl ${isActive ? "animate-pulse" : ""}`}>
          {player.avatar}
        </div>
        {isDealer && (
          <span className="absolute -bottom-0.5 -right-1 text-[8px] bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center font-bold">
            D
          </span>
        )}
      </div>

      {/* Name */}
      <span className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-foreground" : "text-muted"}`}>
        {player.name}
      </span>

      {/* Chips */}
      <span className={`text-[10px] sm:text-xs tabular-nums font-semibold ${isWinner ? "text-correct" : ""}`}>
        {player.chips}
      </span>

      {/* Current bet badge */}
      <AnimatePresence>
        {player.currentBet > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-[9px] bg-border/60 px-1.5 py-0.5 rounded-full tabular-nums text-muted"
          >
            {player.currentBet}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Status indicators */}
      {player.isAllIn && !player.folded && (
        <span className="text-[9px] font-bold text-correct uppercase">All-in</span>
      )}

      {/* Hand result (showdown) */}
      <AnimatePresence>
        {player.result && showCards && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[9px] text-muted text-center max-w-[4rem] leading-tight"
          >
            {player.result.name}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
