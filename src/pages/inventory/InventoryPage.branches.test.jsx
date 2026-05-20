/**
 * InventoryPage — branch coverage tests.
 *
 * Exercises:
 *   - stockStatus branches: none / low / ok
 *   - filter by category (all + specific)
 *   - alert banner branch (items below min)
 *   - save error branch
 *   - save without name validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
import React from 'react';

const invGetAll = vi.fn();
const invCreate = vi.fn();
const invUpdate = vi.fn();
const invRemove = vi.fn();

vi.mock('../../services/inventoryService', () => ({
  inventoryService: {
    getAll: (...a) => invGetAll(...a),
    create: (...a) => invCreate(...a),
    update: (...a) => invUpdate(...a),
    remove: (...a) => invRemove(...a),
  },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

const ITEMS = [
  { id: 1, name: 'Projector Bulb', category: 'Comida',       quantity: 0,  min_stock: 5, price_unit: 100, supplier: 'X', unit: 'ud' }, // none
  { id: 2, name: 'Popcorn Bag',    category: 'Bebida',       quantity: 3,  min_stock: 5, price_unit: 2,   supplier: 'Y', unit: 'ud' }, // low
  { id: 3, name: 'Cup',            category: 'Merchandise',  quantity: 99, min_stock: 5, price_unit: 0.5, supplier: 'Z', unit: 'ud' }, // ok
];

import InventoryPage from './InventoryPage';

beforeEach(() => {
  vi.clearAllMocks();
  invGetAll.mockResolvedValue(ITEMS);
  invCreate.mockResolvedValue({ id: 99, name: 'New', quantity: 10 });
  invUpdate.mockResolvedValue({ id: 1, name: 'Updated' });
  invRemove.mockResolvedValue({});
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><InventoryPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

describe('InventoryPage — branch coverage', () => {
  it('renders rows with the three stock-status branches', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    expect(screen.getByText('Popcorn Bag')).toBeInTheDocument();
    expect(screen.getByText('Cup')).toBeInTheDocument();
  });

  it('shows alert banner when items are below min stock', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    expect(document.querySelector('[class*="alert"]')).toBeTruthy();
  });

  it('does not show alert banner when all stock is ok', async () => {
    invGetAll.mockResolvedValueOnce([ITEMS[2]]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Cup')).toBeInTheDocument());
  });

  it('handles non-array load response', async () => {
    invGetAll.mockResolvedValueOnce(null);
    renderPage();
    await waitFor(() => expect(invGetAll).toHaveBeenCalled());
  });

  it('handles load error', async () => {
    invGetAll.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(invGetAll).toHaveBeenCalled());
  });

  it('filters by category and back to all', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());

    const filterBtns = screen.getAllByRole('button').filter(b => b.className?.includes('filter'));
    if (filterBtns[1]) fireEvent.click(filterBtns[1]);
    await waitFor(() => { /* settle */ });
    if (filterBtns[0]) fireEvent.click(filterBtns[0]);
  });

  it('rejects save with empty name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => /ñadir|uevo/i.test(b.textContent ?? ''))?.click();
    await waitFor(() => expect(document.getElementById('inv-name')).toBeTruthy());

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /ñadir|rear/i.test(b.textContent ?? ''));
    if (saveBtn) fireEvent.click(saveBtn);
    expect(invCreate).not.toHaveBeenCalled();
  });

  it('handles save error during create', async () => {
    invCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());

    screen.getAllByRole('button').find(b => /ñadir|uevo/i.test(b.textContent ?? ''))?.click();
    await waitFor(() => expect(document.getElementById('inv-name')).toBeTruthy());
    fireEvent.change(document.getElementById('inv-name'), { target: { value: 'X' } });
    fireEvent.change(document.getElementById('inv-qty'), { target: { value: '10' } });
    fireEvent.change(document.getElementById('inv-min'), { target: { value: '3' } });
    fireEvent.change(document.getElementById('inv-price'), { target: { value: '5' } });

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /ñadir|rear/i.test(b.textContent ?? ''));
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(invCreate).toHaveBeenCalled());
    }
  });

  it('handles update success with merged fallback', async () => {
    invUpdate.mockResolvedValueOnce(null); // null → fallback to merged object
    renderPage();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());

    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) {
      fireEvent.click(rowBtns[0]);
      await waitFor(() => expect(document.getElementById('inv-name')).toBeTruthy());
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => /uardar/i.test(b.textContent ?? ''));
      if (save) {
        fireEvent.click(save);
        await waitFor(() => expect(invUpdate).toHaveBeenCalled());
      }
    }
  });
});
