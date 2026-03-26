"use client";

import { create } from "zustand";
import type { GameState, GamePhase, Action, Hand, StrategyFeedback, Card } from "./types";
import { handValue, isBlackjack, canSplit } from "./types";
import { createDeck, drawCard } from "./deck";
import { getOptimalAction } from "./strategy";
import { useWalletStore } from "./wallet";
import { useStatsStore } from "./stats";
import { useXPStore } from "./xp";
import { usePnLStore } from "./pnlHistory";

const DEFAULT_BET = 100;
const BJ_BET_KEY = "card-trainer-bj-bet";
const BJ_NUMHANDS_KEY = "card-trainer-bj-numhands";

function loadBet(): number {
  if (typeof window === "undefined") return DEFAULT_BET;
  try {
    const raw = localStorage.getItem(BJ_BET_KEY);
    if (raw) return Math.max(10, JSON.parse(raw));
  } catch { /* ignore */ }
  return DEFAULT_BET;
}

function persistBet(bet: number) {
  try { localStorage.setItem(BJ_BET_KEY, JSON.stringify(bet)); } catch { /* ignore */ }
}

function loadNumHands(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(BJ_NUMHANDS_KEY);
    if (raw) {
      const n = JSON.parse(raw);
      if (n === 1 || n === 2 || n === 3) return n;
    }
  } catch { /* ignore */ }
  return 1;
}

function persistNumHands(n: number) {
  try { localStorage.setItem(BJ_NUMHANDS_KEY, JSON.stringify(n)); } catch { /* ignore */ }
}

function getBalance(): number {
  return useWalletStore.getState().balance;
}

function initialState(): GameState {
  const balance = getBalance();
  return {
    deck: createDeck(),
    dealer: { cards: [], hidden: true },
    hands: [],
    activeHandIndex: 0,
    phase: "betting",
    balance,
    currentBet: Math.min(loadBet(), balance),
    numHands: loadNumHands(),
    lastFeedback: null,
  };
}

interface GameActions {
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  newRound: () => void;
  setBet: (amount: number) => void;
  setNumHands: (n: number) => void;
  syncBalance: () => void;
  reset: () => void;
}

export type GameStore = GameState & GameActions;

function draw(deck: Card[]): { card: Card; deck: Card[] } {
  const [card, remaining] = drawCard(deck);
  return { card, deck: remaining };
}

function findNextPlayableHand(hands: Hand[], fromIdx: number): number {
  for (let i = fromIdx; i < hands.length; i++) {
    if (!hands[i].isStanding && handValue(hands[i].cards) < 21) return i;
  }
  return -1;
}

function checkAndAdvance(state: GameState): GameState {
  const hand = state.hands[state.activeHandIndex];
  if (!hand) return state;

  const val = handValue(hand.cards);
  if (val >= 21 || hand.isDoubled) {
    const updatedHands = [...state.hands];
    updatedHands[state.activeHandIndex] = { ...hand, isStanding: true };

    const nextIdx = findNextPlayableHand(updatedHands, state.activeHandIndex + 1);
    if (nextIdx !== -1) {
      return { ...state, hands: updatedHands, activeHandIndex: nextIdx };
    }
    return { ...state, hands: updatedHands, phase: "dealer-turn" };
  }
  return state;
}

function settleHands(state: GameState): GameState {
  const dealerVal = handValue(state.dealer.cards);
  const dealerBust = dealerVal > 21;
  const dealerBJ = isBlackjack(state.dealer.cards);

  let balance = state.balance;
  const wallet = useWalletStore.getState();
  const stats = useStatsStore.getState();

  const hands: Hand[] = state.hands.map((hand) => {
    const playerVal = handValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards);
    const playerBust = playerVal > 21;

    let result: Hand["result"];

    if (playerBust) {
      result = "lose";
    } else if (playerBJ && !dealerBJ) {
      result = "blackjack";
      balance += hand.bet + hand.bet * 1.5;
    } else if (dealerBJ && !playerBJ) {
      result = "lose";
    } else if (dealerBust) {
      result = "win";
      balance += hand.bet * 2;
    } else if (playerVal > dealerVal) {
      result = "win";
      balance += hand.bet * 2;
    } else if (playerVal < dealerVal) {
      result = "lose";
    } else {
      result = "push";
      balance += hand.bet;
    }

    return { ...hand, result };
  });

  // Record stats
  let xp = 5; // base XP for playing a hand
  for (const h of hands) {
    if (h.result) stats.recordBJHand(h.result);
    if (h.result === "win") xp += 10;
    if (h.result === "blackjack") xp += 15;
  }
  // Streak multiplier: 5+ correct = x2, 10+ = x3, 25+ = x4
  const streak = stats.bj.currentStreak;
  const multiplier = streak >= 25 ? 4 : streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
  useXPStore.getState().addXP(xp, multiplier);

  // Sync wallet
  wallet.setBalance(balance);
  usePnLStore.getState().recordSnapshot(balance, "bj");

  return { ...state, hands, balance, phase: "settled" };
}

function recordDecision(action: Action, hand: Hand, dealerUpcard: Card, canDouble: boolean, canSplitHand: boolean): StrategyFeedback {
  const optimal = getOptimalAction(hand.cards, dealerUpcard, canDouble, canSplitHand);
  const isCorrect = action === optimal;
  useStatsStore.getState().recordBJDecision(isCorrect);
  return { playerAction: action, correctAction: optimal, isCorrect };
}

/** Animate dealer drawing cards one by one */
function playDealerAnimated(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
): void {
  const CARD_DELAY = 600;

  const step = () => {
    const state = get();
    const dealerCards = [...state.dealer.cards];
    const val = handValue(dealerCards);

    if (val >= 17) {
      const settled = settleHands({ ...state, dealer: { cards: dealerCards, hidden: false } });
      set(settled);
      return;
    }

    const { card, deck } = draw(state.deck);
    const newCards = [...dealerCards, card];
    set({ deck, dealer: { cards: newCards, hidden: false } });

    if (handValue(newCards) < 17) {
      setTimeout(step, CARD_DELAY);
    } else {
      setTimeout(() => {
        const finalState = get();
        const settled = settleHands(finalState);
        set(settled);
      }, CARD_DELAY);
    }
  };

  const state = get();
  set({ dealer: { cards: state.dealer.cards, hidden: false }, phase: "dealer-turn" });
  setTimeout(step, CARD_DELAY);
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  syncBalance: () => {
    set({ balance: getBalance() });
  },

  deal: () => {
    const state = get();
    if (state.phase !== "betting") return;

    const n = state.numHands;
    const totalBet = state.currentBet * n;

    // Sync with wallet
    const walletBalance = getBalance();
    if (walletBalance < totalBet) return;

    let deck = state.deck.length < (20 + n * 4) ? createDeck() : [...state.deck];

    // Draw all cards upfront: dealer gets 2, each hand gets 2
    const d1 = draw(deck); deck = d1.deck;
    const d2 = draw(deck); deck = d2.deck;

    const playerCards: { c1: Card; c2: Card }[] = [];
    for (let i = 0; i < n; i++) {
      const c1 = draw(deck); deck = c1.deck;
      const c2 = draw(deck); deck = c2.deck;
      playerCards.push({ c1: c1.card, c2: c2.card });
    }

    const newBalance = walletBalance - totalBet;
    useWalletStore.getState().setBalance(newBalance);

    const DELAY = 350;

    // Create empty hands for the dealing animation
    const emptyHands: Hand[] = [];
    for (let i = 0; i < n; i++) {
      emptyHands.push({ cards: [], bet: state.currentBet, isDoubled: false, isStanding: false });
    }

    set({
      ...state,
      deck,
      dealer: { cards: [], hidden: true },
      hands: emptyHands,
      activeHandIndex: 0,
      phase: "dealing" as GamePhase,
      balance: newBalance,
      lastFeedback: null,
    });

    // Dealing order: d1, h1c1, h2c1, h3c1, d2, h1c2, h2c2, h3c2
    let step = 0;

    // Round 1: dealer card 1
    step++;
    setTimeout(() => {
      const s = get();
      set({ ...s, dealer: { ...s.dealer, cards: [d1.card] } });
    }, DELAY * step);

    // Round 1: each hand card 1
    for (let i = 0; i < n; i++) {
      step++;
      const idx = i;
      const delay = DELAY * step;
      setTimeout(() => {
        const s = get();
        const hands = [...s.hands];
        hands[idx] = { ...hands[idx], cards: [playerCards[idx].c1] };
        set({ ...s, hands });
      }, delay);
    }

    // Round 2: dealer card 2
    step++;
    setTimeout(() => {
      const s = get();
      set({ ...s, dealer: { cards: [d1.card, d2.card], hidden: true } });
    }, DELAY * step);

    // Round 2: each hand card 2
    for (let i = 0; i < n; i++) {
      step++;
      const idx = i;
      const delay = DELAY * step;
      setTimeout(() => {
        const s = get();
        const hands = [...s.hands];
        hands[idx] = { ...hands[idx], cards: [playerCards[idx].c1, playerCards[idx].c2] };
        set({ ...s, hands });
      }, delay);
    }

    // Final: transition to playing phase
    step++;
    setTimeout(() => {
      const s = get();
      const finalHands: Hand[] = playerCards.map((pc) => ({
        cards: [pc.c1, pc.c2],
        bet: state.currentBet,
        isDoubled: false,
        isStanding: false,
      }));

      // Check for blackjacks — mark them as standing
      let firstPlayableIdx = -1;
      for (let i = 0; i < finalHands.length; i++) {
        if (isBlackjack(finalHands[i].cards)) {
          finalHands[i] = { ...finalHands[i], isStanding: true };
        } else if (firstPlayableIdx === -1) {
          firstPlayableIdx = i;
        }
      }

      // If all hands are blackjack, go straight to dealer
      if (firstPlayableIdx === -1) {
        set({ ...s, hands: finalHands, activeHandIndex: 0, phase: "playing" });
        playDealerAnimated(set, get);
        return;
      }

      set({ ...s, hands: finalHands, activeHandIndex: firstPlayableIdx, phase: "playing" });
    }, DELAY * step);
  },

  hit: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const feedback = recordDecision(
      "hit", state.hands[state.activeHandIndex], state.dealer.cards[0],
      state.hands[state.activeHandIndex].cards.length === 2,
      canSplit(state.hands[state.activeHandIndex]),
    );

    const { card, deck } = draw(state.deck);
    const hands = [...state.hands];
    const hand = { ...hands[state.activeHandIndex] };
    hand.cards = [...hand.cards, card];
    hands[state.activeHandIndex] = hand;

    let newState: GameState = { ...state, deck, hands, lastFeedback: feedback };
    newState = checkAndAdvance(newState);

    if (newState.phase === "dealer-turn") {
      set({ ...newState, phase: "dealer-turn" });
      playDealerAnimated(set, get);
      return;
    }

    set(newState);
  },

  stand: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const feedback = recordDecision(
      "stand", state.hands[state.activeHandIndex], state.dealer.cards[0],
      state.hands[state.activeHandIndex].cards.length === 2,
      canSplit(state.hands[state.activeHandIndex]),
    );

    const hands = [...state.hands];
    hands[state.activeHandIndex] = { ...hands[state.activeHandIndex], isStanding: true };

    const nextIdx = findNextPlayableHand(hands, state.activeHandIndex + 1);
    if (nextIdx !== -1) {
      set({ ...state, hands, activeHandIndex: nextIdx, lastFeedback: feedback });
    } else {
      set({ ...state, hands, lastFeedback: feedback, phase: "dealer-turn" });
      playDealerAnimated(set, get);
    }
  },

  double: () => {
    const state = get();
    if (state.phase !== "playing") return;
    const hand = state.hands[state.activeHandIndex];
    if (hand.cards.length !== 2) return;

    const feedback = recordDecision("double", hand, state.dealer.cards[0], true, canSplit(hand));

    const { card, deck } = draw(state.deck);
    const hands = [...state.hands];
    hands[state.activeHandIndex] = {
      ...hand, cards: [...hand.cards, card], bet: hand.bet * 2,
      isDoubled: true, isStanding: true,
    };

    const newBalance = state.balance - hand.bet;
    useWalletStore.getState().removeChips(hand.bet);

    let newState: GameState = { ...state, deck, hands, balance: newBalance, lastFeedback: feedback };

    const nextIdx = findNextPlayableHand(hands, state.activeHandIndex + 1);
    if (nextIdx !== -1) {
      newState.activeHandIndex = nextIdx;
      set(newState);
    } else {
      set({ ...newState, phase: "dealer-turn" });
      playDealerAnimated(set, get);
    }
  },

  split: () => {
    const state = get();
    if (state.phase !== "playing") return;
    const hand = state.hands[state.activeHandIndex];
    if (!canSplit(hand)) return;

    const feedback = recordDecision("split", hand, state.dealer.cards[0], true, true);

    let deck = state.deck;
    const draw1 = draw(deck); deck = draw1.deck;
    const draw2 = draw(deck); deck = draw2.deck;

    const hand1: Hand = { cards: [hand.cards[0], draw1.card], bet: hand.bet, isDoubled: false, isStanding: false };
    const hand2: Hand = { cards: [hand.cards[1], draw2.card], bet: hand.bet, isDoubled: false, isStanding: false };

    const hands = [...state.hands];
    hands.splice(state.activeHandIndex, 1, hand1, hand2);

    const newBalance = state.balance - hand.bet;
    useWalletStore.getState().removeChips(hand.bet);

    let newState: GameState = { ...state, deck, hands, balance: newBalance, lastFeedback: feedback };
    newState = checkAndAdvance(newState);

    if (newState.phase === "dealer-turn") {
      set({ ...newState, phase: "dealer-turn" });
      playDealerAnimated(set, get);
      return;
    }

    set(newState);
  },

  newRound: () => {
    const state = get();
    const balance = getBalance();
    set({
      ...initialState(),
      deck: state.deck.length < 20 ? createDeck() : state.deck,
      balance,
      currentBet: Math.min(state.currentBet, balance),
      numHands: state.numHands,
    });
  },

  setBet: (amount: number) => {
    const balance = getBalance();
    const bet = Math.max(10, Math.min(amount, balance));
    set({ currentBet: bet, balance });
    persistBet(bet);
  },

  setNumHands: (n: number) => {
    if (n < 1 || n > 3) return;
    set({ numHands: n });
    persistNumHands(n);
  },

  reset: () => {
    set(initialState());
  },
}));
