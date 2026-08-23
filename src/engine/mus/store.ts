"use client";

import { create } from "zustand";
import type {
  SpanishCard, MusConfig, MusMode, MusPlayer, Lance, Team,
} from "./types";
import { DEFAULT_MUS_CONFIG, LANCES, teamOfSeat, LANCE_LABEL } from "./types";
import { createShuffledDeck } from "./deck";
import { evaluateMusHand, isJuegoLance } from "./rules";
import {
  scoreLance, resolveLanceWinner, type LanceOutcome, type SeatHand, type LanceScore,
} from "./scoring";
import { decideMus, decideBet } from "./ai";
import { useCustomizeStore } from "../customize/store";
import { useXPStore } from "../xp";

// ─── Runtime types ───────────────────────────────────────────

export type MusPhase =
  | "idle"
  | "mus"
  | "discard"
  | "grande" | "chica" | "pares" | "juego"
  | "showdown"
  | "handEnd"
  | "vacaEnd"
  | "gameEnd";

interface Bet {
  chain: number[];        // proposed stake totals (last = current)
  envidoTeam: Team | null;
  isOrdago: boolean;
}

interface LanceRuntime {
  lance: Lance;
  order: number[];        // participant seats in mano order
  activeIdx: number;
  bet: Bet;
  passesInRow: number;
  outcome: LanceOutcome | null;
  contested: boolean;
  isPunto: boolean;       // for the juego slot when nobody has juego
}

export interface MusState {
  config: MusConfig;
  mode: MusMode;
  players: MusPlayer[];
  deck: SpanishCard[];
  dealerSeat: number;
  manoSeat: number;
  phase: MusPhase;
  // mus voting
  musActiveIdx: number;
  discardSelection: number[];
  musRound: number;
  // lances
  lances: Record<Lance, LanceRuntime | null>;
  currentLance: Lance | null;
  // results
  handScores: LanceScore[];
  score: { A: number; B: number };
  vacas: { A: number; B: number };
  reveal: boolean;
  lastAction: { seat: number; text: string } | null;
  message: string | null;
  winnerTeam: Team | null;
  ordagoVaca: Team | null;
}

interface MusActions {
  startSolo: (config?: Partial<MusConfig>) => void;
  voteMus: (mus: boolean) => void;
  toggleDiscard: (index: number) => void;
  confirmDiscard: () => void;
  humanBet: (a: HumanBetAction) => void;
  nextHand: () => void;
  reset: () => void;
}

export type HumanBetAction =
  | { type: "paso" }
  | { type: "envido"; amount: number }
  | { type: "ordago" }
  | { type: "quiero" }
  | { type: "noquiero" }
  | { type: "subir"; amount: number };

export type MusStore = MusState & MusActions;

const HUMAN_SEAT = 0;
const AI_NAMES = ["Bot Sur", "Nora", "Bot Norte", "Iker"];
const AI_AVATARS = ["🤖", "🦊", "🤖", "🦉"];

// ─── Helpers ─────────────────────────────────────────────────

function manoOrder(manoSeat: number): number[] {
  return [0, 1, 2, 3].map((i) => (manoSeat + i) % 4);
}

function makePlayers(): MusPlayer[] {
  const { playerAvatar, nickname } = useCustomizeStore.getState();
  const players: MusPlayer[] = [];
  for (let seat = 0; seat < 4; seat++) {
    const isHuman = seat === HUMAN_SEAT;
    players.push({
      id: isHuman ? "player" : `bot-${seat}`,
      name: isHuman ? (nickname || "Tú") : AI_NAMES[seat],
      avatar: isHuman ? playerAvatar : AI_AVATARS[seat],
      seat,
      team: teamOfSeat(seat),
      cards: [],
      isHuman,
      isBot: !isHuman,
    });
  }
  return players;
}

function dealHands(players: MusPlayer[], deck: SpanishCard[]): { players: MusPlayer[]; deck: SpanishCard[] } {
  let d = [...deck];
  const dealt = players.map((p) => {
    const cards = d.slice(0, 4);
    d = d.slice(4);
    return { ...p, cards };
  });
  return { players: dealt, deck: d };
}

function evalsFor(players: MusPlayer[], reyes8: boolean): SeatHand[] {
  return players.map((p) => ({
    seat: p.seat,
    team: p.team,
    eval: evaluateMusHand(p.cards, reyes8),
  }));
}

/** Build the participant list & type for a lance. */
function setupLance(lance: Lance, players: MusPlayer[], manoSeat: number, reyes8: boolean): LanceRuntime {
  const order = manoOrder(manoSeat);
  const evals = evalsFor(players, reyes8);
  let participants: number[];
  let isPunto = false;

  if (lance === "pares") {
    participants = order.filter((s) => evals[s].eval.pares.category !== "none");
  } else if (lance === "juego") {
    if (isJuegoLance(evals.map((e) => e.eval))) {
      participants = order.filter((s) => evals[s].eval.juego.hasJuego);
    } else {
      participants = [...order]; // punto — everyone
      isPunto = true;
    }
  } else {
    participants = [...order]; // grande / chica — everyone
  }

  const teamsPresent = new Set(participants.map((s) => teamOfSeat(s)));
  const contested = teamsPresent.size === 2;

  return {
    lance,
    order: participants,
    activeIdx: 0,
    bet: { chain: [], envidoTeam: null, isOrdago: false },
    passesInRow: 0,
    outcome: null,
    contested,
    isPunto,
  };
}

/** Next index in a lance order belonging to the opposing team of `team`. */
function nextOpposing(rt: LanceRuntime, fromIdx: number, team: Team): number {
  const n = rt.order.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIdx + i) % n;
    if (teamOfSeat(rt.order[idx]) !== team) return idx;
  }
  return -1;
}

function initialState(): MusState {
  return {
    config: { ...DEFAULT_MUS_CONFIG },
    mode: "solo",
    players: makePlayers(),
    deck: [],
    dealerSeat: 0,
    manoSeat: 1,
    phase: "idle",
    musActiveIdx: 0,
    discardSelection: [],
    musRound: 0,
    lances: { grande: null, chica: null, pares: null, juego: null },
    currentLance: null,
    handScores: [],
    score: { A: 0, B: 0 },
    vacas: { A: 0, B: 0 },
    reveal: false,
    lastAction: null,
    message: null,
    winnerTeam: null,
    ordagoVaca: null,
  };
}

// ─── Store ───────────────────────────────────────────────────

export const useMusStore = create<MusStore>((set, get) => {

  function schedule(fn: () => void, ms = 750) {
    setTimeout(fn, ms);
  }

  /** Deal a fresh hand and enter the mus-voting phase. */
  function dealNewHand(dealerSeat: number) {
    const cfg = get().config;
    const base = makePlayers();
    const deck = createShuffledDeck();
    const { players, deck: rest } = dealHands(base, deck);
    const manoSeat = (dealerSeat + 1) % 4;
    set({
      players, deck: rest, dealerSeat, manoSeat,
      phase: "mus", musActiveIdx: 0, musRound: 0,
      discardSelection: [], reveal: false, handScores: [],
      lances: { grande: null, chica: null, pares: null, juego: null },
      currentLance: null, lastAction: null, message: "Mus…", winnerTeam: null,
      ordagoVaca: null,
    });
    void cfg;
    maybeBotMus();
  }

  // ── Mus voting ──
  function maybeBotMus() {
    const s = get();
    if (s.phase !== "mus") return;
    const seat = manoOrder(s.manoSeat)[s.musActiveIdx];
    if (seat === HUMAN_SEAT) return; // wait for human
    schedule(() => {
      const st = get();
      if (st.phase !== "mus") return;
      const p = st.players[seat];
      const dec = decideMus(p.cards, st.config.reyes8, st.config.difficulty);
      applyMusVote(dec.mus);
    }, 650);
  }

  function applyMusVote(mus: boolean) {
    const s = get();
    if (s.phase !== "mus") return;
    const seat = manoOrder(s.manoSeat)[s.musActiveIdx];
    if (!mus) {
      // Someone cuts → betting begins.
      set({ lastAction: { seat, text: "No hay mus" }, message: null });
      schedule(() => beginLances(), 500);
      return;
    }
    set({ lastAction: { seat, text: "Mus" } });
    const nextIdx = s.musActiveIdx + 1;
    if (nextIdx >= 4) {
      // Everyone wants mus → discard phase.
      set({ phase: "discard", musActiveIdx: 0, discardSelection: [], message: "Descarta cartas" });
      maybeBotDiscardResolve();
    } else {
      set({ musActiveIdx: nextIdx });
      maybeBotMus();
    }
  }

  // ── Discard ──
  function maybeBotDiscardResolve() {
    // Human chooses via UI; if human seat isn't in play (never here it is), auto.
    // Nothing to schedule — wait for confirmDiscard(). Bots resolve on confirm.
  }

  function doDiscardAndRedeal() {
    const s = get();
    let deck = [...s.deck];
    const players = s.players.map((p) => {
      let discards: number[];
      if (p.isHuman) {
        discards = s.discardSelection.length > 0 ? s.discardSelection : [worstCardIndex(p.cards, s.config.reyes8)];
      } else {
        const dec = decideMus(p.cards, s.config.reyes8, s.config.difficulty);
        discards = dec.discards.length > 0 ? dec.discards : [worstCardIndex(p.cards, s.config.reyes8)];
      }
      const kept = p.cards.filter((_, i) => !discards.includes(i));
      const need = 4 - kept.length;
      const fresh = deck.slice(0, need);
      deck = deck.slice(need);
      return { ...p, cards: [...kept, ...fresh] };
    });
    // If deck is running low, reshuffle a fresh one (Mus reshuffles the discards).
    if (deck.length < 16) deck = createShuffledDeck();
    set({
      players, deck, phase: "mus", musActiveIdx: 0,
      musRound: s.musRound + 1, discardSelection: [], message: "Mus…", lastAction: null,
    });
    maybeBotMus();
  }

  // ── Lances ──
  function beginLances() {
    startLance("grande");
  }

  function startLance(lance: Lance) {
    const s = get();
    const rt = setupLance(lance, s.players, s.manoSeat, s.config.reyes8);

    // Pares/Juego special: skip or auto-resolve uncontested.
    if (rt.order.length === 0) {
      // Nobody participates (e.g. no pares) → skip.
      recordLance(lance, rt, null);
      return advanceLance(lance);
    }
    if (!rt.contested) {
      // Only one team participates → uncontested, they take the base tantos.
      rt.outcome = { kind: "paso" };
      recordLance(lance, rt, rt.outcome);
      set({ lastAction: { seat: rt.order[0], text: `${LANCE_LABEL[lance]}: en juego` } });
      return schedule(() => advanceLance(lance), 700);
    }

    set({
      phase: lance, currentLance: lance,
      lances: { ...s.lances, [lance]: rt },
      message: LANCE_LABEL[lance],
    });
    driveLance();
  }

  function driveLance() {
    const s = get();
    const lance = s.currentLance;
    if (!lance) return;
    const rt = s.lances[lance];
    if (!rt || rt.outcome) return;
    const seat = rt.order[rt.activeIdx];
    if (seat === HUMAN_SEAT) return; // wait for human input
    // Bot acts.
    schedule(() => {
      const st = get();
      if (st.currentLance !== lance) return;
      const cur = st.lances[lance];
      if (!cur || cur.outcome) return;
      const botSeat = cur.order[cur.activeIdx];
      if (botSeat === HUMAN_SEAT) return;
      const p = st.players[botSeat];
      const team = teamOfSeat(botSeat);
      const decision = decideBet({
        eval: evaluateMusHand(p.cards, st.config.reyes8),
        lance,
        liveEnvite: cur.bet.envidoTeam !== null && cur.bet.envidoTeam !== team,
        currentStake: cur.bet.chain[cur.bet.chain.length - 1] ?? 0,
        isOrdago: cur.bet.isOrdago,
        difficulty: st.config.difficulty,
        pointsToWin: Math.max(1, st.config.vacaPoints - st.score[team]),
      });
      applyBet(botSeat, botDecisionToAction(decision));
    }, 800 + Math.random() * 500);
  }

  function applyBet(seat: number, a: HumanBetAction) {
    const s = get();
    const lance = s.currentLance;
    if (!lance) return;
    const rt = s.lances[lance];
    if (!rt || rt.outcome) return;
    if (rt.order[rt.activeIdx] !== seat) return; // not your turn

    const team = teamOfSeat(seat);
    const p = s.players[seat];
    const newRt: LanceRuntime = { ...rt, bet: { ...rt.bet, chain: [...rt.bet.chain] } };
    let actionText = "";

    const liveEnvite = rt.bet.envidoTeam !== null && rt.bet.envidoTeam !== team;

    if (!liveEnvite) {
      if (a.type === "paso") {
        actionText = "Paso";
        newRt.passesInRow = rt.passesInRow + 1;
        if (newRt.passesInRow >= rt.order.length) {
          newRt.outcome = { kind: "paso" };
          finishLance(seat, actionText, lance, newRt);
          return;
        }
        newRt.activeIdx = (rt.activeIdx + 1) % rt.order.length;
      } else if (a.type === "envido") {
        actionText = `Envido ${a.amount}`;
        newRt.bet.chain = [a.amount];
        newRt.bet.envidoTeam = team;
        newRt.passesInRow = 0;
        const ni = nextOpposing(newRt, rt.activeIdx, team);
        newRt.activeIdx = ni;
      } else if (a.type === "ordago") {
        actionText = "¡Órdago!";
        newRt.bet.chain = [9999];
        newRt.bet.envidoTeam = team;
        newRt.bet.isOrdago = true;
        newRt.passesInRow = 0;
        const ni = nextOpposing(newRt, rt.activeIdx, team);
        newRt.activeIdx = ni;
      }
    } else {
      // Responding to a live envite.
      if (a.type === "quiero") {
        actionText = "Quiero";
        if (rt.bet.isOrdago) {
          newRt.outcome = { kind: "ordago-quiero", envidoTeam: rt.bet.envidoTeam! };
        } else {
          newRt.outcome = { kind: "quiero", stake: rt.bet.chain[rt.bet.chain.length - 1], envidoTeam: rt.bet.envidoTeam! };
        }
        finishLance(seat, actionText, lance, newRt);
        return;
      } else if (a.type === "noquiero") {
        actionText = "No quiero";
        if (rt.bet.isOrdago) {
          newRt.outcome = { kind: "ordago-noquiero", envidoTeam: rt.bet.envidoTeam! };
        } else {
          const chain = rt.bet.chain;
          const payout = chain.length >= 2 ? chain[chain.length - 2] : 1;
          newRt.outcome = { kind: "noquiero", payout, envidoTeam: rt.bet.envidoTeam! };
        }
        finishLance(seat, actionText, lance, newRt);
        return;
      } else if (a.type === "subir") {
        const last = rt.bet.chain[rt.bet.chain.length - 1] ?? 0;
        const total = last + a.amount;
        actionText = `Veo y subo ${a.amount}`;
        newRt.bet.chain = [...rt.bet.chain, total];
        newRt.bet.envidoTeam = team;
        const ni = nextOpposing(newRt, rt.activeIdx, team);
        newRt.activeIdx = ni;
      } else if (a.type === "ordago") {
        actionText = "¡Órdago!";
        newRt.bet.chain = [...rt.bet.chain, 9999];
        newRt.bet.envidoTeam = team;
        newRt.bet.isOrdago = true;
        const ni = nextOpposing(newRt, rt.activeIdx, team);
        newRt.activeIdx = ni;
      }
    }

    void p;
    set({
      lances: { ...s.lances, [lance]: newRt },
      lastAction: { seat, text: actionText },
    });
    driveLance();
  }

  function finishLance(seat: number, text: string, lance: Lance, rt: LanceRuntime) {
    const s = get();
    set({
      lances: { ...s.lances, [lance]: rt },
      lastAction: { seat, text },
    });
    recordLance(lance, rt, rt.outcome);

    // Órdago accepted → straight to showdown, decides the vaca.
    if (rt.outcome?.kind === "ordago-quiero") {
      schedule(() => goShowdown(lance), 600);
      return;
    }
    schedule(() => advanceLance(lance), 800);
  }

  function recordLance(lance: Lance, rt: LanceRuntime, outcome: LanceOutcome | null) {
    const s = get();
    set({ lances: { ...s.lances, [lance]: { ...rt, outcome } } });
  }

  function advanceLance(lance: Lance) {
    const idx = LANCES.indexOf(lance);
    if (idx < LANCES.length - 1) {
      startLance(LANCES[idx + 1]);
    } else {
      goShowdown(null);
    }
  }

  // ── Showdown / recuento ──
  function goShowdown(ordagoLance: Lance | null) {
    const s = get();
    const reyes8 = s.config.reyes8;
    const allEvals = evalsFor(s.players, reyes8);
    const order = manoOrder(s.manoSeat);

    const scores: LanceScore[] = [];
    let a = s.score.A;
    let b = s.score.B;
    let winnerTeam: Team | null = null;
    let ordagoVaca: Team | null = null;

    if (ordagoLance) {
      // Órdago decides the whole vaca on this lance.
      const rt = s.lances[ordagoLance]!;
      const parts = rt.order.map((seat) => allEvals[seat]);
      const w = resolveLanceWinner(ordagoLance, parts, order);
      if (w) {
        ordagoVaca = w.team;
        scores.push({ lance: ordagoLance, winnerTeam: w.team, points: 0, detail: "Órdago — gana la vaca" });
      }
    } else {
      for (const lance of LANCES) {
        const rt = s.lances[lance];
        if (!rt || !rt.outcome) continue;
        const parts = rt.order.map((seat) => allEvals[seat]);
        const ls = scoreLance(lance, rt.outcome, parts, order, rt.isPunto);
        scores.push(ls);
        if (ls.winnerTeam === "A") a += ls.points;
        else if (ls.winnerTeam === "B") b += ls.points;
        // Reaching the target mid-count wins the vaca immediately.
        if (a >= s.config.vacaPoints) { ordagoVaca = "A"; break; }
        if (b >= s.config.vacaPoints) { ordagoVaca = "B"; break; }
      }
    }

    let vacas = { ...s.vacas };
    let phase: MusPhase = "handEnd";
    let score = { A: a, B: b };

    if (ordagoVaca) {
      vacas = { ...vacas, [ordagoVaca]: vacas[ordagoVaca] + 1 };
      score = { A: 0, B: 0 };
      const need = s.config.bestOf === 3 ? 2 : 3;
      if (vacas[ordagoVaca] >= need) {
        phase = "gameEnd";
        winnerTeam = ordagoVaca;
      } else {
        phase = "vacaEnd";
      }
    }

    set({
      phase, reveal: true, handScores: scores, score, vacas, winnerTeam,
      message: null, currentLance: null, ordagoVaca,
    });

    if (phase === "gameEnd" && winnerTeam) {
      const humanWon = winnerTeam === "A";
      useXPStore.getState().addXP(humanWon ? 40 : 15);
    }
  }

  function botDecisionToAction(d: ReturnType<typeof decideBet>): HumanBetAction {
    switch (d.action) {
      case "paso": return { type: "paso" };
      case "envido": return { type: "envido", amount: d.amount };
      case "quiero": return { type: "quiero" };
      case "noquiero": return { type: "noquiero" };
      case "subir": return { type: "subir", amount: d.amount };
      case "ordago": return { type: "ordago" };
    }
  }

  return {
    ...initialState(),

    startSolo: (config) => {
      const merged = { ...DEFAULT_MUS_CONFIG, difficulty: useCustomizeStore.getState().aiDifficulty, ...config };
      set({ ...initialState(), config: merged, mode: "solo" });
      dealNewHand(0);
    },

    voteMus: (mus) => {
      const s = get();
      if (s.phase !== "mus") return;
      const seat = manoOrder(s.manoSeat)[s.musActiveIdx];
      if (seat !== HUMAN_SEAT) return;
      applyMusVote(mus);
    },

    toggleDiscard: (index) => {
      const s = get();
      if (s.phase !== "discard") return;
      const sel = s.discardSelection.includes(index)
        ? s.discardSelection.filter((i) => i !== index)
        : [...s.discardSelection, index];
      set({ discardSelection: sel });
    },

    confirmDiscard: () => {
      const s = get();
      if (s.phase !== "discard") return;
      if (s.discardSelection.length === 0) return; // must discard at least 1
      doDiscardAndRedeal();
    },

    humanBet: (a) => {
      const s = get();
      const lance = s.currentLance;
      if (!lance) return;
      const rt = s.lances[lance];
      if (!rt || rt.outcome) return;
      if (rt.order[rt.activeIdx] !== HUMAN_SEAT) return;
      applyBet(HUMAN_SEAT, a);
    },

    nextHand: () => {
      const s = get();
      if (s.phase === "gameEnd") {
        // restart match
        set({ ...initialState(), config: s.config, mode: s.mode });
        dealNewHand(0);
        return;
      }
      dealNewHand((s.dealerSeat + 1) % 4);
    },

    reset: () => set({ ...initialState() }),
  };
});

// ─── Pure utilities exported for UI ──────────────────────────

function worstCardIndex(cards: SpanishCard[], reyes8: boolean): number {
  // Discard the least useful card (closest to a middle value).
  const evals = cards.map((c, i) => ({ i, v: evaluateMusHand([c], reyes8).high[0] }));
  // Middle values (4,5,6,7) least useful; distance from extremes.
  evals.sort((x, y) => middleness(y.v) - middleness(x.v));
  return evals[0].i;
}

function middleness(v: number): number {
  // Higher = more discardable. Reyes(10)/Ases(1) least discardable.
  return 5.5 - Math.abs(v - 5.5) === 0 ? 0 : 5.5 - Math.abs(v - 5.5);
}
