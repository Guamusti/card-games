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
 * Court-card silhouettes for the Spanish deck. Stylised rather than
 * illustrated so they stay readable at the small table sizes and match the
 * flat, single-colour suit marks.
 */
export default function MusFigure({ rank, height = 48, color, className }: Props) {
  const common = {
    height,
    width: (height * 40) / 56,
    viewBox: "0 0 40 56",
    className,
    style: { color },
    fill: "currentColor",
  } as const;

  if (rank === 12) {
    // Rey — crowned bust.
    return (
      <svg {...common}>
        <path d="M9.4 15.6 V6.2 l5.6 4.4 L20 3.4 l5 7.2 5.6 -4.4 v9.4 Z" />
        <rect x="9" y="16.6" width="22" height="3.4" rx="1.2" />
        <circle cx="20" cy="27.4" r="6.4" />
        <path d="M6.6 50 c0 -8 6 -13 13.4 -13 s13.4 5 13.4 13 Z" />
        <rect x="18.8" y="34.2" width="2.4" height="6.4" opacity="0.55" />
      </svg>
    );
  }

  if (rank === 11) {
    // Caballo — horse head and neck.
    return (
      <svg {...common}>
        <path d="M25.6 7.4 l1.4 4.6 5 1.9 -3.6 2.9 c1.9 2.7 2.5 5.3 1.8 8.2 -1 4.4 -4.6 7 -9.4 7.5 V50 H13.4 V29.6 c0 -7.7 4.9 -14.3 12.2 -16.6 Z" />
        <circle cx="24.8" cy="15.6" r="1.5" fill="#fdfbf4" />
        <path d="M13.4 50 h9.4 v3.2 h-9.4 Z" opacity="0.5" />
      </svg>
    );
  }

  // Sota — page with plumed hat.
  return (
    <svg {...common}>
      <path d="M8.6 16.4 c1.9 -6 6.2 -9.6 11.4 -9.6 s9.5 3.6 11.4 9.6 Z" />
      <path d="M28.4 8.6 c3.4 -2.6 5.6 -2.4 6.8 -0.4 -2 1 -3.4 2.6 -4.2 4.6 Z" opacity="0.6" />
      <circle cx="20" cy="25.2" r="6" />
      <path d="M6.6 50 c0 -8 6 -13.2 13.4 -13.2 s13.4 5.2 13.4 13.2 Z" />
      <path d="M15.6 36.4 l4.4 5 4.4 -5 -4.4 -1.6 Z" fill="#fdfbf4" opacity="0.85" />
    </svg>
  );
}
