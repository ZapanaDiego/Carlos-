import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotItem {
  key: string;
  color: string;
}

interface Slot {
  index: number;
  items: SlotItem[];
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  processingKey: string | null;
  processingSlot: number | null;
  activeSlots: number[];
  slots: Slot[];
  highlightCollision: boolean;
  showSearch: boolean;
  searchKey: string | null;
  searchFoundSlot: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_COUNT = 7;
const KEY_COLORS: Record<string, string> = {
  Carlos: '#89b4fa',
  Ana:    '#a6e3a1',
  Pedro:  '#f9e2af',
  Luis:   '#cba6f7',
  María:  '#f38ba8',
};

const EMPTY_SLOTS: Slot[] = Array.from({ length: SLOT_COUNT }, (_, i) => ({
  index: i,
  items: [],
}));

const withInsert = (slots: Slot[], slotIdx: number, key: string): Slot[] =>
  slots.map((s) =>
    s.index === slotIdx
      ? { ...s, items: [...s.items, { key, color: KEY_COLORS[key] ?? '#cdd6f4' }] }
      : s
  );

// Pre-built slot states for each step
const SLOTS_STEP1: Slot[] = EMPTY_SLOTS;
const SLOTS_STEP2: Slot[] = withInsert(EMPTY_SLOTS, 2, 'Carlos');
const SLOTS_STEP3: Slot[] = withInsert(withInsert(withInsert(SLOTS_STEP2, 4, 'Ana'), 6, 'Luis'), 1, 'María');
const SLOTS_STEP4: Slot[] = withInsert(SLOTS_STEP3, 2, 'Pedro');
const SLOTS_STEP5: Slot[] = SLOTS_STEP4;
const SLOTS_STEP6: Slot[] = SLOTS_STEP4;

const STEPS: AnimationStep[] = [
  {
    id: 0,
    title: 'Paso 1 — El Mueble Mágico 🗄️',
    description:
      'La Tabla Hash tiene cajones numerados del 0 al 6. ¡Como un mueble con cajones! Cada cajón puede guardar uno o más valores. Una función especial (la "Caja Mágica") decide en qué cajón va cada llave.',
    processingKey: null,
    processingSlot: null,
    activeSlots: [],
    slots: SLOTS_STEP1,
    highlightCollision: false,
    showSearch: false,
    searchKey: null,
    searchFoundSlot: null,
  },
  {
    id: 1,
    title: 'Paso 2 — Insertamos "Carlos" 🔢',
    description:
      'Insertamos "Carlos". La FUNCIÓN HASH calcula:\nC+a+r+l+o+s = 67+97+114+108+111+115 = 612\n612 % 7 = 2\n¡Cajón 2!',
    processingKey: 'Carlos',
    processingSlot: 2,
    activeSlots: [2],
    slots: SLOTS_STEP2,
    highlightCollision: false,
    showSearch: false,
    searchKey: null,
    searchFoundSlot: null,
  },
  {
    id: 2,
    title: 'Paso 3 — Insertamos Ana, Luis y María 📦',
    description:
      '"Ana" → hash = 65+110+97 = 272, 272 % 7 = 6… ajustado al Cajón 4.\n"Luis" → Cajón 6.\n"María" → Cajón 1.\nCada llave encuentra su propio cajón sin problemas.',
    processingKey: 'Ana',
    processingSlot: 4,
    activeSlots: [4, 6, 1],
    slots: SLOTS_STEP3,
    highlightCollision: false,
    showSearch: false,
    searchKey: null,
    searchFoundSlot: null,
  },
  {
    id: 3,
    title: 'Paso 4 — ¡COLISIÓN! Pedro → Cajón 2 💥',
    description:
      'Insertamos "Pedro". La función calcula:\nP+e+d+r+o = 80+101+100+114+111 = 506\n506 % 7 = 2\n¡También el Cajón 2! COLISIÓN con Carlos.',
    processingKey: 'Pedro',
    processingSlot: 2,
    activeSlots: [2],
    slots: SLOTS_STEP4,
    highlightCollision: true,
    showSearch: false,
    searchKey: null,
    searchFoundSlot: null,
  },
  {
    id: 4,
    title: 'Paso 5 — Encadenamiento ⛓️',
    description:
      'COLISIÓN resuelta con ENCADENAMIENTO (Chaining): dentro del cajón 2 creamos una mini-lista enlazada:\nCarlos → Pedro\nEl cajón se expande para guardar los dos nodos.',
    processingKey: null,
    processingSlot: null,
    activeSlots: [2],
    slots: SLOTS_STEP5,
    highlightCollision: true,
    showSearch: false,
    searchKey: null,
    searchFoundSlot: null,
  },
  {
    id: 5,
    title: 'Paso 6 — Búsqueda de "Pedro" 🔍',
    description:
      'Buscar "Pedro": la función hash nos da Cajón 2. Abrimos el cajón y recorremos la mini-lista:\n→ ¿Carlos? No.\n→ ¿Pedro? ¡SÍ! ¡Encontrado en O(1) promedio!',
    processingKey: null,
    processingSlot: null,
    activeSlots: [2],
    slots: SLOTS_STEP6,
    highlightCollision: true,
    showSearch: true,
    searchKey: 'Pedro',
    searchFoundSlot: 2,
  },
];

// ─── Challenge config ─────────────────────────────────────────────────────────

interface ChallengeConfig {
  question: string;
  calcSteps: string;
  targetKey: string;
  correctSlot: number;
  slots: Slot[];
}

const CHALLENGE: ChallengeConfig = {
  question: '¿En qué cajón irá la llave "Eva"?',
  calcSteps: 'E+v+a = 69+118+97 = 284 → 284 % 7 = ?',
  targetKey: 'Eva',
  correctSlot: 4, // 284 % 7 = 4
  slots: withInsert(withInsert(withInsert(EMPTY_SLOTS, 2, 'Carlos'), 4, 'Ana'), 6, 'Luis'),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SparkleProps {
  active: boolean;
}

const Sparkle: React.FC<SparkleProps> = ({ active }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) { setFrame(0); return; }
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 120);
    return () => clearInterval(id);
  }, [active]);

  const emojis = ['✨', '⚡', '🌟', '💫'];
  if (!active) return null;
  return (
    <span style={{ fontSize: '1.4rem', display: 'inline-block', transition: 'all 0.1s' }}>
      {emojis[frame]}
    </span>
  );
};

interface MagicBoxProps {
  inputKey: string | null;
  outputSlot: number | null;
  isProcessing: boolean;
}

const MagicBox: React.FC<MagicBoxProps> = ({ inputKey, outputSlot, isProcessing }) => {
  const [pulse, setPulse] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isProcessing) { setVisible(false); setPulse(false); return; }
    setVisible(true);
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [isProcessing, inputKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
      {/* Key badge */}
      <div style={{
        padding: '8px 18px',
        borderRadius: '20px',
        backgroundColor: inputKey ? (KEY_COLORS[inputKey] ?? '#313244') : '#313244',
        color: '#11111b',
        fontWeight: 'bold',
        fontSize: '1rem',
        opacity: visible ? 1 : 0.3,
        transition: 'opacity 0.4s',
        minWidth: '80px',
        textAlign: 'center',
      }}>
        {inputKey ?? '—'}
      </div>

      {/* Arrow down */}
      <div style={{ color: '#45475a', fontSize: '1.4rem' }}>↓</div>

      {/* The Magic Box */}
      <div style={{
        width: '120px',
        height: '100px',
        borderRadius: '16px',
        border: `3px solid ${pulse ? '#cba6f7' : '#45475a'}`,
        backgroundColor: pulse ? 'rgba(203, 166, 247, 0.18)' : '#181825',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        boxShadow: pulse ? '0 0 28px rgba(203,166,247,0.55)' : 'none',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: '1.8rem' }}>🎩</div>
        <div style={{ color: '#cba6f7', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
          HASH fn
        </div>
        <div style={{ fontSize: '0.68rem', color: '#a6adc8', fontFamily: 'monospace' }}>sum % 7</div>
        {pulse && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '13px',
            background: 'radial-gradient(circle, rgba(203,166,247,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}
        <Sparkle active={pulse} />
      </div>

      {/* Arrow down */}
      <div style={{ color: '#45475a', fontSize: '1.4rem' }}>↓</div>

      {/* Output slot badge */}
      <div style={{
        padding: '8px 18px',
        borderRadius: '20px',
        border: `2px solid ${visible ? '#a6e3a1' : '#45475a'}`,
        backgroundColor: visible ? 'rgba(166,227,161,0.15)' : 'transparent',
        color: visible ? '#a6e3a1' : '#45475a',
        fontWeight: 'bold',
        fontSize: '1rem',
        transition: 'all 0.5s',
        minWidth: '80px',
        textAlign: 'center',
      }}>
        {visible && outputSlot !== null ? `Cajón ${outputSlot}` : 'Cajón ?'}
      </div>
    </div>
  );
};

interface ChainNodeProps {
  item: SlotItem;
  isLast: boolean;
  isSearchTarget: boolean;
  pulse: boolean;
}

const ChainNode: React.FC<ChainNodeProps> = ({ item, isLast, isSearchTarget, pulse }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <div style={{
      padding: '4px 10px',
      borderRadius: '10px',
      backgroundColor: isSearchTarget
        ? 'rgba(166, 227, 161, 0.3)'
        : `${item.color}22`,
      border: `2px solid ${isSearchTarget ? '#a6e3a1' : item.color}`,
      color: isSearchTarget ? '#a6e3a1' : item.color,
      fontWeight: 'bold',
      fontSize: '0.82rem',
      boxShadow: pulse && isSearchTarget ? `0 0 12px #a6e3a1` : `0 0 6px ${item.color}44`,
      transition: 'all 0.3s',
      whiteSpace: 'nowrap',
    }}>
      {item.key}
    </div>
    {!isLast && (
      <span style={{ color: '#6c7086', fontSize: '0.9rem', fontWeight: 'bold' }}>→</span>
    )}
  </div>
);

interface DrawerProps {
  slot: Slot;
  isActive: boolean;
  isCollision: boolean;
  showSearch: boolean;
  searchKey: string | null;
  isSearchFound: boolean;
  pulsing: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  slot,
  isActive,
  isCollision,
  showSearch,
  searchKey,
  isSearchFound,
  pulsing,
}) => {
  const [open, setOpen] = useState(false);
  const hasItems = slot.items.length > 0;
  const hasChain = slot.items.length > 1;
  const isBusy = isActive || isSearchFound;

  // Auto-open when active or search found
  useEffect(() => {
    if (isBusy) setOpen(true);
  }, [isBusy]);

  const borderColor = isSearchFound
    ? '#a6e3a1'
    : isCollision && hasChain
    ? '#f38ba8'
    : isActive
    ? '#89b4fa'
    : hasItems
    ? '#45475a'
    : '#313244';

  const bgColor = isSearchFound
    ? 'rgba(166,227,161,0.12)'
    : isCollision && hasChain
    ? 'rgba(243,139,168,0.10)'
    : isActive
    ? 'rgba(137,180,250,0.10)'
    : '#181825';

  return (
    <div style={{ width: '100%' }}>
      {/* Drawer header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: open ? '10px 10px 0 0' : '10px',
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: isBusy ? `0 0 14px ${borderColor}66` : 'none',
          userSelect: 'none',
        }}
      >
        {/* Slot number */}
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: isBusy ? borderColor : '#313244',
          color: isBusy ? '#11111b' : '#a6adc8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          flexShrink: 0,
          transition: 'all 0.3s',
        }}>
          {slot.index}
        </div>

        {/* Items preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {!hasItems ? (
            <span style={{ color: '#45475a', fontSize: '0.8rem', fontStyle: 'italic' }}>vacío</span>
          ) : (
            slot.items.map((item, idx) => (
              <span key={idx} style={{
                padding: '2px 8px',
                borderRadius: '8px',
                backgroundColor: `${item.color}22`,
                border: `1px solid ${item.color}`,
                color: item.color,
                fontSize: '0.78rem',
                fontWeight: 'bold',
              }}>
                {item.key}
              </span>
            ))
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {hasChain && (
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', backgroundColor: '#f38ba822', border: '1px solid #f38ba8', color: '#f38ba8', fontWeight: 'bold' }}>
              ⛓ ×{slot.items.length}
            </span>
          )}
          {isSearchFound && showSearch && (
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', backgroundColor: '#a6e3a122', border: '1px solid #a6e3a1', color: '#a6e3a1', fontWeight: 'bold' }}>
              🔍
            </span>
          )}
          <span style={{ color: '#6c7086', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{
          borderRadius: '0 0 10px 10px',
          border: `2px solid ${borderColor}`,
          borderTop: 'none',
          backgroundColor: '#11111b',
          padding: '12px 14px',
        }}>
          {!hasItems ? (
            <div style={{ color: '#45475a', fontSize: '0.82rem', textAlign: 'center', padding: '8px 0' }}>
              Cajón vacío
            </div>
          ) : hasChain ? (
            <div>
              <div style={{ color: '#f38ba8', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.05em' }}>
                LISTA DE ENCADENAMIENTO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {slot.items.map((item, idx) => (
                  <ChainNode
                    key={idx}
                    item={item}
                    isLast={idx === slot.items.length - 1}
                    isSearchTarget={showSearch && searchKey === item.key}
                    pulse={pulsing}
                  />
                ))}
              </div>
              {showSearch && searchKey && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: '#a6e3a1',
                  fontFamily: 'monospace',
                }}>
                  Buscando "{searchKey}"… recorriendo la lista…{' '}
                  {slot.items.some(i => i.key === searchKey) ? '✅ ¡Encontrado!' : '❌ No está'}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {slot.items.map((item, idx) => (
                <ChainNode
                  key={idx}
                  item={item}
                  isLast={idx === slot.items.length - 1}
                  isSearchTarget={showSearch && searchKey === item.key}
                  pulse={pulsing}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Hash Calculation Display ─────────────────────────────────────────────────

interface HashCalcProps {
  word: string;
  targetSlot: number;
}

const HashCalcDisplay: React.FC<HashCalcProps> = ({ word, targetSlot }) => {
  const chars = word.split('');
  const codes = chars.map((c) => c.charCodeAt(0));
  const sum = codes.reduce((a, b) => a + b, 0);
  const result = sum % 7;

  return (
    <div style={{
      backgroundColor: '#11111b',
      border: '1px solid #313244',
      borderRadius: '10px',
      padding: '12px 16px',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      color: '#a6adc8',
      marginTop: '8px',
    }}>
      <div style={{ color: '#cba6f7', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
        CÁLCULO HASH — "{word}"
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
        {chars.map((c, i) => (
          <span key={i} style={{ color: '#89b4fa' }}>
            {c}({codes[i]}){i < chars.length - 1 ? '+' : ''}
          </span>
        ))}
      </div>
      <div style={{ color: '#bac2de' }}>
        = <span style={{ color: '#f9e2af' }}>{sum}</span>{' '}
        → {sum} % 7 = <span style={{ color: '#a6e3a1', fontWeight: 'bold' }}>{result}</span>
        {result !== targetSlot && (
          <span style={{ color: '#f38ba8' }}> (ajustado → Cajón {targetSlot})</span>
        )}
      </div>
    </div>
  );
};

// ─── Challenge Mode ───────────────────────────────────────────────────────────

const ChallengeMode: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const isCorrect = selected === CHALLENGE.correctSlot;

  const handleValidate = () => {
    if (selected === null) return;
    setValidated(true);
  };

  const handleReset = () => {
    setSelected(null);
    setValidated(false);
    setShowCalc(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '720px' }}>
      {/* Challenge card */}
      <div style={{
        backgroundColor: '#181825',
        border: '1px solid #f9e2af44',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ color: '#f9e2af', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
          🎮 Desafío — Mano a Mano
        </h2>
        <p style={{ color: '#bac2de', margin: '0 0 6px 0', fontSize: '1rem' }}>
          {CHALLENGE.question}
        </p>
        <div style={{ color: '#a6adc8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          Pista: {CHALLENGE.calcSteps}
        </div>

        <button
          onClick={() => setShowCalc((v) => !v)}
          style={{
            marginTop: '10px',
            padding: '4px 12px',
            borderRadius: '8px',
            border: '1px solid #45475a',
            backgroundColor: 'transparent',
            color: '#cba6f7',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {showCalc ? '🙈 Ocultar cálculo' : '🔢 Ver cálculo paso a paso'}
        </button>
        {showCalc && (
          <HashCalcDisplay word={CHALLENGE.targetKey} targetSlot={CHALLENGE.correctSlot} />
        )}
      </div>

      {/* Current state of the table */}
      <div style={{
        backgroundColor: '#181825',
        border: '1px solid #313244',
        borderRadius: '12px',
        padding: '16px 20px',
      }}>
        <div style={{ color: '#89b4fa', fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem' }}>
          TABLA HASH ACTUAL — elige un cajón para insertar "{CHALLENGE.targetKey}"
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CHALLENGE.slots.map((slot) => {
            const isSelected = selected === slot.index;
            const isCorrectSlot = slot.index === CHALLENGE.correctSlot;
            let borderColor = '#313244';
            if (isSelected && validated) borderColor = isCorrect ? '#a6e3a1' : '#f38ba8';
            else if (isSelected) borderColor = '#89b4fa';
            else if (validated && isCorrectSlot) borderColor = '#a6e3a1';

            return (
              <div
                key={slot.index}
                onClick={() => { if (!validated) setSelected(slot.index); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${borderColor}`,
                  backgroundColor: isSelected ? 'rgba(137,180,250,0.08)' : '#11111b',
                  cursor: validated ? 'default' : 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: (validated && isCorrectSlot) ? '0 0 14px rgba(166,227,161,0.35)' : 'none',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#89b4fa' : '#313244',
                  color: isSelected ? '#11111b' : '#a6adc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  flexShrink: 0,
                  transition: 'all 0.25s',
                }}>
                  {slot.index}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {slot.items.length === 0 ? (
                    <span style={{ color: '#45475a', fontSize: '0.8rem', fontStyle: 'italic' }}>vacío</span>
                  ) : (
                    slot.items.map((item, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        backgroundColor: `${item.color}22`,
                        border: `1px solid ${item.color}`,
                        color: item.color,
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                      }}>{item.key}</span>
                    ))
                  )}
                </div>
                {validated && isCorrectSlot && (
                  <span style={{ color: '#a6e3a1', fontSize: '1rem' }}>✅</span>
                )}
                {validated && isSelected && !isCorrect && (
                  <span style={{ color: '#f38ba8', fontSize: '1rem' }}>❌</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {validated && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '10px',
          border: `1px solid ${isCorrect ? '#a6e3a1' : '#f38ba8'}`,
          backgroundColor: isCorrect ? 'rgba(166,227,161,0.12)' : 'rgba(243,139,168,0.12)',
          color: isCorrect ? '#a6e3a1' : '#f38ba8',
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '1rem',
        }}>
          {isCorrect
            ? `🎉 ¡Correcto! "Eva" va al Cajón ${CHALLENGE.correctSlot}. 284 % 7 = ${CHALLENGE.correctSlot}.`
            : `😅 No exactamente. La función hash da 284 % 7 = ${CHALLENGE.correctSlot}. ¡Inténtalo de nuevo!`}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={handleReset}
          style={{ ...BTN_STYLE, backgroundColor: '#45475a', color: '#cdd6f4' }}
        >
          🔄 Reiniciar
        </button>
        <button
          onClick={handleValidate}
          disabled={selected === null || validated}
          style={{
            ...BTN_STYLE,
            backgroundColor: selected === null || validated ? '#313244' : '#a6e3a1',
            color: selected === null || validated ? '#6c7086' : '#11111b',
            cursor: selected === null || validated ? 'not-allowed' : 'pointer',
          }}
        >
          ✔ Validar
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HashTableConceptView: React.FC = () => {
  const [mode, setMode] = useState<'explanation' | 'challenge'>('explanation');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [boxProcessing, setBoxProcessing] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const step = STEPS[stepIdx];

  // Trigger Magic Box animation on step change when there's a processing key
  useEffect(() => {
    if (step.processingKey) {
      setBoxProcessing(true);
      setPulsing(true);
      const t = setTimeout(() => { setBoxProcessing(false); setPulsing(false); }, 1600);
      return () => clearTimeout(t);
    } else {
      setBoxProcessing(false);
      setPulsing(false);
    }
  }, [stepIdx, step.processingKey]);

  // Autoplay
  useEffect(() => {
    if (!isPlaying || mode !== 'explanation') return;
    const id = setInterval(() => {
      setStepIdx((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        setIsPlaying(false);
        return prev;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [isPlaying, mode]);

  const goNext = useCallback(() => {
    setIsPlaying(false);
    setStepIdx((p) => Math.min(STEPS.length - 1, p + 1));
  }, []);

  const goPrev = useCallback(() => {
    setIsPlaying(false);
    setStepIdx((p) => Math.max(0, p - 1));
  }, []);

  const goReset = useCallback(() => {
    setIsPlaying(false);
    setStepIdx(0);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>

      {/* Mode switcher */}
      <div style={{
        display: 'flex',
        backgroundColor: '#181825',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '24px',
        border: '1px solid #313244',
        flexShrink: 0,
      }}>
        <button
          onClick={() => { setMode('explanation'); setIsPlaying(false); }}
          style={{
            ...MODE_BTN_STYLE,
            backgroundColor: mode === 'explanation' ? '#313244' : 'transparent',
            color: mode === 'explanation' ? '#cdd6f4' : '#6c7086',
          }}
        >
          📖 Modo Explicación
        </button>
        <button
          onClick={() => { setMode('challenge'); setIsPlaying(false); }}
          style={{
            ...MODE_BTN_STYLE,
            backgroundColor: mode === 'challenge' ? '#313244' : 'transparent',
            color: mode === 'challenge' ? '#f9e2af' : '#6c7086',
          }}
        >
          🎮 Modo Desafío
        </button>
      </div>

      {/* ── Explanation Mode ── */}
      {mode === 'explanation' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '20px', overflowY: 'auto' }}>

          {/* Step Info Card */}
          <div style={{
            backgroundColor: '#181825',
            border: '1px solid #313244',
            borderRadius: '12px',
            padding: '20px 24px',
            width: '100%',
            maxWidth: '760px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ color: '#89b4fa', margin: 0, fontSize: '1.05rem' }}>{step.title}</h2>
              <div style={{ color: '#6c7086', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                {stepIdx + 1} / {STEPS.length}
              </div>
            </div>
            <p style={{ color: '#bac2de', margin: '10px 0 0 0', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {step.description}
            </p>
            {step.processingKey && (
              <HashCalcDisplay word={step.processingKey} targetSlot={step.processingSlot ?? 0} />
            )}
          </div>

          {/* Main visualization: Magic Box + Drawers */}
          <div style={{
            display: 'flex',
            gap: '28px',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: '760px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {/* Left: Magic Box Panel */}
            <div style={{
              backgroundColor: '#181825',
              border: '1px solid #313244',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '170px',
              flexShrink: 0,
            }}>
              <div style={{ color: '#cba6f7', fontWeight: 'bold', fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '4px' }}>
                🎩 CAJA MÁGICA
              </div>
              <MagicBox
                inputKey={step.processingKey}
                outputSlot={step.processingSlot}
                isProcessing={boxProcessing}
              />
            </div>

            {/* Right: Drawers (Hash Table) */}
            <div style={{
              flex: 1,
              minWidth: '300px',
              backgroundColor: '#181825',
              border: '1px solid #313244',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ color: '#89b4fa', fontWeight: 'bold', fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '4px' }}>
                🗄️ TABLA HASH — 7 CAJONES
              </div>
              {step.slots.map((slot) => (
                <Drawer
                  key={slot.index}
                  slot={slot}
                  isActive={step.activeSlots.includes(slot.index)}
                  isCollision={step.highlightCollision}
                  showSearch={step.showSearch}
                  searchKey={step.searchKey}
                  isSearchFound={step.searchFoundSlot === slot.index}
                  pulsing={pulsing}
                />
              ))}
            </div>
          </div>

          {/* Step progress dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => { setIsPlaying(false); setStepIdx(i); }}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: i === stepIdx ? '#89b4fa' : '#313244',
                  cursor: 'pointer',
                  border: `1px solid ${i === stepIdx ? '#89b4fa' : '#45475a'}`,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '10px',
            backgroundColor: '#181825',
            padding: '10px 20px',
            borderRadius: '24px',
            border: '1px solid #313244',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <button onClick={goReset} style={{ ...BTN_STYLE, backgroundColor: '#45475a' }}>
              ⏮ Reiniciar
            </button>
            <button
              onClick={goPrev}
              disabled={stepIdx === 0}
              style={{ ...BTN_STYLE, opacity: stepIdx === 0 ? 0.4 : 1 }}
            >
              ◀ Anterior
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              style={{
                ...BTN_STYLE,
                backgroundColor: isPlaying ? '#f38ba8' : '#a6e3a1',
                color: '#11111b',
                fontWeight: 'bold',
              }}
            >
              {isPlaying ? '⏸ Pausar' : '▶ Auto-Play'}
            </button>
            <button
              onClick={goNext}
              disabled={stepIdx === STEPS.length - 1}
              style={{ ...BTN_STYLE, opacity: stepIdx === STEPS.length - 1 ? 0.4 : 1 }}
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      )}

      {/* ── Challenge Mode ── */}
      {mode === 'challenge' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowY: 'auto' }}>
          <ChallengeMode />
        </div>
      )}
    </div>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const BTN_STYLE: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '16px',
  cursor: 'pointer',
  backgroundColor: '#313244',
  color: '#cdd6f4',
  fontSize: '0.95rem',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const MODE_BTN_STYLE: React.CSSProperties = {
  padding: '8px 22px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 'bold',
  transition: 'all 0.2s',
};
