import { api } from './api';

export const authService = {
  // Response: { id, nombre, email, rol: "ADMIN"|"CLIENTE", imagenUrl }
  login: ({ email, password }) => api.post('/auth/login', { email, password }),
  me:    ()                    => api.get('/auth/me'),
};
