"use client";

import * as Ably from "ably";

export interface RoomInvite { from: string; code: string; mode: "duo2" | "friends4"; }
type Listener = (online: Set<string>, invite: RoomInvite | null) => void;

let client: Ably.Realtime | null = null;
let presence: Ably.RealtimeChannel | null = null;
let inbox: Ably.RealtimeChannel | null = null;
let activeUser = "";
const listeners = new Set<Listener>();
let online = new Set<string>();

function notify(invite: RoomInvite | null = null) { listeners.forEach((listener) => listener(new Set(online), invite)); }

async function refresh() {
  if (!presence) return;
  const members = await presence.presence.get();
  online = new Set(members.map((member) => (member.data as { username?: string })?.username).filter(Boolean) as string[]);
  notify();
}

export function subscribeSocial(listener: Listener) { listeners.add(listener); listener(new Set(online), null); return () => { listeners.delete(listener); }; }

export async function activateSocial(username: string) {
  const clean = username.toLowerCase().trim();
  if (!clean || clean === activeUser) return;
  deactivateSocial(); activeUser = clean;
  client = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${encodeURIComponent(`social-${clean}`)}`, clientId: `social-${clean}` });
  await client.connection.once("connected");
  presence = client.channels.get("mus:friends:presence");
  presence.presence.subscribe(["enter", "leave", "present", "update"], () => { void refresh(); });
  await presence.presence.enter({ username: clean });
  inbox = client.channels.get(`mus:friends:inbox:${clean}`);
  inbox.subscribe("invite", (message) => notify(message.data as RoomInvite));
  await refresh();
}

export function deactivateSocial() {
  try { void presence?.presence.leave(); void presence?.detach(); void inbox?.detach(); client?.close(); } catch {}
  client = null; presence = null; inbox = null; activeUser = ""; online = new Set(); notify();
}

export function sendRoomInvite(friend: string, invite: RoomInvite) { client?.channels.get(`mus:friends:inbox:${friend}`).publish("invite", invite); }
