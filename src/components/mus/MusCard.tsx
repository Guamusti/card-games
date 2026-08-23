"use client";

import { motion } from "framer-motion";
import type { SpanishCard, SpanishRank } from "@/engine/mus/types";
import { RANK_SHORT, RANK_LABEL, SUIT_NAME } from "@/engine/mus/types";
import SpanishSuit, { SUIT_COLOR, NEON_SUIT_COLOR } from "./SpanishSuit";
import MusFigure from "./MusFigure";
import { useCustomizeStore } from "@/engine/customize/store";

interface MusCardProps {
  card?: SpanishCard;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
  mini?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  /** Where the card flies in from (the deck sits at table centre). */
  dealFrom?: "top" | "bottom" | "left" | "right";
  onClick?: () => void;
}

/** Off-screen origin for the deal, relative to the card's resting spot. */
function dealOrigin(dir?: MusCardProps["dealFrom"]): { x: number; y: number; rotate: number } {
  switch (dir) {
    case "top": return { x: 0, y: 150, rotate: -6 };     // partner: from centre, below
    case "left": return { x: 150, y: -30, rotate: 8 };   // left seat: from centre, right
    case "right": return { x: -150, y: -30, rotate: -8 }; // right seat: from centre, left
    case "bottom":
    default: return { x: 0, y: -170, rotate: 5 };        // you: from centre, above
  }
}

/**
 * Pip positions (percentages of the card body) for the numbered ranks,
 * following the layout used on a real Spanish deck.
 */
const PIP_LAYOUT: Partial<Record<SpanishRank, [number, number][]>> = {
  1: [[50, 50]],
  2: [[50, 22], [50, 78]],
  3: [[50, 17], [50, 50], [50, 83]],
  4: [[27, 21], [73, 21], [27, 79], [73, 79]],
  5: [[27, 19], [73, 19], [50, 50], [27, 81], [73, 81]],
  6: [[27, 17], [73, 17], [27, 50], [73, 50], [27, 83], [73, 83]],
  7: [[27, 16], [73, 16], [50, 33], [27, 51], [73, 51], [27, 84], [73, 84]],
};

export default function MusCard({
  card, hidden = false, delay = 0, small = false, mini = false, selected = false, dimmed = false, dealFrom, onClick,
}: MusCardProps) {
  const { showCardShadow, animationSpeed, musDeckTheme } = useCustomizeStore();
  const neon = musDeckTheme === "neon";
  const dur = animationSpeed === "fast" ? 0.28 : animationSpeed === "slow" ? 0.55 : 0.38;
  const sizeClass = mini ? "mus-card-mini" : small ? "mus-card-sm" : "mus-card";
  const origin = dealOrigin(dealFrom);
  // Deal-in: fly from the deck at centre with a slight arc and spin.
  const dealInitial = { opacity: 0, scale: 0.72, x: origin.x, y: origin.y, rotate: origin.rotate };
  // Throw-out: drift back toward centre and fade (used when a card is discarded).
  const dealExit = { opacity: 0, scale: 0.62, x: origin.x * 0.55, y: origin.y * 0.55, rotate: origin.rotate * 0.6, transition: { duration: dur * 0.7, ease: [0.4, 0, 1, 1] as const } };
  const dealTransition = { duration: dur * 1.25, delay, ease: [0.16, 1, 0.3, 1] as const };

  // ── Face down ─────────────────────────────────────────────
  if (hidden || !card) {
    const lattice = neon
      ? "repeating-linear-gradient(45deg, rgba(120,216,245,0.16) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(120,216,245,0.16) 0 2px, transparent 2px 7px)"
      : "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.10) 0 2px, transparent 2px 7px)";
    return (
      <motion.div
        initial={dealInitial}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
        exit={dealExit}
        transition={dealTransition}
        className={`${sizeClass} relative overflow-hidden rounded-[0.65rem] border select-none ${neon ? "border-white/20" : "border-[#5f121b]"} ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.22)]" : ""}`}
        style={{ background: neon ? "#0a0d10" : "#8a1f2a" }}
      >
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: lattice }} />
        <div aria-hidden className={`absolute rounded-[0.42rem] border ${neon ? "border-white/20" : "border-white/30"}`} style={{ inset: mini ? 3 : 4 }} />
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <div className={`rotate-45 border ${neon ? "border-[#78d8f5]/50" : "border-white/35"}`} style={{ width: mini ? 10 : small ? 16 : 22, height: mini ? 10 : small ? 16 : 22 }} />
        </div>
      </motion.div>
    );
  }

  const color = neon ? NEON_SUIT_COLOR[card.suit] : SUIT_COLOR[card.suit];
  const rank = RANK_SHORT[card.rank];
  const isFigure = card.rank >= 10;
  const indexSize = mini ? 8 : small ? 11 : 14;
  const cornerSuit = mini ? 7 : small ? 9 : 11;
  const title = `${RANK_LABEL[card.rank]} de ${SUIT_NAME[card.suit]}`;

  // Mini cards drop the pip layout — at that size only one clear mark reads.
  const body = mini ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <SpanishSuit suit={card.suit} size={18} theme={musDeckTheme} />
    </div>
  ) : isFigure ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <MusFigure rank={card.rank} height={small ? 34 : 46} color={color} />
    </div>
  ) : (
    <div className="absolute inset-0 pointer-events-none">
      {(PIP_LAYOUT[card.rank] ?? []).map(([x, y], i) => (
        <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
          <SpanishSuit
            suit={card.suit}
            size={card.rank <= 3 ? (small ? 19 : 25) : small ? 12 : 16}
            theme={musDeckTheme}
          />
        </span>
      ))}
    </div>
  );

  const cornerIndex = (rotated: boolean) => (
    <div
      className={`absolute flex flex-col items-center leading-none ${rotated ? "rotate-180" : ""}`}
      style={{ color, [rotated ? "right" : "left"]: mini ? 2 : 4, [rotated ? "bottom" : "top"]: mini ? 2 : 3 }}
    >
      <span className="font-semibold tracking-[-0.06em]" style={{ fontSize: indexSize }}>{rank}</span>
      <SpanishSuit suit={card.suit} size={cornerSuit} theme={musDeckTheme} />
    </div>
  );

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={dealInitial}
      animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, x: 0, y: selected ? -12 : 0, rotate: selected && neon ? -2 : 0 }}
      exit={dealExit}
      transition={dealTransition}
      className={`${sizeClass} relative overflow-hidden rounded-[0.65rem] border select-none transition-colors ${
        neon
          ? `bg-[#080909] ${selected ? "border-white ring-2 ring-white/70" : "border-white/25"}`
          : `${selected ? "border-accent ring-2 ring-accent" : "border-[#c9c2b5]"}`
      } ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.18)]" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={neon ? undefined : { background: "linear-gradient(160deg, #fdfbf4 0%, #f4efe1 100%)" }}
      title={title}
    >
      {/* Inner rule, as on a printed card. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute rounded-[0.45rem] border ${neon ? "border-dashed" : ""}`}
        style={{ inset: mini ? 2 : 3, borderColor: neon ? `${color}aa` : "#d9d1c2" }}
      />
      {/* Court cards get a tinted panel so they read apart from the numbers. */}
      {isFigure && !mini && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[0.3rem]"
          style={{ inset: small ? 7 : 9, background: neon ? `${color}14` : `${color}12`, border: `1px solid ${color}33` }}
        />
      )}
      {body}
      {cornerIndex(false)}
      {cornerIndex(true)}
    </motion.button>
  );
}
