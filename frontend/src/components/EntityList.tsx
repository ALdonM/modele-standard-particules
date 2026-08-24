import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ENTITY_CONFIGS, EntityType, FilterCriterion } from '../types';
import { api } from '../api';
import QueryBuilder from './QueryBuilder';

const formatSpin = (val: any) => {
  if (val === 0.5) return '1/2';
  if (val === 1.5) return '3/2';
  if (val === 2.5) return '5/2';
  if (val === 3) return '3';
  if (val === 2) return '2';
  if (val === 1) return '1';
  if (val === 0) return '0';
  return String(val);
};

const EntityList: React.FC = () => {
  const { entity } = useParams<{ entity: EntityType }>();
  const navigate = useNavigate();
  const config = entity ? ENTITY_CONFIGS[entity] : null;
  const { isSignedIn } = useUser();

  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'} | null>(null);
  const [activeChip, setActiveChip] = useState<string>('Tous');
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [rowReferences, setRowReferences] = useState<Record<number, any[]>>({});
  const [loadingRefs, setLoadingRefs] = useState<Record<number, boolean>>({});

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
        ? 'Endpoint non encore implemente' 
        : 'Erreur de connexion'
      );
      if (entity === 'particules') {
        setData([]);
        setFilteredData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [config, entity]);

  useEffect(() => {
    if (!config) return;
    setVisibleColumns(config.fields.map(f => f.name));
    fetchData();
  }, [entity, config, fetchData]);

  const applyChip = (chip: string, rawData: any[]) => {
    setActiveChip(chip);
    if (chip === 'Tous') return rawData;
    if (chip === 'Fermions') return rawData.filter((p: any) => p.spin % 1 !== 0);
    if (chip === 'Bosons') return rawData.filter((p: any) => p.spin % 1 === 0);
    if (chip === 'Leptons') return rawData.filter((p: any) => Math.abs(p.nombre_leptonique_L) > 0);
    if (chip === 'Quarks') return rawData.filter((p: any) => p.nom_particule?.includes('quark'));
    if (chip === 'Mesons') return rawData.filter((p: any) => !p.est_elementaire && p.nombre_baryonique_B === 0 && p.spin !== undefined);
    if (chip === 'Baryons') return rawData.filter((p: any) => p.nombre_baryonique_B > 0);
    return rawData;
  };

  const chips = ['Tous', 'Fermions', 'Bosons', 'Leptons', 'Quarks', 'Mesons', 'Baryons'];

  const getEntityRefName = () => {
    if (entity === 'particules') return 'PARTICULE';
    if (entity === 'interactions') return 'INTERACTION_FONDAMENTALE';
    if (entity === 'groupes') return 'GROUPE';
    if (entity === 'processus') return 'PROCESSUS_DYNAMIQUE';
    if (entity === 'proprietes') return 'PROPRIETE_QUANTIQUE';
    if (entity === 'regles') return 'REGLE_CONSERVATION';
    return 'PARTICULE';
  };

  const toggleReferences = async (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
      setExpandedRows(newExpanded);
      return;
    }
    newExpanded.add(id);
    setExpandedRows(newExpanded);
    if (!rowReferences[id]) {
      setLoadingRefs(prev => ({ ...prev, [id]: true }));
      try {
        const response = await api.get('/references', {
          params: { entite_cible: getEntityRefName(), id_cible: id }
        });
        setRowReferences(prev => ({ ...prev, [id]: response.data }));
      } catch (err) {
        setRowReferences(prev => ({ ...prev, [id]: [] }));
      } finally {
        setLoadingRefs(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleSearch = (criteria: FilterCriterion[], logic: ('ET' | 'OU')[]) => {
    if (criteria.length === 0 || criteria.every(c => c.value === '' || c.value === null)) {
      setFilteredData(applyChip(activeChip, data));
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
    setFilteredData(applyChip(activeChip, result));
    setSortConfig(null);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const toggleColumn = (fieldName: string) => {
    setVisibleColumns(prev => prev.includes(fieldName) ? prev.filter(c => c !== fieldName) : [...prev, fieldName]);
  };

  const getFieldLabel = (name: string) => config?.fields.find(f => f.name === name)?.label || name;

  const getIdField = () => {
    if (entity === 'particules') return 'id_particule';
    if (entity === 'interactions') return 'id_interaction';
    if (entity === 'groupes') return 'id_groupe';
    if (entity === 'processus') return 'id_processus';
    if (entity === 'proprietes') return 'id_propriete';
    if (entity === 'regles') return 'id_regle';
    return 'id';
  };

  if (!config) return <div className="entity-list"><h2>Entite inconnue</h2></div>;

  return (
    <div className="entity-list">
      <button className="back-link" onClick={() => navigate('/')}>← Retour a l'accueil</button>
      <h2>{config.icon} {config.label}</h2>
      
      <div className="list-toolbar">
        {isSignedIn ? (
          <button className="btn btn-primary" onClick={() => navigate(`/${entity}/create`)}>
            + Creer
          </button>
        ) : (
          <span className="login-hint">Connectez-vous pour contribuer</span>
        )}
        <button className="btn btn-secondary" onClick={() => setShowColumnsPanel(!showColumnsPanel)}>
          Colonnes
        </button>
      </div>

      {entity === 'particules' && (
        <div className="chips-bar">
          {chips.map(chip => (
            <button 
              key={chip} 
              className={`chip ${activeChip === chip ? 'active' : ''}`}
              onClick={() => setFilteredData(applyChip(chip, data))}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {showColumnsPanel && (
        <div className="columns-panel">
          <strong>Colonnes :</strong>
          {config.fields.map(f => (
            <label key={f.name} className="column-checkbox">
              <input type="checkbox" checked={visibleColumns.includes(f.name)} onChange={() => toggleColumn(f.name)} />
              {f.label}
            </label>
          ))}
        </div>
      )}

      <QueryBuilder fields={config.fields} onSearch={handleSearch} />

      {loading && <p>Chargement...</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="results-info">
        {sortedData.length} resultat{sortedData.length > 1 ? 's' : ''}
        {sortConfig && ` • Trie par ${getFieldLabel(sortConfig.key)} (${sortConfig.direction === 'asc' ? 'croissant' : 'decroissant'})`}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Actions</th>
              {config.fields.filter(f => visibleColumns.includes(f.name)).map(f => (
                <th key={`h-${f.name}`} onClick={() => handleSort(f.name)}>
                  {getFieldLabel(f.name)}
                  {sortConfig?.key === f.name && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr><td colSpan={Math.max(visibleColumns.length + 1, 1)} className="no-data">Aucune donnee</td></tr>
            ) : (
              sortedData.map((item: any) => (
                <React.Fragment key={item[getIdField()]}>
                  <tr>
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => toggleReferences(item[getIdField()])} title="Liens">
                        {expandedRows.has(item[getIdField()]) ? '▼' : '🔗'}
                      </button>
                      {isSignedIn && (
                        <>
                          <button className="btn-icon" onClick={() => navigate(`/${entity}/edit/${item[getIdField()]}`)} title="Modifier">✏️</button>
                          <button className="btn-icon btn-danger" onClick={() => alert('Suppression a implementer')} title="Supprimer">🗑️</button>
                        </>
                      )}
                    </td>
                    {config.fields.filter(f => visibleColumns.includes(f.name)).map(f => (
                      <td key={f.name}>
                        {f.type === 'boolean' 
                          ? (item[f.name] ? 'Oui' : 'Non')
                          : f.name === 'spin'
                            ? formatSpin(item[f.name])
                            : item[f.name] !== null && item[f.name] !== undefined 
                              ? String(item[f.name]) 
                              : '—'
                        }
                      </td>
                    ))}
                  </tr>
                  {expandedRows.has(item[getIdField()]) && (
                    <tr className="reference-row">
                      <td colSpan={Math.max(visibleColumns.length + 1, 1)}>
                        <div className="reference-panel">
                          {loadingRefs[item[getIdField()]] ? (
                            <span>Chargement...</span>
                          ) : (
                            <>
                              <strong>Liens externes :</strong>
                              {rowReferences[item[getIdField()]]?.length > 0 ? (
                                <div className="reference-links">
                                  {rowReferences[item[getIdField()]].map((ref: any) => (
                                    <a key={ref.id_reference} href={ref.url} target="_blank" rel="noopener noreferrer" className="ref-badge">
                                      {ref.source === 'pdg' ? '📘 PDG' : ref.source}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-ref">Aucun lien externe</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntityList;