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

function playDealer(state: GameState): GameState {
  let { deck, dealer } = state;
  dealer = { ...dealer, hidden: false };
  let dealerCards = [...dealer.cards];

  while (handValue(dealerCards) < 17) {
    const { card, deck: remaining } = draw(deck);
    dealerCards.push(card);
    deck = remaining;
  }

  return {
    ...state,
    deck,
    dealer: { cards: dealerCards, hidden: false },
  };
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
      // BJ pays 3:2 — bet was already deducted, so return bet + bet*1.5
      balance += hand.bet + hand.bet * 1.5;
    } else if (dealerBJ && !playerBJ) {
      result = "lose";
    } else if (dealerBust) {
      result = "win";
      // Win pays 1:1 — return bet + winnings
      balance += hand.bet * 2;
    } else if (playerVal > dealerVal) {
      result = "win";
      balance += hand.bet * 2;
    } else if (playerVal < dealerVal) {
      result = "lose";
    } else {
      result = "push";
      // Push — return the original bet
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
    const DELAY = 300; // ms between each card

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
        newState = playDealer(newState);
        newState = settleHands(newState);
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
      newState = playDealer(newState);
      newState = settleHands(newState);
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

    let newState: GameState;
    if (nextIdx < hands.length) {
      newState = {
        ...state,
        hands,
        activeHandIndex: nextIdx,
        lastFeedback: feedback,
      };
    } else {
      newState = { ...state, hands, phase: "dealer-turn", lastFeedback: feedback };
      newState = playDealer(newState);
      newState = settleHands(newState);
    }

    set(newState);
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

    const newBalance = state.balance - hand.bet; // deduct the extra bet

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
    } else {
      newState.phase = "dealer-turn";
      newState = playDealer(newState);
      newState = settleHands(newState);
    }

    set(newState);
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

    // Draw one card for each new hand
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

    const newBalance = state.balance - hand.bet; // deduct the extra bet

    let newState: GameState = {
      ...state,
      deck,
      hands,
      balance: newBalance,
      lastFeedback: feedback,
    };

    newState = checkAndAdvance(newState);

    if (newState.phase === "dealer-turn") {
      newState = playDealer(newState);
      newState = settleHands(newState);
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
