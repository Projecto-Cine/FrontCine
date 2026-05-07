import { useState, useEffect, useCallback } from 'react';
import { moviesService } from '../services/moviesService';

export function useMovies() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await moviesService.getAll());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const create = async (movie) => {
    const created = await moviesService.create(movie);
    setData(prev => [...prev, created]);
    return created;
  };

  const update = async (id, changes) => {
    const updated = await moviesService.update(id, changes);
    setData(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const remove = async (id) => {
    await moviesService.remove(id);
    setData(prev => prev.filter(m => m.id !== id));
  };

  return { data, loading, error, reload: load, create, update, remove };
}
