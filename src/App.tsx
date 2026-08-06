import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { loggerService } from './services/LoggerService';
import { HomePage } from './pages/HomePage';
import { ConceptualDashboard } from './pages/ConceptualDashboard';
import { SimulatorPage } from './pages/SimulatorPage';
import './App.css'; // Global styles and resets

function App() {
  useEffect(() => {
    loggerService.init();
    loggerService.sendLog('INFO', 'Aplicación Carlos++ iniciada', 'frontend.app');
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/conceptual/*" element={<ConceptualDashboard />} />
        <Route path="/simulator" element={<SimulatorPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
