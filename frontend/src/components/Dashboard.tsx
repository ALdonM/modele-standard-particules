import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ENTITY_CONFIGS } from '../types';
import { api } from '../api';

// Libellé singulier / pluriel pour afficher « 8 interactions » ou « 1 groupe »
const NOMS: Record<string, [string, string]> = {
  particules: ['particule', 'particules'],
  interactions: ['interaction', 'interactions'],
  groupes: ['groupe', 'groupes'],
  processus: ['processus', 'processus'],
  proprietes: ['propriété', 'propriétés'],
  regles: ['règle', 'règles'],
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const entities = Object.values(ENTITY_CONFIGS);

  // Compteurs lus dans l'API (undefined tant que la réponse n'est pas arrivée)
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
    if (n === undefined) return 'Chargement…';
    const [sing, plur] = NOMS[key] || ['élément', 'éléments'];
    return `${n} ${n > 1 ? plur : sing}`;
  };

  return (
    <div className="dashboard">
      <h2>🎯 Système de Gestion du Modèle Standard</h2>
      <p className="dashboard-subtitle">
        Choisissez une entité à consulter, créer ou modifier
      </p>
      
      <div className="entity-grid">
        {entities.map((entity) => (
          <div 
            key={entity.key} 
            className={`entity-card ${entity.key}`}
            style={{ borderTopColor: entity.color }}
          >
            <div className="entity-icon">{entity.icon}</div>
            <h3>{entity.label}</h3>
            <p className="entity-count">{libelle(entity.key)}</p>
            <div className="entity-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/${entity.key}/list`)}
              >
                📋 Consulter
              </button>
              {isSignedIn && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/${entity.key}/create`)}
                >
                  ➕ Créer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
