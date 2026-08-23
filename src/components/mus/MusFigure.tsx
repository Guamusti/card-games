"use client";

import type { SpanishRank } from "@/engine/mus/types";

interface Props {
  /** 10 = Sota, 11 = Caballo, 12 = Rey. */
  rank: SpanishRank;
  height?: number;
  color: string;
  className?: string;
}

/**
 * Court-card art for the Spanish deck — Sota (plumed page), Caballo (horse),
 * Rey (crowned king). Drawn as line-art to match the suit marks, with a small
 * profile face so the courts read as people, not blobs.
 */
export default function MusFigure({ rank, height = 48, color, className }: Props) {
  const w = (height * 42) / 56;
  const on = 1.6 * 56 / height;    // ~1.6px on-screen main line
  const onThin = 1.05 * 56 / height;
  const common = { height, width: w, viewBox: "0 0 42 56", className, style: { color } } as const;
  const g = { fill: "none", stroke: "currentColor", strokeWidth: on, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const gt = { ...g, strokeWidth: onThin };
  const dot = { fill: "currentColor", stroke: "none" as const };

  if (rank === 12) {
    // Rey — jewelled crown, profile face, robed bust.
    return (
      <svg {...common}>
        <path {...g} d="M8 17 V8 L14.5 12 L21 4.5 L27.5 12 L34 8 V17Z" />
        <circle cx="8" cy="6.6" r="1.5" {...dot} />
        <circle cx="21" cy="3" r="1.6" {...dot} />
        <circle cx="34" cy="6.6" r="1.5" {...dot} />
        <path {...g} d="M8.6 17.4 H33.4 V20 H8.6Z" />
        <circle cx="21" cy="29" r="6.6" {...g} />
        <path {...gt} d="M14.6 29 l-2.4 1.7 2.4 1.4" />
        <circle cx="18.4" cy="27.6" r="0.85" {...dot} />
        <path {...gt} d="M16.4 32 H20" />
        <path {...g} d="M5.5 52 C5.5 43 12.4 37.4 21 37.4 C29.6 37.4 36.5 43 36.5 52Z" />
        <path {...gt} d="M15.5 39 L21 45.5 L26.5 39" />
      </svg>
    );
  }

  if (rank === 11) {
    // Caballo — horse head in profile with mane, ear, eye and nostril.
    return (
      <svg {...common}>
        <path {...g} d="M27.5 8 l1.7 -3.4 1.9 3.4 c1.1 1.6 1.5 3.5 1.2 5.4 l4.2 1.5 -3.6 2.6 c1.8 3 2.2 6.2 1 9.3 -1.7 4.4 -5.7 6.7 -10.7 6.9 V51 H13.4 V30.4 C13.4 22 19 14.4 27.5 8Z" />
        <circle cx="26.4" cy="15" r="1.2" {...dot} />
        <path {...gt} d="M13.6 19.2 c1.4 -.2 2.4 .4 2.8 1.6" />
        <path {...gt} d="M28 13.6 c3 1.4 4.2 4.4 3.4 7.6" />
        <path {...gt} d="M25 24 c2.4 1 3.6 3.2 3.2 6" />
        <path {...gt} d="M13.4 46 H22" />
      </svg>
    );
  }

  // Sota — page with a plumed cap and profile face.
  return (
    <svg {...common}>
      <path {...g} d="M8.5 17.5 C10.8 10.5 15.8 6.6 21 6.6 C26.2 6.6 31.2 10.5 33.5 17.5Z" />
      <path {...g} d="M30 10 C34.5 6 38.5 6.2 39.6 9.4 C37 10.4 35 12.6 34.2 15.4" />
      <circle cx="21" cy="27" r="6.4" {...g} />
      <path {...gt} d="M14.9 27 l-2.3 1.6 2.3 1.4" />
      <circle cx="18.6" cy="25.7" r="0.8" {...dot} />
      <path {...gt} d="M16.6 30 H20.2" />
      <path {...g} d="M5.5 52 C5.5 43 12.4 37.4 21 37.4 C29.6 37.4 36.5 43 36.5 52Z" />
      <path {...gt} d="M15.5 39 L21 45.5 L26.5 39" />
    </svg>
  );
}
