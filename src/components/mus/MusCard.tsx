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

function pipCount(rank: SpanishCard["rank"]) {
  return rank <= 7 ? rank : 1;
}

export default function MusCard({
  card, hidden = false, delay = 0, small = false, mini = false, selected = false, dimmed = false, onClick,
}: MusCardProps) {
  const { showCardShadow, animationSpeed } = useCustomizeStore();
  const dur = animationSpeed === "fast" ? 0.28 : animationSpeed === "slow" ? 0.55 : 0.38;
  const sizeClass = mini ? "mus-card-mini" : small ? "mus-card-sm" : "mus-card";

  if (hidden || !card) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.58, x: 28, y: -72, rotate: 8 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
        transition={{ duration: dur * 1.35, delay, ease: [0.16, 1, 0.3, 1] }}
        className={`${sizeClass} rounded-md border border-white/15 flex items-center justify-center select-none`}
        style={{
          background: "repeating-linear-gradient(45deg, #7a1420 0 6px, #641019 6px 12px)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </motion.div>
    );
  }

  const color = SUIT_COLOR[card.suit];
  const rank = RANK_SHORT[card.rank];
  const pipSize = mini ? 9 : small ? 13 : 20;
  const centerSize = mini ? 17 : small ? 24 : 34;
  const pips = pipCount(card.rank);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, scale: 0.58, x: 28, y: -82, rotate: 9 }}
      animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, x: 0, y: selected ? -12 : 0, rotate: selected ? -2 : 0 }}
      exit={{ opacity: 0, scale: 0.45, x: -34, y: -100, rotate: -14, transition: { duration: dur * 0.8, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: dur * 1.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${sizeClass} relative overflow-hidden rounded-[0.8rem] border bg-[#080909] flex flex-col justify-between select-none transition-colors ${
        selected ? "border-white ring-2 ring-white/70" : "border-white/25"
      } ${showCardShadow ? "shadow-sm" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={{ padding: mini ? 2 : small ? 3 : 4, boxShadow: showCardShadow ? `0 5px 14px ${color}22` : undefined }}
      title={`${RANK_SHORT[card.rank]} de ${SUIT_NAME[card.suit]}`}
    >
      <div className="absolute inset-1 rounded-[0.55rem] border border-dashed opacity-80" style={{ borderColor: color }} />
      <div className="relative flex items-center gap-0.5 leading-none" style={{ color }}>
        <span className="font-light" style={{ fontSize: pipSize }}>{rank}</span>
      </div>
      <div className="relative grid flex-1 grid-cols-2 content-center items-center justify-items-center gap-0.5 px-1 pointer-events-none">
        {Array.from({ length: pips }, (_, index) => (
          <SpanishSuit key={index} suit={card.suit} size={centerSize} />
        ))}
      </div>
      <div className="relative flex items-center justify-end leading-none rotate-180" style={{ color }}>
        <span className="font-light" style={{ fontSize: pipSize }}>{rank}</span>
      </div>
    </motion.button>
  );
}
