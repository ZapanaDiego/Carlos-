import React from 'react';
import { ArrayConceptView } from '../views/ArrayConceptView';
import { StackQueueConceptView } from '../views/StackQueueConceptView';
import { LinkedListConceptView } from '../views/LinkedListConceptView';
import { TreeConceptView } from '../views/TreeConceptView';
import { GraphConceptView } from '../views/GraphConceptView';
import { HashTableConceptView } from '../views/HashTableConceptView';
import { TOPICS_CATALOG, CATEGORY_LABELS } from '../data/topicsCatalog';

interface FactoryProps {
  activeTopicId: string;
}

export const ConceptVisualizerFactory: React.FC<FactoryProps> = ({ activeTopicId }) => {
  // Route to the appropriate interactive component based on activeTopicId
  switch (activeTopicId) {
    case 'vectors-allocation':
    case 'array-search':
    case 'array-insertion-shifting':
    case 'vector-resizing':
      return <ArrayConceptView topicId={activeTopicId} />;
      
    case 'stack-lifo':
    case 'queue-fifo':
    case 'circular-queue':
      return <StackQueueConceptView topicId={activeTopicId} />;
      
    case 'linked-lists':
    case 'doubly-linked-lists':
    case 'circular-lists':
      return <LinkedListConceptView />;
      
    case 'trees':
    case 'avl-trees':
    case 'red-black-trees':
      return <TreeConceptView />;
      
    case 'graphs':
    case 'directed-graphs':
      return <GraphConceptView />;
      
    case 'hash-tables':
    case 'collisions':
      return <HashTableConceptView />;
      
    default:
      // Fallback for topics under construction
      return <PlaceholderConceptView topicId={activeTopicId} />;
  }
};

const PlaceholderConceptView: React.FC<{ topicId: string }> = ({ topicId }) => {
  const activeTopic = TOPICS_CATALOG.find(t => t.id === topicId);

  if (!activeTopic) {
    return (
      <div style={{ color: '#f38ba8' }}>
        Error: Módulo "{topicId}" no encontrado en el catálogo.
      </div>
    );
  }

  return (
    <div style={{
      width: '90%',
      height: '90%',
      border: '2px dashed #45475a',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '40px',
      backgroundColor: 'rgba(24, 24, 37, 0.5)'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
      
      <span style={{ 
        backgroundColor: '#313244', 
        color: '#89b4fa', 
        padding: '4px 12px', 
        borderRadius: '16px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        marginBottom: '1rem' 
      }}>
        {CATEGORY_LABELS[activeTopic.category]}
      </span>
      
      <h1 style={{ color: '#cdd6f4', margin: '0 0 15px 0', fontSize: '2.5rem' }}>
        {activeTopic.label}
      </h1>
      
      <p style={{ color: '#a6adc8', fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.5 }}>
        {activeTopic.description}
      </p>
      
      <div style={{ marginTop: '40px', color: '#f9e2af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>⚙️</span> Este módulo interactivo se encuentra actualmente en construcción.
      </div>
    </div>
  );
};
