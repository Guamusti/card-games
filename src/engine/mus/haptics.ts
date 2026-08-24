"use client";

// ─────────────────────────────────────────────────────────────
// Mus — light haptic feedback. Respects the user's hapticFeedback
// preference and silently no-ops where the API is unavailable.
// ─────────────────────────────────────────────────────────────

import { useCustomizeStore } from "../customize/store";

export type Buzz = "tap" | "turn" | "envite" | "quiero" | "win" | "lose" | "ordago";

const PATTERNS: Record<Buzz, number | number[]> = {
  tap: 10,
  turn: 22,
  envite: [0, 16, 40, 16],
  quiero: [0, 14, 30, 24],
  win: [0, 28, 45, 28, 45, 40],
  lose: [0, 65],
  ordago: [0, 40, 30, 40, 30, 70],
};

export function buzz(kind: Buzz) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    if (!useCustomizeStore.getState().hapticFeedback) return;
    navigator.vibrate(PATTERNS[kind]);
  } catch { /* ignore */ }
}
