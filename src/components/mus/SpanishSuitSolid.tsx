"use client";

import type { SpanishSuit } from "@/engine/mus/types";

interface Props {
  suit: SpanishSuit;
  size?: number;
  color: string;
  className?: string;
}

/**
 * First-generation Mus suit marks — solid silhouettes (milled coin, footed
 * chalice, guarded sword, knotted club). Kept as the "Silueta" deck option.
 */
export default function SpanishSuitSolid({ suit, size = 24, color, className }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", className, style: { color }, fill: "currentColor" } as const;
  switch (suit) {
    case "oros":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10.2" fill="currentColor" opacity="0.16" />
          <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6.9" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <path d="M12 4.9 l1.55 5.56 5.56 1.55 -5.56 1.55 -1.55 5.56 -1.55 -5.56 -5.56 -1.55 5.56 -1.55Z" />
        </svg>
      );
    case "copas":
      return (
        <svg {...common}>
          <path d="M4.4 2.6 H19.6 V5.7 C19.6 10.2 16.8 13.4 13.2 13.9 V17.9 H16.4 V19.6 H7.6 V17.9 H10.8 V13.9 C7.2 13.4 4.4 10.2 4.4 5.7 Z" />
          <ellipse cx="12" cy="20.6" rx="6.4" ry="1.6" />
        </svg>
      );
    case "espadas":
      return (
        <svg {...common}>
          <path d="M12 1.4 L14.2 6.4 V12.3 H9.8 V6.4 Z" />
          <rect x="4.3" y="12.3" width="15.4" height="2.3" rx="1.15" />
          <rect x="10.8" y="14.6" width="2.4" height="4.2" />
          <circle cx="12" cy="20.3" r="2" />
        </svg>
      );
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
