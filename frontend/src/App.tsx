import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ClerkProvider, useUser, useClerk, UserButton } from '@clerk/clerk-react';
import './App.css';
import Dashboard from './components/Dashboard';
import EntityList from './components/EntityList';
import EntityForm from './components/EntityForm';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';

function AuthNav() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  return (
    <div className="auth-nav">
      {!isSignedIn ? (
        <button className="btn-auth" onClick={() => openSignIn()}>
          🔐 Connexion
        </button>
      ) : (
        <UserButton afterSignOutUrl="/" />
      )}
    </div>
  );
}

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="mobile-menu-wrapper">
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
      </button>
      
      {isOpen && (
        <nav className="mobile-nav" onClick={() => setIsOpen(false)}>
          <Link to="/" className="mobile-link">🏠 Accueil</Link>
          <Link to="/particules/list" className="mobile-link">⚛️ Particules</Link>
          <Link to="/interactions/list" className="mobile-link">🌐 Interactions</Link>
          <Link to="/groupes/list" className="mobile-link">🔬 Groupes</Link>
          <Link to="/proprietes/list" className="mobile-link">📐 Propriétés</Link>
          <Link to="/regles/list" className="mobile-link">⚖️ Règles</Link>
          <Link to="/processus/list" className="mobile-link">⚡ Processus</Link>
          {!isSignedIn ? (
            <button className="mobile-link mobile-auth" onClick={() => openSignIn()}>
              🔐 Connexion
            </button>
          ) : (
            <div className="mobile-link mobile-auth">
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="header-left">
              <MobileMenu />
              <h1>⚛️ SG-MSP</h1>
            </div>
            <div className="header-right desktop-only">
              <nav className="desktop-nav">
                <Link to="/">Accueil</Link>
                <Link to="/particules/list">Particules</Link>
                <Link to="/interactions/list">Interactions</Link>
                <Link to="/groupes/list">Groupes</Link>
              </nav>
              <AuthNav />
            </div>
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
            <p>SG-MSP — Modèle Standard des Particules</p>
          </footer>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;