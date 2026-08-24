"use client";

import { motion } from "framer-motion";
import type { SpanishCard, SpanishRank } from "@/engine/mus/types";
import { RANK_SHORT, RANK_LABEL, SUIT_NAME } from "@/engine/mus/types";
import SpanishSuit, { SUIT_PINTA, suitColor } from "./SpanishSuit";
import SpanishSuitSolid from "./SpanishSuitSolid";
import MusFigure from "./MusFigure";
import MusFigureSolid from "./MusFigureSolid";
import { useCustomizeStore } from "@/engine/customize/store";
import { getCardBack } from "@/engine/customize/cardBacks";

interface MusCardProps {
  card?: SpanishCard;
  hidden?: boolean;
  delay?: number;
  small?: boolean;
  mini?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  /** Winner glow when a lance is inspected at recuento. */
  highlight?: boolean;
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
  card, hidden = false, delay = 0, small = false, mini = false, selected = false, dimmed = false, highlight = false, dealFrom, onClick,
}: MusCardProps) {
  const { showCardShadow, animationSpeed, musDeckTheme, cardBack } = useCustomizeStore();
  const neon = musDeckTheme === "neon";
  const minimal = musDeckTheme === "minimal";
  const silueta = musDeckTheme === "silueta";
  const tradicional = musDeckTheme === "tradicional";
  const glow = highlight ? "ring-2 ring-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.8)] z-10 animate-pulse" : "";
  const dur = animationSpeed === "fast" ? 0.28 : animationSpeed === "slow" ? 0.55 : 0.38;
  const sizeClass = mini ? "mus-card-mini" : small ? "mus-card-sm" : "mus-card";
  const origin = dealOrigin(dealFrom);
  // Deal-in: fly from the deck at centre with a slight arc and spin.
  const dealInitial = { opacity: 0, scale: 0.72, x: origin.x, y: origin.y, rotate: origin.rotate };
  // Throw-out: drift back toward centre and fade (used when a card is discarded).
  const dealExit = { opacity: 0, scale: 0.62, x: origin.x * 0.55, y: origin.y * 0.55, rotate: origin.rotate * 0.6, transition: { duration: dur * 0.7, ease: [0.4, 0, 1, 1] as const } };
  const dealTransition = { duration: dur * 1.25, delay, ease: [0.16, 1, 0.3, 1] as const };

  // ── Face down — uses the card back chosen in the cosmetics shop ──
  if (hidden || !card) {
    const back = getCardBack(cardBack);
    const labelSize = mini ? 9 : small ? 13 : 18;
    return (
      <motion.div
        initial={dealInitial}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
        exit={dealExit}
        transition={dealTransition}
        className={`${sizeClass} relative overflow-hidden rounded-[0.65rem] border border-black/40 select-none ${glow} ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.22)]" : ""}`}
        style={{ background: back.bg }}
      >
        {back.pattern && <div aria-hidden className="absolute inset-0" style={{ backgroundImage: back.pattern }} />}
        <div aria-hidden className="absolute rounded-[0.42rem] border border-white/15" style={{ inset: mini ? 3 : 4 }} />
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <span className="font-semibold" style={{ color: back.labelColor, fontSize: labelSize }}>{back.label}</span>
        </div>
      </motion.div>
    );
  }

  // ── Image decks: Tradicional (Wikimedia) & Neón (line-art) ──
  if (tradicional || neon) {
    const folder = neon ? "neon" : "classic";
    return (
      <motion.button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        initial={dealInitial}
        animate={{ opacity: dimmed ? 0.4 : 1, scale: 1, x: 0, y: selected ? -12 : 0, rotate: 0 }}
        exit={dealExit}
        transition={dealTransition}
        className={`${sizeClass} relative overflow-hidden rounded-[0.55rem] border select-none transition-colors ${glow} ${selected ? "border-accent ring-2 ring-accent" : neon ? "border-white/15" : "border-black/15"} ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.2)]" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
        style={{ background: neon ? "#0a0d10" : "#fff" }}
        title={`${RANK_LABEL[card.rank]} de ${SUIT_NAME[card.suit]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/mus/${folder}/${card.suit}_${card.rank}.webp`} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      </motion.button>
    );
  }

  const solid = silueta;
  const color = suitColor(card.suit, silueta ? "classic" : musDeckTheme);
  const rank = RANK_SHORT[card.rank];
  const isFigure = card.rank >= 10;
  const indexSize = mini ? 8 : small ? 11 : 14;
  const pintaCount = SUIT_PINTA[card.suit];
  const pintaW = mini ? 3 : small ? 4 : 5;
  const pintaH = mini ? 1.1 : 1.6;
  const title = `${RANK_LABEL[card.rank]} de ${SUIT_NAME[card.suit]}`;

  const pipSuit = (sz: number) =>
    solid ? <SpanishSuitSolid suit={card.suit} size={sz} color={color} /> : <SpanishSuit suit={card.suit} size={sz} theme={musDeckTheme} />;

  // Mini cards drop the pip layout — at that size only one clear mark reads.
  const body = mini ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {pipSuit(18)}
    </div>
  ) : isFigure ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {solid
        ? <MusFigureSolid rank={card.rank} height={small ? 38 : 50} color={color} />
        : <MusFigure rank={card.rank} suit={card.suit} height={small ? 40 : 54} color={color} />}
    </div>
  ) : (
    <div className="absolute inset-0 pointer-events-none">
      {(PIP_LAYOUT[card.rank] ?? []).map(([x, y], i) => (
        <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
          {pipSuit(card.rank <= 3 ? (small ? 19 : 25) : small ? 12 : 16)}
        </span>
      ))}
    </div>
  );

  // Corner "pinta": the rank number followed by N little dashes that identify
  // the suit (oros 1, copas 2, espadas 3, bastos 4) — as on a real Spanish deck.
  const cornerIndex = (rotated: boolean) => (
    <div
      className={`absolute flex items-start gap-[2px] leading-none ${rotated ? "rotate-180" : ""}`}
      style={{ color, [rotated ? "right" : "left"]: mini ? 2 : 4, [rotated ? "bottom" : "top"]: mini ? 2 : 3 }}
    >
      <span className="font-semibold tracking-[-0.06em]" style={{ fontSize: indexSize }}>{rank}</span>
      <span className="flex flex-col gap-[2px]" style={{ marginTop: mini ? 1 : 2 }}>
        {Array.from({ length: pintaCount }, (_, i) => (
          <span key={i} className="rounded-full" style={{ width: pintaW, height: pintaH, background: "currentColor" }} />
        ))}
      </span>
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
          : minimal
          ? `bg-white ${selected ? "border-accent ring-2 ring-accent" : "border-[#e6e4df]"}`
          : `${selected ? "border-accent ring-2 ring-accent" : "border-[#c9c2b5]"}`
      } ${glow} ${showCardShadow ? "shadow-[0_4px_10px_rgba(0,0,0,0.18)]" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={neon ? undefined : minimal ? { background: "#ffffff" } : { background: "linear-gradient(160deg, #fdfbf4 0%, #f4efe1 100%)" }}
      title={title}
    >
      {/* Inner rule, as on a printed card. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute rounded-[0.45rem] border ${neon ? "border-dashed" : ""}`}
        style={{ inset: mini ? 2 : 3, borderColor: neon ? `${color}aa` : minimal ? "#eeeeee" : "#d9d1c2" }}
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
