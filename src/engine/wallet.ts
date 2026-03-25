"use client";

import { create } from "zustand";

const STORAGE_KEY = "card-trainer-wallet";
const INITIAL_BALANCE = 10000;

export interface WalletState {
  balance: number;
  gems: number;
}

interface WalletActions {
  getBalance: () => number;
  addChips: (amount: number) => void;
  removeChips: (amount: number) => boolean;
  setBalance: (amount: number) => void;
  addGems: (amount: number) => void;
  removeGems: (amount: number) => boolean;
  setGems: (amount: number) => void;
  rebuy: () => void;
}

export type WalletStore = WalletState & WalletActions;

function loadWallet(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        balance: typeof data.balance === "number" && data.balance > 0 ? data.balance : INITIAL_BALANCE,
        gems: typeof data.gems === "number" ? data.gems : 0,
      };
    }
  } catch { /* ignore */ }
  return { balance: INITIAL_BALANCE, gems: 0 };
}

function persistWallet(state: WalletState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  ...loadWallet(),

  getBalance: () => get().balance,

  addChips: (amount: number) => {
    const s = { balance: get().balance + amount, gems: get().gems };
    set({ balance: s.balance });
    persistWallet(s);
  },

  removeChips: (amount: number) => {
    const current = get().balance;
    if (current < amount) return false;
    const s = { balance: current - amount, gems: get().gems };
    set({ balance: s.balance });
    persistWallet(s);
    return true;
  },

  setBalance: (amount: number) => {
    const s = { balance: amount, gems: get().gems };
    set({ balance: amount });
    persistWallet(s);
  },

  addGems: (amount: number) => {
    const s = { balance: get().balance, gems: get().gems + amount };
    set({ gems: s.gems });
    persistWallet(s);
  },

  removeGems: (amount: number) => {
    const current = get().gems;
    if (current < amount) return false;
    const s = { balance: get().balance, gems: current - amount };
    set({ gems: s.gems });
    persistWallet(s);
    return true;
  },

  setGems: (amount: number) => {
    const s = { balance: get().balance, gems: amount };
    set({ gems: amount });
    persistWallet(s);
  },

  rebuy: () => {
    const s = { balance: INITIAL_BALANCE, gems: get().gems };
    set({ balance: INITIAL_BALANCE });
    persistWallet(s);
  },
}));
