"use client";

import { useEffect, useRef } from "react";
import { useStatsStore } from "@/engine/stats";
import { useXPStore } from "@/engine/xp";
import { useWalletStore } from "@/engine/wallet";
import { checkAchievements, ACHIEVEMENTS, useAchievementStore } from "@/engine/achievements";
import { emitAchievements } from "@/components/ui/AchievementToast";

/**
 * Hook that monitors stats/XP/wallet changes and checks for new achievements.
 * When an achievement is unlocked, it grants the reward and shows a toast.
 */
export function useAchievementChecker() {
  const bj = useStatsStore((s) => s.bj);
  const poker = useStatsStore((s) => s.poker);
  const slots = useStatsStore((s) => s.slots);
  const level = useXPStore((s) => s.level);
  const balance = useWalletStore((s) => s.balance);
  const prevRef = useRef<string>("");

  useEffect(() => {
    // Build a key to detect changes
    const key = `${bj.handsPlayed}-${bj.correctDecisions}-${poker.handsPlayed}-${poker.wins}-${slots.totalSpins}-${level}-${balance}`;
    if (key === prevRef.current) return;
    prevRef.current = key;

    const accuracy = bj.totalDecisions > 0
      ? Math.round((bj.correctDecisions / bj.totalDecisions) * 100)
      : 0;

    const newlyUnlocked = checkAchievements({
      bjHands: bj.handsPlayed,
      bjBlackjacks: bj.blackjacks,
      bjAccuracy: accuracy,
      bjTotalDecisions: bj.totalDecisions,
      bjStreak: bj.currentStreak,
      pokerHands: poker.handsPlayed,
      pokerWins: poker.wins,
      pokerShowdownWins: poker.showdownWins,
      pokerBiggestPot: poker.biggestPot,
      slotSpins: slots.totalSpins,
      slotJackpots: slots.jackpots,
      level,
      balance,
    });

    if (newlyUnlocked.length > 0) {
      // Grant rewards
      const wallet = useWalletStore.getState();
      for (const id of newlyUnlocked) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (achievement) {
          wallet.addChips(achievement.reward);
          if (achievement.gemReward) wallet.addGems(achievement.gemReward);
        }
      }
      // Show toast
      emitAchievements(newlyUnlocked);
    }
  }, [bj, poker, slots, level, balance]);
}
