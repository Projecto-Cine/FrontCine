import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock `api` the same way as in services.test.js, but here each test
// tunes the return values to exercise the NORMALIZATION logic.
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

describe('incidentsService — backend ↔ frontend normalization', () => {
  it('getAll maps severity → priority and resolved → status="resolved"', async () => {
    api.get.mockResolvedValue([
      { id: 1, severity: 'ALTA', resolved: false, status: 'OPEN', assignedTo: 'Ana' },
      { id: 2, severity: 'BAJA', resolved: true, assignedTo: 'Luis' },
    ]);

    const result = await incidentsService.getAll();

    expect(result[0].priority).toBe('critical'); // ALTA → critical
    expect(result[0].status).toBe('open');       // status normalised to lowercase
    expect(result[0].assigned_to).toBe('Ana');   // assignedTo → assigned_to
    expect(result[1].priority).toBe('low');      // BAJA → low
    expect(result[1].status).toBe('resolved');   // resolved=true wins over status
  });

  it('getById normalises a single object', async () => {
    api.get.mockResolvedValue({ id: 1, severity: 'MEDIA', status: 'IN PROGRESS' });

    const result = await incidentsService.getById(1);

    expect(result.priority).toBe('high');
    // "IN PROGRESS" uppercase with a space → "in_progress" with underscore.
    expect(result.status).toBe('in_progress');
  });

  it('falls back to priority "low" when severity is unknown', async () => {
    api.get.mockResolvedValue({ id: 1, severity: 'DESCONOCIDA' });
    const result = await incidentsService.getById(1);
    expect(result.priority).toBe('low');
  });

  it('create transforms priority → severity (toBackend) before sending', async () => {
    api.post.mockResolvedValue({ id: 1, severity: 'ALTA' });

    await incidentsService.create({ priority: 'critical', assigned_to: 'Ana', title: 'X' });

    // The POST must have received severity and assignedTo (NOT priority or assigned_to).
    const sent = api.post.mock.calls[0][1];
    expect(sent.severity).toBe('ALTA');
    expect(sent.assignedTo).toBe('Ana');
    expect(sent.priority).toBeUndefined();
    expect(sent.assigned_to).toBeUndefined();
  });

  it('update also applies toBackend', async () => {
    api.put.mockResolvedValue({ id: 1, severity: 'BAJA' });

    await incidentsService.update(1, { priority: 'low' });

    expect(api.put).toHaveBeenCalledWith('/incidents/1', expect.objectContaining({ severity: 'BAJA' }));
  });

  it('remove → DELETE /incidents/:id', () => {
    incidentsService.remove(7);
    expect(api.delete).toHaveBeenCalledWith('/incidents/7');
  });

  it('getAll returns the data as-is when NOT an array', async () => {
    api.get.mockResolvedValue(null);
    const result = await incidentsService.getAll();
    expect(result).toBeNull();
  });
});
