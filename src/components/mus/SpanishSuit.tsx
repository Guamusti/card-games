"use client";

import type { SpanishSuit } from "@/engine/mus/types";

export const SUIT_COLOR: Record<SpanishSuit, string> = {
  oros: "#b8860f",
  copas: "#a82f2a",
  espadas: "#255a92",
  bastos: "#37704f",
};

export const NEON_SUIT_COLOR: Record<SpanishSuit, string> = {
  oros: "#f2df36",
  copas: "#ff706b",
  espadas: "#78d8f5",
  bastos: "#8bd650",
};

interface Props {
  suit: SpanishSuit;
  size?: number;
  className?: string;
  theme?: "classic" | "neon";
}

/**
 * Spanish-deck suit marks, drawn as solid silhouettes so they stay legible
 * down to ~10px (corner indices) and still hold detail at pip size.
 */
export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const color = theme === "neon" ? NEON_SUIT_COLOR[suit] : SUIT_COLOR[suit];
  const common = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color }, fill: "currentColor" } as const;

  switch (suit) {
    // Coin: milled rim, inner ring and a four-point rosette.
    case "oros":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10.2" fill="currentColor" opacity="0.16" />
          <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6.9" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <path d="M12 4.9 l1.55 5.56 5.56 1.55 -5.56 1.55 -1.55 5.56 -1.55 -5.56 -5.56 -1.55 5.56 -1.55Z" />
        </svg>
      );
    // Chalice: wide bowl, stem and footed base.
    case "copas":
      return (
        <svg {...common}>
          <path d="M4.4 2.6 H19.6 V5.7 C19.6 10.2 16.8 13.4 13.2 13.9 V17.9 H16.4 V19.6 H7.6 V17.9 H10.8 V13.9 C7.2 13.4 4.4 10.2 4.4 5.7 Z" />
          <ellipse cx="12" cy="20.6" rx="6.4" ry="1.6" />
        </svg>
      );
    // Sword: tapered blade, straight crossguard, grip and round pommel.
    case "espadas":
      return (
        <svg {...common}>
          <path d="M12 1.4 L14.2 6.4 V12.3 H9.8 V6.4 Z" />
          <rect x="4.3" y="12.3" width="15.4" height="2.3" rx="1.15" />
          <rect x="10.8" y="14.6" width="2.4" height="4.2" />
          <circle cx="12" cy="20.3" r="2" />
        </svg>
      );
    // Club: knotted cudgel on the diagonal.
    case "bastos":
      return (
        <svg {...common}>
          <path d="M4.4 18.2 L16.5 3.9 a2.5 2.5 0 0 1 3.6 3.4 L6.7 20.6 a1.7 1.7 0 0 1 -2.3 -2.4 Z" />
          <path d="M6.9 13.2 l3.4 2.8 -1.7 2 -3.4 -2.8 Z" />
          <path d="M11.6 7.8 l3.4 2.8 -1.7 2 -3.4 -2.8 Z" />
        </svg>
      );
  }
}
