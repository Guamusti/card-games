"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RANKINGS = [
  { name: "Royal Flush", desc: "Highest-ranking straight flush", cards: "A K Q J 10", suits: "♥♥♥♥♥" },
  { name: "Straight Flush", desc: "5 same-suit cards in sequence", cards: "J 10 9 8 7", suits: "♣♣♣♣♣" },
  { name: "Four of a Kind", desc: "4 cards of the same rank", cards: "8 8 8 8 6", suits: "♠♥♣♦♠" },
  { name: "Full House", desc: "Three of a kind with a pair", cards: "A A A 10 10", suits: "♥♣♦♦♣" },
  { name: "Flush", desc: "5 cards of the same suit", cards: "K J 9 8 2", suits: "♠♠♠♠♠" },
  { name: "Straight", desc: "5 cards in sequence", cards: "10 9 8 7 6", suits: "♣♦♠♥♣" },
  { name: "Three of a Kind", desc: "3 cards of the same rank", cards: "7 7 7 K J", suits: "♠♥♣♥♣" },
  { name: "Two Pair", desc: "2 cards of the same rank twice", cards: "J J 4 4 Q", suits: "♦♣♦♣♠" },
  { name: "Pair", desc: "2 cards of the same rank", cards: "K K 9 2 10", suits: "♣♦♠♠♣" },
  { name: "High Card", desc: "Highest-ranking card", cards: "A 7 3 9 2", suits: "♣♠♥♠♣" },
];

import { suitColor } from "@/engine/types";

export default function HandRankings({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] sm:text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest"
      >
        Hand Rankings
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onPointerDown={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
                {RANKINGS.map((r, idx) => {
                  const cards = r.cards.split(" ");
                  const suits = r.suits.split("");
                  return (
                    <div
                      key={r.name}
                      className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        idx === RANKINGS.length - 1 ? "border border-border/50" : ""
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
                        <p className="text-sm font-medium">{r.name}</p>
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
