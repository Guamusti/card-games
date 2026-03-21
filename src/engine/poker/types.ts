import type { Card } from "../types";

export type PokerPhase =
  | "betting"
  | "dealing"
  | "preflop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "settled";

export type PokerAction = "fold" | "check" | "call" | "raise" | "all-in";

export type HandRank =
  | "high-card"
  | "pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush"
  | "royal-flush";

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  "high-card": "High Card",
  "pair": "Pair",
  "two-pair": "Two Pair",
  "three-of-a-kind": "Three of a Kind",
  "straight": "Straight",
  "flush": "Flush",
  "full-house": "Full House",
  "four-of-a-kind": "Four of a Kind",
  "straight-flush": "Straight Flush",
  "royal-flush": "Royal Flush",
};

export interface EvaluatedHand {
  rank: HandRank;
  score: number;
  bestCards: Card[];
  name: string;
}

export const AI_NAMES = ["Alex", "Dana", "Riku", "Zara", "Leo"];
export const AI_AVATARS = ["🦊", "🐱", "🦉", "🐼", "🦁"];

export interface PokerPlayer {
  id: string; // "player" | "ai-0" | "ai-1" etc.
  name: string;
  avatar: string;
  cards: Card[];
  chips: number;
  currentBet: number;
  totalBet: number;
  folded: boolean;
  isAllIn: boolean;
  result?: EvaluatedHand;
  isHuman: boolean;
}

export interface PokerState {
  deck: Card[];
  community: Card[];
  players: PokerPlayer[];
  activePlayerIndex: number;
  phase: PokerPhase;
  pot: number;
  minRaise: number;
  dealerIndex: number;
  lastAction: { player: string; action: PokerAction; amount?: number } | null;
  winnerIds: string[];
  showAllCards: boolean;
  currentRaise: number;
  bigBlind: number;
  smallBlind: number;
}
