import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export interface StackQueueConceptViewProps {
  topicId: string;
}

// ── Shared Types & Helpers ───────────────────────────────────────────────────
type CellKind = 'blocked' | 'free' | 'filled' | 'empty' | 'scan';
interface RamCell {
  id: number; row: number; col: number; kind: CellKind;
  blockedBy?: string; index?: number; value?: number | string; highlight?: boolean;
}

const ROWS = 6;
const COLS = 8;
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
const BOUNCE_SPRING = { type: 'spring' as const, stiffness: 400, damping: 15 };

const SYSTEM_BLOCKS: { row: number; col: number; label: string }[] = [
  { row: 0, col: 0, label: 'OS' }, { row: 0, col: 1, label: 'OS' }, { row: 0, col: 2, label: 'OS' },
  { row: 0, col: 6, label: 'Chrome' }, { row: 0, col: 7, label: 'Chrome' },
  { row: 2, col: 3, label: 'Discord' }, { row: 4, col: 0, label: 'Spotify' },
];

const buildBaseGrid = (): RamCell[] => {
  const grid: RamCell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid.push({ id: r * COLS + c, row: r, col: c, kind: 'free' });
    }
  }
  SYSTEM_BLOCKS.forEach(b => {
    grid[b.row * COLS + b.col] = { id: b.row * COLS + b.col, row: b.row, col: b.col, kind: 'blocked', blockedBy: b.label };
  });
  return grid;
};
const BASE_GRID = buildBaseGrid();

const placeStruct = (grid: RamCell[], row: number, startCol: number, cap: number, vals: (number | string)[], offset: number = 0, hl: number[] = []): RamCell[] => {
  const next = [...grid];
  for (let i = 0; i < cap; i++) {
    const idx = row * COLS + startCol + i;
    if (idx < next.length) {
      // For queue, data might start at 'offset'
      // If we are at physical index i, is there a logical value there?
      const logicalIdx = i - offset;
      const hasVal = logicalIdx >= 0 && logicalIdx < vals.length;
      next[idx] = {
        ...next[idx],
        kind: hasVal ? 'filled' : 'empty',
        index: i,
        value: hasVal ? vals[logicalIdx] : undefined,
        highlight: hl.includes(i),
      };
    }
  }
  return next;
};

// ── Shared UI ────────────────────────────────────────────────────────────────
const RamCellView: React.FC<{ cell: RamCell }> = ({ cell }) => {
  const base = 'w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center rounded-md border text-center overflow-hidden transition-all duration-200 relative';
  const typeClass =
    cell.kind === 'blocked' ? 'bg-surface1 border-surface2 text-overlay0'
    : cell.kind === 'free' ? 'bg-base border-surface0'
    : cell.kind === 'filled' ? (cell.highlight ? 'bg-mauve/30 border-mauve shadow-[0_0_10px_rgba(203,166,247,0.5)]' : 'bg-mauve/15 border-mauve/60')
    : 'bg-mauve/5 border-mauve/25 border-dashed';

  return (
    <motion.div layout transition={SPRING} className={`${base} ${typeClass}`}>
      {cell.kind === 'blocked' && <span className="text-[9px] font-bold text-overlay0 leading-tight px-0.5 truncate w-full text-center">[{cell.blockedBy}]</span>}
      {cell.kind === 'filled' && (
        <>
          <span className="absolute top-0 left-0.5 text-[8px] font-mono text-mauve/70 leading-none">[{cell.index}]</span>
          <span className="font-bold text-sm text-mauve">{cell.value}</span>
        </>
      )}
      {cell.kind === 'empty' && <span className="absolute top-0 left-0.5 text-[8px] font-mono text-mauve/40 leading-none">[{cell.index}]</span>}
    </motion.div>
  );
};

const RamGrid: React.FC<{ grid: RamCell[] }> = ({ grid }) => (
  <LayoutGroup>
    <div className="bg-mantle rounded-xl border-2 border-dashed border-surface0 p-3 flex-shrink-0">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[9px] font-mono text-overlay0 tracking-widest">PHYSICAL RAM — 6×8 CELLS</span>
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="flex gap-1 rounded-md">
            <span className="w-4 text-[9px] font-mono text-surface2 flex items-center justify-center flex-shrink-0">R{r}</span>
            {Array.from({ length: COLS }, (_, c) => <RamCellView key={c} cell={grid[r * COLS + c]} />)}
          </div>
        ))}
      </div>
    </div>
  </LayoutGroup>
);

const NavButtons: React.FC<{ step: number; maxStep: number; onPrev: () => void; onNext: () => void; onReset: () => void }> = ({ step, maxStep, onPrev, onNext, onReset }) => (
  <div className="flex gap-3 mt-4">
    <button onClick={onReset} className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm transition-colors">🔄 Reiniciar</button>
    <button onClick={onPrev} disabled={step === 0} className="px-4 py-2 rounded-lg bg-surface0 text-text hover:bg-surface1 font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">⬅️ Anterior</button>
    <button onClick={onNext} disabled={step === maxStep} className="px-4 py-2 rounded-lg bg-mauve/80 text-crust hover:bg-mauve font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Siguiente ➡️</button>
  </div>
);

// ── MODULE 1: Stack (LIFO) ───────────────────────────────────────────────────
const STACK_STEPS = [
  { title: '📦 La Pila Vacía', desc: 'Una Pila (Stack) es como un tubo o un vaso. Reservamos un bloque de memoria contiguo en RAM, pero imaginemos que está de pie.', vals: [], hl: -1 },
  { title: '⬇️ PUSH(10)', desc: 'Al hacer PUSH, el elemento "cae" hasta el fondo. El puntero TOP sube para apuntar al último elemento insertado.', vals: [10], hl: 0 },
  { title: '⬇️ PUSH(20)', desc: 'PUSH(20). El 20 se apila SOBRE el 10. Ahora TOP apunta al índice [1].', vals: [10, 20], hl: 1 },
  { title: '⬇️ PUSH(30)', desc: 'PUSH(30). El tubo se va llenando.', vals: [10, 20, 30], hl: 2 },
  { title: '⬆️ POP() -> 30', desc: '¿Quieres sacar el 10? ¡No puedes! LIFO: Solo puedes extraer el último que entró. POP() expulsa el 30 (el TOP).', vals: [10, 20], hl: 1 },
  { title: '⬆️ POP() -> 20', desc: 'POP() extrae el 20. El TOP baja al índice [0].', vals: [10], hl: 0 },
  { title: '🚫 Stack Overflow', desc: 'Si intentamos hacer PUSH(99) cuando la pila de capacidad 4 ya está llena, ¡desborda! El bloque rebota (Overflow).', vals: [10, 42, 55, 88], hl: 3, err: 'overflow' },
  { title: '🚫 Stack Underflow', desc: 'Y si intentamos hacer POP() cuando la pila está vacía (TOP = -1)... ¡Error! No hay nada que sacar (Underflow).', vals: [], hl: -1, err: 'underflow' },
];

const StackModule: React.FC = () => {
  const [step, setStep] = useState(0);
  const s = STACK_STEPS[step];
  const cap = 4;

  const grid = placeStruct(BASE_GRID, 3, 2, cap, s.vals, 0, s.hl >= 0 ? [s.hl] : []);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
        <h3 className="text-mauve font-bold text-lg mb-2">{s.title}</h3>
        <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
      </div>

      <div className="flex gap-16 items-end">
        {/* Abstract Stack (Tube) */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-mono text-subtext mb-6">
            TOP = <span className="font-bold text-mauve">{s.hl}</span>
          </div>
          <div className="relative">
            {/* Overflow block animation */}
            {s.err === 'overflow' && (
              <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: -20, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 10 }}
                className="absolute -top-16 left-1 w-14 h-14 bg-red/80 rounded-lg flex items-center justify-center font-bold text-crust text-lg border-2 border-red z-20"
              >
                99
              </motion.div>
            )}

            {/* The Tube */}
            <motion.div
              animate={s.err === 'underflow' ? { x: [-5, 5, -5, 5, 0], borderColor: '#f38ba8' } : { borderColor: '#cba6f7' }}
              transition={{ duration: 0.3 }}
              className="w-20 border-x-4 border-b-4 border-mauve/40 rounded-b-xl flex flex-col-reverse justify-start items-center p-2 gap-1 h-[250px] relative overflow-hidden bg-base"
            >
              <AnimatePresence>
                {s.vals.map((v, i) => (
                  <motion.div
                    key={v}
                    initial={{ y: -200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.8 }}
                    transition={BOUNCE_SPRING}
                    className={`w-14 h-14 flex-shrink-0 rounded-lg border-2 flex items-center justify-center font-bold text-lg z-10
                      ${i === s.hl ? 'bg-mauve/30 border-mauve shadow-[0_0_12px_rgba(203,166,247,0.5)] text-mauve' : 'bg-surface0 border-surface1 text-text'}`}
                  >
                    {v}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* TOP Pointer arrow */}
              {s.hl >= 0 && s.err !== 'overflow' && (
                <motion.div
                  initial={false}
                  animate={{ bottom: 8 + (s.hl * 60) }}
                  transition={SPRING}
                  className="absolute -left-12 flex items-center gap-1 font-bold text-xs text-mauve"
                >
                  TOP <span>➡️</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Physical RAM */}
        <RamGrid grid={grid} />
      </div>

      <NavButtons step={step} maxStep={STACK_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
    </div>
  );
};

// ── MODULE 2: Queue (FIFO) ───────────────────────────────────────────────────
const QUEUE_STEPS = [
  { title: '🚌 La Cola (Fila de Banco)', desc: 'Una Cola (Queue) es como una fila. Tenemos un bloque de RAM y dos punteros: FRONT (quién sale) y REAR (dónde entra el siguiente).', vals: [], f: 0, r: 0 },
  { title: '➡️ ENQUEUE(10)', desc: 'Entra el 10. FRONT apunta a [0]. REAR avanza a [1] preparándose para el próximo.', vals: [10], f: 0, r: 1 },
  { title: '➡️ ENQUEUE(20)', desc: 'Entra el 20 por atrás. REAR avanza a [2].', vals: [10, 20], f: 0, r: 2 },
  { title: '➡️ ENQUEUE(30)', desc: 'Entra el 30. La fila crece.', vals: [10, 20, 30], f: 0, r: 3 },
  { title: '⬅️ DEQUEUE() -> 10', desc: 'Atendemos al cliente! Sale el PRIMERO que llegó (el 10). FRONT avanza a [1]. FIFO: First In, First Out.', vals: [20, 30], f: 1, r: 3 },
  { title: '⬅️ DEQUEUE() -> 20', desc: 'Sale el 20. FRONT avanza a [2]. ¡Ojo! Los casilleros [0] y [1] quedaron vacíos e inutilizables en una cola lineal.', vals: [30], f: 2, r: 3 },
  { title: '🚫 Overflow (Falso)', desc: 'Si intentamos meter el 40, REAR=4 y desborda el final, ¡aunque los primeros casilleros estén vacíos! Esto requiere un pesado Shifting O(N).', vals: [30, 99], f: 2, r: 4, err: true },
];

const QueueModule: React.FC = () => {
  const [step, setStep] = useState(0);
  const s = QUEUE_STEPS[step];
  const cap = 4;

  const grid = placeStruct(BASE_GRID, 4, 1, cap, s.vals, s.f, [s.f, s.r < cap ? s.r : -1]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
        <h3 className="text-teal font-bold text-lg mb-2">{s.title}</h3>
        <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
      </div>

      <div className="flex flex-col gap-10 items-center">
        {/* Abstract Queue (Rail) */}
        <div className="relative pt-8 pb-8 px-4 flex">
          {/* Pointers */}
          <motion.div animate={{ left: 16 + s.f * 64 }} transition={SPRING} className="absolute top-0 flex flex-col items-center text-xs font-bold text-green">
            <span>FRONT</span><span>⬇️</span>
          </motion.div>
          <motion.div animate={{ left: 16 + s.r * 64 }} transition={SPRING} className="absolute bottom-0 flex flex-col items-center text-xs font-bold text-blue">
            <span>⬆️</span><span>REAR</span>
          </motion.div>

          <div className="flex gap-2 p-2 border-y-4 border-surface1 bg-base h-[76px] w-[280px]">
            {Array.from({ length: cap }, (_, i) => {
              const logicalIdx = i - s.f;
              const hasVal = logicalIdx >= 0 && logicalIdx < s.vals.length;
              return (
                <div key={i} className={`w-14 h-14 flex-shrink-0 rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden
                  ${hasVal ? 'bg-teal/20 border-teal shadow-[0_0_10px_rgba(148,226,213,0.3)] text-teal font-bold text-lg' : s.err && i === 3 ? 'bg-red/20 border-red' : 'bg-surface0 border-dashed border-surface1'}`}>
                  <span className="absolute top-0 left-0.5 text-[8px] font-mono text-overlay0">[{i}]</span>
                  <AnimatePresence mode="popLayout">
                    {hasVal && (
                      <motion.span key={s.vals[logicalIdx]} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={BOUNCE_SPRING}>
                        {s.vals[logicalIdx]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          {/* Incoming overflow */}
          {s.err && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: -10, opacity: 1 }} className="absolute right-[-40px] top-[26px] w-14 h-14 bg-red/80 rounded-lg flex items-center justify-center font-bold text-crust text-lg border-2 border-red z-20">
              99
            </motion.div>
          )}
        </div>

        {/* Physical RAM */}
        <RamGrid grid={grid} />
      </div>

      <NavButtons step={step} maxStep={QUEUE_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
    </div>
  );
};

// ── MODULE 3: Circular Queue ─────────────────────────────────────────────────
const CIRC_STEPS = [
  { title: '⭕ La Solución: Cola Circular (Modulo N)', desc: 'Para evitar mover elementos cuando la cola lineal "choca" con el final, unimos el final con el principio matemáticamente.', vals: [10, 20], f: 2, r: 4 },
  { title: '➡️ ENQUEUE(30) en el final físico', desc: 'Insertamos 30 al final del array [4]. ¡La memoria física se acabó por la derecha!', vals: [10, 20, 30], f: 2, r: 5 },
  { title: '🔄 ENQUEUE(99) da la vuelta (Wrap Around)', desc: '¿Dónde va el 99? Como REAR=5 y Capacidad=5, hacemos (5 % 5) = 0. ¡REAR vuelve al inicio (índice 0)! Reutilizamos el espacio.', vals: [10, 20, 30, 99], f: 2, r: 1 },
  { title: '🔄 ENQUEUE(42) sigue llenando', desc: 'El 42 entra en el índice [1]. Ahora la memoria está 100% llena sin mover ni un solo elemento.', vals: [10, 20, 30, 99, 42], f: 2, r: 2, full: true },
  { title: '⬅️ DEQUEUE() -> 10', desc: 'Sale el 10. FRONT también da la vuelta cuando llega al final.', vals: [20, 30, 99, 42], f: 3, r: 2 },
];

const CircularModule: React.FC = () => {
  const [step, setStep] = useState(0);
  const s = CIRC_STEPS[step];
  const cap = 5;

  // Build a 5-element array correctly mapped for RAM
  const ramVals = new Array(cap).fill(undefined);
  for (let i = 0; i < s.vals.length; i++) {
    const physicalIdx = (s.f + i) % cap;
    ramVals[physicalIdx] = s.vals[i];
  }
  const grid = placeStruct(BASE_GRID, 3, 2, cap, ramVals, 0, [s.f, s.r]);

  // Math for circular layout (radius = 70px)
  const getPos = (i: number) => {
    const angle = (i / cap) * 2 * Math.PI - Math.PI / 2; // start top
    return { x: Math.cos(angle) * 70, y: Math.sin(angle) * 70 };
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
        <h3 className="text-yellow font-bold text-lg mb-2">{s.title}</h3>
        <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
      </div>

      <div className="flex gap-20 items-center mt-6">
        {/* Abstract Circular Queue */}
        <div className="relative w-48 h-48 rounded-full border-4 border-surface1 flex items-center justify-center">
          <span className="text-overlay0 font-bold text-xl opacity-20">O(1)</span>
          
          {Array.from({ length: cap }, (_, i) => {
            const pos = getPos(i);
            const val = ramVals[i];
            const isF = s.f === i && (!s.full || s.vals.length > 0);
            const isR = s.r === i && !s.full;
            
            return (
              <div key={i} className="absolute" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
                {isF && <motion.div layoutId="circ-front" transition={SPRING} className="absolute -top-6 -left-6 bg-green text-crust font-bold text-[10px] px-1 rounded z-20">FRONT</motion.div>}
                {isR && <motion.div layoutId="circ-rear" transition={SPRING} className="absolute -bottom-6 -left-4 bg-blue text-crust font-bold text-[10px] px-1 rounded z-20">REAR</motion.div>}
                
                <div className={`w-12 h-12 flex-shrink-0 rounded-full border-2 flex flex-col items-center justify-center z-10
                  ${val !== undefined ? 'bg-yellow/20 border-yellow shadow-[0_0_12px_rgba(249,226,175,0.4)] text-yellow font-bold text-lg' : 'bg-surface0 border-dashed border-surface1'}`}>
                  <span className="absolute top-1 text-[8px] font-mono text-overlay0">[{i}]</span>
                  <AnimatePresence>
                    {val !== undefined && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{val}</motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Physical RAM */}
        <RamGrid grid={grid} />
      </div>

      <NavButtons step={step} maxStep={CIRC_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const StackQueueConceptView: React.FC<StackQueueConceptViewProps> = ({ topicId }) => {
  const titles: Record<string, string> = {
    'stack-lifo': '📚 Pila (LIFO) - El Tubo Vertical',
    'queue-fifo': '🚶 Cola (FIFO) - La Fila',
    'circular-queue': '⭕ Cola Circular - Eficiencia Modular',
  };

  return (
    <div className="flex flex-col items-center w-full py-5 gap-6">
      <h2 className="text-text font-bold text-xl">{titles[topicId] ?? 'Pilas y Colas'}</h2>

      <AnimatePresence mode="wait">
        <motion.div key={topicId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="w-full flex flex-col items-center">
          {topicId === 'stack-lifo' && <StackModule />}
          {topicId === 'queue-fifo' && <QueueModule />}
          {topicId === 'circular-queue' && <CircularModule />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
