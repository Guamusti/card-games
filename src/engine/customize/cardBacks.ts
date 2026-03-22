import type { CardBack } from "./store";

export interface CardBackDesign {
  id: CardBack;
  name: string;
  bg: string;
  pattern: string;
  label: string;
  labelColor: string;
}

function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const geometricSvg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M0 20L20 0L40 20L20 40Z" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/></svg>`;

const stripesSvg = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="10" x2="10" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/></svg>`;

const diamondsSvg = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="10" height="10" transform="rotate(45 10 10)" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.8"/></svg>`;

const wavesSvg = `<svg width="40" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q10 0 20 10 Q30 20 40 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/></svg>`;

const crosshatchSvg = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="16" y2="16" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><line x1="16" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></svg>`;

const dotsSvg = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.15)"/></svg>`;

const tartanSvg = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="none"/><line x1="0" y1="5" x2="20" y2="5" stroke="rgba(255,255,255,0.08)" stroke-width="2"/><line x1="0" y1="15" x2="20" y2="15" stroke="rgba(255,255,255,0.08)" stroke-width="2"/><line x1="5" y1="0" x2="5" y2="20" stroke="rgba(255,255,255,0.06)" stroke-width="2"/><line x1="15" y1="0" x2="15" y2="20" stroke="rgba(255,255,255,0.06)" stroke-width="2"/></svg>`;

const hexagonsSvg = `<svg width="28" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M14 0 L28 7 L28 17 L14 24 L0 17 L0 7 Z" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.8"/></svg>`;

const zigzagSvg = `<svg width="20" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M0 6 L5 0 L10 6 L15 0 L20 6" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><path d="M0 12 L5 6 L10 12 L15 6 L20 12" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/></svg>`;

const circlesSvg = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.8"/><circle cx="0" cy="0" r="4" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/><circle cx="24" cy="24" r="4" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/></svg>`;

export const CARD_BACKS: CardBackDesign[] = [
  {
    id: "classic",
    name: "Classic",
    bg: "#0a0a0a",
    pattern: "",
    label: "CT",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "geometric",
    name: "Geometric",
    bg: "#1a1a2e",
    pattern: svgDataUri(geometricSvg),
    label: "◇",
    labelColor: "rgba(255,255,255,0.3)",
  },
  {
    id: "stripes",
    name: "Stripes",
    bg: "#1b3a4b",
    pattern: svgDataUri(stripesSvg),
    label: "∕∕",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "diamonds",
    name: "Diamonds",
    bg: "#2d1b36",
    pattern: svgDataUri(diamondsSvg),
    label: "♦",
    labelColor: "rgba(255,255,255,0.3)",
  },
  {
    id: "waves",
    name: "Waves",
    bg: "#0d2137",
    pattern: svgDataUri(wavesSvg),
    label: "≈",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "minimal",
    name: "Minimal",
    bg: "#262626",
    pattern: "",
    label: "●",
    labelColor: "rgba(255,255,255,0.15)",
  },
  {
    id: "crosshatch",
    name: "Crosshatch",
    bg: "#1a2e1a",
    pattern: svgDataUri(crosshatchSvg),
    label: "✕",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "dots",
    name: "Dots",
    bg: "#2e1a1a",
    pattern: svgDataUri(dotsSvg),
    label: "⋮⋮",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "tartan",
    name: "Tartan",
    bg: "#1a2633",
    pattern: svgDataUri(tartanSvg),
    label: "▦",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "hexagons",
    name: "Hexagons",
    bg: "#1f1a2e",
    pattern: svgDataUri(hexagonsSvg),
    label: "⬡",
    labelColor: "rgba(255,255,255,0.3)",
  },
  {
    id: "zigzag",
    name: "Zigzag",
    bg: "#2e2a1a",
    pattern: svgDataUri(zigzagSvg),
    label: "∿",
    labelColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "circles",
    name: "Circles",
    bg: "#1a2e2a",
    pattern: svgDataUri(circlesSvg),
    label: "◎",
    labelColor: "rgba(255,255,255,0.25)",
  },
];

export function getCardBack(id: CardBack): CardBackDesign {
  return CARD_BACKS.find((b) => b.id === id) || CARD_BACKS[0];
}
