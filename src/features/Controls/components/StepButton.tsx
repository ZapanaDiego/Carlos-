import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { loggerService } from '../../../services/LoggerService';

export const StepButton: React.FC = () => {
  const incrementStep = useSimulationStore((state) => state.incrementStep);
  
  const handleClick = () => {
    const currentState = useSimulationStore.getState();
    incrementStep(1);
    
    loggerService.sendLog('INFO', 'Step ejecutado (mock)', 'frontend.controls', {
      current_step: currentState.currentStep + 1,
      speed: currentState.speed
    });
  };

  return (
    <button 
      onClick={handleClick}
      style={{
        backgroundColor: '#a6e3a1', // green
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
      ▶ Step
    </button>
  );
};
