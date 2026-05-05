import { api } from './api';

export const moviesService = {
  getAll:       ()              => api.get('/movies'),
  getById:      (id)            => api.get(`/movies/${id}`),
  create:       (data)          => api.post('/movies', data),
  update:       (id, data)      => api.put(`/movies/${id}`, data),
  remove:       (id)            => api.delete(`/movies/${id}`),
  uploadPoster: (id, file)      => api.upload(`/movies/${id}/poster`, file),
};
