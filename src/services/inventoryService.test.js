/**
 * inventoryService — covers toInventory / fromInventory branches.
 * Code in English; assertions in English; no UI involved.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn().mockResolvedValue(null),
  },
}));

import { api } from './api';
import { inventoryService, merchandiseService } from './inventoryService';

beforeEach(() => vi.clearAllMocks());

describe('inventoryService — frontend/backend normalisation', () => {
  it('exports the same instance as merchandiseService', () => {
    expect(inventoryService).toBe(merchandiseService);
  });

  it('getAll defaults to [] when API returns a non-array', async () => {
    api.get.mockResolvedValue(null);
    const result = await inventoryService.getAll();
    expect(result).toEqual([]);
  });

  it('getAll maps backend "stock" → "quantity"', async () => {
    api.get.mockResolvedValue([{ id: 1, name: 'X', stock: 12 }]);
    const result = await inventoryService.getAll();
    expect(result[0].quantity).toBe(12);
  });

  it('getAll keeps "quantity" when both are present (frontend wins)', async () => {
    api.get.mockResolvedValue([{ id: 1, name: 'X', quantity: 10, stock: 99 }]);
    const result = await inventoryService.getAll();
    expect(result[0].quantity).toBe(10);
  });

  it('getAll maps "minStock" → "min_stock" and "price" → "price_unit"', async () => {
    api.get.mockResolvedValue([{ id: 1, name: 'X', minStock: 4, price: 1.5 }]);
    const result = await inventoryService.getAll();
    expect(result[0].min_stock).toBe(4);
    expect(result[0].price_unit).toBe(1.5);
  });

  it('getAll defaults unit to "ud" and location to "" when missing', async () => {
    api.get.mockResolvedValue([{ id: 1, name: 'X' }]);
    const result = await inventoryService.getAll();
    expect(result[0].unit).toBe('ud');
    expect(result[0].location).toBe('');
  });

  it('create transforms quantity/min_stock/price_unit → stock/minStock/price', async () => {
    api.post.mockResolvedValue({ id: 1, name: 'X', stock: 10 });
    await inventoryService.create({ name: 'X', quantity: 10, min_stock: 2, price_unit: 5 });
    const sent = api.post.mock.calls[0][1];
    expect(sent.stock).toBe(10);
    expect(sent.minStock).toBe(2);
    expect(sent.price).toBe(5);
    expect(sent.quantity).toBeUndefined();
    expect(sent.min_stock).toBeUndefined();
    expect(sent.price_unit).toBeUndefined();
  });

  it('create with already-backend data passes through without re-mapping', async () => {
    api.post.mockResolvedValue({ id: 1, stock: 10 });
    await inventoryService.create({ name: 'X', stock: 5, minStock: 1, price: 2 });
    const sent = api.post.mock.calls[0][1];
    expect(sent.stock).toBe(5);
  });

  it('update applies fromInventory', async () => {
    api.put.mockResolvedValue({ id: 1, stock: 99 });
    await inventoryService.update(1, { quantity: 99 });
    const sent = api.put.mock.calls[0][1];
    expect(sent.stock).toBe(99);
  });

  it('remove → DELETE /merchandise/:id', () => {
    inventoryService.remove(7);
    expect(api.delete).toHaveBeenCalledWith('/merchandise/7');
  });

  it('getById normalises a single item', async () => {
    api.get.mockResolvedValue({ id: 1, name: 'X', stock: 3 });
    const result = await inventoryService.getById(1);
    expect(result.quantity).toBe(3);
  });
});
