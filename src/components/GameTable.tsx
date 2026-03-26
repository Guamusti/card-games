"use client";

import { useEffect } from "react";
import { useGameStore } from "@/engine/store";
import { useKeyboard } from "@/hooks/useKeyboard";
import TopBar from "./ui/TopBar";
import DealerHand from "./ui/DealerHand";
import Hand from "./ui/Hand";
import ActionBar from "./ui/ActionBar";
import Feedback from "./ui/Feedback";
import BetSelector from "./ui/BetSelector";
import StrategyChart from "./ui/StrategyChart";
import WinCelebration from "./ui/WinCelebration";
import { useCustomizeStore } from "@/engine/customize/store";

const FELT_COLORS: Record<string, string | undefined> = {
  none: undefined,
  subtle: "#1a1a1a",
  green: "#0a2e1a",
  blue: "#0a1a2e",
  wine: "#2e0a1a",
};

export default function GameTable() {
  useKeyboard();

  const { dealer, hands, activeHandIndex, phase, numHands, newRound } = useGameStore();
  const tableFelt = useCustomizeStore((s) => s.tableFelt);
  const autoDealDelay = useCustomizeStore((s) => s.autoDealDelay);

  // Auto-deal: start next round after settling
  useEffect(() => {
    if (phase !== "settled" || autoDealDelay <= 0) return;
    const timer = setTimeout(() => newRound(), autoDealDelay * 1000);
    return () => clearTimeout(timer);
  }, [phase, autoDealDelay, newRound]);

  const showTable = phase !== "betting";
  const feltBg = FELT_COLORS[tableFelt];

  return (
    <div
      className="relative flex flex-col min-h-[100dvh] overflow-y-auto"
      style={feltBg ? { backgroundColor: feltBg } : undefined}
    >
      <TopBar />

      <main className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-8 px-4 py-4 sm:py-8">
        {!showTable ? (
          <div className="flex flex-col items-center gap-5 sm:gap-6">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Blackjack</h1>
            <p className="text-xs sm:text-sm text-muted max-w-xs text-center leading-relaxed">
              Train your basic strategy. Every decision is tracked and corrected
              in real time.
            </p>
            <BetSelector />
            <ActionBar />
            <p className="text-[10px] sm:text-xs text-muted mt-1 hidden sm:block">
              Press <kbd className="font-medium text-foreground">Space</kbd> to deal
            </p>
          </div>
        ) : (
          <>
            {/* Dealer */}
            <DealerHand cards={dealer.cards} hidden={dealer.hidden} />

            {/* Feedback strip */}
            <Feedback />

            {/* Player hands */}
            <div className={`flex gap-3 sm:gap-6 ${hands.length > 2 ? "flex-wrap justify-center" : ""}`}>
              {hands.map((hand, i) => {
                const isActive = phase === "playing" && i === activeHandIndex;
                const showMultiLabel = hands.length > 1;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center rounded-xl px-2 py-2 sm:px-3 sm:py-2.5 transition-all duration-300 ${
                      isActive
                        ? "ring-1 ring-foreground/30 bg-foreground/[0.04]"
                        : showMultiLabel
                        ? "ring-1 ring-transparent"
                        : ""
                    }`}
                  >
                    <Hand
                      hand={hand}
                      isActive={isActive}
                      label={showMultiLabel ? `Hand ${i + 1}` : "You"}
                    />
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <ActionBar />

            {/* Keyboard hints — desktop only */}
            {phase === "playing" && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] sm:text-xs text-muted gap-3 sm:gap-4 hidden sm:flex">
                  <span><kbd className="font-medium text-foreground">H</kbd> Hit</span>
                  <span><kbd className="font-medium text-foreground">S</kbd> Stand</span>
                  <span><kbd className="font-medium text-foreground">D</kbd> Double</span>
                  <span><kbd className="font-medium text-foreground">P</kbd> Split</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-muted/60">
                  Hold button to peek at optimal play
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Win celebration overlay */}
      <WinCelebration />

      {/* Strategy reference chart */}
      <StrategyChart />

      <footer className="py-3 sm:py-4 text-center text-[10px] sm:text-xs text-muted border-t border-border safe-bottom">
        6-deck &middot; S17 &middot; DAS
      </footer>
    </div>
  );
}
