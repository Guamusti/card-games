import type { Card, Rank } from "../types";
import type { VPHandRank } from "./types";

const RANK_ORDER: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

function rankVal(r: Rank): number {
  return RANK_ORDER[r];
}

function sortedValues(cards: Card[]): number[] {
  return cards.map((c) => rankVal(c.rank)).sort((a, b) => a - b);
}

function getRankCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const c of cards) {
    const v = rankVal(c.rank);
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}

function isFlush(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): boolean {
  const vals = sortedValues(cards);
  // Normal straight
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] !== vals[i - 1] + 1) {
      // Check A-2-3-4-5 (wheel)
      if (i === 4 && vals[4] === 14 && vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5) {
        return true;
      }
      return false;
    }
  }
  return true;
}

function isRoyal(cards: Card[]): boolean {
  const vals = sortedValues(cards);
  return vals[0] === 10 && vals[1] === 11 && vals[2] === 12 && vals[3] === 13 && vals[4] === 14;
}

export function evaluateHand(cards: Card[]): VPHandRank {
  if (cards.length !== 5) return "Nothing";

  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const counts = getRankCounts(cards);
  const freqs = Array.from(counts.values()).sort((a, b) => b - a);

  // Royal Flush
  if (flush && straight && isRoyal(cards)) return "Royal Flush";

  // Straight Flush
  if (flush && straight) return "Straight Flush";

  // Four of a Kind
  if (freqs[0] === 4) return "Four of a Kind";

  // Full House
  if (freqs[0] === 3 && freqs[1] === 2) return "Full House";

  // Flush
  if (flush) return "Flush";

  // Straight
  if (straight) return "Straight";

  // Three of a Kind
  if (freqs[0] === 3) return "Three of a Kind";

  // Two Pair
  if (freqs[0] === 2 && freqs[1] === 2) return "Two Pair";

  // Jacks or Better (pair of J, Q, K, or A)
  if (freqs[0] === 2) {
    for (const [val, count] of counts) {
      if (count === 2 && val >= 11) return "Jacks or Better";
    }
  }

  return "Nothing";
}

export { RANK_ORDER, rankVal, isFlush, isStraight, isRoyal, getRankCounts, sortedValues };
