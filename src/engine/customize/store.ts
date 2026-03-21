"use client";

import { create } from "zustand";

export type CardBack =
  | "classic"
  | "geometric"
  | "stripes"
  | "diamonds"
  | "waves"
  | "minimal"
  | "crosshatch"
  | "dots";

export type AccentColor = "red" | "blue" | "purple" | "emerald" | "amber" | "rose";

export type TableFelt = "none" | "subtle" | "green" | "blue" | "wine";

export interface CustomizeState {
  cardBack: CardBack;
  accentColor: AccentColor;
  tableFelt: TableFelt;
  animationSpeed: "slow" | "normal" | "fast";
  showCardShadow: boolean;
}

interface CustomizeActions {
  setCardBack: (back: CardBack) => void;
  setAccentColor: (color: AccentColor) => void;
  setTableFelt: (felt: TableFelt) => void;
  setAnimationSpeed: (speed: "slow" | "normal" | "fast") => void;
  setShowCardShadow: (show: boolean) => void;
}

export type CustomizeStore = CustomizeState & CustomizeActions;

const STORAGE_KEY = "card-trainer-customize";

function loadState(): Partial<CustomizeState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveState(state: CustomizeState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const defaults: CustomizeState = {
  cardBack: "classic",
  accentColor: "red",
  tableFelt: "none",
  animationSpeed: "normal",
  showCardShadow: true,
};

export const useCustomizeStore = create<CustomizeStore>((set, get) => ({
  ...defaults,
  ...loadState(),

  setCardBack: (cardBack) => {
    set({ cardBack });
    saveState({ ...get(), cardBack });
  },
  setAccentColor: (accentColor) => {
    set({ accentColor });
    saveState({ ...get(), accentColor });
  },
  setTableFelt: (tableFelt) => {
    set({ tableFelt });
    saveState({ ...get(), tableFelt });
  },
  setAnimationSpeed: (animationSpeed) => {
    set({ animationSpeed });
    saveState({ ...get(), animationSpeed });
  },
  setShowCardShadow: (showCardShadow) => {
    set({ showCardShadow });
    saveState({ ...get(), showCardShadow });
  },
}));
