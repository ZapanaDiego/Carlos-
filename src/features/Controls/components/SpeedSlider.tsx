import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { loggerService } from '../../../services/LoggerService';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export const SpeedSlider: React.FC = () => {
  const speed = useSimulationStore((state) => state.speed);
  const setSpeed = useSimulationStore((state) => state.setSpeed);

  // Map speed to index (0 to 4)
  const currentIndex = SPEEDS.indexOf(speed) !== -1 ? SPEEDS.indexOf(speed) : 2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    const newSpeed = SPEEDS[newIndex];
    setSpeed(newSpeed);

    loggerService.sendLog('DEBUG', `Velocidad cambiada a ${newSpeed}x`, 'frontend.controls', {
      speed: newSpeed
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '14px', color: '#a6adc8' }}>🐢</span>
      <input 
        type="range" 
        min={0} 
        max={4} 
        step={1} 
        value={currentIndex} 
        onChange={handleChange}
        style={{
          width: '100px',
          accentColor: '#f9e2af' // yellow accent
        }}
      />
      <span style={{ fontSize: '14px', color: '#a6adc8' }}>🐇 ({speed}x)</span>
    </div>
  );
};
