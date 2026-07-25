import React, { useState, useRef, useEffect } from 'react';
import { ILogEntry, LogLevel } from '../../../types/log.types';

interface LogViewerProps {
  logs: ILogEntry[];
}

const LogLevelBadge = ({ level }: { level: LogLevel }) => {
  const colors: Record<LogLevel, string> = {
    TRACE: '#6c7086', // overlay0
    DEBUG: '#89b4fa', // blue
    INFO: '#a6e3a1',  // green
    WARN: '#f9e2af',  // yellow
    ERROR: '#fab387', // peach
    FATAL: '#f38ba8'  // red
  };
  
  return (
    <span style={{
        backgroundColor: `${colors[level]}20`,
        color: colors[level],
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        minWidth: '50px',
        textAlign: 'center',
        display: 'inline-block'
    }}>
      {level}
    </span>
  );
};

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom on new logs
  useEffect(() => {
      if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
      }
  }, [logs.length]);

  const toggleExpand = (index: number) => {
      setExpandedIndices(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) newSet.delete(index);
          else newSet.add(index);
          return newSet;
      });
  };

  return (
    <div 
        ref={listRef}
        style={{ 
            height: '100%', 
            overflowY: 'auto', 
            backgroundColor: '#1e1e2e', 
            color: '#cdd6f4',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '10px'
        }}
    >
      {logs.map((log, index) => {
          const date = new Date(log.timestamp);
          const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
          
          const isExpanded = expandedIndices.has(index);
          const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
          
          const simStepText = log.simulation_step === null ? "— (sin contexto)" : `Step ${log.simulation_step}`;

          return (
              <div key={index} style={{ marginBottom: '4px', borderBottom: '1px solid #313244', paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#a6adc8', minWidth: '90px' }}>{timeString}</span>
                      <LogLevelBadge level={log.level} />
                      <span style={{ color: '#cba6f7', minWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          [{log.source}]
                      </span>
                      <span style={{ color: '#f5c2e7', minWidth: '120px' }}>
                          {simStepText}
                      </span>
                      <span style={{ flex: 1, wordBreak: 'break-all' }}>
                          {log.message}
                      </span>
                      
                      {hasMetadata && (
                          <button 
                              onClick={() => toggleExpand(index)}
                              style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#89b4fa', 
                                  cursor: 'pointer',
                                  padding: '0 5px'
                              }}
                          >
                              {isExpanded ? '▼' : '▶'}
                          </button>
                      )}
                  </div>
                  
                  {isExpanded && hasMetadata && (
                      <div style={{ 
                          marginLeft: '370px', // Align with message roughly
                          marginTop: '4px',
                          backgroundColor: '#181825',
                          padding: '8px',
                          borderRadius: '4px',
                          color: '#a6adc8'
                      }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                      </div>
                  )}
              </div>
          );
      })}
    </div>
  );
};
