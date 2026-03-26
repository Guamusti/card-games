"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCustomizeStore } from "@/engine/customize/store";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { dark, toggle } = useDarkMode();

  const {
    nickname, setNickname,
    aiDifficulty, setAiDifficulty,
    autoDealDelay, setAutoDealDelay,
    showProbabilities, setShowProbabilities,
    animationSpeed, setAnimationSpeed,
    showCardShadow, setShowCardShadow,
    hapticFeedback, setHapticFeedback,
  } = useCustomizeStore();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
        {!mounted ? (
          <div className="flex justify-center py-20">
            <span className="text-muted text-sm animate-pulse">Loading...</span>
          </div>
        ) : (
          <div className="max-w-lg mx-auto flex flex-col gap-8 sm:gap-10">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Settings</h1>
            </motion.div>

            {/* ─── Gameplay ─── */}
            <Section title="Gameplay" delay={0.05}>
              <div className="flex flex-col gap-3">
                {/* Nickname */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <span className="text-xs text-muted">Nickname</span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                    placeholder="Player"
                    maxLength={16}
                    className="text-xs font-semibold text-right bg-transparent border-none outline-none w-28 placeholder:text-border"
                  />
                </div>

                {/* AI Difficulty */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">AI Difficulty</span>
                    <span className="text-[9px] text-border">Poker opponent skill level</span>
                  </div>
                  <div className="flex gap-1">
                    {(["easy", "normal", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setAiDifficulty(d)}
                        className={`rounded-full border text-[10px] px-2.5 py-1 capitalize transition-colors ${
                          aiDifficulty === d
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted hover:border-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-deal delay */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">Auto-deal</span>
                    <span className="text-[9px] text-border">Auto next hand after settling</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAutoDealDelay(s)}
                        className={`rounded-full border text-[10px] px-2.5 py-1 transition-colors ${
                          autoDealDelay === s
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted hover:border-foreground"
                        }`}
                      >
                        {s === 0 ? "Off" : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show win probabilities */}
                <ToggleRow
                  label="Show win probabilities"
                  hint="BJ action button peek"
                  value={showProbabilities}
                  onChange={setShowProbabilities}
                />
              </div>
            </Section>

            {/* ─── Display ─── */}
            <Section title="Display" delay={0.12}>
              <div className="flex flex-col gap-3">
                {/* Animation speed */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
                  <span className="text-xs text-muted">Animation speed</span>
                  <div className="flex gap-1">
                    {(["slow", "normal", "fast"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setAnimationSpeed(s)}
                        className={`rounded-full border text-[10px] px-2.5 py-1 capitalize transition-colors ${
                          animationSpeed === s
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted hover:border-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark/Light theme */}
                <ToggleRow
                  label="Dark mode"
                  hint="Switch between light and dark theme"
                  value={dark}
                  onChange={toggle}
                />

                {/* Card shadows */}
                <ToggleRow
                  label="Card shadows"
                  hint="Show drop shadow on cards"
                  value={showCardShadow}
                  onChange={setShowCardShadow}
                />
              </div>
            </Section>

            {/* ─── Feedback ─── */}
            <Section title="Feedback" delay={0.19}>
              <div className="flex flex-col gap-3">
                <ToggleRow
                  label="Haptic feedback"
                  hint="Vibration on actions"
                  value={hapticFeedback}
                  onChange={setHapticFeedback}
                />
              </div>
            </Section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </motion.section>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border">
      <div className="flex flex-col">
        <span className="text-xs text-muted">{label}</span>
        {hint && <span className="text-[9px] text-border">{hint}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-correct" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
