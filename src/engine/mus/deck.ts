import type { SpanishCard } from "./types";
import { SPANISH_SUITS, SPANISH_RANKS } from "./types";

/** Build a fresh 40-card Spanish deck (unshuffled). */
export function createSpanishDeck(): SpanishCard[] {
  const deck: SpanishCard[] = [];
  for (const suit of SPANISH_SUITS) {
    for (const rank of SPANISH_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(cards: T[]): T[] {
  const d = [...cards];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function createShuffledDeck(): SpanishCard[] {
  return shuffle(createSpanishDeck());
}

/** Draw `count` cards off the top; returns the drawn cards and the remaining deck. */
export function drawCards(
  deck: SpanishCard[],
  count: number,
): { cards: SpanishCard[]; deck: SpanishCard[] } {
  return { cards: deck.slice(0, count), deck: deck.slice(count) };
}

export function cardKey(c: SpanishCard): string {
  return `${c.rank}-${c.suit}`;
}
