"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardType } from "@/engine/types";
import PokerCard from "./PokerCard";
import HandRankings from "./HandRankings";

interface CommunityCardsProps {
  cards: CardType[];
  phase: string;
}

function getRevealedCount(phase: string): number {
  switch (phase) {
    case "preflop":
    case "dealing":
      return 0;
    case "flop":
      return 3;
    case "turn":
      return 4;
    case "river":
    case "showdown":
    case "settled":
      return 5;
    default:
      return 0;
  }
}

export default function CommunityCards({ cards, phase }: CommunityCardsProps) {
  const revealedCount = getRevealedCount(phase);
  const [showRankings, setShowRankings] = useState(false);

  const isClickable = phase !== "betting" && cards.length > 0;

  // No cards dealt yet (lobby)
  if (cards.length === 0) {
    return (
      <div className="flex gap-1.5 sm:gap-2">
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
    <>
      <div
        className={`flex gap-1.5 sm:gap-2 ${isClickable ? "cursor-pointer" : ""}`}
        onClick={isClickable ? () => setShowRankings(true) : undefined}
      >
        {cards.slice(0, 5).map((card, i) => {
          const isRevealed = i < revealedCount;
          const isNewlyRevealed =
            isRevealed &&
            i >= revealedCount - (phase === "flop" ? 3 : 1);

          let delay = 0;
          if (isNewlyRevealed) {
            if (phase === "flop") {
              delay = i * 0.15;
            } else {
              delay = 0.05;
            }
          }

          return (
            <motion.div
              key={`community-${i}`}
              initial={
                isNewlyRevealed
                  ? phase === "flop"
                    ? { opacity: 0, x: 60, y: -30, rotateY: 120, scale: 0.7 }
                    : { opacity: 0, y: -20, rotateY: 90 }
                  : false
              }
              animate={{ opacity: 1, x: 0, y: 0, rotateY: 0, scale: 1 }}
              transition={
                phase === "flop" && isNewlyRevealed
                  ? {
                      duration: 0.45,
                      delay,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  : {
                      duration: 0.35,
                      delay,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              <PokerCard
                card={card}
                hidden={!isRevealed}
                delay={0}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Hand rankings modal triggered by clicking community cards */}
      <HandRankings externalOpen={showRankings} onClose={() => setShowRankings(false)} />
    </>
  );
}
