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
    lastAggressorIndex: -1,
  };
}

/** Extract state-only props for Zustand set() */
function stateOnly(s: PokerState): Partial<PokerStore> {
  return {
    deck: s.deck, community: s.community, players: s.players,
    activePlayerIndex: s.activePlayerIndex, phase: s.phase, pot: s.pot,
    minRaise: s.minRaise, dealerIndex: s.dealerIndex, lastAction: s.lastAction,
    winnerIds: s.winnerIds, showAllCards: s.showAllCards, currentRaise: s.currentRaise,
    bigBlind: s.bigBlind, smallBlind: s.smallBlind, lastAggressorIndex: s.lastAggressorIndex,
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
  setBlinds: (sb: number, bb: number) => void;
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
  return -1;
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

  const sbAmount = Math.min(state.smallBlind, players[sbIdx].chips);
  players[sbIdx].chips -= sbAmount;
  players[sbIdx].currentBet = sbAmount;
  players[sbIdx].totalBet = sbAmount;
  if (players[sbIdx].chips === 0) players[sbIdx].isAllIn = true;

  const bbAmount = Math.min(state.bigBlind, players[bbIdx].chips);
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
    minRaise: state.bigBlind,
    activePlayerIndex: firstActor,
    // BB is the last aggressor preflop (they put in the big blind)
    lastAggressorIndex: bbIdx,
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

/** Async advance — deals community cards with delay so player can see & act */
function advancePhaseAsync(
  set: (partial: Partial<PokerStore>) => void,
  get: () => PokerStore,
): void {
  const state = get();
  const nextPhase = getNextPhase(state.phase);
  const players = state.players.map((p) => ({ ...p, currentBet: 0 }));

  if (nextPhase === "showdown") {
    const newState: PokerState = {
      ...state, players, phase: nextPhase, minRaise: state.bigBlind,
      activePlayerIndex: nextActiveIndex(players, state.dealerIndex, state.dealerIndex),
    };
    set(stateOnly(resolveShowdown(newState)));
    return;
  }

  // Set phase to "dealing" momentarily to prevent actions during card animation
  set({ phase: "dealing" as PokerPhase, lastAction: null });

  const CARD_DELAY = 400;

  const finishPhaseTransition = (deck: Card[], finalCommunity: Card[]) => {
    const updatedPlayers = get().players.map((p) => ({ ...p, currentBet: 0 }));
    const firstToAct = nextActiveIndex(updatedPlayers, state.dealerIndex, state.dealerIndex);

    if (actingPlayers(updatedPlayers).length <= 1) {
      set(stateOnly(runOutBoard({
        ...state, deck, community: finalCommunity, players: updatedPlayers,
        phase: nextPhase, minRaise: state.bigBlind, activePlayerIndex: firstToAct,
        lastAggressorIndex: firstToAct,
      })));
      return;
    }

    // Reset lastAggressorIndex to firstToAct — round ends when action comes back here
    set({
      deck, community: finalCommunity, players: updatedPlayers,
      phase: nextPhase, minRaise: state.bigBlind, activePlayerIndex: firstToAct,
      lastAggressorIndex: firstToAct,
    });

    if (firstToAct !== -1) {
      const nextP = updatedPlayers[firstToAct];
      if (nextP && !nextP.isHuman && !nextP.folded) {
        scheduleAIAction(set, get);
      }
    }
  };

  if (nextPhase === "flop") {
    let deck = [...state.deck];
    const community = [...state.community];
    const flopCards: Card[] = [];
    for (let i = 0; i < 3; i++) {
      const { card, deck: remaining } = draw(deck);
      flopCards.push(card);
      deck = remaining;
    }

    setTimeout(() => {
      set({ community: [...community, flopCards[0]] });
    }, CARD_DELAY);

    setTimeout(() => {
      set({ community: [...community, flopCards[0], flopCards[1]] });
    }, CARD_DELAY * 2);

    setTimeout(() => {
      finishPhaseTransition(deck, [...community, ...flopCards]);
    }, CARD_DELAY * 3);

  } else if (nextPhase === "turn" || nextPhase === "river") {
    let deck = [...state.deck];
    const community = [...state.community];
    const { card, deck: remaining } = draw(deck);
    deck = remaining;

    setTimeout(() => {
      finishPhaseTransition(deck, [...community, card]);
    }, CARD_DELAY);
  }
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

  if (active.length === 1) {
    active[0].chips += state.pot;
    return {
      ...state, players, phase: "settled",
      winnerIds: [active[0].id], showAllCards: true, pot: 0,
    };
  }

  for (const player of active) {
    player.result = evaluateHand(player.cards, state.community);
  }

  let bestScore = -1;
  for (const p of active) {
    if (p.result && p.result.score > bestScore) bestScore = p.result.score;
  }
  const winners = active.filter((p) => p.result && p.result.score === bestScore);

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
  let lastAggressorIndex = state.lastAggressorIndex;
  const maxBet = Math.max(...players.map((p) => p.currentBet));

  if (action === "fold") {
    player.folded = true;
    const remaining = players.filter((p) => !p.folded);
    if (remaining.length === 1) {
      remaining[0].chips += pot;
      return {
        ...state, players, pot: 0, phase: "settled",
        winnerIds: [remaining[0].id], showAllCards: true,
        lastAction: { player: player.name, action },
        lastAggressorIndex,
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
    lastAggressorIndex = playerIdx;
  }

  if (action === "all-in") {
    const amount = player.chips;
    player.currentBet += amount;
    player.totalBet += amount;
    pot += amount;
    player.chips = 0;
    player.isAllIn = true;
    if (player.currentBet > maxBet) {
      lastAggressorIndex = playerIdx;
    }
    minRaise = Math.max(minRaise, player.currentBet - maxBet);
  }

  let newState: PokerState = {
    ...state, players, pot, minRaise, lastAggressorIndex,
    lastAction: { player: player.name, action, amount: raiseAmount },
  };

  // Find the next active player
  const next = nextActiveIndex(players, playerIdx, state.dealerIndex);

  if (next === -1 || actingPlayers(players).length === 0) {
    newState.phase = ("advance-" + newState.phase) as PokerPhase;
    return newState;
  }

  // Check if the betting round is complete:
  // Round ends when action returns to the last aggressor (or first-to-act if no raise)
  if (next === lastAggressorIndex) {
    // All players have had a chance to act since last raise
    const newMaxBet = Math.max(...players.map((p) => p.currentBet));
    const allMatched = actingPlayers(players).every((p) => p.currentBet === newMaxBet);
    if (allMatched) {
      newState.phase = ("advance-" + newState.phase) as PokerPhase;
      return newState;
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
    if (state.phase === "settled" || state.phase === "betting" || state.phase === "showdown" || state.phase === "dealing") return;

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.isHuman || activePlayer.folded) return;
    if (activePlayer.isAllIn) {
      const next = nextActiveIndex(state.players, state.activePlayerIndex, state.dealerIndex);
      if (next === -1 || actingPlayers(state.players).length === 0) {
        advancePhaseAsync(set, get);
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

    const needsAdvance = (newState.phase as string).startsWith("advance-");
    if (needsAdvance) {
      const realPhase = (newState.phase as string).replace("advance-", "") as PokerPhase;
      newState.phase = realPhase;
      set(stateOnly(newState));
      advancePhaseAsync(set, get);
      return;
    }

    set(stateOnly(newState));

    const updated = get();
    if (updated.phase !== "settled" && updated.phase !== "betting" && updated.phase !== "showdown" && updated.phase !== "dealing") {
      const nextP = updated.players[updated.activePlayerIndex];
      if (nextP && !nextP.isHuman && !nextP.folded) {
        scheduleAIAction(set, get);
      }
    }
  }, 600 + Math.random() * 400);
}

// ─── Action helper ───────────────────────────────────────

function handleAction(
  set: (partial: Partial<PokerStore>) => void,
  get: () => PokerStore,
  newState: PokerState,
) {
  const needsAdvance = (newState.phase as string).startsWith("advance-");
  if (needsAdvance) {
    const realPhase = (newState.phase as string).replace("advance-", "") as PokerPhase;
    newState.phase = realPhase;
    set(stateOnly(newState));
    advancePhaseAsync(set, get);
    return;
  }
  set(stateOnly(newState));
  triggerAIIfNeeded(set, get);
}

// ─── Store ──────────────────────────────────────────────

export const usePokerStore = create<PokerStore>((set, get) => ({
  ...initialState(),

  deal: () => {
    const state = get();
    if (state.phase !== "betting") return;

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
      bigBlind: state.bigBlind,
      smallBlind: state.smallBlind,
      phase: "dealing",
    };

    newState = postBlinds(newState);
    newState = dealHoleCards(newState);
    newState.phase = "dealing";

    set(stateOnly(newState));

    setTimeout(() => {
      newState.phase = "preflop";
      set({ phase: "preflop" });

      const firstActor = newState.players[newState.activePlayerIndex];
      if (firstActor && !firstActor.isHuman) {
        scheduleAIAction(set, get);
      }
    }, 800);
  },

  fold: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    handleAction(set, get, processAction(state, playerIdx, "fold"));
  },

  check: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const maxBet = Math.max(...state.players.map((p) => p.currentBet));
    if (maxBet > state.players[playerIdx].currentBet) return;
    handleAction(set, get, processAction(state, playerIdx, "check"));
  },

  call: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    handleAction(set, get, processAction(state, playerIdx, "call"));
  },

  raise: (amount: number) => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    const player = state.players[playerIdx];
    if (amount >= player.chips + player.currentBet) {
      handleAction(set, get, processAction(state, playerIdx, "all-in"));
    } else {
      handleAction(set, get, processAction(state, playerIdx, "raise", amount));
    }
  },

  allIn: () => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.isHuman);
    if (state.activePlayerIndex !== playerIdx) return;
    handleAction(set, get, processAction(state, playerIdx, "all-in"));
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
      lastAggressorIndex: state.lastAggressorIndex,
    };
    set(stateOnly(runOutBoard(pokerState)));
  },

  newRound: () => {
    const state = get();
    const players = state.players.map((p) => ({
      ...(p.isHuman ? createHumanPlayer() : createAIPlayer(0)),
      chips: p.chips <= 0 ? state.bigBlind * 100 : p.chips,
      name: p.name,
      avatar: p.avatar,
      id: p.id,
      isHuman: p.isHuman,
    }));
    set(stateOnly({
      ...initialState(),
      players,
      dealerIndex: (state.dealerIndex + 1) % state.players.length,
      bigBlind: state.bigBlind,
      smallBlind: state.smallBlind,
    }));
  },

  setCurrentRaise: (amount: number) => {
    set({ currentRaise: amount });
  },

  setBlinds: (sb: number, bb: number) => {
    const state = get();
    if (state.phase !== "betting") return;
    const startChips = bb * 100;
    const players = state.players.map((p) => ({ ...p, chips: startChips }));
    set({ smallBlind: sb, bigBlind: bb, players, currentRaise: bb * 2 });
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
    updated.phase !== "showdown" &&
    updated.phase !== "dealing"
  ) {
    const nextP = updated.players[updated.activePlayerIndex];
    if (nextP && !nextP.isHuman && !nextP.folded) {
      scheduleAIAction(set, get);
    }
  }
}
