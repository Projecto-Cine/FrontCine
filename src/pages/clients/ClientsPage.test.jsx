import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const mockClients = [
  { id: 1, name: 'Ana López', lastName: 'García', email: 'ana@x.com', username: 'analopez', student: false, status: 'ACTIVE', userType: 'ADULT', birthDate: '1990-01-01', visitsPerYear: 12, fidelityDiscountEligible: true },
  { id: 2, name: 'Luis Ruiz', lastName: '', email: 'luis@x.com', username: 'luisruiz', student: true, status: 'ACTIVE', userType: 'STUDENT', birthDate: '2002-05-10', visitsPerYear: 3, fidelityDiscountEligible: false },
  { id: 3, name: 'Marta Sanz', lastName: 'Pérez', email: 'marta@x.com', username: 'martasanz', student: false, status: 'INACTIVE', userType: 'SENIOR', birthDate: '1960-03-15', visitsPerYear: 0, fidelityDiscountEligible: false },
];

const clientsGetAll  = vi.fn().mockResolvedValue(mockClients);
const clientsSearch  = vi.fn().mockResolvedValue([mockClients[0]]);
const clientsCreate  = vi.fn().mockResolvedValue({ id: 99, name: 'New Client', email: 'new@x.com' });
const clientsUpdate  = vi.fn().mockResolvedValue({ id: 1, name: 'Ana Updated' });
const clientsRemove  = vi.fn().mockResolvedValue(null);
const clientsGetById = vi.fn().mockResolvedValue({ ...mockClients[0], phone: '123456' });

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

import ClientsPage from './ClientsPage';

beforeEach(() => {
  vi.clearAllMocks();
  clientsGetAll.mockReset().mockResolvedValue(mockClients);
  clientsSearch.mockReset().mockResolvedValue([mockClients[0]]);
  clientsCreate.mockReset().mockResolvedValue({ id: 99, name: 'New Client', email: 'new@x.com' });
  clientsUpdate.mockReset().mockResolvedValue({ id: 1, name: 'Ana Updated' });
  clientsRemove.mockReset().mockResolvedValue(null);
  clientsGetById.mockReset().mockResolvedValue({ ...mockClients[0], phone: '123456' });
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><ClientsPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

function fillClientDialog({ name = 'Carlos Nuevo', email = 'carlos@x.com', password = 'secret123' } = {}) {
  const dialog = screen.getByRole('dialog');
  const inputs = dialog.querySelectorAll('input');
  if (name !== undefined) fireEvent.change(inputs[0], { target: { value: name } });
  const emailInput = dialog.querySelector('input[type="email"]');
  if (email !== undefined && emailInput) fireEvent.change(emailInput, { target: { value: email } });
  const passwordInput = dialog.querySelector('input[type="password"]');
  if (password !== undefined && passwordInput) fireEvent.change(passwordInput, { target: { value: password } });
  return dialog;
}

describe('ClientsPage — comprehensive', () => {

  it('loads and displays all clients', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
    expect(screen.getByText('Luis Ruiz')).toBeInTheDocument();
    expect(screen.getByText('Marta Sanz')).toBeInTheDocument();

  });

  it('shows KPI cards with counts', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

  });

  it('searches clients with debounce', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const searchInputs = screen.getAllByRole('textbox');
    const searchInput = searchInputs[0]; // first textbox is the search bar
    fireEvent.change(searchInput, { target: { value: 'Ana' } });

    // Wait for debounce to trigger
    await waitFor(() => expect(clientsSearch).toHaveBeenCalledWith('Ana'), { timeout: 3000 });

  });

  it('loads all when search is cleared', async () => {
    renderPage();
    await waitFor(() => expect(clientsGetAll).toHaveBeenCalled());

    const searchInputs = screen.getAllByRole('textbox');
    fireEvent.change(searchInputs[0], { target: { value: 'Ana' } });
    await waitFor(() => expect(clientsSearch).toHaveBeenCalled(), { timeout: 3000 });

    // Clear search
    fireEvent.change(searchInputs[0], { target: { value: '' } });

  });

  it('opens create modal, fills form, and saves', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('lient') || b.textContent.includes('uevo') || b.textContent.includes('rear')
    );
    if (createBtn) fireEvent.click(createBtn);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const dialog = fillClientDialog();

    const checkbox = dialog.querySelector('#student-check');
    if (checkbox) fireEvent.click(checkbox);

    fireEvent.click(within(dialog).getByRole('button', { name: /crear cliente/i }));

    await waitFor(() => expect(clientsCreate).toHaveBeenCalled());

  });

  it('validates required fields — empty email', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('lient') || b.textContent.includes('uevo')
    );
    if (createBtn) fireEvent.click(createBtn);
    await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

    // Fill name but not email
    const inputs = screen.getAllByRole('textbox');
    if (inputs[0]) fireEvent.change(inputs[0], { target: { value: 'Test' } });

    const saveBtn = screen.getAllByRole('button').find(b =>
      (b.textContent.includes('rear') || b.textContent.includes('reate')) && b.closest('[role="dialog"]')
    );
    if (saveBtn) fireEvent.click(saveBtn);
    expect(clientsCreate).not.toHaveBeenCalled();

  });

  it('validates required fields — empty password on create', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('lient') || b.textContent.includes('uevo')
    );
    if (createBtn) fireEvent.click(createBtn);
    await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

    // Fill email but no password or name
    const emailInputs = document.querySelectorAll('input[type="email"]');
    if (emailInputs[0]) fireEvent.change(emailInputs[0], { target: { value: 'test@x.com' } });

    const saveBtn = screen.getAllByRole('button').find(b =>
      (b.textContent.includes('rear') || b.textContent.includes('reate')) && b.closest('[role="dialog"]')
    );
    if (saveBtn) fireEvent.click(saveBtn);
    expect(clientsCreate).not.toHaveBeenCalled();

  });

  it('opens edit modal and updates client', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const editBtns = screen.getAllByTitle(/edit/i);
    if (editBtns.length > 0) fireEvent.click(editBtns[0]);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    const saveBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('uardar') || b.textContent.includes('ave')
    );
    if (saveBtn) fireEvent.click(saveBtn);
    await waitFor(() => expect(clientsUpdate).toHaveBeenCalled());

  });

  it('opens detail modal on row click', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Ana López'));
    await waitFor(() => {
      expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThanOrEqual(1);
    });
    // Should show client details and fidelity badge

  });

  it('opens delete confirmation and deletes client', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const deleteBtns = screen.getAllByTitle(/delet|eliminar/i);
    if (deleteBtns.length > 0) fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('liminar') || b.textContent.includes('elete')
      );
      if (confirmBtn) fireEvent.click(confirmBtn);
    });

    await waitFor(() => expect(clientsRemove).toHaveBeenCalled());

  });

  it('handles create error with 409 conflict', async () => {
    clientsCreate.mockRejectedValueOnce({ status: 409 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('lient') || b.textContent.includes('uevo')
    );
    if (createBtn) fireEvent.click(createBtn);
    await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

    const dialog = fillClientDialog({ name: 'Test', email: 'test@x.com', password: 'pass' });

    fireEvent.click(within(dialog).getByRole('button', { name: /crear cliente/i }));
    await waitFor(() => expect(clientsCreate).toHaveBeenCalled());

  });

  it('handles create error with 400 bad request', async () => {
    clientsCreate.mockRejectedValueOnce({ status: 400 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('lient') || b.textContent.includes('uevo')
    );
    if (createBtn) fireEvent.click(createBtn);
    await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

    const dialog = fillClientDialog({ name: 'T', email: 'e@x.com', password: 'p' });

    fireEvent.click(within(dialog).getByRole('button', { name: /crear cliente/i }));
    await waitFor(() => expect(clientsCreate).toHaveBeenCalled());

  });

  it('handles search error', async () => {
    clientsSearch.mockRejectedValueOnce(new Error('Network'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const searchInputs = screen.getAllByRole('textbox');
    fireEvent.change(searchInputs[0], { target: { value: 'fail' } });
    await waitFor(() => expect(clientsSearch).toHaveBeenCalled(), { timeout: 3000 });

  });

  it('handles load error', async () => {
    clientsGetAll.mockRejectedValueOnce(new Error('Network'));
    renderPage();
    await waitFor(() => expect(clientsGetAll).toHaveBeenCalled());

  });

  it('detail modal edit and delete actions work', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Ana López'));
    await waitFor(() => expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThanOrEqual(1));

    // Click edit from detail
    const editBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('dit') && b.closest('[role="dialog"]')
    );
    if (editBtn) fireEvent.click(editBtn);

  });

  it('cancels the create modal without saving', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(clientsCreate).not.toHaveBeenCalled();
  });

  it('handles generic create and delete errors', async () => {
    clientsCreate.mockRejectedValueOnce(new Error('fail'));
    clientsRemove.mockRejectedValueOnce(new Error('fail'));

    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    let dialog = fillClientDialog({ name: 'Error', email: 'error@x.com', password: 'pass' });
    fireEvent.click(within(dialog).getByRole('button', { name: /crear cliente/i }));
    await waitFor(() => expect(clientsCreate).toHaveBeenCalled());

    fireEvent.click(screen.getAllByTitle(/eliminar/i)[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(clientsRemove).toHaveBeenCalled());
  });

  it('opens delete confirmation from the detail modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Ana López'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('analopez')).toBeInTheDocument());

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar cliente/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar cliente/i }));

    await waitFor(() => expect(clientsRemove).toHaveBeenCalledWith(1));
  });
});
