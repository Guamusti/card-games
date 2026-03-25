"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWalletStore } from "@/engine/wallet";
import { useXPStore } from "@/engine/xp";
import { useDarkMode } from "@/hooks/useDarkMode";

interface AppTopBarProps {
  /** Left side content — defaults to home icon */
  leftContent?: React.ReactNode;
  /** Hide coins/gems display */
  hideCurrency?: boolean;
}

export default function AppTopBar({ leftContent, hideCurrency }: AppTopBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const balance = useWalletStore((s) => s.balance);
  const gems = useWalletStore((s) => s.gems);
  const level = useXPStore((s) => s.level);
  const { dark, toggle } = useDarkMode();

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-border safe-top">
      {leftContent ?? (
        <Link
          href="/"
          className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
      )}

      <div className="flex items-center gap-2.5 sm:gap-3.5 text-sm tabular-nums">
        {!hideCurrency && (
          <>
            {/* Coins */}
            <div className="flex items-center gap-1">
              <span className="text-amber-500 text-xs">●</span>
              <span className="text-foreground font-medium">{mounted ? balance.toLocaleString() : "—"}</span>
            </div>
            {/* Gems */}
            <div className="flex items-center gap-1">
              <span className="text-blue-500 text-xs">◆</span>
              <span className="text-foreground font-medium">{mounted ? gems : "—"}</span>
            </div>
          </>
        )}
        {/* Level → Battle Pass */}
        <Link
          href="/battlepass"
          className="flex items-center gap-1 px-2 py-1 rounded-full border border-border hover:border-foreground transition-colors"
        >
          <span className="text-xs font-bold">{mounted ? level : "—"}</span>
        </Link>
        {/* Dark mode */}
        <button
          onClick={toggle}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
        >
          <span className="text-xs">{dark ? "L" : "D"}</span>
        </button>
      </div>
    </div>
  );
}
