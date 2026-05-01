import { api } from './api';

export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  // → { user: { id, name, username, email, role, status }, token: string }

  logout: () =>
    api.post('/auth/logout', {}),

  me: () =>
    api.get('/auth/me'),
  // → { user: {...} }  (para restaurar sesión desde token guardado)
};
