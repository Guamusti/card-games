"use client";

import type { SpanishSuit } from "@/engine/mus/types";

// Palette matched to the supplied minimalist Spanish deck.
export const SUIT_COLOR: Record<SpanishSuit, string> = {
  oros: "#f2df36",
  copas: "#ff706b",
  espadas: "#78d8f5",
  bastos: "#8bd650",
};

interface Props {
  suit: SpanishSuit;
  size?: number;
  className?: string;
}

/** Line-art pips following the supplied minimalist Spanish-deck reference. */
export default function SpanishSuit({ suit, size = 24, className }: Props) {
  const color = SUIT_COLOR[suit];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    style: { color },
  } as const;

  switch (suit) {
    case "oros":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.45}>
          <circle cx="12" cy="12" r="9.2" />
          <circle cx="12" cy="12" r="6.8" />
          <path d="M9 8.2c1.1-1.2 2.3-1.7 3.8-1.7 1.8 0 3.2 1.1 3.2 2.8 0 2.8-3 3.1-3 5.2v1.1" />
          <path d="M9.4 16.7h5.1M12.2 18.8h.1" strokeLinecap="round" />
        </svg>
      );
    case "copas":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.45} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.2 4.8h15.6l-1.3 4.1c-1 3.2-3.6 4.8-6.5 4.8s-5.5-1.6-6.5-4.8L4.2 4.8Z" />
          <path d="M8.2 7.7c.7 1 1.6 1.5 2.8 1.5 1.2 0 2.1-.5 2.8-1.5 1 .9 2 1.2 3.1.8" />
          <path d="M12 13.7v4.1M8 19.5h8M10 17.8h4" />
        </svg>
      );
    case "espadas":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.45} strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3.1 4 10.1L12 19.8 8 13.2 12 3.1Z" />
          <path d="M12 5.5v9M8.1 13.2h7.8M5.1 14.5h13.8l-1.5 1.7H6.6l-1.5-1.7ZM10.1 16.2h3.8v3.1h-3.8zM10.8 19.3h2.4v1.6h-2.4z" />
        </svg>
      );
    case "bastos":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.45} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.1 20.4c1.7-5.3 3.7-10.4 7.8-16.8 1.7.9 2.4 2.1 2.2 3.7-.4 2.5-3 4.2-4.3 6.4-1.2 2.1-1.5 4.9-3.8 6.7-1 .7-1.6.6-1.9 0Z" />
          <path d="M10.3 14.6c-2.4-.1-3.5-1.2-3.3-3.2.1-1.4.8-2.2 1.8-2.7M13 10.1c-2.2-.5-3.1-1.7-2.8-3.5.2-1.2.8-1.9 1.9-2.4M9.1 17.4c-1.6.2-2.4 1-2.4 2.4" />
        </svg>
      );
  }
}
