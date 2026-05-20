import { api } from './api';

const SEV_TO_PRI = { ALTA: 'critical', MEDIA: 'high', BAJA: 'low', HIGH: 'critical', MEDIUM: 'high', LOW: 'low' };
const PRI_TO_SEV = { critical: 'ALTA', high: 'MEDIA', medium: 'MEDIA', low: 'BAJA' };
const STATUS_TO_BACK = { open: 'OPEN', in_progress: 'IN_PROGRESS', resolved: 'RESOLVED' };

const norm = (i) => {
  if (!i) return i;
  const priority = SEV_TO_PRI[i.severity] ?? i.priority ?? 'low';
  const status = i.resolved === true ? 'resolved' : (i.status ?? 'OPEN').toLowerCase().replace(' ', '_');
  const rawAssigned = i.assignedTo ?? i.assigned_to;
  const isObj = typeof rawAssigned === 'object' && rawAssigned !== null;
  return {
    ...i,
    priority,
    status,
    assigned_to:      isObj ? rawAssigned.id   : (rawAssigned ?? ''),  // ID para el select
    assigned_to_name: isObj ? (rawAssigned.name ?? rawAssigned.username ?? '') : (rawAssigned ?? ''), // nombre para mostrar
    updated_at:       i.updatedAt ?? i.updated_at ?? i.lastModified ?? null,
  };
};
const normList = (data) => Array.isArray(data) ? data.map(norm) : data;

const toBackend = (data) => ({
  ...data,
  severity:         PRI_TO_SEV[data.priority] ?? data.severity,
  priority:         undefined,
  status:           STATUS_TO_BACK[data.status] ?? data.status?.toUpperCase() ?? 'OPEN',
  resolved:         undefined,
  assignedTo:       data.assigned_to !== undefined && data.assigned_to !== '' ? (isNaN(Number(data.assigned_to)) ? data.assigned_to : Number(data.assigned_to)) : null,
  assigned_to:      undefined,
  assigned_to_name: undefined,
  updated_at:       undefined,
  updatedAt:        undefined,
});

export const incidentsService = {
  getAll:  ()         => api.get('/incidents').then(normList),
  getById: (id)       => api.get(`/incidents/${id}`).then(norm),
  create:  (data)     => api.post('/incidents', toBackend(data)).then(norm),
  update:  (id, data) => api.put(`/incidents/${id}`, toBackend(data)).then(norm),
  remove:  (id)       => api.delete(`/incidents/${id}`),
};
