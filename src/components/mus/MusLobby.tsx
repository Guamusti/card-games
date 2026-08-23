"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getMusRoom, resetMusRoom, type RoomMode, type LobbyState } from "@/engine/mus/online";
import { useCustomizeStore } from "@/engine/customize/store";
import type { VacaPoints, BestOf, MusDifficulty } from "@/engine/mus/types";
import { DEFAULT_MUS_CONFIG } from "@/engine/mus/types";
import { activateSocial, sendRoomInvite, subscribeSocial, type RoomInvite } from "@/engine/mus/social";

type View = "choose" | "config" | "join" | "lobby";

export default function MusLobby({ mode, onStarted, onExit }: { mode: RoomMode; onStarted: () => void; onExit: () => void }) {
  const { nickname, aiDifficulty, username, friends, musDefaultVaca, musDefaultBestOf, musBotSpeed } = useCustomizeStore();
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [incomingInvite, setIncomingInvite] = useState<RoomInvite | null>(null);
  const [sentInvite, setSentInvite] = useState<string | null>(null);
  const [view, setView] = useState<View>("choose");
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [vaca, setVaca] = useState<VacaPoints>(musDefaultVaca);
  const [bestOf, setBestOf] = useState<BestOf>(musDefaultBestOf);
  const [difficulty, setDifficulty] = useState<MusDifficulty>(aiDifficulty);
  const displayName = nickname || username || "Jugador";

  const startedRef = useRef(false);

  useEffect(() => {
    const room = getMusRoom();
    room.onLobby = (l) => setLobby(l);
    room.onStart = () => { if (!startedRef.current) { startedRef.current = true; onStarted(); } };
    room.onError = (m) => setError(m);
    return () => { room.onLobby = null; room.onStart = null; room.onError = null; };
  }, [onStarted]);

  useEffect(() => { if (username) void activateSocial(username); return subscribeSocial((online, invite) => { setOnlineFriends(online); if (invite) setIncomingInvite(invite); }); }, [username]);

  const doHost = async () => {
    setBusy(true); setError(null);
    try {
      const cfg = { ...DEFAULT_MUS_CONFIG, vacaPoints: vaca, bestOf, difficulty, botSpeed: musBotSpeed };
      await getMusRoom().host(displayName, mode, cfg);
      setView("lobby");
    } catch { setError("No se pudo crear la sala. ¿Está configurado Ably?"); }
    setBusy(false);
  };

  const doJoin = async () => {
    if (code.trim().length < 4) { setError("Código no válido"); return; }
    setBusy(true); setError(null);
    try {
      await getMusRoom().join(displayName, code);
      setView("lobby");
    } catch { setError("No se pudo unir. Revisa el código."); }
    setBusy(false);
  };

  useEffect(() => {
    const inviteCode = sessionStorage.getItem("mus-invite-code");
    if (!inviteCode) return;
    sessionStorage.removeItem("mus-invite-code");
    void (async () => { setBusy(true); try { await getMusRoom().join(displayName, inviteCode); setView("lobby"); } catch { setError("No se pudo unir a la sala."); } finally { setBusy(false); } })();
  }, [displayName]);

  const exit = () => { resetMusRoom(); onExit(); };

  const title = mode === "duo2" ? "2 reales vs 2 bots" : "Online con amigos";

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button onClick={exit} className="text-xs text-muted hover:text-foreground">← Modos</button>
        <h2 className="text-base font-medium">{title}</h2>
        <span className="w-12" />
      </div>

      {error && <p className="text-xs text-accent text-center">{error}</p>}
      {incomingInvite && view === "choose" && <div className="rounded-xl border border-correct/40 bg-correct/5 p-3 flex flex-col gap-2"><span className="text-sm">@{incomingInvite.from} te invita a jugar</span><div className="flex gap-2"><button onClick={async () => { setCode(incomingInvite.code); setBusy(true); try { await getMusRoom().join(displayName, incomingInvite.code); setView("lobby"); } catch { setError("No se pudo unir a la sala."); } setBusy(false); setIncomingInvite(null); }} className="btn-primary flex-1">Aceptar</button><button onClick={() => setIncomingInvite(null)} className="btn-ghost flex-1">Ahora no</button></div></div>}

      {view === "choose" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <p className="text-xs text-muted text-center">Juegas como <b className="text-foreground">{displayName}</b> · cámbialo en Perfil.</p>
          <button onClick={() => setView("config")} className="btn-primary">Crear sala</button>
          <button onClick={() => setView("join")} className="btn-ghost">Unirme con código</button>
        </motion.div>
      )}

      {view === "config" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <p className="text-xs text-muted">Tú fijas las reglas de la sala.</p>
          <Row label="Vaca a">{([30, 40] as VacaPoints[]).map((v) => <Chip key={v} active={vaca === v} onClick={() => setVaca(v)}>{v}</Chip>)}</Row>
          <Row label="Partida">{([3, 5] as BestOf[]).map((b) => <Chip key={b} active={bestOf === b} onClick={() => setBestOf(b)}>BO{b}</Chip>)}</Row>
          <Row label="Bots">{(["easy", "normal", "hard"] as MusDifficulty[]).map((d) => <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>{d === "easy" ? "Fácil" : d === "normal" ? "Normal" : "Difícil"}</Chip>)}</Row>
          <button onClick={doHost} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Creando…" : "Crear sala"}</button>
          <button onClick={() => setView("choose")} className="btn-ghost">Atrás</button>
        </motion.div>
      )}

      {view === "join" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <Field label="Código de sala">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))} placeholder="ABCDE" className="input tracking-[0.3em] text-center uppercase" />
          </Field>
          <button onClick={doJoin} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Conectando…" : "Unirme"}</button>
          <button onClick={() => setView("choose")} className="btn-ghost">Atrás</button>
        </motion.div>
      )}

      {view === "lobby" && lobby && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted">Código de sala</span>
            <span className="text-3xl font-mono font-bold tracking-[0.3em]">{lobby.code}</span>
            <span className="text-[11px] text-muted">Compártelo con {lobby.mode === "duo2" ? "tu amigo" : "tus amigos"}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted">Jugadores ({lobby.members.length}/{lobby.capacity})</span>
            {lobby.members.map((m, i) => (
              <div key={m.clientId || i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border">
                <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-bold">{(m.name[0] || "?").toUpperCase()}</span>
                <span className="text-sm">{m.name}</span>
                {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-muted ml-auto">Anfitrión</span>}
              </div>
            ))}
            {lobby.capacity - lobby.members.length > 0 && (
              <p className="text-[11px] text-muted">
                {lobby.capacity - lobby.members.length} hueco(s) libre(s){lobby.isHost ? " · se rellenarán con bots si empiezas ya" : ""}
              </p>
            )}
          </div>

          {lobby.isHost && (
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <span className="text-[10px] uppercase tracking-widest text-muted">Amigos online</span>
              {!username ? <span className="text-xs text-muted">Configura tu usuario en Perfil para invitar.</span> : friends.filter((friend) => onlineFriends.has(friend)).length === 0 ? <span className="text-xs text-muted">No hay amigos conectados.</span> : friends.filter((friend) => onlineFriends.has(friend)).map((friend) => <div key={friend} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-correct" /><span className="flex-1 text-sm">@{friend}</span><button onClick={() => { sendRoomInvite(friend, { from: username, code: lobby.code, mode: lobby.mode }); setSentInvite(friend); setTimeout(() => setSentInvite(null), 2500); }} className="rounded-lg border border-foreground px-2 py-1 text-xs hover:bg-foreground hover:text-background active:scale-95 transition">{sentInvite === friend ? "Enviada ✓" : "Invitar"}</button></div>)}
            </div>
          )}

          {lobby.isHost ? (
            <button onClick={() => getMusRoom().startGame()} className="btn-primary">Empezar partida</button>
          ) : (
            <p className="text-sm text-muted text-center animate-pulse">Esperando a que el anfitrión empiece…</p>
          )}
          <button onClick={exit} className="btn-ghost">Salir</button>
        </motion.div>
      )}

      <style jsx>{`
        .input { width: 100%; border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.75rem 1rem; background: transparent; font-size: 0.9rem; outline: none; }
        .input:focus { border-color: var(--color-foreground); }
        .btn-primary { border-radius: 0.75rem; border: 1px solid var(--color-foreground); background: var(--color-foreground); color: var(--color-background); padding: 0.85rem 1rem; font-size: 0.9rem; font-weight: 500; }
        .btn-ghost { border-radius: 0.75rem; border: 1px solid var(--color-border); color: var(--color-muted); padding: 0.85rem 1rem; font-size: 0.9rem; font-weight: 500; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-sm">{label}</span><div className="flex gap-1.5">{children}</div></div>;
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full border text-xs px-3 py-1.5 transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground"}`}>{children}</button>;
}
