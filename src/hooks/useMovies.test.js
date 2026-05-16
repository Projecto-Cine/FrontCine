import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mockeamos moviesService entero antes de importar el hook.
vi.mock('../services/moviesService', () => ({
  moviesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { useMovies } from './useMovies';
import { moviesService } from '../services/moviesService';

beforeEach(() => vi.clearAllMocks());

describe('useMovies', () => {
  it('al montar carga las películas (loading → false, data poblada)', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'Dune' }]);

    const { result } = renderHook(() => useMovies());

    // Inicialmente loading=true (estado por defecto del hook).
    expect(result.current.loading).toBe(true);

    // Esperamos a que el efecto termine.
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([{ id: 1, title: 'Dune' }]);
    expect(result.current.error).toBeNull();
  });

  it('si getAll falla, expone error y data=[]', async () => {
    moviesService.getAll.mockRejectedValue(new Error('Boom'));

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Boom');
    expect(result.current.data).toEqual([]);
  });

  it('create añade la película al estado', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'A' }]);
    moviesService.create.mockResolvedValue({ id: 2, title: 'B' });

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.create({ title: 'B' }); });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[1]).toEqual({ id: 2, title: 'B' });
  });

  it('update reemplaza la película por id', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'A' }]);
    moviesService.update.mockResolvedValue({ id: 1, title: 'A2' });

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.update(1, { title: 'A2' }); });

    expect(result.current.data[0].title).toBe('A2');
  });

  it('remove la quita del estado', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    moviesService.remove.mockResolvedValue(null);

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.remove(1); });

    expect(result.current.data).toEqual([{ id: 2 }]);
  });

  it('reload vuelve a llamar al servicio', async () => {
    moviesService.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.reload(); });

    // 1 carga inicial + 1 reload = 2 llamadas al menos.
    expect(moviesService.getAll).toHaveBeenCalledTimes(2);
  });
});
