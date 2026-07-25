import React, { useState } from 'react';
import { LogViewer } from './components/LogViewer';
import { useDebugLogs } from './hooks/useDebugLogs';

export const DebugConsolePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'ipc' | 'ast'>('logs');
  const { logs, filterLevel, setFilterLevel, stats, clearLogs } = useDebugLogs();

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: '4px',
          padding: '5px 15px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        🐛 Debug ({stats.ERROR > 0 ? `Errors: ${stats.ERROR}` : 'Console'})
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '40vh', // 40% of screen height
      backgroundColor: '#1e1e2e',
      borderTop: '2px solid #313244',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
    }}>
      {/* Header / Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#181825', borderBottom: '1px solid #313244' }}>
        <button 
            style={tabStyle(activeTab === 'logs')} 
            onClick={() => setActiveTab('logs')}
        >
            Logs ({stats.ALL})
        </button>
        <button 
            style={tabStyle(activeTab === 'ipc')} 
            onClick={() => setActiveTab('ipc')}
        >
            IPC Tracker
        </button>
        <button 
            style={tabStyle(activeTab === 'ast')} 
            onClick={() => setActiveTab('ast')}
        >
            AST Viewer
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button onClick={() => setIsOpen(false)} style={closeBtnStyle}>
          ▼ Close
        </button>
      </div>

      {/* Toolbar for Logs */}
      {activeTab === 'logs' && (
          <div style={{ display: 'flex', gap: '10px', padding: '5px 10px', backgroundColor: '#313244', borderBottom: '1px solid #45475a' }}>
              <select 
                  value={filterLevel} 
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  style={{ backgroundColor: '#1e1e2e', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: '3px' }}
              >
                  <option value="ALL">All Levels</option>
                  <option value="TRACE">Trace & Above</option>
                  <option value="DEBUG">Debug & Above</option>
                  <option value="INFO">Info & Above</option>
                  <option value="WARN">Warn & Above</option>
                  <option value="ERROR">Error & Above</option>
              </select>
              <button onClick={clearLogs} style={{ backgroundColor: '#f38ba8', color: '#11111b', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                  Clear
              </button>
          </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'logs' && <LogViewer logs={logs} />}
        {activeTab === 'ipc' && <div style={placeholderStyle}>IPC Tracker Not Implemented Yet</div>}
        {activeTab === 'ast' && <div style={placeholderStyle}>AST Viewer Not Implemented Yet</div>}
      </div>
    </div>
  );
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? '#313244' : 'transparent',
  color: active ? '#cdd6f4' : '#a6adc8',
  border: 'none',
  borderRight: '1px solid #313244',
  padding: '10px 20px',
  cursor: 'pointer',
  outline: 'none',
  fontWeight: active ? 'bold' : 'normal'
});

const closeBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#f38ba8',
  border: 'none',
  padding: '10px 20px',
  cursor: 'pointer'
};

const placeholderStyle: React.CSSProperties = {
  color: '#6c7086',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%'
};
