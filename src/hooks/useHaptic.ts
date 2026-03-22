"use client";

import { useCustomizeStore } from "@/engine/customize/store";

export function useHaptic() {
  const enabled = useCustomizeStore((s) => s.hapticFeedback);

  return {
    tap: () => {
      if (enabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
    },
    heavy: () => {
      if (enabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(25);
      }
    },
  };
}
