import React, { useEffect, useState } from 'react';
import EntityCard from '../components/EntityCard';
import { getGroupes, getInteractions, getParticules } from '../services/api';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    particules: 0,
    processus: 0,
    interactions: 0,
    proprietes: 6,
    regles: 6,
    references: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [groupesRes, interactionsRes, particulesRes] = await Promise.all([
          getGroupes(),
          getInteractions(),
          getParticules(),
        ]);
        setStats({
          particules: particulesRes.data.length,
          processus: 0,
          interactions: interactionsRes.data.length,
          proprietes: 6,
          regles: 6,
          references: 0,
        });
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };
    fetchStats();
  }, []);

  const entities = [
    { icon: '⚛️', title: 'Particules', key: 'particules', color: '#1565c0' },
    { icon: '⚡', title: 'Processus', key: 'processus', color: '#ad1457' },
    { icon: '🌐', title: 'Interactions', key: 'interactions', color: '#f9a825' },
    { icon: '📐', title: 'Propriétés', key: 'proprietes', color: '#00838f' },
    { icon: '⚖️', title: 'Règles', key: 'regles', color: '#3949ab' },
    { icon: '🔗', title: 'Références', key: 'references', color: '#2e7d32' },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#1a1a2e', marginBottom: '10px' }}>
        Bienvenue dans le SG-MSP
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>
        Système de Gestion du Modèle Standard des Particules
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '20px' 
      }}>
        {entities.map((entity) => (
          <EntityCard
            key={entity.key}
            icon={entity.icon}
            title={entity.title}
            count={stats[entity.key as keyof typeof stats]}
            color={entity.color}
            onConsult={() => alert(`Consulter ${entity.title} - À implémenter`)}
            onCreate={() => alert(`Créer ${entity.title} - À implémenter`)}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;