"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import PokerCard from "./PokerCard";

interface CommunityCardsProps {
  cards: CardType[];
  phase: string;
}

export default function CommunityCards({ cards, phase }: CommunityCardsProps) {
  if (cards.length === 0 && phase === "preflop") {
    return (
      <div className="flex gap-1.5 sm:gap-2 h-[5.75rem] sm:h-[8rem] items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="card-size rounded-lg border border-border/30 bg-transparent"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 sm:gap-2">
      <AnimatePresence>
        {cards.map((card, i) => (
          <PokerCard key={`${card.rank}${card.suit}-${i}`} card={card} delay={i < 3 ? i * 0.1 : 0} />
        ))}
      </AnimatePresence>
      {/* Placeholder slots for remaining cards */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="card-size rounded-lg border border-border/30 bg-transparent"
        />
      ))}
    </div>
  );
}
