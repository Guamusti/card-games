"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { SpanishCard } from "@/engine/mus/types";
import { LANCE_LABEL } from "@/engine/mus/types";
import { createShuffledDeck } from "@/engine/mus/deck";
import { evaluateMusHand } from "@/engine/mus/rules";
import { calculateMusProbabilities, type MusProbabilities } from "@/engine/mus/probability";
import MusCard from "./MusCard";

export default function MusPractice() {
  const [cards, setCards] = useState<SpanishCard[]>([]);
  const [probs, setProbs] = useState<MusProbabilities | null>(null);
  const [reyes8] = useState(true);

  const deal = useCallback(() => {
    const deck = createShuffledDeck();
    const hand = deck.slice(0, 4);
    setCards(hand);
    setProbs(calculateMusProbabilities(hand, reyes8, 3, 3000));
  }, [reyes8]);

  useEffect(() => { deal(); }, [deal]);

  const evalHand = cards.length === 4 ? evaluateMusHand(cards, reyes8) : null;

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 py-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-muted">Tu mano</span>
        <div className="flex gap-2">
          {cards.map((c, i) => <MusCard key={i} card={c} />)}
        </div>
      </div>

      {probs && (
        <div className="w-full flex flex-col gap-2.5">
          <span className="text-xs uppercase tracking-widest text-muted text-center">Probabilidad de ganar cada lance</span>
          <LanceProb p={probs.grande} />
          <LanceProb p={probs.chica} />
          <LanceProb p={probs.pares} extra={evalHand?.pares.category !== "none" ? paresLabel(evalHand!.pares.category) : "Sin pares"} />
          <LanceProb
            p={probs.juego}
            extra={evalHand ? (evalHand.juego.hasJuego ? `Juego ${evalHand.juego.sum}` : `Punto ${evalHand.juego.punto}`) : ""}
          />
        </div>
      )}

      <button
        onClick={deal}
        className="w-full rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition"
      >
        Nueva mano
      </button>
      <p className="text-[11px] text-muted text-center px-4">
        Probabilidad de que tu mano sea la mejor de la mesa (4 jugadores). Solo en práctica.
      </p>
    </div>
  );
}

function LanceProb({ p, extra }: { p: MusProbabilities[keyof MusProbabilities]; extra?: string }) {
  const pct = p.winPct;
  const color = pct >= 60 ? "var(--color-correct)" : pct >= 35 ? "var(--color-foreground)" : "var(--color-muted)";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{LANCE_LABEL[p.lance]}</span>
        <div className="flex items-center gap-2">
          {extra && <span className="text-[10px] text-muted">{extra}</span>}
          <span className="tabular-nums font-semibold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ease: "easeOut", duration: 0.5 }} />
      </div>
    </div>
  );
}

function paresLabel(cat: string): string {
  return cat === "duples" ? "Duples" : cat === "medias" ? "Medias" : cat === "par" ? "Par" : "";
}
