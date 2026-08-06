import { TopicCategory, TopicItem } from '../../../store/conceptualStore';

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  'arrays': '📊 Arrays y Bloques',
  'stacks-queues': '📚 Pilas y Colas',
  'linked-lists': '🔗 Listas Enlazadas',
  'trees': '🌲 Árboles',
  'graphs': '🕸️ Grafos',
  'hash-tables': '🔑 Tablas Hash',
};

export const TOPICS_CATALOG: TopicItem[] = [
  // Arrays
  { id: 'vectors-allocation', label: 'Memoria Contigua y Asignación', category: 'arrays', description: 'Descubre cómo el sistema busca un bloque ininterrumpido en la RAM para tu Vector.' },
  { id: 'array-search', label: 'Acceso Directo O(1) vs Búsqueda O(N)', category: 'arrays', description: 'Entiende por qué saltar a un índice es instantáneo, pero buscar un valor toma tiempo.' },
  { id: 'array-insertion-shifting', label: 'Inserción y Desplazamiento', category: 'arrays', description: 'Observa cómo los elementos se desplazan físicamente para hacer espacio.' },
  { id: 'vector-resizing', label: 'Redimensionamiento (Size vs Capacity)', category: 'arrays', description: 'Comprende la diferencia entre tamaño y capacidad, y la costosa operación de resize.' },
  
  // Stacks & Queues
  { id: 'stack-lifo', label: 'Pila (Stack - LIFO)', category: 'stacks-queues', description: 'Último en entrar, Primero en salir. Entiende la mecánica de un tubo vertical.' },
  { id: 'queue-fifo', label: 'Cola (Queue - FIFO)', category: 'stacks-queues', description: 'Primero en entrar, Primero en salir. La clásica fila de espera.' },
  { id: 'circular-queue', label: 'Cola Circular (Optimización)', category: 'stacks-queues', description: 'Reutilización de espacio en $O(1)$ sin costosos desplazamientos.' },
  
  // Linked Lists
  { id: 'singly-linked', label: 'Lista Simplemente Enlazada', category: 'linked-lists', description: 'Nodos dispersos en el Heap conectados mediante punteros unidireccionales.' },
  { id: 'doubly-linked', label: 'Lista Doblemente Enlazada', category: 'linked-lists', description: 'Nodos con navegación bidireccional mediante punteros previous y next.' },
  { id: 'circular-linked', label: 'Lista Circular', category: 'linked-lists', description: 'El último nodo apunta de vuelta al inicio, formando un ciclo.' },
  
  // Trees
  { id: 'binary-tree', label: 'Árbol Binario de Búsqueda (BST)', category: 'trees', description: 'Nodos jerárquicos ordenados. Búsqueda rápida O(log N) en el mejor caso.' },
  { id: 'avl-tree', label: 'Árbol AVL (Balanceo y Rotaciones)', category: 'trees', description: 'Árboles autorbalanceables para evitar la degeneración a listas lineales.' },
  { id: 'red-black-tree', label: 'Árbol Rojo-Negro', category: 'trees', description: 'Balanceo asintótico con reglas de colores para operaciones de inserción óptimas.' },
  
  // Graphs
  { id: 'graph-adjacency', label: 'Lista vs. Matriz de Adyacencia', category: 'graphs', description: 'Comparación visual de las dos representaciones principales de redes.' },
  { id: 'directed-graph', label: 'Grafos Dirigidos y No Dirigidos', category: 'graphs', description: 'Nodos interconectados con y sin restricciones de dirección.' },
  
  // Hash Tables
  { id: 'hash-collisions', label: 'Manejo de Colisiones (Buckets)', category: 'hash-tables', description: 'Cómo funciona la función Hash y resolución de colisiones mediante encadenamiento.' },
];
