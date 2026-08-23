"use client";

import type { SpanishRank } from "@/engine/mus/types";

interface Props {
  /** 10 = Sota, 11 = Caballo, 12 = Rey. */
  rank: SpanishRank;
  height?: number;
  color: string;
  /** Neon deck renders the figure as line-art instead of a silhouette. */
  outline?: boolean;
  className?: string;
}

/**
 * Court-card art for the Spanish deck — Sota (plumed page), Caballo (horse),
 * Rey (crowned bust). Stylised to stay readable at table sizes and to match
 * the flat suit marks. Solid for the classic deck, line-art for neon.
 */
export default function MusFigure({ rank, height = 48, color, outline = false, className }: Props) {
  const w = (height * 42) / 56;
  const common = { height, width: w, viewBox: "0 0 42 56", className, style: { color } } as const;
  const paint = outline
    ? { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }
    : { fill: "currentColor" };
  const thin = outline
    ? { ...paint, strokeWidth: 1.2 }
    : { fill: "#00000000", stroke: "currentColor", strokeWidth: 0 };

  if (rank === 12) {
    // Rey — crown with jewels over a robed bust.
    return (
      <svg {...common}>
        <path {...paint} d="M9 15 V6 l6 4.4 L21 3 l6 7.4 6 -4.4 V15Z" />
        <circle {...paint} cx="9" cy="4.6" r="1.4" />
        <circle {...paint} cx="21" cy="1.8" r="1.4" />
        <circle {...paint} cx="33" cy="4.6" r="1.4" />
        <rect {...paint} x="8.4" y="16.4" width="25.2" height="3.4" rx="1.2" />
        <circle {...paint} cx="21" cy="28" r="6.4" />
        <path {...paint} d="M6 51 C6 42.5 12.7 37.4 21 37.4 S36 42.5 36 51Z" />
        <path {...thin} d="M21 34.4 V44" />
      </svg>
    );
  }

  if (rank === 11) {
    // Caballo — horse head, arched neck and mane.
    return (
      <svg {...common}>
        <path {...paint} d="M27 6 l1.6 5 5.4 2.1 -3.9 3.1 c2 2.9 2.6 5.8 1.8 8.9 -1.2 4.8 -5.1 7.6 -10.3 8.1 V51 H13.2 V30.5 C13.2 22 18.8 14.6 27 12 Z" />
        <circle cx="26.4" cy="15.2" r="1.5" fill={outline ? "currentColor" : "#0c0f10"} />
        <path {...thin} d="M27 6 c3.4 .6 5 3 5.2 6" />
        <path {...thin} d="M13.2 46 H23" />
      </svg>
    );
  }

  // Sota — page with a plumed cap.
  return (
    <svg {...common}>
      <path {...paint} d="M9 17 C11 10.6 15.6 6.6 21 6.6 S31 10.6 33 17Z" />
      <path {...thin} d="M30 9 C34 6 37 6.4 38.4 9 c-2.2 1.1 -3.8 3 -4.6 5.2" />
      <circle {...paint} cx="21" cy="26.6" r="6.2" />
      <path {...paint} d="M6 51 C6 42.5 12.7 37.4 21 37.4 S36 42.5 36 51Z" />
      <path {...thin} d="M16 39 L21 44.4 L26 39" />
    </svg>
  );
}
