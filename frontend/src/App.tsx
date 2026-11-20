import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { LangProvider, useLang } from './i18n';
import Dashboard from './components/Dashboard';
import EntityList from './components/EntityList';
import ParticuleDetail from './components/ParticuleDetail';

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <button
      className="btn-auth"
      onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
      aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      🌐 {lang === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="mobile-menu-wrapper">
      <button className="hamburger" onClick={toggleMenu} aria-label={t('Menu')}>
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        <span className={`bar ${isOpen ? 'open' : ''}`}></span>
      </button>

      {isOpen && (
        <nav className="mobile-nav" onClick={() => setIsOpen(false)}>
          <Link to="/" className="mobile-link">🏠 {t('Accueil')}</Link>
          <Link to="/particules/list" className="mobile-link">⚛️ {t('Particules')}</Link>
          <Link to="/interactions/list" className="mobile-link">🌐 {t('Interactions')}</Link>
          <Link to="/groupes/list" className="mobile-link">🔬 {t('Groupes')}</Link>
          <Link to="/proprietes/list" className="mobile-link">📐 {t('Propriétés')}</Link>
          <Link to="/regles/list" className="mobile-link">⚖️ {t('Règles')}</Link>
          <Link to="/processus/list" className="mobile-link">⚡ {t('Processus')}</Link>
          <div className="mobile-link mobile-auth">
            <LangSwitch />
          </div>
        </nav>
      )}
    </div>
  );
}

function Shell() {
  const { t } = useLang();
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <MobileMenu />
            <h1>⚛️ SG-MSP</h1>
          </div>
          <div className="header-right desktop-only">
            <nav className="desktop-nav">
              <Link to="/">{t('Accueil')}</Link>
              <Link to="/particules/list">{t('Particules')}</Link>
              <Link to="/interactions/list">{t('Interactions')}</Link>
              <Link to="/groupes/list">{t('Groupes')}</Link>
            </nav>
            <div className="auth-nav">
              <LangSwitch />
            </div>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/particules/fiche/:id" element={<ParticuleDetail />} />
            <Route path="/:entity/list" element={<EntityList />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>{t('SG-MSP — Modèle Standard des Particules')}</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {t('Données : Particle Data Group, Review of Particle Physics 2026 (CC BY 4.0). Certaines valeurs sont déduites ; vérifiez à la source avant tout usage scientifique.')}
          </p>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}

export default App;
