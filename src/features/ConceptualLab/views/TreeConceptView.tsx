import React, { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type TreeMode = 'bst' | 'avl' | 'red-black';

interface TreeNode {
  id: string;
  value: number;
  x: number;
  y: number;
  parent?: string;
  left?: string;
  right?: string;
  color?: 'red' | 'black';
  balanceFactor?: number;
  visible: boolean;
  highlight: boolean;
}

interface Step {
  title: string;
  description: string;
  visibleNodes: string[];
  highlightedNodes: string[];
}

// ── BST Node Positions ─────────────────────────────────────────────────────────
const BST_NODES: Record<string, TreeNode> = {
  n50: { id: 'n50', value: 50, x: 300, y: 40, left: 'n30', right: 'n70', visible: true, highlight: false },
  n30: { id: 'n30', value: 30, x: 160, y: 130, parent: 'n50', left: 'n20', right: 'n40', visible: false, highlight: false },
  n70: { id: 'n70', value: 70, x: 440, y: 130, parent: 'n50', left: 'n60', right: 'n80', visible: false, highlight: false },
  n20: { id: 'n20', value: 20, x: 80, y: 220, parent: 'n30', visible: false, highlight: false },
  n40: { id: 'n40', value: 40, x: 240, y: 220, parent: 'n30', visible: false, highlight: false },
  n60: { id: 'n60', value: 60, x: 360, y: 220, parent: 'n70', visible: false, highlight: false },
  n80: { id: 'n80', value: 80, x: 520, y: 220, parent: 'n70', visible: false, highlight: false },
};

const BST_STEPS: Step[] = [
  {
    title: '🌱 Árbol Vacío — Insertamos la Raíz',
    description: 'Árbol vacío. Insertamos 50 — se convierte en la RAÍZ del árbol. Ocupa el lugar más alto de la jerarquía.',
    visibleNodes: ['n50'],
    highlightedNodes: ['n50']
  },
  {
    title: '⬅️ Insertar 30 — ¿Menor que 50?',
    description: 'Insertamos 30. ¿30 < 50? SÍ → Va a la IZQUIERDA de 50. Los menores siempre van a la izquierda.',
    visibleNodes: ['n50', 'n30'],
    highlightedNodes: ['n30']
  },
  {
    title: '➡️ Insertar 70 — ¿Mayor que 50?',
    description: 'Insertamos 70. ¿70 < 50? NO → Va a la DERECHA de 50. Los mayores siempre van a la derecha.',
    visibleNodes: ['n50', 'n30', 'n70'],
    highlightedNodes: ['n70']
  },
  {
    title: '🔍 Insertar 20 — Dos Comparaciones',
    description: 'Insertamos 20. ¿20 < 50? → izquierda. ¿20 < 30? → izquierda de 30. Cada nivel es una comparación.',
    visibleNodes: ['n50', 'n30', 'n70', 'n20'],
    highlightedNodes: ['n20']
  },
  {
    title: '🌲 Árbol Completo — Búsqueda en O(log N)',
    description: 'El árbol crece ordenado. Buscar cualquier valor tarda máximo log₂(N) pasos. En un millón de datos, solo 20 comparaciones.',
    visibleNodes: ['n50', 'n30', 'n70', 'n20', 'n40', 'n60', 'n80'],
    highlightedNodes: []
  }
];

// ── AVL Positions (unbalanced → balanced) ────────────────────────────────────
const AVL_UNBALANCED: Record<string, TreeNode & { balanceFactor: number }> = {
  a50: { id: 'a50', value: 50, x: 300, y: 40, left: 'a30', balanceFactor: -2, visible: true, highlight: false },
  a30: { id: 'a30', value: 30, x: 160, y: 130, parent: 'a50', left: 'a20', balanceFactor: -1, visible: true, highlight: false },
  a20: { id: 'a20', value: 20, x: 80, y: 220, parent: 'a30', balanceFactor: 0, visible: true, highlight: false },
};

const AVL_BALANCED: Record<string, TreeNode & { balanceFactor: number }> = {
  a30: { id: 'a30', value: 30, x: 300, y: 40, left: 'a20', right: 'a50', balanceFactor: 0, visible: true, highlight: true },
  a20: { id: 'a20', value: 20, x: 160, y: 130, parent: 'a30', balanceFactor: 0, visible: true, highlight: false },
  a50: { id: 'a50', value: 50, x: 440, y: 130, parent: 'a30', balanceFactor: 0, visible: true, highlight: false },
};

const AVL_STEPS = [
  { title: '⚖️ Factor de Balance', description: 'Árbol AVL: cada nodo tiene un FACTOR DE BALANCE = altura_derecha − altura_izquierda. Debe mantenerse entre -1, 0 y +1.', phase: 'intro' },
  { title: '😟 Desbalanceo Detectado (factor: -2)', description: 'Insertamos 50, 30, 20. El árbol se inclinó demasiado a la izquierda. El nodo 50 tiene factor -2. ¡Hay que corregirlo!', phase: 'unbalanced' },
  { title: '🔄 Rotación Derecha — ¡El Árbol se Acomoda!', description: 'ROTACIÓN DERECHA: el nodo raíz 50 BAJA, el nodo 30 SUBE al tope. El árbol queda nivelado. Factor de balance = 0 en todos.', phase: 'balanced' },
];

// ── Red-Black Positions ────────────────────────────────────────────────────────
const RB_STEPS = [
  { title: '⚫ Regla 1: La Raíz es Siempre Negra', description: 'En el Árbol Rojo-Negro, cada nodo tiene un color. La RAÍZ siempre es NEGRA. Esto ayuda a mantener el árbol balanceado.', showNodes: 1 },
  { title: '🔴 Regla 2: Rojo no puede tener hijo Rojo', description: 'Los nodos ROJOS no pueden tener hijos ROJOS. Si al insertar violamos la regla, cambiamos colores automáticamente.', showNodes: 3 },
  { title: '🎨 Cambio de Color — ¡Se Auto-Regula!', description: 'Al insertar el nodo 20 (rojo), detectamos una violación. Los colores cambian: 30 pasa a negro, 20 y 70 a rojos. El árbol vuelve a ser válido.', showNodes: 5 },
  { title: '🏆 Garantía del Árbol Rojo-Negro', description: 'Esta técnica garantiza que NINGUNA rama tenga más del doble de largo que otra. La búsqueda siempre es O(log N) en el peor caso.', showNodes: 7 },
];

// ── Challenge ─────────────────────────────────────────────────────────────────
const BST_CHALLENGE = {
  question: 'En el árbol mostrado (raíz: 50, izquierda: 30, derecha: 70), ¿dónde iría el número 45?',
  options: ['Hijo izquierdo de 30', 'Hijo derecho de 30 ✓', 'Hijo izquierdo de 70', 'Nueva raíz'],
  correctIndex: 1
};

// ── Node Circle Component ─────────────────────────────────────────────────────
const NodeCircle: React.FC<{
  node: TreeNode;
  colorOverride?: string;
  bgOverride?: string;
  badgeText?: string;
}> = ({ node, colorOverride, bgOverride, badgeText }) => {
  const bg = bgOverride || (node.highlight ? '#89b4fa' : '#313244');
  const fg = colorOverride || (node.highlight ? '#11111b' : '#cdd6f4');
  return (
    <div style={{
      position: 'absolute',
      left: node.x - 28,
      top: node.y - 28,
      width: 56,
      height: 56,
      borderRadius: '50%',
      backgroundColor: bg,
      border: `3px solid ${node.highlight ? '#b4befe' : '#45475a'}`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: fg,
      fontWeight: 'bold',
      fontSize: '1.2rem',
      boxShadow: node.highlight ? '0 0 18px rgba(137,180,250,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
      transition: 'all 0.5s ease',
      zIndex: 2
    }}>
      {node.value}
      {badgeText && (
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f9e2af',
          color: '#11111b',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>{badgeText}</div>
      )}
    </div>
  );
};

// ── Edge between two nodes ─────────────────────────────────────────────────────
const Edge: React.FC<{ from: TreeNode; to: TreeNode; color?: string }> = ({ from, to, color = '#45475a' }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div style={{
      position: 'absolute',
      left: from.x,
      top: from.y,
      width: len,
      height: 3,
      backgroundColor: color,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      transition: 'all 0.5s ease',
      zIndex: 1,
      opacity: 0.7
    }} />
  );
};

// ── BST View ──────────────────────────────────────────────────────────────────
const BSTView: React.FC = () => {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep(p => {
        if (p >= BST_STEPS.length - 1) { setPlaying(false); return p; }
        return p + 1;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [playing]);

  const currentStep = BST_STEPS[step];
  const nodes = Object.values(BST_NODES).filter(n => currentStep.visibleNodes.includes(n.id));
  const edges: Array<{ from: TreeNode; to: TreeNode }> = [];
  nodes.forEach(n => {
    if (n.left && BST_NODES[n.left] && currentStep.visibleNodes.includes(n.left))
      edges.push({ from: n, to: BST_NODES[n.left] });
    if (n.right && BST_NODES[n.right] && currentStep.visibleNodes.includes(n.right))
      edges.push({ from: n, to: BST_NODES[n.right] });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
        padding: '20px 28px', maxWidth: 680, width: '100%', marginBottom: 32, minHeight: 110
      }}>
        <h3 style={{ color: '#89b4fa', margin: '0 0 10px 0' }}>{currentStep.title}</h3>
        <p style={{ color: '#bac2de', margin: 0, lineHeight: 1.6 }}>{currentStep.description}</p>
      </div>

      <div style={{ position: 'relative', width: 620, height: 300, backgroundColor: '#181825', borderRadius: 12, marginBottom: 32 }}>
        {edges.map((e, i) => (
          <Edge key={i} from={e.from} to={e.to} />
        ))}
        {nodes.map(n => (
          <NodeCircle key={n.id} node={{ ...n, highlight: currentStep.highlightedNodes.includes(n.id) }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: '⏮', action: () => { setPlaying(false); setStep(0); } },
          { label: '◀', action: () => { setPlaying(false); setStep(p => Math.max(0, p - 1)); }, disabled: step === 0 },
          { label: playing ? '⏸' : '▶ Auto', action: () => setPlaying(p => !p), highlight: true },
          { label: '▶', action: () => { setPlaying(false); setStep(p => Math.min(BST_STEPS.length - 1, p + 1)); }, disabled: step === BST_STEPS.length - 1 },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} disabled={btn.disabled}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: 12, cursor: btn.disabled ? 'not-allowed' : 'pointer',
              backgroundColor: btn.highlight ? (playing ? '#f38ba8' : '#a6e3a1') : '#313244',
              color: btn.highlight ? '#11111b' : '#cdd6f4',
              fontWeight: 'bold', opacity: btn.disabled ? 0.4 : 1, fontSize: '1rem'
            }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── AVL View ──────────────────────────────────────────────────────────────────
const AVLView: React.FC = () => {
  const [avlStep, setAvlStep] = useState(0);

  const phase = AVL_STEPS[avlStep].phase;
  const nodes = phase === 'balanced' ? AVL_BALANCED : (phase === 'unbalanced' ? AVL_UNBALANCED : {});
  const nodeList = Object.values(nodes) as Array<TreeNode & { balanceFactor: number }>;

  const edges: Array<{ from: TreeNode; to: TreeNode }> = [];
  nodeList.forEach(n => {
    if (n.left && nodes[n.left]) edges.push({ from: n, to: nodes[n.left] as TreeNode });
    if (n.right && nodes[n.right]) edges.push({ from: n, to: nodes[n.right] as TreeNode });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
        padding: '20px 28px', maxWidth: 680, width: '100%', marginBottom: 32, minHeight: 110
      }}>
        <h3 style={{ color: phase === 'unbalanced' ? '#f38ba8' : '#a6e3a1', margin: '0 0 10px 0' }}>
          {AVL_STEPS[avlStep].title}
        </h3>
        <p style={{ color: '#bac2de', margin: 0, lineHeight: 1.6 }}>{AVL_STEPS[avlStep].description}</p>
      </div>

      <div style={{ position: 'relative', width: 620, height: 300, backgroundColor: '#181825', borderRadius: 12, marginBottom: 32 }}>
        {phase === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#6c7086' }}>
              <div style={{ fontSize: '4rem' }}>⚖️</div>
              <div style={{ color: '#cba6f7', fontSize: '1.2rem', marginTop: 16 }}>El árbol AVL se pesa a sí mismo en cada inserción</div>
            </div>
          </div>
        )}
        {edges.map((e, i) => (
          <Edge key={i} from={e.from} to={e.to} color={phase === 'unbalanced' ? '#f38ba8' : '#a6e3a1'} />
        ))}
        {nodeList.map(n => (
          <NodeCircle key={n.id}
            node={{ ...n, highlight: n.id === 'a30' && phase === 'balanced' }}
            bgOverride={phase === 'unbalanced' && n.id === 'a50' ? 'rgba(243,139,168,0.3)' : undefined}
            badgeText={phase !== 'intro' ? `BF: ${n.balanceFactor > 0 ? '+' : ''}${n.balanceFactor}` : undefined}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: '⏮', action: () => setAvlStep(0) },
          { label: '◀ Anterior', action: () => setAvlStep(p => Math.max(0, p - 1)), disabled: avlStep === 0 },
          { label: 'Siguiente ▶', action: () => setAvlStep(p => Math.min(AVL_STEPS.length - 1, p + 1)), disabled: avlStep === AVL_STEPS.length - 1 },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} disabled={btn.disabled}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: 12, cursor: btn.disabled ? 'not-allowed' : 'pointer',
              backgroundColor: '#313244', color: '#cdd6f4', fontWeight: 'bold', opacity: btn.disabled ? 0.4 : 1
            }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Red-Black View ─────────────────────────────────────────────────────────────
const RB_NODE_DATA = [
  { id: 'rb1', value: 30, x: 300, y: 40, color: 'black' as const },
  { id: 'rb2', value: 20, x: 180, y: 130, color: 'red' as const },
  { id: 'rb3', value: 50, x: 420, y: 130, color: 'red' as const },
  { id: 'rb4', value: 10, x: 100, y: 220, color: 'black' as const },
  { id: 'rb5', value: 25, x: 260, y: 220, color: 'black' as const },
  { id: 'rb6', value: 40, x: 360, y: 220, color: 'black' as const },
  { id: 'rb7', value: 70, x: 500, y: 220, color: 'red' as const },
];

const RB_EDGES = [
  { from: 'rb1', to: 'rb2' }, { from: 'rb1', to: 'rb3' },
  { from: 'rb2', to: 'rb4' }, { from: 'rb2', to: 'rb5' },
  { from: 'rb3', to: 'rb6' }, { from: 'rb3', to: 'rb7' },
];

const RedBlackView: React.FC = () => {
  const [rbStep, setRbStep] = useState(0);
  const visible = RB_NODE_DATA.slice(0, RB_STEPS[rbStep].showNodes);
  const nodeMap = Object.fromEntries(RB_NODE_DATA.map(n => [n.id, n]));
  const visibleIds = new Set(visible.map(n => n.id));
  const edges = RB_EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
        padding: '20px 28px', maxWidth: 680, width: '100%', marginBottom: 32, minHeight: 110
      }}>
        <h3 style={{ color: '#cba6f7', margin: '0 0 10px 0' }}>{RB_STEPS[rbStep].title}</h3>
        <p style={{ color: '#bac2de', margin: 0, lineHeight: 1.6 }}>{RB_STEPS[rbStep].description}</p>
      </div>

      <div style={{ position: 'relative', width: 620, height: 300, backgroundColor: '#181825', borderRadius: 12, marginBottom: 32 }}>
        {edges.map((e, i) => (
          <Edge key={i} from={nodeMap[e.from] as TreeNode} to={nodeMap[e.to] as TreeNode} color='#45475a' />
        ))}
        {visible.map(n => (
          <NodeCircle key={n.id}
            node={{ ...n, visible: true, highlight: false }}
            bgOverride={n.color === 'red' ? '#f38ba8' : '#1e1e2e'}
            colorOverride={n.color === 'red' ? '#11111b' : '#cdd6f4'}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: '⏮', action: () => setRbStep(0) },
          { label: '◀ Anterior', action: () => setRbStep(p => Math.max(0, p - 1)), disabled: rbStep === 0 },
          { label: 'Siguiente ▶', action: () => setRbStep(p => Math.min(RB_STEPS.length - 1, p + 1)), disabled: rbStep === RB_STEPS.length - 1 },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} disabled={btn.disabled}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: 12, cursor: btn.disabled ? 'not-allowed' : 'pointer',
              backgroundColor: '#313244', color: '#cdd6f4', fontWeight: 'bold', opacity: btn.disabled ? 0.4 : 1
            }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Challenge View ─────────────────────────────────────────────────────────────
const ChallengeView: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}>
      <div style={{
        backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 12,
        padding: '28px 32px', width: '100%', marginBottom: 32
      }}>
        <h2 style={{ color: '#f9e2af', margin: '0 0 12px 0' }}>🎮 Desafío BST</h2>
        <p style={{ color: '#bac2de', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>{BST_CHALLENGE.question}</p>
      </div>

      {/* Mini tree for reference */}
      <div style={{ position: 'relative', width: 400, height: 200, backgroundColor: '#181825', borderRadius: 12, marginBottom: 32 }}>
        {[{ from: { x: 200, y: 40 }, to: { x: 100, y: 120 } }, { from: { x: 200, y: 40 }, to: { x: 300, y: 120 } }].map((e, i) => (
          <Edge key={i} from={{ ...e.from } as TreeNode} to={{ ...e.to } as TreeNode} />
        ))}
        {[
          { id: 'r', value: 50, x: 200, y: 40, visible: true, highlight: false },
          { id: 'l', value: 30, x: 100, y: 120, visible: true, highlight: false },
          { id: 'rr', value: 70, x: 300, y: 120, visible: true, highlight: false }
        ].map(n => <NodeCircle key={n.id} node={n} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 500, marginBottom: 32 }}>
        {BST_CHALLENGE.options.map((opt, i) => {
          const isCorrect = i === BST_CHALLENGE.correctIndex;
          const isSelected = selected === i;
          let bg = '#313244', border = '#45475a', color = '#cdd6f4';
          if (validated && isSelected && isCorrect) { bg = 'rgba(166,227,161,0.2)'; border = '#a6e3a1'; color = '#a6e3a1'; }
          if (validated && isSelected && !isCorrect) { bg = 'rgba(243,139,168,0.2)'; border = '#f38ba8'; color = '#f38ba8'; }
          if (validated && !isSelected && isCorrect) { bg = 'rgba(166,227,161,0.1)'; border = '#a6e3a1'; color = '#a6e3a1'; }

          return (
            <div key={i} onClick={() => { if (!validated) setSelected(i); }}
              style={{
                padding: '16px', backgroundColor: bg, border: `2px solid ${border}`,
                borderRadius: 10, cursor: validated ? 'default' : 'pointer', color,
                fontWeight: 'bold', textAlign: 'center', transition: 'all 0.25s',
                boxShadow: isSelected && !validated ? '0 0 14px rgba(137,180,250,0.4)' : 'none'
              }}>
              {opt}
            </div>
          );
        })}
      </div>

      {validated && (
        <div style={{
          width: '100%', padding: '16px', borderRadius: 10, marginBottom: 24, textAlign: 'center',
          backgroundColor: selected === BST_CHALLENGE.correctIndex ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)',
          border: `1px solid ${selected === BST_CHALLENGE.correctIndex ? '#a6e3a1' : '#f38ba8'}`,
          color: selected === BST_CHALLENGE.correctIndex ? '#a6e3a1' : '#f38ba8',
          fontWeight: 'bold', fontSize: '1.05rem'
        }}>
          {selected === BST_CHALLENGE.correctIndex
            ? '¡Perfecto! 45 > 30, así que va a la derecha de 30. ¡Dominas el BST!'
            : '¡Casi! 45 > 30, por lo que va al lado derecho del nodo 30. ¡Inténtalo de nuevo!'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={() => { setSelected(null); setValidated(false); }}
          style={{ padding: '12px 28px', border: 'none', borderRadius: 10, backgroundColor: '#45475a', color: '#cdd6f4', fontWeight: 'bold', cursor: 'pointer' }}>
          Reiniciar
        </button>
        <button onClick={() => setValidated(true)} disabled={selected === null}
          style={{ padding: '12px 28px', border: 'none', borderRadius: 10, backgroundColor: selected !== null ? '#89b4fa' : '#313244', color: '#11111b', fontWeight: 'bold', cursor: selected !== null ? 'pointer' : 'not-allowed', opacity: selected === null ? 0.5 : 1 }}>
          Validar Respuesta
        </button>
      </div>
    </div>
  );
};

// ── Main Export ──────────────────────────────────────────────────────────────
export const TreeConceptView: React.FC = () => {
  const [treeMode, setTreeMode] = useState<TreeMode>('bst');
  const [viewMode, setViewMode] = useState<'explanation' | 'challenge'>('explanation');

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
    backgroundColor: active ? color : 'transparent',
    color: active ? '#11111b' : '#6c7086',
    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px 0' }}>

      {/* View Mode Switcher */}
      <div style={{ display: 'flex', backgroundColor: '#181825', borderRadius: 10, padding: 4, border: '1px solid #313244', marginBottom: 24, gap: 4 }}>
        <button style={tabStyle(viewMode === 'explanation', '#313244')} onClick={() => setViewMode('explanation')}>
          📖 Modo Explicación
        </button>
        <button style={tabStyle(viewMode === 'challenge', '#f9e2af')} onClick={() => setViewMode('challenge')}>
          🎮 Modo Desafío
        </button>
      </div>

      {viewMode === 'explanation' && (
        <>
          {/* Tree Mode Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {([['bst', '🌲 BST', '#89b4fa'], ['avl', '⚖️ AVL', '#a6e3a1'], ['red-black', '🔴⚫ Rojo-Negro', '#cba6f7']] as [TreeMode, string, string][]).map(([id, label, color]) => (
              <button key={id} onClick={() => setTreeMode(id)}
                style={{ padding: '8px 20px', border: `2px solid ${treeMode === id ? color : '#313244'}`, borderRadius: 24, cursor: 'pointer', backgroundColor: treeMode === id ? `${color}22` : '#181825', color: treeMode === id ? color : '#6c7086', fontWeight: 'bold', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>

          {treeMode === 'bst' && <BSTView />}
          {treeMode === 'avl' && <AVLView />}
          {treeMode === 'red-black' && <RedBlackView />}
        </>
      )}

      {viewMode === 'challenge' && <ChallengeView />}
    </div>
  );
};
