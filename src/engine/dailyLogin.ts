"use client";

import { create } from "zustand";

const STORAGE_KEY = "card-trainer-daily-login";

export interface DailyLoginState {
  streak: number;
  lastLoginDate: string; // YYYY-MM-DD
  claimedToday: boolean;
}

interface DailyLoginActions {
  /** Call on app load to check/update streak */
  checkIn: () => { reward: DailyReward; isNewDay: boolean } | null;
  reset: () => void;
}

export type DailyLoginStore = DailyLoginState & DailyLoginActions;

export interface DailyReward {
  coins: number;
  gems: number;
  cubeRarity: number | null; // null = no cube
  day: number; // 1-7
}

/** Rewards scale with streak day (1-7, then cycles) */
export function getRewardForDay(day: number): DailyReward {
  const d = ((day - 1) % 7) + 1; // cycle 1-7
  switch (d) {
    case 1: return { coins: 50, gems: 0, cubeRarity: null, day: d };
    case 2: return { coins: 100, gems: 0, cubeRarity: null, day: d };
    case 3: return { coins: 150, gems: 0, cubeRarity: null, day: d };
    case 4: return { coins: 200, gems: 1, cubeRarity: null, day: d };
    case 5: return { coins: 300, gems: 0, cubeRarity: 1, day: d };
    case 6: return { coins: 400, gems: 1, cubeRarity: null, day: d };
    case 7: return { coins: 500, gems: 2, cubeRarity: 2, day: d };
    default: return { coins: 50, gems: 0, cubeRarity: null, day: d };
  }
}

function load(): DailyLoginState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.streak === "number") return data;
    }
  } catch {}
  return { streak: 0, lastLoginDate: "", claimedToday: false };
}

function persist(state: DailyLoginState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const useDailyLoginStore = create<DailyLoginStore>((set, get) => ({
  ...load(),

  checkIn: () => {
    const state = get();
    const today = getToday();

    // Already claimed today
    if (state.lastLoginDate === today && state.claimedToday) return null;

    // Calculate streak
    let newStreak: number;
    if (state.lastLoginDate === getYesterday()) {
      // Consecutive day
      newStreak = state.streak + 1;
    } else if (state.lastLoginDate === today) {
      // Same day, not yet claimed (shouldn't happen with claimedToday check, but safe)
      newStreak = state.streak;
    } else {
      // Streak broken — restart
      newStreak = 1;
    }

    const reward = getRewardForDay(newStreak);
    const newState = { streak: newStreak, lastLoginDate: today, claimedToday: true };
    set(newState);
    persist(newState);

    return { reward, isNewDay: true };
  },

  reset: () => {
    const state = { streak: 0, lastLoginDate: "", claimedToday: false };
    set(state);
    persist(state);
  },
}));
