import React, { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface MemoryCell {
  index: number;
  value: number | string;
  highlighted: boolean;
  shifting: boolean;
}

interface Step {
  title: string;
  description: string;
  cells: MemoryCell[];
  highlightedAddress?: number; // index that glows in address bar
}

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_ADDR = 0x1000;
const ELEM_SIZE = 4;

function makeCell(index: number, value: number | string, highlighted = false, shifting = false): MemoryCell {
  return { index, value, highlighted, shifting };
}

const EXPLAIN_STEPS: Step[] = [
  {
    title: '🚂 Vagones Vacíos en la RAM',
    description: 'Un Vector en C++ reserva casilleros contiguos en la RAM — como vagones de un tren pegados uno al otro. Nadie puede meterse en el medio: el orden físico es fijo.',
    cells: [
      makeCell(0, '?'), makeCell(1, '?'), makeCell(2, '?'), makeCell(3, '?'), makeCell(4, '?')
    ]
  },
  {
    title: '📦 Llenando Vagón [0]',
    description: 'Guardamos el número 12 en el vagón [0]. Su dirección exacta en la RAM es 0x1000 — la dirección base del tren. Acceso instantáneo O(1).',
    cells: [
      makeCell(0, 12, true), makeCell(1, '?'), makeCell(2, '?'), makeCell(3, '?'), makeCell(4, '?')
    ],
    highlightedAddress: 0
  },
  {
    title: '🔭 Aritmética de Punteros: Vagón [2]',
    description: 'Para acceder al vagón [2], la computadora calcula: 0x1000 + 2 × 4 bytes = 0x1008. El acceso sigue siendo O(1) sin importar el tamaño del tren.',
    cells: [
      makeCell(0, 12), makeCell(1, '?'), makeCell(2, 45, true), makeCell(3, '?'), makeCell(4, '?')
    ],
    highlightedAddress: 2
  },
  {
    title: '⚡ Inserción al Final: O(1) Rápido',
    description: 'Agregar al final del vector es rápido — simplemente ponemos el valor en el siguiente vagón libre. Costo: O(1).',
    cells: [
      makeCell(0, 12), makeCell(1, '?'), makeCell(2, 45), makeCell(3, '?'), makeCell(4, 99, true)
    ],
    highlightedAddress: 4
  },
  {
    title: '😰 Inserción en el Medio: O(N) Costoso',
    description: '¡Problema! Insertar en el vagón [1] obliga a desplazar físicamente TODOS los vagones de la derecha para hacer espacio. Cuantos más vagones, más lento — costo O(N).',
    cells: [
      makeCell(0, 12),
      makeCell(1, 77, true),
      makeCell(2, '?', false, true),
      makeCell(3, 45, false, true),
      makeCell(4, 99, false, true)
    ]
  }
];

// ── Challenge ─────────────────────────────────────────────────────────────────
const CHALLENGE = {
  question: 'Si el vector empieza en 0x1000 y cada entero ocupa 4 bytes, ¿cuál es la dirección del elemento en el índice [3]?',
  options: ['0x1006', '0x100C', '0x1003', '0x1010'],
  correctIndex: 1  // 0x100C = 0x1000 + 3*4
};

// ── Sub-component: Memory Gauge ───────────────────────────────────────────────
const MemoryGauge: React.FC<{ used: number; total: number; count: number }> = ({ used, total, count }) => {
  const pct = Math.round((used / total) * 100);
  return (
    <div style={{
      width: '100%',
      maxWidth: 700,
      backgroundColor: '#181825',
      border: '1px solid #313244',
      borderRadius: 12,
      padding: '16px 24px',
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#cba6f7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚙️ Memoria RAM Asignada
        </span>
        <span style={{ color: '#bac2de', fontSize: '0.9rem' }}>
          <strong style={{ color: '#cdd6f4' }}>{used}B</strong> de{' '}
          <strong style={{ color: '#cdd6f4' }}>{total}B</strong> ({pct}%)
        </span>
      </div>
      <div style={{ width: '100%', height: 12, backgroundColor: '#313244', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: pct >= 90 ? '#f38ba8' : '#a6e3a1',
          transition: 'width 0.6s ease',
          boxShadow: '0 0 8px rgba(166,227,161,0.5)'
        }} />
      </div>
      <div style={{ color: '#6c7086', fontSize: '0.82rem' }}>
        {count} elementos × 4 bytes/int = {used} bytes — bloques CONTIGUOS garantizados
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ArrayConceptView: React.FC = () => {
  const [mode, setMode] = useState<'explanation' | 'challenge'>('explanation');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);

  // Auto-play
  useEffect(() => {
    if (!playing || mode !== 'explanation') return;
    const id = setInterval(() => {
      setStep(prev => {
        if (prev >= EXPLAIN_STEPS.length - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, 3200);
    return () => clearInterval(id);
  }, [playing, mode]);

  const stepData = EXPLAIN_STEPS[step];

  const handleValidate = useCallback(() => {
    setValidated(true);
  }, []);

  const tabBtn = (label: string, active: boolean, onClick: () => void, activeColor: string): React.CSSProperties => ({
    padding: '8px 28px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    backgroundColor: active ? activeColor : 'transparent',
    color: active ? '#11111b' : '#6c7086',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px 0' }}>

      {/* Memory Gauge */}
      <MemoryGauge used={20} total={40} count={5} />

      {/* Mode Tabs */}
      <div style={{
        display: 'flex', backgroundColor: '#181825', borderRadius: 10, padding: 4,
        border: '1px solid #313244', marginBottom: 32, gap: 4
      }}>
        <button style={tabBtn('', mode === 'explanation', () => { setMode('explanation'); setPlaying(false); }, '#313244')}
          onClick={() => { setMode('explanation'); setPlaying(false); }}>
          📖 Modo Explicación Paso a Paso
        </button>
        <button style={tabBtn('', mode === 'challenge', () => { setMode('challenge'); setPlaying(false); }, '#f9e2af')}
          onClick={() => { setMode('challenge'); setPlaying(false); setSelectedOption(null); setValidated(false); }}>
          🎮 Modo Desafío "Mano a Mano"
        </button>
      </div>

      {mode === 'explanation' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 780 }}>

          {/* Explanation Panel */}
          <div style={{
            backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
            padding: '24px 32px', width: '100%', minHeight: 120, marginBottom: 44,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.35s ease'
          }}>
            <h2 style={{ color: '#89b4fa', margin: '0 0 10px 0', fontSize: '1.4rem' }}>{stepData.title}</h2>
            <p style={{ color: '#bac2de', margin: 0, fontSize: '1.05rem', lineHeight: 1.6 }}>{stepData.description}</p>
          </div>

          {/* Array Canvas */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 48 }}>
            {stepData.cells.map((cell) => {
              const addr = `0x${(BASE_ADDR + cell.index * ELEM_SIZE).toString(16).toUpperCase()}`;
              const isHighAddr = stepData.highlightedAddress === cell.index;
              return (
                <div key={cell.index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transform: cell.shifting ? 'translateX(8px)' : 'none',
                  transition: 'transform 0.5s ease, opacity 0.3s ease' }}>

                  {/* Index badge */}
                  <div style={{ color: '#a6adc8', fontWeight: 'bold', fontSize: '1rem',
                    backgroundColor: cell.highlighted ? '#313244' : 'transparent',
                    borderRadius: 4, padding: '2px 6px' }}>
                    [{cell.index}]
                  </div>

                  {/* Cell block */}
                  <div style={{
                    width: 88, height: 88,
                    backgroundColor: cell.shifting ? 'rgba(249,226,175,0.12)' : cell.highlighted ? 'rgba(137,180,250,0.18)' : '#313244',
                    border: cell.shifting ? '2px solid #f9e2af' : cell.highlighted ? '2px solid #89b4fa' : '2px solid #45475a',
                    borderRadius: 10,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '2rem', fontWeight: 'bold',
                    color: cell.shifting ? '#f9e2af' : cell.highlighted ? '#cdd6f4' : '#6c7086',
                    boxShadow: cell.highlighted ? '0 0 20px rgba(137,180,250,0.35)' :
                               cell.shifting ? '0 0 16px rgba(249,226,175,0.3)' : 'none',
                    transition: 'all 0.4s ease'
                  }}>
                    {cell.value}
                  </div>

                  {/* Address plaque */}
                  <div style={{
                    backgroundColor: isHighAddr ? '#1e3a2f' : '#181825',
                    border: `1px solid ${isHighAddr ? '#a6e3a1' : '#45475a'}`,
                    borderRadius: 6, padding: '4px 8px',
                    color: isHighAddr ? '#a6e3a1' : '#7f849c',
                    fontFamily: 'monospace', fontSize: '0.78rem',
                    transition: 'all 0.3s ease',
                    boxShadow: isHighAddr ? '0 0 8px rgba(166,227,161,0.3)' : 'none'
                  }}>
                    {addr}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Control bar */}
          <div style={{
            display: 'flex', gap: 12, backgroundColor: '#181825', padding: '12px 24px',
            borderRadius: 24, border: '1px solid #313244'
          }}>
            {[
              { label: '⏮ Reiniciar', action: () => { setPlaying(false); setStep(0); }, color: '#45475a', textColor: '#cdd6f4' },
              { label: '◀ Anterior', action: () => { setPlaying(false); setStep(p => Math.max(0, p - 1)); }, color: '#313244', textColor: '#cdd6f4', disabled: step === 0 },
              { label: playing ? '⏸ Pausar' : '▶ Auto-Play', action: () => setPlaying(p => !p), color: playing ? '#f38ba8' : '#a6e3a1', textColor: '#11111b' },
              { label: 'Siguiente ▶', action: () => { setPlaying(false); setStep(p => Math.min(EXPLAIN_STEPS.length - 1, p + 1)); }, color: '#313244', textColor: '#cdd6f4', disabled: step === EXPLAIN_STEPS.length - 1 }
            ].map(btn => (
              <button key={btn.label} onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: 16, cursor: btn.disabled ? 'not-allowed' : 'pointer',
                  backgroundColor: btn.color, color: btn.textColor,
                  fontWeight: 'bold', fontSize: '0.95rem', opacity: btn.disabled ? 0.45 : 1,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
                }}>
                {btn.label}
              </button>
            ))}
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {EXPLAIN_STEPS.map((_, i) => (
              <div key={i} onClick={() => { setPlaying(false); setStep(i); }}
                style={{
                  width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                  backgroundColor: i === step ? '#89b4fa' : '#45475a',
                  transition: 'background-color 0.3s', boxShadow: i === step ? '0 0 6px rgba(137,180,250,0.7)' : 'none'
                }} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Challenge Mode ── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}>
          <div style={{
            backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
            padding: '28px 32px', width: '100%', marginBottom: 32
          }}>
            <h2 style={{ color: '#f9e2af', margin: '0 0 12px 0' }}>🎮 Desafío de Aritmética de Punteros</h2>
            <p style={{ color: '#bac2de', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>{CHALLENGE.question}</p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {CHALLENGE.options.map((opt, i) => {
              const isCorrect = i === CHALLENGE.correctIndex;
              const isSelected = selectedOption === i;
              let bg = '#313244', border = '#45475a', color = '#cdd6f4';
              if (validated && isSelected && isCorrect) { bg = 'rgba(166,227,161,0.2)'; border = '#a6e3a1'; color = '#a6e3a1'; }
              if (validated && isSelected && !isCorrect) { bg = 'rgba(243,139,168,0.2)'; border = '#f38ba8'; color = '#f38ba8'; }
              if (validated && !isSelected && isCorrect) { bg = 'rgba(166,227,161,0.1)'; border = '#a6e3a1'; color = '#a6e3a1'; }

              return (
                <div key={opt} onClick={() => { if (!validated) setSelectedOption(i); }}
                  style={{
                    width: 140, height: 60, backgroundColor: bg, border: `2px solid ${border}`,
                    borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: validated ? 'default' : 'pointer', color, fontFamily: 'monospace',
                    fontSize: '1.3rem', fontWeight: 'bold',
                    boxShadow: isSelected && !validated ? '0 0 14px rgba(137,180,250,0.4)' : 'none',
                    transition: 'all 0.25s'
                  }}>
                  {opt}
                </div>
              );
            })}
          </div>

          {validated && (
            <div style={{
              width: '100%', padding: '16px 24px', borderRadius: 10, marginBottom: 24,
              backgroundColor: selectedOption === CHALLENGE.correctIndex ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)',
              border: `1px solid ${selectedOption === CHALLENGE.correctIndex ? '#a6e3a1' : '#f38ba8'}`,
              color: selectedOption === CHALLENGE.correctIndex ? '#a6e3a1' : '#f38ba8',
              fontWeight: 'bold', textAlign: 'center', fontSize: '1.05rem'
            }}>
              {selectedOption === CHALLENGE.correctIndex
                ? '¡Excelente! 0x1000 + 3 × 4 = 0x100C. Dominas la aritmética de punteros.'
                : 'Casi. Recuerda: Dirección Base + Índice × Tamaño_del_tipo. 0x1000 + 3×4 = 0x100C.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => { setSelectedOption(null); setValidated(false); }}
              style={{ padding: '12px 28px', border: 'none', borderRadius: 10, backgroundColor: '#45475a', color: '#cdd6f4', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
              Reiniciar
            </button>
            <button onClick={handleValidate}
              disabled={selectedOption === null}
              style={{ padding: '12px 28px', border: 'none', borderRadius: 10, backgroundColor: selectedOption !== null ? '#89b4fa' : '#313244', color: '#11111b', fontWeight: 'bold', cursor: selectedOption !== null ? 'pointer' : 'not-allowed', fontSize: '1rem', opacity: selectedOption === null ? 0.5 : 1 }}>
              Validar Respuesta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
