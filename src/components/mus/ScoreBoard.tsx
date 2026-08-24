"use client";

import { motion } from "framer-motion";

interface ScoreBoardProps {
  scoreA: number;
  scoreB: number;
  vacasA: number;
  vacasB: number;
  target: number;
  bestOf: number;
}

export default function ScoreBoard({ scoreA, scoreB, vacasA, vacasB, target, bestOf }: ScoreBoardProps) {
  const need = bestOf === 3 ? 2 : 3;
  return (
    <div className="flex items-stretch gap-2 w-full max-w-xs mx-auto">
      <TeamScore label="Nosotros" score={scoreA} vacas={vacasA} need={need} target={target} highlight />
      <div className="flex flex-col items-center justify-center px-1">
        <span className="text-[9px] text-muted uppercase tracking-widest">a {target}</span>
        <span className="text-lg font-extralight text-muted">·</span>
        <span className="text-[9px] text-muted uppercase tracking-widest">BO{bestOf}</span>
      </div>
      <TeamScore label="Ellos" score={scoreB} vacas={vacasB} need={need} target={target} />
    </div>
  );
}

function TeamScore({
  label, score, vacas, need, target, highlight = false,
}: { label: string; score: number; vacas: number; need: number; target: number; highlight?: boolean }) {
  const pct = Math.min(100, (score / target) * 100);
  const amarracos = Math.floor(score / 5); // each amarraco = 5 piedras
  const loose = score % 5;
  return (
    <div className={`flex-1 rounded-xl border p-2.5 ${highlight ? "border-foreground" : "border-border"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: need }).map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < vacas ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>
      </div>
      <div className="flex items-end gap-1">
        <motion.span key={score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-2xl font-light tabular-nums leading-none">
          {score}
        </motion.span>
        <span className="text-[10px] text-muted mb-0.5">piedras</span>
      </div>
      {/* Amarracos: filled dot per group of 5, small ticks for the remainder. */}
      <div className="mt-1.5 flex items-center gap-1.5 min-h-[10px]" title={`${amarracos} amarraco${amarracos === 1 ? "" : "s"} + ${loose}`}>
        <div className="flex flex-wrap gap-0.5">
          {Array.from({ length: amarracos }).map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${highlight ? "bg-foreground" : "bg-muted"}`} />
          ))}
        </div>
        {loose > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: loose }).map((_, i) => (
              <span key={i} className="w-0.5 h-2 rounded-full bg-muted/70" />
            ))}
          </div>
        )}
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
        <motion.div className="h-full bg-foreground" animate={{ width: `${pct}%` }} transition={{ ease: "easeOut" }} />
      </div>
    </div>
  );
}
