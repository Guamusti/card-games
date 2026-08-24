"use client";

import { motion, AnimatePresence } from "framer-motion";

/** In-game rules reference for Mus (8 reyes / 8 ases variant, no señas). */
export default function MusHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-background p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Cómo se juega al Mus</h2>
              <button onClick={onClose} className="text-muted hover:text-foreground text-xl leading-none px-2">×</button>
            </div>

            <Section title="Objetivo">
              2 parejas. Gana la vaca quien llega primero a las piedras fijadas (30 o 40).
              La partida es al mejor de 3 o 5 vacas.
            </Section>

            <Section title="Valor de las cartas (8 reyes / 8 ases)">
              El <b>3</b> vale como <b>Rey</b> y el <b>2</b> vale como <b>As</b>.
              De mayor a menor: Rey(12/3) · Caballo(11) · Sota(10) · 7 · 6 · 5 · 4 · As(1/2).
            </Section>

            <Section title="Los cuatro lances (en orden)">
              <Row k="Grande">gana la mano con las cartas más altas.</Row>
              <Row k="Chica">gana la mano con las cartas más bajas.</Row>
              <Row k="Pares">solo si tienes pareja. par &lt; medias (trío) &lt; duples (dos parejas).</Row>
              <Row k="Juego">suma de la mano. 31 &gt; 32 &gt; 40 &gt; 39 … &gt; 33. Figuras=10, As=1.</Row>
              <Row k="Punto">si nadie llega a 31, el Juego se juega a “Punto”: gana el más cercano a 30.</Row>
            </Section>

            <Section title="Apuestas (envites)">
              En cada lance puedes <b>pasar</b>, <b>envidar</b> piedras o lanzar <b>órdago</b>.
              Al envite el rival dice <b>quiero</b> (se juega), <b>no quiero</b> (cedes las piedras
              apostadas) o <b>sube</b>. Cualquiera de la pareja rival puede responder.
            </Section>

            <Section title="Órdago">
              Apuesta toda la vaca en ese lance. Si lo quieren, se ven las cartas y quien gane
              el lance gana la vaca entera. Úsalo con cuidado.
            </Section>

            <Section title="Recuento">
              Al final se cuentan los lances en orden. Pares suma tantos (par 1 · medias 2 ·
              duples 3) y Juego suma 2 (+1 si es 31). Quien llega a la meta gana la vaca.
            </Section>

            <button onClick={onClose} className="mt-1 rounded-xl border border-foreground bg-foreground text-background px-4 py-3 text-sm font-medium active:scale-95 transition">
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[11px] uppercase tracking-widest text-muted">{title}</h3>
      <div className="text-sm leading-relaxed text-foreground/90 flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold min-w-[64px]">{k}</span>
      <span className="text-foreground/80">{children}</span>
    </div>
  );
}
