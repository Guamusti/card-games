"use client";

import { useEffect } from "react";
import { useGameStore } from "@/engine/store";

export function useKeyboard() {
  const { phase, hit, stand, double, split, deal, newRound } = useGameStore();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (phase === "betting" && (key === "enter" || key === " ")) {
        e.preventDefault();
        deal();
      } else if (phase === "playing") {
        if (key === "h") hit();
        else if (key === "s") stand();
        else if (key === "d") double();
        else if (key === "p") split();
      } else if (phase === "settled" && (key === "enter" || key === " ")) {
        e.preventDefault();
        newRound();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, hit, stand, double, split, deal, newRound]);
}
