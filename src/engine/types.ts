export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Action = "hit" | "stand" | "double" | "split";

export interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isStanding: boolean;
  result?: "win" | "lose" | "push" | "blackjack";
}

export type GamePhase = "betting" | "playing" | "dealer-turn" | "settled";

export interface GameState {
  deck: Card[];
  dealer: { cards: Card[]; hidden: boolean };
  hands: Hand[];
  activeHandIndex: number;
  phase: GamePhase;
  balance: number;
  currentBet: number;
  lastFeedback: StrategyFeedback | null;
}

export interface StrategyFeedback {
  playerAction: Action;
  correctAction: Action;
  isCorrect: boolean;
}

export function isRed(suit: Suit): boolean {
  return suit === "♥" || suit === "♦";
}

export function cardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isSoft(cards: Card[]): boolean {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 1) {
    total -= 10;
    aces--;
  }
  return aces > 0 && total <= 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function canSplit(hand: Hand): boolean {
  return (
    hand.cards.length === 2 && cardValue(hand.cards[0]) === cardValue(hand.cards[1])
  );
}
