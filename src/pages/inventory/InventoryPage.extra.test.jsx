/**
 * InventoryPage — extra coverage for stock modal, order modal, and new-supplier flow.
 *
 * Covers lines/branches not reached by the base test suite:
 *   - stockModal 'belowMin' and 'noStock' (open, render items, close via X and Cerrar)
 *   - orderModal (open via "Hacer pedido", change qty, export, cancel)
 *   - newSupplier branch (select "__new__" shows text input, submit with custom name)
 *   - merchandise:updated event listener triggers reload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

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
  { id: 1, name: 'Coca-Cola',  category: 'Bebida',      quantity: 0,  min_stock: 10, unit: 'ud',    supplier: 'Proveedor A', price_unit: 1.5 },
  { id: 2, name: 'Palomitas',  category: 'Comida',       quantity: 3,  min_stock: 10, unit: 'bolsa', supplier: 'Proveedor B', price_unit: 2.0 },
  { id: 3, name: 'Taza Dune',  category: 'Merchandise',  quantity: 50, min_stock: 5,  unit: 'ud',    supplier: 'Proveedor A', price_unit: 12  },
];

import InventoryPage from './InventoryPage';

beforeEach(() => {
  vi.clearAllMocks();
  invGetAll.mockResolvedValue(ITEMS);
  invCreate.mockResolvedValue({ id: 99, name: 'New', quantity: 10 });
  invUpdate.mockResolvedValue({ id: 1, name: 'Updated' });
  invRemove.mockResolvedValue({});
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

function renderPage() {
  return render(
    <MemoryRouter><LanguageProvider><AppProvider><InventoryPage /></AppProvider></LanguageProvider></MemoryRouter>
  );
}

async function waitForItems() {
  await waitFor(() => expect(screen.getByText('Coca-Cola')).toBeInTheDocument());
}

// ─── Stock modal ──────────────────────────────────────────────────────────────

describe('InventoryPage — stockModal', () => {
  it('opens belowMin modal via KPI card and shows grouped items', async () => {
    renderPage();
    await waitForItems();

    const kpi = screen.getByRole('button', { name: 'Bajo mínimo' });
    fireEvent.click(kpi);

    await waitFor(() => expect(screen.getByText('Productos bajo mínimo')).toBeInTheDocument());
    // Both suppliers rendered
    expect(screen.getAllByText('Proveedor A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Proveedor B').length).toBeGreaterThan(0);
    // "Bajo mínimo" badge on qty>0 item, "Sin stock" badge on qty=0 item
    expect(screen.getAllByText('Sin stock').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bajo mínimo').length).toBeGreaterThan(0);
  });

  it('opens noStock modal via KPI card and shows only zero-qty items', async () => {
    renderPage();
    await waitForItems();

    const kpi = screen.getByRole('button', { name: 'Sin stock' });
    fireEvent.click(kpi);

    await waitFor(() => expect(screen.getByText('Productos sin stock')).toBeInTheDocument());
    expect(screen.getAllByText('Coca-Cola').length).toBeGreaterThan(0);
  });

  it('closes stock modal via X (aria-label="Cerrar") button', async () => {
    renderPage();
    await waitForItems();

    fireEvent.click(screen.getByRole('button', { name: 'Sin stock' }));
    await waitFor(() => expect(screen.getByText('Productos sin stock')).toBeInTheDocument());

    const xBtn = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
    if (xBtn) fireEvent.click(xBtn);
    await waitFor(() => expect(screen.queryByText('Productos sin stock')).not.toBeInTheDocument());
  });

  it('closes stock modal via the "Cerrar" footer button', async () => {
    renderPage();
    await waitForItems();

    fireEvent.click(screen.getByRole('button', { name: 'Sin stock' }));
    await waitFor(() => expect(screen.getByText('Productos sin stock')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Cerrar'));
    await waitFor(() => expect(screen.queryByText('Productos sin stock')).not.toBeInTheDocument());
  });

  it('shows empty message when noStock list is empty', async () => {
    invGetAll.mockResolvedValueOnce([
      { id: 1, name: 'Coca-Cola', category: 'Bebida', quantity: 5, min_stock: 3, unit: 'ud', supplier: 'X', price_unit: 1 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Coca-Cola')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Sin stock' }));
    await waitFor(() => expect(screen.getByText('Productos sin stock')).toBeInTheDocument());
    expect(screen.getByText('No hay productos en esta categoría.')).toBeInTheDocument();
  });
});

// ─── Order modal ──────────────────────────────────────────────────────────────

describe('InventoryPage — orderModal', () => {
  async function openOrderModal(mode = 'belowMin') {
    renderPage();
    await waitForItems();

    const kpiLabel = mode === 'belowMin' ? 'Bajo mínimo' : 'Sin stock';
    fireEvent.click(screen.getByRole('button', { name: kpiLabel }));
    const stockTitle = mode === 'belowMin' ? 'Productos bajo mínimo' : 'Productos sin stock';
    await waitFor(() => expect(screen.getByText(stockTitle)).toBeInTheDocument());

    fireEvent.click(screen.getByText('Hacer pedido'));
    const orderTitle = mode === 'belowMin' ? 'Hacer pedido — bajo mínimo' : 'Hacer pedido — sin stock';
    await waitFor(() => expect(screen.getByText(orderTitle)).toBeInTheDocument());
  }

  it('opens order modal for belowMin mode and renders qty inputs', async () => {
    await openOrderModal('belowMin');
    const qtyInputs = document.querySelectorAll('input[type="number"]');
    expect(qtyInputs.length).toBeGreaterThan(0);
  });

  it('opens order modal for noStock mode', async () => {
    await openOrderModal('noStock');
    expect(screen.getByText('Hacer pedido — sin stock')).toBeInTheDocument();
  });

  it('changes qty input in order modal', async () => {
    await openOrderModal('belowMin');

    const qtyInputs = document.querySelectorAll('input[type="number"]');
    if (qtyInputs[0]) {
      fireEvent.change(qtyInputs[0], { target: { value: '25' } });
      expect(qtyInputs[0].value).toBe('25');
    }
  });

  it('exports order to clipboard and closes modal', async () => {
    await openOrderModal('belowMin');

    const qtyInputs = document.querySelectorAll('input[type="number"]');
    if (qtyInputs[0]) fireEvent.change(qtyInputs[0], { target: { value: '15' } });

    fireEvent.click(screen.getByText('Exportar pedido'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Hacer pedido — bajo mínimo')).not.toBeInTheDocument());
  });

  it('cancels order modal via Cancelar button', async () => {
    await openOrderModal('noStock');

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Hacer pedido — sin stock')).not.toBeInTheDocument());
  });

  it('closes order modal via X button', async () => {
    await openOrderModal('belowMin');

    const xBtn = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
    if (xBtn) fireEvent.click(xBtn);
    await waitFor(() => expect(screen.queryByText('Hacer pedido — bajo mínimo')).not.toBeInTheDocument());
  });
});

// ─── New supplier ─────────────────────────────────────────────────────────────

describe('InventoryPage — new supplier', () => {
  async function openCreateModal() {
    renderPage();
    await waitForItems();
    screen.getAllByRole('button').find(b => /ñadir|uevo/i.test(b.textContent ?? ''))?.click();
    await waitFor(() => expect(document.getElementById('inv-name')).toBeTruthy());
  }

  it('shows text input when "+ Añadir nuevo proveedor" is selected', async () => {
    await openCreateModal();

    const supSel = document.getElementById('inv-sup');
    expect(supSel.tagName.toLowerCase()).toBe('select');

    fireEvent.change(supSel, { target: { value: '__new__' } });

    await waitFor(() => {
      const supField = document.getElementById('inv-sup');
      expect(supField.tagName.toLowerCase()).toBe('input');
    });
  });

  it('saves item with new supplier name entered in text input', async () => {
    await openCreateModal();

    fireEvent.change(document.getElementById('inv-name'), { target: { value: 'Nuevo Producto' } });

    fireEvent.change(document.getElementById('inv-sup'), { target: { value: '__new__' } });
    await waitFor(() => expect(document.getElementById('inv-sup').tagName.toLowerCase()).toBe('input'));

    fireEvent.change(document.getElementById('inv-sup'), { target: { value: 'Mi Proveedor' } });

    const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find(b => /ñadir|rear/i.test(b.textContent ?? ''));
    if (saveBtn) {
      fireEvent.click(saveBtn);
      await waitFor(() => expect(invCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nuevo Producto', supplier: 'Mi Proveedor' })
      ));
    }
  });

  it('selects existing supplier from dropdown', async () => {
    await openCreateModal();

    const supSel = document.getElementById('inv-sup');
    fireEvent.change(supSel, { target: { value: 'Proveedor A' } });
    expect(supSel.value).toBe('Proveedor A');
  });
});

// ─── merchandise:updated event ────────────────────────────────────────────────

describe('InventoryPage — merchandise:updated event', () => {
  it('reloads inventory on merchandise:updated event', async () => {
    renderPage();
    await waitForItems();

    const callsBefore = invGetAll.mock.calls.length;
    window.dispatchEvent(new Event('merchandise:updated'));
    await waitFor(() => expect(invGetAll.mock.calls.length).toBeGreaterThan(callsBefore));
  });
});
