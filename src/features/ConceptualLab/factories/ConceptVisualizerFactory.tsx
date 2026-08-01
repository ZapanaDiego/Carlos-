import React from 'react';
import { ArrayConceptView } from '../views/ArrayConceptView';
import { TOPICS_CATALOG, CATEGORY_LABELS } from '../data/topicsCatalog';

interface FactoryProps {
  activeTopicId: string;
}

export const ConceptVisualizerFactory: React.FC<FactoryProps> = ({ activeTopicId }) => {
  // Route to the appropriate interactive component based on activeTopicId
  switch (activeTopicId) {
    case 'vectors':
    case 'array-insertion':
      return <ArrayConceptView />;
      
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
