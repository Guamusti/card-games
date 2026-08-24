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
 * Spanish-deck suit marks as line-art in the suit colour, following the
 * reference set. Stroke weight is held ~constant on-screen so the marks stay
 * crisp from a small pip to the big centre symbol.
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
    // ── Oros: milled coin, sun-burst centre, shine arcs ──
    case "oros":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" {...g} />
          <circle cx="12" cy="12" r="6.7" {...gt} />
          <circle cx="12" cy="12" r="1.7" {...dot} />
          <path {...gt} d="M14.6 12 H16.4 M13.84 13.84 L15.11 15.11 M12 14.6 V16.4 M10.16 13.84 L8.89 15.11 M9.4 12 H7.6 M10.16 10.16 L8.89 8.89 M12 9.4 V7.6 M13.84 10.16 L15.11 8.89" />
          <path {...gt} d="M4.9 14.6 A7.6 7.6 0 0 0 9.4 19.1" opacity="0.8" />
          <path {...gt} d="M3.5 11.8 A8.6 8.6 0 0 0 5 15.6" opacity="0.55" />
        </svg>
      );

    // ── Copas: domed bowl with a face, beaded stem, flared foot ──
    case "copas":
      return (
        <svg {...base}>
          <path {...g} d="M5 4.7 Q12 3 19 4.7" />
          <path {...g} d="M5 4.7 A7 7 0 0 0 19 4.7" />
          <circle cx="9.2" cy="6.7" r="0.7" {...dot} />
          <circle cx="14.8" cy="6.7" r="0.7" {...dot} />
          <path {...gt} d="M10.7 8.3 Q12 9.4 13.3 8.3" />
          <path {...g} d="M12 11.7 V14.6" />
          <path {...g} d="M12 12.1 L13.1 13.2 L12 14.3 L10.9 13.2Z" />
          <path {...g} d="M7.4 19.7 C7.4 16.6 16.6 16.6 16.6 19.7" />
          <path {...gt} d="M6.7 20.1 H17.3" />
        </svg>
      );

    // ── Espadas: hilt on top (bound grip, upturned guard), blade point down ──
    case "espadas":
      return (
        <svg {...base}>
          <circle cx="12" cy="2.5" r="1.5" {...g} />
          <path {...g} d="M12 4 V6.9" />
          <path {...gt} d="M10.8 4.6 L13.2 6.1 M10.8 5.8 L13.2 7.3" />
          <path {...g} d="M4.5 8 C5.7 7 7.7 6.9 12 6.9 C16.3 6.9 18.3 7 19.5 8 C18.3 8.7 16.3 8.9 12 8.9 C7.7 8.9 5.7 8.7 4.5 8Z" />
          <path {...gt} d="M4.5 8 C3.8 7.1 3.9 6.3 4.7 6 M19.5 8 C20.2 7.1 20.1 6.3 19.3 6" />
          <path {...g} d="M12 22.6 C10.5 18 9.9 13.3 10.2 9.1 L13.8 9.1 C14.1 13.3 13.5 18 12 22.6Z" />
          <path {...gt} d="M12 10.6 V20.4" />
        </svg>
      );

    // ── Bastos: knotted cudgel — knobbly head, lopped stubs, tapered handle ──
    case "bastos":
      return (
        <svg {...base}>
          <path {...g} d="M8.4 21.2 C7.2 21.9 5.8 20.8 6.4 19.5 L9.6 12.8 C8.5 11.7 8.4 9.9 9.4 8.4 C11 6 14.6 5.6 17 7.2 C19.4 8.8 19.6 12 17.4 13.6 C16 14.6 14.2 14.5 13 13.6 L9.9 20 C9.4 21.1 8.9 21.6 8.4 21.2Z" />
          <path {...gt} d="M10 11.7 C11.2 11.6 12.1 12.3 12.4 13.6" />
          <path {...gt} d="M10.3 9 C11.3 8.1 12.7 8.1 13.7 9" />
          <path {...gt} d="M16.6 6.4 L18.6 5" />
          <path {...gt} d="M18.2 9.4 L20 8.6" />
        </svg>
      );
  }
}
