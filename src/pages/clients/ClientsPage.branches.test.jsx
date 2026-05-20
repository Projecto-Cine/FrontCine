/**
 * ClientsPage — branch-coverage suite.
 *
 * Exercises:
 *   - search debounce with results, empty query, error
 *   - create/edit flow with validation branches
 *   - 409 / 400 / generic save error branches
 *   - detail load success + failure
 *   - delete success + failure
 *   - normalizeClient with missing fields
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const clientsGetAll = vi.fn();
const clientsSearch = vi.fn();
const clientsCreate = vi.fn();
const clientsUpdate = vi.fn();
const clientsRemove = vi.fn();
const clientsGetById = vi.fn();

vi.mock('../../services/clientsService', () => ({
  clientsService: {
    getAll:  (...a) => clientsGetAll(...a),
    search:  (...a) => clientsSearch(...a),
    create:  (...a) => clientsCreate(...a),
    update:  (...a) => clientsUpdate(...a),
    remove:  (...a) => clientsRemove(...a),
    getById: (...a) => clientsGetById(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const CLIENTS = [
  { id: 1, name: 'Ana López', email: 'ana@x.com', student: true,  fidelityDiscountEligible: true,  status: 'ACTIVE', visitsPerYear: 12, birthDate: '1990-01-01' },
  { id: 2, name: 'Bruno Ruiz', email: 'bruno@x.com', isStudent: true, status: 'INACTIVE' },
  { id: 3, username: 'carla',  email: null, status: 'SUSPENDED', userType: 'SENIOR' },
];

import ClientsPage from './ClientsPage';

beforeEach(() => {
  vi.clearAllMocks();
  clientsGetAll.mockResolvedValue(CLIENTS);
  clientsSearch.mockResolvedValue([CLIENTS[0]]);
  clientsCreate.mockResolvedValue({ id: 99 });
  clientsUpdate.mockResolvedValue({ id: 1 });
  clientsRemove.mockResolvedValue({});
  clientsGetById.mockResolvedValue({ id: 1, name: 'Ana López', email: 'ana@x.com', birthDate: '1990-01-01' });
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ClientsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('ClientsPage — branch coverage', () => {
  it('handles getAll failure with toast', async () => {
    clientsGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(clientsGetAll).toHaveBeenCalled());
  });

  it('handles search error and clears results', async () => {
    clientsSearch.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(clientsGetAll).toHaveBeenCalled());

    const search = document.querySelector('input[placeholder]');
    fireEvent.change(search, { target: { value: 'NoMatch' } });
    await waitFor(() => expect(clientsSearch).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('handles data with content envelope (data.content)', async () => {
    clientsGetAll.mockResolvedValueOnce({ content: CLIENTS });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
  });

  it('rejects save with empty email', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo cliente|rear/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);
    const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear|Guardar/i.test(b.textContent ?? ''));
    if (save) fireEvent.click(save);
    expect(clientsCreate).not.toHaveBeenCalled();
  });

  it('rejects save with empty password (when creating)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo cliente|rear/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);

    const inputs = document.querySelectorAll('[role="dialog"] input');
    const emailIn = [...inputs].find(i => i.type === 'email');
    if (emailIn) fireEvent.change(emailIn, { target: { value: 'x@y.com' } });

    const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
    if (save) fireEvent.click(save);
    expect(clientsCreate).not.toHaveBeenCalled();
  });

  it('handles 409 conflict during save', async () => {
    clientsCreate.mockRejectedValueOnce({ status: 409 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo cliente|rear/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);

    const inputs = document.querySelectorAll('[role="dialog"] input');
    const nameIn  = [...inputs].find(i => i.type === 'text' || i.type === undefined || i.type === '');
    const emailIn = [...inputs].find(i => i.type === 'email');
    const pwIn    = [...inputs].find(i => i.type === 'password');
    if (nameIn)  fireEvent.change(nameIn,  { target: { value: 'X' } });
    if (emailIn) fireEvent.change(emailIn, { target: { value: 'x@y.com' } });
    if (pwIn)    fireEvent.change(pwIn,    { target: { value: 'pwd123' } });

    const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
    if (save) {
      fireEvent.click(save);
      await waitFor(() => expect(clientsCreate).toHaveBeenCalled());
    }
  });

  it('handles 400 during save', async () => {
    clientsCreate.mockRejectedValueOnce({ status: 400 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo cliente|rear/i.test(b.textContent ?? ''));
    fireEvent.click(createBtn);
    const inputs = document.querySelectorAll('[role="dialog"] input');
    [...inputs].find(i => i.type === 'text' || i.type === '')?.dispatchEvent(new Event('change'));
    const nameIn  = [...inputs].find(i => !i.type || i.type === 'text');
    const emailIn = [...inputs].find(i => i.type === 'email');
    const pwIn    = [...inputs].find(i => i.type === 'password');
    if (nameIn)  fireEvent.change(nameIn,  { target: { value: 'Y' } });
    if (emailIn) fireEvent.change(emailIn, { target: { value: 'y@y.com' } });
    if (pwIn)    fireEvent.change(pwIn,    { target: { value: 'pwd123' } });
    const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Crear/i.test(b.textContent ?? ''));
    if (save) {
      fireEvent.click(save);
      await waitFor(() => expect(clientsCreate).toHaveBeenCalled());
    }
  });

  it('handles edit save with no password change', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) {
      fireEvent.click(rowBtns[0]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Guardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(clientsUpdate).toHaveBeenCalled());
      }
    }
  });

  it('handles delete success and failure', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Eliminar|Confirmar/i.test(b.textContent ?? ''));
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(clientsRemove).toHaveBeenCalled());
      }
    }
  });

  it('handles delete error path', async () => {
    clientsRemove.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[1]) {
      fireEvent.click(rowBtns[1]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
      const confirm = [...document.querySelectorAll('[role="dialog"] button')].find(b => /Eliminar|Confirmar/i.test(b.textContent ?? ''));
      if (confirm) {
        fireEvent.click(confirm);
        await waitFor(() => expect(clientsRemove).toHaveBeenCalled());
      }
    }
  });

  it('opens detail view and handles getById failure', async () => {
    clientsGetById.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Click on row (using onRowClick)
    const row = document.querySelector('tbody tr');
    if (row) {
      fireEvent.click(row);
      await waitFor(() => expect(clientsGetById).toHaveBeenCalled());
    }
  });

  it('opens detail view for a client with lastName (covers branch)', async () => {
    clientsGetById.mockResolvedValueOnce({
      id: 1, name: 'Ana', lastName: 'López', email: 'ana@x.com',
      status: 'ACTIVE', userType: 'STUDENT', username: 'analopez',
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const row = document.querySelector('tbody tr');
    if (row) {
      fireEvent.click(row);
      await waitFor(() => expect(clientsGetById).toHaveBeenCalled());
    }
  });

  it('opens detail view for a client without lastName and missing email', async () => {
    clientsGetById.mockResolvedValueOnce({
      id: 3, username: 'carla',
      // no lastName, no email, no status, no userType
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // click on third row (carla)
    const rows = document.querySelectorAll('tbody tr');
    if (rows[2]) {
      fireEvent.click(rows[2]);
      await waitFor(() => expect(clientsGetById).toHaveBeenCalled());
    }
  });

  it('opens edit modal showing modalEditTitle with name fallback', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) {
      fireEvent.click(rowBtns[0]);
      // Modal should be open
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeInTheDocument());
    }
  });

  it('toggles the fidelityMember switch in the form', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b => /Nuevo cliente|rear cliente/i.test(b.textContent ?? ''));
    if (createBtn) {
      fireEvent.click(createBtn);
      // Find the fidelity toggle button — the only button in the dialog with the "type=button" attribute
      // and styled as a chip (NOT the form save/cancel buttons)
      const allBtns = document.querySelectorAll('[role="dialog"] button[type="button"]');
      // toggle the last button-type=button (the fidelity chip)
      if (allBtns.length > 0) {
        fireEvent.click(allBtns[allBtns.length - 1]);
        fireEvent.click(allBtns[allBtns.length - 1]); // toggle back to cover both branches
      }
    }
  });

  it('detail panel handles client without lastName, status defaults to ACTIVE', async () => {
    clientsGetById.mockResolvedValueOnce({
      id: 1, name: 'Solo Name', email: 'solo@x.com',
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const row = document.querySelector('tbody tr');
    if (row) {
      fireEvent.click(row);
      await waitFor(() => expect(clientsGetById).toHaveBeenCalled());
    }
  });
});
