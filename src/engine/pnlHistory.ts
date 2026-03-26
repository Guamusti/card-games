"use client";

import { create } from "zustand";

export interface PnLEntry {
  timestamp: number;
  balance: number;
  game: "bj" | "poker" | "slots";
}

interface PnLActions {
  recordSnapshot: (balance: number, game: string) => void;
  clearHistory: () => void;
}

export type PnLStore = { entries: PnLEntry[] } & PnLActions;

const STORAGE_KEY = "card-trainer-pnl-history";
const MAX_ENTRIES = 500;

function loadHistory(): PnLEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch { /* ignore */ }
  return [];
}

function persistHistory(entries: PnLEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

export const usePnLStore = create<PnLStore>((set, get) => ({
  entries: loadHistory(),

  recordSnapshot: (balance: number, game: string) => {
    const entry: PnLEntry = {
      timestamp: Date.now(),
      balance,
      game: game as PnLEntry["game"],
    };
    let entries = [...get().entries, entry];
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(entries.length - MAX_ENTRIES);
    }
    set({ entries });
    persistHistory(entries);
  },

  clearHistory: () => {
    set({ entries: [] });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  },
}));
