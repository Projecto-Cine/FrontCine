import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the entire moviesService before importing the hook.
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
  it('on mount it loads movies (loading → false, data populated)', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'Dune' }]);

    const { result } = renderHook(() => useMovies());

    // Initially loading=true (hook's default state).
    expect(result.current.loading).toBe(true);

    // Wait for the effect to settle.
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([{ id: 1, title: 'Dune' }]);
    expect(result.current.error).toBeNull();
  });

  it('when getAll fails, exposes error and data=[]', async () => {
    moviesService.getAll.mockRejectedValue(new Error('Boom'));

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Boom');
    expect(result.current.data).toEqual([]);
  });

  it('create appends the movie to the state', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'A' }]);
    moviesService.create.mockResolvedValue({ id: 2, title: 'B' });

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.create({ title: 'B' }); });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[1]).toEqual({ id: 2, title: 'B' });
  });

  it('update replaces the movie by id', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1, title: 'A' }]);
    moviesService.update.mockResolvedValue({ id: 1, title: 'A2' });

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.update(1, { title: 'A2' }); });

    expect(result.current.data[0].title).toBe('A2');
  });

  it('remove drops it from the state', async () => {
    moviesService.getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    moviesService.remove.mockResolvedValue(null);

    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.remove(1); });

    expect(result.current.data).toEqual([{ id: 2 }]);
  });

  it('reload re-invokes the service', async () => {
    moviesService.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.reload(); });

    // 1 initial load + 1 reload = at least 2 calls.
    expect(moviesService.getAll).toHaveBeenCalledTimes(2);
  });
});
