"use client";

import XPToast from "@/components/ui/XPToast";
import AchievementToast from "@/components/ui/AchievementToast";
import DailyLoginModal from "@/components/ui/DailyLoginModal";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { useEffect, useState } from "react";
import { useCustomizeStore } from "@/engine/customize/store";
import { activateSocial, publishMusStats, subscribeSocial, type RoomInvite } from "@/engine/mus/social";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useMusStatsStore } from "@/engine/mus/stats";

export default function GlobalProviders() {
  useAchievementChecker();
  // Mus has no top bar, so it must still restore the saved light/dark preference
  // after joining an invitation through a full-page navigation.
  useDarkMode();
  const username = useCustomizeStore((s) => s.username);
  const musState = useMusStatsStore();
  const musStats = { handsPlayed: musState.handsPlayed, handsWon: musState.handsWon, gamesPlayed: musState.gamesPlayed, gamesWon: musState.gamesWon, vacasWon: musState.vacasWon, stonesWon: musState.stonesWon, ordagosWon: musState.ordagosWon };
  const [invite, setInvite] = useState<RoomInvite | null>(null);
  useEffect(() => { if (username) void activateSocial(username).then(() => publishMusStats(musStats)); return subscribeSocial((_, incoming) => { if (incoming) setInvite(incoming); }); }, [username]);
  useEffect(() => { if (username) publishMusStats(musStats); }, [musState.handsPlayed, musState.handsWon, musState.gamesPlayed, musState.gamesWon, musState.vacasWon, musState.stonesWon, musState.ordagosWon, username]);

  return (
    <>
      <XPToast />
      <AchievementToast />
      <DailyLoginModal />
      {invite && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,380px)] rounded-xl border border-correct/40 bg-background shadow-xl p-3 flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-correct animate-pulse" /><div className="flex-1"><p className="text-sm font-medium">Invitación a Mus</p><p className="text-xs text-muted">@{invite.from} te invita a su sala</p></div><button onClick={() => { sessionStorage.setItem("mus-invite-code", invite!.code); window.location.href = "/mus"; }} className="rounded-lg bg-foreground px-3 py-2 text-xs text-background">Unirme</button><button onClick={() => setInvite(null)} className="text-muted">×</button></div>}
    </>
  );
}
