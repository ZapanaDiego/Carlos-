import React from 'react';

interface MemoryGaugeProps {
  allocatedBytes: number;
  totalCapacityBytes: number;
  elementCount: number;
}

export const MemoryGauge: React.FC<MemoryGaugeProps> = ({ 
  allocatedBytes, 
  totalCapacityBytes, 
  elementCount 
}) => {
  const percentage = Math.min(100, Math.max(0, (allocatedBytes / totalCapacityBytes) * 100));

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      backgroundColor: '#181825',
      border: '1px solid #313244',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#cba6f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚙️</span> Consumo de Memoria RAM
        </h3>
        <div style={{ color: '#bac2de', fontSize: '0.9rem' }}>
          <strong>{allocatedBytes} B</strong> asignados de <strong>{totalCapacityBytes} B</strong> totales
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '16px',
        backgroundColor: '#313244',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: percentage >= 100 ? '#f38ba8' : '#a6e3a1',
          transition: 'width 0.5s ease-in-out, background-color 0.5s',
          boxShadow: '0 0 10px rgba(166, 227, 161, 0.4)'
        }} />
      </div>

      {/* Math Explanation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#6c7086'
      }}>
        <span>Aritmética: {elementCount} elementos × 4 Bytes (int) = {allocatedBytes} Bytes</span>
        <span>{percentage.toFixed(0)}% ocupado</span>
      </div>
    </div>
  );
};
