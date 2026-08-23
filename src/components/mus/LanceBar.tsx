"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { HumanBetAction } from "@/engine/mus/store";

interface LanceBarProps {
  /** "open" = no live envite (paso/envido/órdago); "respond" = answer an envite. */
  mode: "open" | "respond";
  currentStake: number;
  onBet: (a: HumanBetAction) => void;
}

const ENVIDO_OPTIONS = [2, 4, 6, 10];

export default function LanceBar({ mode, currentStake, onBet }: LanceBarProps) {
  const [showEnvido, setShowEnvido] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 w-full max-w-md mx-auto"
    >
      {showEnvido ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {ENVIDO_OPTIONS.map((n) => (
              <Btn key={n} onClick={() => { setShowEnvido(false); onBet(mode === "open" ? { type: "envido", amount: n } : { type: "subir", amount: n }); }}>
                {mode === "open" ? n : `+${n}`}
              </Btn>
            ))}
          </div>
          <Btn variant="ghost" onClick={() => setShowEnvido(false)}>Cancelar</Btn>
        </div>
      ) : mode === "open" ? (
        <div className="grid grid-cols-3 gap-2">
          <Btn variant="ghost" onClick={() => onBet({ type: "paso" })}>Paso</Btn>
          <Btn onClick={() => setShowEnvido(true)}>Envido</Btn>
          <Btn variant="accent" onClick={() => onBet({ type: "ordago" })}>Órdago</Btn>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="ghost" onClick={() => onBet({ type: "noquiero" })}>No quiero</Btn>
          <Btn variant="correct" onClick={() => onBet({ type: "quiero" })}>Quiero ({currentStake})</Btn>
          <Btn onClick={() => setShowEnvido(true)}>Veo y subo</Btn>
          <Btn variant="accent" onClick={() => onBet({ type: "ordago" })}>Órdago</Btn>
        </div>
      )}
    </motion.div>
  );
}

function Btn({
  children, onClick, variant = "default",
}: { children: React.ReactNode; onClick: () => void; variant?: "default" | "ghost" | "accent" | "correct" }) {
  const cls =
    variant === "accent" ? "bg-accent text-white border-accent"
    : variant === "correct" ? "bg-correct text-white border-correct"
    : variant === "ghost" ? "border-border text-muted hover:border-foreground hover:text-foreground"
    : "bg-foreground text-background border-foreground";
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all active:scale-95 ${cls}`}
    >
      {children}
    </button>
  );
}
