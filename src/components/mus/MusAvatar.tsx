"use client";

import type { Team } from "@/engine/mus/types";

interface Props {
  name: string;
  team: Team;
  seat: number;
  size?: number;
  active?: boolean;
}

// Team-tinted avatar backgrounds with a little per-seat variation.
const TEAM_BG: Record<Team, string[]> = {
  A: ["#2f6fb0", "#3a86c9"], // us — blue
  B: ["#b0472f", "#c95a3a"], // them — warm red
};

/** SVG person-silhouette avatar. No emoji. */
export default function MusAvatar({ name, team, seat, size = 28, active = false }: Props) {
  const bg = TEAM_BG[team][seat % 2 === 0 ? 0 : 1];
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={active ? "ring-2 ring-accent rounded-full" : ""}
      style={{ borderRadius: "50%" }}
      aria-label={name}
    >
      <circle cx="20" cy="20" r="20" fill={bg} />
      <text
        x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700"
        fill="#ffffff" fontFamily="inherit"
      >
        {initial}
      </text>
    </svg>
  );
}
