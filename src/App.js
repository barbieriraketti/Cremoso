import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Historico from './Historico'; // Importa o componente Historico
import './App.css'; // Importa o arquivo de estilos

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/historico" element={<Historico />} /> {/* Nova rota adicionada */}
      </Routes>
    </Router>
  );
};

export default App;
