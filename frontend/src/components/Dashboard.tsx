import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ENTITY_CONFIGS } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const entities = Object.values(ENTITY_CONFIGS);

  const countLabels: Record<string, string> = {
    particules: 'Données en temps réel',
    interactions: '4 interactions',
    groupes: '5 groupes',
    processus: '10 processus',
    proprietes: '13 propriétés',
    regles: '6 règles',
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
            <p className="entity-count">{countLabels[entity.key] || 'Données en temps réel'}</p>
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