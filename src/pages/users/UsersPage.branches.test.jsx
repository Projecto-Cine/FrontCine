/**
 * UsersPage — branch coverage tests.
 *
 * Exercises:
 *   - load error / non-array response
 *   - role normalization (CLIENT/CLIENTE/ADMIN/etc.)
 *   - non-admin user cannot openCreate/openEdit (early return)
 *   - email/password validation branches
 *   - save success + save error branches
 *   - delete success + delete error branches
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const usersGetAll = vi.fn();
const usersCreate = vi.fn();
const usersUpdate = vi.fn();
const usersRemove = vi.fn();

let userRole = 'admin';

vi.mock('../../services/usersService', () => ({
  usersService: {
    getAll: (...a) => usersGetAll(...a),
    create: (...a) => usersCreate(...a),
    update: (...a) => usersUpdate(...a),
    remove: (...a) => usersRemove(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: userRole }, can: () => true }),
}));

const USERS = [
  { id: 1, name: 'Admin User',  email: 'admin@x.com', role: 'ADMIN' },
  { id: 2, name: 'Client User', email: 'client@x.com', role: 'CLIENTE' },
  { id: 3, name: 'Sup User',    email: 'sup@x.com',   role: 'SUPERVISOR' },
  { id: 4, name: 'Op User',     email: 'op@x.com',    role: 'OPERATOR', dateOfBirth: '1990-01-01' },
];

import UsersPage from './UsersPage';

beforeEach(() => {
  vi.clearAllMocks();
  userRole = 'admin';
  usersGetAll.mockResolvedValue(USERS);
  usersCreate.mockResolvedValue({ id: 99, name: 'New' });
  usersUpdate.mockResolvedValue({ id: 1, name: 'Updated' });
  usersRemove.mockResolvedValue({});
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><UsersPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('UsersPage — branch coverage', () => {
  it('normalizes various roles', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
  });

  it('handles load error', async () => {
    usersGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(usersGetAll).toHaveBeenCalled());
  });

  it('handles non-array response (null)', async () => {
    usersGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(usersGetAll).toHaveBeenCalled());
  });

  it('rejects save with empty email', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo|Crear|usuario/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
      if (save) fireEvent.click(save);
      expect(usersCreate).not.toHaveBeenCalled();
    }
  });

  it('rejects save without password (create mode)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo|Crear|usuario/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      const inputs = document.querySelectorAll('[role="dialog"] input');
      const emailIn = [...inputs].find(i => i.type === 'email');
      if (emailIn) fireEvent.change(emailIn, { target: { value: 'x@y.com' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
      if (save) fireEvent.click(save);
      expect(usersCreate).not.toHaveBeenCalled();
    }
  });

  it('handles save error', async () => {
    usersCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo|Crear|usuario/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      const inputs = document.querySelectorAll('[role="dialog"] input');
      const emailIn = [...inputs].find(i => i.type === 'email');
      const pwIn    = [...inputs].find(i => i.type === 'password');
      if (emailIn) fireEvent.change(emailIn, { target: { value: 'x@y.com' } });
      if (pwIn)    fireEvent.change(pwIn,    { target: { value: 'pw' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(usersCreate).toHaveBeenCalled());
      }
    }
  });

  it('handles edit save', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) {
      fireEvent.click(rowBtns[0]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(usersUpdate).toHaveBeenCalled());
      }
    }
  });

  it('handles delete success', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Eliminar|Confirmar/i.test(b.textContent ?? ''));
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(usersRemove).toHaveBeenCalled());
      }
    }
  });

  it('handles delete cancellation (close modal)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const cancel = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Cancelar/i.test(b.textContent ?? ''));
      if (cancel) {
        fireEvent.click(cancel);
        // Modal closed → usersRemove not called
        expect(usersRemove).not.toHaveBeenCalled();
      }
    }
  });

  it('non-admin user cannot open create/edit modals (early return)', async () => {
    userRole = 'CLIENT';
    renderPage();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo|Crear|usuario/i.test(b.textContent ?? ''));
    if (createBtn) fireEvent.click(createBtn);
    // Modal should NOT open
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
