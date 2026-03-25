/**
 * Simplified BJ win probability estimation.
 * Uses dealer bust tables + basic hand strength to approximate
 * win % for each action (hit/stand/double/split).
 */
import type { Card, Action } from "./types";
import { handValue, isSoft } from "./types";

// Dealer bust probability by upcard value (2-A), based on S17 rules
// Source: standard BJ probability tables for 6-deck S17
const DEALER_BUST_PROB: Record<number, number> = {
  2: 0.354, 3: 0.374, 4: 0.394, 5: 0.417, 6: 0.423,
  7: 0.262, 8: 0.244, 9: 0.230, 10: 0.214, 11: 0.116,
};

// Dealer final hand distribution by upcard (17-21 probabilities)
const DEALER_HAND_DIST: Record<number, number[]> = {
  // [p(17), p(18), p(19), p(20), p(21)]
  2:  [0.140, 0.133, 0.130, 0.124, 0.119],
  3:  [0.134, 0.131, 0.127, 0.122, 0.112],
  4:  [0.131, 0.126, 0.121, 0.116, 0.112],
  5:  [0.122, 0.121, 0.117, 0.113, 0.110],
  6:  [0.166, 0.106, 0.107, 0.101, 0.097],
  7:  [0.369, 0.138, 0.078, 0.079, 0.074],
  8:  [0.130, 0.363, 0.129, 0.069, 0.065],
  9:  [0.121, 0.103, 0.357, 0.122, 0.067],
  10: [0.114, 0.114, 0.114, 0.340, 0.104],
  11: [0.131, 0.131, 0.131, 0.131, 0.360],
};

function upcardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

/** Probability of winning if standing at given total */
function standWinProb(playerTotal: number, upcardVal: number): number {
  if (playerTotal > 21) return 0;

  const bustP = DEALER_BUST_PROB[upcardVal] ?? 0.2;
  const dist = DEALER_HAND_DIST[upcardVal] ?? [0.14, 0.14, 0.14, 0.14, 0.14];

  let winP = bustP;
  let pushP = 0;

  // dist[i] = probability dealer ends with 17+i
  for (let i = 0; i < 5; i++) {
    const dealerTotal = 17 + i;
    if (playerTotal > dealerTotal) winP += dist[i];
    else if (playerTotal === dealerTotal) pushP += dist[i];
  }

  return winP + pushP * 0.5; // Push counts as half a win for EV
}

/** Rough hit probability — average of hitting to various totals */
function hitWinProb(playerTotal: number, isSoftHand: boolean, upcardVal: number): number {
  if (playerTotal > 21) return 0;

  // Estimate: draw one card, weight by 1/13 for each rank
  const draws = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; // A=1 or 11
  let totalP = 0;

  for (const d of draws) {
    let newTotal = playerTotal + d;
    let soft = isSoftHand;

    // Ace handling
    if (d === 1) {
      if (newTotal + 10 <= 21) {
        newTotal += 10;
        soft = true;
      }
    }

    if (newTotal > 21 && soft) {
      newTotal -= 10;
      soft = false;
    }

    if (newTotal > 21) {
      totalP += 0; // bust
    } else if (newTotal >= 17) {
      totalP += standWinProb(newTotal, upcardVal);
    } else {
      // Would hit again — approximate as stand on that total (slight underestimate)
      totalP += standWinProb(newTotal, upcardVal) * 0.85;
    }
  }

  return totalP / draws.length;
}

export interface BJActionProbs {
  hit: number;
  stand: number;
  double: number;
  split: number | null;
  best: Action;
  bestProb: number;
}

export function getBJActionProbabilities(
  playerCards: Card[],
  dealerUpcard: Card,
  canDouble: boolean,
  canSplitHand: boolean,
): BJActionProbs {
  const total = handValue(playerCards);
  const soft = isSoft(playerCards);
  const uv = upcardValue(dealerUpcard);

  const standP = standWinProb(total, uv);
  const hitP = hitWinProb(total, soft, uv);

  // Double: same as hit but you only get one card, so slightly different
  // Approximate as hit probability (since you draw exactly one card)
  let doubleP = 0;
  if (canDouble) {
    const draws = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
    let totalDP = 0;
    for (const d of draws) {
      let newTotal = total + d;
      let s = soft;
      if (d === 1 && newTotal + 10 <= 21) { newTotal += 10; s = true; }
      if (newTotal > 21 && s) { newTotal -= 10; }
      if (newTotal > 21) {
        totalDP += 0;
      } else {
        totalDP += standWinProb(newTotal, uv);
      }
    }
    doubleP = totalDP / draws.length;
  }

  // Split: rough estimate — each hand plays from half the pair
  let splitP: number | null = null;
  if (canSplitHand && playerCards.length === 2) {
    const singleCardVal = handValue([playerCards[0]]);
    // Approximate: each split hand starts with that card value, then hits
    splitP = hitWinProb(singleCardVal, playerCards[0].rank === "A", uv);
  }

  // Find best
  const actions: { action: Action; prob: number }[] = [
    { action: "hit", prob: hitP },
    { action: "stand", prob: standP },
  ];
  if (canDouble) actions.push({ action: "double", prob: doubleP });
  if (splitP !== null) actions.push({ action: "split", prob: splitP });

  actions.sort((a, b) => b.prob - a.prob);

  return {
    hit: Math.round(hitP * 100),
    stand: Math.round(standP * 100),
    double: Math.round(doubleP * 100),
    split: splitP !== null ? Math.round(splitP * 100) : null,
    best: actions[0].action,
    bestProb: Math.round(actions[0].prob * 100),
  };
}
