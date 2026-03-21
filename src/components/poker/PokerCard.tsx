"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import { isRed } from "@/engine/types";
import { useCustomizeStore } from "@/engine/customize/store";
import { getCardBack } from "@/engine/customize/cardBacks";

interface PokerCardProps {
  card: CardType;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
}

export default function PokerCard({ card, hidden = false, delay = 0, small = false }: PokerCardProps) {
  const red = isRed(card.suit);
  const colorClass = red ? "text-card-red" : "text-foreground";
  const { cardBack, showCardShadow, animationSpeed } = useCustomizeStore();
  const back = getCardBack(cardBack);
  const dur = animationSpeed === "fast" ? 0.2 : animationSpeed === "slow" ? 0.5 : 0.35;

  const sizeClass = small ? "poker-card-sm" : "card-size";

  if (hidden) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur - 0.05, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`${sizeClass} rounded-lg border border-border flex items-center justify-center select-none`}
        style={{
          backgroundColor: back.bg,
          backgroundImage: back.pattern || undefined,
          backgroundSize: back.pattern ? "auto" : undefined,
        }}
      >
        <span
          className="text-[10px] font-medium tracking-widest"
          style={{ color: back.labelColor }}
        >
          {back.label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${sizeClass} rounded-lg border border-border bg-surface flex flex-col justify-between p-1.5 sm:p-2 select-none ${showCardShadow ? "shadow-sm" : ""}`}
    >
      <div className="flex flex-col items-start leading-none">
        <span className={`card-rank font-semibold ${colorClass}`}>{card.rank}</span>
        <span className={`card-suit ${colorClass} -mt-px`}>{card.suit}</span>
      </div>
      <div className="flex items-center justify-center flex-1 pointer-events-none">
        <span className={`card-center-suit ${colorClass} opacity-10`}>{card.suit}</span>
      </div>
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`card-rank font-semibold ${colorClass}`}>{card.rank}</span>
        <span className={`card-suit ${colorClass} -mt-px`}>{card.suit}</span>
      </div>
    </motion.div>
  );
}
