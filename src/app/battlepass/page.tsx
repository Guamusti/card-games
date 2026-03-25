"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";
import { useXPStore, xpForLevel } from "@/engine/xp";
import { useBattlePassStore, getRewardsForLevel } from "@/engine/battlepass";
import { useWalletStore } from "@/engine/wallet";
import type { CubeRarity } from "@/engine/battlepass";

const CUBE_EMOJI: Record<CubeRarity, string> = { 1: "⬜", 2: "🟦", 3: "🟪", 4: "🟨" };
const CUBE_LABEL: Record<CubeRarity, string> = { 1: "Common", 2: "Rare", 3: "Epic", 4: "Legendary" };

export default function BattlePassPage() {
  const { level, currentXP } = useXPStore();
  const { claimedLevels, claimReward } = useBattlePassStore();
  const { addChips, addGems } = useWalletStore();
  const [mounted, setMounted] = useState(false);

  useState(() => { setMounted(true); });
  if (!mounted) return null;

  const xpNeeded = xpForLevel(level);
  const progress = Math.min((currentXP / xpNeeded) * 100, 100);

  const maxDisplay = Math.max(level + 20, 50);
  const rewardLevels: number[] = [];
  for (let i = 5; i <= maxDisplay; i += 5) {
    rewardLevels.push(i);
  }

  const handleClaim = (lvl: number) => {
    const reward = getRewardsForLevel(lvl);
    if (!reward) return;
    if (reward.type === "coins" && reward.amount) {
      addChips(reward.amount);
    }
    if (reward.type === "gems" && reward.amount) {
      addGems(reward.amount);
    }
    claimReward(lvl);
  };

  return (
    <div className="relative flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 px-4 sm:px-6 py-6 pb-20 max-w-lg mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-light tracking-tight text-center mb-2"
        >
          Battle Pass
        </motion.h1>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-2 mb-8"
        >
          <span className="text-sm text-muted">
            Level <span className="text-foreground font-semibold">{level}</span>
          </span>
          <div className="w-full max-w-xs h-2 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-muted tabular-nums">
            {currentXP} / {xpNeeded} XP
          </span>
        </motion.div>

        {/* Reward Track */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4">Rewards</h2>
          <div className="flex flex-col gap-2">
            {rewardLevels.map((lvl) => {
              const reward = getRewardsForLevel(lvl);
              if (!reward) return null;
              const unlocked = level >= lvl;
              const claimed = claimedLevels.includes(lvl);

              return (
                <motion.div
                  key={lvl}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: lvl * 0.01 }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    claimed
                      ? "border-border/50 opacity-50"
                      : unlocked
                      ? "border-foreground bg-foreground/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold tabular-nums w-10 ${unlocked ? "text-foreground" : "text-muted"}`}>
                      Lv.{lvl}
                    </span>
                    <span className="text-xl">
                      {reward.type === "cube"
                        ? CUBE_EMOJI[reward.cubeRarity || 1]
                        : reward.type === "gems"
                        ? "◆"
                        : "●"}
                    </span>
                    <span className="text-sm font-medium">
                      {reward.type === "cube"
                        ? `${CUBE_LABEL[reward.cubeRarity || 1]} Cube`
                        : reward.type === "gems"
                        ? `${reward.amount} Gems`
                        : `${reward.amount?.toLocaleString()} Coins`}
                    </span>
                  </div>
                  {claimed ? (
                    <span className="text-xs text-muted">Claimed</span>
                  ) : unlocked ? (
                    <button
                      onClick={() => handleClaim(lvl)}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-xs text-muted">🔒</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
