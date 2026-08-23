import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ENTITY_CONFIGS, EntityType } from '../types';
import { api } from '../api';

const EntityForm: React.FC = () => {
  const { entity, id } = useParams<{ entity: EntityType; id?: string }>();
  const navigate = useNavigate();
  const config = entity ? ENTITY_CONFIGS[entity] : null;
  const isEdit = !!id;
  const numericId = id ? parseInt(id) : 0;
  const { isSignedIn } = useUser();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // useEffect TOUJOURS en premier, avant tout return conditionnel
  useEffect(() => {
    if (!config) return;
    
    const defaults: Record<string, any> = {};
    config.fields.forEach(f => {
      if (f.type === 'boolean') defaults[f.name] = false;
      else if (f.type === 'number') defaults[f.name] = '';
      else defaults[f.name] = '';
    });
    setFormData(defaults);

    if (isEdit && entity === 'particules') {
      setLoading(true);
      api.get(`/particules/${numericId}`)
        .then(response => setFormData(response.data))
        .catch(() => setError('Impossible de charger la particule'))
        .finally(() => setLoading(false));
    }
  }, [config, isEdit, entity, numericId]);

  // GARDE : acces reserve aux connectes (apres tous les hooks)
  if (!isSignedIn) {
    return (
      <div className="entity-form">
        <button className="back-link" onClick={() => navigate('/')}>← Retour a l'accueil</button>
        <div className="access-denied">
          <h3>Acces reserve</h3>
          <p>Vous devez etre connecte pour creer ou modifier une entite.</p>
          <p style={{fontSize: '0.9rem', color: '#666', marginTop: '1rem'}}>
            La consultation des donnees reste libre et gratuite.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    setSaving(true);
    setError('');

    try {
      const payload: Record<string, any> = {};
      config.fields.forEach(f => {
        let val = formData[f.name];
        if (f.type === 'number' && val !== '' && val !== undefined) {
          val = parseFloat(val);
          if (isNaN(val)) val = null;
        }
        if (f.type === 'boolean') val = !!val;
        if (val === '') val = null;
        payload[f.name] = val;
      });

      if (isEdit) {
        alert('Modification enregistree (simulation — endpoint PUT a ajouter dans l\'API)');
      } else {
        if (entity === 'particules') {
          await api.post('/particules', payload);
        } else {
          alert(`Creation pour ${entity} — endpoint a ajouter dans l'API`);
        }
      }
      
      navigate(`/${entity}/list`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return <div className="entity-form"><h2>Entite inconnue</h2></div>;
  }

  if (loading) return <div className="entity-form"><p>Chargement...</p></div>;

  return (
    <div className="entity-form">
      <button className="back-link" onClick={() => navigate(`/${entity}/list`)}>
        ← Retour a la liste
      </button>
      
      <h2>
        {isEdit ? 'Modifier' : 'Creer'} {config.label.toLowerCase().slice(0, -1)}
      </h2>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        {config.fields.map(field => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name}>
              {field.label}
              {field.type === 'select' && <span className="badge-liste">Liste fermee</span>}
            </label>
            
            {field.type === 'select' && field.options ? (
              <select
                id={field.name}
                value={formData[field.name] ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  handleChange(field.name, val);
                }}
                required
              >
                <option value="">-- Selectionner --</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'boolean' ? (
              <select
                id={field.name}
                value={formData[field.name] === true ? 'true' : 'false'}
                onChange={(e) => handleChange(field.name, e.target.value === 'true')}
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            ) : field.type === 'number' ? (
              <input
                id={field.name}
                type="number"
                step="any"
                value={formData[field.name] ?? ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.label}
              />
            ) : (
              <input
                id={field.name}
                type="text"
                value={formData[field.name] ?? ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.label}
              />
            )}
            
            {field.type === 'select' && (
              <small className="field-help">
                Valeur predefinie par l'administrateur. Contactez un admin pour ajouter une nouvelle valeur.
              </small>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sauvegarde...' : (isEdit ? 'Mettre a jour' : 'Creer')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/${entity}/list`)}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntityForm;