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

const PRESETS = [2, 4, 6, 10];

export default function LanceBar({ mode, currentStake, onBet }: LanceBarProps) {
  const [showEnvido, setShowEnvido] = useState(false);
  const [custom, setCustom] = useState(2);

  const send = (amount: number) => {
    setShowEnvido(false);
    onBet(mode === "open" ? { type: "envido", amount } : { type: "subir", amount });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 w-full max-w-md mx-auto">
      {showEnvido ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((n) => (
              <Btn key={n} onClick={() => send(n)}>{mode === "open" ? n : `+${n}`}</Btn>
            ))}
          </div>
          {/* Custom amount */}
          <div className="flex items-center gap-2">
            <Stepper value={custom} onChange={setCustom} />
            <Btn onClick={() => send(custom)} className="flex-1">
              {mode === "open" ? `Envido ${custom}` : `Subo ${custom}`}
            </Btn>
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

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(2, Math.min(99, v));
  return (
    <div className="flex items-center rounded-xl border border-border overflow-hidden">
      <button onClick={() => onChange(clamp(value - 1))} className="px-3 py-3 text-muted hover:text-foreground">−</button>
      <input
        type="number" inputMode="numeric" value={value} min={2} max={99}
        onChange={(e) => onChange(clamp(parseInt(e.target.value) || 2))}
        className="w-12 text-center bg-transparent outline-none text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button onClick={() => onChange(clamp(value + 1))} className="px-3 py-3 text-muted hover:text-foreground">+</button>
    </div>
  );
}

function Btn({
  children, onClick, variant = "default", className = "",
}: { children: React.ReactNode; onClick: () => void; variant?: "default" | "ghost" | "accent" | "correct"; className?: string }) {
  const cls =
    variant === "accent" ? "bg-accent text-white border-accent"
    : variant === "correct" ? "bg-correct text-white border-correct"
    : variant === "ghost" ? "border-border text-muted hover:border-foreground hover:text-foreground"
    : "bg-foreground text-background border-foreground";
  return (
    <button onClick={onClick} className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all active:scale-95 ${cls} ${className}`}>
      {children}
    </button>
  );
}
