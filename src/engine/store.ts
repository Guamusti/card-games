"use client";

import { create } from "zustand";
import type { GameState, GamePhase, Action, Hand, StrategyFeedback, Card } from "./types";
import { handValue, isBlackjack, canSplit } from "./types";
import { createDeck, drawCard } from "./deck";
import { getOptimalAction } from "./strategy";

const INITIAL_BALANCE = 10000;
const DEFAULT_BET = 100;

function initialState(): GameState {
  return {
    deck: createDeck(),
    dealer: { cards: [], hidden: true },
    hands: [],
    activeHandIndex: 0,
    phase: "betting",
    balance: INITIAL_BALANCE,
    currentBet: DEFAULT_BET,
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
  reset: () => void;
}

export type GameStore = GameState & GameActions;

function draw(deck: Card[]): { card: Card; deck: Card[] } {
  const [card, remaining] = drawCard(deck);
  return { card, deck: remaining };
}

function checkAndAdvance(state: GameState): GameState {
  const hand = state.hands[state.activeHandIndex];
  if (!hand) return state;

  // If hand busts or has 21, auto-stand
  const val = handValue(hand.cards);
  if (val >= 21 || hand.isDoubled) {
    const updatedHands = [...state.hands];
    updatedHands[state.activeHandIndex] = { ...hand, isStanding: true };

    // Move to next hand or dealer turn
    const nextIdx = state.activeHandIndex + 1;
    if (nextIdx < state.hands.length) {
      return {
        ...state,
        hands: updatedHands,
        activeHandIndex: nextIdx,
      };
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

  return { ...state, hands, balance, phase: "settled" };
}

function getFeedback(
  action: Action,
  hand: Hand,
  dealerUpcard: Card,
  canDouble: boolean,
  canSplitHand: boolean
): StrategyFeedback {
  const optimal = getOptimalAction(hand.cards, dealerUpcard, canDouble, canSplitHand);
  return {
    playerAction: action,
    correctAction: optimal,
    isCorrect: action === optimal,
  };
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
      // Done drawing, settle
      const settled = settleHands({ ...state, dealer: { cards: dealerCards, hidden: false } });
      set(settled);
      return;
    }

    // Draw one card
    const { card, deck } = draw(state.deck);
    const newCards = [...dealerCards, card];
    set({
      deck,
      dealer: { cards: newCards, hidden: false },
    });

    // Check if dealer needs more
    if (handValue(newCards) < 17) {
      setTimeout(step, CARD_DELAY);
    } else {
      // Final settle after a brief pause
      setTimeout(() => {
        const finalState = get();
        const settled = settleHands(finalState);
        set(settled);
      }, CARD_DELAY);
    }
  };

  // First, reveal hidden card
  const state = get();
  set({ dealer: { cards: state.dealer.cards, hidden: false }, phase: "dealer-turn" });

  // After revealing, start drawing
  setTimeout(step, CARD_DELAY);
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  deal: () => {
    const state = get();
    if (state.phase !== "betting") return;

    let deck = state.deck.length < 20 ? createDeck() : [...state.deck];

    // Draw all 4 cards upfront
    const d1 = draw(deck); deck = d1.deck;
    const p1 = draw(deck); deck = p1.deck;
    const d2 = draw(deck); deck = d2.deck;
    const p2 = draw(deck); deck = p2.deck;

    const newBalance = state.balance - state.currentBet;
    const DELAY = 350;

    // Step 1: empty table, dealing phase
    set({
      ...state,
      deck,
      dealer: { cards: [], hidden: true },
      hands: [{ cards: [], bet: state.currentBet, isDoubled: false, isStanding: false }],
      activeHandIndex: 0,
      phase: "dealing" as GamePhase,
      balance: newBalance,
      lastFeedback: null,
    });

    // Step 2: dealer card 1
    setTimeout(() => {
      const s = get();
      set({ ...s, dealer: { ...s.dealer, cards: [d1.card] } });
    }, DELAY);

    // Step 3: player card 1
    setTimeout(() => {
      const s = get();
      const hands = [...s.hands];
      hands[0] = { ...hands[0], cards: [p1.card] };
      set({ ...s, hands });
    }, DELAY * 2);

    // Step 4: dealer card 2 (hidden)
    setTimeout(() => {
      const s = get();
      set({ ...s, dealer: { cards: [d1.card, d2.card], hidden: true } });
    }, DELAY * 3);

    // Step 5: player card 2, then transition to playing
    setTimeout(() => {
      const s = get();
      const hand: Hand = {
        cards: [p1.card, p2.card],
        bet: state.currentBet,
        isDoubled: false,
        isStanding: false,
      };

      let newState: GameState = {
        ...s,
        hands: [hand],
        phase: "playing",
      };

      // Check for player blackjack
      if (isBlackjack(hand.cards)) {
        // Use animated dealer play
        set({ ...newState });
        playDealerAnimated(set, get);
        return;
      }

      set(newState);
    }, DELAY * 4);
  },

  hit: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const feedback = getFeedback(
      "hit",
      state.hands[state.activeHandIndex],
      state.dealer.cards[0],
      state.hands[state.activeHandIndex].cards.length === 2,
      canSplit(state.hands[state.activeHandIndex])
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

    const feedback = getFeedback(
      "stand",
      state.hands[state.activeHandIndex],
      state.dealer.cards[0],
      state.hands[state.activeHandIndex].cards.length === 2,
      canSplit(state.hands[state.activeHandIndex])
    );

    const hands = [...state.hands];
    hands[state.activeHandIndex] = {
      ...hands[state.activeHandIndex],
      isStanding: true,
    };

    const nextIdx = state.activeHandIndex + 1;

    if (nextIdx < hands.length) {
      set({
        ...state,
        hands,
        activeHandIndex: nextIdx,
        lastFeedback: feedback,
      });
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

    const feedback = getFeedback(
      "double",
      hand,
      state.dealer.cards[0],
      true,
      canSplit(hand)
    );

    const { card, deck } = draw(state.deck);
    const hands = [...state.hands];
    hands[state.activeHandIndex] = {
      ...hand,
      cards: [...hand.cards, card],
      bet: hand.bet * 2,
      isDoubled: true,
      isStanding: true,
    };

    const newBalance = state.balance - hand.bet;

    let newState: GameState = {
      ...state,
      deck,
      hands,
      balance: newBalance,
      lastFeedback: feedback,
    };

    const nextIdx = state.activeHandIndex + 1;
    if (nextIdx < hands.length) {
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

    const feedback = getFeedback(
      "split",
      hand,
      state.dealer.cards[0],
      true,
      true
    );

    let deck = state.deck;

    const draw1 = draw(deck);
    deck = draw1.deck;
    const draw2 = draw(deck);
    deck = draw2.deck;

    const hand1: Hand = {
      cards: [hand.cards[0], draw1.card],
      bet: hand.bet,
      isDoubled: false,
      isStanding: false,
    };

    const hand2: Hand = {
      cards: [hand.cards[1], draw2.card],
      bet: hand.bet,
      isDoubled: false,
      isStanding: false,
    };

    const hands = [...state.hands];
    hands.splice(state.activeHandIndex, 1, hand1, hand2);

    const newBalance = state.balance - hand.bet;

    let newState: GameState = {
      ...state,
      deck,
      hands,
      balance: newBalance,
      lastFeedback: feedback,
    };

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
    set({
      ...initialState(),
      deck: state.deck.length < 20 ? createDeck() : state.deck,
      balance: state.balance,
      currentBet: state.currentBet,
    });
  },

  setBet: (amount: number) => {
    set({ currentBet: Math.max(10, Math.min(amount, get().balance)) });
  },

  reset: () => {
    set(initialState());
  },
}));
