// ─────────────────────────────────────────────────────────────
// Mus — bot decisions (mus/discard + lance betting), difficulty-tuned.
// Heuristic, self-contained. No dependency on the store.
// ─────────────────────────────────────────────────────────────

import type { SpanishCard, Lance, MusDifficulty, MusHandEval } from "./types";
import { musValue, evaluateMusHand } from "./rules";

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

  return { mus, discards };
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
  /** True when there is a live envite from the opposing team to respond to. */
  liveEnvite: boolean;
  /** Current proposed stake (piedras) if liveEnvite. */
  currentStake: number;
  isOrdago: boolean;
  difficulty: MusDifficulty;
  /** Piedras this team still needs to win the vaca (for órdago prudence). */
  pointsToWin: number;
}

const AGGRO: Record<MusDifficulty, number> = { easy: 0.35, normal: 0.55, hard: 0.72 };
const BLUFF: Record<MusDifficulty, number> = { easy: 0.05, normal: 0.12, hard: 0.2 };

export function decideBet(ctx: BotBetContext): BotBetAction {
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
