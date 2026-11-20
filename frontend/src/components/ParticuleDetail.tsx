import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';
import { termeAnglais, inspireRevues, inspireRecherche } from '../externalLinks';

interface Constituant {
  id_particule: number;
  nom_particule: string;
  symbole: string;
  nombre_constituants: number;
  type_hadron?: string;
}

interface Fiche {
  particule: {
    id_particule: number;
    nom_particule: string;
    symbole: string;
    masse_mev?: number | null;
    spin?: number | null;
    charge_e?: number | null;
    duree_vie_s?: number | null;
    nombre_baryonique_B: number;
    nombre_leptonique_L: number;
    est_elementaire: boolean;
    pdg_id?: string | null;
    categorie?: string | null;
    lien_pdg_listing?: string | null;
    lien_pdg_table?: string | null;
    groupes?: string[];
    generation?: number | null;
    composition?: string | null;
  };
  antiparticule: { id_particule: number; nom_particule: string; symbole: string; type_lien: string } | null;
  constituants: Constituant[];
  references: { id_reference: number; source: string; url: string }[];
}

const formatSpin = (v?: number | null) => {
  if (v === null || v === undefined) return '—';
  if (Number.isInteger(v)) return String(v);
  return `${Math.round(v * 2)}/2`;
};

// 0.667 -> +2/3 ; -0.333 -> -1/3 ; 1 -> +1
const formatCharge = (v?: number | null) => {
  if (v === null || v === undefined) return '—';
  if (v === 0) return '0';
  const signe = v > 0 ? '+' : '-';
  const a = Math.abs(v);
  if (Math.abs(a - 1 / 3) < 0.002) return `${signe}1/3`;
  if (Math.abs(a - 2 / 3) < 0.002) return `${signe}2/3`;
  return `${signe}${a}`;
};

const formatMasse = (v?: number | null) => {
  if (v === null || v === undefined) return '—';
  return `${v} MeV/c²`;
};

// 2.6376e-25 -> « 2,64 × 10⁻²⁵ s » (virgule en français)
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const formatDuree = (v: number, fr: boolean) => {
  if (v === 0) return '0 s';
  const [m, e] = v.toExponential(2).split('e');
  const exp = String(parseInt(e, 10)).split('').map(c => SUP[c] ?? c).join('');
  const mant = Number(m);
  const mantTxt = fr ? String(mant).replace('.', ',') : String(mant);
  return exp === '⁰' ? `${mantTxt} s` : `${mantTxt} × 10${exp} s`;
};

const formatBaryonique = (v: number) => {
  if (Math.abs(v - 1 / 3) < 0.002) return '+1/3';
  if (Math.abs(v + 1 / 3) < 0.002) return '-1/3';
  return String(v);
};

const ParticuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, nom, lang } = useLang();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/particules/${id}/fiche`)
      .then(r => setFiche(r.data))
      .catch((err: any) =>
        setError(err.response?.status === 404 ? 'Particule introuvable' : "Erreur de connexion a l'API (cold start possible)")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const msgErreur = (m: string) => t(m);

  if (loading) return <div className="entity-list"><p>{t('Chargement...')}</p></div>;
  if (error || !fiche) {
    return (
      <div className="entity-list">
        <button className="back-link" onClick={() => navigate('/particules/list')}>{t('← Retour aux particules')}</button>
        <p className="error-msg">{msgErreur(error)}</p>
      </div>
    );
  }

  const p = fiche.particule;
  const lignes: [string, React.ReactNode][] = [
    [t('Masse'), formatMasse(p.masse_mev)],
    [t('Spin'), formatSpin(p.spin)],
    [t('Charge (e)'), formatCharge(p.charge_e)],
    [t('Durée de vie'), p.duree_vie_s !== null && p.duree_vie_s !== undefined ? formatDuree(p.duree_vie_s, lang === 'fr') : t('— (stable ou non renseignée)')],
    [t('Nombre baryonique B'), formatBaryonique(p.nombre_baryonique_B)],
    [t('Nombre leptonique L'), String(p.nombre_leptonique_L)],
    [t('Nature'), p.est_elementaire ? t('Élémentaire') : t('Composite')],
    [t('Groupe'), p.groupes && p.groupes.length > 0 ? p.groupes.map(g => (lang === 'fr' && g === 'boson_jauge' ? 'boson de jauge' : lang === 'fr' && g === 'boson_higgs' ? 'boson de Higgs' : t(g))).join(', ') : '—'],
    [t('Génération'), p.generation ? String(p.generation) : '—'],
    [t('Catégorie PDG'), p.categorie || '—'],
    [t('Identifiant PDG'), p.pdg_id || '—'],
  ];

  const lienAnti = fiche.antiparticule;

  return (
    <div className="entity-list">
      <button className="back-link" onClick={() => navigate('/particules/list')}>{t('← Retour aux particules')}</button>
      <h2>⚛️ {nom(p.nom_particule)} <span style={{ color: '#78909c', fontWeight: 400 }}>({p.symbole})</span></h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', margin: '1rem 0' }}>
        {lignes.map(([label, valeur]) => (
          <div key={label} style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#666' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{valeur}</div>
          </div>
        ))}
      </div>

      {fiche.constituants.length > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <strong>{t('Composition :')}</strong>{' '}
          {fiche.constituants.map(c => (
            <button
              key={c.id_particule}
              className="chip"
              style={{ margin: '0 0.4rem 0.3rem 0' }}
              onClick={() => navigate(`/particules/fiche/${c.id_particule}`)}
              title={nom(c.nom_particule)}
            >
              {c.nombre_constituants > 1 ? `${c.nombre_constituants} × ` : ''}{nom(c.nom_particule)}
            </button>
          ))}
          {p.composition && <span style={{ color: '#666', marginLeft: '0.5rem' }}>({p.composition})</span>}
        </div>
      )}

      <div style={{ margin: '1rem 0' }}>
        <strong>{t('Antiparticule :')}</strong>{' '}
        {lienAnti ? (
          lienAnti.type_lien === 'identique' ? (
            <span>{t('elle-même (particule identique à son antiparticule)')}</span>
          ) : (
            <button className="chip" onClick={() => navigate(`/particules/fiche/${lienAnti.id_particule}`)}>
              {nom(lienAnti.nom_particule)}
            </button>
          )
        ) : (
          <span className="no-ref">{t('non renseignée')}</span>
        )}
      </div>

      <div style={{ margin: '1rem 0' }}>
        <strong>{t('Liens externes :')}</strong>
        <div className="reference-links" style={{ marginTop: '0.4rem' }}>
          {p.lien_pdg_listing && <a className="ref-badge" href={p.lien_pdg_listing} target="_blank" rel="noopener noreferrer">{t('📘 PDG (fiche)')}</a>}
          {p.lien_pdg_table && <a className="ref-badge" href={p.lien_pdg_table} target="_blank" rel="noopener noreferrer">{t('📘 PDG (tableau)')}</a>}
          {fiche.references
            .filter(r => r.url && r.url !== p.lien_pdg_listing && r.url !== p.lien_pdg_table)
            .map(r => (
              <a key={r.id_reference} className="ref-badge" href={r.url} target="_blank" rel="noopener noreferrer">
                {r.source === 'pdg' ? '📘 PDG' : r.source}
              </a>
            ))}
          <a className="ref-badge" href={inspireRevues(termeAnglais(p.nom_particule))} target="_blank" rel="noopener noreferrer" title={t('Articles de synthèse les plus cités')}>{t('📚 INSPIRE (revues)')}</a>
          <a className="ref-badge" href={inspireRecherche(termeAnglais(p.nom_particule))} target="_blank" rel="noopener noreferrer" title={t("Tous les articles, les plus cités d'abord")}>{t('🔎 INSPIRE (articles)')}</a>
        </div>
      </div>
    </div>
  );
};

export default ParticuleDetail;
