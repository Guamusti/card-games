"use client";

import { create } from "zustand";
import { useXPStore } from "./xp";

const STORAGE_KEY = "card-trainer-stats";

export interface BJStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  correctDecisions: number;
  totalDecisions: number;
  /** Current streak of consecutive correct decisions */
  currentStreak: number;
  /** Best streak ever */
  bestStreak: number;
}

export interface PokerStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  folds: number;
  /** Voluntarily Put $ In Pot — times player didn't fold preflop */
  vpipHands: number;
  /** Pre-Flop Raise count */
  pfrCount: number;
  /** Times player went to showdown */
  showdowns: number;
  /** Wins at showdown */
  showdownWins: number;
  /** Total chips won (gross) */
  totalChipsWon: number;
  /** Total chips lost (gross) */
  totalChipsLost: number;
  /** Biggest pot won */
  biggestPot: number;
  /** Folds per phase */
  foldPreflop: number;
  foldPostflop: number;
  /** All-in count */
  allInCount: number;
}

export interface SlotStats {
  totalSpins: number;
  totalWon: number;
  jackpots: number;
}

export interface AllStats {
  bj: BJStats;
  poker: PokerStats;
  slots: SlotStats;
}

const EMPTY_BJ: BJStats = {
  handsPlayed: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0,
  correctDecisions: 0, totalDecisions: 0,
  currentStreak: 0, bestStreak: 0,
};

const EMPTY_POKER: PokerStats = {
  handsPlayed: 0, wins: 0, losses: 0, folds: 0,
  vpipHands: 0, pfrCount: 0,
  showdowns: 0, showdownWins: 0,
  totalChipsWon: 0, totalChipsLost: 0, biggestPot: 0,
  foldPreflop: 0, foldPostflop: 0, allInCount: 0,
};

const EMPTY_SLOTS: SlotStats = {
  totalSpins: 0, totalWon: 0, jackpots: 0,
};

interface StatsActions {
  // BJ
  recordBJHand: (result: "win" | "lose" | "push" | "blackjack") => void;
  recordBJDecision: (correct: boolean) => void;
  // Poker
  recordPokerHand: (data: {
    won: boolean;
    folded: boolean;
    vpip: boolean;
    pfr: boolean;
    wentToShowdown: boolean;
    wonAtShowdown: boolean;
    chipsWon: number;
    chipsLost: number;
    potSize: number;
    foldPhase?: "preflop" | "postflop";
    wentAllIn: boolean;
  }) => void;
  // Slots
  recordSlotSpin: (won: number, isJackpot: boolean) => void;
  // Reset
  resetStats: () => void;
}

export type StatsStore = AllStats & StatsActions;

function loadStats(): AllStats {
  if (typeof window === "undefined") return { bj: EMPTY_BJ, poker: EMPTY_POKER, slots: EMPTY_SLOTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        bj: data.bj && typeof data.bj.handsPlayed === "number" ? data.bj : EMPTY_BJ,
        poker: data.poker && typeof data.poker.handsPlayed === "number" ? data.poker : EMPTY_POKER,
        slots: data.slots && typeof data.slots.totalSpins === "number" ? data.slots : EMPTY_SLOTS,
      };
    }
  } catch { /* ignore */ }
  return { bj: EMPTY_BJ, poker: EMPTY_POKER, slots: EMPTY_SLOTS };
}

function persistStats(stats: AllStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  ...loadStats(),

  recordBJHand: (result) => {
    const bj = { ...get().bj };
    bj.handsPlayed++;
    if (result === "win") bj.wins++;
    else if (result === "blackjack") { bj.wins++; bj.blackjacks++; }
    else if (result === "lose") bj.losses++;
    else if (result === "push") bj.pushes++;
    const all = { bj, poker: get().poker, slots: get().slots };
    set({ bj });
    persistStats(all);
  },

  recordBJDecision: (correct) => {
    const bj = { ...get().bj };
    bj.totalDecisions++;
    if (correct) {
      bj.correctDecisions++;
      bj.currentStreak++;
      if (bj.currentStreak > bj.bestStreak) bj.bestStreak = bj.currentStreak;
    } else {
      bj.currentStreak = 0;
    }
    const all = { bj, poker: get().poker, slots: get().slots };
    set({ bj });
    persistStats(all);
  },

  recordPokerHand: (data) => {
    const poker = { ...get().poker };
    poker.handsPlayed++;
    if (data.won) poker.wins++;
    else poker.losses++;
    if (data.folded) {
      poker.folds++;
      if (data.foldPhase === "preflop") poker.foldPreflop++;
      else if (data.foldPhase === "postflop") poker.foldPostflop++;
    }
    if (data.vpip) poker.vpipHands++;
    if (data.pfr) poker.pfrCount++;
    if (data.wentToShowdown) poker.showdowns++;
    if (data.wonAtShowdown) poker.showdownWins++;
    poker.totalChipsWon += data.chipsWon;
    poker.totalChipsLost += data.chipsLost;
    if (data.potSize > poker.biggestPot) poker.biggestPot = data.potSize;
    if (data.wentAllIn) poker.allInCount++;
    const all = { bj: get().bj, poker, slots: get().slots };
    set({ poker });
    persistStats(all);
  },

  recordSlotSpin: (won, isJackpot) => {
    const slots = { ...get().slots };
    slots.totalSpins++;
    slots.totalWon += won;
    if (isJackpot) slots.jackpots++;
    const all = { bj: get().bj, poker: get().poker, slots };
    set({ slots });
    persistStats(all);
    // XP for spinning: 3 base, +5 if won something, +20 if jackpot
    let xp = 3;
    if (won > 0) xp += 5;
    if (isJackpot) xp += 20;
    useXPStore.getState().addXP(xp);
  },

  resetStats: () => {
    const fresh = { bj: EMPTY_BJ, poker: EMPTY_POKER, slots: EMPTY_SLOTS };
    set(fresh);
    persistStats(fresh);
  },
}));
