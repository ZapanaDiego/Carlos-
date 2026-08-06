import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ArrayConceptViewProps {
  topicId: string;
}

type ViewMode = 'explanation' | 'challenge';

type CellKind = 'blocked' | 'free' | 'vec-filled' | 'vec-empty' | 'scan';

interface RamCell {
  id: number;
  row: number;
  col: number;
  kind: CellKind;
  blockedBy?: string;
  vecIndex?: number;
  value?: number | string;
  highlight?: boolean;
  isNew?: boolean;
}

// ── Layout Constants ─────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 8;

// Spring config used everywhere for Framer Motion
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };

// ── Fixed system occupants (row, col, label) ─────────────────────────────────
const SYSTEM_BLOCKS: { row: number; col: number; label: string }[] = [
  { row: 0, col: 0, label: 'OS' }, { row: 0, col: 1, label: 'OS' }, { row: 0, col: 2, label: 'OS' },
  { row: 0, col: 6, label: 'Chrome' }, { row: 0, col: 7, label: 'Chrome' },
  { row: 1, col: 7, label: 'Chrome' },
  { row: 2, col: 3, label: 'Discord' }, { row: 2, col: 4, label: 'Discord' },
  { row: 4, col: 0, label: 'Spotify' }, { row: 4, col: 1, label: 'Spotify' },
  { row: 5, col: 6, label: 'GPU' }, { row: 5, col: 7, label: 'GPU' },
];

const buildBaseGrid = (): RamCell[] => {
  const grid: RamCell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid.push({ id: r * COLS + c, row: r, col: c, kind: 'free' });
    }
  }
  SYSTEM_BLOCKS.forEach(b => {
    grid[b.row * COLS + b.col] = {
      id: b.row * COLS + b.col, row: b.row, col: b.col,
      kind: 'blocked', blockedBy: b.label
    };
  });
  return grid;
};

const BASE_GRID = buildBaseGrid();

// Place a vector into the grid at (row, startCol) with given values and capacity
const placeVec = (
  grid: RamCell[],
  row: number,
  startCol: number,
  values: (number | string)[],
  capacity: number,
  highlightIndices: number[] = [],
  newIndices: number[] = [],
): RamCell[] => {
  const next = [...grid];
  for (let i = 0; i < capacity; i++) {
    const idx = row * COLS + startCol + i;
    if (idx < next.length) {
      const hasVal = i < values.length;
      next[idx] = {
        ...next[idx],
        kind: hasVal ? 'vec-filled' : 'vec-empty',
        vecIndex: i,
        value: hasVal ? values[i] : undefined,
        highlight: highlightIndices.includes(i),
        isNew: newIndices.includes(i),
      };
    }
  }
  return next;
};

// ── Shared Sub-components ────────────────────────────────────────────────────

// RAM Cell visual
const RamCellView: React.FC<{ cell: RamCell; onClick?: (cell: RamCell) => void }> = ({ cell, onClick }) => {
  const base = 'w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center rounded-md border text-center overflow-hidden cursor-default select-none transition-all duration-200 relative';
  const typeClass =
    cell.kind === 'blocked'
      ? 'bg-surface1 border-surface2 text-overlay0'
      : cell.kind === 'free'
      ? 'bg-base border-surface0'
      : cell.kind === 'scan'
      ? 'bg-yellow/10 border-yellow animate-pulse-slow'
      : cell.kind === 'vec-filled'
      ? cell.highlight
        ? 'bg-blue/30 border-blue shadow-[0_0_10px_rgba(137,180,250,0.5)]'
        : cell.isNew
        ? 'bg-green/25 border-green shadow-[0_0_8px_rgba(166,227,161,0.4)]'
        : 'bg-blue/15 border-blue/60'
      : /* vec-empty */ 'bg-blue/5 border-blue/25 border-dashed';

  return (
    <motion.div
      layout
      layoutId={cell.kind === 'vec-filled' && cell.vecIndex !== undefined ? `vec-cell-${cell.vecIndex}` : undefined}
      transition={SPRING}
      className={`${base} ${typeClass} ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-blue/60' : ''}`}
      onClick={() => onClick?.(cell)}
    >
      {cell.kind === 'blocked' && (
        <span className="text-[9px] font-bold text-overlay0 leading-tight px-0.5 truncate w-full text-center">[{cell.blockedBy}]</span>
      )}
      {cell.kind === 'vec-filled' && (
        <>
          <span className="absolute top-0 left-0.5 text-[8px] font-mono text-blue/70 leading-none">[{cell.vecIndex}]</span>
          <span className="font-bold text-sm text-blue">{cell.value}</span>
        </>
      )}
      {cell.kind === 'vec-empty' && (
        <span className="absolute top-0 left-0.5 text-[8px] font-mono text-blue/40 leading-none">[{cell.vecIndex}]</span>
      )}
      {cell.kind === 'scan' && (
        <span className="text-[9px] font-bold text-yellow">scan</span>
      )}
    </motion.div>
  );
};

// The 6×8 grid component with fixed layout
const RamGrid: React.FC<{
  grid: RamCell[];
  onCellClick?: (cell: RamCell) => void;
  onRowClick?: (row: number) => void;
  highlightRow?: number;
}> = ({ grid, onCellClick, onRowClick, highlightRow }) => (
  <LayoutGroup>
    <div className="bg-mantle rounded-xl border-2 border-dashed border-surface0 p-3 flex-shrink-0">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[9px] font-mono text-overlay0 tracking-widest">PHYSICAL RAM — 6×8 CELLS</span>
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: ROWS }, (_, r) => (
          <div
            key={r}
            className={`flex gap-1 rounded-md ${highlightRow === r ? 'ring-1 ring-yellow/60 bg-yellow/5' : ''}`}
            onClick={() => onRowClick?.(r)}
          >
            <span className="w-4 text-[9px] font-mono text-surface2 flex items-center justify-center flex-shrink-0">R{r}</span>
            {Array.from({ length: COLS }, (_, c) => {
              const cell = grid[r * COLS + c];
              return <RamCellView key={c} cell={cell} onClick={onCellClick} />;
            })}
          </div>
        ))}
      </div>
    </div>
  </LayoutGroup>
);

// Abstract vector strip (top panel)
const VectorStrip: React.FC<{
  values: (number | string)[];
  capacity: number;
  size: number;
  highlightIndices?: number[];
  newIndices?: number[];
}> = ({ values, capacity, size, highlightIndices = [], newIndices = [] }) => (
  <LayoutGroup>
    <div className="bg-mantle rounded-xl border border-surface0 p-4 flex-shrink-0">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs font-mono text-subtext">
          <span className="text-blue font-bold">size</span>=<span className="text-text">{size}</span>
        </span>
        <span className="text-xs font-mono text-subtext">
          <span className="text-green font-bold">capacity</span>=<span className="text-text">{capacity}</span>
        </span>
        <span className="text-xs font-mono text-overlay0 italic">Vector Abstracto</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: capacity }, (_, i) => {
          const isFilled = i < values.length;
          const isHighlighted = highlightIndices.includes(i);
          const isNew = newIndices.includes(i);
          return (
            <motion.div
              key={i}
              layout
              layoutId={`vec-cell-${i}`}
              transition={SPRING}
              className={[
                'flex-shrink-0 w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center relative',
                isFilled
                  ? isNew
                    ? 'bg-green/20 border-green shadow-[0_0_10px_rgba(166,227,161,0.4)]'
                    : isHighlighted
                    ? 'bg-blue/30 border-blue shadow-[0_0_12px_rgba(137,180,250,0.5)] animate-glow'
                    : 'bg-blue/15 border-blue/60'
                  : 'bg-base border-dashed border-blue/25',
              ].join(' ')}
            >
              <span className="absolute top-0.5 left-1 text-[9px] font-mono text-blue/60">[{i}]</span>
              {isFilled ? (
                <span className={`font-bold text-lg ${isNew ? 'text-green' : isHighlighted ? 'text-blue' : 'text-text'}`}>{values[i]}</span>
              ) : (
                <span className="text-overlay0 text-xs">—</span>
              )}
            </motion.div>
          );
        })}
      </div>
      {/* Capacity / Size ruler */}
      <div className="flex gap-1.5 mt-1.5">
        {Array.from({ length: capacity }, (_, i) => (
          <div key={i} className={`flex-shrink-0 w-14 h-1 rounded-full ${i < size ? 'bg-blue/60' : 'bg-surface0'}`} />
        ))}
      </div>
      <div className="flex gap-1.5 mt-0.5">
        {Array.from({ length: capacity }, (_, i) => (
          <div key={i} className={`flex-shrink-0 w-14 h-1 rounded-full ${i < capacity ? 'bg-green/40' : 'bg-surface0'}`} />
        ))}
      </div>
    </div>
  </LayoutGroup>
);

// Navigation buttons
const NavButtons: React.FC<{
  step: number;
  maxStep: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}> = ({ step, maxStep, onPrev, onNext, onReset }) => (
  <div className="flex gap-3">
    <button
      onClick={onReset}
      className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm transition-colors"
    >🔄 Reiniciar</button>
    <button
      onClick={onPrev}
      disabled={step === 0}
      className="px-4 py-2 rounded-lg bg-surface0 text-text hover:bg-surface1 font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >⬅️ Anterior</button>
    <button
      onClick={onNext}
      disabled={step === maxStep}
      className="px-4 py-2 rounded-lg bg-blue/80 text-crust hover:bg-blue font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >Siguiente ➡️</button>
  </div>
);

// ── MODULE 1: Allocation (vectors-allocation) ─────────────────────────────────
const ALLOC_STEPS = [
  {
    title: '📋 RAM Fragmentada — El Desafío de la Contigüidad',
    desc: 'El SO, el Navegador y otras apps ocupan celdas dispersas de la RAM. Para crear un Vector de 5 elementos necesitamos 5 celdas SEGUIDAS. La fragmentación lo hace difícil.',
    scanRow: -1, vecRow: -1, vecCols: 0, values: [] as number[],
  },
  {
    title: '🔍 Escaneando Fila 0…',
    desc: 'Buscamos 5 celdas libres seguidas. La fila 0 tiene el OS bloqueando las primeras 3 y Chrome las últimas 2. ¡No hay hueco de 5!',
    scanRow: 0, vecRow: -1, vecCols: 0, values: [],
  },
  {
    title: '🔍 Escaneando Fila 2… Rechazada',
    desc: 'La fila 2 tiene Discord en el medio (celdas 3 y 4). Hay 3 libres a la izquierda y 3 a la derecha, pero no podemos dividir el vector en dos zonas separadas.',
    scanRow: 2, vecRow: -1, vecCols: 0, values: [],
  },
  {
    title: '✅ Fila 3: ¡Espacio Contiguo Encontrado!',
    desc: 'La fila 3 está completamente libre. El sistema reserva un bloque contiguo de 5 celdas (índices [0]–[4]). La "capacity" del vector queda establecida en 5.',
    scanRow: -1, vecRow: 3, vecCols: 5, values: [],
  },
  {
    title: '🎉 Vector Asignado: size=3, capacity=5',
    desc: 'Cargamos los datos: 10, 20, 30. Los 3 primeros casilleros están ocupados (size=3) y los 2 restantes son espacio reservado pero vacío (capacity=5).',
    scanRow: -1, vecRow: 3, vecCols: 5, values: [10, 20, 30],
  },
];

const AllocationModule: React.FC<{ mode: ViewMode }> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const [chalStatus, setChalStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');

  const s = ALLOC_STEPS[step];

  // Build grid for current explanation step
  const grid = useCallback((): RamCell[] => {
    let g = [...BASE_GRID];
    // Mark scan row
    if (s.scanRow >= 0) {
      for (let c = 0; c < COLS; c++) {
        const cell = g[s.scanRow * COLS + c];
        if (cell.kind === 'free') {
          g[s.scanRow * COLS + c] = { ...cell, kind: 'scan' };
        }
      }
    }
    // Mark vector row
    if (s.vecRow >= 0) {
      g = placeVec(g, s.vecRow, 0, s.values, s.vecCols);
    }
    return g;
  }, [s]);

  // Challenge grid — row 5 has 8 free cells
  const CHAL_BLOCKS = [
    { row: 0, col: 3, label: 'OS' }, { row: 1, col: 1, label: 'App' },
    { row: 1, col: 5, label: 'App' }, { row: 2, col: 0, label: 'App' },
    { row: 2, col: 4, label: 'App' }, { row: 3, col: 2, label: 'OS' },
    { row: 3, col: 6, label: 'OS' }, { row: 4, col: 0, label: 'App' },
    { row: 4, col: 3, label: 'App' }, { row: 4, col: 7, label: 'App' },
  ];
  const chalBase = (): RamCell[] => {
    const g: RamCell[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) g.push({ id: r * COLS + c, row: r, col: c, kind: 'free' });
    CHAL_BLOCKS.forEach(b => { g[b.row * COLS + b.col] = { id: b.row * COLS + b.col, row: b.row, col: b.col, kind: 'blocked', blockedBy: b.label }; });
    return g;
  };
  const chalGrid = chalBase();
  const handleRowClick = (r: number) => {
    // Row 5 is completely free (8 cells ≥ 4 needed)
    if (chalStatus === 'correct') return;
    if (r === 5) setChalStatus('correct');
    else setChalStatus('wrong');
  };

  if (mode === 'explanation') {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Step description */}
        <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
          <h3 className="text-blue font-bold text-lg mb-2">{s.title}</h3>
          <p className="text-subtext leading-relaxed text-sm">{s.desc}</p>
        </div>

        {/* Vector strip */}
        {s.vecCols > 0 && <VectorStrip values={s.values} capacity={s.vecCols} size={s.values.length} />}

        {/* RAM Grid */}
        <RamGrid grid={grid()} highlightRow={s.scanRow >= 0 ? s.scanRow : undefined} />

        <NavButtons step={step} maxStep={ALLOC_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl">
        <h3 className="text-yellow font-bold text-lg mb-2">🎮 Desafío: Asignador de Memoria</h3>
        <p className="text-text text-sm mb-3">Haz clic en la <strong>fila</strong> que tenga espacio contiguo para reservar un vector de <strong>4 elementos</strong>.</p>
        <AnimatePresence>
          {chalStatus === 'correct' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-green font-bold text-sm mt-2">
              ✅ ¡Perfecto! La fila 5 (R5) es la única completamente libre. Puedes reservar un bloque de 4 ahí.
            </motion.div>
          )}
          {chalStatus === 'wrong' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-red font-bold text-sm mt-2">
              ❌ Esa fila tiene celdas bloqueadas. ¡El vector no puede "saltar" sobre ellas!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <RamGrid grid={chalGrid} onRowClick={handleRowClick} />
      <button onClick={() => setChalStatus('idle')} className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm transition-colors">
        🔄 Reiniciar
      </button>
    </div>
  );
};

// ── MODULE 2: Search (array-search) ──────────────────────────────────────────
const SEARCH_VALUES = [12, 45, 7, 99, 23, 8, 42];
const SEARCH_TARGET = 8;
const SEARCH_TARGET_IDX = SEARCH_VALUES.indexOf(SEARCH_TARGET); // 5

const SEARCH_STEPS = [
  { title: '📊 El Vector en la RAM (Fila 2)', desc: 'Tenemos un vector de 7 elementos contiguos en la fila 2. Observa cómo ambos paneles (Abstracto y Físico) representan los mismos datos.', highlightIdx: -1, mode: 'idle' as const },
  { title: '⚡ Acceso Directo O(1): vector[3]', desc: 'Queremos leer el elemento [3]. El sistema calcula su posición física directamente y salta ahí en UN solo paso. No hay iteración. Eso es O(1).', highlightIdx: 3, mode: 'direct' as const },
  { title: '🔎 Búsqueda Lineal O(N): buscando el "8"', desc: 'Ahora buscamos el VALOR 8 sin saber su índice. El sistema debe revisar CADA celda, una por una, de izquierda a derecha.', highlightIdx: -1, mode: 'search-start' as const },
  ...Array.from({ length: SEARCH_TARGET_IDX + 2 }, (_, i) => ({
    title: i <= SEARCH_TARGET_IDX ? `🔍 Revisando [${i}]… ¿Es 8? → ${SEARCH_VALUES[i] === 8 ? '✅ ¡SÍ!' : `❌ No (es ${SEARCH_VALUES[i]})`}` : '🏁 Búsqueda Completa: O(N)',
    desc: i <= SEARCH_TARGET_IDX
      ? SEARCH_VALUES[i] === SEARCH_TARGET
        ? `¡Encontrado! El valor 8 está en el índice [${i}]. Tomó ${i + 1} comparaciones para encontrarlo.`
        : `El elemento [${i}] contiene ${SEARCH_VALUES[i]}, no es 8. Continuamos al siguiente.`
      : `La búsqueda tardó ${SEARCH_TARGET_IDX + 1} pasos de ${SEARCH_VALUES.length} posibles. En el peor caso (elemento al final o no existe), sería O(N) = ${SEARCH_VALUES.length} pasos.`,
    highlightIdx: i <= SEARCH_TARGET_IDX ? i : SEARCH_TARGET_IDX,
    mode: 'searching' as const,
  })),
];

const SearchModule: React.FC<{ mode: ViewMode }> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [found, setFound] = useState(false);

  const s = SEARCH_STEPS[step];
  const grid = useCallback((): RamCell[] => {
    const hl = s.highlightIdx >= 0 ? [s.highlightIdx] : [];
    let g = placeVec([...BASE_GRID], 2, 0, SEARCH_VALUES, SEARCH_VALUES.length, hl);
    return g;
  }, [s]);

  // Challenge: user clicks cells in sequence
  const handleChalClick = (cell: RamCell) => {
    if (found || cell.kind !== 'vec-filled') return;
    if (cell.vecIndex === searchStep) {
      if (cell.value === 77) setFound(true);
      else setSearchStep(p => p + 1);
    }
  };
  const CHAL_VALS = [50, 10, 25, 77, 90, 15];
  const chalGrid = placeVec([...BASE_GRID], 3, 0, CHAL_VALS, CHAL_VALS.length,
    found ? [CHAL_VALS.indexOf(77)] : searchStep > 0 ? Array.from({ length: searchStep }, (_, i) => i) : []);

  if (mode === 'explanation') {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
          <h3 className={`font-bold text-lg mb-2 ${step === 1 ? 'text-green' : 'text-blue'}`}>{s.title}</h3>
          <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
        </div>
        <VectorStrip values={SEARCH_VALUES} capacity={SEARCH_VALUES.length} size={SEARCH_VALUES.length}
          highlightIndices={s.highlightIdx >= 0 ? [s.highlightIdx] : []} />
        <RamGrid grid={grid()} />
        <NavButtons step={step} maxStep={SEARCH_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl">
        <h3 className="text-yellow font-bold text-lg mb-2">🎮 El Escáner Humano</h3>
        <p className="text-text text-sm mb-2">Busca el número <strong className="text-blue">77</strong> haciendo clic en los casilleros <em>en orden, de izquierda a derecha</em> (como lo haría la computadora).</p>
        {!found && searchStep > 0 && <p className="text-subtext text-xs">Comparaciones realizadas: <span className="text-text font-bold">{searchStep}</span></p>}
        {found && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green font-bold text-sm">✅ ¡Encontrado! Tardaste {CHAL_VALS.indexOf(77) + 1} comparaciones. Eso es O(N).</motion.div>}
      </div>
      <VectorStrip values={CHAL_VALS} capacity={CHAL_VALS.length} size={CHAL_VALS.length}
        highlightIndices={found ? [CHAL_VALS.indexOf(77)] : searchStep > 0 ? Array.from({ length: searchStep }, (_, i) => i) : []} />
      <RamGrid grid={chalGrid} onCellClick={handleChalClick} />
      <button onClick={() => { setSearchStep(0); setFound(false); }} className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm">🔄 Reiniciar</button>
    </div>
  );
};

// ── MODULE 3: Shifting (array-insertion-shifting) ─────────────────────────────
// Vector starts at row 3, cols 0-6, with 6 values; inserts 99 at index 2
type ShiftStep = { title: string; desc: string; vals: (number | string)[]; cap: number; highlightIdx: number[] };

const SHIFT_STEPS: ShiftStep[] = [
  { title: '📦 Vector de 6 Elementos', desc: 'Tenemos 6 datos ocupando 7 casilleros (size=6, capacity=7). Queremos insertar "99" en el índice [2].', vals: [10, 20, 30, 40, 50, 60], cap: 7, highlightIdx: [] },
  { title: '⬅️ Shifting: Mover 60 a [6]', desc: 'No podemos sobrescribir [2]. Primero movemos el elemento más a la DERECHA: el 60 pasa de [5] a [6].', vals: [10, 20, 30, 40, 50, '', 60], cap: 7, highlightIdx: [6] },
  { title: '⬅️ Shifting: Mover 50 a [5]', desc: 'Ahora movemos el 50 de [4] a [5].', vals: [10, 20, 30, 40, '', 50, 60], cap: 7, highlightIdx: [5] },
  { title: '⬅️ Shifting: Mover 40 a [4]', desc: 'Movemos el 40 de [3] a [4].', vals: [10, 20, 30, '', 40, 50, 60], cap: 7, highlightIdx: [4] },
  { title: '⬅️ Shifting: Mover 30 a [3]', desc: 'Movemos el 30 de [2] a [3]. ¡El índice [2] queda libre!', vals: [10, 20, '', 30, 40, 50, 60], cap: 7, highlightIdx: [3] },
  { title: '✅ Inserción: 99 en [2]', desc: '¡Por fin! Escribimos 99 en el índice [2]. Tuvimos que mover 4 elementos. Esto es O(N).', vals: [10, 20, 99, 30, 40, 50, 60], cap: 7, highlightIdx: [2] },
];

const ShiftingModule: React.FC<{ mode: ViewMode }> = ({ mode }) => {
  const [step, setStep] = useState(0);

  const s = SHIFT_STEPS[step];
  const numericVals = s.vals.filter((v): v is number => typeof v === 'number');

  const grid = useCallback((): RamCell[] => {
    let g = [...BASE_GRID];
    // Place filled cells
    s.vals.forEach((v, i) => {
      if (v !== '') {
        g[3 * COLS + i] = {
          ...g[3 * COLS + i],
          kind: 'vec-filled', vecIndex: i, value: v as number,
          highlight: s.highlightIdx.includes(i),
        };
      } else {
        g[3 * COLS + i] = { ...g[3 * COLS + i], kind: 'vec-empty', vecIndex: i };
      }
    });
    return g;
  }, [s]);

  // Challenge state: user has [10, 20, 30, 40] and needs to shift right then insert 50
  const [chalVals, setChalVals] = useState<(number | string)[]>([10, 20, 30, 40, '']);
  const [chalWon, setChalWon] = useState(false);

  const handleChalClick = (cell: RamCell) => {
    if (chalWon) return;
    if (cell.kind !== 'vec-filled' && cell.kind !== 'vec-empty') return;
    const idx = cell.vecIndex!;
    const arr = [...chalVals];

    if (cell.kind === 'vec-filled' && arr[idx + 1] === '') {
      // Shift this element right
      arr[idx + 1] = arr[idx];
      arr[idx] = '';
      setChalVals(arr);
    } else if (cell.kind === 'vec-empty' && idx === 1) {
      // Insert 50
      arr[idx] = 50;
      setChalVals(arr);
      setChalWon(true);
    }
  };

  const chalGrid = (() => {
    let g = [...BASE_GRID];
    chalVals.forEach((v, i) => {
      if (v !== '') {
        g[3 * COLS + i] = { ...g[3 * COLS + i], kind: 'vec-filled', vecIndex: i, value: v as number };
      } else {
        g[3 * COLS + i] = { ...g[3 * COLS + i], kind: 'vec-empty', vecIndex: i };
      }
    });
    return g;
  })();

  if (mode === 'explanation') {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
          <h3 className="text-red font-bold text-lg mb-2">{s.title}</h3>
          <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
        </div>
        <VectorStrip values={numericVals} capacity={s.cap} size={numericVals.length} highlightIndices={s.highlightIdx} />
        <RamGrid grid={grid()} />
        <NavButtons step={step} maxStep={SHIFT_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
      </div>
    );
  }

  const chalFilled = chalVals.filter((v): v is number => typeof v === 'number');
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl">
        <h3 className="text-yellow font-bold text-lg mb-2">🎮 Shifting Manual</h3>
        <p className="text-text text-sm mb-1">Inserta el número <strong className="text-blue">50</strong> en la posición <strong>[1]</strong>.</p>
        <p className="text-subtext text-xs">Haz clic en un elemento para desplazarlo un casillero a la derecha. Cuando [1] esté vacío, haz clic en él para insertar 50.</p>
        {chalWon && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green font-bold text-sm mt-2">✅ ¡Perfecto! Realizaste el shifting O(N) manualmente.</motion.div>}
      </div>
      <VectorStrip values={chalFilled} capacity={chalVals.length} size={chalFilled.length} />
      <RamGrid grid={chalGrid} onCellClick={handleChalClick} />
      <button onClick={() => { setChalVals([10, 20, 30, 40, '']); setChalWon(false); }} className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm">🔄 Reiniciar</button>
    </div>
  );
};

// ── MODULE 4: Resizing (vector-resizing) ──────────────────────────────────────
// Old vector at row 2, cols 2–5 (cap=4, blocked by Chrome at col 6 row 2 would have been Discord)
// New vector at row 4, cols 2–9 (cap=8) but we only have 8 cols so let's use row 4 starting col 0

// Resizing steps
const RESIZE_STEPS = [
  {
    title: '📦 Vector Lleno: size == capacity',
    desc: 'El vector tiene 4 elementos y su capacidad máxima es 4. Están todas las celdas ocupadas. Queremos añadir un quinto elemento.',
    phase: 'full',
  },
  {
    title: '🚫 Sin Espacio a la Derecha',
    desc: 'La celda inmediatamente a la derecha del vector está bloqueada por Discord. ¡No podemos extendernos ni un casillero más!',
    phase: 'blocked',
  },
  {
    title: '🔍 Buscando Nuevo Bloque Contiguo (cap×2 = 8)',
    desc: 'El sistema busca un nuevo bloque de 8 celdas libres y seguidas. Lo encuentra en la fila 4.',
    phase: 'search-new',
  },
  {
    title: '📤 Copiando Datos al Nuevo Bloque',
    desc: 'Copia TODOS los elementos al nuevo bloque uno por uno: 10→[0], 20→[1], 30→[2], 40→[3]. Esto es O(N).',
    phase: 'copying',
  },
  {
    title: '🆕 Insertando el Nuevo Dato + Liberando el Viejo',
    desc: 'El nuevo elemento (50) se inserta en [4]. El bloque viejo se libera. Ahora size=5, capacity=8.',
    phase: 'done',
  },
];

const ResizingModule: React.FC<{ mode: ViewMode }> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const [chalStep, setChalStep] = useState(0);
  const [chalDone, setChalDone] = useState(false);

  const s = RESIZE_STEPS[step];

  const grid = useCallback((): RamCell[] => {
    let g = [...BASE_GRID];
    const oldVals = [10, 20, 30, 40];
    const newVals = [10, 20, 30, 40, 50];

    if (s.phase === 'full') {
      g = placeVec(g, 2, 0, oldVals, 4);
    } else if (s.phase === 'blocked') {
      g = placeVec(g, 2, 0, oldVals, 4, [3]); // highlight last
    } else if (s.phase === 'search-new') {
      g = placeVec(g, 2, 0, oldVals, 4); // old still there
      // Mark row 4 as scan target
      for (let c = 0; c < 8; c++) {
        if (g[4 * COLS + c].kind === 'free') g[4 * COLS + c] = { ...g[4 * COLS + c], kind: 'scan' };
      }
    } else if (s.phase === 'copying') {
      g = placeVec(g, 2, 0, oldVals, 4); // old
      g = placeVec(g, 4, 0, oldVals, 8, Array.from({ length: oldVals.length }, (_, i) => i)); // new highlighted
    } else if (s.phase === 'done') {
      g = placeVec(g, 4, 0, newVals, 8, [4], [4]); // new with extra item
    }
    return g;
  }, [s]);

  const vecVals = s.phase === 'done' ? [10, 20, 30, 40, 50] : [10, 20, 30, 40];
  const cap = s.phase === 'done' || s.phase === 'copying' || s.phase === 'search-new' ? 8 : 4;

  // Challenge: user clicks buttons to simulate each resize step
  const CHAL_MSGS = [
    { btn: '➡️ El vector está lleno — Intentar insertar 99', msg: 'Vector lleno (size=4, capacity=4). El sistema detecta overflow.', color: 'text-red' },
    { btn: '🔍 Buscar nuevo bloque contiguo de cap×2=8', msg: 'Sistema encuentra fila 4 con 8 celdas libres.', color: 'text-yellow' },
    { btn: '📤 Copiar todos los datos al nuevo bloque', msg: 'Los 4 elementos son copiados al nuevo bloque. Costo: O(N).', color: 'text-blue' },
    { btn: '➕ Insertar 99 y liberar bloque viejo', msg: '99 insertado en [4]. Bloque viejo liberado. size=5, capacity=8.', color: 'text-green' },
  ];

  if (mode === 'explanation') {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl min-h-[90px]">
          <h3 className="text-mauve font-bold text-lg mb-2">{s.title}</h3>
          <p className="text-subtext text-sm leading-relaxed">{s.desc}</p>
        </div>
        <VectorStrip values={vecVals} capacity={cap} size={vecVals.length}
          newIndices={s.phase === 'done' ? [4] : []} />
        <RamGrid grid={grid()} />
        <NavButtons step={step} maxStep={RESIZE_STEPS.length - 1} onPrev={() => setStep(p => p - 1)} onNext={() => setStep(p => p + 1)} onReset={() => setStep(0)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-mantle border border-surface0 rounded-xl p-5 w-full max-w-2xl">
        <h3 className="text-yellow font-bold text-lg mb-2">🎮 Simula el Resize</h3>
        <p className="text-text text-sm mb-4">Ejecuta paso a paso las operaciones que realiza la computadora cuando el vector se queda sin espacio.</p>
        <div className="flex flex-col gap-3">
          {CHAL_MSGS.map((m, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i < chalStep ? 'opacity-50' : ''}`}>
              {i < chalStep ? (
                <span className="text-green text-sm font-bold">✅ {m.btn}</span>
              ) : i === chalStep ? (
                <button
                  onClick={() => { if (chalStep < CHAL_MSGS.length - 1) setChalStep(c => c + 1); else setChalDone(true); }}
                  className="px-4 py-2 rounded-lg bg-blue/80 text-crust hover:bg-blue font-bold text-sm transition-colors"
                >
                  {m.btn}
                </button>
              ) : (
                <span className="text-overlay0 text-sm">{m.btn}</span>
              )}
            </div>
          ))}
        </div>
        {chalStep > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={chalStep} className={`mt-3 text-sm font-bold ${CHAL_MSGS[Math.min(chalStep - 1, CHAL_MSGS.length - 1)].color}`}>
            {CHAL_MSGS[Math.min(chalStep - 1, CHAL_MSGS.length - 1)].msg}
          </motion.div>
        )}
        {chalDone && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-green font-bold">🎉 ¡Proceso completo! Este costo oculto es por qué se usa capacity×2: para que el resize ocurra raramente (amortizado O(1)).</motion.div>}
      </div>
      <VectorStrip values={chalStep < 2 ? [10, 20, 30, 40] : chalStep < 4 ? [10, 20, 30, 40] : [10, 20, 30, 40, 99]}
        capacity={chalStep < 2 ? 4 : 8} size={chalDone ? 5 : 4}
        newIndices={chalDone ? [4] : []} />
      <button onClick={() => { setChalStep(0); setChalDone(false); }} className="px-4 py-2 rounded-lg bg-surface0 text-subtext hover:bg-surface1 font-bold text-sm">🔄 Reiniciar</button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const ArrayConceptView: React.FC<ArrayConceptViewProps> = ({ topicId }) => {
  const [mode, setMode] = useState<ViewMode>('explanation');

  const titles: Record<string, string> = {
    'vectors-allocation': '🧩 Memoria Contigua y Asignación',
    'array-search': '🔍 Acceso O(1) vs Búsqueda O(N)',
    'array-insertion-shifting': '🔀 Inserción y Desplazamiento (Shifting)',
    'vector-resizing': '⚡ Redimensionamiento (Size vs Capacity)',
  };

  return (
    <div className="flex flex-col items-center w-full py-5 gap-6">
      {/* Header */}
      <h2 className="text-text font-bold text-xl">{titles[topicId] ?? '📊 Arrays y Vectores'}</h2>

      {/* Mode Tabs */}
      <div className="flex bg-mantle rounded-xl p-1 border border-surface0 gap-1">
        <button
          onClick={() => setMode('explanation')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${mode === 'explanation' ? 'bg-surface0 text-text' : 'text-overlay0 hover:text-subtext'}`}
        >
          📖 Modo Explicación Paso a Paso
        </button>
        <button
          onClick={() => setMode('challenge')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${mode === 'challenge' ? 'bg-yellow/80 text-crust' : 'text-overlay0 hover:text-subtext'}`}
        >
          🎮 Modo Desafío
        </button>
      </div>

      {/* Module Routing */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${topicId}-${mode}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="w-full flex flex-col items-center"
        >
          {topicId === 'vectors-allocation' && <AllocationModule mode={mode} />}
          {topicId === 'array-search' && <SearchModule mode={mode} />}
          {topicId === 'array-insertion-shifting' && <ShiftingModule mode={mode} />}
          {topicId === 'vector-resizing' && <ResizingModule mode={mode} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
