"use client";

import type { SpanishSuit } from "@/engine/mus/types";
import type { MusDeckTheme } from "@/engine/customize/store";

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

/** Minimalist deck: a single muted ink for every suit. */
export const MINIMAL_INK = "#33312d";

export function suitColor(suit: SpanishSuit, theme: MusDeckTheme): string {
  return theme === "neon" ? NEON_SUIT_COLOR[suit] : theme === "minimal" ? MINIMAL_INK : SUIT_COLOR[suit];
}

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
  theme?: MusDeckTheme;
}

/**
 * Spanish-deck suit marks as line-art in the suit colour, following the
 * reference set. Stroke weight is held ~constant on-screen so the marks stay
 * crisp from a small pip to the big centre symbol.
 */
export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const color = suitColor(suit, theme);
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

    // ── Bastos: knotty cudgel — bulbous head, lopped stubs, tapered handle ──
    case "bastos":
      return (
        <svg {...base}>
          <path {...g} d="M6.6 20.9 C5.5 21.6 4.1 20.6 4.7 19.3 L9.8 10 C8.9 8.1 9.6 5.9 11.6 5 C13.9 4 16.7 5.2 17.4 7.5 C17.9 8.9 17.5 10.3 16.5 11.2 C17.5 11.8 17.8 13.1 17 14 C16.1 14.9 14.7 14.6 14 13.6 C13.1 14.1 11.8 13.9 11 13 L6.6 20.9Z" />
          <path {...gt} d="M16.6 6.6 L18.7 5.2" />
          <path {...gt} d="M17.7 10.6 L19.9 10.2" />
          <path {...gt} d="M9.7 14.8 c1.1 -.4 2.1 .2 2.4 1.3" />
          <path {...gt} d="M11.6 11.2 c1.1 -.4 2.1 .2 2.4 1.3" />
        </svg>
      );
  }
}
