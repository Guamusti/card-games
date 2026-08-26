"use client";

import * as Ably from "ably";
import type { MusStats } from "./stats";

export interface RoomInvite { from: string; code: string; mode: "duo2" | "friends4"; }
type Listener = (online: Set<string>, invite: RoomInvite | null, musStats: Map<string, MusStats>) => void;

let client: Ably.Realtime | null = null;
let presence: Ably.RealtimeChannel | null = null;
let inbox: Ably.RealtimeChannel | null = null;
let activeUser = "";
const listeners = new Set<Listener>();
let online = new Set<string>();
let musStatsByUser = new Map<string, MusStats>();

function notify(invite: RoomInvite | null = null) { listeners.forEach((listener) => listener(new Set(online), invite, new Map(musStatsByUser))); }

async function refresh() {
  if (!presence) return;
  const members = await presence.presence.get();
  online = new Set(members.map((member) => (member.data as { username?: string })?.username).filter(Boolean) as string[]);
  musStatsByUser = new Map(members.flatMap((member) => {
    const data = member.data as { username?: string; musStats?: MusStats };
    return data.username && data.musStats ? [[data.username, data.musStats] as [string, MusStats]] : [];
  }));
  notify();
}

export function subscribeSocial(listener: Listener) { listeners.add(listener); listener(new Set(online), null, new Map(musStatsByUser)); return () => { listeners.delete(listener); }; }

export async function activateSocial(username: string) {
  const clean = username.toLowerCase().trim();
  if (!clean || clean === activeUser) return;
  deactivateSocial(); activeUser = clean;
  client = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${encodeURIComponent(`social-${clean}`)}`, clientId: `social-${clean}` });
  await client.connection.once("connected");
  presence = client.channels.get("mus:friends:presence");
  presence.presence.subscribe(["enter", "leave", "present", "update"], () => { void refresh(); });
  await presence.presence.enter({ username: clean, musStats: { handsPlayed: 0, handsWon: 0, gamesPlayed: 0, gamesWon: 0, vacasWon: 0, stonesWon: 0, ordagosWon: 0, elo: 1000, rankedGames: 0, rankedWins: 0, lances: { grande: { played: 0, won: 0, stones: 0 }, chica: { played: 0, won: 0, stones: 0 }, pares: { played: 0, won: 0, stones: 0 }, juego: { played: 0, won: 0, stones: 0 } } } });
  inbox = client.channels.get(`mus:friends:inbox:${clean}`);
  inbox.subscribe("invite", (message) => notify(message.data as RoomInvite));
  await refresh();
}

export function deactivateSocial() {
  try { void presence?.presence.leave(); void presence?.detach(); void inbox?.detach(); client?.close(); } catch {}
  client = null; presence = null; inbox = null; activeUser = ""; online = new Set(); musStatsByUser = new Map(); notify();
}

export function sendRoomInvite(friend: string, invite: RoomInvite) { client?.channels.get(`mus:friends:inbox:${friend}`).publish("invite", invite); }
export function publishMusStats(stats: MusStats) { if (presence && activeUser) void presence.presence.update({ username: activeUser, musStats: stats }); }
