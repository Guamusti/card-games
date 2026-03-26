import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────

export interface BlindLevel {
  small: number;
  big: number;
  duration: number; // hands per level
}

export interface TournamentPlayer {
  id: string;
  name: string;
  chips: number;
  eliminated: boolean;
  placement: number; // 0 = still playing
}

export interface TournamentState {
  isTournament: boolean;
  startingChips: number;
  blindLevels: BlindLevel[];
  currentLevel: number;
  handsAtLevel: number;
  handsPlayed: number;
  players: TournamentPlayer[];
  totalPlayers: number;
  playersRemaining: number;
  playerPlacement: number; // 0 = still playing, 1-6 = final position
  tournamentOver: boolean;
}

interface TournamentActions {
  startTournament: (playerNames: { id: string; name: string }[]) => void;
  advanceBlinds: () => void;
  eliminatePlayer: (id: string) => void;
  endTournament: () => void;
  getCurrentBlinds: () => { small: number; big: number };
}

export type TournamentStore = TournamentState & TournamentActions;

// ─── Default blind structure ─────────────────────────────

const DEFAULT_BLIND_LEVELS: BlindLevel[] = [
  { small: 10, big: 20, duration: 8 },
  { small: 15, big: 30, duration: 8 },
  { small: 25, big: 50, duration: 8 },
  { small: 50, big: 100, duration: 8 },
  { small: 75, big: 150, duration: 8 },
  { small: 100, big: 200, duration: 8 },
  { small: 150, big: 300, duration: 8 },
  { small: 200, big: 400, duration: 8 },
  { small: 300, big: 600, duration: 8 },
  { small: 500, big: 1000, duration: 8 },
];

const DEFAULT_STARTING_CHIPS = 1500;

const STORAGE_KEY = "card-trainer-poker-tournament";

// ─── SSR-safe persistence ────────────────────────────────

function loadFromStorage(): Partial<TournamentState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<TournamentState>;
  } catch {
    return null;
  }
}

function saveToStorage(state: TournamentState) {
  if (typeof window === "undefined") return;
  try {
    const { isTournament, startingChips, currentLevel, handsAtLevel, handsPlayed, players, totalPlayers, playersRemaining, playerPlacement, tournamentOver } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isTournament, startingChips, currentLevel, handsAtLevel, handsPlayed,
      players, totalPlayers, playersRemaining, playerPlacement, tournamentOver,
    }));
  } catch {
    // ignore
  }
}

function initialState(): TournamentState {
  const saved = loadFromStorage();
  if (saved && saved.isTournament) {
    return {
      isTournament: true,
      startingChips: saved.startingChips ?? DEFAULT_STARTING_CHIPS,
      blindLevels: DEFAULT_BLIND_LEVELS,
      currentLevel: saved.currentLevel ?? 0,
      handsAtLevel: saved.handsAtLevel ?? 0,
      handsPlayed: saved.handsPlayed ?? 0,
      players: saved.players ?? [],
      totalPlayers: saved.totalPlayers ?? 6,
      playersRemaining: saved.playersRemaining ?? 6,
      playerPlacement: saved.playerPlacement ?? 0,
      tournamentOver: saved.tournamentOver ?? false,
    };
  }
  return {
    isTournament: false,
    startingChips: DEFAULT_STARTING_CHIPS,
    blindLevels: DEFAULT_BLIND_LEVELS,
    currentLevel: 0,
    handsAtLevel: 0,
    handsPlayed: 0,
    players: [],
    totalPlayers: 6,
    playersRemaining: 6,
    playerPlacement: 0,
    tournamentOver: false,
  };
}

// ─── Store ──────────────────────────────────────────────

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  ...initialState(),

  startTournament: (playerNames) => {
    const players: TournamentPlayer[] = playerNames.map((p) => ({
      id: p.id,
      name: p.name,
      chips: DEFAULT_STARTING_CHIPS,
      eliminated: false,
      placement: 0,
    }));

    const newState: TournamentState = {
      isTournament: true,
      startingChips: DEFAULT_STARTING_CHIPS,
      blindLevels: DEFAULT_BLIND_LEVELS,
      currentLevel: 0,
      handsAtLevel: 0,
      handsPlayed: 0,
      players,
      totalPlayers: players.length,
      playersRemaining: players.length,
      playerPlacement: 0,
      tournamentOver: false,
    };

    set(newState);
    saveToStorage(newState);
  },

  advanceBlinds: () => {
    const state = get();
    if (!state.isTournament || state.tournamentOver) return;

    const handsAtLevel = state.handsAtLevel + 1;
    const handsPlayed = state.handsPlayed + 1;
    const level = state.blindLevels[state.currentLevel];
    let currentLevel = state.currentLevel;

    if (handsAtLevel >= level.duration && currentLevel < state.blindLevels.length - 1) {
      currentLevel++;
      const newState = { ...state, currentLevel, handsAtLevel: 0, handsPlayed };
      set(newState);
      saveToStorage(newState as TournamentState);
    } else {
      const newState = { ...state, handsAtLevel, handsPlayed };
      set(newState);
      saveToStorage(newState as TournamentState);
    }
  },

  eliminatePlayer: (id: string) => {
    const state = get();
    if (!state.isTournament) return;

    const remaining = state.playersRemaining;
    const placement = remaining; // e.g., 6 players left => eliminated player gets 6th

    const players = state.players.map((p) =>
      p.id === id ? { ...p, eliminated: true, placement, chips: 0 } : p
    );

    const playersRemaining = remaining - 1;
    const isHumanEliminated = id === "player";
    const playerPlacement = isHumanEliminated ? placement : state.playerPlacement;

    // Check if tournament is over (1 player left)
    const tournamentOver = playersRemaining <= 1 || isHumanEliminated;

    // If tournament over, assign 1st place to last standing
    if (playersRemaining === 1) {
      const winner = players.find((p) => !p.eliminated);
      if (winner) {
        winner.placement = 1;
        if (winner.id === "player") {
          const newState: TournamentState = {
            ...state,
            players,
            playersRemaining,
            playerPlacement: 1,
            tournamentOver: true,
          };
          set(newState);
          saveToStorage(newState);
          return;
        }
      }
    }

    const newState: TournamentState = {
      ...state,
      players,
      playersRemaining,
      playerPlacement,
      tournamentOver,
    };
    set(newState);
    saveToStorage(newState);
  },

  endTournament: () => {
    const newState = {
      isTournament: false,
      startingChips: DEFAULT_STARTING_CHIPS,
      blindLevels: DEFAULT_BLIND_LEVELS,
      currentLevel: 0,
      handsAtLevel: 0,
      handsPlayed: 0,
      players: [],
      totalPlayers: 6,
      playersRemaining: 6,
      playerPlacement: 0,
      tournamentOver: false,
    };
    set(newState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  getCurrentBlinds: () => {
    const state = get();
    const level = state.blindLevels[state.currentLevel];
    return { small: level.small, big: level.big };
  },
}));
