"use client";

import { useEffect } from "react";
import { useCustomizeStore } from "@/engine/customize/store";

export default function AccentProvider() {
  const accentColor = useCustomizeStore((s) => s.accentColor);
  const suitColors = useCustomizeStore((s) => s.suitColors);

  useEffect(() => {
    if (accentColor === "red") {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", accentColor);
    }
  }, [accentColor]);

  useEffect(() => {
    if (suitColors === "classic") {
      document.documentElement.removeAttribute("data-suit-colors");
    } else {
      document.documentElement.setAttribute("data-suit-colors", suitColors);
    }
  }, [suitColors]);

  return null;
}
