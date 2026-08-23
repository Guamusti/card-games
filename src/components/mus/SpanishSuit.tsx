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
 * Spanish-deck suit marks, drawn as line-art in the suit colour — the way a
 * real Spanish deck is printed. Stroke weight is kept ~constant on-screen so
 * the marks stay crisp from the corner pinta up to the big centre pip.
 */
export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const color = theme === "neon" ? NEON_SUIT_COLOR[suit] : SUIT_COLOR[suit];
  const on = 1.5 * 24 / size;          // ~1.5px on-screen main line
  const onThin = 1.05 * 24 / size;     // ~1.05px on-screen detail line
  const base = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color } } as const;
  const g = { fill: "none", stroke: "currentColor", strokeWidth: on, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const gt = { ...g, strokeWidth: onThin };
  const dot = { fill: "currentColor", stroke: "none" as const };

  switch (suit) {
    // ── Oros: milled coin, inner ring, rosette ──
    case "oros":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" {...g} />
          <circle cx="12" cy="12" r="6.6" {...gt} />
          <path {...gt} d="M12 7.3 l1.15 3.55 3.55 1.15 -3.55 1.15 -1.15 3.55 -1.15 -3.55 -3.55 -1.15 3.55 -1.15Z" />
          <circle cx="12" cy="12" r="0.9" {...dot} />
        </svg>
      );

    // ── Copas: decorated bowl, knopped stem, footed base ──
    case "copas":
      return (
        <svg {...base}>
          <path {...g} d="M4.6 4.4 C4.9 9.6 8 12.9 12 12.9 C16 12.9 19.1 9.6 19.4 4.4Z" />
          <path {...gt} d="M4.7 4.9 C7 6.4 17 6.4 19.3 4.9" />
          <circle cx="9.1" cy="7.4" r="0.75" {...dot} />
          <circle cx="14.9" cy="7.4" r="0.75" {...dot} />
          <circle cx="12" cy="9" r="0.85" {...dot} />
          <path {...g} d="M12 12.9 V16.6" />
          <ellipse cx="12" cy="14.2" rx="1.5" ry="0.9" {...gt} />
          <path {...g} d="M7.7 20 C7.7 17.9 9.6 16.9 12 16.9 C14.4 16.9 16.3 17.9 16.3 20Z" />
        </svg>
      );

    // ── Espadas: leaf blade with ridge, crossguard, bound grip, pommel ──
    case "espadas":
      return (
        <svg {...base}>
          <path {...g} d="M12 1.5 C13.7 5 14.4 8.4 14.2 11.8 L9.8 11.8 C9.6 8.4 10.3 5 12 1.5Z" />
          <path {...gt} d="M12 3.4 V11.4" />
          <path {...g} d="M4.7 12.8 C7.5 12.2 16.5 12.2 19.3 12.8 C16.5 13.4 7.5 13.4 4.7 12.8Z" />
          <path {...g} d="M12 14 V18.2" />
          <path {...gt} d="M10.7 15.2 H13.3 M10.7 16.6 H13.3" />
          <circle cx="12" cy="19.8" r="1.7" {...g} />
        </svg>
      );

    // ── Bastos: knotted cudgel, wider crown, cut marks ──
    case "bastos":
      return (
        <svg {...base}>
          <path {...g} d="M5.9 20.6 C4.8 21.2 3.4 20.2 3.9 19 L12.7 8 C13.4 6 16.9 5.7 18.4 7.6 C19.7 9.3 18.6 11.7 16.5 12.1 Z" />
          <path {...gt} d="M8 16.6 l2.4 2" />
          <path {...gt} d="M11.4 12.3 l2.4 2" />
          <path {...gt} d="M15.2 8.6 c1 .2 1.7 1 1.8 2" />
        </svg>
      );
  }
}
