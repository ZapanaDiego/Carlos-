import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loggerService } from '../services/LoggerService';
import { DebugConsolePanel } from '../features/DebugConsole/DebugConsolePanel';
import { ControlBar } from '../features/Controls/ControlBar';
import { CodeEditor } from '../features/Editor/components/CodeEditor';

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    loggerService.sendLog('INFO', 'Simulador C++ Abierto', 'frontend.router');
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Control Bar with Back Button */}
      <div style={{ display: 'flex', backgroundColor: '#181825', borderBottom: '1px solid #313244' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderRight: '1px solid #313244',
            color: '#a6e3a1',
            padding: '0 20px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⬅️</span> Home
        </button>
        <div style={{ flex: 1 }}>
          <ControlBar />
        </div>
      </div>

      {/* Main Content Area - 3 Columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Column: Editor (~35%) */}
        <div style={{ width: '35%', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
          <CodeEditor />
        </div>

        {/* Center Column: Memory Canvas Placeholder (~40%) */}
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#181825', // slightly different background
          position: 'relative'
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            border: '2px dashed #45475a',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#a6adc8',
            textAlign: 'center',
            padding: '20px'
          }}>
            Canvas de Memoria<br/>
            (se implementará en la siguiente fase)
          </div>
        </div>

        {/* Right Column: Diagnostics Placeholder (~25%) */}
        <div style={{ 
          width: '25%', 
          borderLeft: '1px solid #313244', 
          backgroundColor: '#181825',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #313244', fontWeight: 'bold' }}>
            Panel de Diagnóstico
          </div>
          
          <div style={{ flex: 1, borderBottom: '1px solid #313244', padding: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#89b4fa' }}>Stack</h4>
            {/* Stack placeholder */}
          </div>
          
          <div style={{ flex: 1, padding: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#a6e3a1' }}>Heap</h4>
            {/* Heap placeholder */}
          </div>
        </div>

      </div>

      {/* Debug Console Panel */}
      <DebugConsolePanel />
    </div>
  );
};
