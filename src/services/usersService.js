import { api } from './api';

export const usersService = {
  getAll:          ()             => api.get('/users'),
  getAllEmployees:  ()             => api.get('/employees'),
  getAssignable:   ()             => api.get('/employees/assignable'),
  getById:         (id)           => api.get(`/users/${id}`),
  create:          (data)         => api.post('/users', data),
  update:          (id, data)     => api.put(`/users/${id}`, data),
  uploadImage:     (id, formData) => api.postFormData(`/users/${id}/image`, formData),
  remove:          (id)           => api.delete(`/users/${id}`),
};
