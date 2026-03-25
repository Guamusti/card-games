import type { Card } from "../types";

export type VPPhase = "betting" | "dealing" | "holding" | "drawing" | "settled";

export type VPHandRank =
  | "Royal Flush"
  | "Straight Flush"
  | "Four of a Kind"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Three of a Kind"
  | "Two Pair"
  | "Jacks or Better"
  | "Nothing";

export type VPPaytable = Record<VPHandRank, number>;

export const JACKS_OR_BETTER_PAYTABLE: VPPaytable = {
  "Royal Flush": 250,
  "Straight Flush": 50,
  "Four of a Kind": 25,
  "Full House": 9,
  "Flush": 6,
  "Straight": 4,
  "Three of a Kind": 3,
  "Two Pair": 2,
  "Jacks or Better": 1,
  "Nothing": 0,
};

export interface VPStats {
  handsPlayed: number;
  wins: number;
  correctHolds: number;
  totalHolds: number;
}

export interface VPResult {
  handRank: VPHandRank;
  payout: number;
}

export interface VPState {
  deck: Card[];
  hand: Card[];
  held: boolean[];
  phase: VPPhase;
  balance: number;
  currentBet: number;
  result: VPResult | null;
  stats: VPStats;
  holdFeedback: { isCorrect: boolean; optimalHeld: boolean[] } | null;
}
