"use client";

import type { SenaId } from "@/engine/mus/senas";

/** Small face showing the gesture for each seña. */
export default function SenaIcon({ id, size = 22, className }: { id: SenaId; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const dot = { fill: "currentColor", stroke: "none" as const };
  const head = <circle cx="12" cy="12" r="9.2" />;
  switch (id) {
    case "reyes": // bite the lip
      return <svg {...common}>{head}<circle cx="9" cy="10" r="0.9" {...dot} /><circle cx="15" cy="10" r="0.9" {...dot} /><path d="M8.5 14.5 H15.5" /><path d="M9.5 14.5 c1 1.6 4 1.6 5 0" /></svg>;
    case "ases": // tongue out
      return <svg {...common}>{head}<circle cx="9" cy="10" r="0.9" {...dot} /><circle cx="15" cy="10" r="0.9" {...dot} /><path d="M8.6 14 h6.8" /><path d="M11 14 v2.4 a1 1 0 0 0 2 0 V14" fill="currentColor" fillOpacity="0.25" /></svg>;
    case "treintaiuna": // wink
      return <svg {...common}>{head}<path d="M7.6 10 h2.8" /><circle cx="15" cy="10" r="0.9" {...dot} /><path d="M9 14.6 c1.4 1.4 4.6 1.4 6 0" /></svg>;
    case "duples": // raised brows
      return <svg {...common}>{head}<path d="M7.4 8.4 c1 -.9 2.2 -.9 3.2 0 M13.4 8.4 c1 -.9 2.2 -.9 3.2 0" /><circle cx="9" cy="10.8" r="0.9" {...dot} /><circle cx="15" cy="10.8" r="0.9" {...dot} /><path d="M9.5 14.6 h5" /></svg>;
    case "ciego": // eyes closed
      return <svg {...common}>{head}<path d="M7.6 10.4 c1 1 2.2 1 3.2 0 M13.2 10.4 c1 1 2.2 1 3.2 0" /><path d="M9.5 14.6 c1 1 4 1 5 0" /></svg>;
  }
}
