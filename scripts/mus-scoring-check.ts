/* Recuento & rules checks for Mus. Run: npx tsx scripts/mus-scoring-check.ts */
import {
  musValue, juegoStrength, evaluatePares, evaluateJuego, comparePares,
  evaluateMusHand, compareForLance,
} from "../src/engine/mus/rules";
import { scoreLance, declinedStakePoints, type SeatHand } from "../src/engine/mus/scoring";
import type { SpanishCard, SpanishRank, SpanishSuit, Team } from "../src/engine/mus/types";

const SUITS: SpanishSuit[] = ["oros", "copas", "espadas", "bastos"];
const hand = (rs: SpanishRank[]): SpanishCard[] => rs.map((r, i) => ({ rank: r, suit: SUITS[i % 4] }));
const R8 = true;
const order = [0, 1, 2, 3];
const sh = (seat: number, team: Team, rs: SpanishRank[]): SeatHand => ({ seat, team, eval: evaluateMusHand(hand(rs), R8) });

let pass = 0, fail = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`✗ ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}
function ok(name: string, cond: boolean) { if (cond) pass++; else { fail++; console.log(`✗ ${name}`); } }

// ── Rules ──
eq("musValue 3 = rey(10)", musValue(3, R8), 10);
eq("musValue 2 = as(1)", musValue(2, R8), 1);
ok("juego 31>32", juegoStrength(31) > juegoStrength(32));
ok("juego 32>40", juegoStrength(32) > juegoStrength(40));
ok("juego 40>39", juegoStrength(40) > juegoStrength(39));
ok("juego 34>33", juegoStrength(34) > juegoStrength(33));
eq("evaluateJuego 31", evaluateJuego(hand([12, 12, 12, 1]), R8).sum, 31);
eq("pares: dos reyes = par", evaluatePares(hand([12, 12, 7, 4]), R8).category, "par");
eq("pares: tres reyes = medias", evaluatePares(hand([12, 12, 12, 4]), R8).category, "medias");
eq("pares: reyes+cuatros = duples", evaluatePares(hand([12, 12, 4, 4]), R8).category, "duples");
eq("pares tantos par=1", evaluatePares(hand([12, 12, 7, 4]), R8).tantos, 1);
eq("pares tantos medias=2", evaluatePares(hand([12, 12, 12, 4]), R8).tantos, 2);
eq("pares tantos duples=3", evaluatePares(hand([12, 12, 4, 4]), R8).tantos, 3);
ok("comparePares duples>medias", comparePares(evaluatePares(hand([12, 12, 4, 4]), R8), evaluatePares(hand([12, 12, 12, 5]), R8)) > 0);
ok("grande: 4 reyes > 4 ases", compareForLance(evaluateMusHand(hand([12, 12, 12, 12]), R8), evaluateMusHand(hand([1, 1, 1, 1]), R8), "grande") > 0);
ok("chica: 4 ases > 4 reyes", compareForLance(evaluateMusHand(hand([1, 1, 1, 1]), R8), evaluateMusHand(hand([12, 12, 12, 12]), R8), "chica") > 0);
eq("juego sum [12,12,7,5] = 32", evaluateJuego(hand([12, 12, 7, 5]), R8).sum, 32);
ok("juego cmp: 31 > 32", compareForLance(evaluateMusHand(hand([12, 12, 12, 1]), R8), evaluateMusHand(hand([12, 12, 7, 5]), R8), "juego") > 0);

// ── Grande ──
{
  const parts = [sh(0, "A", [12, 12, 12, 12]), sh(1, "B", [1, 1, 1, 4]), sh(2, "A", [7, 6, 5, 4]), sh(3, "B", [4, 4, 5, 6])];
  eq("grande paso → A +1", scoreLance("grande", { kind: "paso" }, parts, order).points, 1);
  eq("grande quiero 3 → +3", scoreLance("grande", { kind: "quiero", stake: 3, envidoTeam: "A" }, parts, order).points, 3);
  const nq = scoreLance("grande", { kind: "noquiero", payout: 2, envidoTeam: "A" }, parts, order);
  eq("grande noquiero → A +2", [nq.winnerTeam, nq.points], ["A", 2]);
  eq("noquiero grande pago inmediato = envite", declinedStakePoints({ kind: "noquiero", payout: 2, envidoTeam: "A" }), 2);
}
// ── Chica ──
{
  const parts = [sh(0, "A", [1, 1, 4, 5]), sh(1, "B", [12, 12, 11, 10]), sh(2, "A", [7, 6, 6, 7]), sh(3, "B", [12, 11, 10, 9 as SpanishRank])];
  eq("chica paso → A +1", scoreLance("chica", { kind: "paso" }, parts, order).points, 1);
}
// ── Pares ── (only holders participate; winning team sums per holder)
{
  const parts = [sh(0, "A", [12, 12, 4, 4]), sh(1, "B", [12, 12, 7, 5]), sh(2, "A", [11, 11, 6, 5])];
  const r = scoreLance("pares", { kind: "paso" }, parts, order);
  eq("pares paso → A wins (duples) tantos 3+1=4", [r.winnerTeam, r.points], ["A", 4]);
  const nq = scoreLance("pares", { kind: "noquiero", payout: 2, envidoTeam: "A" }, parts, order);
  eq("pares noquiero → A 2 + tantos 4 = 6", [nq.winnerTeam, nq.points], ["A", 6]);
}
// ── Juego ── (per player: 2, or 3 for 31)
{
  eq("juego paso dos juegos → 4", scoreLance("juego", { kind: "paso" }, [sh(0, "A", [12, 12, 12, 4]), sh(2, "A", [12, 12, 12, 6])], order).points, 4);
  eq("juego paso dos 31 → 6", scoreLance("juego", { kind: "paso" }, [sh(0, "A", [12, 12, 12, 1]), sh(2, "A", [12, 12, 12, 1])], order).points, 6);
  eq("juego paso juego+31 → 5", scoreLance("juego", { kind: "paso" }, [sh(0, "A", [12, 12, 12, 4]), sh(2, "A", [12, 12, 12, 1])], order).points, 5);
  const nq = scoreLance("juego", { kind: "noquiero", payout: 2, envidoTeam: "A" }, [sh(0, "A", [12, 12, 12, 1]), sh(2, "A", [12, 12, 12, 4])], order);
  eq("juego noquiero → 2 + (3+2)=7", [nq.winnerTeam, nq.points], ["A", 7]);
  eq("noquiero juego adelanta solo envite", declinedStakePoints({ kind: "noquiero", payout: 2, envidoTeam: "A" }), 2);
}
// ── Punto ──
{
  const parts = [sh(0, "A", [12, 10, 7, 1]), sh(1, "B", [7, 6, 5, 4]), sh(2, "A", [4, 4, 4, 1]), sh(3, "B", [5, 4, 4, 4])];
  eq("punto paso → +1", scoreLance("juego", { kind: "paso" }, parts, order, true).points, 1);
  eq("punto quiero 4 → +4", scoreLance("juego", { kind: "quiero", stake: 4, envidoTeam: "A" }, parts, order, true).points, 4);
}
// ── Órdago ──
{
  const parts = [sh(0, "A", [12, 12, 12, 12]), sh(1, "B", [1, 1, 1, 1])];
  eq("ordago-quiero → 0 (resuelto aparte)", scoreLance("grande", { kind: "ordago-quiero", envidoTeam: "A" }, parts, order).points, 0);
  eq("ordago-noquiero → +1", scoreLance("grande", { kind: "ordago-noquiero", envidoTeam: "A" }, parts, order).points, 1);
  eq("ordago noquiero pago inmediato = 1", declinedStakePoints({ kind: "ordago-noquiero", envidoTeam: "A" }), 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
