import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockeamos `api` igual que en services.test.js, pero aquí cada test
// ajusta los valores de retorno para probar la NORMALIZACIÓN.
vi.mock('./api', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from './api';
import { incidentsService } from './incidentsService';

beforeEach(() => vi.clearAllMocks());

describe('incidentsService — normalización backend ↔ frontend', () => {
  it('getAll mapea severity → priority y resolved → status="resolved"', async () => {
    api.get.mockResolvedValue([
      { id: 1, severity: 'ALTA', resolved: false, status: 'OPEN', assignedTo: 'Ana' },
      { id: 2, severity: 'BAJA', resolved: true, assignedTo: 'Luis' },
    ]);

    const result = await incidentsService.getAll();

    expect(result[0].priority).toBe('critical'); // ALTA → critical
    expect(result[0].status).toBe('open');       // status normalizado a minúsculas
    expect(result[0].assigned_to).toBe('Ana');   // assignedTo → assigned_to
    expect(result[1].priority).toBe('low');      // BAJA → low
    expect(result[1].status).toBe('resolved');   // resolved=true gana sobre status
  });

  it('getById normaliza un único objeto', async () => {
    api.get.mockResolvedValue({ id: 1, severity: 'MEDIA', status: 'IN PROGRESS' });

    const result = await incidentsService.getById(1);

    expect(result.priority).toBe('high');
    // "IN PROGRESS" en mayúsculas con espacio → "in_progress" con guion bajo
    expect(result.status).toBe('in_progress');
  });

  it('si severity no se reconoce, cae en priority por defecto "low"', async () => {
    api.get.mockResolvedValue({ id: 1, severity: 'DESCONOCIDA' });
    const result = await incidentsService.getById(1);
    expect(result.priority).toBe('low');
  });

  it('create transforma priority → severity (toBackend) antes de enviar', async () => {
    api.post.mockResolvedValue({ id: 1, severity: 'ALTA' });

    await incidentsService.create({ priority: 'critical', assigned_to: 'Ana', title: 'X' });

    // El POST debe haber recibido severity y assignedTo (NO priority ni assigned_to).
    const sent = api.post.mock.calls[0][1];
    expect(sent.severity).toBe('ALTA');
    expect(sent.assignedTo).toBe('Ana');
    expect(sent.priority).toBeUndefined();
    expect(sent.assigned_to).toBeUndefined();
  });

  it('update también aplica toBackend', async () => {
    api.put.mockResolvedValue({ id: 1, severity: 'BAJA' });

    await incidentsService.update(1, { priority: 'low' });

    expect(api.put).toHaveBeenCalledWith('/incidents/1', expect.objectContaining({ severity: 'BAJA' }));
  });

  it('remove → DELETE /incidents/:id', () => {
    incidentsService.remove(7);
    expect(api.delete).toHaveBeenCalledWith('/incidents/7');
  });

  it('getAll devuelve el dato tal cual si NO es array', async () => {
    api.get.mockResolvedValue(null);
    const result = await incidentsService.getAll();
    expect(result).toBeNull();
  });
});
