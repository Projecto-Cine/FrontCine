import { useState, useEffect, useCallback } from 'react';
import { moviesService } from '../services/moviesService';
import { MOVIES } from '../data/mockData';

const USE_MOCK = !import.meta.env.VITE_API_URL;

export function useMovies() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(USE_MOCK ? MOVIES : await moviesService.getAll());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (movie) => {
    const created = USE_MOCK
      ? { ...movie, id: Date.now() }
      : await moviesService.create(movie);
    setData(prev => [...prev, created]);
    return created;
  };

  const update = async (id, changes) => {
    const updated = USE_MOCK
      ? { ...data.find(m => m.id === id), ...changes }
      : await moviesService.update(id, changes);
    setData(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const remove = async (id) => {
    if (!USE_MOCK) await moviesService.remove(id);
    setData(prev => prev.filter(m => m.id !== id));
  };

  return { data, loading, error, reload: load, create, update, remove };
}
