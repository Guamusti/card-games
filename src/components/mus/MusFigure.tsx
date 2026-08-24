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
  // Sota — a page's head with a soft plumed cap.
  const plumeHead = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <circle cx="0" cy="0.4" r="6.4" {...g} />
      <path {...gt} d="M-6.2 0.4 l-2.4 1.6 2.4 1.5" />
      <circle cx="-3.2" cy="-1.1" r="0.85" {...dot} />
      <path {...gt} d="M-4.8 3.6 H-1.2" />
      {/* soft beret + brim band */}
      <path {...g} d="M-6.6 -3.4 C-5.4 -7.4 0.4 -9.4 5 -7.2 C7.2 -6.1 7.8 -3.8 6.8 -1.8" />
      <path {...gt} d="M-6 -2.4 C-3 -4 3.4 -4 6.2 -2.2" />
      {/* plume curling up and back, with two barbs */}
      <path {...g} d="M5.6 -6.6 C9.2 -11.2 12.8 -11 13.6 -7.6 C10.8 -7.4 8.4 -5.6 7.2 -3" />
      <path {...gt} d="M9.4 -8.8 c1.2 .2 1.9 1 2 2.1 M11.6 -9 c1.1 .3 1.7 1.1 1.7 2.2" />
    </g>
  );

  // Caballo — a horse's head in profile with ear, mane, eye and nostril.
  const horseHead = (tx: number, ty: number, s: number) => (
    <g transform={`translate(${tx},${ty}) scale(${s})`}>
      <path {...g} d="M7 10 C7.6 3.8 5.4 -1.4 0.8 -3.6 L2.4 -7.8 C1 -8.4 -0.4 -8 -1.4 -6.8 L-2 -5.4 C-4.6 -4.4 -7.4 -1.4 -8.4 2 C-9.2 4.8 -8.8 7.6 -6.4 10.6 L-8 12 L-5.6 12.6 C-3 13 1.4 12.8 4 11.6 C5.4 11 6.4 10.6 7 10Z" />
      {/* ear */}
      <path {...g} d="M1.4 -7.4 L3 -10.2 L4.2 -7 Z" />
      {/* eye + nostril */}
      <circle cx="-3.4" cy="0.6" r="1.05" {...dot} />
      <path {...gt} d="M-7.6 6.2 c1.2 -.2 2.1 .4 2.4 1.5" />
      {/* mane down the crest */}
      <path {...gt} d="M2.6 -3 c3.2 1.4 4.6 4.6 3.8 8.4" />
      <path {...gt} d="M4.6 -0.6 c1.8 1.4 2.6 3.6 2.2 6" />
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

  // ── Bastos: knotty cudgel upright, motif over the knobbly head ──
  return (
    <svg {...common}>
      <path {...g} d="M18.4 55.4 C16.6 56.4 14.2 54.8 15.1 52.4 L20.6 40 C18.9 37.7 19.6 33.6 22.6 31.9 C26.4 29.7 31.2 31 32.6 34.4 C33.5 36.6 32.7 38.8 30.8 40 C32.6 41 33.2 43.4 31.8 45.1 C30.4 46.8 27.8 46.3 26.6 44.4 C25 45.3 22.6 44.9 21.4 43.2 L18.4 55.4Z" />
      <path {...gt} d="M31 32.4 L34.4 30.4" />
      <path {...gt} d="M32.6 39 L36 38.6" />
      <path {...gt} d="M20.4 44.4 c2 -.6 3.7 .3 4.2 2.3" />
      <path {...gt} d="M22.6 38.2 c2 -.6 3.7 .3 4.2 2.3" />
      {motif(24, 17, 1.15)}
    </svg>
  );
}
