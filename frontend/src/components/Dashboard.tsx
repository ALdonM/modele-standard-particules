import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { ENTITY_CONFIGS } from '../types';
import { api } from '../api';
import { inspireRecherche } from '../externalLinks';

// Libellé singulier / pluriel pour afficher « 8 interactions » ou « 1 groupe »
const NOMS: Record<string, [string, string]> = {
  particules: ['particule', 'particules'],
  interactions: ['interaction', 'interactions'],
  groupes: ['groupe', 'groupes'],
  processus: ['processus', 'processus'],
  proprietes: ['propriété', 'propriétés'],
  regles: ['règle', 'règles'],
};

const NOMS_EN: Record<string, [string, string]> = {
  particules: ['particle', 'particles'],
  interactions: ['interaction', 'interactions'],
  groupes: ['group', 'groups'],
  processus: ['process', 'processes'],
  proprietes: ['property', 'properties'],
  regles: ['rule', 'rules'],
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const entities = Object.values(ENTITY_CONFIGS);

  // Compteurs lus dans l'API (undefined tant que la réponse n'est pas arrivée)
  const [recherche, setRecherche] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let annule = false;
    Promise.allSettled(entities.map((e) => api.get(e.endpoint))).then((resultats) => {
      if (annule) return;
      const c: Record<string, number> = {};
      resultats.forEach((r, i) => {
        if (r.status === 'fulfilled' && Array.isArray(r.value.data)) {
          c[entities[i].key] = r.value.data.length;
        }
      });
      setCounts(c);
    });
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const libelle = (key: string) => {
    const n = counts[key];
    if (n === undefined) return t('Chargement…');
    const [sing, plur] = (lang === 'en' ? NOMS_EN : NOMS)[key] || (lang === 'en' ? ['item', 'items'] : ['élément', 'éléments']);
    return `${n} ${n > 1 ? plur : sing}`;
  };

  return (
    <div className="dashboard">
      <h2>{t('🎯 Système de Gestion du Modèle Standard')}</h2>
      <p className="dashboard-subtitle">
        {t('Choisissez une entité à consulter')}
      </p>
      
      <div className="entity-grid">
        {entities.map((entity) => (
          <div 
            key={entity.key} 
            className={`entity-card ${entity.key}`}
            style={{ borderTopColor: entity.color }}
          >
            <div className="entity-icon">{entity.icon}</div>
            <h3>{t(entity.label)}</h3>
            <p className="entity-count">{libelle(entity.key)}</p>
            <div className="entity-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/${entity.key}/list`)}
              >
                {t('📋 Consulter')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="reference-panel" style={{ marginTop: '2rem' }}>
        <h3>{t('📚 Ressources externes')}</h3>
        <div className="reference-links" style={{ margin: '0.6rem 0' }}>
          <a className="ref-badge" href="https://pdg.lbl.gov" target="_blank" rel="noopener noreferrer">{t('📘 Particle Data Group')}</a>
          <a className="ref-badge" href="https://pdg.lbl.gov/2026/tables/contents_tables.html" target="_blank" rel="noopener noreferrer">{t('📊 Tableaux PDG 2026')}</a>
          <a className="ref-badge" href="https://inspirehep.net" target="_blank" rel="noopener noreferrer">{t('📚 INSPIRE HEP')}</a>
        </div>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (recherche.trim()) window.open(inspireRecherche(recherche.trim()), '_blank', 'noopener');
          }}
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            value={recherche}
            onChange={(ev) => setRecherche(ev.target.value)}
            placeholder={t('Rechercher dans la littérature (en anglais) : ex. Higgs boson mass')}
            style={{ flex: '1 1 320px', padding: '0.5rem' }}
          />
          <button type="submit" className="btn btn-primary">{t('🔎 Chercher sur INSPIRE')}</button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
