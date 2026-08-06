import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ListMode = 'singly' | 'doubly' | 'circular';
type ViewMode = 'explanation' | 'challenge';

interface NodeData {
  id: string;
  value: string;
  x: number;
  y: number;
  next?: string | null;
  prev?: string | null;
  visible: boolean;
  highlight: boolean;
  label?: string;
}

interface Step {
  title: string;
  description: string;
  nodes: NodeData[];
}

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  blue: '#89b4fa',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  red: '#f38ba8',
  mauve: '#cba6f7',
  bg: '#181825',
  surface: '#313244',
  text: '#cdd6f4',
  subtext: '#bac2de',
  thread: '#f5c2e7',
  threadGhost: 'rgba(245, 194, 231, 0.2)'
};

// ── Data: Singly ──────────────────────────────────────────────────────────────
const S_NODES = {
  n1: { id: 'n1', value: '42', x: 50, y: 50, next: 'n2', visible: true, highlight: false },
  n2: { id: 'n2', value: '7', x: 280, y: 150, next: 'n3', visible: false, highlight: false },
  n3: { id: 'n3', value: '93', x: 450, y: 40, next: null, visible: false, highlight: false },
  nIns: { id: 'nIns', value: '55', x: 180, y: 220, next: 'n2', visible: false, highlight: false },
};

const SINGLY_STEPS: Step[] = [
  {
    title: '🏝️ Primer Nodo en la RAM',
    description: 'El primer nodo aparece en cualquier lugar de la RAM. Guarda un valor (42) y tiene una "cuerda" lista para apuntar al siguiente.',
    nodes: [{ ...S_NODES.n1, next: null }]
  },
  {
    title: '🧵 Conectando el Segundo Nodo',
    description: 'Aparece otro nodo (7) en otra dirección de memoria. El primer nodo lanza su cuerda (puntero) para atraparlo y saber dónde está.',
    nodes: [S_NODES.n1, { ...S_NODES.n2, next: null }]
  },
  {
    title: '🛑 El Fin de la Lista (NULL)',
    description: 'Un tercer nodo (93) es agregado. Como es el último, su cuerda no apunta a ningún lado (apunta a NULL).',
    nodes: [S_NODES.n1, S_NODES.n2, S_NODES.n3]
  },
  {
    title: '✂️ ¡Insertar en el Medio es Rápido!',
    description: 'Llega un nuevo nodo (55). Solo rompemos la cuerda del 42 y la enganchamos al 55. El 55 lanza su cuerda al 7. ¡No tuvimos que mover físicamente ningún bloque!',
    nodes: [{ ...S_NODES.n1, next: 'nIns' }, S_NODES.nIns, S_NODES.n2, S_NODES.n3]
  }
];

// ── Data: Doubly ──────────────────────────────────────────────────────────────
const D_NODES = {
  n1: { id: 'n1', value: '10', x: 60, y: 120, prev: null, next: 'n2', visible: true, highlight: false },
  n2: { id: 'n2', value: '20', x: 260, y: 120, prev: 'n1', next: 'n3', visible: true, highlight: false },
  n3: { id: 'n3', value: '30', x: 460, y: 120, prev: 'n2', next: null, visible: true, highlight: false },
};

const DOUBLY_STEPS: Step[] = [
  {
    title: '↔️ Lista Doblemente Enlazada',
    description: 'Cada nodo ahora tiene DOS cuerdas: una apunta al siguiente, y otra apunta al anterior. Podemos viajar en ambas direcciones.',
    nodes: [{ ...D_NODES.n1, next: null }, { ...D_NODES.n2, prev: null, next: null }]
  },
  {
    title: '🔗 Conexión Bidireccional',
    description: 'Conectamos el 10 con el 20. El 10 sabe quién le sigue (20), y el 20 sabe quién está antes (10).',
    nodes: [{ ...D_NODES.n1 }, { ...D_NODES.n2, next: null }]
  },
  {
    title: '🏎️ Viaje en Reversa',
    description: 'Agregamos el 30. Al tener enlaces previos, si estamos en el 30 podemos regresar fácilmente al 10. (Doble memoria, doble flexibilidad).',
    nodes: [D_NODES.n1, D_NODES.n2, D_NODES.n3]
  }
];

// ── Data: Circular ────────────────────────────────────────────────────────────
const C_NODES = {
  n1: { id: 'n1', value: 'A', x: 260, y: 40, next: 'n2', visible: true, highlight: false },
  n2: { id: 'n2', value: 'B', x: 420, y: 160, next: 'n3', visible: true, highlight: false },
  n3: { id: 'n3', value: 'C', x: 100, y: 160, next: 'n1', visible: true, highlight: false },
};

const CIRCULAR_STEPS: Step[] = [
  {
    title: '🔄 Lista Circular',
    description: 'En una lista circular, ¡nadie apunta a NULL! El último nodo de la lista vuelve a lanzar su cuerda hacia el PRIMERO.',
    nodes: [{ ...C_NODES.n1, next: 'n2' }, { ...C_NODES.n2, next: 'n3' }, { ...C_NODES.n3, next: null }]
  },
  {
    title: '♾️ Ciclo Infinito',
    description: 'El nodo C apunta de regreso al nodo A. Esto es perfecto para hacer un carrusel de imágenes, el turno de jugadores en un juego, o la cola de procesos de tu CPU.',
    nodes: [C_NODES.n1, C_NODES.n2, C_NODES.n3]
  }
];

// ── Components ────────────────────────────────────────────────────────────────

// Helper to draw SVG lines between nodes
const NodeThread: React.FC<{ from: NodeData, to: NodeData, bidir?: boolean, isPrev?: boolean }> = ({ from, to, bidir, isPrev }) => {
  // Offset to start/end at the edges of the 80x60 node cards
  const startX = from.x + (isPrev ? 10 : 70);
  const startY = from.y + (bidir ? (isPrev ? 20 : 40) : 30);
  const endX = to.x + (isPrev ? 70 : 10);
  const endY = to.y + (bidir ? (isPrev ? 20 : 40) : 30);

  // Bezier curve control points to make it look organic ("cuerda")
  const cx1 = startX + (endX - startX) * 0.5;
  const cy1 = startY - 20;
  const cx2 = startX + (endX - startX) * 0.5;
  const cy2 = endY + 20;

  const pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
  
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <defs>
        <marker id={`arrowhead-${isPrev ? 'prev' : 'next'}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.thread} />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={COLORS.thread}
        strokeWidth="3"
        strokeDasharray="8 4"
        markerEnd={`url(#arrowhead-${isPrev ? 'prev' : 'next'})`}
        style={{ animation: 'dash 20s linear infinite' }}
      />
    </svg>
  );
};

// Circular thread special case
const CircularThread: React.FC<{ from: NodeData, to: NodeData }> = ({ from, to }) => {
  const startX = from.x + 40;
  const startY = from.y + 60;
  const endX = to.x + 40;
  const endY = to.y;
  
  const pathD = `M ${startX} ${startY} C ${startX} ${startY + 120}, ${endX} ${endY - 120}, ${endX} ${endY}`;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <defs>
        <marker id="arrowhead-circ" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.mauve} />
        </marker>
      </defs>
      <path d={pathD} fill="none" stroke={COLORS.mauve} strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowhead-circ)" />
    </svg>
  );
};

export const LinkedListConceptView: React.FC = () => {
  const [listMode, setListMode] = useState<ListMode>('singly');
  const [viewMode, setViewMode] = useState<ViewMode>('explanation');
  const [stepIdx, setStepIdx] = useState(0);

  const getSteps = () => {
    if (listMode === 'singly') return SINGLY_STEPS;
    if (listMode === 'doubly') return DOUBLY_STEPS;
    return CIRCULAR_STEPS;
  };
  
  const steps = getSteps();
  const currentStep = steps[stepIdx];

  // Challenge State
  const [chalValidated, setChalValidated] = useState(false);
  const [chalSelected, setChalSelected] = useState<number | null>(null);

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
    backgroundColor: active ? color : 'transparent', color: active ? '#11111b' : '#6c7086',
    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px 0' }}>
      <style>
        {`
          @keyframes dash {
            to { stroke-dashoffset: -1000; }
          }
          @keyframes floatNode {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      {/* View Mode Switcher */}
      <div style={{ display: 'flex', backgroundColor: COLORS.bg, borderRadius: 10, padding: 4, border: `1px solid ${COLORS.surface}`, marginBottom: 24, gap: 4 }}>
        <button style={tabStyle(viewMode === 'explanation', COLORS.surface)} onClick={() => setViewMode('explanation')}>
          📖 Modo Explicación
        </button>
        <button style={tabStyle(viewMode === 'challenge', COLORS.yellow)} onClick={() => { setViewMode('challenge'); setChalValidated(false); setChalSelected(null); }}>
          🎮 Modo Desafío
        </button>
      </div>

      {viewMode === 'explanation' && (
        <>
          {/* Structure Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <button onClick={() => { setListMode('singly'); setStepIdx(0); }}
              style={{ padding: '8px 20px', border: `2px solid ${listMode === 'singly' ? COLORS.blue : COLORS.surface}`, borderRadius: 24, cursor: 'pointer', backgroundColor: listMode === 'singly' ? `${COLORS.blue}22` : COLORS.bg, color: listMode === 'singly' ? COLORS.blue : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
              ➡️ Lista Simple
            </button>
            <button onClick={() => { setListMode('doubly'); setStepIdx(0); }}
              style={{ padding: '8px 20px', border: `2px solid ${listMode === 'doubly' ? COLORS.green : COLORS.surface}`, borderRadius: 24, cursor: 'pointer', backgroundColor: listMode === 'doubly' ? `${COLORS.green}22` : COLORS.bg, color: listMode === 'doubly' ? COLORS.green : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
              ↔️ Lista Doble
            </button>
            <button onClick={() => { setListMode('circular'); setStepIdx(0); }}
              style={{ padding: '8px 20px', border: `2px solid ${listMode === 'circular' ? COLORS.mauve : COLORS.surface}`, borderRadius: 24, cursor: 'pointer', backgroundColor: listMode === 'circular' ? `${COLORS.mauve}22` : COLORS.bg, color: listMode === 'circular' ? COLORS.mauve : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
              🔄 Circular
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}>
            {/* Explanation Panel */}
            <div style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surface}`, borderRadius: 12, padding: '20px 28px', width: '100%', marginBottom: 32, minHeight: 110 }}>
              <h3 style={{ color: COLORS.blue, margin: '0 0 10px 0' }}>{currentStep.title}</h3>
              <p style={{ color: COLORS.subtext, margin: 0, lineHeight: 1.6 }}>{currentStep.description}</p>
            </div>

            {/* RAM Canvas */}
            <div style={{ position: 'relative', width: '100%', height: 350, backgroundColor: COLORS.bg, borderRadius: 12, marginBottom: 32, overflow: 'hidden', border: `2px dashed ${COLORS.surface}` }}>
              <div style={{ position: 'absolute', top: 10, left: 10, color: COLORS.surface, fontWeight: 'bold', letterSpacing: 4 }}>
                MEMORIA RAM (Heap)
              </div>
              
              {/* Draw connections */}
              {currentStep.nodes.map(node => {
                const targetNode = currentStep.nodes.find(n => n.id === node.next);
                const prevNode = currentStep.nodes.find(n => n.id === node.prev);
                return (
                  <React.Fragment key={`connections-${node.id}`}>
                    {targetNode && (
                      listMode === 'circular' && node.next === 'n1' ? (
                        <CircularThread from={node} to={targetNode} />
                      ) : (
                        <NodeThread from={node} to={targetNode} bidir={listMode === 'doubly'} isPrev={false} />
                      )
                    )}
                    {prevNode && (
                      <NodeThread from={node} to={prevNode} bidir={listMode === 'doubly'} isPrev={true} />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Draw Nodes */}
              {currentStep.nodes.map(node => (
                <div key={node.id} style={{
                  position: 'absolute', left: node.x, top: node.y,
                  width: 80, height: 60,
                  backgroundColor: COLORS.surface,
                  border: `2px solid ${COLORS.blue}`,
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                  animation: 'floatNode 4s ease-in-out infinite',
                  animationDelay: `${Math.random() * 2}s`,
                  zIndex: 2
                }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {node.value}
                  </div>
                  <div style={{ height: 20, backgroundColor: `${COLORS.blue}44`, borderTop: `1px solid ${COLORS.blue}`, borderRadius: '0 0 10px 10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.6rem', color: COLORS.blue, fontWeight: 'bold' }}>
                    PUNTERO(S)
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStepIdx(p => Math.max(0, p - 1))} disabled={stepIdx === 0} style={{ padding: '8px 18px', border: 'none', borderRadius: 12, backgroundColor: COLORS.surface, color: COLORS.text, fontWeight: 'bold', cursor: stepIdx === 0 ? 'not-allowed' : 'pointer', opacity: stepIdx === 0 ? 0.4 : 1 }}>
                ◀ Anterior
              </button>
              <button onClick={() => setStepIdx(p => Math.min(steps.length - 1, p + 1))} disabled={stepIdx === steps.length - 1} style={{ padding: '8px 18px', border: 'none', borderRadius: 12, backgroundColor: COLORS.green, color: '#11111b', fontWeight: 'bold', cursor: stepIdx === steps.length - 1 ? 'not-allowed' : 'pointer', opacity: stepIdx === steps.length - 1 ? 0.4 : 1 }}>
                Siguiente ▶
              </button>
            </div>
          </div>
        </>
      )}

      {viewMode === 'challenge' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}>
          <div style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surface}`, borderRadius: 12, padding: '28px 32px', width: '100%', marginBottom: 32 }}>
            <h2 style={{ color: COLORS.yellow, margin: '0 0 12px 0' }}>🎮 Desafío: El Tesoro Perdido</h2>
            <p style={{ color: COLORS.text, fontSize: '1.1rem', marginBottom: 20 }}>
              Imagina una Lista Simple con nodos: [A] → [B] → [C]. <br/><br/>
              Si accidentalmente rompemos la cuerda (puntero) que va de [A] a [B], y hacemos que [A] apunte directamente a [C]... ¿Qué pasa con el bloque [B]?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'Se borra de la memoria inmediatamente.',
                'Queda flotando en la RAM, pero se pierde para siempre ("Memory Leak").',
                'El nodo [C] lo rescata.'
              ].map((opt, i) => {
                const isCorrect = i === 1;
                const isSelected = chalSelected === i;
                
                let bg = COLORS.surface, border = COLORS.surface, color = COLORS.text;
                if (chalValidated && isSelected && isCorrect) { bg = 'rgba(166,227,161,0.2)'; border = COLORS.green; color = COLORS.green; }
                if (chalValidated && isSelected && !isCorrect) { bg = 'rgba(243,139,168,0.2)'; border = COLORS.red; color = COLORS.red; }
                if (chalValidated && !isSelected && isCorrect) { bg = 'rgba(166,227,161,0.1)'; border = COLORS.green; color = COLORS.green; }
                
                return (
                  <div key={i} onClick={() => !chalValidated && setChalSelected(i)} style={{
                    padding: '16px', borderRadius: 8, backgroundColor: bg, border: `2px solid ${border}`, color,
                    fontWeight: 'bold', cursor: chalValidated ? 'default' : 'pointer',
                    boxShadow: isSelected && !chalValidated ? `0 0 12px ${COLORS.blue}44` : 'none', transition: 'all 0.2s'
                  }}>
                    {opt}
                  </div>
                );
              })}
            </div>
            
            {chalValidated && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: chalSelected === 1 ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)', color: chalSelected === 1 ? COLORS.green : COLORS.red, textAlign: 'center', fontWeight: 'bold' }}>
                {chalSelected === 1 
                  ? '¡Exacto! Al perder el único puntero hacia él, [B] queda huérfano. En C++, esto causa una Fuga de Memoria (Memory Leak) si no llamaste a delete antes.'
                  : 'Incorrecto. En lenguajes como C++, si pierdes la cuerda hacia un bloque sin borrarlo manualmente, se crea un "Memory Leak".'}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button onClick={() => { setChalSelected(null); setChalValidated(false); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: COLORS.surface, color: COLORS.text, cursor: 'pointer', fontWeight: 'bold' }}>
                Reiniciar
              </button>
              <button onClick={() => setChalValidated(true)} disabled={chalSelected === null || chalValidated} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: chalSelected !== null && !chalValidated ? COLORS.green : COLORS.surface, color: '#11111b', cursor: chalSelected !== null && !chalValidated ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                Validar Respuesta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
