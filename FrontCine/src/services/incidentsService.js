import { api } from './api';

// Spring Boot devuelve camelCase; la página usa assigned_to → normalizar
const norm = (i) => i ? { ...i, assigned_to: i.assignedTo ?? i.assigned_to } : i;
const normList = (data) => Array.isArray(data) ? data.map(norm) : data;

// Convierte el payload al camelCase que espera Spring Boot
const toBackend = (data) => ({
  ...data,
  assignedTo: data.assigned_to ?? data.assignedTo,
  assigned_to: undefined,
});

export const incidentsService = {
  getAll:  ()         => api.get('/incidents').then(normList),
  getById: (id)       => api.get(`/incidents/${id}`).then(norm),
  create:  (data)     => api.post('/incidents', toBackend(data)).then(norm),
  update:  (id, data) => api.put(`/incidents/${id}`, toBackend(data)).then(norm),
  remove:  (id)       => api.delete(`/incidents/${id}`),
};
