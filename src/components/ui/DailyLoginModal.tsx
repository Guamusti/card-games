"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyLoginStore, getRewardForDay } from "@/engine/dailyLogin";
import { useWalletStore } from "@/engine/wallet";
import { useBattlePassStore } from "@/engine/battlepass";
import type { CubeRarity } from "@/engine/battlepass";

const CUBE_LABEL: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Epic", 4: "Legendary" };

export default function DailyLoginModal() {
  const [show, setShow] = useState(false);
  const [reward, setReward] = useState<ReturnType<typeof getRewardForDay> | null>(null);
  const [streak, setStreak] = useState(0);
  const { checkIn } = useDailyLoginStore();
  const { addChips, addGems } = useWalletStore();

  useEffect(() => {
    // Slight delay so the app loads first
    const timer = setTimeout(() => {
      const result = checkIn();
      if (result) {
        setReward(result.reward);
        setStreak(useDailyLoginStore.getState().streak);

        // Grant rewards
        if (result.reward.coins > 0) addChips(result.reward.coins);
        if (result.reward.gems > 0) addGems(result.reward.gems);
        if (result.reward.cubeRarity) {
          const id = `cube-daily-${Date.now()}`;
          const bp = useBattlePassStore.getState();
          const newCubes = [...bp.cubes, { id, rarity: result.reward.cubeRarity as CubeRarity, taps: 0, maxTaps: 5 as const }];
          useBattlePassStore.setState({ cubes: newCubes });
          try { localStorage.setItem("card-trainer-battlepass", JSON.stringify({ cubes: newCubes, claimedLevels: bp.claimedLevels })); } catch {}
        }

        setShow(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show || !reward) return null;

  // Show the 7-day track
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const r = getRewardForDay(day);
    const cycleDay = ((streak - 1) % 7) + 1;
    const isToday = day === cycleDay;
    const isPast = day < cycleDay;
    return { ...r, isToday, isPast };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center px-4"
        onClick={() => setShow(false)}
      >
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-background border border-border rounded-2xl p-6 max-w-sm w-full"
        >
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: 0.15 }}
              className="text-4xl mb-2"
            >
              🎁
            </motion.div>
            <h2 className="text-lg font-semibold">Daily Bonus</h2>
            <p className="text-xs text-muted mt-0.5">
              Day {streak} streak!
            </p>
          </div>

          {/* 7-day track */}
          <div className="flex gap-1 mb-4">
            {days.map((d, i) => (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-center transition-all ${
                  d.isToday
                    ? "bg-correct/10 border border-correct/30 ring-1 ring-correct/20"
                    : d.isPast
                    ? "bg-border/20 opacity-50"
                    : "bg-border/10"
                }`}
              >
                <span className="text-[9px] text-muted font-medium">D{i + 1}</span>
                <span className="text-[10px] font-semibold text-amber-500">{d.coins}</span>
                {d.gems > 0 && <span className="text-[9px] text-blue-500">{d.gems}◆</span>}
                {d.cubeRarity && <span className="text-[9px]">📦</span>}
              </div>
            ))}
          </div>

          {/* Today's reward highlight */}
          <div className="flex items-center justify-center gap-4 py-3 mb-4 border border-border rounded-xl">
            {reward.coins > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-amber-500 text-sm">●</span>
                <span className="text-lg font-bold tabular-nums">+{reward.coins}</span>
              </div>
            )}
            {reward.gems > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-blue-500 text-sm">◆</span>
                <span className="text-lg font-bold tabular-nums">+{reward.gems}</span>
              </div>
            )}
            {reward.cubeRarity && (
              <div className="flex items-center gap-1">
                <span className="text-sm">📦</span>
                <span className="text-sm font-semibold">{CUBE_LABEL[reward.cubeRarity]} Cube</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShow(false)}
            className="w-full py-3 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-xl"
          >
            Claim
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
