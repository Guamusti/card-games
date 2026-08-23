// ─────────────────────────────────────────────────────────────
// Mus — practice-mode probabilities (Monte Carlo).
// For your 4 cards, estimate the chance your hand wins each lance
// against N random opponent hands drawn from the rest of the deck.
// Used ONLY in practice mode — never surfaced in real play.
// ─────────────────────────────────────────────────────────────

import type { SpanishCard, Lance } from "./types";
import { LANCES } from "./types";
import { createSpanishDeck, cardKey, shuffle, drawCards } from "./deck";
import {
  evaluateMusHand,
  compareForLance,
  participatesInLance,
} from "./rules";

export interface LanceProbability {
  lance: Lance;
  /** % of simulations where your hand is the outright best at the table. */
  winPct: number;
  /** For pares/juego: whether YOUR hand participates (deterministic). */
  participates: boolean;
  /** For pares/juego: win % conditioned on the lance actually being played. */
  winPctGivenPlayed?: number;
}

export interface MusProbabilities {
  grande: LanceProbability;
  chica: LanceProbability;
  pares: LanceProbability;
  juego: LanceProbability;
}

/**
 * Estimate per-lance win probability for `myCards` against `numOpponents`
 * random hands. A "win" means your hand strictly beats every opponent
 * (ties are counted as non-wins, i.e. the conservative reading — at a real
 * table a tie is resolved by mano, which is position-dependent).
 */
export function calculateMusProbabilities(
  myCards: SpanishCard[],
  reyes8: boolean,
  numOpponents: number = 3,
  simulations: number = 2000,
): MusProbabilities {
  const myEval = evaluateMusHand(myCards, reyes8);

  const used = new Set(myCards.map(cardKey));
  const remaining = createSpanishDeck().filter((c) => !used.has(cardKey(c)));

  const wins: Record<Lance, number> = { grande: 0, chica: 0, pares: 0, juego: 0 };
  // For pares/juego, count sims where the lance is "played" (>=2 participants incl. you)
  const played: Record<Lance, number> = { grande: 0, chica: 0, pares: 0, juego: 0 };
  const winsGivenPlayed: Record<Lance, number> = { grande: 0, chica: 0, pares: 0, juego: 0 };

  for (let s = 0; s < simulations; s++) {
    let deck = shuffle(remaining);
    const oppEvals = [];
    for (let o = 0; o < numOpponents; o++) {
      const { cards, deck: rest } = drawCards(deck, 4);
      deck = rest;
      oppEvals.push(evaluateMusHand(cards, reyes8));
    }

    for (const lance of LANCES) {
      // Am I the strict best at the table for this lance?
      let iWin = true;
      for (const opp of oppEvals) {
        if (compareForLance(myEval, opp, lance) <= 0) {
          iWin = false;
          break;
        }
      }
      if (iWin) wins[lance]++;

      // Conditional stats for pares/juego (lances that can be "not played").
      if (lance === "pares" || lance === "juego") {
        const iParticipate = participatesInLance(myEval, lance);
        const participants = oppEvals.filter((e) => participatesInLance(e, lance)).length + (iParticipate ? 1 : 0);
        const isPlayed = participants >= 2 && iParticipate;
        if (isPlayed) {
          played[lance]++;
          if (iWin) winsGivenPlayed[lance]++;
        }
      }
    }
  }

  const pct = (n: number) => Math.round((n / simulations) * 100);
  const condPct = (lance: Lance) =>
    played[lance] > 0 ? Math.round((winsGivenPlayed[lance] / played[lance]) * 100) : 0;

  return {
    grande: { lance: "grande", winPct: pct(wins.grande), participates: true },
    chica: { lance: "chica", winPct: pct(wins.chica), participates: true },
    pares: {
      lance: "pares",
      winPct: pct(wins.pares),
      participates: participatesInLance(myEval, "pares"),
      winPctGivenPlayed: condPct("pares"),
    },
    juego: {
      lance: "juego",
      winPct: pct(wins.juego),
      participates: myEval.juego.hasJuego,
      winPctGivenPlayed: condPct("juego"),
    },
  };
}
