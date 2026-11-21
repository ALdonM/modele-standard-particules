// Liens externes construits dynamiquement (rien n'est stocké en base)

// Les noms de la base sont en français ; INSPIRE est en anglais.
const NOM_EN: Record<string, string> = {
  'quark up': 'up quark', 'quark down': 'down quark', 'quark charm': 'charm quark',
  'quark strange': 'strange quark', 'quark top': 'top quark', 'quark bottom': 'bottom quark',
  'electron': 'electron', 'muon': 'muon', 'tau': 'tau lepton',
  'neutrino électron': 'electron neutrino', 'neutrino muon': 'muon neutrino', 'neutrino tau': 'tau neutrino',
  'photon': 'photon', 'gluon': 'gluon', 'boson Z': 'Z boson', 'boson W': 'W boson',
  'boson de Higgs': 'Higgs boson', 'proton': 'proton', 'neutron': 'neutron', 'graviton': 'graviton',
  'positron': 'positron', 'antimuon': 'antimuon', 'antitau': 'antitau',
  'antineutrino électron': 'electron antineutrino', 'antineutrino muon': 'muon antineutrino', 'antineutrino tau': 'tau antineutrino',
  'antiquark up': 'up antiquark', 'antiquark down': 'down antiquark', 'antiquark charm': 'charm antiquark',
  'antiquark strange': 'strange antiquark', 'antiquark top': 'top antiquark', 'antiquark bottom': 'bottom antiquark',
  'antiproton': 'antiproton', 'antineutron': 'antineutron', 'boson W+': 'W+ boson', 'boson W-': 'W- boson',
};

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const termeAnglais = (nom: string) => NOM_EN[nom] ?? sansAccents(nom);

// Revues de synthèse les plus citées sur le sujet
export const inspireRevues = (terme: string) =>
  `https://inspirehep.net/literature?sort=mostcited&size=25&page=1&q=${encodeURIComponent(`t "${terme}" and tc review`)}`;

// Tous types de documents, les plus cités d'abord
export const inspireRecherche = (terme: string) =>
  `https://inspirehep.net/literature?sort=mostcited&size=25&page=1&q=${encodeURIComponent(terme)}`;

// Termes anglais de recherche INSPIRE pour les autres entités (clés = valeurs stockées en base)
const TERMES_ENTITE: Record<string, string> = {
  // Interactions
  'Interaction forte': 'strong interaction', 'Interaction électromagnétique': 'electromagnetic interaction',
  'Interaction faible': 'weak interaction', 'Interaction gravitationnelle': 'gravity',
  // Groupes
  'quark': 'quark', 'lepton': 'lepton', 'boson_jauge': 'gauge boson', 'boson_higgs': 'Higgs boson', 'hadron': 'hadron',
  // Propriétés
  'Charge electrique': 'electric charge', 'Spin': 'spin', 'Nombre baryonique': 'baryon number',
  'Nombre leptonique': 'lepton number', 'Etrangete': 'strangeness', 'Charme': 'charm', 'Beaute': 'beauty',
  'Saveur': 'flavor', 'Couleur': 'color', 'Isospin': 'isospin', 'Parite': 'parity', 'Moment magnetique': 'magnetic moment',
  // Règles
  'nombre_baryonique': 'baryon number', 'nombre_leptonique': 'lepton number', 'charge_electrique': 'conservation laws',
  'energie': 'conservation laws', 'impulsion': 'conservation laws', 'parite': 'parity violation',
  // Processus
  'Desintegration beta-': 'beta decay', 'Desintegration beta+': 'beta decay', 'Capture electronique': 'electron capture',
  'Annihilation e+e-': 'electron-positron annihilation', 'Creation de paires': 'pair production',
  'Diffusion elastique': 'elastic scattering', 'Desintegration alpha': 'alpha decay', 'Fusion nucleaire': 'nuclear fusion',
  'Desintegration hadronique': 'hadronic decay', 'Oscillation neutrino': 'neutrino oscillation',
};

export const termeInspireEntite = (nom: string): string | undefined => TERMES_ENTITE[nom];
