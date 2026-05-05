import { api } from './api';

export const moviesService = {
  getAll:  ()         => api.get('/movies'),
  getById: (id)       => api.get(`/movies/${id}`),
  create:  (data)     => api.post('/movies', data),
  createFormData: (formData) => api.postFormData('/movies', formData),
  update:  (id, data) => api.put(`/movies/${id}`, data),
  uploadImage: (id, formData) => api.postFormData(`/movies/${id}/image`, formData),
  remove:  (id)       => api.delete(`/movies/${id}`),
};
