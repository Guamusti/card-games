import type { Card, Rank } from "../types";
import type { EvaluatedHand, HandRank } from "./types";
import { HAND_RANK_NAMES } from "./types";

const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// Score multipliers to ensure hand ranks don't overlap
const RANK_MULTIPLIER: Record<HandRank, number> = {
  "high-card": 0,
  "pair": 1000000,
  "two-pair": 2000000,
  "three-of-a-kind": 3000000,
  "straight": 4000000,
  "flush": 5000000,
  "full-house": 6000000,
  "four-of-a-kind": 7000000,
  "straight-flush": 8000000,
  "royal-flush": 9000000,
};

function rankVal(card: Card): number {
  return RANK_VALUES[card.rank];
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const result: Card[][] = [];
  const first = cards[0];
  const rest = cards.slice(1);
  // Include first
  for (const combo of getCombinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // Exclude first
  for (const combo of getCombinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

function evaluate5(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => rankVal(b) - rankVal(a));
  const values = sorted.map(rankVal);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (including A-low: A,2,3,4,5)
  let isStraight = false;
  let straightHigh = values[0];

  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  }
  // Ace-low straight: A,5,4,3,2
  if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5; // 5-high straight
  }

  // Count ranks
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const countEntries = Object.entries(counts)
    .map(([v, c]) => ({ value: parseInt(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  let rank: HandRank;
  let tiebreaker = 0;

  if (isFlush && isStraight && straightHigh === 14) {
    rank = "royal-flush";
    tiebreaker = 14;
  } else if (isFlush && isStraight) {
    rank = "straight-flush";
    tiebreaker = straightHigh;
  } else if (countEntries[0].count === 4) {
    rank = "four-of-a-kind";
    tiebreaker = countEntries[0].value * 15 + countEntries[1].value;
  } else if (countEntries[0].count === 3 && countEntries[1].count === 2) {
    rank = "full-house";
    tiebreaker = countEntries[0].value * 15 + countEntries[1].value;
  } else if (isFlush) {
    rank = "flush";
    tiebreaker =
      values[0] * 15 ** 4 +
      values[1] * 15 ** 3 +
      values[2] * 15 ** 2 +
      values[3] * 15 +
      values[4];
  } else if (isStraight) {
    rank = "straight";
    tiebreaker = straightHigh;
  } else if (countEntries[0].count === 3) {
    rank = "three-of-a-kind";
    const kickers = countEntries.filter((e) => e.count === 1).map((e) => e.value);
    tiebreaker = countEntries[0].value * 15 ** 2 + kickers[0] * 15 + kickers[1];
  } else if (countEntries[0].count === 2 && countEntries[1].count === 2) {
    rank = "two-pair";
    const pairs = countEntries.filter((e) => e.count === 2).map((e) => e.value).sort((a, b) => b - a);
    const kicker = countEntries.find((e) => e.count === 1)!.value;
    tiebreaker = pairs[0] * 15 ** 2 + pairs[1] * 15 + kicker;
  } else if (countEntries[0].count === 2) {
    rank = "pair";
    const kickers = countEntries.filter((e) => e.count === 1).map((e) => e.value).sort((a, b) => b - a);
    tiebreaker =
      countEntries[0].value * 15 ** 3 +
      kickers[0] * 15 ** 2 +
      kickers[1] * 15 +
      kickers[2];
  } else {
    rank = "high-card";
    tiebreaker =
      values[0] * 15 ** 4 +
      values[1] * 15 ** 3 +
      values[2] * 15 ** 2 +
      values[3] * 15 +
      values[4];
  }

  const score = RANK_MULTIPLIER[rank] + tiebreaker;

  // Build name
  let name = HAND_RANK_NAMES[rank];
  if (rank === "pair") {
    name = `Pair of ${rankName(countEntries[0].value)}s`;
  } else if (rank === "two-pair") {
    const pairs = countEntries.filter((e) => e.count === 2).map((e) => e.value).sort((a, b) => b - a);
    name = `${rankName(pairs[0])}s and ${rankName(pairs[1])}s`;
  } else if (rank === "three-of-a-kind") {
    name = `Trip ${rankName(countEntries[0].value)}s`;
  } else if (rank === "straight" || rank === "straight-flush") {
    name = `${HAND_RANK_NAMES[rank]}, ${rankName(straightHigh)}-high`;
  } else if (rank === "flush") {
    name = `Flush, ${rankName(values[0])}-high`;
  } else if (rank === "full-house") {
    name = `${rankName(countEntries[0].value)}s full of ${rankName(countEntries[1].value)}s`;
  } else if (rank === "four-of-a-kind") {
    name = `Quad ${rankName(countEntries[0].value)}s`;
  } else if (rank === "high-card") {
    name = `${rankName(values[0])}-high`;
  }

  return { rank, score, bestCards: sorted, name };
}

function rankName(value: number): string {
  const names: Record<number, string> = {
    2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8",
    9: "9", 10: "10", 11: "Jack", 12: "Queen", 13: "King", 14: "Ace",
  };
  return names[value] || String(value);
}

/** Evaluate the best 5-card hand from 7 cards (2 hole + 5 community) */
export function evaluateHand(holeCards: Card[], community: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...community];
  const combos = getCombinations(allCards, 5);
  let best: EvaluatedHand | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || result.score > best.score) {
      best = result;
    }
  }
  return best!;
}

/** Compare two evaluated hands. Returns positive if a wins, negative if b wins, 0 for tie */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  return a.score - b.score;
}
