import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { loggerService } from '../../../services/LoggerService';

export const MacroSkipButton: React.FC = () => {
  const incrementStep = useSimulationStore((state) => state.incrementStep);
  
  const handleClick = () => {
    const currentState = useSimulationStore.getState();
    incrementStep(10);
    
    loggerService.sendLog('INFO', 'MacroSkip ejecutado (mock)', 'frontend.controls', {
      current_step: currentState.currentStep + 10,
      speed: currentState.speed
    });
  };

  return (
    <button 
      onClick={handleClick}
      title="Saltar iteración de bucle (próximamente)"
      style={{
        backgroundColor: '#89b4fa', // blue
        color: '#11111b',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 15px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
    >
      ⏭ Skip
    </button>
  );
};
