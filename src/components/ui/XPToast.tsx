"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onXPGain, type XPGainEvent } from "@/engine/xp";

interface ToastData {
  id: number;
  amount: number;
  multiplier: number;
  levelUp: boolean;
  newLevel: number;
}

let toastId = 0;

export default function XPToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const handleXP = useCallback((event: XPGainEvent) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-2), { id, ...event }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    return onXPGain(handleXP);
  }, [handleXP]);

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-1.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 border border-border backdrop-blur-sm shadow-sm"
          >
            <span className="text-xs font-bold text-correct tabular-nums">
              +{toast.amount} XP
            </span>
            {toast.multiplier > 1 && (
              <span className="text-[10px] font-semibold text-amber-500">
                x{toast.multiplier}
              </span>
            )}
            {toast.levelUp && (
              <span className="text-[10px] font-bold text-blue-500">
                LVL {toast.newLevel}!
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
