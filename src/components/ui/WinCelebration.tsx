"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/engine/store";

export default function WinCelebration() {
  const { phase, hands } = useGameStore();

  const hasWin =
    phase === "settled" &&
    hands.some((h) => h.result === "win" || h.result === "blackjack");

  const isBJ =
    phase === "settled" && hands.some((h) => h.result === "blackjack");

  return (
    <AnimatePresence>
      {hasWin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 pointer-events-none overflow-hidden z-10"
        >
          {/* Radial glow behind cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.15, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl ${
              isBJ ? "bg-amber-400" : "bg-correct"
            }`}
          />

          {/* Floating particles */}
          {Array.from({ length: isBJ ? 12 : 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: 0,
                x: `${30 + Math.random() * 40}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -120 - Math.random() * 100],
              }}
              transition={{
                duration: 1.2 + Math.random() * 0.8,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
              className="absolute bottom-1/3"
              style={{ left: `${15 + Math.random() * 70}%` }}
            >
              <span
                className={`text-xs ${
                  isBJ ? "text-amber-400" : "text-correct"
                }`}
              >
                {["✦", "·", "◦", "✧"][Math.floor(Math.random() * 4)]}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
