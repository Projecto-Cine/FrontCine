import { api } from './api';

const SEV_TO_PRI = { ALTA: 'critical', MEDIA: 'high', BAJA: 'low', HIGH: 'critical', MEDIUM: 'high', LOW: 'low' };
const PRI_TO_SEV = { critical: 'ALTA', high: 'MEDIA', medium: 'MEDIA', low: 'BAJA' };

const norm = (i) => {
  if (!i) return i;
  const priority = SEV_TO_PRI[i.severity] ?? i.priority ?? 'low';
  const status   = i.resolved === true
    ? 'resolved'
    : (i.status ?? 'open').toLowerCase().replace(' ', '_');
  return { ...i, priority, status, assigned_to: i.assignedTo ?? i.assigned_to };
};
const normList = (data) => Array.isArray(data) ? data.map(norm) : data;

const toBackend = (data) => ({
  ...data,
  severity:    PRI_TO_SEV[data.priority] ?? data.severity,
  priority:    undefined,
  assignedTo:  data.assigned_to ?? data.assignedTo,
  assigned_to: undefined,
});

export const incidentsService = {
  getAll:  ()         => api.get('/incidents').then(normList),
  getById: (id)       => api.get(`/incidents/${id}`).then(norm),
  create:  (data)     => api.post('/incidents', toBackend(data)).then(norm),
  update:  (id, data) => api.put(`/incidents/${id}`, toBackend(data)).then(norm),
  remove:  (id)       => api.delete(`/incidents/${id}`),
};
