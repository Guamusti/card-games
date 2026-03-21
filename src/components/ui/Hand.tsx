"use client";

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
          className={`text-xs sm:text-sm font-semibold tabular-nums ${
            isBust ? "text-accent" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {hand.result && (
          <span
            className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${
              hand.result === "win" || hand.result === "blackjack"
                ? "text-correct"
                : hand.result === "lose"
                ? "text-accent"
                : "text-muted"
            }`}
          >
            {hand.result === "blackjack" ? "BJ!" : hand.result}
          </span>
        )}
        {isActive && !hand.result && (
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-foreground animate-pulse" />
        )}
      </div>
    </div>
  );
}
