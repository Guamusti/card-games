"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/engine/store";

export default function Feedback() {
  const lastFeedback = useGameStore((s) => s.lastFeedback);

  return (
    <div className="h-7 sm:h-10 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {lastFeedback && (
          <motion.div
            key={`${lastFeedback.playerAction}-${lastFeedback.correctAction}-${Date.now()}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {lastFeedback.isCorrect ? (
              <span className="text-xs sm:text-sm font-medium text-correct">
                Correct
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-medium text-accent">
                Optimal: {lastFeedback.correctAction.toUpperCase()}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
