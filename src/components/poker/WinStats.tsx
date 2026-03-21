"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/engine/types";
import { calculateProbabilities } from "@/engine/poker/probability";
import type { HandRank } from "@/engine/poker/types";

const BEST_HAND_PRIORITY: HandRank[] = [
  "royal-flush", "straight-flush", "four-of-a-kind", "full-house",
  "flush", "straight", "three-of-a-kind", "two-pair", "pair", "high-card",
];

const RANK_LABELS: Partial<Record<HandRank, string>> = {
  "high-card": "High Card",
  "pair": "Pair",
  "two-pair": "Two Pair",
  "three-of-a-kind": "Trips",
  "straight": "Straight",
  "flush": "Flush",
  "full-house": "Full House",
  "four-of-a-kind": "Quads",
  "straight-flush": "Str. Flush",
  "royal-flush": "Royal Flush",
};

interface WinStatsProps {
  holeCards: Card[];
  community: Card[];
  numOpponents: number;
  phase: string;
}

export default function WinStats({ holeCards, community, numOpponents, phase }: WinStatsProps) {
  const [winPct, setWinPct] = useState(0);
  const [bestHand, setBestHand] = useState<string>("High Card");
  const [bestHandPct, setBestHandPct] = useState(0);

  useEffect(() => {
    if (holeCards.length < 2 || phase === "betting" || phase === "settled") return;

    // Run simulation in a timeout to not block UI
    const timer = setTimeout(() => {
      const result = calculateProbabilities(holeCards, community, numOpponents, 800);
      setWinPct(result.winPct);

      // Find the best achievable hand (highest rank with >0%)
      for (const rank of BEST_HAND_PRIORITY) {
        const pct = result.handDist[rank];
        if (pct && pct > 0) {
          setBestHand(RANK_LABELS[rank] || rank);
          setBestHandPct(pct);
          break;
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [holeCards, community, numOpponents, phase]);

  if (holeCards.length < 2 || phase === "betting") return null;

  return (
    <div className="flex flex-col items-center gap-0.5 bg-surface border border-border rounded-xl p-3 min-w-[5.5rem]">
      <span className="text-[10px] text-muted">Win</span>
      <span className={`text-lg sm:text-xl font-bold tabular-nums ${
        winPct >= 50 ? "text-correct" : winPct >= 25 ? "text-foreground" : "text-accent"
      }`}>
        {winPct}%
      </span>
      <span className="text-[10px] text-muted">{bestHand}</span>
      <span className="text-sm font-semibold tabular-nums">{bestHandPct}%</span>
    </div>
  );
}
