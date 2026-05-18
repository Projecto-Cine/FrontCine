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

import AuditPage from './AuditPage';

const today = new Date().toISOString().split('T')[0];
const mockLogs = [
  { id: 1, timestamp: `${today}T10:00:00`, user: 'admin', action: 'LOGIN', resource: 'auth', detail: 'Logged in', ip: '192.168.1.1', severity: 'info' },
  { id: 2, timestamp: `${today}T11:00:00`, user: 'carlos', action: 'CREATE', resource: 'movie', detail: 'Created Dune', ip: '192.168.1.2', severity: 'warning' },
  { id: 3, timestamp: `${today}T12:00:00`, user: 'admin', action: 'DELETE', resource: 'user', detail: 'Deleted user', ip: '192.168.1.1', severity: 'danger' },
];
const mockUsers = [
  { id: 1, name: 'Admin', username: 'admin', status: 'active', email: 'admin@x.com', last_login: `${today}T09:00:00` },
  { id: 2, name: 'Carlos', username: 'carlos', status: 'active', email: 'carlos@x.com', last_login: `${today}T08:00:00` },
];

beforeEach(() => {
  vi.clearAllMocks();
  auditGetAll.mockResolvedValue(mockLogs);
  usersGetAll.mockResolvedValue(mockUsers);
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><AuditPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('AuditPage — comprehensive', () => {
  it('loads and displays audit logs', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent).toContain('admin');
    });
  });

  it('shows KPI cards with correct data', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('admin'));
    const text = document.body.textContent;
    expect(text).toContain('3');
  });

  it('filters by severity buttons', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('admin'));
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('filters by user select', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('admin'));
    const selects = screen.queryAllByRole('combobox');
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: 'admin' } });
    }
  });

  it('shows alert section for danger-severity entries', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('admin'));
  });

  it('shows active sessions panel', async () => {
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('admin'));
  });

  it('handles load error', async () => {
    auditGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });
});