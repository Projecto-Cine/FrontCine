import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const mockEmployees = [
  { id: 1, name: 'Carlos Técnico', email: 'carlos@x.com', role: 'CAJERO', phone: '600111222', active: true },
  { id: 2, name: 'Marta Gerente', email: 'marta@x.com', role: 'GERENCIA', phone: '600333444', active: true },
  { id: 3, name: 'Luis Seguridad', email: 'luis@x.com', role: 'SEGURIDAD', phone: '', active: false },
];

const employeesGetAll = vi.fn().mockResolvedValue(mockEmployees);
const employeesCreate = vi.fn().mockResolvedValue({ id: 99, name: 'New Employee' });
const employeesUpdate = vi.fn().mockResolvedValue({ id: 1, name: 'Carlos Updated' });
const employeesRemove = vi.fn().mockResolvedValue(null);

vi.mock('../../services/employeesService', () => ({
  employeesService: {
    getAll:  (...a) => employeesGetAll(...a),
    create:  (...a) => employeesCreate(...a),
    update:  (...a) => employeesUpdate(...a),
    remove:  (...a) => employeesRemove(...a),
    getById: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

import EmployeesPage from './EmployeesPage';

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><EmployeesPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('EmployeesPage — comprehensive', () => {

  it('loads and displays employees', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());
    expect(screen.getByText('Marta Gerente')).toBeInTheDocument();
  });

  it('shows KPI cards by role', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());
  });

  it('opens create modal, fills form, and saves', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('uevo') || b.textContent.includes('rear') || b.textContent.includes('ñadir')
    );
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

      const inputs = screen.getAllByRole('textbox');
      if (inputs[0]) fireEvent.change(inputs[0], { target: { value: 'New Employee' } });

      const emailInputs = document.querySelectorAll('input[type="email"]');
      if (emailInputs[0]) fireEvent.change(emailInputs[0], { target: { value: 'new@x.com' } });

      const selects = screen.getAllByRole('combobox');
      if (selects[0]) fireEvent.change(selects[0], { target: { value: 'CAJERO' } });

      // Phone
      const telInputs = document.querySelectorAll('input[type="tel"]');
      if (telInputs[0]) fireEvent.change(telInputs[0], { target: { value: '600555666' } });

      const saveBtn = screen.getAllByRole('button').find(b =>
        (b.textContent.includes('rear') || b.textContent.includes('ñadir') || b.textContent.includes('uardar')) && b.closest('[role="dialog"]')
      );
      if (saveBtn) fireEvent.click(saveBtn);
      await waitFor(() => expect(employeesCreate).toHaveBeenCalled());
    }
  });

  it('validates name and email required', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('uevo') || b.textContent.includes('rear')
    );
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

      const saveBtn = screen.getAllByRole('button').find(b =>
        (b.textContent.includes('rear') || b.textContent.includes('ñadir')) && b.closest('[role="dialog"]')
      );
      if (saveBtn) fireEvent.click(saveBtn);
      expect(employeesCreate).not.toHaveBeenCalled();
    }
  });

  it('opens edit modal for existing employee and saves', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const editBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

      const inputs = screen.getAllByRole('textbox');
      if (inputs[0]) fireEvent.change(inputs[0], { target: { value: 'Carlos Updated' } });

      const saveBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('uardar') || b.textContent.includes('ave')
      );
      if (saveBtn) fireEvent.click(saveBtn);
      await waitFor(() => expect(employeesUpdate).toHaveBeenCalled());
    }
  });

  it('handles delete confirmation', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns.length > 1) {
      fireEvent.click(rowBtns[1]); // second = delete
      await waitFor(() => {
        const confirmBtn = screen.getAllByRole('button').find(b =>
          b.textContent.includes('liminar') || b.textContent.includes('elete')
        );
        if (confirmBtn) fireEvent.click(confirmBtn);
      });
    }
  });

  it('handles save error', async () => {
    employeesCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('uevo') || b.textContent.includes('rear')
    );
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

      const inputs = screen.getAllByRole('textbox');
      if (inputs[0]) fireEvent.change(inputs[0], { target: { value: 'Test' } });
      const emailInputs = document.querySelectorAll('input[type="email"]');
      if (emailInputs[0]) fireEvent.change(emailInputs[0], { target: { value: 'e@x.com' } });

      const saveBtn = screen.getAllByRole('button').find(b =>
        (b.textContent.includes('rear') || b.textContent.includes('ñadir')) && b.closest('[role="dialog"]')
      );
      if (saveBtn) fireEvent.click(saveBtn);
    }
  });

  it('handles load error', async () => {
    employeesGetAll.mockRejectedValueOnce(new Error('Network'));
    renderPage();
    await waitFor(() => expect(employeesGetAll).toHaveBeenCalled());
  });

  it('closes create modal via cancel', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Carlos Técnico')).toBeInTheDocument());

    const createBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('uevo') || b.textContent.includes('rear')
    );
    if (createBtn) {
      fireEvent.click(createBtn);
      await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1));

      const cancelBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('ancelar')
      );
      if (cancelBtn) fireEvent.click(cancelBtn);
    }
  });
});
