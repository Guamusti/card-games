"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";

const games = [
  {
    id: "blackjack",
    name: "Blackjack",
    description: "Basic strategy trainer",
    href: "/blackjack",
    icon: "BJ",
  },
  {
    id: "poker",
    name: "Poker",
    description: "Texas Hold'em vs AI",
    href: "/poker",
    icon: "PK",
  },
  {
    id: "mus",
    name: "Mus",
    description: "2v2 vs bots · online · práctica",
    href: "/mus",
    icon: "MUS",
  },
  {
    id: "counting",
    name: "Card Counting",
    description: "Hi-Lo system practice",
    href: "/counting",
    icon: "#",
  },
  {
    id: "slots",
    name: "Daily Spin",
    description: "5 free tickets every day",
    href: "/slots",
    icon: "777",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppTopBar leftContent={<div />} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3 mb-12 sm:mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-foreground/20 flex items-center justify-center">
              <span className="text-sm sm:text-base font-semibold tracking-tight">CT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight">
              Card Trainer
            </h1>
          </div>
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
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
