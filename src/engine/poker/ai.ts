import type { Card } from "../types";
import type { PokerAction, PokerPhase } from "./types";
import { evaluateHand } from "./evaluator";

interface AIContext {
  holeCards: Card[];
  community: Card[];
  pot: number;
  toCall: number;
  chips: number;
  phase: PokerPhase;
  bigBlind: number;
}

/** Simple poker AI that plays reasonably — not too easy, not GTO */
export function getAIAction(ctx: AIContext): { action: PokerAction; amount?: number } {
  const { holeCards, community, pot, toCall, chips, phase, bigBlind } = ctx;

  // If can't afford to call, fold or all-in
  if (toCall > 0 && chips <= 0) {
    return { action: "fold" };
  }

  // Preflop logic based on hand strength tiers
  if (phase === "preflop") {
    return preflopAI(holeCards, pot, toCall, chips, bigBlind);
  }

  // Postflop: evaluate current hand strength
  const hand = evaluateHand(holeCards, community);
  const score = hand.score;

  // Rough thresholds based on hand rank
  const hasMonster = score >= 6000000; // full house+
  const hasStrong = score >= 4000000; // straight+
  const hasMedium = score >= 2000000; // two pair+
  const hasPair = score >= 1000000; // pair+

  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const rand = Math.random();

  if (hasMonster) {
    // Slow-play sometimes, otherwise raise big
    if (rand < 0.3 && toCall === 0) {
      return { action: "check" };
    }
    const raiseAmount = Math.min(pot + bigBlind * 2, chips);
    if (raiseAmount > toCall) {
      return { action: "raise", amount: raiseAmount };
    }
    return toCall > 0 ? { action: "call" } : { action: "check" };
  }

  if (hasStrong) {
    if (toCall > 0 && toCall < pot * 0.8) {
      // Raise sometimes
      if (rand < 0.5) {
        const raiseAmount = Math.min(toCall + pot * 0.6, chips);
        if (raiseAmount > toCall) {
          return { action: "raise", amount: Math.floor(raiseAmount) };
        }
      }
      return { action: "call" };
    }
    if (toCall === 0) {
      if (rand < 0.6) {
        const betAmount = Math.min(Math.floor(pot * 0.6), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    // Big bet to call — still call with strong hand
    return toCall <= chips * 0.5 ? { action: "call" } : { action: "fold" };
  }

  if (hasMedium) {
    if (toCall === 0) {
      if (rand < 0.4) {
        const betAmount = Math.min(Math.floor(pot * 0.4), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    if (potOdds < 0.3) return { action: "call" };
    return rand < 0.4 ? { action: "call" } : { action: "fold" };
  }

  if (hasPair) {
    if (toCall === 0) {
      // Occasionally bet with a pair
      if (rand < 0.25) {
        const betAmount = Math.min(Math.floor(pot * 0.3), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    if (potOdds < 0.2) return { action: "call" };
    return rand < 0.3 ? { action: "call" } : { action: "fold" };
  }

  // High card only
  if (toCall === 0) {
    // Bluff sometimes
    if (rand < 0.15) {
      const betAmount = Math.min(Math.floor(pot * 0.35), chips);
      if (betAmount >= bigBlind) {
        return { action: "raise", amount: betAmount };
      }
    }
    return { action: "check" };
  }

  // Facing a bet with nothing — mostly fold
  if (potOdds < 0.15 && rand < 0.3) return { action: "call" };
  return { action: "fold" };
}

function preflopAI(
  cards: Card[],
  pot: number,
  toCall: number,
  chips: number,
  bigBlind: number,
): { action: PokerAction; amount?: number } {
  const strength = preflopStrength(cards);
  const rand = Math.random();

  // Premium hands (AA, KK, QQ, AKs)
  if (strength >= 9) {
    const raiseAmount = Math.min(pot + bigBlind * 3, chips);
    return { action: "raise", amount: raiseAmount };
  }

  // Strong hands (JJ, TT, AK, AQs)
  if (strength >= 7) {
    if (toCall > 0) {
      if (rand < 0.6) {
        const raiseAmount = Math.min(toCall + bigBlind * 2, chips);
        return { action: "raise", amount: raiseAmount };
      }
      return { action: "call" };
    }
    const raiseAmount = Math.min(bigBlind * 3, chips);
    return { action: "raise", amount: raiseAmount };
  }

  // Medium hands (99-77, AJ, KQ, suited connectors)
  if (strength >= 5) {
    if (toCall <= bigBlind * 3) return { action: "call" };
    return rand < 0.4 ? { action: "call" } : { action: "fold" };
  }

  // Weak playable (small pairs, suited aces, connectors)
  if (strength >= 3) {
    if (toCall <= bigBlind * 2) return { action: "call" };
    return rand < 0.2 ? { action: "call" } : { action: "fold" };
  }

  // Trash
  if (toCall === 0) return { action: "check" };
  return rand < 0.05 ? { action: "call" } : { action: "fold" };
}

const RANK_VAL: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

function preflopStrength(cards: Card[]): number {
  const v1 = RANK_VAL[cards[0].rank];
  const v2 = RANK_VAL[cards[1].rank];
  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);
  const suited = cards[0].suit === cards[1].suit;
  const pair = v1 === v2;

  // Pocket pairs
  if (pair) {
    if (high >= 13) return 10; // AA, KK
    if (high >= 11) return 8; // QQ, JJ
    if (high >= 9) return 6; // TT, 99
    if (high >= 7) return 4; // 88, 77
    return 3; // small pairs
  }

  // Ace-high
  if (high === 14) {
    if (low >= 12) return suited ? 9 : 8; // AK, AQ
    if (low >= 10) return suited ? 7 : 6; // AJ, AT
    if (suited) return 4; // Axs
    return low >= 9 ? 3 : 1;
  }

  // Broadway
  if (high >= 11 && low >= 10) return suited ? 6 : 5;

  // Suited connectors
  if (suited && high - low === 1 && high >= 6) return 4;
  if (suited && high - low <= 2 && high >= 7) return 3;

  // Connected
  if (high - low === 1 && high >= 8) return 3;

  // Suited anything
  if (suited && high >= 10) return 3;

  return 1;
}
