// Liens externes construits dynamiquement (rien n'est stocké en base)

// Les noms de la base sont en français ; INSPIRE est en anglais.
const NOM_EN: Record<string, string> = {
  'quark up': 'up quark', 'quark down': 'down quark', 'quark charm': 'charm quark',
  'quark strange': 'strange quark', 'quark top': 'top quark', 'quark bottom': 'bottom quark',
  'electron': 'electron', 'muon': 'muon', 'tau': 'tau lepton',
  'neutrino électron': 'electron neutrino', 'neutrino muon': 'muon neutrino', 'neutrino tau': 'tau neutrino',
  'photon': 'photon', 'gluon': 'gluon', 'boson Z': 'Z boson', 'boson W': 'W boson',
  'boson de Higgs': 'Higgs boson', 'proton': 'proton', 'neutron': 'neutron', 'graviton': 'graviton',
};

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const termeAnglais = (nom: string) => NOM_EN[nom] ?? sansAccents(nom);

// Revues de synthèse les plus citées sur le sujet
export const inspireRevues = (terme: string) =>
  `https://inspirehep.net/literature?sort=mostcited&size=25&page=1&q=${encodeURIComponent(`t "${terme}" and tc review`)}`;

// Tous types de documents, les plus cités d'abord
export const inspireRecherche = (terme: string) =>
  `https://inspirehep.net/literature?sort=mostcited&size=25&page=1&q=${encodeURIComponent(terme)}`;
