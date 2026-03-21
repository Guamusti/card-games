import type { Card, Action } from "./types";
import { handValue, isSoft, cardValue } from "./types";

/**
 * Basic Strategy lookup — 6-deck, dealer stands on soft 17, DAS allowed.
 * Returns the mathematically optimal action.
 */

type StrategyTable = Record<string, Action>;

// Hard totals: key = "H{total}-{dealerUpcard}"
// Soft totals: key = "S{total}-{dealerUpcard}"
// Pairs: key = "P{cardValue}-{dealerUpcard}"

function dealerUp(card: Card): number {
  return cardValue(card);
}

// Returns dealer upcard index (2-11) for table lookup
function dIdx(upcard: Card): number {
  const v = cardValue(upcard);
  return v; // 2-11
}

const HARD: StrategyTable = {};
const SOFT: StrategyTable = {};
const PAIR: StrategyTable = {};

function init() {
  // Hard totals
  // 8 or less: always hit
  for (let d = 2; d <= 11; d++) {
    for (let t = 5; t <= 8; t++) HARD[`${t}-${d}`] = "hit";
  }

  // 9
  for (let d = 2; d <= 11; d++) {
    HARD[`9-${d}`] = d >= 3 && d <= 6 ? "double" : "hit";
  }

  // 10
  for (let d = 2; d <= 11; d++) {
    HARD[`10-${d}`] = d >= 2 && d <= 9 ? "double" : "hit";
  }

  // 11
  for (let d = 2; d <= 11; d++) {
    HARD[`11-${d}`] = "double";
  }

  // 12
  for (let d = 2; d <= 11; d++) {
    HARD[`12-${d}`] = d >= 4 && d <= 6 ? "stand" : "hit";
  }

  // 13-16: stand vs 2-6, hit vs 7+
  for (let t = 13; t <= 16; t++) {
    for (let d = 2; d <= 11; d++) {
      HARD[`${t}-${d}`] = d >= 2 && d <= 6 ? "stand" : "hit";
    }
  }

  // 17+: always stand
  for (let t = 17; t <= 21; t++) {
    for (let d = 2; d <= 11; d++) {
      HARD[`${t}-${d}`] = "stand";
    }
  }

  // Soft totals (S = soft total, e.g. A+6 = S17)
  // A,2 and A,3 (soft 13-14)
  for (let d = 2; d <= 11; d++) {
    SOFT[`13-${d}`] = d >= 5 && d <= 6 ? "double" : "hit";
    SOFT[`14-${d}`] = d >= 5 && d <= 6 ? "double" : "hit";
  }

  // A,4 and A,5 (soft 15-16)
  for (let d = 2; d <= 11; d++) {
    SOFT[`15-${d}`] = d >= 4 && d <= 6 ? "double" : "hit";
    SOFT[`16-${d}`] = d >= 4 && d <= 6 ? "double" : "hit";
  }

  // A,6 (soft 17)
  for (let d = 2; d <= 11; d++) {
    SOFT[`17-${d}`] = d >= 3 && d <= 6 ? "double" : "hit";
  }

  // A,7 (soft 18)
  for (let d = 2; d <= 11; d++) {
    if (d >= 3 && d <= 6) SOFT[`18-${d}`] = "double";
    else if (d >= 2 && d <= 8) SOFT[`18-${d}`] = "stand";
    else SOFT[`18-${d}`] = "hit";
  }

  // A,8 and A,9 (soft 19-20): always stand
  for (let d = 2; d <= 11; d++) {
    SOFT[`19-${d}`] = "stand";
    SOFT[`20-${d}`] = "stand";
    SOFT[`21-${d}`] = "stand";
  }

  // Pairs
  // 2,2 and 3,3
  for (let d = 2; d <= 11; d++) {
    PAIR[`2-${d}`] = d >= 2 && d <= 7 ? "split" : "hit";
    PAIR[`3-${d}`] = d >= 2 && d <= 7 ? "split" : "hit";
  }

  // 4,4
  for (let d = 2; d <= 11; d++) {
    PAIR[`4-${d}`] = d >= 5 && d <= 6 ? "split" : "hit";
  }

  // 5,5: never split, treat as 10
  for (let d = 2; d <= 11; d++) {
    PAIR[`5-${d}`] = d >= 2 && d <= 9 ? "double" : "hit";
  }

  // 6,6
  for (let d = 2; d <= 11; d++) {
    PAIR[`6-${d}`] = d >= 2 && d <= 6 ? "split" : "hit";
  }

  // 7,7
  for (let d = 2; d <= 11; d++) {
    PAIR[`7-${d}`] = d >= 2 && d <= 7 ? "split" : "hit";
  }

  // 8,8: always split
  for (let d = 2; d <= 11; d++) {
    PAIR[`8-${d}`] = "split";
  }

  // 9,9
  for (let d = 2; d <= 11; d++) {
    if (d === 7 || d === 10 || d === 11) PAIR[`9-${d}`] = "stand";
    else PAIR[`9-${d}`] = "split";
  }

  // 10,10: always stand
  for (let d = 2; d <= 11; d++) {
    PAIR[`10-${d}`] = "stand";
  }

  // A,A: always split
  for (let d = 2; d <= 11; d++) {
    PAIR[`11-${d}`] = "split";
  }
}

init();

// ── Exports for the Strategy Chart ──

export type ChartAction = "H" | "S" | "D" | "P";

const ACTION_SHORT: Record<Action, ChartAction> = {
  hit: "H",
  stand: "S",
  double: "D",
  split: "P",
};

export interface ChartRow {
  label: string;
  cells: ChartAction[]; // index 0 = dealer 2, … index 9 = dealer A
}

function buildRows(
  table: StrategyTable,
  prefix: string,
  rangeStart: number,
  rangeEnd: number,
  labelFn: (v: number) => string
): ChartRow[] {
  const rows: ChartRow[] = [];
  for (let t = rangeStart; t <= rangeEnd; t++) {
    const cells: ChartAction[] = [];
    const dealerOrder = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 11 = Ace
    for (const d of dealerOrder) {
      const key = `${t}-${d}`;
      const action = table[key] || "hit";
      cells.push(ACTION_SHORT[action]);
    }
    rows.push({ label: labelFn(t), cells });
  }
  return rows;
}

export const DEALER_HEADERS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

export function getHardChart(): ChartRow[] {
  return buildRows(HARD, "H", 5, 21, (v) => `${v}`);
}

export function getSoftChart(): ChartRow[] {
  return buildRows(SOFT, "S", 13, 21, (v) => `A,${v - 11}`);
}

export function getPairChart(): ChartRow[] {
  const dealerOrder = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const pairLabels = [
    { val: 2, label: "2,2" },
    { val: 3, label: "3,3" },
    { val: 4, label: "4,4" },
    { val: 5, label: "5,5" },
    { val: 6, label: "6,6" },
    { val: 7, label: "7,7" },
    { val: 8, label: "8,8" },
    { val: 9, label: "9,9" },
    { val: 10, label: "10,10" },
    { val: 11, label: "A,A" },
  ];
  return pairLabels.map(({ val, label }) => {
    const cells: ChartAction[] = dealerOrder.map((d) => {
      const key = `${val}-${d}`;
      return ACTION_SHORT[PAIR[key] || "hit"];
    });
    return { label, cells };
  });
}

export function getOptimalAction(
  playerCards: Card[],
  dealerUpcard: Card,
  canDoubleDown: boolean = true,
  canSplitHand: boolean = true
): Action {
  const dUp = dIdx(dealerUpcard);
  const pVal = handValue(playerCards);

  // Check pairs first
  if (
    canSplitHand &&
    playerCards.length === 2 &&
    cardValue(playerCards[0]) === cardValue(playerCards[1])
  ) {
    const pairKey = `${cardValue(playerCards[0])}-${dUp}`;
    const pairAction = PAIR[pairKey];
    if (pairAction === "split") return "split";
    // If pair table says don't split, fall through to hard/soft
  }

  // Check soft hands
  if (isSoft(playerCards)) {
    const softKey = `${pVal}-${dUp}`;
    const softAction = SOFT[softKey];
    if (softAction) {
      if (softAction === "double" && !canDoubleDown) return "hit";
      return softAction;
    }
  }

  // Hard totals
  const hardKey = `${pVal}-${dUp}`;
  const hardAction = HARD[hardKey];
  if (hardAction) {
    if (hardAction === "double" && !canDoubleDown) return "hit";
    return hardAction;
  }

  // Fallback
  return pVal >= 17 ? "stand" : "hit";
}
