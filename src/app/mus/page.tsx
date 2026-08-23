"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMusStore } from "@/engine/mus/store";
import { useCustomizeStore } from "@/engine/customize/store";
import type { VacaPoints, BestOf, MusDifficulty } from "@/engine/mus/types";
import MusTable from "@/components/mus/MusTable";
import BottomNav from "@/components/ui/BottomNav";

type Screen = "menu" | "solo-setup" | "solo";

export default function MusPage() {
  const [screen, setScreen] = useState<Screen>("menu");
  const startSolo = useMusStore((s) => s.startSolo);
  const resetGame = useMusStore((s) => s.reset);
  const { aiDifficulty } = useCustomizeStore();

  const [vaca, setVaca] = useState<VacaPoints>(30);
  const [bestOf, setBestOf] = useState<BestOf>(3);
  const [difficulty, setDifficulty] = useState<MusDifficulty>(aiDifficulty);

  if (screen === "solo") {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <button
          onClick={() => { resetGame(); setScreen("menu"); }}
          className="absolute top-3 left-3 z-20 text-xs text-muted hover:text-foreground flex items-center gap-1"
        >
          ← Salir
        </button>
        <MusTable />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="flex items-center justify-between px-4 h-14 border-b border-border">
        <Link href="/" className="text-sm text-muted hover:text-foreground">← Inicio</Link>
        <h1 className="text-base font-medium">Mus</h1>
        <span className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 pb-24">
        {screen === "menu" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-3">
            <p className="text-center text-sm text-muted mb-2">Elige un modo</p>

            <ModeCard
              title="Solo vs Bots"
              desc="Tú + 1 compañero contra 2 bots"
              icon="🤖"
              onClick={() => setScreen("solo-setup")}
            />
            <ModeCard
              title="Práctica"
              desc="Probabilidad de ganar cada lance"
              icon="📊"
              badge="Próximamente"
              disabled
            />
            <ModeCard
              title="Online con amigos"
              desc="4 jugadores reales, 2 parejas"
              icon="🌐"
              badge="Próximamente"
              disabled
            />
          </motion.div>
        )}

        {screen === "solo-setup" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-5">
            <button onClick={() => setScreen("menu")} className="text-xs text-muted hover:text-foreground self-start">← Modos</button>
            <h2 className="text-lg font-light">Configuración</h2>

            <OptionRow label="Vaca a" hint="Piedras por vaca">
              {([30, 40] as VacaPoints[]).map((v) => (
                <Chip key={v} active={vaca === v} onClick={() => setVaca(v)}>{v}</Chip>
              ))}
            </OptionRow>

            <OptionRow label="Partida" hint="Vacas para ganar">
              {([3, 5] as BestOf[]).map((b) => (
                <Chip key={b} active={bestOf === b} onClick={() => setBestOf(b)}>BO{b}</Chip>
              ))}
            </OptionRow>

            <OptionRow label="Dificultad" hint="Nivel de los bots">
              {(["easy", "normal", "hard"] as MusDifficulty[]).map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d === "easy" ? "Fácil" : d === "normal" ? "Normal" : "Difícil"}
                </Chip>
              ))}
            </OptionRow>

            <button
              onClick={() => { startSolo({ vacaPoints: vaca, bestOf, difficulty }); setScreen("solo"); }}
              className="mt-2 rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition"
            >
              Jugar
            </button>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function ModeCard({ title, desc, icon, badge, disabled, onClick }: {
  title: string; desc: string; icon: string; badge?: string; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${
        disabled ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-foreground"
      }`}
    >
      <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center text-2xl shrink-0">{icon}</div>
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
      <div className="flex flex-col">
        <span className="text-sm">{label}</span>
        <span className="text-[10px] text-muted">{hint}</span>
      </div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border text-xs px-3 py-1.5 transition-colors ${
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
