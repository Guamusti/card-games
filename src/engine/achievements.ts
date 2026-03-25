"use client";

import { create } from "zustand";

const STORAGE_KEY = "card-trainer-achievements";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Reward in coins */
  reward: number;
  /** Reward in gems (optional) */
  gemReward?: number;
  /** Check function key — evaluated externally */
  category: "bj" | "poker" | "slots" | "general";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Blackjack
  { id: "bj-first", name: "First Hand", description: "Play your first blackjack hand", icon: "🃏", reward: 100, category: "bj" },
  { id: "bj-10", name: "Card Sharp", description: "Play 10 blackjack hands", icon: "🎴", reward: 250, category: "bj" },
  { id: "bj-50", name: "Regular", description: "Play 50 blackjack hands", icon: "🏅", reward: 500, category: "bj" },
  { id: "bj-100", name: "Veteran", description: "Play 100 blackjack hands", icon: "🎖️", reward: 1000, category: "bj" },
  { id: "bj-500", name: "High Roller", description: "Play 500 blackjack hands", icon: "💎", reward: 3000, gemReward: 5, category: "bj" },
  { id: "bj-first-bj", name: "Natural!", description: "Get your first blackjack", icon: "🂡", reward: 200, category: "bj" },
  { id: "bj-10-bj", name: "Lucky Streak", description: "Get 10 blackjacks", icon: "🍀", reward: 750, category: "bj" },
  { id: "bj-accuracy-80", name: "Strategist", description: "Reach 80% decision accuracy (50+ hands)", icon: "🧠", reward: 500, category: "bj" },
  { id: "bj-accuracy-95", name: "Perfect Play", description: "Reach 95% decision accuracy (100+ hands)", icon: "🏆", reward: 2000, gemReward: 3, category: "bj" },
  { id: "bj-streak-5", name: "On Fire", description: "5 correct decisions in a row", icon: "🔥", reward: 200, category: "bj" },
  { id: "bj-streak-10", name: "Flawless", description: "10 correct decisions in a row", icon: "⚡", reward: 500, category: "bj" },
  { id: "bj-streak-25", name: "Machine", description: "25 correct decisions in a row", icon: "🤖", reward: 1500, gemReward: 2, category: "bj" },

  // Poker
  { id: "poker-first", name: "Ante Up", description: "Play your first poker hand", icon: "♠️", reward: 100, category: "poker" },
  { id: "poker-10", name: "Table Regular", description: "Play 10 poker hands", icon: "♣️", reward: 250, category: "poker" },
  { id: "poker-50", name: "Grinder", description: "Play 50 poker hands", icon: "♥️", reward: 750, category: "poker" },
  { id: "poker-first-win", name: "Winner!", description: "Win your first poker hand", icon: "🏆", reward: 200, category: "poker" },
  { id: "poker-showdown-5", name: "Showdown", description: "Win 5 showdowns", icon: "👁️", reward: 500, category: "poker" },
  { id: "poker-big-pot", name: "Big Pot", description: "Win a pot of 500+", icon: "💰", reward: 750, category: "poker" },
  { id: "poker-huge-pot", name: "Jackpot Pot", description: "Win a pot of 2,000+", icon: "🤑", reward: 2000, gemReward: 3, category: "poker" },

  // Slots
  { id: "slots-first", name: "First Spin", description: "Spin the slots for the first time", icon: "🎰", reward: 50, category: "slots" },
  { id: "slots-10", name: "Spinner", description: "Spin 10 times", icon: "🔄", reward: 200, category: "slots" },
  { id: "slots-jackpot", name: "JACKPOT!", description: "Hit the 7-7-7 jackpot", icon: "7️⃣", reward: 1000, gemReward: 5, category: "slots" },

  // General
  { id: "gen-level-5", name: "Rising Star", description: "Reach level 5", icon: "⭐", reward: 500, category: "general" },
  { id: "gen-level-10", name: "Experienced", description: "Reach level 10", icon: "🌟", reward: 1000, gemReward: 2, category: "general" },
  { id: "gen-level-25", name: "Elite", description: "Reach level 25", icon: "💫", reward: 3000, gemReward: 5, category: "general" },
  { id: "gen-rich", name: "Wealthy", description: "Have 50,000+ coins", icon: "💵", reward: 500, category: "general" },
  { id: "gen-mega-rich", name: "Millionaire", description: "Have 100,000+ coins", icon: "🏦", reward: 2000, gemReward: 5, category: "general" },
];

export interface AchievementState {
  unlockedIds: string[];
}

interface AchievementActions {
  unlock: (id: string) => boolean; // returns true if newly unlocked
  reset: () => void;
}

export type AchievementStore = AchievementState & AchievementActions;

function load(): AchievementState {
  if (typeof window === "undefined") return { unlockedIds: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.unlockedIds)) return data;
    }
  } catch {}
  return { unlockedIds: [] };
}

function persist(state: AchievementState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  ...load(),

  unlock: (id: string) => {
    if (get().unlockedIds.includes(id)) return false;
    const unlockedIds = [...get().unlockedIds, id];
    set({ unlockedIds });
    persist({ unlockedIds });
    return true;
  },

  reset: () => {
    set({ unlockedIds: [] });
    persist({ unlockedIds: [] });
  },
}));

/**
 * Check achievements based on current stats.
 * Call this after any game action. Returns newly unlocked achievement IDs.
 */
export function checkAchievements(data: {
  bjHands: number;
  bjBlackjacks: number;
  bjAccuracy: number;
  bjTotalDecisions: number;
  bjStreak: number;
  pokerHands: number;
  pokerWins: number;
  pokerShowdownWins: number;
  pokerBiggestPot: number;
  slotSpins: number;
  slotJackpots: number;
  level: number;
  balance: number;
}): string[] {
  const store = useAchievementStore.getState();
  const newlyUnlocked: string[] = [];

  const checks: Record<string, boolean> = {
    "bj-first": data.bjHands >= 1,
    "bj-10": data.bjHands >= 10,
    "bj-50": data.bjHands >= 50,
    "bj-100": data.bjHands >= 100,
    "bj-500": data.bjHands >= 500,
    "bj-first-bj": data.bjBlackjacks >= 1,
    "bj-10-bj": data.bjBlackjacks >= 10,
    "bj-accuracy-80": data.bjTotalDecisions >= 50 && data.bjAccuracy >= 80,
    "bj-accuracy-95": data.bjTotalDecisions >= 100 && data.bjAccuracy >= 95,
    "bj-streak-5": data.bjStreak >= 5,
    "bj-streak-10": data.bjStreak >= 10,
    "bj-streak-25": data.bjStreak >= 25,
    "poker-first": data.pokerHands >= 1,
    "poker-10": data.pokerHands >= 10,
    "poker-50": data.pokerHands >= 50,
    "poker-first-win": data.pokerWins >= 1,
    "poker-showdown-5": data.pokerShowdownWins >= 5,
    "poker-big-pot": data.pokerBiggestPot >= 500,
    "poker-huge-pot": data.pokerBiggestPot >= 2000,
    "slots-first": data.slotSpins >= 1,
    "slots-10": data.slotSpins >= 10,
    "slots-jackpot": data.slotJackpots >= 1,
    "gen-level-5": data.level >= 5,
    "gen-level-10": data.level >= 10,
    "gen-level-25": data.level >= 25,
    "gen-rich": data.balance >= 50000,
    "gen-mega-rich": data.balance >= 100000,
  };

  for (const [id, met] of Object.entries(checks)) {
    if (met && store.unlock(id)) {
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
}
