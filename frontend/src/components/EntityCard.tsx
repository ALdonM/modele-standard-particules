import React from 'react';

interface EntityCardProps {
  icon: string;
  title: string;
  count: number;
  color: string;
  onConsult: () => void;
  onCreate: () => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ icon, title, count, color, onConsult, onCreate }) => {
  return (
    <div style={{
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '20px',
      margin: '10px',
      width: '220px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ fontSize: '40px', textAlign: 'center' }}>{icon}</div>
      <h3 style={{ textAlign: 'center', color, margin: '10px 0' }}>{title}</h3>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
        {count} entrée{count !== 1 ? 's' : ''}
      </p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button 
          onClick={onConsult}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Consulter
        </button>
        <button 
          onClick={onCreate}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: 'white',
            color: color,
            border: `2px solid ${color}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Créer
        </button>
      </div>
    </div>
  );
};

export default EntityCard;