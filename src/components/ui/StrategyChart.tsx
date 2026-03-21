"use client";

import { useState } from "react";
import { useGameStore } from "@/engine/store";
import {
  getHardChart,
  getSoftChart,
  getPairChart,
  DEALER_HEADERS,
  type ChartRow,
  type ChartAction,
} from "@/engine/strategy";
import { handValue, isSoft, cardValue, canSplit } from "@/engine/types";

const ACTION_COLORS: Record<ChartAction, string> = {
  H: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  S: "bg-red-500/15 text-red-700 dark:text-red-400",
  D: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  P: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const ACTION_LABELS: Record<ChartAction, string> = {
  H: "Hit",
  S: "Stand",
  D: "Double",
  P: "Split",
};

type TableType = "hard" | "soft" | "pairs";

function useActiveCell(): {
  table: TableType | null;
  rowLabel: string | null;
  dealerIdx: number | null;
} {
  const { phase, hands, activeHandIndex, dealer } = useGameStore();

  if (phase !== "playing" || hands.length === 0)
    return { table: null, rowLabel: null, dealerIdx: null };

  const hand = hands[activeHandIndex];
  if (!hand || hand.cards.length < 2) return { table: null, rowLabel: null, dealerIdx: null };

  const dealerUp = dealer.cards[0];
  if (!dealerUp) return { table: null, rowLabel: null, dealerIdx: null };

  const dVal = cardValue(dealerUp);
  // dealerIdx: 2→0, 3→1, ... 10→8, 11(A)→9
  const dealerIdx = dVal === 11 ? 9 : dVal - 2;

  // Check pairs
  if (
    hand.cards.length === 2 &&
    cardValue(hand.cards[0]) === cardValue(hand.cards[1])
  ) {
    const pVal = cardValue(hand.cards[0]);
    const pairLabels = ["2,2", "3,3", "4,4", "5,5", "6,6", "7,7", "8,8", "9,9", "10,10", "A,A"];
    const pairVals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const idx = pairVals.indexOf(pVal);
    if (idx !== -1) {
      return { table: "pairs", rowLabel: pairLabels[idx], dealerIdx };
    }
  }

  // Check soft
  if (isSoft(hand.cards)) {
    const val = handValue(hand.cards);
    return { table: "soft", rowLabel: `A,${val - 11}`, dealerIdx };
  }

  // Hard
  const val = handValue(hand.cards);
  return { table: "hard", rowLabel: `${val}`, dealerIdx };
}

function MiniTable({
  title,
  rows,
  tableType,
  activeCell,
}: {
  title: string;
  rows: ChartRow[];
  tableType: TableType;
  activeCell: { table: TableType | null; rowLabel: string | null; dealerIdx: number | null };
}) {
  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
        {title}
      </h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[340px]">
          <thead>
            <tr>
              <th className="p-1 sm:p-1.5 text-left text-muted font-medium w-12 sm:w-14"></th>
              {DEALER_HEADERS.map((h) => (
                <th key={h} className="p-1 sm:p-1.5 text-center text-muted font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border/50">
                <td className="p-1 sm:p-1.5 font-semibold text-foreground whitespace-nowrap">
                  {row.label}
                </td>
                {row.cells.map((cell, ci) => {
                  const isHighlight =
                    activeCell.table === tableType &&
                    activeCell.rowLabel === row.label &&
                    activeCell.dealerIdx === ci;

                  return (
                    <td
                      key={ci}
                      className={`p-1 sm:p-1.5 text-center font-semibold rounded-sm transition-all duration-200 ${
                        ACTION_COLORS[cell]
                      } ${isHighlight ? "ring-2 ring-foreground scale-110" : ""}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StrategyChart() {
  const [open, setOpen] = useState(false);
  const activeCell = useActiveCell();

  const hardRows = getHardChart();
  const softRows = getSoftChart();
  const pairRows = getPairChart();

  return (
    <div className="w-full border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 sm:py-4 px-4 text-xs sm:text-sm font-medium uppercase tracking-widest text-muted hover:text-foreground transition-colors"
      >
        <span>Strategy Chart</span>
        <span
          className={`transition-transform duration-200 text-base ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-6 space-y-6 animate-in">
          {/* Legend */}
          <div className="flex gap-3 sm:gap-4 flex-wrap">
            {(Object.entries(ACTION_LABELS) as [ChartAction, string][]).map(
              ([code, label]) => (
                <div key={code} className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-sm text-[10px] font-bold ${ACTION_COLORS[code]}`}
                  >
                    {code}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted">{label}</span>
                </div>
              )
            )}
          </div>

          <MiniTable
            title="Hard Totals"
            rows={hardRows}
            tableType="hard"
            activeCell={activeCell}
          />
          <MiniTable
            title="Soft Totals"
            rows={softRows}
            tableType="soft"
            activeCell={activeCell}
          />
          <MiniTable
            title="Pairs"
            rows={pairRows}
            tableType="pairs"
            activeCell={activeCell}
          />
        </div>
      )}
    </div>
  );
}
