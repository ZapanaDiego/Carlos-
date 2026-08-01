import React, { useState } from 'react';
import { arrayPlacementStrategy, ArrayPlacementTarget, ArrayPlacementAnswer } from '../strategies/ValidationStrategy';

export const InteractiveChallenge: React.FC = () => {
  // Configuración del Desafío
  const target: ArrayPlacementTarget = { targetValue: 99, targetIndex: 3 };
  const availableValues = [42, 7, 99];
  const arraySize = 5;

  // Estado Interactivo
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [placedItems, setPlacedItems] = useState<Record<number, number>>({});
  
  // Feedback UI State
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const handleSelectValue = (val: number) => {
    setSelectedValue(val);
    setFeedback({ message: '', type: null }); // Limpiar error anterior
  };

  const handlePlaceValue = (index: number) => {
    if (selectedValue === null) {
      setFeedback({ message: 'Primero selecciona una carta (valor) de arriba.', type: 'error' });
      return;
    }
    
    setPlacedItems(prev => ({ ...prev, [index]: selectedValue }));
    setSelectedValue(null); // Deseleccionar después de colocar
    setFeedback({ message: '', type: null });
  };

  const handleValidate = () => {
    // Para simplificar, buscamos si colocó el targetValue en el targetIndex.
    // Convertimos el estado actual del tablero en el formato que lee la Strategy.
    const placedIndex = Object.keys(placedItems).find(
      key => placedItems[parseInt(key)] === target.targetValue
    );

    const answer: ArrayPlacementAnswer = {
      placedValue: target.targetValue,
      placedIndex: placedIndex !== undefined ? parseInt(placedIndex) : null
    };

    const isCorrect = arrayPlacementStrategy.validate(answer, target);

    if (isCorrect) {
      setFeedback({ message: '¡Excelente! Has colocado el valor en la dirección de memoria correcta.', type: 'success' });
    } else {
      setFeedback({ message: 'Aún no es correcto. Recuerda que los índices comienzan en [0]. ¡Inténtalo de nuevo!', type: 'error' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
      
      {/* Challenge Instructions */}
      <div style={{
        backgroundColor: '#181825',
        border: '1px solid #313244',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ color: '#f9e2af', margin: '0 0 10px 0' }}>🎮 Desafío: Mano a Mano</h2>
        <p style={{ color: '#bac2de', margin: 0, fontSize: '1.1rem' }}>
          Coloca el número <strong>{target.targetValue}</strong> en la posición de índice <strong>[{target.targetIndex}]</strong> del vector.
        </p>
      </div>

      {/* Selectable Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        {availableValues.map((val) => (
          <div
            key={val}
            onClick={() => handleSelectValue(val)}
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: selectedValue === val ? '#89b4fa' : '#313244',
              color: selectedValue === val ? '#11111b' : '#cdd6f4',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: selectedValue === val ? '2px solid #b4befe' : '2px solid transparent',
              transition: 'all 0.2s',
              boxShadow: selectedValue === val ? '0 0 15px rgba(137, 180, 250, 0.5)' : 'none'
            }}
          >
            {val}
          </div>
        ))}
      </div>

      {/* Interactive Array Canvas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {Array.from({ length: arraySize }).map((_, index) => {
          const val = placedItems[index];
          const hasValue = val !== undefined;

          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#a6adc8', fontWeight: 'bold', marginBottom: '8px' }}>[{index}]</div>
              <div
                onClick={() => handlePlaceValue(index)}
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: hasValue ? 'rgba(166, 227, 161, 0.2)' : '#1e1e2e',
                  border: hasValue ? '2px solid #a6e3a1' : '2px dashed #45475a',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.8rem',
                  color: hasValue ? '#a6e3a1' : '#45475a',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {hasValue ? val : '?'}
              </div>
              <div style={{ color: '#7f849c', fontFamily: 'monospace', marginTop: '12px', fontSize: '0.9rem' }}>
                0x{(0x1000 + index * 4).toString(16).toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div style={{
          width: '100%',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: feedback.type === 'success' ? 'rgba(166, 227, 161, 0.2)' : 'rgba(243, 139, 168, 0.2)',
          border: `1px solid ${feedback.type === 'success' ? '#a6e3a1' : '#f38ba8'}`,
          color: feedback.type === 'success' ? '#a6e3a1' : '#f38ba8',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {feedback.message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => { setPlacedItems({}); setFeedback({ message: '', type: null }); setSelectedValue(null); }}
          style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#45475a', color: '#cdd6f4', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        >
          Limpiar
        </button>
        <button
          onClick={handleValidate}
          style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#a6e3a1', color: '#11111b', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        >
          Validar Ejercicio
        </button>
      </div>
      
    </div>
  );
};
