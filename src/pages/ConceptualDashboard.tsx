import React from 'react';
import { SidebarMenu } from '../features/ConceptualLab/components/SidebarMenu';
import { useConceptualStore } from '../store/conceptualStore';
import { ConceptVisualizerFactory } from '../features/ConceptualLab/factories/ConceptVisualizerFactory';

export const ConceptualDashboard: React.FC = () => {
  const { activeTopicId } = useConceptualStore();
  
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <SidebarMenu />

      {/* Main View Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        padding: '20px'
      }}>
        <ConceptVisualizerFactory activeTopicId={activeTopicId} />
      </div>
    </div>
  );
};
