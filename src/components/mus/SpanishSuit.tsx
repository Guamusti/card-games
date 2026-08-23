"use client";

import type { SpanishSuit } from "@/engine/mus/types";

export const SUIT_COLOR: Record<SpanishSuit, string> = {
  oros: "#c99a2e",
  copas: "#c0392b",
  espadas: "#2f6fb0",
  bastos: "#3a8a4d",
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

export default function SpanishSuit({ suit, size = 24, className, theme = "classic" }: Props) {
  const color = theme === "neon" ? NEON_SUIT_COLOR[suit] : SUIT_COLOR[suit];
  const common = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color } } as const;

  switch (suit) {
    case "oros":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "copas":
      return <svg {...common} fill="currentColor"><path d="M6 3.5 H18 V6.5 A6 5.2 0 0 1 6 6.5 Z" /><rect x="11.1" y="11" width="1.8" height="6.5" rx="0.6" /><ellipse cx="12" cy="18.6" rx="5" ry="1.5" /></svg>;
    case "espadas":
      return <svg {...common} fill="currentColor"><path d="M12 2 L13.4 6 V13 H10.6 V6 Z" /><rect x="6.5" y="13" width="11" height="1.9" rx="0.9" /><rect x="11.1" y="14.9" width="1.8" height="4.6" rx="0.6" /><circle cx="12" cy="20.4" r="1.6" /></svg>;
    case "bastos":
      return <svg {...common} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round"><path d="M6.5 19 L16 6.5" /><path d="M8.8 16 l2.4 1.6" strokeWidth={2} /><path d="M12 11 l2.4 1.6" strokeWidth={2} /></svg>;
  }
}
