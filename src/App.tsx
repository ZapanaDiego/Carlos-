import React, { useEffect } from 'react';
import { loggerService } from './services/LoggerService';
import { DebugConsolePanel } from './features/DebugConsole/DebugConsolePanel';
import { ControlBar } from './features/Controls/ControlBar';
import { CodeEditor } from './features/Editor/components/CodeEditor';
import './App.css'; // Global styles and resets

function App() {
  useEffect(() => {
    loggerService.init();
    loggerService.sendLog('INFO', 'Aplicación Carlos++ iniciada', 'frontend.app');
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Control Bar */}
      <ControlBar />

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
}

export default App;
