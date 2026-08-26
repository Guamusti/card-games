// ─────────────────────────────────────────────────────────────
// Mus — recuento (scoring of a single deal), pure & documented.
//
// Implemented ruleset (a common Spanish house ruleset):
//  • Lances scored in order: Grande, Chica, Pares, Juego(/Punto).
//  • An accepted envite (quiero): winning team scores the staked piedras.
//  • A rejected envite (no quiero): the enviting team scores the previous
//    accepted stake, or 1 if it was the first envite.
//  • "En paso" (both pass): winner scores the lance's base value:
//       Grande = 1, Chica = 1, Punto = 1, Juego = 2.
//  • Pares base "tantos": each member of the WINNING team that holds pares
//    adds par=1 / medias=2 / duples=3. These are added on top of any envite.
//  • Juego base: winning team +2 (+1 more if the winning hand is exactly 31).
//  • Órdago accepted: that lance wins the whole vaca outright.
// ─────────────────────────────────────────────────────────────

import type { Lance, MusHandEval, Team } from "./types";
import { compareForLance } from "./rules";

/** How an envite negotiation on one lance ended. */
export type LanceOutcome =
  | { kind: "paso" }
  | { kind: "quiero"; stake: number; envidoTeam: Team }
  | { kind: "noquiero"; payout: number; envidoTeam: Team }
  | { kind: "ordago-quiero"; envidoTeam: Team }
  | { kind: "ordago-noquiero"; envidoTeam: Team };

/** Stones paid immediately when an envite is declined. Extra tantos wait for recuento. */
export function declinedStakePoints(outcome: LanceOutcome): number {
  return outcome.kind === "ordago-noquiero" ? 1 : outcome.kind === "noquiero" ? outcome.payout : 0;
}

export interface SeatHand {
  seat: number;
  team: Team;
  eval: MusHandEval;
}

/** Base "en paso" value for a lance won without an accepted envite. */
export const LANCE_BASE: Record<Lance, number> = {
  grande: 1,
  chica: 1,
  pares: 0, // pares base comes from per-holder tantos instead
  juego: 2,
};

/**
 * Determine which TEAM wins a lance by comparing hands.
 * `order` lists seats in mano priority (mano first). Ties go to the
 * team whose best participating hand sits earliest in `order`.
 * Returns null if nobody participates.
 */
export function resolveLanceWinner(
  lance: Lance,
  participants: SeatHand[],
  order: number[],
): { team: Team; seat: number } | null {
  if (participants.length === 0) return null;
  const orderIdx = (seat: number) => {
    const i = order.indexOf(seat);
    return i === -1 ? 999 : i;
  };
  // Best hand overall, breaking ties by mano priority.
  const sorted = [...participants].sort((a, b) => {
    const cmp = compareForLance(a.eval, b.eval, lance);
    if (cmp !== 0) return -cmp; // better hand first
    return orderIdx(a.seat) - orderIdx(b.seat); // earlier mano first
  });
  const best = sorted[0];
  return { team: best.team, seat: best.seat };
}

export interface LanceScore {
  lance: Lance;
  winnerTeam: Team | null;
  points: number;
  detail: string;
  isPunto?: boolean;
}

/** Pares tantos held by a team's members (only those with pares). */
export function paresTantosForTeam(participants: SeatHand[], team: Team): number {
  return participants
    .filter((p) => p.team === team && p.eval.pares.category !== "none")
    .reduce((sum, p) => sum + p.eval.pares.tantos, 0);
}

/**
 * Score one lance given its betting outcome and the participating hands.
 * `allHands` are the four hands; `participants` are those eligible for the lance.
 */
export function scoreLance(
  lance: Lance,
  outcome: LanceOutcome,
  participants: SeatHand[],
  order: number[],
  isPunto: boolean = false,
): LanceScore {
  // Punto (nobody reached 31) fills the juego slot but scores like a 1-point lance.
  if (lance === "juego" && isPunto) {
    return { ...scorePunto(outcome, participants, order), isPunto: true };
  }
  // Órdago is resolved elsewhere (decides the whole vaca) — no piedras here.
  if (outcome.kind === "ordago-quiero") {
    return { lance, winnerTeam: null, points: 0, detail: "Órdago aceptado" };
  }
  if (outcome.kind === "ordago-noquiero") {
    return { lance, winnerTeam: outcome.envidoTeam, points: 1, detail: "Órdago no querido (+1)" };
  }

  // No quiero: the enviting team wins the lance without a showdown.
  if (outcome.kind === "noquiero") {
    let pts = outcome.payout;
    let detail = `No querido (+${outcome.payout})`;
    if (lance === "pares") {
      const t = paresTantosForTeam(participants, outcome.envidoTeam);
      pts += t;
      detail += t > 0 ? ` + pares ${t}` : "";
    } else if (lance === "juego") {
      const base = juegoTantosForTeam(participants, outcome.envidoTeam);
      pts += base;
      detail += base > 0 ? ` + juego ${base}` : "";
    }
    return { lance, winnerTeam: outcome.envidoTeam, points: pts, detail };
  }

  // Paso or Quiero → decide by comparing hands.
  const winner = resolveLanceWinner(lance, participants, order);
  if (!winner) {
    return { lance, winnerTeam: null, points: 0, detail: "No se juega" };
  }

  let pts = 0;
  let detail = "";

  if (outcome.kind === "quiero") {
    pts += outcome.stake;
    detail = `Envite +${outcome.stake}`;
  } else {
    // en paso — grande/chica score a flat 1; juego scores per-player below.
    if (lance === "grande" || lance === "chica") {
      pts += LANCE_BASE[lance];
      detail = `En paso +${LANCE_BASE[lance]}`;
    } else {
      detail = "En paso";
    }
  }

  if (lance === "pares") {
    const t = paresTantosForTeam(participants, winner.team);
    pts += t;
    detail += (detail ? " + " : "") + `pares ${t}`;
  } else if (lance === "juego") {
    // Each player of the winning team with juego scores: 2, or 3 for a 31.
    const t = juegoTantosForTeam(participants, winner.team);
    pts += t;
    detail += (detail ? " + " : "") + `juego ${t}`;
  }

  return { lance, winnerTeam: winner.team, points: pts, detail };
}

/** Score the Punto sub-lance (base 1, no pares/juego tantos). */
function scorePunto(
  outcome: LanceOutcome,
  participants: SeatHand[],
  order: number[],
): LanceScore {
  const lance: Lance = "juego";
  if (outcome.kind === "ordago-quiero") {
    return { lance, winnerTeam: null, points: 0, detail: "Órdago aceptado" };
  }
  if (outcome.kind === "ordago-noquiero") {
    return { lance, winnerTeam: outcome.envidoTeam, points: 1, detail: "Órdago no querido (+1)" };
  }
  if (outcome.kind === "noquiero") {
    return { lance, winnerTeam: outcome.envidoTeam, points: outcome.payout, detail: `Punto no querido (+${outcome.payout})` };
  }
  const winner = resolveLanceWinner("juego", participants, order);
  if (!winner) return { lance, winnerTeam: null, points: 0, detail: "Sin punto" };
  const pts = outcome.kind === "quiero" ? outcome.stake : 1;
  const detail = outcome.kind === "quiero" ? `Punto envite +${outcome.stake}` : "Punto +1";
  return { lance, winnerTeam: winner.team, points: pts, detail };
}

/**
 * Juego tantos for a team: each member holding juego scores 2, or 3 for a 31.
 * (Two juegos = 4, two 31s = 6, one of each = 5.)
 */
function juegoTantosForTeam(participants: SeatHand[], team: Team): number {
  return participants
    .filter((p) => p.team === team && p.eval.juego.hasJuego)
    .reduce((sum, p) => sum + (p.eval.juego.sum === 31 ? 3 : 2), 0);
}
