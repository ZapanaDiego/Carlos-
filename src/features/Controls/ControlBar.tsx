import React from 'react';
import { StepButton } from './components/StepButton';
import { MacroSkipButton } from './components/MacroSkipButton';
import { SpeedSlider } from './components/SpeedSlider';
import { useSimulationStore } from '../../store/simulationStore';

export const ControlBar: React.FC = () => {
  const currentStep = useSimulationStore((state) => state.currentStep);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '50px',
      backgroundColor: '#181825',
      borderBottom: '1px solid #313244',
      padding: '0 20px',
      gap: '20px'
    }}>
      <StepButton />
      <MacroSkipButton />
      <SpeedSlider />
      
      <div style={{ flex: 1 }} />
      
      <div style={{ color: '#cdd6f4', fontSize: '14px', fontFamily: 'monospace' }}>
        Step: {currentStep}
      </div>
    </div>
  );
};
