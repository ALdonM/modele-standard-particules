import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { ENTITY_CONFIGS, EntityType, FilterCriterion } from '../types';
import { api } from '../api';
import QueryBuilder from './QueryBuilder';
import { inspireRevues, inspireRecherche, termeInspireEntite } from '../externalLinks';

const formatSpin = (val: any) => {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  if (Number.isInteger(n)) return String(n);
  return `${Math.round(n * 2)}/2`;
};

const formatCharge = (val: any) => {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  if (n === 0) return '0';
  const s = n > 0 ? '+' : '-';
  const a = Math.abs(n);
  if (Math.abs(a - 1 / 3) < 0.002) return `${s}1/3`;
  if (Math.abs(a - 2 / 3) < 0.002) return `${s}2/3`;
  return `${s}${a}`;
};

const EntityList: React.FC = () => {
  const { entity } = useParams<{ entity: EntityType }>();
  const navigate = useNavigate();
  const config = entity ? ENTITY_CONFIGS[entity] : null;
  const { t, nom, lang } = useLang();

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

  // Particules concernées par chaque ligne (groupes, interactions, propriétés, règles, processus)
  const [concerned, setConcerned] = useState<Record<string, any>>({});
  const [loadingConcerned, setLoadingConcerned] = useState(false);
  const [openCells, setOpenCells] = useState<Set<string>>(new Set());
  const MAX_VISIBLES = 8;

  // Chargement simple sans useCallback ni useRef
  useEffect(() => {
    if (!config) return;
    setVisibleColumns(config.fields.filter(f => !f.hidden).map(f => f.name));
    setLoading(true);
    setError('');
    api.get(config.endpoint)
      .then(response => {
        setData(response.data);
        setFilteredData(response.data);
      })
      .catch((err: any) => {
        setError(err.response?.status === 404 
          ? t('Endpoint non encore implemente') 
          : t("Erreur de connexion a l'API (cold start possible)")
        );
      })
      .finally(() => setLoading(false));
  }, [entity, config]);

  useEffect(() => {
    setConcerned({});
    setOpenCells(new Set());
    if (!entity || entity === 'particules') return;
    setLoadingConcerned(true);
    api.get(`/entites/${entity}/particules`)
      .then(r => setConcerned(r.data))
      .catch(() => setConcerned({}))
      .finally(() => setLoadingConcerned(false));
  }, [entity]);

  const applyChip = (chip: string, rawData: any[]) => {
    setActiveChip(chip);
    if (chip === 'Tous') return rawData;
    if (chip === 'Fermions') return rawData.filter((p: any) => p.spin !== null && p.spin !== undefined && p.spin % 1 !== 0);
    if (chip === 'Bosons') return rawData.filter((p: any) => p.spin !== null && p.spin !== undefined && p.spin % 1 === 0);
    // Les groupes viennent de l'API (v0.2.0) : p.groupes = ['quark'], ['lepton'], ['boson_jauge'], ['hadron']...
    const inGroup = (p: any, ...names: string[]) => (p.groupes || []).some((g: string) => names.includes(g));
    if (chip === 'Fermions fond.') return rawData.filter((p: any) => inGroup(p, 'quark', 'lepton'));
    if (chip === 'Bosons fond.') return rawData.filter((p: any) => inGroup(p, 'boson_jauge', 'boson_higgs'));
    if (chip === 'Leptons') return rawData.filter((p: any) => inGroup(p, 'lepton'));
    if (chip === 'Quarks') return rawData.filter((p: any) => inGroup(p, 'quark'));
    if (chip === 'Mesons') return rawData.filter((p: any) => inGroup(p, 'hadron') && (p.nombre_baryonique_B || 0) === 0);
    if (chip === 'Baryons') return rawData.filter((p: any) => inGroup(p, 'hadron') && (p.nombre_baryonique_B || 0) !== 0);
    return rawData;
  };

  const chips = ['Tous', 'Fermions', 'Fermions fond.', 'Bosons', 'Bosons fond.', 'Leptons', 'Quarks', 'Mesons', 'Baryons'];

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

  // Ascenseur horizontal en haut du tableau, synchronisé avec celui du bas
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  useEffect(() => {
    const mesurer = () => {
      if (tableScrollRef.current) setTableScrollWidth(tableScrollRef.current.scrollWidth);
    };
    mesurer();
    window.addEventListener('resize', mesurer);
    return () => window.removeEventListener('resize', mesurer);
  }, [sortedData, visibleColumns, showColumnsPanel, expandedRows]);

  const toggleColumn = (fieldName: string) => {
    setVisibleColumns(prev => prev.includes(fieldName) ? prev.filter(c => c !== fieldName) : [...prev, fieldName]);
  };

  const getFieldLabel = (name: string) => t(config?.fields.find(f => f.name === name)?.label || name);

  const getIdField = () => {
    if (entity === 'particules') return 'id_particule';
    if (entity === 'interactions') return 'id_interaction';
    if (entity === 'groupes') return 'id_groupe';
    if (entity === 'processus') return 'id_processus';
    if (entity === 'proprietes') return 'id_propriete';
    if (entity === 'regles') return 'id_regle';
    return 'id';
  };

  // Terme de recherche INSPIRE d'une ligne (interactions, groupes, propriétés, règles, processus)
  const termeEntite = (item: any): string | undefined => {
    const nomLigne =
      entity === 'interactions' ? item.nom_interaction :
      entity === 'groupes' ? item.nom_groupe :
      entity === 'proprietes' ? item.nom_propriete :
      entity === 'regles' ? item.nom_regle :
      entity === 'processus' ? item.nom_processus : undefined;
    return nomLigne ? termeInspireEntite(nomLigne) : undefined;
  };

  // Étiquette d'un lien stocké en base : le titre quand il existe
  const libelleRef = (ref: any) =>
    ref.libelle
      ? (ref.source === 'pdg' ? `📘 PDG : ${ref.libelle}` : `🎓 ${ref.libelle}`)
      : (ref.source === 'pdg' ? '📘 PDG' : ref.source);

  const lienParticule = (p: any, i: number) => (
    <a key={`${p.id}-${p.role || ''}-${i}`} href={`/particules/fiche/${p.id}`}
       onClick={(ev) => { ev.preventDefault(); navigate(`/particules/fiche/${p.id}`); }}
       title={p.symbole || ''}
       style={{ color: '#1565c0', textDecoration: 'none' }}>
      {nom(p.nom)}{p.hypothetique ? ` (${t('hypothétique')})` : ''}
    </a>
  );

  const joindre = (liste: any[], sep: string) => {
    const out: React.ReactNode[] = [];
    liste.forEach((p: any, i: number) => {
      if (i > 0) out.push(<span key={`sep-${i}`}>{sep}</span>);
      out.push(lienParticule(p, i));
    });
    return out;
  };

  const basculer = (cle: string) => {
    setOpenCells(prev => {
      const n = new Set(prev);
      if (n.has(cle)) n.delete(cle); else n.add(cle);
      return n;
    });
  };

  const critere = (info: any) => {
    const txt = lang === 'en' ? info.critere_en : info.critere_fr;
    return txt
      ? <div key="critere" style={{ fontSize: '0.8em', color: '#757575', marginTop: 4 }}>{txt}</div>
      : null;
  };

  // Identifiants techniques de la base (nombre_baryonique, boson_jauge) rendus lisibles par t()
  const libelleRegle = (n: string) => t(n);
  const libelleGroupe = (n: string) => t(n);

  const renderConcernees = (item: any) => {
    const cle = String(item[getIdField()]);
    const info = concerned[cle];
    if (!info) return loadingConcerned ? '…' : '—';
    const lignes: React.ReactNode[] = [];
    if (info.mediateurs && info.mediateurs.length > 0) {
      lignes.push(
        <div key="med" style={{ marginBottom: 4 }}>
          <strong>{t('Médiateur(s) :')}</strong> {joindre(info.mediateurs, ', ')}
        </div>
      );
    }
    if (info.mode === 'toutes') {
      lignes.push(<div key="all">{t('Toutes les particules')}</div>);
    } else if (info.mode === 'presque') {
      lignes.push(<div key="presque">{t('Presque toutes les particules')} ({info.total}/{info.sur})</div>);
    } else if (entity === 'processus') {
      const entrants = info.particules.filter((p: any) => p.role === 'entrant');
      const sortants = info.particules.filter((p: any) => p.role === 'sortant');
      const mediateurs = info.particules.filter((p: any) => p.role === 'medicateur');
      if (entrants.length > 0 || sortants.length > 0) {
        lignes.push(<div key="reaction">{joindre(entrants, ' + ')} → {joindre(sortants, ' + ')}</div>);
      }
      if (mediateurs.length > 0) {
        lignes.push(
          <div key="mediateurs" style={{ marginTop: 2 }}>
            <strong>{t('Médiateur(s) :')}</strong> {joindre(mediateurs, ', ')}
          </div>
        );
      }
    } else if (info.particules.length > 0) {
      const ouvert = openCells.has(cle);
      const visibles = ouvert ? info.particules : info.particules.slice(0, MAX_VISIBLES);
      const reste = info.particules.length - MAX_VISIBLES;
      lignes.push(
        <div key="liste" style={ouvert ? { maxHeight: 220, overflowY: 'auto' } : undefined}>
          {joindre(visibles, ', ')}
        </div>
      );
      if (reste > 0) {
        lignes.push(
          <button key="toggle" onClick={() => basculer(cle)}
                  style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', padding: '2px 0' }}>
            {ouvert ? t('réduire') : `+${reste} ${t('autres')} (${info.particules.length})`}
          </button>
        );
      }
    }
    if (lignes.length === 0) lignes.push(<div key="vide">—</div>);
    lignes.push(critere(info));
    return <div style={{ minWidth: 240 }}>{lignes}</div>;
  };

  // Règles : les processus qui les respectent
  const renderProcessus = (item: any) => {
    const info = concerned[String(item[getIdField()])];
    if (!info) return loadingConcerned ? '…' : '—';
    return (
      <div style={{ minWidth: 240 }}>
        <div>
          {info.mode === 'tous'
            ? t('Tous les processus')
            : info.processus.length > 0 ? info.processus.map((x: any) => t(x.nom)).join(', ') : '—'}
        </div>
        {critere(info)}
      </div>
    );
  };

  // Processus : les règles qu'ils respectent
  const renderRegles = (item: any) => {
    const info = concerned[String(item[getIdField()])];
    if (!info) return loadingConcerned ? '…' : '—';
    const regles = info.regles || [];
    return <div style={{ minWidth: 200 }}>{regles.length > 0 ? regles.map((x: any) => libelleRegle(x.nom)).join(', ') : '—'}</div>;
  };

  const colonnesSup: { label: string; render: (item: any) => React.ReactNode }[] =
    entity === 'particules' ? [] :
    entity === 'regles' ? [{ label: 'Processus concernés', render: renderProcessus }] :
    entity === 'processus' ? [
      { label: 'Particules concernées', render: renderConcernees },
      { label: 'Règles respectées', render: renderRegles },
    ] :
    [{ label: 'Particules concernées', render: renderConcernees }];

  if (!config) return <div className="entity-list"><h2>{t('Entite inconnue')}</h2></div>;

  return (
    <div className="entity-list">
      <button className="back-link" onClick={() => navigate('/')}>{t("← Retour à l'accueil")}</button>
      <h2>{config.icon} {t(config.label)}</h2>
      
      <div className="list-toolbar">
        <button className="btn btn-secondary" onClick={() => setShowColumnsPanel(!showColumnsPanel)}>
          {t('Colonnes')}
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
              {t(chip)}
            </button>
          ))}
        </div>
      )}

      {showColumnsPanel && (
        <div className="columns-panel">
          <strong>{t('Colonnes :')}</strong>
          {config.fields.map(f => (
            <label key={f.name} className="column-checkbox">
              <input type="checkbox" checked={visibleColumns.includes(f.name)} onChange={() => toggleColumn(f.name)} />
              {t(f.label)}
            </label>
          ))}
        </div>
      )}

      <QueryBuilder fields={config.fields} onSearch={handleSearch} />

      {loading && <p>{t('Chargement...')}</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="results-info">
        {sortedData.length} {lang === 'en' ? (sortedData.length > 1 ? 'results' : 'result') : (sortedData.length > 1 ? 'resultats' : 'resultat')}
        {sortConfig && (lang === 'en'
          ? ` • Sorted by ${getFieldLabel(sortConfig.key)} (${sortConfig.direction === 'asc' ? 'ascending' : 'descending'})`
          : ` • Trie par ${getFieldLabel(sortConfig.key)} (${sortConfig.direction === 'asc' ? 'croissant' : 'decroissant'})`)}
      </div>

      <div
        ref={topScrollRef}
        onScroll={(ev) => { if (tableScrollRef.current) tableScrollRef.current.scrollLeft = ev.currentTarget.scrollLeft; }}
        style={{ overflowX: 'auto', overflowY: 'hidden' }}
        aria-hidden="true"
      >
        <div style={{ width: tableScrollWidth, height: 1 }} />
      </div>

      <div
        className="table-container"
        ref={tableScrollRef}
        onScroll={(ev) => { if (topScrollRef.current) topScrollRef.current.scrollLeft = ev.currentTarget.scrollLeft; }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('Actions')}</th>
              {config.fields.filter(f => visibleColumns.includes(f.name)).map(f => (
                <th key={`h-${f.name}`} onClick={() => handleSort(f.name)}>
                  {getFieldLabel(f.name)}
                  {sortConfig?.key === f.name && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              {colonnesSup.map(c => <th key={c.label}>{t(c.label)}</th>)}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr><td colSpan={Math.max(visibleColumns.length + 1 + colonnesSup.length, 1)} className="no-data">
                {data.length === 0 && !loading ? t('Aucune donnee (API en cours de reveil ?)') : t('Aucune donnee')}
              </td></tr>
            ) : (
              sortedData.map((item: any) => (
                <React.Fragment key={item[getIdField()]}>
                  <tr>
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => toggleReferences(item[getIdField()])} title={t('Liens')}>
                        {expandedRows.has(item[getIdField()]) ? '▼' : '🔗'}
                      </button>
                    </td>
                    {config.fields.filter(f => visibleColumns.includes(f.name)).map(f => (
                      <td key={f.name}>
                        {f.type === 'boolean' 
                          ? (item[f.name] ? t('Oui') : t('Non'))
                          : f.type === 'link'
                            ? (item[f.name]
                                ? <a href={item[f.name]} target="_blank" rel="noopener noreferrer" className="ref-badge">📘 PDG</a>
                                : '—')
                          : entity === 'particules' && f.name === 'nom_particule'
                            ? <a href={`/particules/fiche/${item.id_particule}`}
                                 onClick={(ev) => { ev.preventDefault(); navigate(`/particules/fiche/${item.id_particule}`); }}
                                 style={{ color: '#1565c0', textDecoration: 'none', fontWeight: 500 }}>{nom(item[f.name])}</a>
                          : entity === 'regles' && f.name === 'nom_regle'
                            ? libelleRegle(String(item[f.name]))
                          : entity === 'groupes' && f.name === 'nom_groupe'
                            ? libelleGroupe(String(item[f.name]))
                          : f.name === 'spin'
                            ? formatSpin(item[f.name])
                          : f.name === 'masse_mev' && item[f.name] !== null && item[f.name] !== undefined
                            ? String(Number(Number(item[f.name]).toPrecision(10)))
                          : f.name === 'charge_e'
                            ? formatCharge(item[f.name])
                            : item[f.name] !== null && item[f.name] !== undefined 
                              ? (entity === 'particules' ? String(item[f.name]) : t(String(item[f.name])))
                              : '—'
                        }
                      </td>
                    ))}
                    {colonnesSup.map(c => <td key={c.label}>{c.render(item)}</td>)}
                  </tr>
                  {expandedRows.has(item[getIdField()]) && (
                    <tr className="reference-row">
                      <td colSpan={Math.max(visibleColumns.length + 1 + colonnesSup.length, 1)}>
                        <div className="reference-panel">
                          {loadingRefs[item[getIdField()]] ? (
                            <span>{t('Chargement...')}</span>
                          ) : (
                            <>
                              <strong>{t('Liens externes :')}</strong>
                              {(rowReferences[item[getIdField()]]?.length > 0 || termeEntite(item)) ? (
                                <>
                                  <div className="reference-links">
                                    {(rowReferences[item[getIdField()]] || []).map((ref: any) => (
                                      <a key={ref.id_reference} href={ref.url} target="_blank" rel="noopener noreferrer" className="ref-badge">
                                        {libelleRef(ref)}
                                      </a>
                                    ))}
                                    {termeEntite(item) && (
                                      <>
                                        <a className="ref-badge" href={inspireRevues(termeEntite(item) as string)} target="_blank" rel="noopener noreferrer" title={t('Articles de synthèse les plus cités')}>{t('📚 INSPIRE (revues)')}</a>
                                        <a className="ref-badge" href={inspireRecherche(termeEntite(item) as string)} target="_blank" rel="noopener noreferrer" title={t("Tous les articles, les plus cités d'abord")}>{t('🔎 INSPIRE (articles)')}</a>
                                      </>
                                    )}
                                  </div>
                                  {entity !== 'particules' && (
                                    <div style={{ fontSize: '0.8em', color: '#757575', marginTop: 4 }}>{t('Les sources externes sont en anglais.')}</div>
                                  )}
                                </>
                              ) : (
                                <span className="no-ref">{t('Aucun lien externe')}</span>
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
