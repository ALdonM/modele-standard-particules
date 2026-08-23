import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ENTITY_CONFIGS, EntityType, FilterCriterion } from '../types';
import { api } from '../api';
import QueryBuilder from './QueryBuilder';

const EntityList: React.FC = () => {
  const { entity } = useParams<{ entity: EntityType }>();
  const navigate = useNavigate();
  const config = entity ? ENTITY_CONFIGS[entity] : null;

  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const fetchData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(config.endpoint);
      setData(response.data);
      setFilteredData(response.data);
    } catch (err: any) {
      setError(err.response?.status === 404 
        ? 'Endpoint non encore implémenté dans l\'API. Données de démonstration utilisées.' 
        : 'Erreur de connexion à l\'API'
      );
      if (entity === 'particules') {
        const demo = [
          { id_particule: 1, nom_particule: 'électron', symbole: 'e⁻', masse_mev: 0.511, spin: 0.5, charge_e: -1, duree_vie_s: undefined, nombre_baryonique_B: 0, nombre_leptonique_L: 1, est_elementaire: true },
          { id_particule: 2, nom_particule: 'proton', symbole: 'p⁺', masse_mev: 938.272, spin: 0.5, charge_e: 1, duree_vie_s: undefined, nombre_baryonique_B: 1, nombre_leptonique_L: 0, est_elementaire: false },
          { id_particule: 3, nom_particule: 'neutron', symbole: 'n', masse_mev: 939.565, spin: 0.5, charge_e: 0, duree_vie_s: 879.4, nombre_baryonique_B: 1, nombre_leptonique_L: 0, est_elementaire: false },
        ];
        setData(demo);
        setFilteredData(demo);
      } else if (entity === 'interactions') {
        const demo = [
          { id_interaction: 1, nom_interaction: 'gravitation', portee_effective_m: undefined, constante_couplage: 6.674e-11 },
          { id_interaction: 2, nom_interaction: 'électromagnétique', portee_effective_m: undefined, constante_couplage: 0.007297 },
          { id_interaction: 3, nom_interaction: 'faible', portee_effective_m: 1e-18, constante_couplage: 0.03 },
          { id_interaction: 4, nom_interaction: 'forte', portee_effective_m: 1e-15, constante_couplage: 1 },
        ];
        setData(demo);
        setFilteredData(demo);
      } else if (entity === 'groupes') {
        const demo = [
          { id_groupe: 1, nom_groupe: 'quark', description: 'Fermions fondamentaux', spin_caracteristique: 0.5 },
          { id_groupe: 2, nom_groupe: 'lepton', description: 'Fermions fondamentaux', spin_caracteristique: 0.5 },
          { id_groupe: 3, nom_groupe: 'boson_jauge', description: 'Bosons vecteurs', spin_caracteristique: 1 },
          { id_groupe: 4, nom_groupe: 'boson_higgs', description: 'Boson scalaire', spin_caracteristique: 0 },
          { id_groupe: 5, nom_groupe: 'hadron', description: 'Particules composites', spin_caracteristique: undefined },
        ];
        setData(demo);
        setFilteredData(demo);
      }
    } finally {
      setLoading(false);
    }
  }, [config, entity]);

  useEffect(() => {
    if (!config) return;
    const defaultCols = config.fields.map(f => f.name);
    setVisibleColumns(defaultCols);
    fetchData();
  }, [entity, config, fetchData]);

  const handleSearch = (criteria: FilterCriterion[], logic: ('ET' | 'OU')[]) => {
    if (criteria.length === 0 || criteria.every(c => c.value === '' || c.value === null)) {
      setFilteredData(data);
      return;
    }

    const result = data.filter((item: any) => {
      const results: boolean[] = criteria.map(c => {
        const val = item[c.field];
        
        if (c.operator === 'IS NULL') return val === null || val === undefined;
        if (val === null || val === undefined) return false;
        
        const critVal = c.value;
        if (critVal === null || critVal === undefined) return false;
        
        switch (c.operator) {
          case '=': return val === critVal;
          case '!=': return val !== critVal;
          case '<': return val < critVal;
          case '>': return val > critVal;
          case '<=': return val <= critVal;
          case '>=': return val >= critVal;
          case 'LIKE': return String(val).toLowerCase().includes(String(critVal).toLowerCase());
          case 'BETWEEN': 
            const v2 = c.value2 !== null && c.value2 !== undefined ? c.value2 : critVal;
            return val >= critVal && val <= v2;
          default: return true;
        }
      });

      if (results.length === 0) return true;
      let finalResult = results[0];
      for (let i = 1; i < results.length; i++) {
        const op = logic[i - 1] || 'ET';
        if (op === 'ET') finalResult = finalResult && results[i];
        else finalResult = finalResult || results[i];
      }
      return finalResult;
    });

    setFilteredData(result);
  };

  const toggleColumn = (fieldName: string) => {
    setVisibleColumns(prev => 
      prev.includes(fieldName) 
        ? prev.filter(c => c !== fieldName)
        : [...prev, fieldName]
    );
  };

  const getFieldLabel = (name: string) => {
    return config?.fields.find(f => f.name === name)?.label || name;
  };

  const getIdField = () => {
    if (entity === 'particules') return 'id_particule';
    if (entity === 'interactions') return 'id_interaction';
    if (entity === 'groupes') return 'id_groupe';
    return 'id';
  };

  if (!config) {
    return <div className="entity-list"><h2>Entité inconnue</h2></div>;
  }

  return (
    <div className="entity-list">
      <button className="back-link" onClick={() => navigate('/')}>← Retour à l'accueil</button>
      <h2>{config.icon} {config.label}</h2>
      
      <div className="list-toolbar">
        <button className="btn btn-primary" onClick={() => navigate(`/${entity}/create`)}>
          ➕ Créer une {config.label.toLowerCase().slice(0, -1)}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowColumnsPanel(!showColumnsPanel)}
        >
          📊 Colonnes
        </button>
      </div>

      {showColumnsPanel && (
        <div className="columns-panel">
          <strong>Colonnes affichées :</strong>
          {config.fields.map(f => (
            <label key={f.name} className="column-checkbox">
              <input
                type="checkbox"
                checked={visibleColumns.includes(f.name)}
                onChange={() => toggleColumn(f.name)}
              />
              {f.label}
            </label>
          ))}
        </div>
      )}

      <QueryBuilder fields={config.fields} onSearch={handleSearch} />

      {loading && <p>Chargement...</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="results-info">
        {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} sur {data.length} au total
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Actions</th>
              {config.fields
                .filter(f => visibleColumns.includes(f.name))
                .map(f => (
                  <th key={`h-${f.name}`}>{getFieldLabel(f.name)}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="no-data">
                  Aucune donnée trouvée
                </td>
              </tr>
            ) : (
              filteredData.map((item: any) => (
                <tr key={item[getIdField()]}>
                  <td className="actions-cell">
                    <button 
                      className="btn-icon" 
                      onClick={() => navigate(`/${entity}/edit/${item[getIdField()]}`)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon btn-danger" 
                      onClick={() => alert('Suppression logique avec audit — à implémenter')}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                  {config.fields
                    .filter(f => visibleColumns.includes(f.name))
                    .map(f => (
                      <td key={f.name}>
                        {f.type === 'boolean' 
                          ? (item[f.name] ? '✅' : '❌')
                          : item[f.name] !== null && item[f.name] !== undefined 
                            ? String(item[f.name]) 
                            : '—'
                        }
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntityList;