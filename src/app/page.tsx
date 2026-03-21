"use client";
// Customize section enabled
import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";

const games = [
  {
    id: "blackjack",
    name: "Blackjack",
    description: "Basic strategy trainer",
    href: "/blackjack",
    icon: "BJ",
    ready: true,
  },
  {
    id: "poker",
    name: "Poker",
    description: "Heads-up Texas Hold'em",
    href: "/poker",
    icon: "PK",
    ready: true,
  },
];

export default function Home() {
  const { dark: isDark, toggle } = useDarkMode();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 sm:px-8 pt-10 sm:pt-14 pb-4">
        <div />
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors text-xs font-medium"
        >
          {isDark ? "L" : "D"}
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3 mb-12 sm:mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight">
            Card Trainer
          </h1>
          <p className="text-sm sm:text-base text-muted font-light">
            Master the math. No fluff.
          </p>
        </motion.div>

        {/* Game grid */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.15 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {game.ready ? (
                <Link
                  href={game.href}
                  className="group flex items-center gap-4 p-4 sm:p-5 border border-border rounded-xl hover:border-foreground transition-all duration-200"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-foreground text-background flex items-center justify-center text-sm sm:text-base font-semibold shrink-0">
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                      {game.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted">
                      {game.description}
                    </p>
                  </div>
                  <span className="text-muted group-hover:text-foreground transition-colors text-lg">
                    →
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-4 p-4 sm:p-5 border border-border/50 rounded-xl opacity-40 cursor-not-allowed">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted/20 text-muted flex items-center justify-center text-sm sm:text-base font-semibold shrink-0">
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-medium">
                      {game.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted">Coming soon</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Customize card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href="/customize"
              className="group flex items-center gap-4 p-4 sm:p-5 border border-border rounded-xl hover:border-foreground transition-all duration-200"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-foreground text-background flex items-center justify-center text-lg shrink-0">
                ✦
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                  Customize
                </h2>
                <p className="text-xs sm:text-sm text-muted">
                  Card backs, colors &amp; more
                </p>
              </div>
              <span className="text-muted group-hover:text-foreground transition-colors text-lg">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="py-4 sm:py-6 text-center text-[10px] sm:text-xs text-muted safe-bottom">
        Card Trainer
      </footer>
    </div>
  );
}
