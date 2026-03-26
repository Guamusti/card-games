import type { Card } from "../types";
import type { PokerAction, PokerPhase } from "./types";
import { evaluateHand } from "./evaluator";
import type { AIDifficulty } from "../customize/store";

interface AIContext {
  holeCards: Card[];
  community: Card[];
  pot: number;
  toCall: number;
  chips: number;
  phase: PokerPhase;
  bigBlind: number;
}

/** Poker AI with configurable difficulty */
export function getAIAction(ctx: AIContext, difficulty: AIDifficulty = "normal"): { action: PokerAction; amount?: number } {
  const { holeCards, community, pot, toCall, chips, phase, bigBlind } = ctx;

  // If can't afford to call, fold or all-in
  if (toCall > 0 && chips <= 0) {
    return { action: "fold" };
  }

  // Preflop logic based on hand strength tiers
  if (phase === "preflop") {
    return preflopAI(holeCards, pot, toCall, chips, bigBlind, difficulty);
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

  if (difficulty === "easy") {
    return easyPostflop({ hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind });
  }

  if (difficulty === "hard") {
    return hardPostflop({ hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind });
  }

  // Normal difficulty — original behavior
  return normalPostflop({ hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind });
}

interface PostflopCtx {
  hasMonster: boolean;
  hasStrong: boolean;
  hasMedium: boolean;
  hasPair: boolean;
  potOdds: number;
  rand: number;
  toCall: number;
  pot: number;
  chips: number;
  bigBlind: number;
}

function normalPostflop(ctx: PostflopCtx): { action: PokerAction; amount?: number } {
  const { hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind } = ctx;

  if (hasMonster) {
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
    if (rand < 0.15) {
      const betAmount = Math.min(Math.floor(pot * 0.35), chips);
      if (betAmount >= bigBlind) {
        return { action: "raise", amount: betAmount };
      }
    }
    return { action: "check" };
  }

  if (potOdds < 0.15 && rand < 0.3) return { action: "call" };
  return { action: "fold" };
}

// ─── Easy AI: loose-passive, calls too much, rarely raises, almost never bluffs ───

function easyPostflop(ctx: PostflopCtx): { action: PokerAction; amount?: number } {
  const { hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind } = ctx;

  if (hasMonster) {
    // Easy AI doesn't slow-play well — just raises small or calls
    if (toCall === 0) {
      if (rand < 0.4) {
        const raiseAmount = Math.min(Math.floor(pot * 0.4), chips);
        if (raiseAmount >= bigBlind) {
          return { action: "raise", amount: raiseAmount };
        }
      }
      return { action: "check" }; // Misses value by checking monsters
    }
    return { action: "call" }; // Just calls instead of raising
  }

  if (hasStrong) {
    if (toCall > 0) {
      return { action: "call" }; // Always calls, never raises
    }
    if (rand < 0.25) {
      const betAmount = Math.min(Math.floor(pot * 0.3), chips);
      if (betAmount >= bigBlind) {
        return { action: "raise", amount: betAmount };
      }
    }
    return { action: "check" };
  }

  if (hasMedium) {
    if (toCall === 0) return { action: "check" };
    // Calls too often — +30% call probability
    return rand < 0.7 ? { action: "call" } : { action: "fold" };
  }

  if (hasPair) {
    if (toCall === 0) return { action: "check" };
    // Calls too often with weak pairs
    return rand < 0.6 ? { action: "call" } : { action: "fold" };
  }

  // High card — easy AI still calls too much
  if (toCall === 0) {
    // Almost never bluffs (~3%)
    if (rand < 0.03) {
      const betAmount = Math.min(Math.floor(pot * 0.25), chips);
      if (betAmount >= bigBlind) {
        return { action: "raise", amount: betAmount };
      }
    }
    return { action: "check" };
  }

  // Calls with nothing way too often
  if (rand < 0.4) return { action: "call" };
  return { action: "fold" };
}

// ─── Hard AI: aggressive, GTO-ish, balanced bluffs ───

function hardPostflop(ctx: PostflopCtx): { action: PokerAction; amount?: number } {
  const { hasMonster, hasStrong, hasMedium, hasPair, potOdds, rand, toCall, pot, chips, bigBlind } = ctx;

  if (hasMonster) {
    // Mix of slow-plays and big raises for balance
    if (toCall === 0) {
      if (rand < 0.2) return { action: "check" }; // Trap
      const raiseAmount = Math.min(Math.floor(pot * 0.75), chips);
      if (raiseAmount >= bigBlind) {
        return { action: "raise", amount: raiseAmount };
      }
    }
    // Re-raise aggressively
    const reraiseAmount = Math.min(Math.floor(toCall * 2.5 + pot * 0.5), chips);
    if (reraiseAmount > toCall) {
      return { action: "raise", amount: reraiseAmount };
    }
    return { action: "call" };
  }

  if (hasStrong) {
    if (toCall === 0) {
      // Bet for value most of the time
      if (rand < 0.8) {
        const betAmount = Math.min(Math.floor(pot * 0.65), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    if (toCall > 0 && toCall < pot * 0.8) {
      // Raise more often (~65%)
      if (rand < 0.65) {
        const raiseAmount = Math.min(toCall + Math.floor(pot * 0.7), chips);
        if (raiseAmount > toCall) {
          return { action: "raise", amount: raiseAmount };
        }
      }
      return { action: "call" };
    }
    // Big bet — only call if pot odds are reasonable
    if (potOdds < 0.35) return { action: "call" };
    return toCall <= chips * 0.4 ? { action: "call" } : { action: "fold" };
  }

  if (hasMedium) {
    if (toCall === 0) {
      // Bet for thin value
      if (rand < 0.55) {
        const betAmount = Math.min(Math.floor(pot * 0.5), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    // Only call when pot odds justify it
    if (potOdds < 0.25) return { action: "call" };
    return rand < 0.3 ? { action: "call" } : { action: "fold" };
  }

  if (hasPair) {
    if (toCall === 0) {
      // Bet sometimes for protection
      if (rand < 0.35) {
        const betAmount = Math.min(Math.floor(pot * 0.4), chips);
        if (betAmount >= bigBlind) {
          return { action: "raise", amount: betAmount };
        }
      }
      return { action: "check" };
    }
    if (potOdds < 0.18) return { action: "call" };
    return rand < 0.2 ? { action: "call" } : { action: "fold" };
  }

  // High card only — balanced bluffing (~25% when can check)
  if (toCall === 0) {
    if (rand < 0.25) {
      const betAmount = Math.min(Math.floor(pot * 0.55), chips);
      if (betAmount >= bigBlind) {
        return { action: "raise", amount: betAmount };
      }
    }
    return { action: "check" };
  }

  // Facing a bet with nothing — tight folds, occasional float
  if (potOdds < 0.12 && rand < 0.2) return { action: "call" };
  return { action: "fold" };
}

// ─── Preflop AI ─────────────────────────────────────────

function preflopAI(
  cards: Card[],
  pot: number,
  toCall: number,
  chips: number,
  bigBlind: number,
  difficulty: AIDifficulty = "normal",
): { action: PokerAction; amount?: number } {
  const strength = preflopStrength(cards);
  const rand = Math.random();

  if (difficulty === "easy") {
    return easyPreflop(strength, pot, toCall, chips, bigBlind, rand);
  }
  if (difficulty === "hard") {
    return hardPreflop(strength, pot, toCall, chips, bigBlind, rand);
  }

  // Normal — original behavior
  return normalPreflop(strength, pot, toCall, chips, bigBlind, rand);
}

function normalPreflop(
  strength: number, pot: number, toCall: number, chips: number, bigBlind: number, rand: number,
): { action: PokerAction; amount?: number } {
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

// Easy preflop: plays too many hands, rarely raises, lower fold thresholds by 2 tiers
function easyPreflop(
  strength: number, pot: number, toCall: number, chips: number, bigBlind: number, rand: number,
): { action: PokerAction; amount?: number } {
  // Effective strength is boosted by 2 tiers (plays more hands)
  const effectiveStrength = strength + 2;

  // Premium hands — still raises but smaller
  if (effectiveStrength >= 9) {
    if (rand < 0.5) {
      const raiseAmount = Math.min(bigBlind * 2.5, chips);
      return { action: "raise", amount: Math.floor(raiseAmount) };
    }
    return { action: "call" }; // Sometimes just calls with premiums (mistake)
  }

  // Strong — mostly just calls
  if (effectiveStrength >= 7) {
    if (toCall > 0) {
      return { action: "call" };
    }
    if (rand < 0.2) {
      const raiseAmount = Math.min(bigBlind * 2, chips);
      return { action: "raise", amount: raiseAmount };
    }
    return { action: "call" };
  }

  // Medium — calls too liberally
  if (effectiveStrength >= 5) {
    if (toCall <= bigBlind * 5) return { action: "call" };
    return rand < 0.5 ? { action: "call" } : { action: "fold" };
  }

  // Weak — still calls often
  if (effectiveStrength >= 3) {
    if (toCall <= bigBlind * 3) return { action: "call" };
    return rand < 0.4 ? { action: "call" } : { action: "fold" };
  }

  // Trash — easy AI still calls sometimes
  if (toCall === 0) return { action: "check" };
  return rand < 0.15 ? { action: "call" } : { action: "fold" };
}

// Hard preflop: tighter range, more aggressive with good hands, 3-bets
function hardPreflop(
  strength: number, pot: number, toCall: number, chips: number, bigBlind: number, rand: number,
): { action: PokerAction; amount?: number } {
  // Premium — always 3-bet/raise big
  if (strength >= 9) {
    const raiseAmount = Math.min(pot + bigBlind * 4, chips);
    return { action: "raise", amount: raiseAmount };
  }

  // Strong — aggressive raising
  if (strength >= 7) {
    if (toCall > 0) {
      // 3-bet frequently
      if (rand < 0.7) {
        const raiseAmount = Math.min(toCall * 3, chips);
        return { action: "raise", amount: raiseAmount };
      }
      return { action: "call" };
    }
    const raiseAmount = Math.min(bigBlind * 3.5, chips);
    return { action: "raise", amount: Math.floor(raiseAmount) };
  }

  // Medium — selective but aggressive when entering
  if (strength >= 5) {
    if (toCall <= bigBlind * 2) {
      // Raise instead of limping
      if (rand < 0.5) {
        const raiseAmount = Math.min(bigBlind * 3, chips);
        return { action: "raise", amount: raiseAmount };
      }
      return { action: "call" };
    }
    // Tighter against raises
    return rand < 0.25 ? { action: "call" } : { action: "fold" };
  }

  // Weak — much tighter
  if (strength >= 3) {
    if (toCall <= bigBlind) return { action: "call" };
    return rand < 0.1 ? { action: "call" } : { action: "fold" };
  }

  // Trash — folds almost always, occasional steal from position
  if (toCall === 0) {
    if (rand < 0.08) {
      const raiseAmount = Math.min(bigBlind * 2.5, chips);
      return { action: "raise", amount: Math.floor(raiseAmount) };
    }
    return { action: "check" };
  }
  return { action: "fold" };
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
