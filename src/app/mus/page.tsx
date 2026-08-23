"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMusStore } from "@/engine/mus/store";
import { useCustomizeStore } from "@/engine/customize/store";
import type { VacaPoints, BestOf, MusDifficulty, BotSpeed } from "@/engine/mus/types";
import MusTable from "@/components/mus/MusTable";
import MusPractice from "@/components/mus/MusPractice";
import MusLobby from "@/components/mus/MusLobby";
import BottomNav from "@/components/ui/BottomNav";
import { resetMusRoom, type RoomMode } from "@/engine/mus/online";

type Screen = "menu" | "solo-setup" | "solo" | "practice" | "lobby" | "online-play" | "settings";

export default function MusPage() {
  const [screen, setScreen] = useState<Screen>("menu");
  const startSolo = useMusStore((s) => s.startSolo);
  const resetGame = useMusStore((s) => s.reset);
  const { aiDifficulty, musDefaultVaca, musDefaultBestOf } = useCustomizeStore();

  const [vaca, setVaca] = useState<VacaPoints>(musDefaultVaca);
  const [bestOf, setBestOf] = useState<BestOf>(musDefaultBestOf);
  const [difficulty, setDifficulty] = useState<MusDifficulty>(aiDifficulty);
  const [onlineMode, setOnlineMode] = useState<RoomMode>("friends4");

  if (screen === "solo" || screen === "online-play") {
    const exit = () => {
      if (screen === "online-play") resetMusRoom();
      resetGame();
      setScreen("menu");
    };
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <button onClick={exit} className="absolute top-3 left-3 z-20 text-xs text-muted hover:text-foreground">← Salir</button>
        <MusTable />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="flex items-center justify-between px-4 h-14 border-b border-border">
        {screen === "menu"
          ? <Link href="/" className="text-sm text-muted hover:text-foreground">← Inicio</Link>
          : <button onClick={() => setScreen("menu")} className="text-sm text-muted hover:text-foreground">← Modos</button>}
        <h1 className="text-base font-medium">Mus</h1>
        <span className="w-14" />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 pb-24">
        {screen === "menu" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-3">
            <p className="text-center text-sm text-muted mb-2">Elige un modo</p>
            <ModeCard title="Solo vs Bots" desc="Tú + 1 compañero contra 2 bots" icon={<IconBot />} onClick={() => setScreen("solo-setup")} />
            <ModeCard title="Práctica" desc="Probabilidad de ganar cada lance" icon={<IconChart />} onClick={() => setScreen("practice")} />
            <ModeCard title="2 reales vs 2 bots" desc="Tú y un amigo contra 2 bots" icon={<IconDuo />} badge="Online" onClick={() => { setOnlineMode("duo2"); setScreen("lobby"); }} />
            <ModeCard title="Online con amigos" desc="4 jugadores reales, 2 parejas" icon={<IconGlobe />} badge="Online" onClick={() => { setOnlineMode("friends4"); setScreen("lobby"); }} />
            <ModeCard title="Ajustes de Mus" desc="Reglas por defecto, bots y baraja" icon={<IconGear />} onClick={() => setScreen("settings")} />
          </motion.div>
        )}

        {screen === "settings" && <MusSettings vaca={vaca} bestOf={bestOf} setVaca={setVaca} setBestOf={setBestOf} />}

        {screen === "solo-setup" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-5">
            <h2 className="text-lg font-light">Configuración</h2>
            <OptionRow label="Vaca a" hint="Piedras por vaca">
              {([30, 40] as VacaPoints[]).map((v) => <Chip key={v} active={vaca === v} onClick={() => setVaca(v)}>{v}</Chip>)}
            </OptionRow>
            <OptionRow label="Partida" hint="Vacas para ganar">
              {([3, 5] as BestOf[]).map((b) => <Chip key={b} active={bestOf === b} onClick={() => setBestOf(b)}>BO{b}</Chip>)}
            </OptionRow>
            <OptionRow label="Dificultad" hint="Nivel de los bots">
              {(["easy", "normal", "hard", "imposible"] as MusDifficulty[]).map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {DIFF_LABEL[d]}
                </Chip>
              ))}
            </OptionRow>
            {difficulty === "imposible" && (
              <p className="-mt-3 text-[11px] text-accent">Los bots juegan por estadística (Monte Carlo) y pot-odds. Muy difícil de ganar.</p>
            )}
            <button onClick={() => { startSolo({ vacaPoints: vaca, bestOf, difficulty }); setScreen("solo"); }} className="mt-2 rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition">Jugar</button>
            <p className="text-center text-[11px] text-muted">Los valores por defecto se cambian en <button onClick={() => setScreen("settings")} className="underline hover:text-foreground">Ajustes de Mus</button></p>
          </motion.div>
        )}

        {screen === "practice" && <MusPractice />}

        {screen === "lobby" && (
          <MusLobby mode={onlineMode} onStarted={() => setScreen("online-play")} onExit={() => setScreen("menu")} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function ModeCard({ title, desc, icon, badge, disabled, onClick }: {
  title: string; desc: string; icon: React.ReactNode; badge?: string; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className={`group flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${disabled ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-foreground"}`}>
      <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 text-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium">{title}</h3>
          {badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-muted">{badge}</span>}
        </div>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      {!disabled && <span className="text-muted group-hover:text-foreground transition-colors">→</span>}
    </button>
  );
}

function OptionRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col"><span className="text-sm">{label}</span><span className="text-[10px] text-muted">{hint}</span></div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border text-xs px-3 py-1.5 transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground"}`}>{children}</button>
  );
}

const DIFF_LABEL: Record<MusDifficulty, string> = {
  easy: "Fácil", normal: "Normal", hard: "Difícil", imposible: "Imposible",
};

function MusSettings({ vaca, bestOf, setVaca, setBestOf }: {
  vaca: VacaPoints; bestOf: BestOf; setVaca: (v: VacaPoints) => void; setBestOf: (b: BestOf) => void;
}) {
  const {
    aiDifficulty, setAiDifficulty,
    musDeckTheme, setMusDeckTheme,
    musBotSpeed, setMusBotSpeed,
    musDefaultVaca, setMusDefaultVaca,
    musDefaultBestOf, setMusDefaultBestOf,
  } = useCustomizeStore();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-5">
      <h2 className="text-lg font-light">Ajustes de Mus</h2>
      <p className="text-[11px] text-muted -mt-3">Se aplican por defecto a partidas nuevas y salas que crees.</p>

      <OptionRow label="Vaca a" hint="Piedras por vaca">
        {([30, 40] as VacaPoints[]).map((v) => (
          <Chip key={v} active={musDefaultVaca === v} onClick={() => { setMusDefaultVaca(v); setVaca(v); }}>{v}</Chip>
        ))}
      </OptionRow>
      <OptionRow label="Partida" hint="Vacas para ganar">
        {([3, 5] as BestOf[]).map((b) => (
          <Chip key={b} active={musDefaultBestOf === b} onClick={() => { setMusDefaultBestOf(b); setBestOf(b); }}>BO{b}</Chip>
        ))}
      </OptionRow>
      <OptionRow label="Dificultad" hint="Nivel de los bots">
        {(["easy", "normal", "hard", "imposible"] as MusDifficulty[]).map((d) => (
          <Chip key={d} active={aiDifficulty === d} onClick={() => setAiDifficulty(d)}>
            {DIFF_LABEL[d]}
          </Chip>
        ))}
      </OptionRow>
      {aiDifficulty === "imposible" && (
        <p className="-mt-3 text-[11px] text-accent">Bots que juegan por estadística (Monte Carlo) y pot-odds. Muy difícil de ganar.</p>
      )}
      <OptionRow label="Ritmo" hint="Velocidad de los bots">
        {(["slow", "normal", "fast"] as BotSpeed[]).map((sp) => (
          <Chip key={sp} active={musBotSpeed === sp} onClick={() => setMusBotSpeed(sp)}>
            {sp === "slow" ? "Lento" : sp === "normal" ? "Normal" : "Rápido"}
          </Chip>
        ))}
      </OptionRow>
      <OptionRow label="Baraja" hint="Estilo de las cartas">
        <Chip active={musDeckTheme === "classic"} onClick={() => setMusDeckTheme("classic")}>Clásica</Chip>
        <Chip active={musDeckTheme === "neon"} onClick={() => setMusDeckTheme("neon")}>Neón</Chip>
      </OptionRow>

      <span className="text-[11px] text-muted text-center">Sin señas · variante 8 reyes / 8 ases</span>
    </motion.div>
  );
}

function IconGear() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  );
}

// ── Inline SVG icons (no emoji) ──
function IconBot() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="2" /><path d="M12 8V4" /><circle cx="12" cy="3" r="1" /><path d="M9 13h0M15 13h0" /><path d="M2 13v2M22 13v2" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" />
    </svg>
  );
}
function IconDuo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 20c0-2.8 2.2-5 5-5M21 20c0-2.8-2.2-5-5-5" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z" />
    </svg>
  );
}
