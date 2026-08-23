"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusStore, type MusStore } from "@/engine/mus/store";
import type { MusPlayer } from "@/engine/mus/types";
import { teamOfSeat, LANCE_LABEL } from "@/engine/mus/types";
import MusCard from "./MusCard";
import MusAvatar from "./MusAvatar";
import ScoreBoard from "./ScoreBoard";
import LanceBar from "./LanceBar";

export default function MusTable() {
  const s = useMusStore();

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
  const humanTurnInLance = !!rt && !rt.outcome && rt.order[rt.activeIdx] === me;
  const liveEnviteForUs = !!rt && rt.bet.envidoTeam !== null && rt.bet.envidoTeam !== myTeam;
  const currentStake = rt ? (rt.bet.chain[rt.bet.chain.length - 1] ?? 0) : 0;
  const musOrder = [0, 1, 2, 3].map((i) => (s.manoSeat + i) % 4);
  const musTurnHuman = s.phase === "mus" && musOrder[s.musActiveIdx] === me;
  const stakeOnTable = rt && rt.bet.envidoTeam !== null && !rt.bet.isOrdago ? currentStake : 0;
  const isOrdago = !!rt?.bet.isOrdago && rt.bet.envidoTeam !== null;

  // Which seat is on the clock right now?
  const activeSeat =
    s.phase === "mus" ? musOrder[s.musActiveIdx]
    : isLance && rt && !rt.outcome ? rt.order[rt.activeIdx]
    : -1;

  return (
    <div className="flex flex-col min-h-[100dvh] px-3 pt-12 pb-3">
      <div className="w-full max-w-md mx-auto flex flex-col gap-3 flex-1">
        <ScoreBoard
          scoreA={s.score.A} scoreB={s.score.B}
          vacasA={s.vacas.A} vacasB={s.vacas.B}
          target={s.config.vacaPoints} bestOf={s.config.bestOf}
        />

        {/* Felt table */}
        <div
          className="relative rounded-[2rem] border border-border flex-1 min-h-[300px] max-h-[420px]"
          style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(47,111,176,0.06), transparent 70%)" }}
        >
          {/* Partner (top) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <SeatView player={partner} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[partner.seat]} active={activeSeat === partner.seat} />
          </div>
          {/* Opponents (sides) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <SeatView player={oppLeft} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[oppLeft.seat]} active={activeSeat === oppLeft.seat} />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <SeatView player={oppRight} manoSeat={s.manoSeat} reveal={s.reveal} action={s.seatActions[oppRight.seat]} active={activeSeat === oppRight.seat} />
          </div>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <CenterInfo phase={s.phase} lanceLabel={s.currentLance ? LANCE_LABEL[s.currentLance] : null} stake={stakeOnTable} message={s.message} isOrdago={isOrdago} />
          </div>
        </div>

        {/* You (bottom) */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-6 flex items-center">
            <AnimatePresence>
              {s.seatActions[me] && <ActionBubble key={s.seatActions[me]} text={s.seatActions[me]!} big />}
            </AnimatePresence>
          </div>
          <div className="flex gap-1.5">
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
          <PlayerTag player={you} manoSeat={s.manoSeat} active={activeSeat === me} />
        </div>

        {/* Controls */}
        <div className="min-h-[104px] flex items-center justify-center">
          {s.phase === "mus" && musTurnHuman && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              <button onClick={() => s.voteMus(true)} className="rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition">Mus</button>
              <button onClick={() => s.voteMus(false)} className="rounded-xl border border-border px-4 py-3.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground active:scale-95 transition">No hay mus</button>
            </div>
          )}

          {s.phase === "discard" && (
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

          {isLance && humanTurnInLance && (
            <LanceBar mode={liveEnviteForUs ? "respond" : "open"} currentStake={currentStake} onBet={(a) => s.humanBet(a)} />
          )}

          {isLance && !humanTurnInLance && (
            <span className="text-xs text-muted animate-pulse">Esperando a los demás…</span>
          )}

          {(s.phase === "showdown" || s.phase === "handEnd" || s.phase === "vacaEnd" || s.phase === "gameEnd") && (
            <Recuento store={s} />
          )}
        </div>
      </div>
    </div>
  );
}

function CenterInfo({ phase, lanceLabel, stake, message, isOrdago }: { phase: string; lanceLabel: string | null; stake: number; message: string | null; isOrdago: boolean }) {
  const inLance = ["grande", "chica", "pares", "juego"].includes(phase);
  return (
    <div className="flex flex-col items-center gap-1">
      {inLance && lanceLabel ? (
        <>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Lance</span>
          <span className="text-2xl font-light">{lanceLabel}</span>
          {isOrdago ? (
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-sm font-bold text-accent">¡ÓRDAGO!</motion.span>
          ) : stake > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background font-semibold">{stake} en juego</span>
          ) : null}
        </>
      ) : (
        <span className="text-sm text-muted">{message || ""}</span>
      )}
    </div>
  );
}

function SeatView({ player, manoSeat, reveal, action, active }: {
  player: MusPlayer; manoSeat: number; reveal: boolean; action: string | null; active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 w-[92px]">
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence>
          {action && <ActionBubble key={action} text={action} />}
        </AnimatePresence>
      </div>
      <PlayerTag player={player} manoSeat={manoSeat} active={active} />
      <div className="flex gap-0.5">
        {player.cards.map((c, i) => (
          <MusCard key={i} card={reveal ? c : undefined} hidden={!reveal} mini />
        ))}
      </div>
    </div>
  );
}

function PlayerTag({ player, manoSeat, active }: { player: MusPlayer; manoSeat: number; active?: boolean }) {
  const isMano = player.seat === manoSeat;
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors ${active ? "bg-accent/15" : ""}`}>
      <MusAvatar name={player.name} team={player.team} seat={player.seat} size={22} active={active} />
      <span className="text-[11px] font-medium max-w-[60px] truncate">{player.name}</span>
      {isMano && <span className="text-[7px] px-1 py-0.5 rounded bg-foreground text-background font-bold leading-none">MANO</span>}
    </div>
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

function Recuento({ store }: { store: MusStore }) {
  const s = store;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 w-full max-w-sm">
      {s.phase === "gameEnd" ? (
        <span className="text-lg font-medium">{s.winnerTeam === "A" ? "¡Ganáis la partida!" : "Partida perdida"}</span>
      ) : s.phase === "vacaEnd" ? (
        <span className="text-base font-medium">{s.ordagoVaca === "A" ? "¡Vaca para nosotros!" : "Vaca para ellos"}</span>
      ) : (
        <div className="flex flex-wrap justify-center gap-1.5">
          {s.handScores.filter((ls) => ls.points > 0 || ls.winnerTeam).map((ls, i) => (
            <span key={i} className={`text-[10px] px-2 py-1 rounded-lg border ${ls.winnerTeam === "A" ? "border-correct text-correct" : "border-border text-muted"}`}>
              <b>{LANCE_LABEL[ls.lance]}</b> · {ls.winnerTeam === "A" ? "Nosotros" : ls.winnerTeam === "B" ? "Ellos" : "—"} {ls.points > 0 ? `+${ls.points}` : ""}
              {ls.detail ? <span className="opacity-60"> · {ls.detail}</span> : null}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => s.nextHand()}
        className="w-full max-w-xs rounded-xl border border-foreground bg-foreground text-background px-4 py-3.5 text-sm font-medium active:scale-95 transition"
      >
        {s.phase === "gameEnd" ? "Nueva partida" : "Siguiente mano"}
      </button>
    </motion.div>
  );
}
