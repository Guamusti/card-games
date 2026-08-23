"use client";

import { create } from "zustand";

const STORAGE_KEY = "card-trainer-mus-stats";

export interface MusStats {
  handsPlayed: number;
  handsWon: number;
  gamesPlayed: number;
  gamesWon: number;
  vacasWon: number;
  stonesWon: number;
  ordagosWon: number;
}

export const EMPTY_MUS_STATS: MusStats = { handsPlayed: 0, handsWon: 0, gamesPlayed: 0, gamesWon: 0, vacasWon: 0, stonesWon: 0, ordagosWon: 0 };

function load(): MusStats {
  if (typeof window === "undefined") return EMPTY_MUS_STATS;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved.handsPlayed === "number" ? { ...EMPTY_MUS_STATS, ...saved } : EMPTY_MUS_STATS;
  } catch { return EMPTY_MUS_STATS; }
}

function persist(stats: MusStats) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {} }

interface MusStatsStore extends MusStats {
  recordHand: (won: boolean, stones: number, ordagoWon: boolean) => void;
  recordVaca: (won: boolean) => void;
  recordGame: (won: boolean) => void;
  resetMusStats: () => void;
}

export const useMusStatsStore = create<MusStatsStore>((set, get) => ({
  ...load(),
  recordHand: (won, stones, ordagoWon) => {
    const next = { handsPlayed: get().handsPlayed + 1, handsWon: get().handsWon + Number(won), gamesPlayed: get().gamesPlayed, gamesWon: get().gamesWon, vacasWon: get().vacasWon, stonesWon: get().stonesWon + Math.max(0, stones), ordagosWon: get().ordagosWon + Number(ordagoWon) };
    set(next); persist(next);
  },
  recordVaca: (won) => { const next = { ...snapshot(get()), vacasWon: get().vacasWon + Number(won) }; set(next); persist(next); },
  recordGame: (won) => { const next = { ...snapshot(get()), gamesPlayed: get().gamesPlayed + 1, gamesWon: get().gamesWon + Number(won) }; set(next); persist(next); },
  resetMusStats: () => { set(EMPTY_MUS_STATS); persist(EMPTY_MUS_STATS); },
}));

function snapshot(stats: MusStats): MusStats {
  return { handsPlayed: stats.handsPlayed, handsWon: stats.handsWon, gamesPlayed: stats.gamesPlayed, gamesWon: stats.gamesWon, vacasWon: stats.vacasWon, stonesWon: stats.stonesWon, ordagosWon: stats.ordagosWon };
}
