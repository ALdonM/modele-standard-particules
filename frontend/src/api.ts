import axios from 'axios';

export const API_URL = 'https://modele-standard-particules-api.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Particules
export const getParticules = () => api.get('/particules');
export const getParticule = (id: number) => api.get(`/particules/${id}`);

// Groupes & Interactions
export const getGroupes = () => api.get('/groupes');
export const getInteractions = () => api.get('/interactions');

export const getReferences = (entiteCible: string, idCible: number) => 
  api.get('/references', { params: { entite_cible: entiteCible, id_cible: idCible } });
