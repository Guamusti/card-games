"use client";

import { create } from "zustand";
import type { Card } from "../types";
import type { PokerState, PokerPhase, PokerAction, PokerPlayer } from "./types";
import { AI_NAMES, AI_AVATARS } from "./types";
import { createDeck, drawCard } from "../deck";
import { evaluateHand, compareHands } from "./evaluator";
import { getAIAction } from "./ai";

const INITIAL_CHIPS = 200;
const BIG_BLIND = 2;
const SMALL_BLIND = 1;
const NUM_AI = 5;

function draw(deck: Card[]): { card: Card; deck: Card[] } {
  const [card, remaining] = drawCard(deck);
  return { card, deck: remaining };
}

function createHumanPlayer(): PokerPlayer {
  return {
    id: "player",
    name: "You",
    avatar: "🐶",
    cards: [],
    chips: INITIAL_CHIPS,
    currentBet: 0,
    totalBet: 0,
    folded: false,
    isAllIn: false,
    isHuman: true,
  };
}

function createAIPlayer(index: number): PokerPlayer {
  return {
    id: `ai-${index}`,
    name: AI_NAMES[index] || `AI ${index + 1}`,
    avatar: AI_AVATARS[index] || "🤖",
    cards: [],
    chips: INITIAL_CHIPS,
    currentBet: 0,
    totalBet: 0,
    folded: false,
    isAllIn: false,
    isHuman: false,
  };
}

function initialState(): PokerState {
  const players: PokerPlayer[] = [createHumanPlayer()];
  for (let i = 0; i < NUM_AI; i++) {
    players.push(createAIPlayer(i));
  }
  return {
    deck: createDeck(1),
    community: [],
    players,
    activePlayerIndex: 0,
    phase: "betting",
    pot: 0,
    minRaise: BIG_BLIND,
    dealerIndex: 0,
    lastAction: null,
    winnerIds: [],
    showAllCards: false,
    currentRaise: BIG_BLIND * 2,
    bigBlind: BIG_BLIND,
    smallBlind: SMALL_BLIND,
  };
}

/** Extract state-only props for Zustand set() */
function stateOnly(s: PokerState): Partial<PokerStore> {
  return {
    deck: s.deck, community: s.community, players: s.players,
    activePlayerIndex: s.activePlayerIndex, phase: s.phase, pot: s.pot,
    minRaise: s.minRaise, dealerIndex: s.dealerIndex, lastAction: s.lastAction,
    winnerIds: s.winnerIds, showAllCards: s.showAllCards, currentRaise: s.currentRaise,
    bigBlind: s.bigBlind, smallBlind: s.smallBlind,
  };
}

interface PokerActions {
  deal: () => void;
  fold: () => void;
  check: () => void;
  call: () => void;
  raise: (amount: number) => void;
  allIn: () => void;
  skipHand: () => void;
  newRound: () => void;
  setCurrentRaise: (amount: number) => void;
  reset: () => void;
}

export type PokerStore = PokerState & PokerActions;

// ─── Helpers ────────────────────────────────────────────

function nextActiveIndex(players: PokerPlayer[], from: number, dealerIdx: number): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    const p = players[idx];
    if (!p.folded && !p.isAllIn) return idx;
  }
  return -1; // nobody can act
}

function activePlayers(players: PokerPlayer[]): PokerPlayer[] {
  return players.filter((p) => !p.folded);
}

function actingPlayers(players: PokerPlayer[]): PokerPlayer[] {
  return players.filter((p) => !p.folded && !p.isAllIn);
}

function postBlinds(state: PokerState): PokerState {
  const players = state.players.map((p) => ({ ...p }));
  const n = players.length;
  const sbIdx = (state.dealerIndex + 1) % n;
  const bbIdx = (state.dealerIndex + 2) % n;

  const sbAmount = Math.min(SMALL_BLIND, players[sbIdx].chips);
  players[sbIdx].chips -= sbAmount;
  players[sbIdx].currentBet = sbAmount;
  players[sbIdx].totalBet = sbAmount;
  if (players[sbIdx].chips === 0) players[sbIdx].isAllIn = true;

  const bbAmount = Math.min(BIG_BLIND, players[bbIdx].chips);
  players[bbIdx].chips -= bbAmount;
  players[bbIdx].currentBet = bbAmount;
  players[bbIdx].totalBet = bbAmount;
  if (players[bbIdx].chips === 0) players[bbIdx].isAllIn = true;

  // UTG acts first preflop
  const utgIdx = (state.dealerIndex + 3) % n;
  let firstActor = utgIdx;
  for (let i = 0; i < n; i++) {
    const idx = (utgIdx + i) % n;
    if (!players[idx].folded && !players[idx].isAllIn) {
      firstActor = idx;
      break;
    }
  }

  return {
    ...state,
    players,
    pot: sbAmount + bbAmount,
    minRaise: BIG_BLIND,
    activePlayerIndex: firstActor,
  };
}

function dealHoleCards(state: PokerState): PokerState {
  let deck = [...state.deck];
  const players = state.players.map((p) => ({ ...p }));
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < players.length; i++) {
      const { card, deck: remaining } = draw(deck);
      players[i].cards = [...players[i].cards, card];
      deck = remaining;
    }
  }
  return { ...state, deck, players };
}

function dealCommunity(state: PokerState, count: number): PokerState {
  let deck = [...state.deck];
  const community = [...state.community];
  for (let i = 0; i < count; i++) {
    const { card, deck: remaining } = draw(deck);
    community.push(card);
    deck = remaining;
  }
  return { ...state, deck, community };
}

function getNextPhase(phase: PokerPhase): PokerPhase {
  const order: PokerPhase[] = ["preflop", "flop", "turn", "river", "showdown"];
  const idx = order.indexOf(phase);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : "showdown";
}

function advancePhase(state: PokerState): PokerState {
  const nextPhase = getNextPhase(state.phase);
  const players = state.players.map((p) => ({ ...p, currentBet: 0 }));

  let newState: PokerState = {
    ...state, players, phase: nextPhase, minRaise: BIG_BLIND,
    // Postflop: first active player after dealer
    activePlayerIndex: nextActiveIndex(players, state.dealerIndex, state.dealerIndex),
  };

  if (nextPhase === "flop") {
    newState = dealCommunity(newState, 3);
  } else if (nextPhase === "turn" || nextPhase === "river") {
    newState = dealCommunity(newState, 1);
  } else if (nextPhase === "showdown") {
    return resolveShowdown(newState);
  }

  // If only one can act or none, run out
  if (actingPlayers(players).length <= 1) {
    return runOutBoard(newState);
  }

  if (newState.activePlayerIndex === -1) {
    return advancePhase(newState);
  }

  return newState;
}

function runOutBoard(state: PokerState): PokerState {
  let s = { ...state };
  while (s.community.length < 5) {
    const needed = s.community.length === 0 ? 3 : 1;
    s = dealCommunity(s, needed);
  }
  s.phase = "showdown";
  return resolveShowdown(s);
}

function resolveShowdown(state: PokerState): PokerState {
  const players = state.players.map((p) => ({ ...p }));
  const active = players.filter((p) => !p.folded);

  // If only one player left (rest folded)
  if (active.length === 1) {
    active[0].chips += state.pot;
    return {
      ...state, players, phase: "settled",
      winnerIds: [active[0].id], showAllCards: true, pot: 0,
    };
  }

  // Evaluate hands
  for (const player of active) {
    player.result = evaluateHand(player.cards, state.community);
  }

  // Find best hand
  let bestScore = -1;
  for (const p of active) {
    if (p.result && p.result.score > bestScore) bestScore = p.result.score;
  }
  const winners = active.filter((p) => p.result && p.result.score === bestScore);

  // Split pot among winners
  const share = Math.floor(state.pot / winners.length);
  const remainder = state.pot - share * winners.length;
  winners.forEach((w, i) => {
    w.chips += share + (i === 0 ? remainder : 0);
  });

  return {
    ...state, players, phase: "settled",
    winnerIds: winners.map((w) => w.id), showAllCards: true, pot: 0,
  };
}

function processAction(
  state: PokerState, playerIdx: number, action: PokerAction, raiseAmount?: number,
): PokerState {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerIdx];

  let pot = state.pot;
  let minRaise = state.minRaise;
  const maxBet = Math.max(...players.map((p) => p.currentBet));

  if (action === "fold") {
    player.folded = true;
    // Check if only one player remains
    const remaining = players.filter((p) => !p.folded);
    if (remaining.length === 1) {
      remaining[0].chips += pot;
      return {
        ...state, players, pot: 0, phase: "settled",
        winnerIds: [remaining[0].id], showAllCards: true,
        lastAction: { player: player.name, action },
      };
    }
  }

  if (action === "call") {
    const toCall = Math.min(maxBet - player.currentBet, player.chips);
    player.chips -= toCall;
    player.currentBet += toCall;
    player.totalBet += toCall;
    pot += toCall;
    if (player.chips === 0) player.isAllIn = true;
  }

  if (action === "raise") {
    const amount = raiseAmount || maxBet + minRaise;
    const toAdd = Math.min(amount - player.currentBet, player.chips);
    player.chips -= toAdd;
    player.currentBet += toAdd;
    player.totalBet += toAdd;
    pot += toAdd;
    minRaise = Math.max(minRaise, player.currentBet - maxBet);
    if (player.chips === 0) player.isAllIn = true;
  }

  if (action === "all-in") {
    const amount = player.chips;
    player.currentBet += amount;
    player.totalBet += amount;
    pot += amount;
    player.chips = 0;
    player.isAllIn = true;
    minRaise = Math.max(minRaise, player.currentBet - maxBet);
  }

  let newState: PokerState = {
    ...state, players, pot, minRaise,
    lastAction: { player: player.name, action, amount: raiseAmount },
  };

  // After raise/all-in, everyone else needs to act
  if (action === "raise" || action === "all-in") {
    const next = nextActiveIndex(players, playerIdx, state.dealerIndex);
    if (next === -1 || actingPlayers(players).length === 0) {
      return advancePhase(newState);
    }
    newState.activePlayerIndex = next;
    return newState;
  }

  // After check/call/fold: find next player who hasn't matched the bet
  const newMaxBet = Math.max(...players.map((p) => p.currentBet));
  const next = nextActiveIndex(players, playerIdx, state.dealerIndex);

  if (next === -1) {
    return advancePhase(newState);
  }

  // Check if betting round is complete
  const allMatched = actingPlayers(players).every(
    (p) => p.currentBet === newMaxBet
  );

  // We need to check if the next player has already acted at this bet level
  // Betting round ends when we come back to the player who last raised (or all matched)
  if (allMatched && action !== "fold") {
    // But the next player might not have acted yet this round
    // Simple check: if next player's bet equals max bet, round is done
    const nextPlayer = players[next];
    if (nextPlayer.currentBet === newMaxBet) {
      return advancePhase(newState);
    }
  }

  newState.activePlayerIndex = next;
  return newState;
}

// ─── AI Scheduling ──────────────────────────────────────

function scheduleAIAction(
  set: (partial: Partial<PokerStore>) => void,
  get: () => PokerStore,
): void {
  setTimeout(() => {
    const state = get();
    if (state.phase === "settled" || state.phase === "betting" || state.phase === "showdown") return;

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.isHuman || activePlayer.folded) return;
    if (activePlayer.isAllIn) {
      // Skip to next
      const next = nextActiveIndex(state.players, state.activePlayerIndex, state.dealerIndex);
      if (next === -1 || actingPlayers(state.players).length === 0) {
        set(stateOnly(advancePhase(state)));
      } else {
        set({ activePlayerIndex: next });
        const updated = get();
        if (!updated.players[next].isHuman) {
          scheduleAIAction(set, get);
        }
      }
      return;
    }

    const maxBet = Math.max(...state.players.map((p) => p.currentBet));
    const toCall = Math.max(0, maxBet - activePlayer.currentBet);

    const decision = getAIAction({
      holeCards: activePlayer.cards,
      community: state.community,
      pot: state.pot,
      toCall,
      chips: activePlayer.chips,
      phase: state.phase,
      bigBlind: state.bigBlind,
    });

    let newState: PokerState;
    if (decision.action === "fold") {
      newState = processAction(state, state.activePlayerIndex, "fold");
    } else if (decision.action === "check") {
      newState = processAction(state, state.activePlayerIndex, "check");
    } else if (decision.action === "call") {
      newState = processAction(state, state.activePlayerIndex, "call");
    } else if (decision.action === "all-in") {
      newState = processAction(state, state.activePlayerIndex, "all-in");
    } else {
      const amount = Math.max(maxBet + state.minRaise, decision.amount || state.minRaise);
      const capped = Math.min(amount, activePlayer.chips + activePlayer.currentBet);
      if (capped >= activePlayer.chips + activePlayer.currentBet) {
        newState = processAction(state, state.activePlayerIndex, "all-in");
      } else {
        newState = processAction(state, state.activePlayerIndex, "raise", capped);
      }
    }

    set(stateOnly(newState));

    // Continue AI chain if next player is also AI
    const updated = get();
    if (updated.phase !== "settled" && updated.phase !== "betting" && updated.phase !== "showdown") {
      const nextP = updated.players[updated.activePlayerIndex];
      if (nextP && !nextP.isHuman && !nextP.folded) {
        scheduleAIAction(set, get);
      }
    }
  }, 400 + Math.random() * 300);
}

// ─── Store ──────────────────────────────────────────────

export const usePokerStore = create<PokerStore>((set, get) => ({
  ...initialState(),

  deal: () => {
    const state = get();
    if (state.phase !== "betting") return;

    // Preserve chips, reset everything else
    let newState: PokerState = {
      ...initialState(),
      deck: createDeck(1),
      players: state.players.map((p) => ({
        ...(p.isHuman ? createHumanPlayer() : createAIPlayer(parseInt(p.id.split("-")[1]) || 0)),
        chips: p.chips,
        name: p.name,
        avatar: p.avatar,
        id: p.id,
        isHuman: p.isHuman,
      })),
      dealerIndex: state.dealerIndex,
      phase: "dealing",
    };

    newState = postBlinds(newState);
    newState = dealHoleCards(newState);
    newState.phase = "preflop";

    set(stateOnly(newState));

    // If first actor is AI, start the chain
    const firstActor = newState.players[newState.activePlayerIndex];
    if (firstActor && !firstActor.isHuman) {
      scheduleAIAction(set, get);
    }
  },

  fold: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const newState = processAction(state, playerIdx, "fold");
    set(stateOnly(newState));
    triggerAIIfNeeded(set, get);
  },

  check: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const maxBet = Math.max(...state.players.map((p) => p.currentBet));
    if (maxBet > state.players[playerIdx].currentBet) return;
    const newState = processAction(state, playerIdx, "check");
    set(stateOnly(newState));
    triggerAIIfNeeded(set, get);
  },

  call: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const newState = processAction(state, playerIdx, "call");
    set(stateOnly(newState));
    triggerAIIfNeeded(set, get);
  },

  raise: (amount: number) => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const player = state.players[playerIdx];
    if (amount >= player.chips + player.currentBet) {
      const newState = processAction(state, playerIdx, "all-in");
      set(stateOnly(newState));
    } else {
      const newState = processAction(state, playerIdx, "raise", amount);
      set(stateOnly(newState));
    }
    triggerAIIfNeeded(set, get);
  },

  allIn: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const newState = processAction(state, playerIdx, "all-in");
    set(stateOnly(newState));
    triggerAIIfNeeded(set, get);
  },

  skipHand: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (!state.players[playerIdx].folded) return;
    if (state.phase === "settled") return;
    const pokerState: PokerState = {
      deck: state.deck, community: state.community,
      players: state.players.map((p) => ({ ...p })),
      activePlayerIndex: state.activePlayerIndex, phase: state.phase,
      pot: state.pot, minRaise: state.minRaise, dealerIndex: state.dealerIndex,
      lastAction: state.lastAction, winnerIds: state.winnerIds,
      showAllCards: state.showAllCards, currentRaise: state.currentRaise,
      bigBlind: state.bigBlind, smallBlind: state.smallBlind,
    };
    const settled = runOutBoard(pokerState);
    set(stateOnly(settled));
  },

  newRound: () => {
    const state = get();
    const players = state.players.map((p) => ({
      ...(p.isHuman ? createHumanPlayer() : createAIPlayer(0)),
      chips: p.chips <= 0 ? INITIAL_CHIPS : p.chips,
      name: p.name,
      avatar: p.avatar,
      id: p.id,
      isHuman: p.isHuman,
    }));
    set(stateOnly({
      ...initialState(),
      players,
      dealerIndex: (state.dealerIndex + 1) % state.players.length,
    }));
  },

  setCurrentRaise: (amount: number) => {
    set({ currentRaise: amount });
  },

  reset: () => {
    set(stateOnly(initialState()));
  },
}));

function triggerAIIfNeeded(
  set: (partial: Partial<PokerStore>) => void,
  get: () => PokerStore,
) {
  const updated = get();
  if (
    updated.phase !== "settled" &&
    updated.phase !== "betting" &&
    updated.phase !== "showdown"
  ) {
    const nextP = updated.players[updated.activePlayerIndex];
    if (nextP && !nextP.isHuman && !nextP.folded) {
      scheduleAIAction(set, get);
    }
  }
}
