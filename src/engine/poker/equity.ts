import type { Card, Suit, Rank } from "../types";
import { evaluateHand } from "./evaluator";

const SUITS: Suit[] = ["\u2660", "\u2665", "\u2666", "\u2663"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`;
}

/**
 * Monte Carlo equity estimation.
 * Simulates random runouts and opponent hands to estimate win probability.
 * Returns equity as 0-100 percentage.
 */
export function estimateEquity(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number,
  simulations: number = 700,
): number {
  if (holeCards.length < 2 || numOpponents < 1) return 0;

  const used = new Set([...holeCards, ...communityCards].map(cardKey));
  const remaining = fullDeck().filter((c) => !used.has(cardKey(c)));

  let wins = 0;
  let ties = 0;

  for (let sim = 0; sim < simulations; sim++) {
    // Fisher-Yates shuffle of remaining cards
    const shuffled = [...remaining];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let cardIdx = 0;

    // Complete community to 5 cards
    const simCommunity = [...communityCards];
    while (simCommunity.length < 5) {
      simCommunity.push(shuffled[cardIdx++]);
    }

    // Evaluate player hand
    const playerHand = evaluateHand(holeCards, simCommunity);

    // Deal and evaluate each opponent
    let playerBest = true;
    let isTie = false;

    for (let opp = 0; opp < numOpponents; opp++) {
      const oppCards = [shuffled[cardIdx++], shuffled[cardIdx++]];
      const oppHand = evaluateHand(oppCards, simCommunity);

      if (oppHand.score > playerHand.score) {
        playerBest = false;
        isTie = false;
        break;
      } else if (oppHand.score === playerHand.score) {
        isTie = true;
      }
    }

    if (playerBest && !isTie) {
      wins++;
    } else if (playerBest && isTie) {
      ties++;
    }
  }

  // Equity = wins + ties/2 (split pot)
  const equity = ((wins + ties * 0.5) / simulations) * 100;
  return Math.round(equity);
}
