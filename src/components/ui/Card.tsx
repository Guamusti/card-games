"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import { isRed } from "@/engine/types";

interface CardProps {
  card: CardType;
  hidden?: boolean;
  index?: number;
}

export default function Card({ card, hidden = false, index = 0 }: CardProps) {
  const red = isRed(card.suit);
  const colorClass = red ? "text-card-red" : "text-foreground";

  if (hidden) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.08 }}
        className="card-size rounded-lg border border-border bg-foreground flex items-center justify-center select-none"
      >
        <span className="text-background text-[10px] font-medium tracking-widest opacity-25">
          BJ
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.25, delay: index * 0.08 }}
      className="card-size rounded-lg border border-border bg-surface flex flex-col justify-between p-1 sm:p-1.5 select-none shadow-sm overflow-hidden"
    >
      {/* Top-left rank + suit */}
      <div className="flex flex-col items-start leading-none">
        <span className={`card-rank font-semibold ${colorClass}`}>
          {card.rank}
        </span>
        <span className={`card-suit ${colorClass} -mt-px`}>
          {card.suit}
        </span>
      </div>

      {/* Center ghost suit */}
      <div className="flex items-center justify-center flex-1 pointer-events-none">
        <span className={`card-center-suit ${colorClass} opacity-10`}>
          {card.suit}
        </span>
      </div>

      {/* Bottom-right (inverted) */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`card-rank font-semibold ${colorClass}`}>
          {card.rank}
        </span>
        <span className={`card-suit ${colorClass} -mt-px`}>
          {card.suit}
        </span>
      </div>
    </motion.div>
  );
}
