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
  { id: 'vectors', label: 'Vectores (Memoria Contigua)', category: 'arrays', description: 'Explora cómo los vectores gestionan un bloque contiguo de memoria y cómo se redimensionan.' },
  { id: 'array-insertion', label: 'Inserción y Reindexación', category: 'arrays', description: 'Visualiza el costo O(N) de insertar o eliminar elementos en el medio de un bloque.' },
  
  // Stacks & Queues
  { id: 'stack', label: 'Pilas (LIFO - Last In First Out)', category: 'stacks-queues', description: 'Aprende el funcionamiento LIFO. Útil para entender la pila de llamadas (Call Stack).' },
  { id: 'queue', label: 'Colas (FIFO - First In First Out)', category: 'stacks-queues', description: 'Descubre el procesamiento FIFO, esencial para buffers y algoritmos de búsqueda.' },
  
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
