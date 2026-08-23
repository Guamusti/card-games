"use client";

import { motion } from "framer-motion";
import type { SpanishCard, SpanishSuit } from "@/engine/mus/types";
import { RANK_SHORT, SUIT_NAME } from "@/engine/mus/types";
import { suitColor } from "@/engine/types";
import { useCustomizeStore } from "@/engine/customize/store";
import { getCardBack } from "@/engine/customize/cardBacks";

// Spanish palos map to the French suit glyphs the rest of the app already styles:
// Oros→♦, Copas→♥, Espadas→♠, Bastos→♣ (the classic correspondence).
const SUIT_GLYPH: Record<SpanishSuit, string> = {
  oros: "♦",
  copas: "♥",
  espadas: "♠",
  bastos: "♣",
};

interface MusCardProps {
  card?: SpanishCard;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

export default function MusCard({
  card, hidden = false, delay = 0, small = false, selected = false, dimmed = false, onClick,
}: MusCardProps) {
  const { cardBack, showCardShadow, animationSpeed } = useCustomizeStore();
  const back = getCardBack(cardBack);
  const dur = animationSpeed === "fast" ? 0.3 : animationSpeed === "slow" ? 0.6 : 0.4;
  const sizeClass = small ? "poker-card-sm" : "card-size";

  if (hidden || !card) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`${sizeClass} rounded-lg border border-border flex items-center justify-center select-none`}
        style={{ backgroundColor: back.bg, backgroundImage: back.pattern || undefined }}
      >
        <span className="text-[10px] font-medium tracking-widest" style={{ color: back.labelColor }}>
          {back.label}
        </span>
      </motion.div>
    );
  }

  const glyph = SUIT_GLYPH[card.suit];
  const color = suitColor(mapSuit(card.suit));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: dimmed ? 0.4 : 1,
        scale: 1,
        y: selected ? -10 : 0,
      }}
      transition={{ duration: dur, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${sizeClass} relative rounded-lg border bg-surface flex flex-col justify-between p-1.5 sm:p-2 select-none transition-colors ${
        selected ? "border-accent ring-2 ring-accent" : "border-border"
      } ${showCardShadow ? "shadow-sm" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      title={`${RANK_SHORT[card.rank]} de ${SUIT_NAME[card.suit]}`}
    >
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span className="card-rank font-semibold">{RANK_SHORT[card.rank]}</span>
        <span className="card-suit -mt-px">{glyph}</span>
      </div>
      <div className="flex items-center justify-center flex-1 pointer-events-none">
        <span className="card-center-suit opacity-10" style={{ color }}>{glyph}</span>
      </div>
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color }}>
        <span className="card-rank font-semibold">{RANK_SHORT[card.rank]}</span>
        <span className="card-suit -mt-px">{glyph}</span>
      </div>
    </motion.button>
  );
}

// suitColor() keys off the French glyph, so translate the palo for coloring.
function mapSuit(s: SpanishSuit): string {
  return SUIT_GLYPH[s];
}
