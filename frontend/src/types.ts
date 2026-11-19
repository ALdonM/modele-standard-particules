export interface Particule {
  id_particule: number;
  nom_particule: string;
  symbole: string;
  masse_mev?: number;
  spin?: number;
  charge_e?: number;
  duree_vie_s?: number;
  nombre_baryonique_B: number;
  nombre_leptonique_L: number;
  est_elementaire: boolean;
  est_actif?: boolean;
  date_creation?: string;
  pdg_id?: string;
  categorie?: string;
  lien_pdg_listing?: string;
  lien_pdg_table?: string;
  groupes?: string[];
  generation?: number;
  id_antiparticule?: number;
  type_antiparticule?: string;
}

export interface Groupe {
  id_groupe: number;
  nom_groupe: string;
  description?: string;
  spin_caracteristique?: number;
}

export interface Interaction {
  id_interaction: number;
  nom_interaction: string;
  portee_effective_m?: number;
  constante_couplage?: number;
}

export type EntityType = 'particules' | 'interactions' | 'groupes' | 'processus' | 'proprietes' | 'regles';

export interface FilterCriterion {
  id: number;
  field: string;
  operator: string;
  value: string | number | boolean | null;
  value2?: string | number | null;
}

export interface EntityConfig {
  key: EntityType;
  label: string;
  icon: string;
  color: string;
  endpoint: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'link';
  options?: { value: any; label: string }[];
  readonly?: boolean;
  hidden?: boolean; // masquée par défaut (réactivable via « Colonnes »)
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  particules: {
    key: 'particules',
    label: 'Particules',
    icon: '⚛️',
    color: '#1565c0',
    endpoint: '/particules',
    fields: [
      { name: 'nom_particule', label: 'Nom', type: 'text' },
      { name: 'symbole', label: 'Symbole', type: 'text' },
      { name: 'masse_mev', label: 'Masse (MeV/c²)', type: 'number' },
      { name: 'spin', label: 'Spin', type: 'select', options: [
        { value: 0, label: '0' },
        { value: 0.5, label: '1/2' },
        { value: 1, label: '1' },
        { value: 1.5, label: '3/2' },
        { value: 2, label: '2' },
        { value: 2.5, label: '5/2' },
        { value: 3, label: '3' },
        { value: 3.5, label: '7/2' },
        { value: 4, label: '4' },
        { value: 4.5, label: '9/2' },
        { value: 5.5, label: '11/2' },
      ]},
      { name: 'charge_e', label: 'Charge (e)', type: 'select', options: [
        { value: -2, label: '-2' },
        { value: -1, label: '-1' },
        { value: -0.667, label: '-2/3' },
        { value: -0.333, label: '-1/3' },
        { value: 0, label: '0' },
        { value: 0.333, label: '+1/3' },
        { value: 0.667, label: '+2/3' },
        { value: 1, label: '+1' },
        { value: 2, label: '+2' },
      ]},
      { name: 'duree_vie_s', label: 'Durée de vie (s)', type: 'number' },
      { name: 'nombre_baryonique_B', label: 'Nombre baryonique B', type: 'number' },
      { name: 'nombre_leptonique_L', label: 'Nombre leptonique L', type: 'number' },
      { name: 'est_elementaire', label: 'Élémentaire', type: 'boolean' },
      { name: 'lien_pdg_listing', label: 'PDG (fiche)', type: 'link' },
      { name: 'lien_pdg_table', label: 'PDG (tableau)', type: 'link' },
      { name: 'pdg_id', label: 'Identifiant PDG', type: 'text', hidden: true },
      { name: 'categorie', label: 'Catégorie', type: 'text', hidden: true },
      { name: 'generation', label: 'Génération', type: 'number', hidden: true },
    ]
  },
  interactions: {
    key: 'interactions',
    label: 'Interactions Fondamentales',
    icon: '🌐',
    color: '#f9a825',
    endpoint: '/interactions',
    fields: [
      { name: 'nom_interaction', label: 'Nom', type: 'text' },
      { name: 'portee_effective_m', label: 'Portée effective (m)', type: 'number' },
      { name: 'constante_couplage', label: 'Constante de couplage', type: 'number' },
    ]
  },
  groupes: {
    key: 'groupes',
    label: 'Groupes',
    icon: '🔬',
    color: '#00838f',
    endpoint: '/groupes',
    fields: [
      { name: 'nom_groupe', label: 'Nom', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'spin_caracteristique', label: 'Spin caractéristique', type: 'number' },
    ]
  },
  processus: {
    key: 'processus',
    label: 'Processus Dynamiques',
    icon: '⚡',
    color: '#ad1457',
    endpoint: '/processus',
    fields: [
      { name: 'nom_processus', label: 'Nom', type: 'text' },
      { name: 'type', label: 'Type', type: 'text' },
      { name: 'energie_seuil_mev', label: 'Énergie seuil (MeV)', type: 'number' },
    ]
  },
  proprietes: {
    key: 'proprietes',
    label: 'Propriétés Quantiques',
    icon: '📐',
    color: '#2e7d32',
    endpoint: '/proprietes',
    fields: [
      { name: 'nom_propriete', label: 'Nom', type: 'text' },
      { name: 'type_physique', label: 'Type physique', type: 'text' },
      { name: 'est_conservée', label: 'Conservée', type: 'boolean' },
    ]
  },
  regles: {
    key: 'regles',
    label: 'Règles de Conservation',
    icon: '⚖️',
    color: '#3949ab',
    endpoint: '/regles',
    fields: [
      { name: 'nom_regle', label: 'Nom', type: 'text' },
      { name: 'est_absolue', label: 'Absolue', type: 'boolean' },
    ]
  }
};
