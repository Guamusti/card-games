"use client";

import type { SpanishSuit } from "@/engine/mus/types";

export const SUIT_COLOR: Record<SpanishSuit, string> = {
  oros: "#c8901a",
  copas: "#b8322c",
  espadas: "#2867a4",
  bastos: "#3c8459",
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
 * Spanish-deck suit marks as line-art, following the reference set:
 *  • oros  — coin with rim, rosette and shine arcs
 *  • copas — domed bowl with a little face, knopped stem, flared foot
 *  • espadas — hilt on top (bound grip + curved guard), blade pointing down
 *  • bastos — knotted cudgel, wide knobbly head over a tapered handle
 * Stroke weight is held ~constant on-screen so marks stay crisp at any size.
 */
export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const color = theme === "neon" ? NEON_SUIT_COLOR[suit] : SUIT_COLOR[suit];
  const on = 1.5 * 24 / size;
  const onThin = 1.0 * 24 / size;
  const base = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color } } as const;
  const g = { fill: "none", stroke: "currentColor", strokeWidth: on, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const gt = { ...g, strokeWidth: onThin };
  const dot = { fill: "currentColor", stroke: "none" as const };

  switch (suit) {
    // ── Oros: coin, inner ring, rosette, shine arcs ──
    case "oros":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" {...g} />
          <circle cx="12" cy="12" r="6.6" {...gt} />
          <path {...gt} d="M12 7.3 l1.15 3.55 3.55 1.15 -3.55 1.15 -1.15 3.55 -1.15 -3.55 -3.55 -1.15 3.55 -1.15Z" />
          <circle cx="12" cy="12" r="0.9" {...dot} />
          <path {...gt} d="M4.9 14.4 A7.5 7.5 0 0 0 9.6 19.1" opacity="0.85" />
          <path {...gt} d="M3.4 11.6 A8.6 8.6 0 0 0 5.2 16" opacity="0.6" />
        </svg>
      );

    // ── Copas: domed bowl with a face, knopped stem, flared foot ──
    case "copas":
      return (
        <svg {...base}>
          <path {...g} d="M4.8 5 Q12 3.2 19.2 5" />
          <path {...g} d="M4.8 5 A7.2 7.2 0 0 0 19.2 5" />
          <circle cx="9" cy="7" r="0.75" {...dot} />
          <circle cx="15" cy="7" r="0.75" {...dot} />
          <circle cx="12" cy="8.7" r="0.85" {...dot} />
          <path {...g} d="M12 12.3 V15.6" />
          <ellipse cx="12" cy="13.6" rx="1.6" ry="0.85" {...gt} />
          <path {...g} d="M7.6 19.6 C7.6 16.8 16.4 16.8 16.4 19.6" />
          <path {...gt} d="M6.9 20 H17.1" />
        </svg>
      );

    // ── Espadas: hilt on top, blade pointing down ──
    case "espadas":
      return (
        <svg {...base}>
          <circle cx="12" cy="2.4" r="1.4" {...g} />
          <path {...g} d="M12 3.8 V6.8" />
          <path {...gt} d="M10.8 4.4 L13.2 6 M10.8 5.6 L13.2 7.2" />
          <path {...g} d="M4.8 7.6 C7.6 6.9 16.4 6.9 19.2 7.6 C16.4 8.3 7.6 8.3 4.8 7.6Z" />
          <path {...gt} d="M6.6 7.2 C6 6.3 6.2 5.6 7 5.4 M17.4 7.2 C18 6.3 17.8 5.6 17 5.4" />
          <path {...g} d="M12 22.4 C10.4 18 9.8 13.2 10 8.6 L14 8.6 C14.2 13.2 13.6 18 12 22.4Z" />
          <path {...gt} d="M12 10 V20" />
        </svg>
      );

    // ── Bastos: knotted cudgel — knobbly head over a tapered handle ──
    case "bastos":
      return (
        <svg {...base}>
          <path {...g} d="M9.1 21.4 C8 22 6.7 21 7.2 19.8 L9.6 12.8 C8.6 12 8.2 10.6 8.8 8.9 C9.7 6.2 12.8 5.4 15.4 6 C18.4 6.7 19.4 9.4 18 11.6 C17 13.2 15.1 13.6 13.6 13.1 L11.3 20 C10.9 21.2 10 21.9 9.1 21.4Z" />
          <path {...gt} d="M9.2 12 c1.4 -.1 2.3 .6 2.6 1.9" />
          <path {...gt} d="M9.6 9.2 c1.1 -1 2.6 -1 3.7 0" />
          <path {...gt} d="M15 7.2 c1.3 .3 2.1 1.2 2.2 2.4" />
          <path {...gt} d="M13.4 10 c1 .2 1.6 .9 1.7 1.9" />
        </svg>
      );
  }
}
