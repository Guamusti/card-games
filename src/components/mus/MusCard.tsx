"use client";

import { motion } from "framer-motion";
import type { SpanishCard } from "@/engine/mus/types";
import { RANK_SHORT, SUIT_NAME } from "@/engine/mus/types";
import SpanishSuit, { SUIT_COLOR } from "./SpanishSuit";
import { useCustomizeStore } from "@/engine/customize/store";

interface MusCardProps {
  card?: SpanishCard;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
  mini?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

export default function MusCard({
  card, hidden = false, delay = 0, small = false, mini = false, selected = false, dimmed = false, onClick,
}: MusCardProps) {
  const { showCardShadow, animationSpeed, musDeckTheme } = useCustomizeStore();
  const dur = animationSpeed === "fast" ? 0.28 : animationSpeed === "slow" ? 0.55 : 0.38;
  const sizeClass = mini ? "mus-card-mini" : small ? "mus-card-sm" : "mus-card";

  if (hidden || !card) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }} className={`${sizeClass} rounded-md border border-white/15 flex items-center justify-center select-none`} style={{ background: "repeating-linear-gradient(45deg, #7a1420 0 6px, #641019 6px 12px)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </motion.div>
    );
  }

  const color = SUIT_COLOR[card.suit];
  const rank = RANK_SHORT[card.rank];
  const pipSize = mini ? 9 : small ? 13 : 20;
  const centerSize = mini ? 20 : small ? 30 : 46;

  if (musDeckTheme === "neon") {
    const neonSize = mini ? 17 : small ? 24 : 34;
    const pips = card.rank <= 7 ? card.rank : 1;
    return (
      <motion.button type="button" onClick={onClick} disabled={!onClick} initial={{ opacity: 0, scale: 0.58, x: 28, y: -82, rotate: 9 }} animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, x: 0, y: selected ? -12 : 0, rotate: selected ? -2 : 0 }} transition={{ duration: dur * 1.35, delay, ease: [0.16, 1, 0.3, 1] }} className={`${sizeClass} relative overflow-hidden rounded-[0.8rem] border bg-[#080909] flex flex-col justify-between select-none transition-colors ${selected ? "border-white ring-2 ring-white/70" : "border-white/25"} ${showCardShadow ? "shadow-sm" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`} style={{ padding: mini ? 2 : small ? 3 : 4 }} title={`${RANK_SHORT[card.rank]} de ${SUIT_NAME[card.suit]}`}>
        <div className="absolute inset-1 rounded-[0.55rem] border border-dashed opacity-80" style={{ borderColor: `${color}cc` }} />
        <div className="relative leading-none" style={{ color }}><span className="font-light" style={{ fontSize: pipSize }}>{rank}</span></div>
        <div className="relative grid flex-1 grid-cols-2 content-center items-center justify-items-center gap-0.5 px-1 pointer-events-none">{Array.from({ length: pips }, (_, index) => <SpanishSuit key={index} suit={card.suit} size={neonSize} theme="neon" />)}</div>
        <div className="relative flex justify-end leading-none rotate-180" style={{ color }}><span className="font-light" style={{ fontSize: pipSize }}>{rank}</span></div>
      </motion.button>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} disabled={!onClick} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, y: selected ? -12 : 0 }} transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }} className={`${sizeClass} relative overflow-hidden rounded-[0.65rem] border bg-[#f8f5ec] flex flex-col justify-between select-none transition-colors ${selected ? "border-accent ring-2 ring-accent" : "border-[#c9c2b5]"} ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.18)]" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`} style={{ padding: mini ? 2 : small ? 3 : 4 }} title={`${RANK_SHORT[card.rank]} de ${SUIT_NAME[card.suit]}`}>
      <div aria-hidden className="pointer-events-none absolute inset-[3px] rounded-[0.45rem] border border-[#d9d1c2]" />
      <div className="relative flex items-center gap-0.5 leading-none" style={{ color }}><span className="font-semibold tracking-[-0.08em]" style={{ fontSize: pipSize }}>{rank}</span><SpanishSuit suit={card.suit} size={pipSize} /></div>
      <div className="relative flex items-center justify-center flex-1 pointer-events-none"><SpanishSuit suit={card.suit} size={centerSize} /></div>
      <div className="relative flex items-center justify-end gap-0.5 leading-none rotate-180" style={{ color }}><span className="font-semibold tracking-[-0.08em]" style={{ fontSize: pipSize }}>{rank}</span><SpanishSuit suit={card.suit} size={pipSize} /></div>
    </motion.button>
  );
}
