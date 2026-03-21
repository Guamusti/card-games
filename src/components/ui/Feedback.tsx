"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/engine/store";

export default function Feedback() {
  const lastFeedback = useGameStore((s) => s.lastFeedback);
  const phase = useGameStore((s) => s.phase);

  // Don't show strategy feedback once the hand is settled
  if (phase === "settled" || phase === "dealer-turn") return <div className="h-7 sm:h-10" />;

  return (
    <div className="h-7 sm:h-10 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {lastFeedback && (
          <motion.div
            key={`${lastFeedback.playerAction}-${lastFeedback.correctAction}-${Date.now()}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider border ${
              lastFeedback.isCorrect
                ? "border-correct/30 bg-correct/10 text-correct"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {lastFeedback.isCorrect
              ? "Good play"
              : `Optimal: ${lastFeedback.correctAction}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
