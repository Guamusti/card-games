"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import { suitColor } from "@/engine/types";
import { useCustomizeStore } from "@/engine/customize/store";
import { getCardBack } from "@/engine/customize/cardBacks";

interface PokerCardProps {
  card: CardType;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
  large?: boolean;
}

export default function PokerCard({ card, hidden = false, delay = 0, small = false, large = false }: PokerCardProps) {
  const sc = suitColor(card.suit);
  const { cardBack, showCardShadow, animationSpeed } = useCustomizeStore();
  const back = getCardBack(cardBack);
  const dur = animationSpeed === "fast" ? 0.3 : animationSpeed === "slow" ? 0.6 : 0.4;

  const sizeClass = small ? "poker-card-sm" : large ? "player-card-size" : "card-size";

  // Track previous hidden state to detect flip transitions
  const [wasHidden, setWasHidden] = useState(hidden);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (wasHidden && !hidden) {
      // Was hidden, now revealed → trigger flip
      setFlipping(true);
      const timer = setTimeout(() => setFlipping(false), dur * 1000);
      return () => clearTimeout(timer);
    }
    setWasHidden(hidden);
  }, [hidden, wasHidden, dur]);

  if (hidden) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`${sizeClass} rounded-lg border border-border flex items-center justify-center select-none`}
        style={{
          backgroundColor: back.bg,
          backgroundImage: back.pattern || undefined,
          backgroundSize: back.pattern ? "auto" : undefined,
          perspective: "600px",
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

  // Revealed card — with flip animation if transitioning from hidden
  return (
    <div className={`${sizeClass} relative`} style={{ perspective: "600px" }}>
      <motion.div
        initial={flipping ? { rotateY: 180 } : { opacity: 0, scale: 0.85 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={
          flipping
            ? { duration: dur, ease: [0.22, 1, 0.36, 1], delay }
            : { duration: dur, delay, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        className={`w-full h-full rounded-lg border border-border bg-surface flex flex-col justify-between p-1.5 sm:p-2 select-none ${showCardShadow ? "shadow-sm" : ""}`}
      >
        <div className="flex flex-col items-start leading-none" style={{ color: sc }}>
          <span className="card-rank font-semibold">{card.rank}</span>
          <span className="card-suit -mt-px">{card.suit}</span>
        </div>
        <div className="flex items-center justify-center flex-1 pointer-events-none">
          <span className="card-center-suit opacity-10" style={{ color: sc }}>{card.suit}</span>
        </div>
        <div className="flex flex-col items-end leading-none rotate-180" style={{ color: sc }}>
          <span className="card-rank font-semibold">{card.rank}</span>
          <span className="card-suit -mt-px">{card.suit}</span>
        </div>
      </motion.div>
    </div>
  );
}
