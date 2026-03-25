"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS, useAchievementStore } from "@/engine/achievements";

interface ToastData {
  id: string;
  name: string;
  icon: string;
  reward: number;
  gemReward?: number;
}

// Global event emitter for achievements
type AchievementListener = (ids: string[]) => void;
const listeners: AchievementListener[] = [];
export function emitAchievements(ids: string[]) {
  for (const fn of listeners) fn(ids);
}

export default function AchievementToast() {
  const [queue, setQueue] = useState<ToastData[]>([]);
  const [current, setCurrent] = useState<ToastData | null>(null);

  const handleNew = useCallback((ids: string[]) => {
    const toasts = ids
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter(Boolean)
      .map((a) => ({
        id: a!.id,
        name: a!.name,
        icon: a!.icon,
        reward: a!.reward,
        gemReward: a!.gemReward,
      }));
    if (toasts.length > 0) {
      setQueue((prev) => [...prev, ...toasts]);
    }
  }, []);

  useEffect(() => {
    listeners.push(handleNew);
    return () => {
      const idx = listeners.indexOf(handleNew);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [handleNew]);

  // Show toasts one at a time
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
    setTimeout(() => setCurrent(null), 3000);
  }, [current, queue]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 18 }}
          className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background border border-correct/30 shadow-lg max-w-sm">
            <span className="text-2xl">{current.icon}</span>
            <div className="flex flex-col">
              <span className="text-xs text-correct font-semibold uppercase tracking-widest">Achievement!</span>
              <span className="text-sm font-semibold">{current.name}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-amber-500 font-bold">+{current.reward}</span>
              {current.gemReward && (
                <span className="text-xs text-blue-500 font-bold">+{current.gemReward}◆</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
