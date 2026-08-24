"use client";

import { create } from "zustand";
import type { VacaPoints, BestOf, BotSpeed } from "@/engine/mus/types";

export type CardBack =
  | "classic"
  | "geometric"
  | "stripes"
  | "diamonds"
  | "waves"
  | "minimal"
  | "crosshatch"
  | "dots"
  | "noir"
  | "slate"
  | "line"
  | "shadow";

export type AccentColor = "red" | "blue" | "purple" | "emerald" | "amber" | "rose";

export type TableFelt = "none" | "subtle" | "green" | "blue" | "wine";

export type SuitColorScheme = "classic" | "four-color" | "blue-red" | "mono" | "tokyo";
export type MusDeckTheme = "tradicional" | "classic" | "minimal" | "neon" | "silueta";

export const PLAYER_AVATARS = ["🐶", "🐱", "🐻", "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🦄", "🐲"] as const;
export type PlayerAvatar = (typeof PLAYER_AVATARS)[number];

// Items that are free by default
export const FREE_AVATARS: PlayerAvatar[] = ["🐶", "🐱", "🐻"];
export const FREE_CARD_BACKS: CardBack[] = ["classic", "minimal", "noir"];
export const FREE_TABLE_FELTS: TableFelt[] = ["none", "subtle"];

// Prices for cosmetics (in coins)
export const AVATAR_PRICE = 2000;
export const CARD_BACK_PRICE = 3000;
export const TABLE_FELT_PRICE = 2500;
export const ACCENT_COLOR_PRICE = 1500;
export const SUIT_COLOR_PRICE = 2000;

export type AIDifficulty = "easy" | "normal" | "hard" | "imposible";

export interface CustomizeState {
  cardBack: CardBack;
  accentColor: AccentColor;
  tableFelt: TableFelt;
  animationSpeed: "slow" | "normal" | "fast";
  showCardShadow: boolean;
  hapticFeedback: boolean;
  suitColors: SuitColorScheme;
  playerAvatar: PlayerAvatar;
  // Gameplay preferences
  nickname: string;
  /** Public handle used to find a player in online Mus. */
  username: string;
  musDeckTheme: MusDeckTheme;
  // Mus default ruleset (pre-fills new games)
  musDefaultVaca: VacaPoints;
  musDefaultBestOf: BestOf;
  musBotSpeed: BotSpeed;
  friends: string[];
  autoDealDelay: number; // 0 = off, 1-5 seconds
  showProbabilities: boolean;
  aiDifficulty: AIDifficulty;
  // Owned items
  ownedAvatars: PlayerAvatar[];
  ownedCardBacks: CardBack[];
  ownedTableFelts: TableFelt[];
  ownedAccentColors: AccentColor[];
  ownedSuitColors: SuitColorScheme[];
}

interface CustomizeActions {
  setCardBack: (back: CardBack) => void;
  setAccentColor: (color: AccentColor) => void;
  setTableFelt: (felt: TableFelt) => void;
  setAnimationSpeed: (speed: "slow" | "normal" | "fast") => void;
  setShowCardShadow: (show: boolean) => void;
  setHapticFeedback: (on: boolean) => void;
  setSuitColors: (scheme: SuitColorScheme) => void;
  setPlayerAvatar: (avatar: PlayerAvatar) => void;
  setNickname: (name: string) => void;
  setUsername: (username: string) => void;
  setMusDeckTheme: (theme: MusDeckTheme) => void;
  setMusDefaultVaca: (v: VacaPoints) => void;
  setMusDefaultBestOf: (b: BestOf) => void;
  setMusBotSpeed: (s: BotSpeed) => void;
  addFriend: (username: string) => void;
  removeFriend: (username: string) => void;
  setAutoDealDelay: (seconds: number) => void;
  setShowProbabilities: (show: boolean) => void;
  setAiDifficulty: (d: AIDifficulty) => void;
  // Purchase actions
  unlockAvatar: (avatar: PlayerAvatar) => void;
  unlockCardBack: (back: CardBack) => void;
  unlockTableFelt: (felt: TableFelt) => void;
  unlockAccentColor: (color: AccentColor) => void;
  unlockSuitColor: (scheme: SuitColorScheme) => void;
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
  hapticFeedback: true,
  suitColors: "classic",
  playerAvatar: "🐶",
  nickname: "",
  username: "",
  musDeckTheme: "tradicional",
  musDefaultVaca: 30,
  musDefaultBestOf: 3,
  musBotSpeed: "normal",
  friends: [],
  autoDealDelay: 0,
  showProbabilities: true,
  aiDifficulty: "normal",
  ownedAvatars: [...FREE_AVATARS],
  ownedCardBacks: [...FREE_CARD_BACKS],
  ownedTableFelts: [...FREE_TABLE_FELTS],
  ownedAccentColors: ["red"],
  ownedSuitColors: ["classic"],
};

export const useCustomizeStore = create<CustomizeStore>((set, get) => {
  const loaded = loadState();
  // Ensure free items are always owned
  const initialOwned = {
    ownedAvatars: [...new Set([...FREE_AVATARS, ...(loaded.ownedAvatars || [])])],
    ownedCardBacks: [...new Set([...FREE_CARD_BACKS, ...(loaded.ownedCardBacks || [])])],
    ownedTableFelts: [...new Set([...FREE_TABLE_FELTS, ...(loaded.ownedTableFelts || [])])],
    ownedAccentColors: [...new Set(["red" as AccentColor, ...(loaded.ownedAccentColors || [])])],
    ownedSuitColors: [...new Set(["classic" as SuitColorScheme, ...(loaded.ownedSuitColors || [])])],
  };

  return {
    ...defaults,
    ...loaded,
    ...initialOwned,

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
    setHapticFeedback: (hapticFeedback) => {
      set({ hapticFeedback });
      saveState({ ...get(), hapticFeedback });
    },
    setSuitColors: (suitColors) => {
      set({ suitColors });
      saveState({ ...get(), suitColors });
    },
    setPlayerAvatar: (playerAvatar) => {
      set({ playerAvatar });
      saveState({ ...get(), playerAvatar });
    },
    setNickname: (nickname) => {
      set({ nickname });
      saveState({ ...get(), nickname });
    },
    setUsername: (username) => {
      set({ username });
      saveState({ ...get(), username });
    },
    setMusDeckTheme: (musDeckTheme) => {
      set({ musDeckTheme });
      saveState({ ...get(), musDeckTheme });
    },
    setMusDefaultVaca: (musDefaultVaca) => {
      set({ musDefaultVaca });
      saveState({ ...get(), musDefaultVaca });
    },
    setMusDefaultBestOf: (musDefaultBestOf) => {
      set({ musDefaultBestOf });
      saveState({ ...get(), musDefaultBestOf });
    },
    setMusBotSpeed: (musBotSpeed) => {
      set({ musBotSpeed });
      saveState({ ...get(), musBotSpeed });
    },
    addFriend: (username) => {
      const friend = username.toLowerCase().trim();
      if (!friend || get().friends.includes(friend)) return;
      const friends = [...get().friends, friend]; set({ friends }); saveState({ ...get(), friends });
    },
    removeFriend: (username) => {
      const friends = get().friends.filter((friend) => friend !== username); set({ friends }); saveState({ ...get(), friends });
    },
    setAutoDealDelay: (autoDealDelay) => {
      set({ autoDealDelay });
      saveState({ ...get(), autoDealDelay });
    },
    setShowProbabilities: (showProbabilities) => {
      set({ showProbabilities });
      saveState({ ...get(), showProbabilities });
    },
    setAiDifficulty: (aiDifficulty) => {
      set({ aiDifficulty });
      saveState({ ...get(), aiDifficulty });
    },
    unlockAvatar: (avatar) => {
      const owned = [...get().ownedAvatars, avatar];
      set({ ownedAvatars: owned });
      saveState({ ...get(), ownedAvatars: owned });
    },
    unlockCardBack: (back) => {
      const owned = [...get().ownedCardBacks, back];
      set({ ownedCardBacks: owned });
      saveState({ ...get(), ownedCardBacks: owned });
    },
    unlockTableFelt: (felt) => {
      const owned = [...get().ownedTableFelts, felt];
      set({ ownedTableFelts: owned });
      saveState({ ...get(), ownedTableFelts: owned });
    },
    unlockAccentColor: (color) => {
      const owned = [...get().ownedAccentColors, color];
      set({ ownedAccentColors: owned });
      saveState({ ...get(), ownedAccentColors: owned });
    },
    unlockSuitColor: (scheme) => {
      const owned = [...get().ownedSuitColors, scheme];
      set({ ownedSuitColors: owned });
      saveState({ ...get(), ownedSuitColors: owned });
    },
  };
});
