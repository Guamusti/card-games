"use client";

import type { SpanishRank, SpanishSuit } from "@/engine/mus/types";

interface Props {
  /** 10 = Sota, 11 = Caballo, 12 = Rey. */
  rank: SpanishRank;
  suit: SpanishSuit;
  height?: number;
  color: string;
  className?: string;
}

/**
 * Court-card art for the Spanish deck, in the style of the reference set:
 * the court motif is combined with the suit object and differs per suit —
 *   • sota (10)   → a plumed page's head
 *   • caballo (11)→ a horse's head
 *   • rey (12)    → a jewelled crown (a crowned head inside the coin)
 * On oros the motif sits inside the coin; on the other suits it sits above
 * the suit object. Line-art, matching the numbered cards.
 */
export default function MusFigure({ rank, suit, height = 48, color, className }: Props) {
  const w = (height * 44) / 60;
  const on = 1.5 * 60 / height;
  const onThin = 1.0 * 60 / height;
  const common = { height, width: w, viewBox: "0 0 44 60", className, style: { color } } as const;
  const g = { fill: "none", stroke: "currentColor", strokeWidth: on, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const gt = { ...g, strokeWidth: onThin };
  const dot = { fill: "currentColor", stroke: "none" as const };

  // ── Court motifs, drawn around a local origin (facing left) ──
  const plumeHead = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <circle cx="0" cy="0" r="6.6" {...g} />
      <path {...gt} d="M-6.4 0 l-2.4 1.7 2.4 1.5" />
      <circle cx="-3.4" cy="-1.4" r="0.9" {...dot} />
      <path {...gt} d="M-5 3.4 H-1.2" />
      <path {...g} d="M-6.8 -4.6 C-4.4 -8 0.2 -9 4.4 -7.2 C6.8 -6.2 7.8 -4 7.4 -1.6" />
      <path {...g} d="M4 -6.8 C7.4 -11 11.4 -11.4 13 -8.4 C10.2 -7.4 8 -5.2 7 -2.4" />
    </g>
  );

  const horseHead = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <path {...g} d="M7 10 C7.4 4 5.2 -1.2 0.6 -3.4 l1.8 -4 -4.4 1.2 C-6.4 -4 -9 0.2 -9 5 C-9 7.4 -8 9.4 -6.2 10.8 L-8 12 L-5.6 12.6 C-3 13 1.4 12.8 4 11.6 C5.4 11 6.4 10.6 7 10Z" />
      <circle cx="-3.6" cy="1.4" r="1.1" {...dot} />
      <path {...gt} d="M-8.4 6.6 c1.4 -.2 2.4 .4 2.8 1.6" />
      <path {...gt} d="M2 -2 c3 1.4 4.2 4.4 3.4 7.6" />
    </g>
  );

  const crown = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <path {...g} d="M-9 7 V0 L-4.5 4 L0 -4.5 L4.5 4 L9 0 V7Z" />
      <path {...g} d="M-9.2 7.2 H9.2 V10.4 H-9.2Z" />
      <circle cx="-9" cy="-1.4" r="1.3" {...dot} />
      <circle cx="0" cy="-6.2" r="1.4" {...dot} />
      <circle cx="9" cy="-1.4" r="1.3" {...dot} />
    </g>
  );

  const motif = (tx: number, ty: number, s: number) =>
    rank === 12 ? crown(tx, ty, s) : rank === 11 ? horseHead(tx, ty, s) : plumeHead(tx, ty, s);

  // A small profile face for the crowned coin (rey de oros).
  const faceProfile = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <circle cx="0" cy="0" r="6.4" {...g} />
      <path {...gt} d="M-6.2 0 l-2.3 1.6 2.3 1.4" />
      <circle cx="-3.2" cy="-1.3" r="0.85" {...dot} />
      <path {...gt} d="M-4.8 3.2 H-1.2" />
    </g>
  );

  // ── Oros: big coin, motif inside ──
  if (suit === "oros") {
    return (
      <svg {...common}>
        <circle cx="22" cy="30" r="17.5" {...g} />
        <circle cx="22" cy="30" r="13.5" {...gt} />
        <path {...gt} d="M8 40 A17.5 17.5 0 0 0 16 47" opacity="0.7" />
        {rank === 12 ? (
          <>
            {crown(22, 22, 0.72)}
            {faceProfile(22, 31, 0.82)}
          </>
        ) : rank === 11 ? (
          horseHead(23, 30, 0.95)
        ) : (
          plumeHead(22, 29, 1.05)
        )}
      </svg>
    );
  }

  // ── Copas: goblet with the motif rising from the bowl ──
  if (suit === "copas") {
    return (
      <svg {...common}>
        <path {...g} d="M8 30 Q22 27 36 30" />
        <path {...g} d="M8 30 A14 14 0 0 0 36 30" />
        <path {...g} d="M22 44 V50" />
        <ellipse cx="22" cy="46" rx="2.6" ry="1.4" {...gt} />
        <path {...g} d="M13 55.5 C13 50.5 31 50.5 31 55.5" />
        <path {...gt} d="M11.6 56 H32.4" />
        {motif(22, 18, 1.15)}
      </svg>
    );
  }

  // ── Espadas: sword pointing down, motif at the hilt on top ──
  if (suit === "espadas") {
    return (
      <svg {...common}>
        <path {...g} d="M8 30 C13 29 31 29 36 30 C31 31 13 31 8 30Z" />
        <path {...g} d="M22 56 C19 48 18 40 18.4 31.6 L25.6 31.6 C26 40 25 48 22 56Z" />
        <path {...gt} d="M22 34 V52" />
        {motif(22, 16, 1.15)}
      </svg>
    );
  }

  // ── Bastos: club upright, motif over the knobbly head ──
  return (
    <svg {...common}>
      <path {...g} d="M18.5 55 C16.6 56 14.4 54.2 15.2 52 L19.4 40 C17.6 38.6 17 36.2 18 33.2 C19.6 28.4 25 27 29.4 28 C34.6 29.2 36.4 33.8 34 37.6 C32.2 40.4 29 41.2 26.4 40.2 L22.4 52.2 C21.7 54.2 20.1 55.4 18.5 55Z" />
      <path {...gt} d="M18.8 38.5 c2.2 -.2 3.7 1 4.2 3" />
      <path {...gt} d="M27 30 c2.2 .5 3.5 2 3.7 4" />
      {motif(24, 16, 1.15)}
    </svg>
  );
}
