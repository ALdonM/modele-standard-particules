import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import EntityList from './components/EntityList';
import EntityForm from './components/EntityForm';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>⚛️ SG-MSP</h1>
          <nav>
            <Link to="/">🏠 Accueil</Link>
          </nav>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/:entity/list" element={<EntityList />} />
            <Route path="/:entity/create" element={<EntityForm />} />
            <Route path="/:entity/edit/:id" element={<EntityForm />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>SG-MSP — Système de Gestion du Modèle Standard des Particules</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;