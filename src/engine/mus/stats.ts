"use client";

import { create } from "zustand";
import type { Lance, MusDifficulty } from "./types";

const STORAGE_KEY = "card-trainer-mus-stats";

export interface LanceStats { played: number; won: number; stones: number; }
export type LanceStatsByLance = Record<Lance, LanceStats>;

export const EMPTY_LANCE_STATS: LanceStatsByLance = {
  grande: { played: 0, won: 0, stones: 0 },
  chica: { played: 0, won: 0, stones: 0 },
  pares: { played: 0, won: 0, stones: 0 },
  juego: { played: 0, won: 0, stones: 0 },
};

export const BOT_ELO: Record<MusDifficulty, number> = { easy: 800, normal: 1000, hard: 1200, imposible: 1400 };

/** Standard Elo expected score against the chosen bot level. */
export function botEloDelta(playerElo: number, botDifficulty: MusDifficulty, won: boolean): number {
  const expected = 1 / (1 + 10 ** ((BOT_ELO[botDifficulty] - playerElo) / 400));
  return Math.round(24 * ((won ? 1 : 0) - expected));
}

export interface MusStats {
  handsPlayed: number;
  handsWon: number;
  gamesPlayed: number;
  gamesWon: number;
  vacasWon: number;
  stonesWon: number;
  ordagosWon: number;
  /** Private friends rating. It is only changed by ranked 4-player rooms. */
  elo: number;
  rankedGames: number;
  rankedWins: number;
  /** A separate rating for matches with bots; never appears in the friends ladder. */
  botElo: number;
  botEloGames: number;
  botEloWins: number;
  lances: LanceStatsByLance;
}

export const EMPTY_MUS_STATS: MusStats = { handsPlayed: 0, handsWon: 0, gamesPlayed: 0, gamesWon: 0, vacasWon: 0, stonesWon: 0, ordagosWon: 0, elo: 1000, rankedGames: 0, rankedWins: 0, botElo: 1000, botEloGames: 0, botEloWins: 0, lances: EMPTY_LANCE_STATS };

function load(): MusStats {
  if (typeof window === "undefined") return EMPTY_MUS_STATS;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved.handsPlayed === "number" ? { ...EMPTY_MUS_STATS, ...saved } : EMPTY_MUS_STATS;
  } catch { return EMPTY_MUS_STATS; }
}

function persist(stats: MusStats) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {} }

interface MusStatsStore extends MusStats {
  recordHand: (won: boolean, stones: number, ordagoWon: boolean, lances?: Array<{ lance: Lance; won: boolean; stones: number }>) => void;
  recordVaca: (won: boolean) => void;
  recordGame: (won: boolean, ranked?: boolean) => void;
  recordBotGame: (won: boolean, difficulty: MusDifficulty) => void;
  resetMusStats: () => void;
}

export const useMusStatsStore = create<MusStatsStore>((set, get) => ({
  ...load(),
  recordHand: (won, stones, ordagoWon, results = []) => {
    const lances = cloneLances(get().lances);
    for (const result of results) {
      const current = lances[result.lance];
      lances[result.lance] = { played: current.played + 1, won: current.won + Number(result.won), stones: current.stones + Math.max(0, result.stones) };
    }
    const next = { ...snapshot(get()), handsPlayed: get().handsPlayed + 1, handsWon: get().handsWon + Number(won), stonesWon: get().stonesWon + Math.max(0, stones), ordagosWon: get().ordagosWon + Number(ordagoWon), lances };
    set(next); persist(next);
  },
  recordVaca: (won) => { const next = { ...snapshot(get()), vacasWon: get().vacasWon + Number(won) }; set(next); persist(next); },
  recordGame: (won, ranked = false) => {
    const next = { ...snapshot(get()), gamesPlayed: get().gamesPlayed + 1, gamesWon: get().gamesWon + Number(won) };
    if (ranked) {
      next.rankedGames += 1;
      next.rankedWins += Number(won);
      // Fixed ±20 makes the rating understandable and prevents bot games affecting it.
      next.elo = Math.max(100, next.elo + (won ? 20 : -20));
    }
    set(next); persist(next);
  },
  recordBotGame: (won, difficulty) => {
    const next = { ...snapshot(get()), botEloGames: get().botEloGames + 1, botEloWins: get().botEloWins + Number(won) };
    next.botElo = Math.max(100, next.botElo + botEloDelta(next.botElo, difficulty, won));
    set(next); persist(next);
  },
  resetMusStats: () => { set(EMPTY_MUS_STATS); persist(EMPTY_MUS_STATS); },
}));

function snapshot(stats: MusStats): MusStats {
  return { handsPlayed: stats.handsPlayed, handsWon: stats.handsWon, gamesPlayed: stats.gamesPlayed, gamesWon: stats.gamesWon, vacasWon: stats.vacasWon, stonesWon: stats.stonesWon, ordagosWon: stats.ordagosWon, elo: stats.elo, rankedGames: stats.rankedGames, rankedWins: stats.rankedWins, botElo: stats.botElo, botEloGames: stats.botEloGames, botEloWins: stats.botEloWins, lances: cloneLances(stats.lances) };
}

function cloneLances(lances: LanceStatsByLance | undefined): LanceStatsByLance {
  return {
    grande: { ...(lances?.grande ?? EMPTY_LANCE_STATS.grande) },
    chica: { ...(lances?.chica ?? EMPTY_LANCE_STATS.chica) },
    pares: { ...(lances?.pares ?? EMPTY_LANCE_STATS.pares) },
    juego: { ...(lances?.juego ?? EMPTY_LANCE_STATS.juego) },
  };
}
