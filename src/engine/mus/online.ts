"use client";

// ─────────────────────────────────────────────────────────────
// Mus online — Ably realtime, host-authoritative rooms.
// The host runs the game engine (bots + reducer) and broadcasts full
// state snapshots; clients render them and forward their actions.
// ─────────────────────────────────────────────────────────────

import * as Ably from "ably";
import type { MusConfig } from "./types";
import { useMusStore, setOnlineSend, type MusNetAction, type MusState } from "./store";

export type RoomMode = "duo2" | "friends4";

interface Member {
  clientId: string;
  name: string;
}

export interface LobbyState {
  code: string;
  isHost: boolean;
  mode: RoomMode;
  members: Member[];
  capacity: number; // human seats target
}

type LobbyListener = (l: LobbyState) => void;
type StartListener = () => void;
type ErrorListener = (msg: string) => void;

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function getClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("mus-client-id");
  if (!id) { id = "c-" + Math.random().toString(36).slice(2, 12); localStorage.setItem("mus-client-id", id); }
  return id;
}

class MusRoom {
  private client: Ably.Realtime | null = null;
  private channel: Ably.RealtimeChannel | null = null;
  private clientId = "";
  private code = "";
  private mode: RoomMode = "friends4";
  private isHost = false;
  private members: Member[] = [];
  private seatMap: Record<string, number> = {}; // clientId → seat
  private unsub: (() => void) | null = null;
  private pubTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  onLobby: LobbyListener | null = null;
  onStart: StartListener | null = null;
  onError: ErrorListener | null = null;

  private capacity() { return this.mode === "duo2" ? 2 : 4; }

  private async connect(name: string) {
    this.clientId = getClientId();
    this.client = new Ably.Realtime({
      authUrl: `/api/ably-token?clientId=${encodeURIComponent(this.clientId)}`,
      clientId: this.clientId,
    });
    await this.client.connection.once("connected");
    void name;
  }

  private channelName() { return `mus:room:${this.code}`; }

  async host(name: string, mode: RoomMode, config: MusConfig): Promise<string> {
    this.isHost = true;
    this.mode = mode;
    this.code = genCode();
    (this as { hostConfig?: MusConfig }).hostConfig = config;
    await this.connect(name);
    await this.attach(name);
    return this.code;
  }

  async join(name: string, code: string): Promise<void> {
    this.isHost = false;
    this.code = code.toUpperCase().trim();
    await this.connect(name);
    await this.attach(name);
    // Ask host for current lobby/start info.
    this.channel?.publish("hello", { clientId: this.clientId, name });
  }

  private async attach(name: string) {
    this.channel = this.client!.channels.get(this.channelName());

    this.channel.presence.subscribe(["enter", "leave", "present", "update"], () => this.refreshMembers());

    this.channel.subscribe("state", (msg) => {
      if (this.isHost) return;
      useMusStore.getState().applyRemoteState(msg.data as Partial<MusState>);
      if (!this.started) { this.started = true; this.onStart?.(); }
    });

    this.channel.subscribe("start", (msg) => {
      if (this.isHost) return;
      const data = msg.data as { seatMap: Record<string, number>; config: MusConfig };
      const mySeat = data.seatMap[this.clientId];
      if (mySeat === undefined) { this.onError?.("No hay asiento libre en la sala"); return; }
      useMusStore.getState().startOnlineClient(mySeat, this.code);
      this.registerClientSend();
    });

    // Host handles incoming client requests.
    if (this.isHost) {
      this.channel.subscribe("hello", () => { this.refreshMembers(); if (this.started) this.broadcastStart(); });
      this.channel.subscribe("action", (msg) => {
        const { seat, action } = msg.data as { seat: number; action: MusNetAction };
        this.applyClientAction(seat, action);
      });
    }

    await this.channel.presence.enter({ name });
    await this.refreshMembers();
  }

  private async refreshMembers() {
    if (!this.channel) return;
    try {
      const present = await this.channel.presence.get();
      this.members = present.map((m) => ({ clientId: m.clientId || "", name: (m.data as { name?: string })?.name || "Jugador" }));
      // Stable ordering: host first, then join order (by clientId presence order).
      this.emitLobby();
    } catch { /* ignore */ }
  }

  private emitLobby() {
    this.onLobby?.({
      code: this.code, isHost: this.isHost, mode: this.mode,
      members: this.members, capacity: this.capacity(),
    });
  }

  /** Host: assign seats, start the game, broadcast to clients. */
  startGame() {
    if (!this.isHost) return;
    // Assign human seats. Host is seat 0. duo2 → partner at seat 2; friends4 → join order.
    const others = this.members.filter((m) => m.clientId !== this.clientId);
    const seatOrder = this.mode === "duo2" ? [2] : [1, 2, 3];
    this.seatMap = { [this.clientId]: 0 };
    const names: Record<number, string> = { 0: this.members.find((m) => m.clientId === this.clientId)?.name || "Tú" };
    others.slice(0, seatOrder.length).forEach((m, i) => {
      const seat = seatOrder[i];
      this.seatMap[m.clientId] = seat;
      names[seat] = m.name;
    });
    const humanSeats = Object.values(this.seatMap).sort((a, b) => a - b);
    const config = (this as { hostConfig?: MusConfig }).hostConfig!;

    this.started = true;
    useMusStore.getState().startOnlineHost(config, humanSeats, names, 0, this.code);
    this.registerHostBroadcast();
    this.broadcastStart();
    this.onStart?.();
  }

  private broadcastStart() {
    const config = (this as { hostConfig?: MusConfig }).hostConfig!;
    this.channel?.publish("start", { seatMap: this.seatMap, config });
    // Immediately push current state too.
    this.publishState();
  }

  /** Host: subscribe to store changes and broadcast snapshots (debounced). */
  private registerHostBroadcast() {
    this.unsub?.();
    this.unsub = useMusStore.subscribe(() => this.schedulePublish());
    setOnlineSend(null); // host applies locally
  }

  private schedulePublish() {
    if (this.pubTimer) return;
    this.pubTimer = setTimeout(() => { this.pubTimer = null; this.publishState(); }, 60);
  }

  private publishState() {
    if (!this.isHost || !this.channel) return;
    const snap = useMusStore.getState().snapshot();
    this.channel.publish("state", snap);
  }

  /** Client: forward local actions to the host. */
  private registerClientSend() {
    setOnlineSend((seat, action) => {
      this.channel?.publish("action", { seat, action });
    });
  }

  private applyClientAction(seat: number, action: MusNetAction) {
    const store = useMusStore.getState();
    switch (action.t) {
      case "mus": store.submitMusVote(seat, action.mus, action.label); break;
      case "bet": store.submitBet(seat, action.a); break;
      case "discard": store.submitDiscard(seat, action.discards); break;
      case "declare": store.submitDeclare(seat); break;
      case "next": store.submitNextHand(seat); break;
    }
  }

  leave() {
    try {
      this.unsub?.(); this.unsub = null;
      setOnlineSend(null);
      this.channel?.presence.leave();
      this.channel?.detach();
      this.client?.close();
    } catch { /* ignore */ }
    this.client = null; this.channel = null; this.started = false;
    this.members = []; this.seatMap = {};
  }
}

// Singleton per tab.
let room: MusRoom | null = null;
export function getMusRoom(): MusRoom {
  if (!room) room = new MusRoom();
  return room;
}
export function resetMusRoom() {
  room?.leave();
  room = null;
}
