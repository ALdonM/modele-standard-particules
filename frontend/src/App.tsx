import React from 'react';
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
    <nav className="nav-auth">
      <Link to="/" className="nav-home">🏠 Accueil</Link>
      {!isSignedIn ? (
        <button className="btn-auth" onClick={() => openSignIn()}>
          🔐 Connexion
        </button>
      ) : (
        <UserButton afterSignOutUrl="/" />
      )}
    </nav>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="app">
          <header className="app-header">
            <h1>⚛️ SG-MSP</h1>
            <AuthNav />
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
    </ClerkProvider>
  );
}

export default App;