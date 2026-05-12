import { api } from './api';

export const authService = {
  // POST /api/auth/login — respuesta plana: { token, user }
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};
