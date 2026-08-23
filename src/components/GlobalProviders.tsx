"use client";

import XPToast from "@/components/ui/XPToast";
import AchievementToast from "@/components/ui/AchievementToast";
import DailyLoginModal from "@/components/ui/DailyLoginModal";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { useEffect, useState } from "react";
import { useCustomizeStore } from "@/engine/customize/store";
import { activateSocial, subscribeSocial, type RoomInvite } from "@/engine/mus/social";

export default function GlobalProviders() {
  useAchievementChecker();
  const username = useCustomizeStore((s) => s.username);
  const [invite, setInvite] = useState<RoomInvite | null>(null);
  useEffect(() => { if (username) void activateSocial(username); return subscribeSocial((_, incoming) => { if (incoming) setInvite(incoming); }); }, [username]);

  return (
    <>
      <XPToast />
      <AchievementToast />
      <DailyLoginModal />
      {invite && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,380px)] rounded-xl border border-correct/40 bg-background shadow-xl p-3 flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-correct animate-pulse" /><div className="flex-1"><p className="text-sm font-medium">Invitación a Mus</p><p className="text-xs text-muted">@{invite.from} te invita a su sala</p></div><button onClick={() => { window.location.href = `/mus?join=${invite!.code}`; }} className="rounded-lg bg-foreground px-3 py-2 text-xs text-background">Unirme</button><button onClick={() => setInvite(null)} className="text-muted">×</button></div>}
    </>
  );
}
