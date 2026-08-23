"use client";

import { create } from "zustand";
import type {
  SpanishCard, MusConfig, MusMode, MusPlayer, Lance, Team,
} from "./types";
import { DEFAULT_MUS_CONFIG, LANCES, teamOfSeat, LANCE_LABEL } from "./types";
import { createShuffledDeck, shuffle } from "./deck";
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
  | "dealing"
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
  /** Players on the responding team who defer the live envite to their partner. */
  responsePassedSeats: number[];
  outcome: LanceOutcome | null;
  contested: boolean;
  isPunto: boolean;       // for the juego slot when nobody has juego
}

export interface MusState {
  config: MusConfig;
  mode: MusMode;
  players: MusPlayer[];
  deck: SpanishCard[];
  discardPile: SpanishCard[];
  dealerSeat: number;
  manoSeat: number;
  phase: MusPhase;
  // online context
  localSeat: number;        // which seat this device controls (0 in solo)
  humanSeats: number[];     // seats controlled by real people
  isHost: boolean;          // host runs bots + authoritative reducer
  roomCode: string | null;
  // mus voting
  musActiveIdx: number;
  discardSelection: number[];          // local player's current picks
  discardSelections: Record<number, number[]>; // per-seat picks (host aggregates)
  discardConfirmed: number[];          // seats that confirmed their discard
  musRound: number;
  // lances
  lances: Record<Lance, LanceRuntime | null>;
  currentLance: Lance | null;
  /** During pares/juego, players declare (truthfully) before betting. */
  declaring: Lance | null;
  declaredSeats: number[];
  // results
  handScores: LanceScore[];
  score: { A: number; B: number };
  vacas: { A: number; B: number };
  reveal: boolean;
  /** Latest declaration per seat (mus / envido / quiero…), reset each lance. */
  seatActions: (string | null)[];
  lastAction: { seat: number; text: string } | null;
  message: string | null;
  winnerTeam: Team | null;
  ordagoVaca: Team | null;
}

interface MusActions {
  startSolo: (config?: Partial<MusConfig>) => void;
  voteMus: (mus: boolean, label?: string) => void;
  toggleDiscard: (index: number) => void;
  confirmDiscard: () => void;
  declare: () => void;
  humanBet: (a: HumanBetAction) => void;
  nextHand: () => void;
  reset: () => void;
  submitDeclare: (seat: number) => void;
  // ── Online (host-authoritative) ──
  startOnlineHost: (config: MusConfig, humanSeats: number[], names: Record<number, string>, localSeat: number, roomCode: string) => void;
  startOnlineClient: (localSeat: number, roomCode: string) => void;
  submitMusVote: (seat: number, mus: boolean, label?: string) => void;
  submitBet: (seat: number, a: HumanBetAction) => void;
  submitDiscard: (seat: number, discards: number[]) => void;
  submitNextHand: (seat: number) => void;
  applyRemoteState: (state: Partial<MusState>) => void;
  /** Serialize just the data fields for network sync. */
  snapshot: () => Partial<MusState>;
}

/** Client → host network intents (online mode). */
export type MusNetAction =
  | { t: "mus"; mus: boolean; label?: string }
  | { t: "bet"; a: HumanBetAction }
  | { t: "discard"; discards: number[] }
  | { t: "declare" }
  | { t: "next" };

let onlineSend: ((seat: number, action: MusNetAction) => void) | null = null;
/** The online layer registers this so a client can forward actions to the host. */
export function setOnlineSend(fn: ((seat: number, action: MusNetAction) => void) | null) {
  onlineSend = fn;
}

export type HumanBetAction =
  | { type: "paso" }
  | { type: "hasta" }
  | { type: "envido"; amount: number }
  | { type: "ordago" }
  | { type: "quiero" }
  | { type: "noquiero" }
  | { type: "subir"; amount: number };

export type MusStore = MusState & MusActions;

const AI_NAMES = ["Sur", "Nora", "Beto", "Iker"];
const AI_AVATARS = ["", "", "", ""];

// ─── Helpers ─────────────────────────────────────────────────

function manoOrder(manoSeat: number): number[] {
  return [0, 1, 2, 3].map((i) => (manoSeat + i) % 4);
}

function makePlayers(humanSeats: number[] = [0], names: Record<number, string> = {}): MusPlayer[] {
  const { nickname } = useCustomizeStore.getState();
  const players: MusPlayer[] = [];
  for (let seat = 0; seat < 4; seat++) {
    const isHuman = humanSeats.includes(seat);
    const defaultName = isHuman
      ? (seat === 0 && humanSeats.length === 1 ? (nickname || "Tú") : `Jugador ${seat + 1}`)
      : AI_NAMES[seat] || `Bot ${seat}`;
    players.push({
      id: isHuman ? `human-${seat}` : `bot-${seat}`,
      name: names[seat] || defaultName,
      avatar: "",
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
    responsePassedSeats: [],
    outcome: null,
    contested,
    isPunto,
  };
}

function initialState(): MusState {
  return {
    config: { ...DEFAULT_MUS_CONFIG },
    mode: "solo",
    players: makePlayers(),
    deck: [],
    discardPile: [],
    dealerSeat: 0,
    manoSeat: 1,
    phase: "idle",
    localSeat: 0,
    humanSeats: [0],
    isHost: true,
    roomCode: null,
    musActiveIdx: 0,
    discardSelection: [],
    discardSelections: {},
    discardConfirmed: [],
    musRound: 0,
    lances: { grande: null, chica: null, pares: null, juego: null },
    currentLance: null,
    declaring: null,
    declaredSeats: [],
    handScores: [],
    score: { A: 0, B: 0 },
    vacas: { A: 0, B: 0 },
    reveal: false,
    seatActions: [null, null, null, null],
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

  /** Record a player's declaration so it stays visible next to their seat. */
  function recordAction(seat: number, text: string, extra: Partial<MusState> = {}) {
    const seatActions = get().seatActions.slice();
    seatActions[seat] = text;
    set({ seatActions, lastAction: { seat, text }, ...extra });
  }

  /** Deal a fresh hand and enter the mus-voting phase. */
  function dealNewHand(dealerSeat: number) {
    const cur = get();
    const names: Record<number, string> = {};
    cur.players.forEach((p) => { names[p.seat] = p.name; });
    const base = makePlayers(cur.humanSeats, names);
    const deck = createShuffledDeck();
    const { players, deck: rest } = dealHands(base, deck);
    const manoSeat = (dealerSeat + 1) % 4;
    set({
      players, deck: rest, discardPile: [], dealerSeat, manoSeat,
      phase: "mus", musActiveIdx: 0, musRound: 0,
      discardSelection: [], discardSelections: {}, discardConfirmed: [],
      reveal: false, handScores: [], seatActions: [null, null, null, null],
      lances: { grande: null, chica: null, pares: null, juego: null },
      currentLance: null, lastAction: null, message: "Mus…", winnerTeam: null,
      ordagoVaca: null,
    });
    maybeBotMus();
  }

  // ── Mus voting ──
  function maybeBotMus() {
    const s = get();
    if (s.phase !== "mus") return;
    if (!s.isHost) return; // only host runs bots
    const seat = manoOrder(s.manoSeat)[s.musActiveIdx];
    if (s.humanSeats.includes(seat)) return; // wait for a human
    schedule(() => {
      const st = get();
      if (st.phase !== "mus") return;
      const p = st.players[seat];
      const dec = decideMus(p.cards, st.config.reyes8, st.config.difficulty);
      applyMusVote(dec.mus);
    }, 650);
  }

  function applyMusVote(mus: boolean, label?: string) {
    const s = get();
    if (s.phase !== "mus") return;
    const seat = manoOrder(s.manoSeat)[s.musActiveIdx];

    // This is not a "No hay mus": the player explicitly leaves the
    // decision to their partner, who gets the next available choice.
    if (label === "Hasta mi compañero") {
      const partnerSeat = (seat + 2) % 4;
      const partnerIdx = manoOrder(s.manoSeat).indexOf(partnerSeat);
      recordAction(seat, label);
      set({ musActiveIdx: partnerIdx, message: "Decide el compañero" });
      maybeBotMus();
      return;
    }

    if (!mus) {
      const ranks = s.players[seat].cards.map((card) => card.rank).sort((a, b) => a - b);
      const isPerete = ranks.length === 4 && ranks.every((rank, index) => rank === index + 4);
      if (isPerete && s.players[seat].isHuman) {
        recordAction(seat, "Perete — descarto", { phase: "discard", message: "Perete: descarta cartas" });
        return;
      }
      // Someone cuts → betting begins.
      recordAction(seat, label || "No hay mus", { message: null });
      schedule(() => beginLances(), 600);
      return;
    }
    recordAction(seat, "Mus");
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
    let discardPile = [...s.discardPile];

    // Draw one card, refilling the deck from the discard pile (reshuffled) when empty.
    // Cards currently in players' hands are in neither pile, so they can never repeat.
    const draw = (): SpanishCard => {
      if (deck.length === 0) {
        deck = discardPile.length > 0 ? shuffle(discardPile) : createShuffledDeck();
        discardPile = [];
      }
      const c = deck[0];
      deck = deck.slice(1);
      return c;
    };

    const counts: (string | null)[] = [null, null, null, null];
    const players = s.players.map((p) => {
      let discards: number[];
      if (p.isHuman) {
        const sel = s.discardSelections[p.seat] ?? (p.seat === s.localSeat ? s.discardSelection : []);
        discards = sel.length > 0 ? sel : [worstCardIndex(p.cards, s.config.reyes8)];
      } else {
        const dec = decideMus(p.cards, s.config.reyes8, s.config.difficulty);
        discards = dec.discards.length > 0 ? dec.discards : [worstCardIndex(p.cards, s.config.reyes8)];
      }
      counts[p.seat] = `Tira ${discards.length}`;
      // Thrown cards go to the discard pile.
      p.cards.forEach((c, i) => { if (discards.includes(i)) discardPile.push(c); });
      const kept = p.cards.filter((_, i) => !discards.includes(i));
      const fresh: SpanishCard[] = [];
      for (let k = kept.length; k < 4; k++) fresh.push(draw());
      return { ...p, cards: [...kept, ...fresh] };
    });

    // Brief "dealing" beat so players see how many each threw and the cards fly in.
    set({
      players, deck, discardPile, phase: "dealing", musActiveIdx: 0,
      musRound: s.musRound + 1, discardSelection: [], discardSelections: {}, discardConfirmed: [],
      message: "Reparto…", lastAction: null, seatActions: counts,
    });
    schedule(() => {
      set({ phase: "mus", seatActions: [null, null, null, null], message: "Mus…" });
      maybeBotMus();
    }, 1400);
  }

  // ── Lances ──
  function beginLances() {
    startLance("grande");
  }

  function startLance(lance: Lance) {
    // Pares & Juego open with a truthful declaration round.
    if (lance === "pares" || lance === "juego") {
      set({
        phase: lance, currentLance: lance, declaring: lance, declaredSeats: [],
        seatActions: [null, null, null, null],
        message: lance === "pares" ? "¿Pares?" : "¿Juego?",
      });
      scheduleBotDeclarations();
      return;
    }
    resolveLanceStart(lance);
  }

  function scheduleBotDeclarations() {
    const s = get();
    if (!s.isHost || !s.declaring) return;
    s.players.forEach((p) => {
      if (p.isHuman || s.declaredSeats.includes(p.seat)) return;
      schedule(() => applyDeclare(p.seat), 450 + p.seat * 220);
    });
  }

  function applyDeclare(seat: number) {
    const s = get();
    const lance = s.declaring;
    if (!lance || s.declaredSeats.includes(seat)) return;
    const ev = evaluateMusHand(s.players[seat].cards, s.config.reyes8);
    const has = lance === "pares" ? ev.pares.category !== "none" : ev.juego.hasJuego;
    const label = lance === "pares" ? (has ? "Pares" : "No") : (has ? "Juego" : "No");
    const declaredSeats = [...s.declaredSeats, seat];
    const seatActions = s.seatActions.slice();
    seatActions[seat] = label;
    set({ declaredSeats, seatActions, lastAction: { seat, text: label } });
    if (declaredSeats.length >= 4) {
      schedule(() => { set({ declaring: null }); resolveLanceStart(lance); }, 800);
    }
  }

  function resolveLanceStart(lance: Lance) {
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
      set({ seatActions: [null, null, null, null] });
      recordAction(rt.order[0], `${LANCE_LABEL[lance]}: en juego`);
      return schedule(() => advanceLance(lance), 900);
    }

    set({
      phase: lance, currentLance: lance,
      lances: { ...s.lances, [lance]: rt },
      message: LANCE_LABEL[lance],
      seatActions: [null, null, null, null],
    });
    driveLance();
  }

  /** Which bot (if any) should act now. null = it's a human's turn. */
  function botToAct(rt: LanceRuntime, humanSeats: number[]): number | null {
    if (rt.bet.envidoTeam === null) {
      const seat = rt.order[rt.activeIdx]; // opening: sequential
      return humanSeats.includes(seat) ? null : seat;
    }
    // Live envite: the opposing team responds; a human teammate takes priority.
    const respondTeam: Team = rt.bet.envidoTeam === "A" ? "B" : "A";
    const responders = rt.order.filter((s) => teamOfSeat(s) === respondTeam && !(rt.responsePassedSeats ?? []).includes(s));
    if (responders.some((s) => humanSeats.includes(s))) return null;
    return responders[0] ?? null;
  }

  function driveLance() {
    const s = get();
    const lance = s.currentLance;
    if (!lance) return;
    const rt = s.lances[lance];
    if (!rt || rt.outcome) return;
    if (!s.isHost) return; // only host runs bots
    if (botToAct(rt, s.humanSeats) === null) return; // waiting for a human
    schedule(() => {
      const st = get();
      if (st.currentLance !== lance) return;
      const cur = st.lances[lance];
      if (!cur || cur.outcome) return;
      const botSeat = botToAct(cur, st.humanSeats);
      if (botSeat === null) return;
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

    const team = teamOfSeat(seat);
    const liveEnvite = rt.bet.envidoTeam !== null && rt.bet.envidoTeam !== team;

    // Validate the seat is entitled to act right now.
    if (rt.bet.envidoTeam === null) {
      if (rt.order[rt.activeIdx] !== seat) return; // opening: sequential
    } else {
      // A live envite: any participant of the OPPOSING team may respond.
      if (!liveEnvite) return;               // your own team's live bet — wait
      if (!rt.order.includes(seat)) return;  // must be a participant
      if ((rt.responsePassedSeats ?? []).includes(seat)) return; // this player already left it to their partner
    }

    const newRt: LanceRuntime = { ...rt, bet: { ...rt.bet, chain: [...rt.bet.chain] } };
    let actionText = "";

    if (rt.bet.envidoTeam === null) {
      // Opening round — sequential paso / envido / órdago.
      if (a.type === "paso" || a.type === "hasta") {
        actionText = a.type === "hasta" ? "Hasta ahí" : "Paso";
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
      } else if (a.type === "ordago") {
        actionText = "¡Órdago!";
        newRt.bet.chain = [9999];
        newRt.bet.envidoTeam = team;
        newRt.bet.isOrdago = true;
        newRt.passesInRow = 0;
      }
    } else {
      // Responding to a live envite (whole opposing team may answer).
      if (a.type === "paso") {
        actionText = "Paso";
        const responseSeats = rt.order.filter((s) => teamOfSeat(s) === team);
        newRt.responsePassedSeats = [...new Set([...(rt.responsePassedSeats ?? []), seat])];
        // Both partners have passed: it is equivalent to declining the envite.
        if (responseSeats.every((responder) => newRt.responsePassedSeats.includes(responder))) {
          if (rt.bet.isOrdago) newRt.outcome = { kind: "ordago-noquiero", envidoTeam: rt.bet.envidoTeam! };
          else {
            const chain = rt.bet.chain;
            newRt.outcome = { kind: "noquiero", payout: chain.length >= 2 ? chain[chain.length - 2] : 1, envidoTeam: rt.bet.envidoTeam! };
          }
          finishLance(seat, actionText, lance, newRt);
          return;
        }
      } else if (a.type === "quiero") {
        actionText = "Quiero";
        newRt.outcome = rt.bet.isOrdago
          ? { kind: "ordago-quiero", envidoTeam: rt.bet.envidoTeam! }
          : { kind: "quiero", stake: rt.bet.chain[rt.bet.chain.length - 1], envidoTeam: rt.bet.envidoTeam! };
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
        actionText = `Veo y subo ${a.amount}`;
        newRt.bet.chain = [...rt.bet.chain, last + a.amount];
        newRt.bet.envidoTeam = team; // now the other team must respond
        newRt.responsePassedSeats = [];
      } else if (a.type === "ordago") {
        actionText = "¡Órdago!";
        newRt.bet.chain = [...rt.bet.chain, 9999];
        newRt.bet.envidoTeam = team;
        newRt.bet.isOrdago = true;
        newRt.responsePassedSeats = [];
      }
    }

    const seatActions = s.seatActions.slice();
    seatActions[seat] = actionText;
    set({
      lances: { ...s.lances, [lance]: newRt },
      lastAction: { seat, text: actionText },
      seatActions,
    });
    driveLance();
  }

  function finishLance(seat: number, text: string, lance: Lance, rt: LanceRuntime) {
    const s = get();
    const seatActions = s.seatActions.slice();
    seatActions[seat] = text;
    set({
      lances: { ...s.lances, [lance]: rt },
      lastAction: { seat, text },
      seatActions,
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

    // ── Local player actions (route to host when online client) ──
    voteMus: (mus, label) => {
      const s = get();
      if (s.isHost) get().submitMusVote(s.localSeat, mus, label);
      else onlineSend?.(s.localSeat, { t: "mus", mus, label });
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
      if (s.isHost) get().submitDiscard(s.localSeat, s.discardSelection);
      else onlineSend?.(s.localSeat, { t: "discard", discards: s.discardSelection });
    },

    declare: () => {
      const s = get();
      if (!s.declaring || s.declaredSeats.includes(s.localSeat)) return;
      if (s.isHost) get().submitDeclare(s.localSeat);
      else onlineSend?.(s.localSeat, { t: "declare" });
    },

    submitDeclare: (seat) => {
      if (!get().isHost) return;
      applyDeclare(seat);
    },

    humanBet: (a) => {
      const s = get();
      if (s.isHost) get().submitBet(s.localSeat, a);
      else onlineSend?.(s.localSeat, { t: "bet", a });
    },

    nextHand: () => {
      const s = get();
      if (s.isHost) get().submitNextHand(s.localSeat);
      else onlineSend?.(s.localSeat, { t: "next" });
    },

    reset: () => { setOnlineSend(null); set({ ...initialState() }); },

    // ── Authoritative reducers (run on host) ──
    submitMusVote: (seat, mus, label) => {
      const s = get();
      if (!s.isHost || s.phase !== "mus") return;
      const active = manoOrder(s.manoSeat)[s.musActiveIdx];
      if (active !== seat) return; // not this seat's turn
      applyMusVote(mus, label);
    },

    submitBet: (seat, a) => {
      if (!get().isHost) return;
      applyBet(seat, a); // applyBet validates the seat is entitled to act
    },

    submitDiscard: (seat, discards) => {
      const s = get();
      if (!s.isHost || s.phase !== "discard") return;
      const picks = discards.length > 0 ? discards : [worstCardIndex(s.players[seat].cards, s.config.reyes8)];
      const selections = { ...s.discardSelections, [seat]: picks };
      const confirmed = s.discardConfirmed.includes(seat) ? s.discardConfirmed : [...s.discardConfirmed, seat];
      set({ discardSelections: selections, discardConfirmed: confirmed });
      // Redeal once every human seat has confirmed.
      if (s.humanSeats.every((hs) => confirmed.includes(hs))) {
        doDiscardAndRedeal();
      }
    },

    submitNextHand: (seat) => {
      const s = get();
      if (!s.isHost) return;
      if (!s.humanSeats.includes(seat)) return;
      if (s.phase === "gameEnd") {
        set({ ...initialState(), config: s.config, mode: s.mode, isHost: true, humanSeats: s.humanSeats, localSeat: s.localSeat, roomCode: s.roomCode, players: s.players });
        dealNewHand(0);
        return;
      }
      if (s.phase !== "handEnd" && s.phase !== "vacaEnd") return;
      dealNewHand((s.dealerSeat + 1) % 4);
    },

    // ── Online setup / sync ──
    startOnlineHost: (config, humanSeats, names, localSeat, roomCode) => {
      set({
        ...initialState(),
        config, mode: "online", isHost: true, humanSeats, localSeat, roomCode,
        players: makePlayers(humanSeats, names),
      });
      dealNewHand(0);
    },

    startOnlineClient: (localSeat, roomCode) => {
      setOnlineSend(null); // set by online layer
      set({
        ...initialState(),
        mode: "online", isHost: false, localSeat, roomCode, humanSeats: [],
        phase: "idle", message: "Conectando…",
      });
    },

    applyRemoteState: (partial) => {
      // Clients render host state; keep this device's local-only fields intact.
      const { localSeat, isHost, discardSelection } = get();
      set({ ...partial, localSeat, isHost, discardSelection });
    },

    snapshot: () => {
      const s = get();
      return {
        config: s.config, mode: s.mode, players: s.players, deck: s.deck,
        discardPile: s.discardPile, dealerSeat: s.dealerSeat, manoSeat: s.manoSeat,
        phase: s.phase, humanSeats: s.humanSeats, roomCode: s.roomCode,
        musActiveIdx: s.musActiveIdx, discardSelections: s.discardSelections,
        discardConfirmed: s.discardConfirmed, musRound: s.musRound,
        lances: s.lances, currentLance: s.currentLance, declaring: s.declaring,
        declaredSeats: s.declaredSeats, handScores: s.handScores,
        score: s.score, vacas: s.vacas, reveal: s.reveal, seatActions: s.seatActions,
        lastAction: s.lastAction, message: s.message, winnerTeam: s.winnerTeam,
        ordagoVaca: s.ordagoVaca,
      };
    },
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
