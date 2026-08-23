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
  const { showCardShadow, animationSpeed } = useCustomizeStore();
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

  return (
    <motion.button type="button" onClick={onClick} disabled={!onClick} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, y: selected ? -12 : 0 }} transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }} className={`${sizeClass} relative rounded-md border bg-[#fbfaf6] flex flex-col justify-between select-none transition-colors ${selected ? "border-accent ring-2 ring-accent" : "border-black/15"} ${showCardShadow ? "shadow-sm" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`} style={{ padding: mini ? 2 : small ? 3 : 4 }} title={`${RANK_SHORT[card.rank]} de ${SUIT_NAME[card.suit]}`}>
      <div className="flex items-center gap-0.5 leading-none" style={{ color }}><span className="font-bold" style={{ fontSize: pipSize }}>{rank}</span><SpanishSuit suit={card.suit} size={pipSize} /></div>
      <div className="flex items-center justify-center flex-1 pointer-events-none"><SpanishSuit suit={card.suit} size={centerSize} /></div>
      <div className="flex items-center justify-end gap-0.5 leading-none rotate-180" style={{ color }}><span className="font-bold" style={{ fontSize: pipSize }}>{rank}</span><SpanishSuit suit={card.suit} size={pipSize} /></div>
    </motion.button>
  );
}
