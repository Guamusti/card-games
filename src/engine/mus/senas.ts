// ─────────────────────────────────────────────────────────────
// Mus — señas (partner hand signals). A player flashes a seña to
// their partner; the opposing team is not meant to see it. Bots
// signal with a per-difficulty probability.
// ─────────────────────────────────────────────────────────────

import type { SpanishCard, MusDifficulty } from "./types";
import { musValue, evaluateMusHand } from "./rules";

export type SenaId = "reyes" | "ases" | "treintaiuna" | "duples" | "ciego";

export interface SenaDef {
  id: SenaId;
  label: string;
  /** The real-life gesture, shown as a hint. */
  gesture: string;
}

export const SENAS: Record<SenaId, SenaDef> = {
  reyes: { id: "reyes", label: "Reyes", gesture: "Morder el labio" },
  ases: { id: "ases", label: "Ases", gesture: "Sacar la lengua" },
  treintaiuna: { id: "treintaiuna", label: "31", gesture: "Guiñar un ojo" },
  duples: { id: "duples", label: "Duples", gesture: "Levantar las cejas" },
  ciego: { id: "ciego", label: "Ciego", gesture: "Cerrar los ojos" },
};

export const SENA_ORDER: SenaId[] = ["reyes", "ases", "treintaiuna", "duples", "ciego"];

/** Señas the hand truthfully supports (best-first). */
export function availableSenas(cards: SpanishCard[], reyes8: boolean): SenaId[] {
  const vals = cards.map((c) => musValue(c.rank, reyes8));
  const tens = vals.filter((v) => v === 10).length;
  const ones = vals.filter((v) => v === 1).length;
  const ev = evaluateMusHand(cards, reyes8);
  const out: SenaId[] = [];
  if (ev.juego.sum === 31) out.push("treintaiuna");
  if (ev.pares.category === "duples") out.push("duples");
  if (tens >= 2) out.push("reyes");
  if (ones >= 2) out.push("ases");
  if (ev.juego.sum === 31 || (ev.juego.hasJuego && ev.juego.sum <= 32)) out.push("ciego");
  return [...new Set(out)];
}

/** Probability a bot flashes a seña when it has one, by difficulty. */
export const SENA_PROB: Record<MusDifficulty, number> = {
  easy: 0.3,
  normal: 0.5,
  hard: 0.72,
  imposible: 0.85,
};
