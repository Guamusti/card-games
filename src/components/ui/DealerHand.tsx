"use client";

import Card from "./Card";
import type { Card as CardType } from "@/engine/types";
import { handValue } from "@/engine/types";

interface DealerHandProps {
  cards: CardType[];
  hidden: boolean;
}

export default function DealerHand({ cards, hidden }: DealerHandProps) {
  const visibleCards = hidden ? cards.slice(0, 1) : cards;
  const value = hidden ? handValue(cards.slice(0, 1)) : handValue(cards);

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted">
        Dealer
      </span>

      <div className="flex gap-1 sm:gap-1.5">
        {visibleCards.map((card, i) => (
          <Card key={`d-${card.rank}${card.suit}-${i}`} card={card} index={i} />
        ))}
        {hidden && cards.length > 1 && <Card card={cards[1]} hidden index={1} />}
      </div>

      <span className="text-xs sm:text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
