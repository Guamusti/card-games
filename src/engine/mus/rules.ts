// ─────────────────────────────────────────────────────────────
// Mus — hand evaluation & lance comparisons (pure, deterministic)
//
// All comparators return:  1  → a is better,
//                         -1  → b is better,
//                          0  → tie (decided by "mano" position at the table).
// ─────────────────────────────────────────────────────────────

import type {
  SpanishCard,
  SpanishRank,
  Lance,
  ParesResult,
  ParesCategory,
  JuegoResult,
  MusHandEval,
} from "./types";

/**
 * "Mus value" of a rank for Grande / Chica / Pares ordering (1..10).
 * In the 8-reyes/8-ases variant the 3 ranks as a King (10) and the 2 as an Ace (1).
 * Sota=8, Caballo=9, Rey=10.
 */
export function musValue(rank: SpanishRank, reyes8: boolean): number {
  switch (rank) {
    case 12: // Rey
      return 10;
    case 3:
      return reyes8 ? 10 : 3;
    case 11: // Caballo
      return 9;
    case 10: // Sota
      return 8;
    case 7:
    case 6:
    case 5:
    case 4:
      return rank;
    case 2:
      return reyes8 ? 1 : 2;
    case 1: // As
      return 1;
  }
}

/**
 * Point value of a rank for the Juego / Punto count.
 * Figures (Sota/Caballo/Rey) and the 3 count 10; 7..4 face value; As & 2 count 1.
 */
export function juegoPoints(rank: SpanishRank, reyes8: boolean): number {
  switch (rank) {
    case 12:
    case 11:
    case 10:
      return 10;
    case 3:
      return reyes8 ? 10 : 3;
    case 7:
    case 6:
    case 5:
    case 4:
      return rank;
    case 2:
      return reyes8 ? 1 : 2;
    case 1:
      return 1;
  }
}

// ─── Pares ───────────────────────────────────────────────────

export function evaluatePares(cards: SpanishCard[], reyes8: boolean): ParesResult {
  const counts = new Map<number, number>();
  for (const c of cards) {
    const v = musValue(c.rank, reyes8);
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  // Groups of size >= 2, each pair of equal cards.
  const pairsHigh: number[] = []; // one entry per PAIR, value repeated for triples/quads
  let category: ParesCategory = "none";

  const entries = [...counts.entries()].sort((a, b) => b[0] - a[0]); // high value first

  // Four of a kind → duples (best); triple → medias; count pairs otherwise.
  let hasFour = false;
  let hasThree = false;
  const singlePairs: number[] = [];
  for (const [value, n] of entries) {
    if (n === 4) hasFour = true;
    else if (n === 3) hasThree = true;
    else if (n === 2) singlePairs.push(value);
  }

  if (hasFour) {
    const v = entries.find(([, n]) => n === 4)![0];
    category = "duples";
    return { category, values: [v, v], tantos: 3 };
  }
  if (hasThree) {
    const v = entries.find(([, n]) => n === 3)![0];
    category = "medias";
    return { category, values: [v], tantos: 2 };
  }
  if (singlePairs.length === 2) {
    category = "duples";
    const sorted = [...singlePairs].sort((a, b) => b - a);
    return { category, values: sorted, tantos: 3 };
  }
  if (singlePairs.length === 1) {
    category = "par";
    return { category, values: [singlePairs[0]], tantos: 1 };
  }

  void pairsHigh;
  return { category: "none", values: [], tantos: 0 };
}

const PARES_RANK: Record<ParesCategory, number> = {
  none: 0,
  par: 1,
  medias: 2,
  duples: 3,
};

/** Compare two Pares results. Assumes both have pares (category !== "none"). */
export function comparePares(a: ParesResult, b: ParesResult): number {
  if (PARES_RANK[a.category] !== PARES_RANK[b.category]) {
    return PARES_RANK[a.category] > PARES_RANK[b.category] ? 1 : -1;
  }
  const len = Math.max(a.values.length, b.values.length);
  for (let i = 0; i < len; i++) {
    const av = a.values[i] ?? 0;
    const bv = b.values[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

// ─── Juego / Punto ───────────────────────────────────────────

export function evaluateJuego(cards: SpanishCard[], reyes8: boolean): JuegoResult {
  let sum = 0;
  for (const c of cards) sum += juegoPoints(c.rank, reyes8);
  return {
    sum,
    hasJuego: sum >= 31,
    punto: sum,
  };
}

/**
 * Juego ranking: 31 is best, then 32, then 40 → 33 descending.
 * Returns a strength score (higher is better) for hands that HAVE juego.
 */
export function juegoStrength(sum: number): number {
  if (sum === 31) return 100;
  if (sum === 32) return 99;
  // 40 → 98, 39 → 97, ... 33 → 91
  return 90 + (sum - 32);
}

/** Compare two Juego results. Assumes both have juego (sum >= 31). */
export function compareJuego(a: JuegoResult, b: JuegoResult): number {
  const sa = juegoStrength(a.sum);
  const sb = juegoStrength(b.sum);
  if (sa === sb) return 0;
  return sa > sb ? 1 : -1;
}

/** Compare Punto (nobody made juego): closest to 30 without going over wins → highest sum. */
export function comparePunto(a: JuegoResult, b: JuegoResult): number {
  if (a.punto === b.punto) return 0;
  return a.punto > b.punto ? 1 : -1;
}

// ─── Grande / Chica ──────────────────────────────────────────

/** Lexicographic comparison of two value lists (already ordered by relevance). */
function compareValueLists(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export function sortedHigh(cards: SpanishCard[], reyes8: boolean): number[] {
  return cards.map((c) => musValue(c.rank, reyes8)).sort((x, y) => y - x);
}

export function sortedLow(cards: SpanishCard[], reyes8: boolean): number[] {
  return cards.map((c) => musValue(c.rank, reyes8)).sort((x, y) => x - y);
}

/** Grande: highest cards win → compare high→low. */
export function compareGrande(a: MusHandEval, b: MusHandEval): number {
  return compareValueLists(a.high, b.high);
}

/** Chica: lowest cards win → compare low→high, then invert (lower is better). */
export function compareChica(a: MusHandEval, b: MusHandEval): number {
  const r = compareValueLists(a.low, b.low);
  return -r; // lower list wins
}

// ─── Full-hand evaluation ────────────────────────────────────

export function evaluateMusHand(cards: SpanishCard[], reyes8: boolean): MusHandEval {
  return {
    high: sortedHigh(cards, reyes8),
    low: sortedLow(cards, reyes8),
    pares: evaluatePares(cards, reyes8),
    juego: evaluateJuego(cards, reyes8),
  };
}

/**
 * Compare two evaluated hands for a given lance.
 * Returns 1 (a better), -1 (b better), 0 (tie → mano decides).
 * For pares/juego, a hand that "has" it always beats one that doesn't.
 */
export function compareForLance(a: MusHandEval, b: MusHandEval, lance: Lance): number {
  switch (lance) {
    case "grande":
      return compareGrande(a, b);
    case "chica":
      return compareChica(a, b);
    case "pares": {
      const aHas = a.pares.category !== "none";
      const bHas = b.pares.category !== "none";
      if (aHas && !bHas) return 1;
      if (!aHas && bHas) return -1;
      if (!aHas && !bHas) return 0;
      return comparePares(a.pares, b.pares);
    }
    case "juego": {
      const aHas = a.juego.hasJuego;
      const bHas = b.juego.hasJuego;
      if (aHas && !bHas) return 1;
      if (!aHas && bHas) return -1;
      if (aHas && bHas) return compareJuego(a.juego, b.juego);
      // Neither has juego → Punto
      return comparePunto(a.juego, b.juego);
    }
  }
}

/** Does this hand participate in the given lance at all? */
export function participatesInLance(eval_: MusHandEval, lance: Lance): boolean {
  if (lance === "pares") return eval_.pares.category !== "none";
  // Grande, Chica always participate. Juego/Punto: everyone has a punto.
  return true;
}

/** True when the table has a live "juego" lance (someone reached 31), else it's "punto". */
export function isJuegoLance(evals: MusHandEval[]): boolean {
  return evals.some((e) => e.juego.hasJuego);
}
