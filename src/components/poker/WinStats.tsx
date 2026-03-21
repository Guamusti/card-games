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

    const timer = setTimeout(() => {
      const result = calculateProbabilities(holeCards, community, numOpponents, 800);
      setWinPct(result.winPct);

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
    <div className="flex flex-col items-center justify-center gap-1 bg-surface border border-border rounded-xl px-4 py-3 w-24 sm:w-28">
      <span className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider">Win</span>
      <span className={`text-base sm:text-lg font-bold tabular-nums leading-none ${
        winPct >= 50 ? "text-correct" : winPct >= 25 ? "text-foreground" : "text-accent"
      }`}>
        {winPct}%
      </span>
      <span className="text-[9px] sm:text-[10px] text-muted leading-tight text-center">{bestHand}</span>
      <span className="text-xs sm:text-sm font-semibold tabular-nums leading-none">{bestHandPct}%</span>
    </div>
  );
}
