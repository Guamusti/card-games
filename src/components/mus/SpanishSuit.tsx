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

/** Pinta count: how many corner marks identify each suit on a Spanish deck. */
export const SUIT_PINTA: Record<SpanishSuit, number> = {
  oros: 1,
  copas: 2,
  espadas: 3,
  bastos: 4,
};

interface Props {
  suit: SpanishSuit;
  size?: number;
  className?: string;
  theme?: "classic" | "neon";
}

/**
 * Spanish-deck suit marks.
 *  • classic → solid silhouettes with punched detail (evenodd), legible even
 *    at pip sizes on a light card.
 *  • neon → line-art outlines in the suit colour, matching the dark deck.
 */
export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const neon = theme === "neon";
  const color = neon ? NEON_SUIT_COLOR[suit] : SUIT_COLOR[suit];
  const stroke = Math.max(1.1, 24 / size * 1.3); // ~constant on-screen line weight
  const base = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color } } as const;
  const line = { fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const solid = { fill: "currentColor" };

  switch (suit) {
    // ── Oros: milled coin, inner ring, rosette ──
    case "oros":
      return neon ? (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" {...line} />
          <circle cx="12" cy="12" r="6.3" {...line} strokeWidth={stroke * 0.8} />
          <path d="M12 7.4 l1.1 3.5 3.5 1.1 -3.5 1.1 -1.1 3.5 -1.1 -3.5 -3.5 -1.1 3.5 -1.1Z" {...line} strokeWidth={stroke * 0.8} />
        </svg>
      ) : (
        <svg {...base}>
          <path {...solid} fillRule="evenodd" d="M12 1.6a10.4 10.4 0 1 0 0 20.8 10.4 10.4 0 0 0 0-20.8Zm0 3.4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z" />
          <path {...solid} d="M12 6.6 l1.35 4.05 4.05 1.35 -4.05 1.35 -1.35 4.05 -1.35 -4.05 -4.05 -1.35 4.05 -1.35Z" />
        </svg>
      );

    // ── Copas: decorated bowl, knopped stem, footed base ──
    case "copas":
      return neon ? (
        <svg {...base}>
          <path {...line} d="M5 3 H19 V5.6 C19 10 15.9 13.4 12 13.4 S5 10 5 5.6 Z" />
          <path {...line} d="M5.4 6.3 H18.6" strokeWidth={stroke * 0.75} />
          <circle cx="9.2" cy="8.2" r="0.6" {...solid} />
          <circle cx="14.8" cy="8.2" r="0.6" {...solid} />
          <circle cx="12" cy="9.9" r="0.7" {...solid} />
          <path {...line} d="M12 13.4 V17.6" />
          <ellipse cx="12" cy="13.8" rx="1.3" ry="0.7" {...line} strokeWidth={stroke * 0.8} />
          <path {...line} d="M7.4 20 C7.4 18 9.4 17.6 12 17.6 S16.6 18 16.6 20 Z" />
        </svg>
      ) : (
        <svg {...base}>
          <path {...solid} fillRule="evenodd" d="M4.6 2.6 H19.4 V5.6 C19.4 10 16.6 13.3 13 13.85 V17.7 H16.2 V19.4 H7.8 V17.7 H11 V13.85 C7.4 13.3 4.6 10 4.6 5.6 Z M9 7.4a0.85 0.85 0 1 0 0 1.7 0.85 0.85 0 0 0 0-1.7Z M15 7.4a0.85 0.85 0 1 0 0 1.7 0.85 0.85 0 0 0 0-1.7Z M12 9.3a0.9 0.9 0 1 0 0 1.8 0.9 0.9 0 0 0 0-1.8Z" />
          <ellipse cx="12" cy="20.5" rx="6.2" ry="1.5" {...solid} />
        </svg>
      );

    // ── Espadas: leaf blade, crossguard, grip, pommel ──
    case "espadas":
      return neon ? (
        <svg {...base}>
          <path {...line} d="M12 1.6 C13.4 5 14 8.4 14 11.8 H10 C10 8.4 10.6 5 12 1.6Z" />
          <path {...line} d="M4.6 12.6 H19.4" strokeWidth={stroke * 1.05} />
          <path {...line} d="M12 14.4 V18.6" />
          <circle cx="12" cy="20.2" r="1.7" {...line} strokeWidth={stroke * 0.9} />
        </svg>
      ) : (
        <svg {...base}>
          <path {...solid} d="M12 1.4 C13.6 5 14.3 8.6 14.3 12.2 H9.7 C9.7 8.6 10.4 5 12 1.4Z" />
          <rect x="4.3" y="12.2" width="15.4" height="2.3" rx="1.15" {...solid} />
          <rect x="10.9" y="14.5" width="2.2" height="4.4" {...solid} />
          <circle cx="12" cy="20.3" r="2" {...solid} />
        </svg>
      );

    // ── Bastos: knotted cudgel ──
    case "bastos":
      return neon ? (
        <svg {...base}>
          <path {...line} d="M5 19 L16 6.4 a2.4 2.4 0 0 1 3.4 3.4 L6.9 20.7 a1.6 1.6 0 0 1 -1.9 -2.7Z" />
          <path {...line} d="M8.4 15.8 l2.2 1.9" strokeWidth={stroke * 0.8} />
          <path {...line} d="M12.4 11.2 l2.2 1.9" strokeWidth={stroke * 0.8} />
          <path {...line} d="M16 6.9 l2 1.7" strokeWidth={stroke * 0.8} />
        </svg>
      ) : (
        <svg {...base}>
          <path {...solid} d="M4.6 18.4 L16.2 4.2 a2.5 2.5 0 0 1 3.6 3.4 L7 20.8 a1.7 1.7 0 0 1 -2.4 -2.4Z" />
          <path {...solid} d="M7 13.6 l3.2 2.7 -1.6 1.9 -3.2 -2.7Z" />
          <path {...solid} d="M11.5 8.2 l3.2 2.7 -1.6 1.9 -3.2 -2.7Z" />
        </svg>
      );
  }
}
