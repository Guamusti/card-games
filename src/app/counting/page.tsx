"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";
import { createDeck } from "@/engine/deck";
import type { Card, Rank } from "@/engine/types";

// Hi-Lo counting system values
function hiLoValue(rank: Rank): number {
  if (["2", "3", "4", "5", "6"].includes(rank)) return +1;
  if (["10", "J", "Q", "K", "A"].includes(rank)) return -1;
  return 0; // 7, 8, 9
}

type Speed = "slow" | "normal" | "fast";
const SPEED_MS: Record<Speed, number> = { slow: 2500, normal: 1500, fast: 800 };
const SPEED_LABELS: Record<Speed, string> = { slow: "Slow", normal: "Normal", fast: "Fast" };

type Mode = "practice" | "quiz";

function suitColor(suit: string): string {
  return suit === "♥" || suit === "♦" ? "text-[#b91c1c]" : "text-foreground";
}

export default function CountingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [mode, setMode] = useState<Mode>("practice");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [running, setRunning] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [cardsDealt, setCardsDealt] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [showCount, setShowCount] = useState(true); // practice mode shows, quiz hides
  const [userGuess, setUserGuess] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);
  const deckRef = useRef<Card[]>([]);
  const dealtRef = useRef(0);

  // Initialize deck
  const resetDeck = useCallback(() => {
    const newDeck = createDeck(1); // Single deck for easier learning
    setDeck(newDeck);
    deckRef.current = newDeck;
    setCurrentCard(null);
    setCardsDealt(0);
    dealtRef.current = 0;
    setRunningCount(0);
    countRef.current = 0;
    setRunning(false);
    setPaused(false);
    setUserGuess(null);
    setQuizResult(null);
    setQuizScore({ correct: 0, total: 0 });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => { resetDeck(); }, [resetDeck]);

  const dealNext = useCallback(() => {
    if (deckRef.current.length === 0) {
      // Deck exhausted
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const [card, ...remaining] = deckRef.current;
    deckRef.current = remaining;
    setDeck(remaining);
    setCurrentCard(card);
    dealtRef.current++;
    setCardsDealt(dealtRef.current);

    const val = hiLoValue(card.rank);
    countRef.current += val;
    setRunningCount(countRef.current);

    // In quiz mode, pause every 5 cards to ask the count
    if (mode === "quiz" && dealtRef.current % 5 === 0) {
      setPaused(true);
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShowCount(false);
    }
  }, [mode]);

  const startDealing = useCallback(() => {
    if (deckRef.current.length === 0) {
      resetDeck();
      return;
    }

    setRunning(true);
    setPaused(false);
    setUserGuess(null);
    setQuizResult(null);
    setShowCount(mode === "practice");

    // Deal first card immediately
    dealNext();

    // Continue dealing at speed interval
    intervalRef.current = setInterval(() => {
      dealNext();
    }, SPEED_MS[speed]);
  }, [speed, mode, dealNext, resetDeck]);

  const stopDealing = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Quiz answer submission
  const submitGuess = useCallback(() => {
    if (userGuess === null) return;
    const isCorrect = userGuess === countRef.current;
    setQuizResult(isCorrect ? "correct" : "wrong");
    setShowCount(true);
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [userGuess]);

  const continueAfterQuiz = useCallback(() => {
    setQuizResult(null);
    setUserGuess(null);
    startDealing();
  }, [startDealing]);

  if (!mounted) return null;

  const trueCount = deck.length > 0
    ? (runningCount / (deck.length / 52)).toFixed(1)
    : "—";
  const decksRemaining = (deck.length / 52).toFixed(1);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-6 pb-20 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight">Card Counting</h1>
          <p className="text-xs sm:text-sm text-muted">Hi-Lo System Practice</p>
        </motion.div>

        {/* Mode & Speed selectors */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-1 bg-border/30 p-0.5 rounded-lg">
            {(["practice", "quiz"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetDeck(); }}
                disabled={running}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                } ${running ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {m === "practice" ? "Practice" : "Quiz"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-border/30 p-0.5 rounded-lg">
            {(["slow", "normal", "fast"] as Speed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={running}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  speed === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                } ${running ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {SPEED_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Hi-Lo reference */}
        <div className="flex gap-3 text-xs text-muted">
          <span><span className="text-correct font-semibold">+1</span> 2-6</span>
          <span><span className="font-semibold">0</span> 7-9</span>
          <span><span className="text-accent font-semibold">-1</span> 10-A</span>
        </div>

        {/* Card display area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full max-w-sm">
          {/* Current card */}
          <div className="relative w-28 h-40 sm:w-36 sm:h-52">
            <AnimatePresence mode="wait">
              {currentCard ? (
                <motion.div
                  key={`${currentCard.rank}${currentCard.suit}-${cardsDealt}`}
                  initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-background border-2 border-border rounded-xl flex flex-col items-center justify-center shadow-md"
                >
                  <span className={`text-4xl sm:text-5xl font-bold ${suitColor(currentCard.suit)}`}>
                    {currentCard.rank}
                  </span>
                  <span className={`text-2xl sm:text-3xl ${suitColor(currentCard.suit)}`}>
                    {currentCard.suit}
                  </span>
                  {/* Card value indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="absolute bottom-2 right-2"
                  >
                    {showCount && (
                      <span className={`text-xs font-bold ${
                        hiLoValue(currentCard.rank) > 0 ? "text-correct"
                          : hiLoValue(currentCard.rank) < 0 ? "text-accent"
                          : "text-muted"
                      }`}>
                        {hiLoValue(currentCard.rank) > 0 ? "+1" : hiLoValue(currentCard.rank) < 0 ? "-1" : "0"}
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 border-2 border-dashed border-border rounded-xl flex items-center justify-center"
                >
                  <span className="text-muted text-sm">
                    {deck.length === 0 ? "Deck empty" : "Ready"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Count display (practice mode) or quiz panel */}
          {mode === "practice" ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex gap-4">
                <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-border">
                  <span className="text-[10px] text-muted uppercase tracking-wider">Running</span>
                  <motion.span
                    key={runningCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={`text-2xl font-bold tabular-nums ${
                      runningCount > 0 ? "text-correct" : runningCount < 0 ? "text-accent" : ""
                    }`}
                  >
                    {runningCount >= 0 ? "+" : ""}{runningCount}
                  </motion.span>
                </div>
                <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-border">
                  <span className="text-[10px] text-muted uppercase tracking-wider">True</span>
                  <span className="text-2xl font-bold tabular-nums">{trueCount}</span>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted">
                <span>Cards: {cardsDealt}/{cardsDealt + deck.length}</span>
                <span>Decks left: {decksRemaining}</span>
              </div>
            </div>
          ) : paused ? (
            /* Quiz mode: asking for count */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 w-full max-w-xs"
            >
              <p className="text-sm font-semibold">
                What is the running count?
              </p>
              <p className="text-xs text-muted">{cardsDealt} cards dealt</p>

              {quizResult === null ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUserGuess((prev) => (prev ?? 0) - 1)}
                      className="w-10 h-10 rounded-lg border border-border text-lg font-semibold hover:border-foreground transition-colors"
                    >
                      −
                    </button>
                    <span className="w-16 text-center text-2xl font-bold tabular-nums">
                      {userGuess ?? 0}
                    </span>
                    <button
                      onClick={() => setUserGuess((prev) => (prev ?? 0) + 1)}
                      className="w-10 h-10 rounded-lg border border-border text-lg font-semibold hover:border-foreground transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={submitGuess}
                    className="px-6 py-2.5 text-sm font-semibold border border-foreground rounded-lg hover:bg-foreground hover:text-background transition-colors"
                  >
                    Submit
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className={`text-lg font-bold ${quizResult === "correct" ? "text-correct" : "text-accent"}`}>
                    {quizResult === "correct" ? "Correct!" : `Wrong — it's ${runningCount >= 0 ? "+" : ""}${runningCount}`}
                  </span>
                  <button
                    onClick={continueAfterQuiz}
                    disabled={deck.length === 0}
                    className="px-6 py-2.5 text-sm font-semibold border border-foreground rounded-lg hover:bg-foreground hover:text-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {deck.length === 0 ? "Deck Empty" : "Continue"}
                  </button>
                </motion.div>
              )}

              {quizScore.total > 0 && (
                <p className="text-xs text-muted">
                  Score: {quizScore.correct}/{quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
                </p>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-3 text-xs text-muted">
              <span>Cards: {cardsDealt}/{cardsDealt + deck.length}</span>
              {quizScore.total > 0 && (
                <span>Score: {quizScore.correct}/{quizScore.total}</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full max-w-sm pb-6">
          {!running && !paused ? (
            <>
              <button
                onClick={startDealing}
                disabled={deck.length === 0}
                className="flex-1 py-4 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:border-border disabled:text-border disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                {cardsDealt > 0 && deck.length > 0 ? "Resume" : deck.length === 0 ? "Done" : "Start"}
              </button>
              {(cardsDealt > 0 || deck.length === 0) && (
                <button
                  onClick={resetDeck}
                  className="py-4 px-5 text-sm font-semibold uppercase tracking-widest border border-border text-muted hover:border-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  Reset
                </button>
              )}
            </>
          ) : running ? (
            <button
              onClick={stopDealing}
              className="flex-1 py-4 text-sm font-semibold uppercase tracking-widest border border-accent text-accent hover:bg-accent hover:text-background transition-colors rounded-lg"
            >
              Pause
            </button>
          ) : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
