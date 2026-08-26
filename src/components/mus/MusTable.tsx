"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useMusStore, type MusStore } from "@/engine/mus/store";
import type { MusPlayer, Lance } from "@/engine/mus/types";
import { teamOfSeat, LANCE_LABEL } from "@/engine/mus/types";
import { evaluateMusHand } from "@/engine/mus/rules";
import { resolveLanceWinner } from "@/engine/mus/scoring";
import { lanceWinProbability } from "@/engine/mus/probability";
import { decideBet } from "@/engine/mus/ai";
import { buzz } from "@/engine/mus/haptics";
import { availableSenas, SENAS, type SenaId } from "@/engine/mus/senas";
import SenaIcon from "./SenaIcon";
import MusCard from "./MusCard";
import MusAvatar from "./MusAvatar";
import ScoreBoard from "./ScoreBoard";
import LanceBar from "./LanceBar";
import MusHelp from "./MusHelp";
import { useCustomizeStore, type TableFelt } from "@/engine/customize/store";
import { useMusStatsStore } from "@/engine/mus/stats";
import RoomChat from "./RoomChat";

const FELT_BACKGROUND: Record<TableFelt, string> = {
  none: "radial-gradient(110% 92% at 50% 44%, #294044 0%, #1a2b30 55%, #10191d 100%)",
  subtle: "radial-gradient(110% 92% at 50% 44%, #30494a 0%, #1c3032 55%, #111b1d 100%)",
  green: "radial-gradient(110% 92% at 50% 44%, #29483b 0%, #193027 55%, #101b17 100%)",
  blue: "radial-gradient(110% 92% at 50% 44%, #294555 0%, #192e39 55%, #101b22 100%)",
  wine: "radial-gradient(110% 92% at 50% 44%, #4a3039 0%, #301e27 55%, #1b1117 100%)",
};

export default function MusTable() {
  const s = useMusStore();
  const recordedResults = useRef(new Set<string>());
  const tableFelt = useCustomizeStore((state) => state.tableFelt);
  const musTrainer = useCustomizeStore((state) => state.musTrainer);
  const [helpOpen, setHelpOpen] = useState(false);
  // Recuento inspection: click a lance to see which hand won it.
  const [selLance, setSelLance] = useState<Lance | null>(null);
  // Manual left-to-right order of the player's own hand (drag to reorder).
  const [handOrder, setHandOrder] = useState<number[]>([0, 1, 2, 3]);
  const [senaOpen, setSenaOpen] = useState(false);

  useEffect(() => {
    if (s.phase === "idle" && s.mode === "solo") s.startSolo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = s.localSeat;
  const seat = (n: number) => s.players.find((p) => p.seat === n)!;
  // Rotate so the local player is always at the bottom.
  const you = seat(me), partner = seat((me + 2) % 4), oppRight = seat((me + 1) % 4), oppLeft = seat((me + 3) % 4);
  const myTeam = teamOfSeat(me);

  const isLance = ["grande", "chica", "pares", "juego"].includes(s.phase);
  const rt = s.currentLance ? s.lances[s.currentLance] : null;
  const liveEnviteForUs = !!rt && rt.bet.envidoTeam !== null && rt.bet.envidoTeam !== myTeam;
  const openingTurnMe = !!rt && !rt.outcome && rt.bet.envidoTeam === null && rt.order[rt.activeIdx] === me;
  const respondTurnMe = !!rt && !rt.outcome && liveEnviteForUs && rt.order.includes(me) && s.humanSeats.includes(me) && !(rt.responsePassedSeats ?? []).includes(me);
  const humanTurnInLance = openingTurnMe || respondTurnMe;
  const currentStake = rt ? (rt.bet.chain[rt.bet.chain.length - 1] ?? 0) : 0;
  const musOrder = [0, 1, 2, 3].map((i) => (s.manoSeat + i) % 4);
  const musTurnHuman = s.phase === "mus" && musOrder[s.musActiveIdx] === me;
  const stakeOnTable = rt && rt.bet.envidoTeam !== null && !rt.bet.isOrdago ? currentStake : 0;
  const isOrdago = !!rt?.bet.isOrdago && rt.bet.envidoTeam !== null;

  useEffect(() => {
    if (s.phase === "idle") {
      recordedResults.current.clear();
      return;
    }
    if (!(["handEnd", "vacaEnd", "gameEnd"] as string[]).includes(s.phase)) return;
    const ownTeam = teamOfSeat(s.localSeat);
    const ownStones = s.handScores.filter((score) => score.winnerTeam === ownTeam).reduce((sum, score) => sum + score.points, 0);
    const otherStones = s.handScores.filter((score) => score.winnerTeam && score.winnerTeam !== ownTeam).reduce((sum, score) => sum + score.points, 0);
    const handKey = `hand-${s.dealerSeat}-${s.musRound}`;
    if (!recordedResults.current.has(handKey)) {
      recordedResults.current.add(handKey);
      useMusStatsStore.getState().recordHand(
        ownStones > otherStones || s.ordagoVaca === ownTeam,
        ownStones,
        s.ordagoVaca === ownTeam,
        s.handScores.filter((score) => !!score.winnerTeam).map((score) => ({ lance: score.lance, won: score.winnerTeam === ownTeam, stones: score.winnerTeam === ownTeam ? score.points : 0 })),
      );
    }
    if (s.phase === "vacaEnd" || s.phase === "gameEnd") {
      const vacaKey = `vaca-${s.dealerSeat}-${s.musRound}`;
      if (!recordedResults.current.has(vacaKey)) {
        recordedResults.current.add(vacaKey);
        useMusStatsStore.getState().recordVaca(s.ordagoVaca === ownTeam);
      }
    }
    if (s.phase === "gameEnd") {
      const gameKey = `game-${s.dealerSeat}-${s.musRound}`;
      if (!recordedResults.current.has(gameKey)) {
        recordedResults.current.add(gameKey);
        const rankedFriendsRoom = s.mode === "online" && s.humanSeats.length === 4 && s.config.matchType === "ranked";
        useMusStatsStore.getState().recordGame(s.winnerTeam === ownTeam, rankedFriendsRoom);
      }
    }
  }, [s.config.matchType, s.dealerSeat, s.handScores, s.humanSeats.length, s.localSeat, s.mode, s.musRound, s.ordagoVaca, s.phase, s.winnerTeam]);

  // Which seats are on the clock right now (a whole team can respond).
  let activeSeats: number[] = [];
  if (s.phase === "mus") activeSeats = [musOrder[s.musActiveIdx]];
  else if (isLance && rt && !rt.outcome) {
    if (rt.bet.envidoTeam === null) activeSeats = [rt.order[rt.activeIdx]];
    else {
      const respondTeam = rt.bet.envidoTeam === "A" ? "B" : "A";
      activeSeats = rt.order.filter((se) => teamOfSeat(se) === respondTeam && !(rt.responsePassedSeats ?? []).includes(se));
    }
  }
  const myTurn = musTurnHuman || humanTurnInLance;
  const waitingSeat = activeSeats.find((se) => se !== me) ?? activeSeats[0];
  const waitingName = waitingSeat != null && s.players.length ? seat(waitingSeat).name : null;

  // Recuento: which seat's hand won the lance the player tapped.
  const inRecuento = ["showdown", "handEnd", "vacaEnd", "gameEnd"].includes(s.phase);
  let winnerSeat: number | null = null;
  if (selLance && s.reveal) {
    const evals = s.players.map((p) => ({ seat: p.seat, team: teamOfSeat(p.seat), eval: evaluateMusHand(p.cards, s.config.reyes8) }));
    const lrt = s.lances[selLance];
    const parts = lrt && lrt.order.length ? lrt.order.map((se) => evals[se]) : evals;
    winnerSeat = resolveLanceWinner(selLance, parts, musOrder)?.seat ?? null;
  }
  const cardFx = (seatNum: number) => ({
    highlight: winnerSeat === seatNum,
    dimmed: !!selLance && winnerSeat !== null && seatNum !== winnerSeat,
  });

  // Trainer overlay (solo only): win % for the current lance + best play.
  const trainer = useMemo(() => {
    if (!musTrainer || s.mode !== "solo" || !isLance || !s.currentLance) return null;
    const lance = s.currentLance;
    const ev = evaluateMusHand(you.cards, s.config.reyes8);
    const participates = lance === "pares" ? ev.pares.category !== "none"
      : lance === "juego" ? (rt?.isPunto ? true : ev.juego.hasJuego)
      : true;
    const pct = Math.round(lanceWinProbability(you.cards, s.config.reyes8, lance, 2, 400) * 100);
    let rec: string | null = null;
    if (humanTurnInLance) {
      const d = decideBet({
        eval: ev, lance, cards: you.cards, reyes8: s.config.reyes8,
        liveEnvite: liveEnviteForUs, currentStake, isOrdago,
        difficulty: "imposible", pointsToWin: Math.max(1, s.config.vacaPoints - s.score[myTeam]),
      });
      rec = betLabel(d);
    }
    return { lance, pct, participates, rec };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musTrainer, s.mode, isLance, s.currentLance, s.musRound, humanTurnInLance, liveEnviteForUs, currentStake, isOrdago]);

  // Haptic nudge when it becomes the human's turn.
  useEffect(() => { if (myTurn) buzz("turn"); }, [myTurn, s.currentLance, s.phase, s.musActiveIdx]);

  // Clear the inspected lance on a new hand or when leaving the recuento.
  useEffect(() => { setSelLance(null); }, [s.musRound, s.dealerSeat, inRecuento]);
  // Reset the hand order each new deal / after discards.
  useEffect(() => { setHandOrder([0, 1, 2, 3]); }, [s.musRound, s.dealerSeat]);

  // Haptic on hand/vaca/game resolution (win vs loss for the local team).
  const settledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!(["handEnd", "vacaEnd", "gameEnd"] as string[]).includes(s.phase)) { settledRef.current = null; return; }
    const key = `${s.dealerSeat}-${s.musRound}-${s.phase}`;
    if (settledRef.current === key) return;
    settledRef.current = key;
    const own = teamOfSeat(me);
    const ownPts = s.handScores.filter((x) => x.winnerTeam === own).reduce((a, x) => a + x.points, 0);
    const oppPts = s.handScores.filter((x) => x.winnerTeam && x.winnerTeam !== own).reduce((a, x) => a + x.points, 0);
    const won = s.ordagoVaca ? s.ordagoVaca === own : ownPts >= oppPts;
    buzz(won ? "win" : "lose");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, s.musRound, s.dealerSeat]);

  // Keyboard shortcuts (desktop). Only fire on the human's turn / at recuento.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      const recuento = ["showdown", "handEnd", "vacaEnd", "gameEnd"].includes(s.phase);
      if (recuento && (k === "enter" || k === " ")) { e.preventDefault(); s.nextHand(); return; }
      if (s.phase === "mus" && musTurnHuman) {
        if (k === "m") s.voteMus(true);
        else if (k === "n") s.voteMus(false);
        return;
      }
      if (!isLance || !humanTurnInLance) return;
      if (k === "p") s.humanBet({ type: "paso" });
      else if (k === "q" && liveEnviteForUs) { buzz("quiero"); s.humanBet({ type: "quiero" }); }
      else if (k === "n" && liveEnviteForUs) s.humanBet({ type: "noquiero" });
      else if (k === "e" && !liveEnviteForUs) { buzz("envite"); s.humanBet({ type: "envido", amount: 2 }); }
      else if (k === "s" && liveEnviteForUs) { buzz("envite"); s.humanBet({ type: "subir", amount: 2 }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, musTurnHuman, isLance, humanTurnInLance, liveEnviteForUs]);

  return (
    <div className="flex flex-col min-h-[100dvh] px-3 pt-12 pb-3">
      <button
        onClick={() => setHelpOpen(true)}
        aria-label="Reglas del Mus"
        className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full border border-border text-muted hover:text-foreground hover:border-foreground flex items-center justify-center text-sm font-semibold"
      >?</button>
      <MusHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      {s.config.senasEnabled && s.humanSeats.includes(me) && ["mus", "grande", "chica", "pares", "juego"].includes(s.phase) && (
        <SenaPicker
          open={senaOpen} onToggle={() => setSenaOpen((v) => !v)}
          senas={availableSenas(you.cards, s.config.reyes8)}
          onPick={(id) => { buzz("tap"); s.makeSena(id); setSenaOpen(false); }}
        />
      )}
      <div className="w-full max-w-md mx-auto flex flex-col gap-3 flex-1">
        <ScoreBoard
          scoreA={s.score.A} scoreB={s.score.B}
          vacasA={s.vacas.A} vacasB={s.vacas.B}
          target={s.config.vacaPoints} bestOf={s.config.bestOf}
        />

        {/* Felt table */}
        <div
          className="relative rounded-[1.75rem] border border-white/10 flex-1 min-h-[300px] max-h-[440px] overflow-hidden shadow-[0_18px_45px_rgba(9,14,16,0.2)]"
          style={{ background: FELT_BACKGROUND[tableFelt] }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[1.3rem] border border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_0_55px_rgba(0,0,0,0.22)]" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[44%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.09]" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[30%] w-[43%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.05]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.09]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 0.5px, transparent 0.7px)", backgroundSize: "6px 6px" }} />
          {/* Partner (top) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <SeatView player={partner} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[partner.seat]} active={activeSeats.includes(partner.seat)} round={s.musRound} dealFrom="top" sena={s.senaBySeat[partner.seat]} {...cardFx(partner.seat)} />
          </div>
          {/* Opponents (sides) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <SeatView player={oppLeft} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[oppLeft.seat]} active={activeSeats.includes(oppLeft.seat)} round={s.musRound} dealFrom="left" {...cardFx(oppLeft.seat)} />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <SeatView player={oppRight} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[oppRight.seat]} active={activeSeats.includes(oppRight.seat)} round={s.musRound} dealFrom="right" {...cardFx(oppRight.seat)} />
          </div>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <CenterInfo phase={s.phase} lanceLabel={s.currentLance ? (s.currentLance === "juego" && rt?.isPunto ? "Punto" : LANCE_LABEL[s.currentLance]) : null} stake={stakeOnTable} message={s.message} isOrdago={isOrdago} declaring={!!s.declaring} />
          </div>
        </div>

        {/* You (bottom) */}
        <div className="relative flex flex-col items-center gap-1.5">
          <AnimatePresence>
            {s.senaBySeat[me] && <SenaBubble key={s.senaBySeat[me]} id={s.senaBySeat[me]!} />}
          </AnimatePresence>
          <div className="h-6 flex items-center">
            <AnimatePresence>
              {s.seatActions[me] && <ActionBubble key={s.seatActions[me]} text={s.seatActions[me]!} big />}
            </AnimatePresence>
          </div>
          <Reorder.Group
            axis="x" values={handOrder} onReorder={setHandOrder}
            className="flex w-full justify-center gap-1 px-1 sm:gap-2 list-none"
          >
            {handOrder.filter((i) => i < you.cards.length).map((i) => {
              const c = you.cards[i];
              return (
                <Reorder.Item
                  key={`${c.rank}-${c.suit}-${i}`}
                  value={i}
                  drag={s.phase !== "discard"}
                  whileDrag={{ scale: 1.08, zIndex: 20 }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <MusCard
                    card={c}
                    delay={i * 0.09}
                    dealFrom="bottom"
                    selected={s.phase === "discard" && s.discardSelection.includes(i)}
                    onClick={s.phase === "discard" ? () => s.toggleDiscard(i) : undefined}
                    {...cardFx(me)}
                  />
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          <PlayerTag player={you} manoSeat={s.manoSeat} active={activeSeats.includes(me)} />
        </div>

        {/* Trainer hint (solo, opt-in) */}
        {trainer && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-[11px] -mb-1">
            <span className="px-2 py-1 rounded-full border border-accent/40 bg-accent/5 text-accent font-medium">
              {trainer.participates ? `${LANCE_LABEL[trainer.lance]}: ${trainer.pct}% de ganar` : "No juegas este lance"}
            </span>
            {trainer.rec && <span className="px-2 py-1 rounded-full border border-border text-muted">Juega: <b className="text-foreground">{trainer.rec}</b></span>}
          </motion.div>
        )}

        {/* Controls */}
        <div className="min-h-[104px] flex items-center justify-center">
          {s.phase === "mus" && musTurnHuman && (
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
              <button onClick={() => { buzz("tap"); s.voteMus(true); }} className="rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition">Mus</button>
              <button onClick={() => { buzz("tap"); s.voteMus(false); }} className="rounded-xl border border-border px-4 py-3.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground active:scale-95 transition">No hay mus</button>
              <button onClick={() => { buzz("tap"); s.voteMus(false, "Hasta mi compañero"); }} className="rounded-xl border border-border px-3 py-3.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground active:scale-95 transition">Hasta mi compañero</button>
            </div>
          )}
          {s.phase === "mus" && !musTurnHuman && (
            <WaitingFor name={waitingName} />
          )}

          {s.phase === "discard" && s.discardConfirmed.includes(me) && (
            <span className="text-xs text-muted animate-pulse">Esperando a los demás…</span>
          )}
          {s.phase === "discard" && !s.discardConfirmed.includes(me) && (
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <span className="text-xs text-muted">Toca las cartas a descartar</span>
              <button
                onClick={() => s.confirmDiscard()}
                disabled={s.discardSelection.length === 0}
                className="w-full rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition"
              >
                Descartar {s.discardSelection.length > 0 ? `(${s.discardSelection.length})` : ""}
              </button>
            </div>
          )}

          {s.declaring && !s.declaredSeats.includes(me) && (
            <DeclarePrompt lance={s.declaring as "pares" | "juego"} cards={you.cards} onDeclare={() => s.declare()} />
          )}
          {s.declaring && s.declaredSeats.includes(me) && (
            <span className="text-xs text-muted animate-pulse">Esperando declaraciones…</span>
          )}

          {!s.declaring && isLance && humanTurnInLance && (
            <LanceBar mode={liveEnviteForUs ? "respond" : "open"} currentStake={currentStake} onBet={(a) => s.humanBet(a)} />
          )}

          {!s.declaring && isLance && !humanTurnInLance && (
            <WaitingFor name={waitingName} />
          )}

          {(s.phase === "showdown" || s.phase === "handEnd" || s.phase === "vacaEnd" || s.phase === "gameEnd") && (
            <Recuento store={s} selLance={selLance} onSelLance={setSelLance} />
          )}
        </div>
      </div>
      {s.mode === "online" && <RoomChat />}
    </div>
  );
}

function WaitingFor({ name }: { name: string | null }) {
  return (
    <span className="text-xs text-muted flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="w-1 h-1 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </span>
      {name ? <>Turno de <b className="text-foreground/80">{name}</b></> : "Esperando…"}
    </span>
  );
}

function DeclarePrompt({ lance, cards, onDeclare }: { lance: "pares" | "juego"; cards: MusPlayer["cards"]; onDeclare: () => void }) {
  const ev = evaluateMusHand(cards, true);
  const has = lance === "pares" ? ev.pares.category !== "none" : ev.juego.hasJuego;
  const word = lance === "pares" ? "pares" : "juego";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 w-full max-w-xs">
      <span className="text-xs text-muted">¿Tienes {word}? (di la verdad)</span>
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          onClick={onDeclare} disabled={!has}
          className="rounded-xl border px-4 py-3.5 text-sm font-medium transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border-correct bg-correct text-white"
        >
          Tengo {word}
        </button>
        <button
          onClick={onDeclare} disabled={has}
          className="rounded-xl border px-4 py-3.5 text-sm font-medium transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border-border text-muted"
        >
          No tengo
        </button>
      </div>
    </motion.div>
  );
}

function CenterInfo({ phase, lanceLabel, stake, message, isOrdago, declaring }: { phase: string; lanceLabel: string | null; stake: number; message: string | null; isOrdago: boolean; declaring?: boolean }) {
  const inLance = ["grande", "chica", "pares", "juego"].includes(phase) && !declaring;
  if (declaring) {
    return <span className="text-2xl font-light text-white">{message}</span>;
  }
  return (
    <div className="flex flex-col items-center gap-1">
      {inLance && lanceLabel ? (
        <>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Lance</span>
          <span className="text-2xl font-light text-white">{lanceLabel}</span>
          {isOrdago ? (
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-sm font-bold text-accent">¡ÓRDAGO!</motion.span>
          ) : stake > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#0c211a] font-semibold">{stake} en juego</span>
          ) : null}
        </>
      ) : (
        <span className="text-sm text-white/50">{message || ""}</span>
      )}
    </div>
  );
}

function SeatView({ player, manoSeat, reveal, action, active, round, dealFrom, highlight, dimmed, sena }: {
  player: MusPlayer; manoSeat: number; reveal: boolean; action: string | null; active: boolean; round: number; dealFrom: "top" | "left" | "right"; highlight?: boolean; dimmed?: boolean; sena?: SenaId | null;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1 w-[132px]">
      <AnimatePresence>
        {sena && <SenaBubble key={sena} id={sena} />}
      </AnimatePresence>
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence>
          {action && <ActionBubble key={action} text={action} />}
        </AnimatePresence>
      </div>
      <PlayerTag player={player} manoSeat={manoSeat} active={active} onFelt />
      <div className="flex gap-0.5">
        {player.cards.map((c, i) => (
          <MusCard key={`${round}-${c.rank}-${c.suit}-${i}`} card={reveal ? c : undefined} hidden={!reveal} mini delay={i * 0.09} dealFrom={dealFrom} highlight={reveal && highlight} dimmed={reveal && dimmed} />
        ))}
      </div>
    </div>
  );
}

function PlayerTag({ player, manoSeat, active, onFelt }: { player: MusPlayer; manoSeat: number; active?: boolean; onFelt?: boolean }) {
  const isMano = player.seat === manoSeat;
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors ${active ? (onFelt ? "bg-white/15" : "bg-accent/15") : ""}`}>
      <MusAvatar name={player.name} team={player.team} seat={player.seat} size={22} active={active} />
      <span className={`text-[11px] font-medium max-w-[64px] truncate ${onFelt ? "text-white" : ""}`}>{player.name}</span>
      {isMano && <span className={`text-[7px] px-1 py-0.5 rounded font-bold leading-none ${onFelt ? "bg-white text-[#0c211a]" : "bg-foreground text-background"}`}>MANO</span>}
    </div>
  );
}

function betLabel(d: ReturnType<typeof decideBet>): string {
  switch (d.action) {
    case "paso": return "Paso";
    case "envido": return `Envido ${d.amount}`;
    case "quiero": return "Quiero";
    case "noquiero": return "No quiero";
    case "subir": return `Subo ${d.amount}`;
    case "ordago": return "Órdago";
  }
}

function SenaPicker({ open, onToggle, senas, onPick }: {
  open: boolean; onToggle: () => void; senas: SenaId[]; onPick: (id: SenaId) => void;
}) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      <button
        onClick={onToggle}
        className={`px-3 h-7 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-colors ${open ? "border-accent text-accent bg-background" : "border-border text-muted bg-background/80 hover:text-foreground hover:border-foreground"}`}
      >
        <SenaIcon id="treintaiuna" size={15} /> Señas
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
            className="rounded-2xl border border-border bg-background p-2 shadow-xl flex flex-col gap-1 min-w-[168px]"
          >
            {senas.length === 0 ? (
              <span className="text-[11px] text-muted px-2 py-1.5">No tienes seña que hacer</span>
            ) : (
              senas.map((id) => (
                <button key={id} onClick={() => onPick(id)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-foreground/5 text-left">
                  <SenaIcon id={id} size={22} className="text-accent" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs font-medium">{SENAS[id].label}</span>
                    <span className="text-[9px] text-muted">{SENAS[id].gesture}</span>
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SenaBubble({ id }: { id: SenaId }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute -top-1 z-20 flex items-center gap-1 rounded-full bg-accent text-white px-2 py-0.5 shadow-lg"
    >
      <SenaIcon id={id} size={16} />
      <span className="text-[10px] font-semibold">{SENAS[id].label}</span>
    </motion.div>
  );
}

function ActionBubble({ text, big }: { text: string; big?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7 }}
      className={`font-semibold rounded-full bg-foreground text-background whitespace-nowrap shadow-md ${big ? "text-sm px-3 py-1" : "text-[11px] px-2 py-0.5"}`}
    >
      {text}
    </motion.span>
  );
}

function Recuento({ store, selLance, onSelLance }: { store: MusStore; selLance: Lance | null; onSelLance: (l: Lance | null) => void }) {
  const s = store;
  const end = s.phase === "vacaEnd" || s.phase === "gameEnd";

  if (end) {
    const won = s.ordagoVaca === "A" || (s.phase === "gameEnd" && s.winnerTeam === "A");
    const gameOver = s.phase === "gameEnd";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 w-full max-w-sm">
        <motion.div
          initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className={`text-4xl ${won ? "" : "grayscale opacity-70"}`}
        >{gameOver ? (won ? "🏆" : "🥈") : (won ? "🎉" : "💪")}</motion.div>
        <span className="text-lg font-semibold text-center">
          {gameOver ? (won ? "¡Ganáis la partida!" : "Partida perdida") : (won ? "¡Vaca para nosotros!" : "Vaca para ellos")}
        </span>
        <div className="flex items-center gap-4 rounded-2xl border border-border px-5 py-3">
          <TeamTally label="Nosotros" vacas={s.vacas.A} need={s.config.bestOf === 3 ? 2 : 3} win={s.vacas.A > s.vacas.B} />
          <span className="text-xs text-muted">vacas</span>
          <TeamTally label="Ellos" vacas={s.vacas.B} need={s.config.bestOf === 3 ? 2 : 3} win={s.vacas.B > s.vacas.A} />
        </div>
        <button onClick={() => s.nextHand()} className="w-full max-w-xs rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition">
          {gameOver ? "Nueva partida" : "Siguiente vaca"}
        </button>
      </motion.div>
    );
  }

  const rows = s.handScores.filter((ls) => ls.points > 0 || ls.winnerTeam);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 w-full max-w-sm">
      <span className="text-[10px] text-muted">Toca un lance para ver la mano ganadora</span>
      <div className="grid w-full grid-cols-1 gap-1.5">
        {rows.map((ls, i) => {
          const active = selLance === ls.lance;
          const winnerName = ls.winnerSeat === undefined || ls.winnerSeat === null ? null : s.players.find((player) => player.seat === ls.winnerSeat)?.name;
          return (
            <div key={i} className={`rounded-lg border transition-colors ${active ? "border-yellow-400 ring-1 ring-yellow-400" : ls.winnerTeam === "A" ? "border-correct" : "border-border"}`}>
              <button
                onClick={() => onSelLance(active ? null : ls.lance)}
                className={`w-full text-left text-[10px] px-2 py-1.5 ${active ? "text-foreground" : ls.winnerTeam === "A" ? "text-correct" : "text-muted"}`}
              >
                <b>{ls.isPunto ? "Punto" : LANCE_LABEL[ls.lance]}</b> · {ls.winnerTeam === "A" ? "Nosotros" : ls.winnerTeam === "B" ? "Ellos" : "—"} {ls.points > 0 ? `+${ls.points}` : ""}
                {ls.detail ? <span className="opacity-60"> · {ls.detail}</span> : null}
              </button>
              {active && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-current/15 px-2 py-2 text-[10px] text-muted">
                  <p className="leading-relaxed">{ls.reason || "Resultado del lance."}{winnerName ? <><br /><b className="text-foreground">Mano decisiva: {winnerName}.</b></> : null}</p>
                  {ls.breakdown && ls.breakdown.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {ls.breakdown.map((item, index) => {
                        const player = item.seat === undefined ? null : s.players.find((entry) => entry.seat === item.seat)?.name;
                        return <div key={`${item.label}-${index}`} className="flex items-center justify-between"><span>{item.label}{player ? ` · ${player}` : ""}</span><b className="text-foreground">+{item.points}</b></div>;
                      })}
                      <div className="mt-1 flex items-center justify-between border-t border-border pt-1 text-foreground"><span>Total del lance</span><b>+{ls.points}</b></div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => s.nextHand()}
        className="w-full max-w-xs rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition"
      >
        Siguiente mano
      </button>
    </motion.div>
  );
}

function TeamTally({ label, vacas, need, win }: { label: string; vacas: number; need: number; win: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[10px] uppercase tracking-widest ${win ? "text-accent" : "text-muted"}`}>{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: need }).map((_, i) => (
          <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < vacas ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}
