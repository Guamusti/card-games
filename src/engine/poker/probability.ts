import type { Card, Suit, Rank } from "../types";
import { evaluateHand } from "./evaluator";
import type { HandRank } from "./types";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
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

/** Monte Carlo simulation for win probability and hand type distribution */
export function calculateProbabilities(
  holeCards: Card[],
  community: Card[],
  numOpponents: number,
  simulations: number = 1000,
): { winPct: number; handDist: Partial<Record<HandRank, number>> } {
  if (holeCards.length < 2) return { winPct: 0, handDist: {} };

  const used = new Set([...holeCards, ...community].map(cardKey));
  const remaining = fullDeck().filter((c) => !used.has(cardKey(c)));

  let wins = 0;
  const handCounts: Partial<Record<HandRank, number>> = {};

  for (let sim = 0; sim < simulations; sim++) {
    // Shuffle remaining cards
    const shuffled = [...remaining];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let cardIdx = 0;

    // Complete community cards
    const simCommunity = [...community];
    while (simCommunity.length < 5) {
      simCommunity.push(shuffled[cardIdx++]);
    }

    // Evaluate player's hand
    const playerHand = evaluateHand(holeCards, simCommunity);

    // Count hand type
    handCounts[playerHand.rank] = (handCounts[playerHand.rank] || 0) + 1;

    // Deal and evaluate opponents
    let playerWins = true;
    for (let opp = 0; opp < numOpponents; opp++) {
      const oppCards = [shuffled[cardIdx++], shuffled[cardIdx++]];
      const oppHand = evaluateHand(oppCards, simCommunity);
      if (oppHand.score >= playerHand.score) {
        playerWins = false;
        break;
      }
    }

    if (playerWins) wins++;
  }

  // Convert counts to percentages
  const handDist: Partial<Record<HandRank, number>> = {};
  for (const [rank, count] of Object.entries(handCounts)) {
    handDist[rank as HandRank] = Math.round((count / simulations) * 100);
  }

  return {
    winPct: Math.round((wins / simulations) * 100),
    handDist,
  };
}
