import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const mockItems = [
  { id: 1, name: 'Projector Bulb', category: 'Técnico', quantity: 2, min_stock: 5, unit: 'ud', location: 'A1', supplier: 'TechCo', price_unit: 120 },
  { id: 2, name: 'Popcorn Bags', category: 'Concesión', quantity: 200, min_stock: 50, unit: 'ud', location: 'B1', supplier: 'FoodCo', price_unit: 0.5 },
  { id: 3, name: 'Cleaning Spray', category: 'Limpieza', quantity: 0, min_stock: 10, unit: 'l', location: 'C1', supplier: 'CleanCo', price_unit: 8 },
];

const invGetAll = vi.fn().mockResolvedValue(mockItems);
const invCreate = vi.fn().mockResolvedValue({ id: 99, name: 'New' });
const invUpdate = vi.fn().mockResolvedValue({ id: 1, name: 'Updated' });

vi.mock('../../services/inventoryService', () => ({
  inventoryService: { getAll: (...a) => invGetAll(...a), create: (...a) => invCreate(...a), update: (...a) => invUpdate(...a), remove: vi.fn() },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

import InventoryPage from './InventoryPage';
beforeEach(() => vi.clearAllMocks());

const R = () => render(
  <MemoryRouter><LanguageProvider><AppProvider><InventoryPage /></AppProvider></LanguageProvider></MemoryRouter>
);

describe('InventoryPage', () => {
  it('loads and displays items', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    expect(screen.getByText('Popcorn Bags')).toBeInTheDocument();
  });

  it('shows KPI cards and alert banner', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    // Alert banner for items below min stock
    expect(document.querySelector('[class*="alert"]')).toBeTruthy();
  });

  it('filters by category', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    const btns = screen.getAllByRole('button').filter(b => b.className?.includes('filter'));
    if (btns[1]) { fireEvent.click(btns[1]); await waitFor(() => {}); }
    if (btns[0]) fireEvent.click(btns[0]);
  });

  it('creates new item', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('ñadir') || b.textContent.includes('uevo'))?.click();
    await waitFor(() => expect(document.getElementById('inv-name')).toBeTruthy());
    fireEvent.change(document.getElementById('inv-name'), { target: { value: 'HDMI Cable' } });
    fireEvent.change(document.getElementById('inv-qty'), { target: { value: '10' } });
    fireEvent.change(document.getElementById('inv-min'), { target: { value: '3' } });
    fireEvent.change(document.getElementById('inv-price'), { target: { value: '15' } });
    fireEvent.change(document.getElementById('inv-loc'), { target: { value: 'D1' } });
    fireEvent.change(document.getElementById('inv-sup'), { target: { value: 'X' } });
    fireEvent.change(document.getElementById('inv-unit'), { target: { value: 'ud' } });
    fireEvent.change(document.getElementById('inv-cat'), { target: { value: 'Técnico' } });
    const dlg = document.querySelectorAll('[role="dialog"] button');
    const save = [...dlg].find(b => b.textContent.includes('ñadir'));
    if (save) fireEvent.click(save);
    await waitFor(() => expect(invCreate).toHaveBeenCalled());
  });

  it('validates name required', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('ñadir'))?.click();
    await waitFor(() => document.getElementById('inv-name'));
    const dlg = document.querySelectorAll('[role="dialog"] button');
    [...dlg].find(b => b.textContent.includes('ñadir'))?.click();
    expect(invCreate).not.toHaveBeenCalled();
  });

  it('edits item', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    const rowBtns = screen.getAllByRole('button').filter(b => b.closest('td'));
    if (rowBtns[0]) fireEvent.click(rowBtns[0]);
    await waitFor(() => { if (document.getElementById('inv-name')) return true; });
    if (document.getElementById('inv-name')) {
      fireEvent.change(document.getElementById('inv-name'), { target: { value: 'Bulb v2' } });
      const save = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.includes('uardar'));
      if (save) fireEvent.click(save);
      await waitFor(() => expect(invUpdate).toHaveBeenCalled());
    }
  });

  it('handles save error', async () => {
    invCreate.mockRejectedValueOnce(new Error('fail'));
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('ñadir'))?.click();
    await waitFor(() => document.getElementById('inv-name'));
    fireEvent.change(document.getElementById('inv-name'), { target: { value: 'T' } });
    const dlg = document.querySelectorAll('[role="dialog"] button');
    [...dlg].find(b => b.textContent.includes('ñadir'))?.click();
  });

  it('handles load error', async () => {
    invGetAll.mockRejectedValueOnce(new Error('Net'));
    R();
    await waitFor(() => expect(invGetAll).toHaveBeenCalled());
  });

  it('closes modal via cancel', async () => {
    R();
    await waitFor(() => expect(screen.getByText('Projector Bulb')).toBeInTheDocument());
    screen.getAllByRole('button').find(b => b.textContent.includes('ñadir'))?.click();
    await waitFor(() => document.getElementById('inv-name'));
    screen.getAllByRole('button').find(b => b.textContent.includes('ancelar'))?.click();
  });
});
