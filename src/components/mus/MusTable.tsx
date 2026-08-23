"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusStore, type MusStore } from "@/engine/mus/store";
import type { MusPlayer } from "@/engine/mus/types";
import { teamOfSeat, LANCE_LABEL } from "@/engine/mus/types";
import MusCard from "./MusCard";
import ScoreBoard from "./ScoreBoard";
import LanceBar from "./LanceBar";

export default function MusTable() {
  const s = useMusStore();

  // Kick off a game on mount if idle.
  useEffect(() => {
    if (s.phase === "idle") s.startSolo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const players = s.players;
  const seat = (n: number) => players.find((p) => p.seat === n)!;
  const you = seat(0), partner = seat(2), oppRight = seat(1), oppLeft = seat(3);

  const isLance = ["grande", "chica", "pares", "juego"].includes(s.phase);
  const rt = s.currentLance ? s.lances[s.currentLance] : null;
  const humanTurnInLance = !!rt && !rt.outcome && rt.order[rt.activeIdx] === 0;
  const liveEnviteForUs = !!rt && rt.bet.envidoTeam !== null && rt.bet.envidoTeam !== teamOfSeat(0);
  const currentStake = rt ? (rt.bet.chain[rt.bet.chain.length - 1] ?? 0) : 0;

  const musTurnHuman = s.phase === "mus" && [0, 1, 2, 3].map((i) => (s.manoSeat + i) % 4)[s.musActiveIdx] === 0;

  const stakeOnTable = rt && rt.bet.envidoTeam !== null && !rt.bet.isOrdago ? currentStake : 0;

  return (
    <div className="flex flex-col min-h-[100dvh] px-4 pt-3 pb-4">
      {/* Scoreboard */}
      <div className="shrink-0">
        <ScoreBoard
          scoreA={s.score.A} scoreB={s.score.B}
          vacasA={s.vacas.A} vacasB={s.vacas.B}
          target={s.config.vacaPoints} bestOf={s.config.bestOf}
        />
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col justify-between py-3 min-h-0">
        {/* Partner (top) */}
        <div className="flex justify-center">
          <SeatView player={partner} manoSeat={s.manoSeat} reveal={s.reveal} lastAction={s.lastAction} facedown small />
        </div>

        {/* Middle: opponents + center */}
        <div className="flex items-center justify-between gap-2">
          <SeatView player={oppLeft} manoSeat={s.manoSeat} reveal={s.reveal} lastAction={s.lastAction} facedown small vertical />
          <CenterInfo phase={s.phase} lanceLabel={s.currentLance ? LANCE_LABEL[s.currentLance] : null} stake={stakeOnTable} message={s.message} isOrdago={!!rt?.bet.isOrdago && rt.bet.envidoTeam !== null} />
          <SeatView player={oppRight} manoSeat={s.manoSeat} reveal={s.reveal} lastAction={s.lastAction} facedown small vertical />
        </div>

        {/* You (bottom) */}
        <div className="flex flex-col items-center gap-2">
          <AnimatePresence>
            {s.lastAction?.seat === 0 && (
              <ActionPill text={s.lastAction.text} />
            )}
          </AnimatePresence>
          <div className="flex gap-1.5 sm:gap-2">
            {you.cards.map((c, i) => (
              <MusCard
                key={`${c.rank}-${c.suit}-${i}`}
                card={c}
                small
                selected={s.phase === "discard" && s.discardSelection.includes(i)}
                onClick={s.phase === "discard" ? () => s.toggleDiscard(i) : undefined}
              />
            ))}
          </div>
          <PlayerTag player={you} manoSeat={s.manoSeat} />
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 min-h-[92px] flex items-center justify-center">
        {s.phase === "mus" && musTurnHuman && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <button onClick={() => s.voteMus(true)} className="rounded-xl border border-foreground bg-foreground text-background px-4 py-3 text-sm font-medium active:scale-95 transition">Mus</button>
            <button onClick={() => s.voteMus(false)} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-foreground active:scale-95 transition">No hay mus</button>
          </div>
        )}

        {s.phase === "discard" && (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <span className="text-xs text-muted">Elige cartas a descartar</span>
            <button
              onClick={() => s.confirmDiscard()}
              disabled={s.discardSelection.length === 0}
              className="w-full rounded-xl border border-foreground bg-foreground text-background px-4 py-3 text-sm font-medium disabled:opacity-40 active:scale-95 transition"
            >
              Descartar {s.discardSelection.length > 0 ? `(${s.discardSelection.length})` : ""}
            </button>
          </div>
        )}

        {isLance && humanTurnInLance && (
          <LanceBar
            mode={liveEnviteForUs ? "respond" : "open"}
            currentStake={currentStake}
            onBet={(a) => s.humanBet(a)}
          />
        )}

        {isLance && !humanTurnInLance && (
          <span className="text-xs text-muted animate-pulse">Esperando…</span>
        )}

        {(s.phase === "showdown" || s.phase === "handEnd" || s.phase === "vacaEnd" || s.phase === "gameEnd") && (
          <Recuento store={s} />
        )}
      </div>
    </div>
  );
}

function CenterInfo({ phase, lanceLabel, stake, message, isOrdago }: { phase: string; lanceLabel: string | null; stake: number; message: string | null; isOrdago: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[90px]">
      {lanceLabel && ["grande", "chica", "pares", "juego"].includes(phase) ? (
        <>
          <span className="text-[10px] uppercase tracking-widest text-muted">Lance</span>
          <span className="text-lg font-light">{lanceLabel}</span>
          {isOrdago ? (
            <span className="text-[11px] font-semibold text-accent">¡ÓRDAGO!</span>
          ) : stake > 0 ? (
            <span className="text-[11px] text-muted">{stake} en juego</span>
          ) : null}
        </>
      ) : (
        <span className="text-xs text-muted">{message || ""}</span>
      )}
    </div>
  );
}

function SeatView({ player, manoSeat, reveal, lastAction, facedown, small, vertical }: {
  player: MusPlayer; manoSeat: number; reveal: boolean; lastAction: { seat: number; text: string } | null; facedown?: boolean; small?: boolean; vertical?: boolean;
}) {
  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-col"} items-center gap-1.5`}>
      <AnimatePresence>
        {lastAction?.seat === player.seat && <ActionPill text={lastAction.text} />}
      </AnimatePresence>
      <div className={`flex ${vertical ? "flex-col" : "flex-row"} gap-1`}>
        {player.cards.map((c, i) => (
          <div key={i} className={vertical ? "scale-75 -my-1" : "scale-75 -mx-0.5"}>
            <MusCard card={reveal ? c : undefined} hidden={facedown && !reveal} small={small} />
          </div>
        ))}
      </div>
      <PlayerTag player={player} manoSeat={manoSeat} />
    </div>
  );
}

function PlayerTag({ player, manoSeat }: { player: MusPlayer; manoSeat: number }) {
  const isMano = player.seat === manoSeat;
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">{player.avatar}</span>
      <span className="text-[11px] font-medium">{player.name}</span>
      {isMano && <span className="text-[8px] px-1 py-0.5 rounded bg-foreground text-background font-bold">MANO</span>}
    </div>
  );
}

function ActionPill({ text }: { text: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border bg-surface whitespace-nowrap"
    >
      {text}
    </motion.span>
  );
}

function Recuento({ store }: { store: MusStore }) {
  const s = store;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 w-full max-w-sm">
      {s.phase === "gameEnd" ? (
        <span className="text-lg font-medium">{s.winnerTeam === "A" ? "🏆 ¡Ganáis la partida!" : "Partida perdida"}</span>
      ) : s.phase === "vacaEnd" ? (
        <span className="text-base font-medium">{s.ordagoVaca === "A" ? "¡Vaca para nosotros!" : "Vaca para ellos"}</span>
      ) : (
        <div className="flex flex-wrap justify-center gap-1.5">
          {s.handScores.filter((ls) => ls.points > 0 || ls.winnerTeam).map((ls, i) => (
            <span key={i} className={`text-[10px] px-2 py-1 rounded-lg border ${ls.winnerTeam === "A" ? "border-correct text-correct" : "border-border text-muted"}`}>
              {LANCE_LABEL[ls.lance]}: {ls.winnerTeam === "A" ? "Nosotros" : ls.winnerTeam === "B" ? "Ellos" : "—"} {ls.points > 0 ? `+${ls.points}` : ""}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => s.nextHand()}
        className="w-full max-w-xs rounded-xl border border-foreground bg-foreground text-background px-4 py-3 text-sm font-medium active:scale-95 transition"
      >
        {s.phase === "gameEnd" ? "Nueva partida" : "Siguiente mano"}
      </button>
    </motion.div>
  );
}
