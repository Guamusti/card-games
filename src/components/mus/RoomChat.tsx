"use client";

import { useEffect, useRef, useState } from "react";
import { getMusRoom, type RoomChatMessage } from "@/engine/mus/online";
import { useCustomizeStore } from "@/engine/customize/store";

export default function RoomChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [text, setText] = useState("");
  const { nickname, username } = useCustomizeStore();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const room = getMusRoom();
    setMessages(room.getChatMessages());
    room.onChat = setMessages;
    return () => { room.onChat = null; };
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, open]);

  const send = () => {
    getMusRoom().sendChat(nickname || username || "Jugador", text);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && <div className="flex h-72 w-[min(92vw,340px)] flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-border px-3 py-2"><span className="text-xs font-semibold">Chat de sala</span><button onClick={() => setOpen(false)} className="text-sm text-muted">×</button></div>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {messages.length === 0 && <span className="my-auto text-center text-xs text-muted">Aún no hay mensajes.</span>}
          {messages.map((message) => <div key={message.id} className="text-xs"><span className="mr-1 font-semibold">{message.name}</span><span className="text-muted">{message.text}</span></div>)}
          <div ref={end} />
        </div>
        <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-2"><input value={text} onChange={(event) => setText(event.target.value)} maxLength={280} placeholder="Escribe un mensaje" className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" /><button disabled={!text.trim()} className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40">Enviar</button></form>
      </div>}
      <button onClick={() => setOpen((value) => !value)} className="rounded-full border border-foreground bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg">{open ? "Cerrar" : "Chat"}{messages.length > 0 && !open ? ` · ${messages.length}` : ""}</button>
    </div>
  );
}
