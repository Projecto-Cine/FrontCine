import { api } from './api';

export const moviesService = {
  getAll:         ()             => api.get('/movies'),
  getActive:      ()             => api.get('/movies/active'),
  getById:        (id)           => api.get(`/movies/${id}`),
  create:         (data)         => api.post('/movies', data),
  createFormData: (formData)     => api.postFormData('/movies', formData),
  update:         (id, data)     => api.put(`/movies/${id}`, data),
  remove:         (id)           => api.delete(`/movies/${id}`),
};
