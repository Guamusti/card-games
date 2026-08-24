"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppTopBar from "@/components/ui/AppTopBar";
import BottomNav from "@/components/ui/BottomNav";
import { useWalletStore } from "@/engine/wallet";
import { useXPStore } from "@/engine/xp";
import { useBattlePassStore } from "@/engine/battlepass";
import { useCustomizeStore, PLAYER_AVATARS, AVATAR_PRICE, CARD_BACK_PRICE, TABLE_FELT_PRICE, ACCENT_COLOR_PRICE, SUIT_COLOR_PRICE } from "@/engine/customize/store";
import { CARD_BACKS } from "@/engine/customize/cardBacks";
import { useDarkMode } from "@/hooks/useDarkMode";
import type { CardBack, AccentColor, TableFelt, SuitColorScheme, PlayerAvatar, MusDeckTheme } from "@/engine/customize/store";
import type { CubeRarity, CubeReward } from "@/engine/battlepass";

const DECK_LABEL: Record<MusDeckTheme, string> = {
  tradicional: "Tradicional", classic: "Clásica", silueta: "Silueta", minimal: "Minimalista", neon: "Neón",
};
const CUBE_EMOJI: Record<CubeRarity, string> = { 1: "⬜", 2: "🟦", 3: "🟪", 4: "🟨" };
const CUBE_LABEL: Record<CubeRarity, string> = { 1: "Common", 2: "Rare", 3: "Epic", 4: "Legendary" };
const STAR_DISPLAY: Record<CubeRarity, string> = { 1: "★", 2: "★★", 3: "★★★", 4: "★★★★" };

// Cube shop prices (adjusted to match rewards)
const CUBE_SHOP: { rarity: CubeRarity; price: number }[] = [
  { rarity: 1, price: 150 },
  { rarity: 2, price: 500 },
  { rarity: 3, price: 1500 },
  { rarity: 4, price: 4000 },
];

const GEM_SHOP = [
  { id: "coins-5k", label: "5,000 Coins", cost: 5, type: "coins" as const, amount: 5000 },
  { id: "coins-25k", label: "25,000 Coins", cost: 20, type: "coins" as const, amount: 25000 },
  { id: "xp-500", label: "500 XP", cost: 3, type: "xp" as const, amount: 500 },
  { id: "xp-2000", label: "2,000 XP", cost: 10, type: "xp" as const, amount: 2000 },
];

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

const SUIT_COLORS: { id: SuitColorScheme; name: string; preview: { s: string; h: string; d: string; c: string } }[] = [
  { id: "classic", name: "Classic", preview: { s: "#0a0a0a", h: "#b91c1c", d: "#b91c1c", c: "#0a0a0a" } },
  { id: "four-color", name: "4-Color", preview: { s: "#0a0a0a", h: "#dc2626", d: "#2563eb", c: "#16a34a" } },
  { id: "blue-red", name: "Blue-Red", preview: { s: "#2563eb", h: "#dc2626", d: "#dc2626", c: "#2563eb" } },
  { id: "tokyo", name: "Tokyo", preview: { s: "#818cf8", h: "#fb7185", d: "#22d3ee", c: "#c084fc" } },
  { id: "mono", name: "Mono", preview: { s: "#737373", h: "#737373", d: "#737373", c: "#737373" } },
];

type Tab = "cosmetics" | "cubes" | "exchange";

// ─── Confirmation dialog types ───
interface ConfirmData {
  title: string;
  description: string;
  cost: string;
  costColor: string;
  onConfirm: () => void;
}

export default function ShopPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { dark } = useDarkMode();

  const { balance, gems, addChips, removeChips, addGems, removeGems, setBalance, setGems } = useWalletStore();
  const { addXP, reset: resetXP } = useXPStore();
  const { cubes, tapCube, openCube, reset: resetBP } = useBattlePassStore();
  const customize = useCustomizeStore();

  const [tab, setTab] = useState<Tab>("cosmetics");
  const [tappedCube, setTappedCube] = useState<string | null>(null);
  const [openingCube, setOpeningCube] = useState<string | null>(null);
  const [cubeResult, setCubeResult] = useState<CubeReward | null>(null);
  const [showDev, setShowDev] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
  const devTapRef = useRef(0);
  const devTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleTap = useCallback(() => {
    devTapRef.current += 1;
    if (devTimerRef.current) clearTimeout(devTimerRef.current);
    devTimerRef.current = setTimeout(() => { devTapRef.current = 0; }, 2000);
    if (devTapRef.current >= 7) {
      setShowDev((prev) => !prev);
      devTapRef.current = 0;
    }
  }, []);

  if (!mounted) return null;

  // ─── Confirmation helper ───
  const askConfirm = (data: ConfirmData) => setConfirm(data);

  // ─── Buy handlers (all go through confirmation) ───
  const handleBuyAvatar = (avatar: PlayerAvatar) => {
    if (customize.ownedAvatars.includes(avatar)) {
      customize.setPlayerAvatar(avatar);
      return;
    }
    askConfirm({
      title: `Unlock ${avatar}`,
      description: "Avatar",
      cost: `● ${AVATAR_PRICE.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (removeChips(AVATAR_PRICE)) {
          customize.unlockAvatar(avatar);
          customize.setPlayerAvatar(avatar);
        }
      },
    });
  };

  const handleBuyCardBack = (back: CardBack) => {
    if (customize.ownedCardBacks.includes(back)) {
      customize.setCardBack(back);
      return;
    }
    const info = CARD_BACKS.find((b) => b.id === back);
    askConfirm({
      title: `Unlock ${info?.name || back}`,
      description: "Card Back",
      cost: `● ${CARD_BACK_PRICE.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (removeChips(CARD_BACK_PRICE)) {
          customize.unlockCardBack(back);
          customize.setCardBack(back);
        }
      },
    });
  };

  const handleBuyTableFelt = (felt: TableFelt) => {
    if (customize.ownedTableFelts.includes(felt)) {
      customize.setTableFelt(felt);
      return;
    }
    const info = TABLE_FELTS.find((f) => f.id === felt);
    askConfirm({
      title: `Unlock ${info?.name || felt}`,
      description: "Table Background",
      cost: `● ${TABLE_FELT_PRICE.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (removeChips(TABLE_FELT_PRICE)) {
          customize.unlockTableFelt(felt);
          customize.setTableFelt(felt);
        }
      },
    });
  };

  const handleBuyAccent = (color: AccentColor) => {
    if (customize.ownedAccentColors.includes(color)) {
      customize.setAccentColor(color);
      return;
    }
    const info = ACCENT_COLORS.find((c) => c.id === color);
    askConfirm({
      title: `Unlock ${info?.name || color}`,
      description: "Accent Color",
      cost: `● ${ACCENT_COLOR_PRICE.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (removeChips(ACCENT_COLOR_PRICE)) {
          customize.unlockAccentColor(color);
          customize.setAccentColor(color);
        }
      },
    });
  };

  const handleBuySuitColor = (scheme: SuitColorScheme) => {
    if (customize.ownedSuitColors.includes(scheme)) {
      customize.setSuitColors(scheme);
      return;
    }
    const info = SUIT_COLORS.find((s) => s.id === scheme);
    askConfirm({
      title: `Unlock ${info?.name || scheme}`,
      description: "Suit Colors",
      cost: `● ${SUIT_COLOR_PRICE.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (removeChips(SUIT_COLOR_PRICE)) {
          customize.unlockSuitColor(scheme);
          customize.setSuitColors(scheme);
        }
      },
    });
  };

  const handleBuyCube = (rarity: CubeRarity, price: number) => {
    askConfirm({
      title: `Buy ${CUBE_LABEL[rarity]} Cube`,
      description: `${STAR_DISPLAY[rarity]}`,
      cost: `● ${price.toLocaleString()}`,
      costColor: "text-amber-500",
      onConfirm: () => {
        if (!removeChips(price)) return;
        const id = `cube-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newCubes = [...useBattlePassStore.getState().cubes, { id, rarity, taps: 0, maxTaps: 5 as const }];
        useBattlePassStore.setState({ cubes: newCubes });
        try { localStorage.setItem("card-trainer-battlepass", JSON.stringify({ cubes: newCubes, claimedLevels: useBattlePassStore.getState().claimedLevels })); } catch {}
      },
    });
  };

  const handleBuyWithGems = (item: typeof GEM_SHOP[0]) => {
    askConfirm({
      title: `Buy ${item.label}`,
      description: item.type === "coins" ? "Coins" : "Experience",
      cost: `◆ ${item.cost}`,
      costColor: "text-blue-500",
      onConfirm: () => {
        if (!removeGems(item.cost)) return;
        if (item.type === "coins") addChips(item.amount);
        if (item.type === "xp") addXP(item.amount);
      },
    });
  };

  const handleTapCube = (cubeId: string) => {
    const cube = cubes.find((c) => c.id === cubeId);
    if (!cube || cube.taps >= 5) return;
    tapCube(cubeId);
    setTappedCube(cubeId);
    setTimeout(() => setTappedCube(null), 400);
  };

  const handleOpenCube = (cubeId: string) => {
    setOpeningCube(cubeId);
    setTimeout(() => {
      const reward = openCube(cubeId);
      if (reward) {
        if (reward.coins > 0) addChips(reward.coins);
        if (reward.gems > 0) addGems(reward.gems);
        setCubeResult(reward);
      }
      setOpeningCube(null);
    }, 800);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "cosmetics", label: "Cosmetics" },
    { id: "cubes", label: "Cubes" },
    { id: "exchange", label: "Exchange" },
  ];

  return (
    <div className="relative flex flex-col min-h-[100dvh]">
      <AppTopBar />

      <main className="flex-1 px-4 sm:px-6 py-4 pb-20 max-w-lg mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-light tracking-tight text-center mb-4 cursor-default select-none"
          onClick={handleTitleTap}
        >
          Shop
        </motion.h1>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-border/30 p-1 rounded-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ COSMETICS TAB ═══ */}
        {tab === "cosmetics" && (
          <div className="flex flex-col gap-6">
            {/* Avatars */}
            <Section title="Avatars">
              <div className="grid grid-cols-6 gap-2">
                {PLAYER_AVATARS.map((avatar) => {
                  const owned = customize.ownedAvatars.includes(avatar);
                  const equipped = customize.playerAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      onClick={() => handleBuyAvatar(avatar)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
                        equipped
                          ? "ring-2 ring-foreground scale-110 bg-foreground/5"
                          : owned
                          ? "hover:bg-border/30"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span className="text-2xl">{avatar}</span>
                      {!owned && (
                        <span className="text-[8px] text-amber-500 font-medium flex items-center gap-0.5">
                          ● {(AVATAR_PRICE / 1000).toFixed(0)}k
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Baraja de Mus">
              <div className="grid grid-cols-3 gap-2.5">
                {(["tradicional", "classic", "silueta", "minimal", "neon"] as MusDeckTheme[]).map((theme) => (
                  <button key={theme} onClick={() => customize.setMusDeckTheme(theme)} className={`rounded-xl border p-2 text-left transition ${customize.musDeckTheme === theme ? "border-foreground ring-1 ring-foreground" : "border-border"}`}>
                    <div className={`h-16 rounded-lg mb-2 border overflow-hidden flex items-center justify-center ${theme === "neon" ? "bg-[#080909] border-[#78d8f5]" : theme === "minimal" ? "bg-white border-black/10" : "bg-[#fbfaf6] border-black/15"}`}>
                      {theme === "tradicional"
                        ? <img src="/mus/classic/oros_12.webp" alt="" className="h-full w-auto object-contain" />
                        : <span className="text-lg" style={{ color: theme === "neon" ? "#78d8f5" : theme === "minimal" ? "#33312d" : theme === "silueta" ? "#255a92" : "#b8322c" }}>♠</span>}
                    </div>
                    <span className="text-[11px] font-medium">{DECK_LABEL[theme]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[9px] text-muted leading-snug">
                Baraja «Tradicional»: arte de Basquetteur (Wikimedia Commons), licencia <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 3.0</a>.
              </p>
            </Section>

            <Section title="Card Backs">
              <div className="grid grid-cols-4 gap-2.5">
                {CARD_BACKS.map((back) => {
                  const owned = customize.ownedCardBacks.includes(back.id);
                  const equipped = customize.cardBack === back.id;
                  return (
                    <button
                      key={back.id}
                      onClick={() => handleBuyCardBack(back.id)}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all ${
                        equipped
                          ? "ring-2 ring-foreground scale-[1.02]"
                          : owned
                          ? "hover:bg-border/30"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div
                        className="w-12 h-[4.25rem] sm:w-14 sm:h-20 rounded-md border border-border/50 flex items-center justify-center"
                        style={{
                          backgroundColor: back.bg,
                          backgroundImage: back.pattern || undefined,
                          backgroundSize: back.pattern ? "auto" : undefined,
                        }}
                      >
                        <span className="text-[10px] sm:text-xs font-medium tracking-widest" style={{ color: back.labelColor }}>
                          {back.label}
                        </span>
                      </div>
                      <span className={`text-[10px] ${equipped ? "text-foreground font-medium" : "text-muted"}`}>
                        {back.name}
                      </span>
                      {!owned && (
                        <span className="text-[8px] text-amber-500 font-medium flex items-center gap-0.5">
                          ● {(CARD_BACK_PRICE / 1000).toFixed(0)}k
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Accent Colors */}
            <Section title="Accent Color">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {ACCENT_COLORS.map((c) => {
                  const owned = customize.ownedAccentColors.includes(c.id);
                  const equipped = customize.accentColor === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleBuyAccent(c.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                        equipped ? "ring-2 ring-foreground" : owned ? "hover:bg-border/30" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full border border-border/50" style={{ backgroundColor: dark ? c.dark : c.color }} />
                      <span className={`text-[10px] ${equipped ? "text-foreground font-medium" : "text-muted"}`}>{c.name}</span>
                      {!owned && (
                        <span className="text-[8px] text-amber-500 font-medium">● {(ACCENT_COLOR_PRICE / 1000).toFixed(1)}k</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Table Felt */}
            <Section title="Table Background">
              <div className="grid grid-cols-5 gap-2">
                {TABLE_FELTS.map((f) => {
                  const owned = customize.ownedTableFelts.includes(f.id);
                  const equipped = customize.tableFelt === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleBuyTableFelt(f.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                        equipped ? "ring-2 ring-foreground" : owned ? "hover:bg-border/30" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="w-full aspect-[3/2] rounded border border-border/50" style={{ backgroundColor: f.id === "none" ? "var(--color-background)" : f.color }} />
                      <span className={`text-[10px] ${equipped ? "text-foreground font-medium" : "text-muted"}`}>{f.name}</span>
                      {!owned && (
                        <span className="text-[8px] text-amber-500 font-medium">● {(TABLE_FELT_PRICE / 1000).toFixed(1)}k</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Suit Colors */}
            <Section title="Suit Colors">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SUIT_COLORS.map((scheme) => {
                  const owned = customize.ownedSuitColors.includes(scheme.id);
                  const equipped = customize.suitColors === scheme.id;
                  return (
                    <button
                      key={scheme.id}
                      onClick={() => handleBuySuitColor(scheme.id)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all ${
                        equipped ? "ring-2 ring-foreground" : owned ? "hover:bg-border/30" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex gap-1.5 text-base font-semibold">
                        <span style={{ color: scheme.preview.s }}>♠</span>
                        <span style={{ color: scheme.preview.h }}>♥</span>
                        <span style={{ color: scheme.preview.d }}>♦</span>
                        <span style={{ color: scheme.preview.c }}>♣</span>
                      </div>
                      <span className={`text-[10px] ${equipped ? "text-foreground font-medium" : "text-muted"}`}>{scheme.name}</span>
                      {!owned && (
                        <span className="text-[8px] text-amber-500 font-medium">● {(SUIT_COLOR_PRICE / 1000).toFixed(0)}k</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Settings (free, always available) */}
            <Section title="Settings">
              <div className="flex gap-2 mb-2">
                {(["slow", "normal", "fast"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => customize.setAnimationSpeed(s)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      customize.animationSpeed === s ? "border-foreground text-foreground bg-foreground/5" : "border-border text-muted hover:border-foreground/50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <ToggleRow label="Card shadow" checked={customize.showCardShadow} onChange={() => customize.setShowCardShadow(!customize.showCardShadow)} />
              <ToggleRow label="Haptic feedback" checked={customize.hapticFeedback} onChange={() => customize.setHapticFeedback(!customize.hapticFeedback)} />
            </Section>
          </div>
        )}

        {/* ═══ CUBES TAB ═══ */}
        {tab === "cubes" && (
          <div className="flex flex-col gap-6">
            {/* Buy Cubes */}
            <Section title="Buy Cubes">
              <div className="grid grid-cols-2 gap-2">
                {CUBE_SHOP.map(({ rarity, price }) => (
                  <motion.button
                    key={rarity}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBuyCube(rarity, price)}
                    disabled={balance < price}
                    className="flex flex-col items-center gap-1.5 p-4 border border-border rounded-xl hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-3xl">{CUBE_EMOJI[rarity]}</span>
                    <span className="text-sm font-medium">{CUBE_LABEL[rarity]}</span>
                    <span className="text-xs text-amber-500 font-medium flex items-center gap-0.5">
                      ● {price.toLocaleString()}
                    </span>
                  </motion.button>
                ))}
              </div>
            </Section>

            {/* My Cubes */}
            {cubes.length > 0 && (
              <Section title="My Cubes">
                <p className="text-xs text-muted -mt-1 mb-1">Tap to upgrade (20% chance). Open at 5/5 for coins or gems.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {cubes.map((cube) => {
                    const isReady = cube.taps >= 5;
                    const isOpening = openingCube === cube.id;
                    return (
                      <motion.button
                        key={cube.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => isReady ? handleOpenCube(cube.id) : handleTapCube(cube.id)}
                        disabled={isOpening}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          isOpening
                            ? "border-correct animate-pulse scale-105"
                            : isReady
                            ? "border-correct/50 bg-correct/5 hover:bg-correct/10"
                            : "border-border hover:border-foreground"
                        } ${tappedCube === cube.id ? "ring-2 ring-foreground" : ""}`}
                      >
                        <motion.span
                          className="text-3xl"
                          animate={tappedCube === cube.id ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          {CUBE_EMOJI[cube.rarity]}
                        </motion.span>
                        <span className="text-[10px] text-muted">{STAR_DISPLAY[cube.rarity]}</span>
                        <span className={`text-[10px] tabular-nums font-medium ${isReady ? "text-correct" : "text-muted"}`}>
                          {isReady ? "OPEN" : `${cube.taps}/5`}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* ═══ EXCHANGE TAB ═══ */}
        {tab === "exchange" && (
          <div className="flex flex-col gap-6">
            {/* Gem Exchange */}
            <Section title="Spend Gems">
              <div className="flex flex-col gap-2">
                {GEM_SHOP.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBuyWithGems(item)}
                    disabled={gems < item.cost}
                    className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.type === "coins" ? "●" : "⚡"}</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-blue-500">◆</span>
                      <span>{item.cost}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </Section>

            {/* Free Packs */}
            <Section title="Free Packs">
              <div className="flex flex-col gap-2">
                {[
                  { label: "1,000 Coins", amount: 1000 },
                  { label: "5,000 Coins", amount: 5000 },
                ].map((item) => (
                  <motion.button
                    key={item.amount}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addChips(item.amount)}
                    className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-foreground transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500 text-xl">●</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-correct">Free</span>
                  </motion.button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Dev Tools - hidden behind 7 taps on title */}
        {showDev && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 border border-dashed border-accent/50 rounded-xl p-4"
          >
            <h2 className="text-xs uppercase tracking-widest text-accent mb-3">Dev Tools</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setBalance(999999); setGems(999); }}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:border-foreground transition-colors"
              >
                ∞ Resources
              </button>
              <button
                onClick={() => addXP(10000)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:border-foreground transition-colors"
              >
                +10K XP
              </button>
              <button
                onClick={() => addGems(50)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:border-foreground transition-colors"
              >
                +50 Gems
              </button>
              <button
                onClick={() => {
                  setBalance(0);
                  setGems(0);
                  resetXP();
                  resetBP();
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-accent text-accent hover:bg-accent hover:text-background transition-colors"
              >
                Reset All
              </button>
            </div>
          </motion.section>
        )}

        {/* ═══ CONFIRMATION MODAL ═══ */}
        <AnimatePresence>
          {confirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-0"
              onClick={() => setConfirm(null)}
            >
              <div className="absolute inset-0 bg-black/40" />
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-background border border-border rounded-2xl p-6 max-w-sm w-full"
              >
                <p className="text-xs text-muted uppercase tracking-widest mb-1">{confirm.description}</p>
                <h3 className="text-lg font-semibold mb-4">{confirm.title}</h3>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-muted">Cost</span>
                  <span className={`text-base font-bold ${confirm.costColor}`}>{confirm.cost}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirm(null)}
                    className="flex-1 py-3 text-sm font-medium rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirm.onConfirm();
                      setConfirm(null);
                    }}
                    className="flex-1 py-3 text-sm font-semibold rounded-xl border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CUBE RESULT MODAL ═══ */}
        <AnimatePresence>
          {cubeResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              onClick={() => setCubeResult(null)}
            >
              <div className="absolute inset-0 bg-black/60" />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-background border border-border rounded-2xl p-8 max-w-xs w-full text-center"
              >
                <motion.div
                  initial={{ y: -20, scale: 0.5 }}
                  animate={{ y: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10, delay: 0.1 }}
                  className="text-5xl mb-4"
                >
                  {cubeResult.coins > 0 ? "●" : "◆"}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">
                  {cubeResult.coins > 0 ? "Coins!" : "Gems!"}
                </h3>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                  className="text-2xl font-bold tabular-nums mb-1"
                >
                  {cubeResult.coins > 0 && (
                    <span className="text-amber-500">+{cubeResult.coins.toLocaleString()}</span>
                  )}
                  {cubeResult.gems > 0 && (
                    <span className="text-blue-500">+{cubeResult.gems}</span>
                  )}
                </motion.p>
                <button
                  onClick={() => setCubeResult(null)}
                  className="mt-4 px-6 py-2.5 text-sm font-semibold uppercase tracking-widest border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors rounded-lg"
                >
                  Nice
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:border-foreground/50 transition-colors"
    >
      <span className="text-xs sm:text-sm">{label}</span>
      <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${checked ? "bg-foreground" : "bg-border"}`}>
        <div className={`w-4 h-4 rounded-full bg-background transition-transform duration-200 mx-1 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </button>
  );
}
