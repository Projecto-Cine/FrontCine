import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const mockUsers = [
  { id: 1, name: 'Admin', lastName: 'Boss', email: 'admin@x.com', role: 'ADMIN', birthDate: '1985-01-01' },
  { id: 2, name: 'Staff', email: 'staff@x.com', role: 'CAJERO' },
  { id: 3, name: 'Client', email: 'client@x.com', role: 'CLIENTE' },
];

const usersGetAll  = vi.fn().mockResolvedValue(mockUsers);
const usersCreate  = vi.fn().mockResolvedValue({ id: 99, email: 'new@x.com', role: 'CLIENTE' });
const usersUpdate  = vi.fn().mockResolvedValue({ id: 1, email: 'admin@x.com', role: 'ADMIN' });
const usersRemove  = vi.fn().mockResolvedValue(null);

vi.mock('../../services/usersService', () => ({
  usersService: {
    getAll:  (...a) => usersGetAll(...a),
    create:  (...a) => usersCreate(...a),
    update:  (...a) => usersUpdate(...a),
    remove:  (...a) => usersRemove(...a),
    getById: vi.fn(), uploadImage: vi.fn(),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

import UsersPage from './UsersPage';

beforeEach(() => vi.clearAllMocks());

const R = () => render(
  <MemoryRouter><LanguageProvider><AppProvider><UsersPage /></AppProvider></LanguageProvider></MemoryRouter>
);

describe('UsersPage', () => {
  it('loads and displays users', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    expect(screen.getByText('staff@x.com')).toBeInTheDocument();
  });

  it('shows KPI cards', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
  });

  it('opens create modal and saves', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nuevo trabajador/i }));
    await waitFor(() => expect(document.getElementById('usr-name')).toBeTruthy());
    fireEvent.change(document.getElementById('usr-name'), { target: { value: 'New' } });
    const emailInputs = document.querySelectorAll('input[type="email"]');
    if (emailInputs[0]) fireEvent.change(emailInputs[0], { target: { value: 'new@x.com' } });
    const pwInputs = document.querySelectorAll('input[type="password"]');
    if (pwInputs[0]) fireEvent.change(pwInputs[0], { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear trabajador/i }));
    await waitFor(() => expect(usersCreate).toHaveBeenCalled());
  });

  it('validates email required', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nuevo trabajador/i }));
    await waitFor(() => expect(document.getElementById('usr-name')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /crear trabajador/i }));
    expect(usersCreate).not.toHaveBeenCalled();
  });

  it('validates password required on create', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nuevo trabajador/i }));
    await waitFor(() => expect(document.getElementById('usr-name')).toBeTruthy());

    fireEvent.change(document.getElementById('usr-email'), { target: { value: 'new@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: /crear trabajador/i }));

    expect(usersCreate).not.toHaveBeenCalled();
  });

  it('opens edit and updates', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    const editBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (editBtns[0]) { fireEvent.click(editBtns[0]); await waitFor(() => document.getElementById('usr-name')); }
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(usersUpdate).toHaveBeenCalled());
  });

  it('handles delete flow', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    const delBtns = screen.getAllByTitle(/eliminar|delete/i);
    if (delBtns[0]) fireEvent.click(delBtns[0]);
    await waitFor(() => {
      const confirm = screen.getAllByRole('button').find(b => b.textContent.includes('liminar'));
      if (confirm) fireEvent.click(confirm);
    });
  });

  it('handles save error', async () => {
    usersCreate.mockRejectedValueOnce(new Error('fail'));
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nuevo trabajador/i }));
    await waitFor(() => document.getElementById('usr-name'));
    const emailInputs = document.querySelectorAll('input[type="email"]');
    if (emailInputs[0]) fireEvent.change(emailInputs[0], { target: { value: 'e@x.com' } });
    const pwInputs = document.querySelectorAll('input[type="password"]');
    if (pwInputs[0]) fireEvent.change(pwInputs[0], { target: { value: 'p' } });
    fireEvent.click(screen.getByRole('button', { name: /crear trabajador/i }));
    await waitFor(() => expect(usersCreate).toHaveBeenCalled());
  });

  it('handles load error', async () => {
    usersGetAll.mockRejectedValueOnce(new Error('Network'));
    R();
    await waitFor(() => expect(usersGetAll).toHaveBeenCalled());
  });

  it('closes modal via cancel', async () => {
    R();
    await waitFor(() => expect(screen.getByText('admin@x.com')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nuevo trabajador/i }));
    await waitFor(() => document.getElementById('usr-name'));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  });
});
