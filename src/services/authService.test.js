/**
 * authService — coverage tests for login() and employeeLogin() wrappers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiPostMock = vi.fn();
vi.mock('./api', () => ({
  api: { post: (...a) => apiPostMock(...a) },
}));

import { authService } from './authService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService', () => {
  it('login() calls /auth/login with credentials', async () => {
    apiPostMock.mockResolvedValueOnce({ token: 't', user: { id: 1 } });
    const res = await authService.login('a@b.com', 'pw');
    expect(apiPostMock).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(res.token).toBe('t');
  });

  it('employeeLogin() calls /auth/employee-login with credentials', async () => {
    apiPostMock.mockResolvedValueOnce({ token: 't', user: { id: 2, role: 'CAJERO' } });
    const res = await authService.employeeLogin('c@d.com', 'pw');
    expect(apiPostMock).toHaveBeenCalledWith('/auth/employee-login', { email: 'c@d.com', password: 'pw' });
    expect(res.user.role).toBe('CAJERO');
  });
});
