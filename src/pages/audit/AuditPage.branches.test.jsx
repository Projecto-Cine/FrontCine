/**
 * AuditPage — branch coverage tests.
 *
 * Exercises:
 *   - filter by severity (all/info/warning/danger)
 *   - filter by user
 *   - row rendering with all severity + action combos
 *   - alerts section visibility branches
 *   - non-array audit and users responses
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const auditGetAll = vi.fn();
const usersGetAll = vi.fn();

vi.mock('../../services/auditService', () => ({
  auditService: { getAll: (...a) => auditGetAll(...a) },
}));
vi.mock('../../services/usersService', () => ({
  usersService: { getAll: (...a) => usersGetAll(...a) },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const TODAY = new Date().toISOString().split('T')[0];

const LOGS = [
  { id: 1, timestamp: '2026-01-01 10:00', user: 'alice', action: 'LOGIN',      resource: '-',     detail: 'logged in',  ip: '1.1.1.1', severity: 'info' },
  { id: 2, timestamp: '2026-01-01 10:01', user: 'bob',   action: 'LOGOUT',     resource: '-',     detail: 'logged out', ip: '1.1.1.2', severity: 'info' },
  { id: 3, timestamp: '2026-01-01 10:02', user: 'alice', action: 'UPDATE',     resource: 'movie', detail: 'edited',     ip: '1.1.1.1', severity: 'warning' },
  { id: 4, timestamp: '2026-01-01 10:03', user: 'bob',   action: 'DELETE',     resource: 'room',  detail: 'removed',    ip: '1.1.1.2', severity: 'danger' },
  { id: 5, timestamp: '2026-01-01 10:04', user: 'alice', action: 'CREATE',     resource: 'movie', detail: 'created',    ip: '1.1.1.1', severity: 'info' },
  { id: 6, timestamp: '2026-01-01 10:05', user: 'eve',   action: 'PERMISSION', resource: 'role',  detail: 'granted',    ip: '1.1.1.3', severity: 'warning' },
  { id: 7, timestamp: '2026-01-01 10:06', user: 'eve',   action: 'CONFIG',     resource: 'sys',   detail: 'changed',    ip: '1.1.1.3', severity: 'info' },
  { id: 8, timestamp: '2026-01-01 10:07', user: 'eve',   action: 'LOGIN_FAIL', resource: '-',     detail: 'bad pw',     ip: '1.1.1.3', severity: 'danger' },
  { id: 9, timestamp: '2026-01-01 10:08', user: 'eve',   action: 'UNKNOWN',    resource: '-',     detail: 'other',      ip: '1.1.1.3', severity: 'info' },
];

const USERS = [
  { id: 1, username: 'alice', status: 'active', last_login: `${TODAY}T10:00:00` },
  { id: 2, username: 'bob',   status: 'active', last_login: '2020-01-01T10:00:00' },
  { id: 3, username: 'cara',  status: 'inactive', last_login: TODAY },
];

import AuditPage from './AuditPage';

beforeEach(() => {
  vi.clearAllMocks();
  auditGetAll.mockResolvedValue(LOGS);
  usersGetAll.mockResolvedValue(USERS);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><AuditPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('AuditPage — branch coverage', () => {
  it('renders all action+severity rows', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('alice')[0]).toBeInTheDocument());
    expect(screen.getAllByText('bob')[0]).toBeInTheDocument();
    // Danger alerts section
    expect(screen.getByText(/Alertas de seguridad/i)).toBeInTheDocument();
  });

  it('does not show the alerts section when no danger', async () => {
    auditGetAll.mockResolvedValueOnce(LOGS.filter(l => l.severity !== 'danger'));
    renderPage();
    await waitFor(() => expect(screen.getAllByText('alice')[0]).toBeInTheDocument());
    expect(screen.queryByText(/Alertas de seguridad/i)).not.toBeInTheDocument();
  });

  it('handles audit load error gracefully', async () => {
    auditGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(auditGetAll).toHaveBeenCalled());
  });

  it('handles non-array audit response', async () => {
    auditGetAll.mockResolvedValueOnce({ not: 'an array' });
    renderPage();
    await waitFor(() => expect(auditGetAll).toHaveBeenCalled());
  });

  it('handles non-array users response', async () => {
    usersGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(auditGetAll).toHaveBeenCalled());
  });

  it('filters by severity and user via select elements', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('alice')[0]).toBeInTheDocument());

    const selects = document.querySelectorAll('select');
    if (selects[0]) {
      fireEvent.change(selects[0], { target: { value: 'danger' } });
      fireEvent.change(selects[0], { target: { value: 'all' } });
    }
    if (selects[1]) {
      fireEvent.change(selects[1], { target: { value: 'alice' } });
      fireEvent.change(selects[1], { target: { value: 'all' } });
    }
  });

  it('renders when no users had a login today (activeUsers = empty)', async () => {
    usersGetAll.mockResolvedValueOnce([{ id: 1, username: 'old', status: 'active', last_login: '2020-01-01T10:00:00' }]);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('alice')[0]).toBeInTheDocument());
  });
});
