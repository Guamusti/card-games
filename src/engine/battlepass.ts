"use client";
import { create } from "zustand";

const STORAGE_KEY = "card-trainer-battlepass";

export type CubeRarity = 1 | 2 | 3 | 4; // stars

export interface MagicCube {
  id: string;
  rarity: CubeRarity;
  taps: number; // 0-5, each tap can upgrade rarity (or not)
  maxTaps: 5;
}

export interface CubeReward {
  coins: number;
  gems: number;
}

// Cube opening rewards based on final rarity
// Lower rarity = more coins, less gems. Higher = more gems
export function rollCubeReward(rarity: CubeRarity): CubeReward {
  const rand = Math.random();
  switch (rarity) {
    case 1: // Common: 90% coins, 10% gems
      return rand < 0.9
        ? { coins: 100 + Math.floor(Math.random() * 200), gems: 0 }
        : { coins: 0, gems: 1 };
    case 2: // Rare: 75% coins, 25% gems
      return rand < 0.75
        ? { coins: 300 + Math.floor(Math.random() * 400), gems: 0 }
        : { coins: 0, gems: 1 + Math.floor(Math.random() * 2) };
    case 3: // Epic: 50% coins, 50% gems
      return rand < 0.5
        ? { coins: 800 + Math.floor(Math.random() * 700), gems: 0 }
        : { coins: 0, gems: 2 + Math.floor(Math.random() * 3) };
    case 4: // Legendary: 25% coins, 75% gems
      return rand < 0.25
        ? { coins: 2000 + Math.floor(Math.random() * 1500), gems: 0 }
        : { coins: 0, gems: 4 + Math.floor(Math.random() * 4) };
  }
}

// Upgrade chance per tap: 20%
export const CUBE_UPGRADE_CHANCE = 0.20;

export interface BattlePassReward {
  level: number;
  type: "coins" | "cube" | "gems";
  amount?: number; // for coins/gems
  cubeRarity?: CubeRarity; // for cubes
}

// Rewards every 5 levels: cube → coins → cube → gems, cycling
export function getRewardsForLevel(level: number): BattlePassReward | null {
  if (level % 5 !== 0) return null;
  const tier = level / 5;
  const cycle = tier % 4;
  if (cycle === 1 || cycle === 3) {
    // Cube reward
    const rarity: CubeRarity = tier <= 2 ? 1 : tier <= 4 ? 2 : tier <= 8 ? 3 : 4;
    return { level, type: "cube", cubeRarity: rarity };
  } else if (cycle === 2) {
    // Coins reward
    return { level, type: "coins", amount: tier * 500 };
  } else {
    // Gems reward
    return { level, type: "gems", amount: Math.max(2, Math.floor(tier / 2)) };
  }
}

export interface BattlePassState {
  cubes: MagicCube[];
  claimedLevels: number[];
}

interface BattlePassActions {
  claimReward: (level: number) => void;
  tapCube: (cubeId: string) => void;
  openCube: (cubeId: string) => CubeReward | null;
  reset: () => void;
}

export type BattlePassStore = BattlePassState & BattlePassActions;

function loadBP(): BattlePassState {
  if (typeof window === "undefined") return { cubes: [], claimedLevels: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.cubes)) return data;
    }
  } catch {}
  return { cubes: [], claimedLevels: [] };
}

function persistBP(state: BattlePassState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

let cubeCounter = Date.now();

export const useBattlePassStore = create<BattlePassStore>((set, get) => ({
  ...loadBP(),

  claimReward: (level: number) => {
    const state = get();
    if (state.claimedLevels.includes(level)) return;

    const reward = getRewardsForLevel(level);
    if (!reward) return;

    const claimedLevels = [...state.claimedLevels, level];
    let cubes = [...state.cubes];

    if (reward.type === "cube" && reward.cubeRarity) {
      cubeCounter++;
      cubes.push({
        id: `cube-${cubeCounter}`,
        rarity: reward.cubeRarity,
        taps: 0,
        maxTaps: 5,
      });
    }

    // Coins and gems are handled externally by the UI

    const newState = { cubes, claimedLevels };
    set(newState);
    persistBP(newState);
  },

  tapCube: (cubeId: string) => {
    const state = get();
    const cubes = state.cubes.map((c) => {
      if (c.id !== cubeId) return c;
      if (c.taps >= 5) return c;

      const newTaps = c.taps + 1;
      // 15% chance to upgrade rarity on each tap
      const upgraded = Math.random() < CUBE_UPGRADE_CHANCE && c.rarity < 4;
      return {
        ...c,
        taps: newTaps,
        rarity: (upgraded ? c.rarity + 1 : c.rarity) as CubeRarity,
      };
    });

    const newState = { ...state, cubes };
    set({ cubes });
    persistBP(newState);
  },

  openCube: (cubeId: string) => {
    const state = get();
    const cube = state.cubes.find((c) => c.id === cubeId);
    if (!cube || cube.taps < 5) return null;

    const reward = rollCubeReward(cube.rarity);
    const cubes = state.cubes.filter((c) => c.id !== cubeId);
    const newState = { ...state, cubes };
    set({ cubes });
    persistBP(newState);
    return reward;
  },

  reset: () => {
    const state = { cubes: [], claimedLevels: [] };
    set(state);
    persistBP(state);
  },
}));
