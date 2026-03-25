"use client";

import XPToast from "@/components/ui/XPToast";
import AchievementToast from "@/components/ui/AchievementToast";
import DailyLoginModal from "@/components/ui/DailyLoginModal";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";

export default function GlobalProviders() {
  useAchievementChecker();

  return (
    <>
      <XPToast />
      <AchievementToast />
      <DailyLoginModal />
    </>
  );
}
