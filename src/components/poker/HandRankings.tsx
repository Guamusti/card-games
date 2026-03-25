"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { suitColor } from "@/engine/types";
import { usePokerStore } from "@/engine/poker/store";
import { evaluateHand } from "@/engine/poker/evaluator";
import type { HandRank } from "@/engine/poker/types";

const RANKINGS: { name: string; rank: HandRank; desc: string; cards: string; suits: string }[] = [
  { name: "Royal Flush", rank: "royal-flush", desc: "Highest-ranking straight flush", cards: "A K Q J 10", suits: "♥♥♥♥♥" },
  { name: "Straight Flush", rank: "straight-flush", desc: "5 same-suit cards in sequence", cards: "J 10 9 8 7", suits: "♣♣♣♣♣" },
  { name: "Four of a Kind", rank: "four-of-a-kind", desc: "4 cards of the same rank", cards: "8 8 8 8 6", suits: "♠♥♣♦♠" },
  { name: "Full House", rank: "full-house", desc: "Three of a kind with a pair", cards: "A A A 10 10", suits: "♥♣♦♦♣" },
  { name: "Flush", rank: "flush", desc: "5 cards of the same suit", cards: "K J 9 8 2", suits: "♠♠♠♠♠" },
  { name: "Straight", rank: "straight", desc: "5 cards in sequence", cards: "10 9 8 7 6", suits: "♣♦♠♥♣" },
  { name: "Three of a Kind", rank: "three-of-a-kind", desc: "3 cards of the same rank", cards: "7 7 7 K J", suits: "♠♥♣♥♣" },
  { name: "Two Pair", rank: "two-pair", desc: "2 cards of the same rank twice", cards: "J J 4 4 Q", suits: "♦♣♦♣♠" },
  { name: "Pair", rank: "pair", desc: "2 cards of the same rank", cards: "K K 9 2 10", suits: "♣♦♠♠♣" },
  { name: "High Card", rank: "high-card", desc: "Highest-ranking card", cards: "A 7 3 9 2", suits: "♣♠♥♠♣" },
];

function useCurrentHandRank(): HandRank | null {
  const { players, community, phase } = usePokerStore();
  const player = players.find((p) => p.isHuman);
  if (!player || player.cards.length < 2) return null;
  if (phase === "betting" || phase === "dealing") return null;

  const revealedCount = phase === "preflop" ? 0 : phase === "flop" ? 3 : phase === "turn" ? 4 : 5;
  const visibleCommunity = community.slice(0, revealedCount);

  // Preflop: just use hole cards for pair detection
  const allCards = [...player.cards, ...visibleCommunity];
  if (allCards.length < 2) return null;

  try {
    const result = evaluateHand(player.cards, visibleCommunity);
    return result.rank;
  } catch {
    return null;
  }
}

export default function HandRankings({
  externalOpen,
  onClose,
}: {
  externalOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const currentRank = useCurrentHandRank();

  const open = externalOpen ?? internalOpen;
  const close = () => {
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <>
      {externalOpen === undefined && (
        <button
          onClick={() => setInternalOpen(true)}
          className="text-xs sm:text-sm text-muted hover:text-foreground transition-colors uppercase tracking-widest"
        >
          Hand Rankings
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onPointerDown={close}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[85vh] bg-background border-t border-border rounded-t-2xl sm:rounded-2xl sm:border overflow-y-auto safe-bottom"
            >
              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors z-10"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <h2 className="text-lg sm:text-xl font-medium text-center pb-4">
                Hand rankings
              </h2>

              <div className="flex flex-col gap-3 px-4 pb-6">
                {RANKINGS.map((r) => {
                  const cards = r.cards.split(" ");
                  const suits = r.suits.split("");
                  const isActive = currentRank === r.rank;
                  return (
                    <div
                      key={r.name}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        isActive
                          ? "bg-correct/10 border border-correct/30 ring-1 ring-correct/20"
                          : "border border-transparent"
                      }`}
                    >
                      {/* Mini cards */}
                      <div className="flex gap-0.5 shrink-0">
                        {cards.map((card, i) => (
                          <div
                            key={i}
                            className="w-7 h-9 sm:w-8 sm:h-10 rounded bg-surface border border-border/50 flex flex-col items-center justify-center text-[8px] sm:text-[9px] leading-tight"
                            style={{ color: suitColor(suits[i]) }}
                          >
                            <span className="font-semibold">
                              {card}
                            </span>
                            <span>
                              {suits[i]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Name + desc */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? "text-correct" : ""}`}>
                          {r.name}
                          {isActive && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-correct">
                              ← You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
