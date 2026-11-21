import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'fr' | 'en';

// Le français est la langue source : t('texte français') renvoie l'anglais en mode EN.
// Un texte absent du dictionnaire reste en français (aucune erreur).
const EN: Record<string, string> = {
  // Navigation
  'Accueil': 'Home', 'Particules': 'Particles', 'Interactions': 'Interactions', 'Groupes': 'Groups',
  'Propriétés': 'Properties', 'Règles': 'Rules', 'Processus': 'Processes', 'Menu': 'Menu',
  // Pied de page
  'SG-MSP — Modèle Standard des Particules': 'SG-MSP — Standard Model of Particles',
  'Données : Particle Data Group, Review of Particle Physics 2026 (CC BY 4.0). Certaines valeurs sont déduites ; vérifiez à la source avant tout usage scientifique.':
    'Data: Particle Data Group, Review of Particle Physics 2026 (CC BY 4.0). Some values are derived; check the source before any scientific use.',
  // Entités
  'Interactions Fondamentales': 'Fundamental Interactions', 'Processus Dynamiques': 'Dynamic Processes',
  'Propriétés Quantiques': 'Quantum Properties', 'Règles de Conservation': 'Conservation Rules',
  // Champs
  'Nom': 'Name', 'Symbole': 'Symbol', 'Masse (MeV/c²)': 'Mass (MeV/c²)', 'Spin': 'Spin', 'Charge (e)': 'Charge (e)',
  'Durée de vie (s)': 'Lifetime (s)', 'Nombre baryonique B': 'Baryon number B', 'Nombre leptonique L': 'Lepton number L',
  'Élémentaire': 'Elementary', 'PDG (fiche)': 'PDG (listing)', 'PDG (tableau)': 'PDG (table)',
  'Identifiant PDG': 'PDG identifier', 'Catégorie': 'Category', 'Génération': 'Generation',
  'Portée effective (m)': 'Effective range (m)', 'Constante de couplage': 'Coupling constant',
  'Description': 'Description', 'Spin caractéristique': 'Characteristic spin', 'Type': 'Type',
  'Énergie seuil (MeV)': 'Threshold energy (MeV)', 'Type physique': 'Physical type', 'Conservée': 'Conserved', 'Absolue': 'Absolute',
  // Accueil
  '🎯 Système de Gestion du Modèle Standard': '🎯 Standard Model Explorer',
  'Choisissez une entité à consulter': 'Choose a category to browse',
  'Chargement…': 'Loading…', '📋 Consulter': '📋 Browse',
  '📚 Ressources externes': '📚 External resources', '📘 Particle Data Group': '📘 Particle Data Group',
  '📊 Tableaux PDG 2026': '📊 PDG 2026 tables', '📚 INSPIRE HEP': '📚 INSPIRE HEP',
  'Rechercher dans la littérature (en anglais) : ex. Higgs boson mass': 'Search the literature, e.g. Higgs boson mass',
  '🔎 Chercher sur INSPIRE': '🔎 Search on INSPIRE',
  // Liste
  "← Retour à l'accueil": '← Back to home', 'Colonnes': 'Columns', 'Colonnes :': 'Columns:',
  'Chargement...': 'Loading...', 'Entite inconnue': 'Unknown category',
  'Actions': 'Actions', 'Liens': 'Links', 'Oui': 'Yes', 'Non': 'No',
  'Aucune donnee': 'No data', 'Aucune donnee (API en cours de reveil ?)': 'No data (the server may be waking up)',
  'Endpoint non encore implemente': 'Not available yet',
  "Erreur de connexion a l'API (cold start possible)": 'Could not reach the server (it may be waking up: try again in 30 s)',
  'Liens externes :': 'External links:', 'Aucun lien externe': 'No external link',
  'Tous': 'All', 'Fermions fond.': 'Fund. fermions', 'Bosons fond.': 'Fund. bosons',
  'Mesons': 'Mesons', 'Baryons': 'Baryons', 'Leptons': 'Leptons', 'Quarks': 'Quarks', 'Fermions': 'Fermions', 'Bosons': 'Bosons',
  // Requêtes
  '🔍 Critères de sélection': '🔍 Search criteria', 'ET': 'AND', 'OU': 'OR', '-- Choisir --': '-- Choose --',
  'Valeur...': 'Value...', 'Valeur 2...': 'Value 2...', 'Supprimer ce critère': 'Remove this criterion',
  '+ Ajouter un critère': '+ Add a criterion', '🔍 Rechercher': '🔍 Search', '↺ Réinitialiser': '↺ Reset',
  // Fiche
  '← Retour aux particules': '← Back to particles', 'Particule introuvable': 'Particle not found',
  'Masse': 'Mass', 'Durée de vie': 'Lifetime', '— (stable ou non renseignée)': '— (stable or not available)',
  'Nature': 'Nature', 'Composite': 'Composite', 'Groupe': 'Group', 'Catégorie PDG': 'PDG category',
  'Composition :': 'Composition:', 'Antiparticule :': 'Antiparticle:',
  'elle-même (particule identique à son antiparticule)': 'itself (the particle is its own antiparticle)',
  'non renseignée': 'not available',
  '📘 PDG (fiche)': '📘 PDG (listing)', '📘 PDG (tableau)': '📘 PDG (table)',
  '📚 INSPIRE (revues)': '📚 INSPIRE (reviews)', '🔎 INSPIRE (articles)': '🔎 INSPIRE (papers)',
  'Articles de synthèse les plus cités': 'Most cited review articles',
  "Tous les articles, les plus cités d'abord": 'All papers, most cited first',
  // Groupes
  'quark': 'quark', 'lepton': 'lepton', 'boson_jauge': 'gauge boson', 'boson_higgs': 'Higgs boson', 'hadron': 'hadron',
  // Particules concernées
  'Particules concernées': 'Particles involved', 'Médiateur(s) :': 'Mediator(s):',
  'Toutes les particules': 'All particles', 'hypothétique': 'hypothetical', 'réduire': 'collapse', 'autres': 'more',
  'Presque toutes les particules': 'Almost all particles', 'Tous les processus': 'All processes',
  'Processus concernés': 'Processes involved', 'Règles respectées': 'Rules obeyed',
  // Contenu de la base (interactions, groupes, propriétés, règles, processus)
  'Interaction forte': 'Strong interaction', 'Interaction électromagnétique': 'Electromagnetic interaction',
  'Interaction faible': 'Weak interaction', 'Interaction gravitationnelle': 'Gravitational interaction',
  'Fermions fondamentaux de charge fractionnaire': 'Fundamental fermions with fractional charge',
  'Fermions fondamentaux (chargés et neutrinos)': 'Fundamental fermions (charged leptons and neutrinos)',
  'Bosons vecteurs médiateurs des interactions': 'Vector bosons that mediate the interactions',
  'Boson scalaire responsable de la masse': 'Scalar boson responsible for mass',
  'Particules composites de quarks et gluons': 'Composite particles made of quarks and gluons',
  'Charge electrique': 'Electric charge', 'Nombre baryonique': 'Baryon number',
  'Nombre leptonique': 'Lepton number', 'Etrangete': 'Strangeness', 'Charme': 'Charm', 'Beaute': 'Beauty',
  'Saveur': 'Flavour', 'Couleur': 'Colour', 'Isospin': 'Isospin', 'Parite': 'Parity', 'Moment magnetique': 'Magnetic moment',
  'scalaire': 'scalar', 'vecteur': 'vector', 'discret': 'discrete',
  'nombre_baryonique': 'Baryon number', 'nombre_leptonique': 'Lepton number', 'charge_electrique': 'Electric charge',
  'energie': 'Energy', 'impulsion': 'Momentum', 'parite': 'Parity',
  'Desintegration beta-': 'Beta-minus decay', 'Desintegration beta+': 'Beta-plus decay', 'Capture electronique': 'Electron capture',
  'Annihilation e+e-': 'e+e- annihilation', 'Creation de paires': 'Pair production', 'Diffusion elastique': 'Elastic scattering',
  'Desintegration alpha': 'Alpha decay', 'Fusion nucleaire': 'Nuclear fusion', 'Desintegration hadronique': 'Hadronic decay',
  'Oscillation neutrino': 'Neutrino oscillation',
  'desintegration': 'decay', 'annihilation': 'annihilation', 'creation_paires': 'pair production', 'diffusion': 'scattering', 'oscillation': 'oscillation',
  // Langue
  'English': 'English', 'Français': 'Français',
};

// Libellés français lisibles pour les identifiants de la base (sans accents ni underscores)
const FR_AFFICHAGE: Record<string, string> = {
  'nombre_baryonique': 'Nombre baryonique', 'nombre_leptonique': 'Nombre leptonique', 'charge_electrique': 'Charge électrique',
  'energie': 'Énergie', 'impulsion': 'Impulsion', 'parite': 'Parité',
  'Charge electrique': 'Charge électrique', 'Etrangete': 'Étrangeté', 'Beaute': 'Beauté', 'Parite': 'Parité',
  'Moment magnetique': 'Moment magnétique',
  'Desintegration beta-': 'Désintégration β⁻', 'Desintegration beta+': 'Désintégration β⁺', 'Capture electronique': 'Capture électronique',
  'Annihilation e+e-': 'Annihilation e⁺e⁻', 'Creation de paires': 'Création de paires', 'Diffusion elastique': 'Diffusion élastique',
  'Desintegration alpha': 'Désintégration α', 'Fusion nucleaire': 'Fusion nucléaire', 'Desintegration hadronique': 'Désintégration hadronique',
  'Oscillation neutrino': 'Oscillation de neutrinos',
  'desintegration': 'désintégration', 'creation_paires': 'création de paires',
  'boson_jauge': 'boson de jauge', 'boson_higgs': 'boson de Higgs',
};

// Noms de particules : la base est en français, on affiche l'anglais si demandé
const NOM_EN: Record<string, string> = {
  'quark up': 'up quark', 'quark down': 'down quark', 'quark charm': 'charm quark',
  'quark strange': 'strange quark', 'quark top': 'top quark', 'quark bottom': 'bottom quark',
  'electron': 'electron', 'muon': 'muon', 'tau': 'tau lepton',
  'neutrino électron': 'electron neutrino', 'neutrino muon': 'muon neutrino', 'neutrino tau': 'tau neutrino',
  'photon': 'photon', 'gluon': 'gluon', 'boson Z': 'Z boson', 'boson W': 'W boson',
  'boson de Higgs': 'Higgs boson', 'proton': 'proton', 'neutron': 'neutron', 'graviton': 'graviton',
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
  nom: (n: string) => string;
}

const LangContext = createContext<Ctx>({ lang: 'fr', setLang: () => {}, t: (s) => s, nom: (n) => n });

const langInitiale = (): Lang => {
  try {
    const m = localStorage.getItem('lang');
    if (m === 'fr' || m === 'en') return m;
  } catch (e) { /* stockage indisponible */ }
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
};

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(langInitiale);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch (e) { /* ignoré */ }
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = (s: string) => (lang === 'en' ? EN[s] ?? s : FR_AFFICHAGE[s] ?? s);
  const nom = (n: string) => (lang === 'en' ? NOM_EN[n] ?? n : n);
  return <LangContext.Provider value={{ lang, setLang, t, nom }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
