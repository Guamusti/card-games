"use client";

import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";
import type { Hand as HandType } from "@/engine/types";
import { handValue } from "@/engine/types";

interface HandProps {
  hand: HandType;
  isActive?: boolean;
  label?: string;
}

export default function Hand({ hand, isActive = false, label }: HandProps) {
  const value = handValue(hand.cards);
  const isBust = value > 21;
  const isWin = hand.result === "win" || hand.result === "blackjack";

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      {label && (
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted">
          {label}
        </span>
      )}

      <div className="flex gap-1 sm:gap-1.5">
        {hand.cards.map((card, i) => (
          <Card key={`${card.rank}${card.suit}-${i}`} card={card} index={i} />
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm sm:text-base font-semibold tabular-nums ${
            isBust ? "text-accent" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <AnimatePresence>
          {hand.result && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                isWin
                  ? "text-correct"
                  : hand.result === "lose"
                  ? "text-accent"
                  : "text-muted"
              }`}
            >
              {hand.result === "blackjack"
                ? "Blackjack!"
                : hand.result === "win"
                ? "Win"
                : hand.result === "lose"
                ? "Lose"
                : "Push"}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && !hand.result && (
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground animate-pulse" />
        )}
      </div>

      {/* Win glow */}
      <AnimatePresence>
        {isWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-xs sm:text-sm font-medium text-correct tabular-nums"
            >
              +${hand.bet}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
