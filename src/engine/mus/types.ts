// ─────────────────────────────────────────────────────────────
// Mus — domain types
// Spanish 40-card deck, 2v2, variant "8 reyes / 8 ases"
// (the 3 plays as a King, the 2 plays as an Ace).
// ─────────────────────────────────────────────────────────────

export type SpanishSuit = "oros" | "copas" | "espadas" | "bastos";

/** Real card ranks in the 40-card Spanish deck (no 8, no 9). */
export type SpanishRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface SpanishCard {
  suit: SpanishSuit;
  rank: SpanishRank;
}

export const SPANISH_SUITS: SpanishSuit[] = ["oros", "copas", "espadas", "bastos"];
export const SPANISH_RANKS: SpanishRank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

/** Single-letter tag used for compact rendering (O / C / E / B). */
export const SUIT_LETTER: Record<SpanishSuit, string> = {
  oros: "O",
  copas: "C",
  espadas: "E",
  bastos: "B",
};

export const SUIT_NAME: Record<SpanishSuit, string> = {
  oros: "Oros",
  copas: "Copas",
  espadas: "Espadas",
  bastos: "Bastos",
};

/** Display label for a rank (1=As, 10=Sota, 11=Caballo, 12=Rey). */
export const RANK_LABEL: Record<SpanishRank, string> = {
  1: "As",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "Sota",
  11: "Caballo",
  12: "Rey",
};

/** Numeric label used on the card face — as on a real Spanish deck (1..7, 10, 11, 12). */
export const RANK_SHORT: Record<SpanishRank, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "10",
  11: "11",
  12: "12",
};

// ─── The four lances ─────────────────────────────────────────

export type Lance = "grande" | "chica" | "pares" | "juego";

export const LANCES: Lance[] = ["grande", "chica", "pares", "juego"];

export const LANCE_LABEL: Record<Lance, string> = {
  grande: "Grande",
  chica: "Chica",
  pares: "Pares",
  juego: "Juego",
};

/** Pares category, weakest → strongest. */
export type ParesCategory = "none" | "par" | "medias" | "duples";

export interface ParesResult {
  category: ParesCategory;
  /** Comparison values, high→low. par:[v]; medias:[v]; duples:[hi,lo]. */
  values: number[];
  /** Points this hand contributes when its team wins Pares (par=1, medias=2, duples=3). */
  tantos: number;
}

export interface JuegoResult {
  /** Raw point sum (figures & 3 = 10, 7..4 face, As & 2 = 1). */
  sum: number;
  /** True when sum >= 31. */
  hasJuego: boolean;
  /** Punto value when nobody makes 31 (== sum, higher is better). */
  punto: number;
}

/** Full per-hand evaluation used by every lance comparator. */
export interface MusHandEval {
  /** musValues sorted high→low (for Grande). */
  high: number[];
  /** musValues sorted low→high (for Chica). */
  low: number[];
  pares: ParesResult;
  juego: JuegoResult;
}

// ─── Configuration ───────────────────────────────────────────

export type VacaPoints = 30 | 40;
export type BestOf = 3 | 5;
export type MusDifficulty = "easy" | "normal" | "hard";

export interface MusConfig {
  /** Points to win a single "vaca" (game): 30 or 40. */
  vacaPoints: VacaPoints;
  /** Match length in vacas: best of 3 or 5. */
  bestOf: BestOf;
  /** 8-reyes/8-ases variant (3→Rey, 2→As). Default true. */
  reyes8: boolean;
  /** Bot skill for the solo / bot-filled modes. */
  difficulty: MusDifficulty;
}

export const DEFAULT_MUS_CONFIG: MusConfig = {
  vacaPoints: 30,
  bestOf: 3,
  reyes8: true,
  difficulty: "normal",
};

// ─── Modes ───────────────────────────────────────────────────

export type MusMode = "solo" | "online" | "practice";

// ─── Players & teams ─────────────────────────────────────────

/** Seats 0 & 2 form team A; seats 1 & 3 form team B (partners sit across). */
export type Team = "A" | "B";

export function teamOfSeat(seat: number): Team {
  return seat % 2 === 0 ? "A" : "B";
}

export interface MusPlayer {
  id: string;
  name: string;
  avatar: string;
  seat: number; // 0..3, seat 0 is the human in solo mode
  team: Team;
  cards: SpanishCard[];
  isHuman: boolean;
  /** In online mode, whether this seat is currently filled by a bot. */
  isBot: boolean;
}
