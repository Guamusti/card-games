// ─────────────────────────────────────────────────────────────
// Mus — bot decisions (mus/discard + lance betting), difficulty-tuned.
// Heuristic, self-contained. No dependency on the store.
// ─────────────────────────────────────────────────────────────

import type { SpanishCard, Lance, MusDifficulty, MusHandEval } from "./types";
import { musValue, evaluateMusHand } from "./rules";
import { lanceWinProbability } from "./probability";

// ─── Mus / discard ───────────────────────────────────────────

export interface MusDecision {
  mus: boolean;
  /** Indices (0..3) of cards to discard when mus is agreed. */
  discards: number[];
}

/**
 * Decide whether to ask for mus and which cards to throw.
 * Keep Reyes (10) and Ases (1), keep pairs; discard middle cards.
 * Harder bots keep marginally more structure and mus less loosely.
 */
export function decideMus(
  cards: SpanishCard[],
  reyes8: boolean,
  difficulty: MusDifficulty,
): MusDecision {
  const vals = cards.map((c) => musValue(c.rank, reyes8));
  const counts = new Map<number, number>();
  vals.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

  // Cards worth keeping: reyes(10), ases(1), and any paired card.
  const keep = vals.map(
    (v) => v === 10 || v === 1 || (counts.get(v) || 0) >= 2,
  );

  const discards: number[] = [];
  for (let i = 0; i < 4; i++) if (!keep[i]) discards.push(i);

  // Strong hand → no mus. Weak/middling → mus.
  const strongKept = keep.filter(Boolean).length;
  const eval_ = evaluateMusHand(cards, reyes8);
  const strong =
    eval_.juego.hasJuego ||
    eval_.pares.category === "duples" ||
    eval_.pares.category === "medias" ||
    strongKept >= 4;

  // Difficulty tweaks the mus threshold slightly.
  let mus = discards.length > 0 && !strong;
  if (difficulty === "easy" && discards.length >= 1 && Math.random() < 0.15) mus = true;
  if (difficulty === "hard" && strongKept >= 3 && eval_.pares.category !== "none") mus = false;

  // Impossible bot: decide mus on the actual hand's aggregate win odds.
  if (difficulty === "imposible") {
    return decideMusStat(cards, reyes8, keep, discards);
  }

  return { mus, discards };
}

/**
 * Statistics-driven mus/discard for the impossible bot. Estimates how good the
 * current hand is across all four lances; keeps mus only when the hand has no
 * real edge anywhere, and throws the low-value cards to chase a better one.
 */
function decideMusStat(
  cards: SpanishCard[],
  reyes8: boolean,
  keep: boolean[],
  heuristicDiscards: number[],
): MusDecision {
  const eval_ = evaluateMusHand(cards, reyes8);
  // Cheap odds read (few sims — this runs before betting, speed matters).
  const pg = lanceWinProbability(cards, reyes8, "grande", 2, 220);
  const pc = lanceWinProbability(cards, reyes8, "chica", 2, 220);
  const pp = lanceWinProbability(cards, reyes8, "pares", 2, 220);
  const pj = lanceWinProbability(cards, reyes8, "juego", 2, 220);
  const best = Math.max(pg, pc, pp, pj);

  // A hand with a genuine edge (a strong lance) is kept; otherwise seek mus.
  const hasEdge =
    best >= 0.62 ||
    eval_.juego.sum === 31 ||
    eval_.pares.category === "duples" ||
    eval_.pares.category === "medias";

  const keptCount = keep.filter(Boolean).length;
  const mus = !hasEdge && heuristicDiscards.length > 0 && keptCount < 4;
  return { mus, discards: heuristicDiscards };
}

// ─── Lance strength (0..1) ───────────────────────────────────

/** Rough per-lance strength estimate in [0,1] for betting heuristics. */
export function lanceStrength(eval_: MusHandEval, lance: Lance): number {
  switch (lance) {
    case "grande": {
      // Sum of high values normalized (max 40 = four reyes).
      const s = eval_.high.reduce((a, b) => a + b, 0);
      return clamp((s - 10) / 30);
    }
    case "chica": {
      // Lower is better; min sum 4 (four ases).
      const s = eval_.low.reduce((a, b) => a + b, 0);
      return clamp((40 - s) / 30);
    }
    case "pares": {
      if (eval_.pares.category === "none") return 0;
      const catBase =
        eval_.pares.category === "duples" ? 0.75 :
        eval_.pares.category === "medias" ? 0.55 : 0.3;
      const top = (eval_.pares.values[0] ?? 0) / 10;
      return clamp(catBase + top * 0.25);
    }
    case "juego": {
      if (eval_.juego.hasJuego) {
        if (eval_.juego.sum === 31) return 1;
        if (eval_.juego.sum === 32) return 0.85;
        return clamp(0.55 + (eval_.juego.sum - 32) * 0.03);
      }
      // Punto: closeness to 30.
      return clamp((eval_.juego.punto - 20) / 12) * 0.5;
    }
  }
}

// ─── Lance betting ───────────────────────────────────────────

export type BotBetAction =
  | { action: "paso" }
  | { action: "envido"; amount: number }
  | { action: "quiero" }
  | { action: "noquiero" }
  | { action: "subir"; amount: number }
  | { action: "ordago" };

export interface BotBetContext {
  eval: MusHandEval;
  lance: Lance;
  /** Raw hand — required for the statistics-driven "imposible" bot. */
  cards?: SpanishCard[];
  reyes8?: boolean;
  /** True when there is a live envite from the opposing team to respond to. */
  liveEnvite: boolean;
  /** Current proposed stake (piedras) if liveEnvite. */
  currentStake: number;
  isOrdago: boolean;
  difficulty: MusDifficulty;
  /** Piedras this team still needs to win the vaca (for órdago prudence). */
  pointsToWin: number;
}

const AGGRO: Record<MusDifficulty, number> = { easy: 0.35, normal: 0.55, hard: 0.72, imposible: 0.78 };
const BLUFF: Record<MusDifficulty, number> = { easy: 0.05, normal: 0.12, hard: 0.2, imposible: 0.06 };

export function decideBet(ctx: BotBetContext): BotBetAction {
  if (ctx.difficulty === "imposible" && ctx.cards) {
    return decideBetStat(ctx);
  }
  const strength = lanceStrength(ctx.eval, ctx.lance);
  const aggro = AGGRO[ctx.difficulty];
  const bluff = BLUFF[ctx.difficulty];
  const r = Math.random();

  if (ctx.liveEnvite) {
    if (ctx.isOrdago) {
      // Accept órdago only with a strong hand (harder bots slightly looser).
      const need = ctx.difficulty === "hard" ? 0.72 : ctx.difficulty === "normal" ? 0.8 : 0.88;
      return { action: strength >= need ? "quiero" : "noquiero" };
    }
    // Respond to a normal envite.
    const callThreshold = 0.4 - aggro * 0.15; // more aggressive → calls lighter
    if (strength < callThreshold && r > bluff) return { action: "noquiero" };
    // Strong enough to raise?
    if (strength > 0.72 && r < aggro * 0.6 && ctx.currentStake < ctx.pointsToWin) {
      return { action: "subir", amount: 2 + Math.floor(Math.random() * 3) };
    }
    return { action: "quiero" };
  }

  // No live envite: open the action.
  // Occasional órdago with a monster (or a rare bluff on hard).
  if (strength > 0.9 && r < aggro * 0.25) return { action: "ordago" };
  if (ctx.difficulty === "hard" && strength > 0.82 && r < 0.05) return { action: "ordago" };

  const enviteChance = strength * aggro + (r < bluff ? 0.4 : 0);
  if (enviteChance > 0.45) {
    const amount = strength > 0.75 ? 2 + Math.floor(Math.random() * 4) : 2;
    return { action: "envido", amount };
  }
  return { action: "paso" };
}

function clamp(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ─── Impossible bot: statistics + pot odds ───────────────────
//
// Plays on the real Monte-Carlo probability `p` that this hand wins the lance
// against the two opponents, then bets by pot odds. Value-heavy, thin-calling,
// with a small balanced bluff so it can't be trivially read. Very hard to beat.

function decideBetStat(ctx: BotBetContext): BotBetAction {
  const reyes8 = ctx.reyes8 ?? true;
  const p = lanceWinProbability(ctx.cards!, reyes8, ctx.lance, 2, 520);
  const r = Math.random();

  if (ctx.liveEnvite) {
    if (ctx.isOrdago) {
      // Órdago puts the whole vaca on the line — accept only as a clear favourite.
      return { action: p >= 0.78 ? "quiero" : "noquiero" };
    }
    // Pot odds: calling risks the extra stake to win the matched stake plus the
    // pot already committed. With small stakes the break-even sits below 0.5.
    const stake = Math.max(1, ctx.currentStake);
    const breakeven = stake / (stake + Math.max(2, stake + 2));
    // Raise for clear value.
    if (p >= 0.74 && ctx.currentStake < ctx.pointsToWin) {
      const amount = p >= 0.9 ? 4 + Math.floor(r * 3) : 2 + Math.floor(r * 2);
      return { action: "subir", amount };
    }
    if (p >= breakeven + 0.05) return { action: "quiero" };
    // Rare balanced bluff-call on marginal spots.
    if (p >= breakeven - 0.06 && r < BLUFF.imposible) return { action: "quiero" };
    return { action: "noquiero" };
  }

  // Opening the action.
  // Monster → órdago, but only when the reward can actually close the vaca out.
  if (p >= 0.94 && ctx.pointsToWin <= 12 && r < 0.5) return { action: "ordago" };
  if (p >= 0.6) {
    // Size the value bet with the edge.
    const amount = p >= 0.85 ? 4 + Math.floor(r * 3) : p >= 0.72 ? 3 : 2;
    return { action: "envido", amount };
  }
  // Small, balanced semi-bluff so passes don't perfectly signal weakness.
  if (p <= 0.28 && r < BLUFF.imposible) return { action: "envido", amount: 2 };
  return { action: "paso" };
}
