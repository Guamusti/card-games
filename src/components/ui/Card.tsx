"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import { suitColor } from "@/engine/types";
import { useCustomizeStore } from "@/engine/customize/store";
import { getCardBack } from "@/engine/customize/cardBacks";

interface CardProps {
  card: CardType;
  hidden?: boolean;
  index?: number;
}

export default function Card({ card, hidden = false, index = 0 }: CardProps) {
  const sc = suitColor(card.suit);
  const { cardBack, showCardShadow, animationSpeed } = useCustomizeStore();
  const back = getCardBack(cardBack);
  const dur = animationSpeed === "fast" ? 0.2 : animationSpeed === "slow" ? 0.5 : 0.35;

  if (hidden) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur - 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="card-size rounded-lg border border-border flex items-center justify-center select-none"
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
      initial={{ opacity: 0, y: -40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
      className={`card-size rounded-lg border border-border bg-surface flex flex-col justify-between p-1.5 sm:p-2 select-none ${showCardShadow ? "shadow-sm" : ""}`}
    >
      {/* Top-left rank + suit */}
      <div className="flex flex-col items-start leading-none" style={{ color: sc }}>
        <span className="card-rank font-semibold">
          {card.rank}
        </span>
        <span className="card-suit -mt-px">
          {card.suit}
        </span>
      </div>

      {/* Center ghost suit */}
      <div className="flex items-center justify-center flex-1 pointer-events-none">
        <span className="card-center-suit opacity-10" style={{ color: sc }}>
          {card.suit}
        </span>
      </div>

      {/* Bottom-right (inverted) */}
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color: sc }}>
        <span className="card-rank font-semibold">
          {card.rank}
        </span>
        <span className="card-suit -mt-px">
          {card.suit}
        </span>
      </div>
    </motion.div>
  );
}
