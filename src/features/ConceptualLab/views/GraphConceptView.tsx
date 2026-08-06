import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type GraphMode = 'adjacency' | 'directed';
type ViewMode = 'explanation' | 'challenge';

interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

interface Edge {
  from: string;
  to: string;
  directed: boolean;
}

interface Step {
  title: string;
  description: string;
  activeNodes: string[]; // for BFS highlighting
  activeEdges: Array<{from: string, to: string}>;
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
  edge: '#45475a',
  edgeActive: '#f5c2e7',
};

// ── Data ──────────────────────────────────────────────────────────────────────
const CITIES: Record<string, City> = {
  A: { id: 'A', name: 'Ciudad A', x: 280, y: 40, color: COLORS.blue },
  B: { id: 'B', name: 'Ciudad B', x: 100, y: 150, color: COLORS.green },
  C: { id: 'C', name: 'Ciudad C', x: 460, y: 150, color: COLORS.yellow },
  D: { id: 'D', name: 'Ciudad D', x: 180, y: 300, color: COLORS.mauve },
  E: { id: 'E', name: 'Ciudad E', x: 380, y: 300, color: COLORS.red },
};

const EDGES_UNDIRECTED: Edge[] = [
  { from: 'A', to: 'B', directed: false },
  { from: 'A', to: 'C', directed: false },
  { from: 'B', to: 'D', directed: false },
  { from: 'C', to: 'D', directed: false },
  { from: 'D', to: 'E', directed: false },
];

const EDGES_DIRECTED: Edge[] = [
  { from: 'A', to: 'B', directed: true }, // A -> B
  { from: 'A', to: 'C', directed: true }, // A -> C
  { from: 'B', to: 'A', directed: true }, // B -> A (Two way manually)
  { from: 'D', to: 'B', directed: true }, // D -> B (One way)
  { from: 'C', to: 'D', directed: true }, // C -> D
  { from: 'D', to: 'E', directed: true }, // D -> E
];

const ADJ_STEPS: Step[] = [
  { title: '🕸️ ¿Qué es un Grafo?', description: 'Un grafo es una RED. Imagina ciudades (Nodos) conectadas por carreteras (Aristas). Aquí tenemos 5 ciudades.', activeNodes: [], activeEdges: [] },
  { title: '🛣️ Conexiones Bidireccionales', description: 'En un grafo "No Dirigido", las carreteras son de doble sentido. Si puedes ir de A hacia B, puedes volver de B hacia A.', activeNodes: ['A', 'B'], activeEdges: [{from:'A', to:'B'}] },
  { title: '📝 Lista de Adyacencia', description: '¿Cómo lo recuerda la computadora? Con una lista. La ciudad A tiene como vecinos a: [B, C]. La ciudad D tiene vecinos: [B, C, E].', activeNodes: ['A', 'B', 'C'], activeEdges: [{from:'A', to:'B'}, {from:'A', to:'C'}] },
  { title: '🌐 Recorrido BFS (Nivel 1)', description: 'Algoritmo de Búsqueda a lo Ancho (BFS). Si empezamos en A, primero visitamos todos sus vecinos directos: B y C (1 salto).', activeNodes: ['A', 'B', 'C'], activeEdges: [{from:'A', to:'B'}, {from:'A', to:'C'}] },
  { title: '🌐 Recorrido BFS (Nivel 2)', description: 'Luego visitamos los vecinos de los vecinos. Desde B y C llegamos a D (2 saltos).', activeNodes: ['A', 'B', 'C', 'D'], activeEdges: [{from:'A', to:'B'}, {from:'A', to:'C'}, {from:'B', to:'D'}, {from:'C', to:'D'}] },
  { title: '🌐 Recorrido BFS (Nivel 3)', description: 'Finalmente, desde D llegamos a E (3 saltos). ¡Hemos recorrido toda la red buscando el camino más corto!', activeNodes: ['A', 'B', 'C', 'D', 'E'], activeEdges: [{from:'A', to:'B'}, {from:'A', to:'C'}, {from:'B', to:'D'}, {from:'C', to:'D'}, {from:'D', to:'E'}] },
];

const DIR_STEPS: Step[] = [
  { title: '➡️ Grafos Dirigidos', description: 'Ahora las carreteras son de un SOLO SENTIDO, como calles de una vía. Se representan con flechas.', activeNodes: [], activeEdges: [] },
  { title: '🚫 Calles de una vía', description: 'Existe un camino de D hacia B (D → B). Pero NO puedes ir directamente de B hacia D.', activeNodes: ['D', 'B'], activeEdges: [{from:'D', to:'B'}] },
  { title: '🔁 Caminos de Doble Vía', description: 'Entre A y B hay dos flechas: (A → B) y (B → A). Esto funciona efectivamente como una calle de doble sentido.', activeNodes: ['A', 'B'], activeEdges: [{from:'A', to:'B'}, {from:'B', to:'A'}] },
  { title: '📱 Aplicación Real', description: 'Los grafos dirigidos se usan en Redes Sociales (seguir a alguien no significa que te siga) y en la Web (un link de una página a otra).', activeNodes: ['A', 'B', 'C', 'D', 'E'], activeEdges: EDGES_DIRECTED }
];

// ── Components ────────────────────────────────────────────────────────────────

// Helper to draw lines/arrows
const GraphEdge: React.FC<{ from: City, to: City, directed: boolean, active: boolean, isTwoWayOverlap?: boolean }> = ({ from, to, directed, active, isTwoWayOverlap }) => {
  // Center of nodes
  const x1 = from.x + 35;
  const y1 = from.y + 35;
  const x2 = to.x + 35;
  const y2 = to.y + 35;

  // If it's a two-way edge in a directed graph, we curve them slightly so they don't overlap perfectly
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  let path = `M ${x1} ${y1} L ${x2} ${y2}`;
  if (isTwoWayOverlap) {
    // Control point for quadratic curve
    const cx = x1 + dx * 0.5 + dy * 0.15;
    const cy = y1 + dy * 0.5 - dx * 0.15;
    path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  const color = active ? COLORS.edgeActive : COLORS.edge;
  const strokeWidth = active ? 4 : 2;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <defs>
        <marker id={`arrow-${from.id}-${to.id}`} markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        markerEnd={directed ? `url(#arrow-${from.id}-${to.id})` : undefined}
        style={{ transition: 'all 0.3s ease' }}
      />
    </svg>
  );
};

export const GraphConceptView: React.FC = () => {
  const [graphMode, setGraphMode] = useState<GraphMode>('adjacency');
  const [viewMode, setViewMode] = useState<ViewMode>('explanation');
  const [stepIdx, setStepIdx] = useState(0);

  const steps = graphMode === 'adjacency' ? ADJ_STEPS : DIR_STEPS;
  const currentStep = steps[stepIdx];
  const edges = graphMode === 'adjacency' ? EDGES_UNDIRECTED : EDGES_DIRECTED;

  // Challenge State
  const [chalValidated, setChalValidated] = useState(false);
  const [chalSelected, setChalSelected] = useState<number | null>(null);

  const isEdgeActive = (from: string, to: string) => {
    return currentStep.activeEdges.some(e => (e.from === from && e.to === to) || (!graphMode.includes('directed') && e.from === to && e.to === from));
  };

  const hasTwoWay = (from: string, to: string) => {
    if (graphMode === 'adjacency') return false;
    return edges.some(e => e.from === to && e.to === from);
  };

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
    backgroundColor: active ? color : 'transparent', color: active ? '#11111b' : '#6c7086',
    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px 0' }}>
      
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
            <button onClick={() => { setGraphMode('adjacency'); setStepIdx(0); }}
              style={{ padding: '8px 20px', border: `2px solid ${graphMode === 'adjacency' ? COLORS.blue : COLORS.surface}`, borderRadius: 24, cursor: 'pointer', backgroundColor: graphMode === 'adjacency' ? `${COLORS.blue}22` : COLORS.bg, color: graphMode === 'adjacency' ? COLORS.blue : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
              ↔️ Grafo No Dirigido (Red)
            </button>
            <button onClick={() => { setGraphMode('directed'); setStepIdx(0); }}
              style={{ padding: '8px 20px', border: `2px solid ${graphMode === 'directed' ? COLORS.mauve : COLORS.surface}`, borderRadius: 24, cursor: 'pointer', backgroundColor: graphMode === 'directed' ? `${COLORS.mauve}22` : COLORS.bg, color: graphMode === 'directed' ? COLORS.mauve : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
              ➡️ Grafo Dirigido
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 800 }}>
            {/* Explanation Panel */}
            <div style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.surface}`, borderRadius: 12, padding: '20px 28px', width: '100%', marginBottom: 32, minHeight: 110 }}>
              <h3 style={{ color: graphMode === 'adjacency' ? COLORS.blue : COLORS.mauve, margin: '0 0 10px 0' }}>{currentStep.title}</h3>
              <p style={{ color: COLORS.subtext, margin: 0, lineHeight: 1.6 }}>{currentStep.description}</p>
            </div>

            <div style={{ display: 'flex', gap: 20, width: '100%' }}>
              {/* Graph Canvas */}
              <div style={{ position: 'relative', flex: 1, height: 400, backgroundColor: COLORS.bg, borderRadius: 12, overflow: 'hidden', border: `2px dashed ${COLORS.surface}` }}>
                {/* Edges */}
                {edges.map((edge, i) => (
                  <GraphEdge 
                    key={i} 
                    from={CITIES[edge.from]} 
                    to={CITIES[edge.to]} 
                    directed={edge.directed}
                    active={isEdgeActive(edge.from, edge.to)}
                    isTwoWayOverlap={hasTwoWay(edge.from, edge.to)}
                  />
                ))}

                {/* Nodes */}
                {Object.values(CITIES).map(city => {
                  const isActive = currentStep.activeNodes.includes(city.id);
                  return (
                    <div key={city.id} style={{
                      position: 'absolute', left: city.x, top: city.y,
                      width: 70, height: 70,
                      backgroundColor: isActive ? city.color : COLORS.surface,
                      border: `3px solid ${city.color}`,
                      borderRadius: '50%',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      color: isActive ? '#11111b' : city.color,
                      fontWeight: 'bold', fontSize: '1.2rem',
                      boxShadow: isActive ? `0 0 20px ${city.color}88` : '0 4px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.4s ease',
                      zIndex: 2, cursor: 'default'
                    }}>
                      {city.id}
                    </div>
                  );
                })}
              </div>

              {/* Adjacency List Panel (Only in adjacency mode to show how code sees it) */}
              {graphMode === 'adjacency' && (
                <div style={{ width: 220, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16 }}>
                  <h4 style={{ color: COLORS.text, marginTop: 0, marginBottom: 16 }}>Lista de Adyacencia</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.values(CITIES).map(city => {
                      const isActive = currentStep.activeNodes.includes(city.id);
                      const neighbors = edges.filter(e => e.from === city.id || e.to === city.id)
                                             .map(e => e.from === city.id ? e.to : e.from);
                      return (
                        <div key={city.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                          <span style={{ color: city.color, fontWeight: 'bold' }}>{city.id}:</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {neighbors.map(n => (
                              <span key={n} style={{ padding: '2px 6px', backgroundColor: '#181825', borderRadius: 4, color: COLORS.subtext, fontSize: '0.8rem' }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
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
            <h2 style={{ color: COLORS.yellow, margin: '0 0 12px 0' }}>🎮 Desafío BFS: Navegador de Rutas</h2>
            
            {/* Mini static graph */}
            <div style={{ position: 'relative', height: 250, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 20 }}>
              <GraphEdge from={CITIES.A} to={CITIES.B} directed={false} active={false} />
              <GraphEdge from={CITIES.A} to={CITIES.C} directed={false} active={false} />
              <GraphEdge from={CITIES.B} to={CITIES.D} directed={false} active={false} />
              <GraphEdge from={CITIES.C} to={CITIES.D} directed={false} active={false} />
              <GraphEdge from={CITIES.D} to={CITIES.E} directed={false} active={false} />
              {Object.values(CITIES).map(city => (
                <div key={city.id} style={{ position: 'absolute', left: city.x, top: city.y, width: 70, height: 70, backgroundColor: COLORS.bg, border: `3px solid ${city.color}`, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: city.color, fontWeight: 'bold' }}>{city.id}</div>
              ))}
            </div>

            <p style={{ color: COLORS.text, fontSize: '1.1rem', marginBottom: 20 }}>
              En el grafo de arriba, si estás en la <strong>Ciudad A</strong> y quieres llegar a la <strong>Ciudad E</strong>, ¿cuál es la cantidad <strong>mínima</strong> de carreteras (saltos) que debes cruzar?
            </p>
            
            <div style={{ display: 'flex', gap: 16 }}>
              {['1 Salto', '2 Saltos', '3 Saltos', '4 Saltos'].map((opt, i) => {
                const isCorrect = i === 2; // 3 saltos
                const isSelected = chalSelected === i;
                
                let bg = COLORS.surface, border = COLORS.surface, color = COLORS.text;
                if (chalValidated && isSelected && isCorrect) { bg = 'rgba(166,227,161,0.2)'; border = COLORS.green; color = COLORS.green; }
                if (chalValidated && isSelected && !isCorrect) { bg = 'rgba(243,139,168,0.2)'; border = COLORS.red; color = COLORS.red; }
                if (chalValidated && !isSelected && isCorrect) { bg = 'rgba(166,227,161,0.1)'; border = COLORS.green; color = COLORS.green; }
                
                return (
                  <div key={i} onClick={() => !chalValidated && setChalSelected(i)} style={{
                    flex: 1, padding: '16px', borderRadius: 8, backgroundColor: bg, border: `2px solid ${border}`, color,
                    textAlign: 'center', fontWeight: 'bold', cursor: chalValidated ? 'default' : 'pointer',
                    boxShadow: isSelected && !chalValidated ? `0 0 12px ${COLORS.blue}44` : 'none', transition: 'all 0.2s'
                  }}>
                    {opt}
                  </div>
                );
              })}
            </div>
            
            {chalValidated && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: chalSelected === 2 ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)', color: chalSelected === 2 ? COLORS.green : COLORS.red, textAlign: 'center', fontWeight: 'bold' }}>
                {chalSelected === 2 
                  ? '¡Correcto! El camino más corto es A → C → D → E (o A → B → D → E). Ambos toman 3 saltos.'
                  : 'Incorrecto. Traza la ruta con el dedo. El camino más rápido es A → B → D → E, lo que equivale a 3 saltos.'}
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
