import axios from 'axios';

const API_URL = 'https://modele-standard-particules-api.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGroupes = () => api.get('/groupes');
export const getInteractions = () => api.get('/interactions');
export const getParticules = () => api.get('/particules');
export const getParticule = (id: number) => api.get(`/particules/${id}`);
export const createParticule = (data: any) => api.post('/particules', data);