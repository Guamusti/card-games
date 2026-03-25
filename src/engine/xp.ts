"use client";
import { create } from "zustand";

const STORAGE_KEY = "card-trainer-xp";

// XP needed per level grows: level * 100
function xpForLevel(level: number): number {
  return level * 100;
}

export interface XPState {
  level: number;
  currentXP: number;
  totalXP: number;
}

export interface XPGainEvent {
  amount: number;
  multiplier: number;
  levelUp: boolean;
  newLevel: number;
}

interface XPActions {
  addXP: (amount: number, multiplier?: number) => XPGainEvent;
  reset: () => void;
}

export type XPStore = XPState & XPActions;

function loadXP(): XPState {
  if (typeof window === "undefined") return { level: 1, currentXP: 0, totalXP: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.level === "number") return data;
    }
  } catch {}
  return { level: 1, currentXP: 0, totalXP: 0 };
}

function persistXP(state: XPState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Global XP event listeners (for toast) ───
type XPListener = (event: XPGainEvent) => void;
const xpListeners: XPListener[] = [];
export function onXPGain(listener: XPListener) {
  xpListeners.push(listener);
  return () => {
    const idx = xpListeners.indexOf(listener);
    if (idx >= 0) xpListeners.splice(idx, 1);
  };
}

export const useXPStore = create<XPStore>((set, get) => ({
  ...loadXP(),

  addXP: (amount: number, multiplier: number = 1) => {
    let { level, currentXP, totalXP } = get();
    const startLevel = level;
    const totalAmount = Math.round(amount * multiplier);
    currentXP += totalAmount;
    totalXP += totalAmount;

    // Level up loop
    let needed = xpForLevel(level);
    while (currentXP >= needed) {
      currentXP -= needed;
      level++;
      needed = xpForLevel(level);
    }

    const state = { level, currentXP, totalXP };
    set(state);
    persistXP(state);

    const event: XPGainEvent = {
      amount: totalAmount,
      multiplier,
      levelUp: level > startLevel,
      newLevel: level,
    };

    // Notify listeners
    for (const fn of xpListeners) fn(event);

    return event;
  },

  reset: () => {
    const state = { level: 1, currentXP: 0, totalXP: 0 };
    set(state);
    persistXP(state);
  },
}));

export { xpForLevel };
