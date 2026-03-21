"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCustomizeStore } from "@/engine/customize/store";
import type { CardBack, AccentColor, TableFelt } from "@/engine/customize/store";
import { CARD_BACKS, getCardBack } from "@/engine/customize/cardBacks";

const ACCENT_COLORS: { id: AccentColor; name: string; color: string; dark: string }[] = [
  { id: "red", name: "Red", color: "#dc2626", dark: "#ef4444" },
  { id: "blue", name: "Blue", color: "#2563eb", dark: "#3b82f6" },
  { id: "purple", name: "Purple", color: "#7c3aed", dark: "#8b5cf6" },
  { id: "emerald", name: "Emerald", color: "#059669", dark: "#10b981" },
  { id: "amber", name: "Amber", color: "#d97706", dark: "#f59e0b" },
  { id: "rose", name: "Rose", color: "#e11d48", dark: "#fb7185" },
];

const TABLE_FELTS: { id: TableFelt; name: string; color: string }[] = [
  { id: "none", name: "Default", color: "transparent" },
  { id: "subtle", name: "Subtle", color: "#1a1a1a" },
  { id: "green", name: "Green", color: "#0a2e1a" },
  { id: "blue", name: "Blue", color: "#0a1a2e" },
  { id: "wine", name: "Wine", color: "#2e0a1a" },
];

const ANIM_SPEEDS: { id: "slow" | "normal" | "fast"; name: string }[] = [
  { id: "slow", name: "Slow" },
  { id: "normal", name: "Normal" },
  { id: "fast", name: "Fast" },
];

export default function CustomizePage() {
  const { dark, toggle } = useDarkMode();
  const {
    cardBack,
    accentColor,
    tableFelt,
    animationSpeed,
    showCardShadow,
    setCardBack,
    setAccentColor,
    setTableFelt,
    setAnimationSpeed,
    setShowCardShadow,
  } = useCustomizeStore();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border safe-top">
        <span className="text-sm font-semibold tracking-tight">✦</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Customize</span>
          <button
            onClick={toggle}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
          >
            <span className="text-xs">{dark ? "L" : "D"}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-lg mx-auto flex flex-col gap-8 sm:gap-10">
          {/* Back link + title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Link
              href="/"
              className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest"
            >
              ← Menu
            </Link>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Customize</h1>
            <p className="text-xs sm:text-sm text-muted text-center">
              Make it yours. Changes apply to all games.
            </p>
          </motion.div>

          {/* ─── Card Backs ─── */}
          <Section title="Card Back" delay={0.05}>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {CARD_BACKS.map((back) => {
                const selected = cardBack === back.id;
                return (
                  <button
                    key={back.id}
                    onClick={() => setCardBack(back.id)}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all duration-150 ${
                      selected
                        ? "ring-2 ring-foreground scale-[1.02]"
                        : "hover:bg-border/30"
                    }`}
                  >
                    <CardBackPreview back={back} />
                    <span
                      className={`text-[10px] sm:text-xs ${
                        selected ? "text-foreground font-medium" : "text-muted"
                      }`}
                    >
                      {back.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── Accent Color ─── */}
          <Section title="Accent Color" delay={0.1}>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {ACCENT_COLORS.map((c) => {
                const selected = accentColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150 ${
                      selected
                        ? "ring-2 ring-foreground"
                        : "hover:bg-border/30"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-border/50"
                      style={{ backgroundColor: dark ? c.dark : c.color }}
                    />
                    <span
                      className={`text-[10px] sm:text-xs ${
                        selected ? "text-foreground font-medium" : "text-muted"
                      }`}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── Table Felt ─── */}
          <Section title="Table Background" delay={0.15}>
            <div className="grid grid-cols-5 gap-2">
              {TABLE_FELTS.map((f) => {
                const selected = tableFelt === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setTableFelt(f.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150 ${
                      selected
                        ? "ring-2 ring-foreground"
                        : "hover:bg-border/30"
                    }`}
                  >
                    <div
                      className="w-full aspect-[3/2] rounded border border-border/50"
                      style={{
                        backgroundColor:
                          f.id === "none"
                            ? "var(--color-background)"
                            : f.color,
                      }}
                    />
                    <span
                      className={`text-[10px] ${
                        selected ? "text-foreground font-medium" : "text-muted"
                      }`}
                    >
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── Animation Speed ─── */}
          <Section title="Animation Speed" delay={0.2}>
            <div className="flex gap-2">
              {ANIM_SPEEDS.map((s) => {
                const selected = animationSpeed === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setAnimationSpeed(s.id)}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-150 ${
                      selected
                        ? "border-foreground text-foreground bg-foreground/5"
                        : "border-border text-muted hover:border-foreground/50"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── Card Shadow ─── */}
          <Section title="Card Shadow" delay={0.25}>
            <button
              onClick={() => setShowCardShadow(!showCardShadow)}
              className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:border-foreground/50 transition-colors"
            >
              <span className="text-xs sm:text-sm">Drop shadow on cards</span>
              <div
                className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${
                  showCardShadow ? "bg-foreground" : "bg-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-background transition-transform duration-200 mx-1 ${
                    showCardShadow ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </Section>

          {/* ─── Preview ─── */}
          <Section title="Preview" delay={0.3}>
            <div
              className="flex justify-center gap-2 p-6 rounded-xl border border-border"
              style={{
                backgroundColor:
                  tableFelt === "none"
                    ? undefined
                    : TABLE_FELTS.find((f) => f.id === tableFelt)?.color,
              }}
            >
              <PreviewCard back={getCardBack(cardBack)} shadow={showCardShadow} />
              <PreviewCardFace shadow={showCardShadow} />
              <PreviewCardFace rank="A" suit="♠" shadow={showCardShadow} />
            </div>
          </Section>
        </div>
      </main>

      <footer className="py-3 sm:py-4 text-center text-[10px] sm:text-xs text-muted border-t border-border safe-bottom">
        Card Trainer
      </footer>
    </div>
  );
}

function Section({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function CardBackPreview({
  back,
}: {
  back: (typeof CARD_BACKS)[number];
}) {
  return (
    <div
      className="w-12 h-[4.25rem] sm:w-14 sm:h-20 rounded-md border border-border/50 flex items-center justify-center"
      style={{
        backgroundColor: back.bg,
        backgroundImage: back.pattern || undefined,
        backgroundSize: back.pattern ? "auto" : undefined,
      }}
    >
      <span
        className="text-[10px] sm:text-xs font-medium tracking-widest"
        style={{ color: back.labelColor }}
      >
        {back.label}
      </span>
    </div>
  );
}

function PreviewCard({
  back,
  shadow,
}: {
  back: (typeof CARD_BACKS)[number];
  shadow: boolean;
}) {
  return (
    <div
      className={`card-size rounded-lg border border-border/50 flex items-center justify-center ${
        shadow ? "shadow-sm" : ""
      }`}
      style={{
        backgroundColor: back.bg,
        backgroundImage: back.pattern || undefined,
        backgroundSize: back.pattern ? "auto" : undefined,
      }}
    >
      <span
        className="text-[10px] font-medium tracking-widest"
        style={{ color: back.labelColor }}
      >
        {back.label}
      </span>
    </div>
  );
}

function PreviewCardFace({
  rank = "K",
  suit = "♥",
  shadow,
}: {
  rank?: string;
  suit?: string;
  shadow: boolean;
}) {
  const red = suit === "♥" || suit === "♦";
  const colorClass = red ? "text-card-red" : "text-foreground";
  return (
    <div
      className={`card-size rounded-lg border border-border bg-surface flex flex-col justify-between p-1.5 sm:p-2 ${
        shadow ? "shadow-sm" : ""
      }`}
    >
      <div className="flex flex-col items-start leading-none">
        <span className={`card-rank font-semibold ${colorClass}`}>{rank}</span>
        <span className={`card-suit ${colorClass} -mt-px`}>{suit}</span>
      </div>
      <div className="flex items-center justify-center flex-1 pointer-events-none">
        <span className={`card-center-suit ${colorClass} opacity-10`}>{suit}</span>
      </div>
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`card-rank font-semibold ${colorClass}`}>{rank}</span>
        <span className={`card-suit ${colorClass} -mt-px`}>{suit}</span>
      </div>
    </div>
  );
}
