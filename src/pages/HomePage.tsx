import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loggerService } from '../services/LoggerService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string, label: string) => {
    loggerService.sendLog('INFO', `Navigating to ${label}`, 'frontend.router', { path });
    navigate(path);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#89b4fa' }}>Carlos++</h1>
        <p style={{ fontSize: '1.2rem', color: '#a6adc8', margin: 0 }}>
          Visualizador de Memoria Pedagógico para C++ con Esteroides
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', maxWidth: '900px', width: '100%', padding: '0 2rem' }}>
        {/* Conceptual Lab Card */}
        <div 
          onClick={() => handleNavigate('/conceptual', 'Laboratorio Conceptual')}
          style={{
            flex: 1,
            backgroundColor: '#181825',
            borderRadius: '12px',
            padding: '2.5rem',
            cursor: 'pointer',
            border: '2px solid #313244',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#a6e3a1';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#313244';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h2 style={{ margin: '0 0 1rem 0', color: '#a6e3a1' }}>Laboratorio Conceptual</h2>
          <p style={{ color: '#bac2de', margin: 0, lineHeight: 1.5 }}>
            Aprende estructuras de datos de forma visual e interactiva. 100% sin código. 
            Ideal para entender los fundamentos teóricos antes de programar.
          </p>
        </div>

        {/* C++ Simulator Card */}
        <div 
          onClick={() => handleNavigate('/simulator', 'Simulador C++')}
          style={{
            flex: 1,
            backgroundColor: '#181825',
            borderRadius: '12px',
            padding: '2.5rem',
            cursor: 'pointer',
            border: '2px solid #313244',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cba6f7';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#313244';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💻</div>
          <h2 style={{ margin: '0 0 1rem 0', color: '#cba6f7' }}>Simulador C++</h2>
          <p style={{ color: '#bac2de', margin: 0, lineHeight: 1.5 }}>
            Entorno técnico avanzado. Escribe código real, ejecuta paso a paso y 
            observa cómo se manipula la memoria en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
};
