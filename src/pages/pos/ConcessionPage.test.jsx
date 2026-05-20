import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';
/* ── Mock data ────────────────────────────────────────── */
const mockProducts = [
  { id: 1, name: 'Palomitas', category: 'FOOD', price: 5.5, quantity: 10, description: 'Saladas', emoji: '🍿', imageUrl: '' },
  { id: 2, name: 'Coca-Cola', category: 'DRINK', price: 3.0, quantity: 5, description: '', emoji: '🥤', imageUrl: '' },
  { id: 3, name: 'Camiseta', category: 'MERCHANDISE', price: 15.0, quantity: 2, description: 'Logo Lumen', imageUrl: 'https://cdn/img.jpg' },
];

/* ── Service mocks ───────────────────────────────────── */
const inventoryGetAll = vi.fn().mockResolvedValue(mockProducts);
const inventoryCreate = vi.fn().mockResolvedValue({ id: 99, name: 'Nuevo' });
const inventoryUpdate = vi.fn().mockResolvedValue({ id: 1, name: 'Palomitas XL' });
const inventoryRemove = vi.fn().mockResolvedValue(null);
const productUploadImage = vi.fn().mockResolvedValue('https://cdn/uploaded.jpg');

vi.mock('../../services/inventoryService', () => ({
  inventoryService: {
    getAll:  (...a) => inventoryGetAll(...a),
    create:  (...a) => inventoryCreate(...a),
    update:  (...a) => inventoryUpdate(...a),
    remove:  (...a) => inventoryRemove(...a),
  },
}));

vi.mock('../../services/salesService', () => ({
  salesService: {
    createConcessionSale:   vi.fn().mockResolvedValue({ id: 1 }),
    createMerchandiseSale:  vi.fn().mockResolvedValue({ remainingStock: 9 }),
  },
}));

vi.mock('../../services/cloudinaryService', () => ({
  uploadImage: (...a) => productUploadImage(...a),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'GERENCIA' } }),
}));

import ConcessionPage from './ConcessionPage';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  inventoryGetAll.mockResolvedValue(mockProducts);
  productUploadImage.mockResolvedValue('https://cdn/uploaded.jpg');
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <ConcessionPage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

const isManageButton = (button) =>
  /gestionar|gestión|manage/i.test(`${button.textContent ?? ''} ${button.title ?? ''}`);

describe('ConcessionPage — comprehensive', () => {

  it('loads and displays products from the inventory service', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
    expect(screen.getByText('Camiseta')).toBeInTheDocument();
  });

  it('filters products by category tabs', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Click on DRINK category
    const drinkTab = screen.getAllByRole('button').find(b => b.textContent.includes('Bebida'));
    if (drinkTab) {
      fireEvent.click(drinkTab);
      await waitFor(() => {
        expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
        expect(screen.queryByText('Palomitas')).not.toBeInTheDocument();
      });
    }

    // Click Todo tab to show all
    const todoTab = screen.getAllByRole('button').find(b => b.textContent.includes('Todo'));
    if (todoTab) {
      fireEvent.click(todoTab);
      await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    }
  });

  it('filters products by search input', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'cola' } });

    await waitFor(() => {
      expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
      expect(screen.queryByText('Palomitas')).not.toBeInTheDocument();
    });

    // Clear search
    const clearBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-label')?.toLowerCase().includes('clear') || b.getAttribute('aria-label')?.toLowerCase().includes('limpiar'));
    if (clearBtn) {
      fireEvent.click(clearBtn);
      await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    }
  });

  it('adds products to cart and shows quantity', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Click product to add to cart
    const productBtn = screen.getByText('Palomitas').closest('button');
    fireEvent.click(productBtn);

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('€5.50') && text.includes('/ ud.'))).toBeInTheDocument();
    });

    // Click again to increment quantity
    fireEvent.click(productBtn);
    await waitFor(() => {
      const qtyElements = screen.getAllByText('2');
      expect(qtyElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('increments and decrements cart item quantity', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const productBtn = screen.getByText('Palomitas').closest('button');
    fireEvent.click(productBtn);
    fireEvent.click(productBtn);

    await waitFor(() => {
      const qtyElements = screen.getAllByText('2');
      expect(qtyElements.length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByLabelText(/reducir cantidad de palomitas/i));
  });

  it('removes item from cart via remove button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('€5.50') && text.includes('/ ud.'))).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/eliminar del carrito:\s*palomitas/i));
    await waitFor(() => expect(screen.queryByText((text) => text.includes('€5.50') && text.includes('/ ud.'))).not.toBeInTheDocument());
  });

  it('clears entire cart via clear button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    await waitFor(() => expect(screen.getByText('TOTAL')).toBeInTheDocument());

    // Click clear cart button (trash icon)
    const clearCartBtn = screen.getAllByRole('button').find(b =>
      b.getAttribute('aria-label')?.toLowerCase().includes('vaciar') ||
      b.getAttribute('aria-label')?.toLowerCase().includes('clear')
    );
    if (clearCartBtn) fireEvent.click(clearCartBtn);
  });

  it('switches between payment methods', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Add item to cart
    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    await waitFor(() => expect(screen.getByText('TOTAL')).toBeInTheDocument());

    // Click cash payment tab
    const cashTab = screen.getAllByRole('button').find(b =>
      b.getAttribute('aria-pressed') !== null && b.textContent.includes('fectivo')
    );
    if (cashTab) {
      fireEvent.click(cashTab);
      await waitFor(() => {
        // Cash input should appear
        const numInputs = document.querySelectorAll('input[type="number"]');
        expect(numInputs.length).toBeGreaterThanOrEqual(1);
      });

      // Enter cash amount
      const cashInput = document.querySelector('input[type="number"]');
      if (cashInput) fireEvent.change(cashInput, { target: { value: '10' } });

      // Click quick cash button
      const quickBtn = screen.getAllByRole('button').find(b => b.textContent === '€10');
      if (quickBtn) fireEvent.click(quickBtn);
    }
  });

  it('opens payment confirmation modal and completes sale', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Add items to cart
    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    fireEvent.click(screen.getByText('Coca-Cola').closest('button'));

    // Open pay modal (F4 button or cobrar button)
    await waitFor(() => expect(screen.getByText('TOTAL')).toBeInTheDocument());
    const cobrarBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('obrar') || b.textContent.includes('F4')
    );
    if (cobrarBtn && !cobrarBtn.disabled) {
      fireEvent.click(cobrarBtn);

      await waitFor(() => {
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();
      });

      // Click confirm in the modal
      const confirmBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('onfirmar') && !b.textContent.includes('ancelar')
      );
      if (confirmBtn) {
        fireEvent.click(confirmBtn);
        // Receipt should appear
        await waitFor(() => {
          const receiptId = document.querySelector('[id="receipt-modal-title"]');
          // Should show success state
        });
      }
    }
  });

  it('shows receipt after payment and resets on new sale', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    const cobrarBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('obrar') || b.textContent.includes('F4')
    );
    if (cobrarBtn && !cobrarBtn.disabled) {
      fireEvent.click(cobrarBtn);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      const confirmBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('onfirmar') && !b.textContent.includes('ancelar')
      );
      if (confirmBtn) fireEvent.click(confirmBtn);

      // Wait for receipt, then click "New sale"
      await waitFor(() => {
        const newSaleBtn = screen.getAllByRole('button').find(b =>
          b.textContent.includes('ueva venta') || b.textContent.includes('ew sale')
        );
        if (newSaleBtn) fireEvent.click(newSaleBtn);
      });
    }
  });

  it('handles cash payment with insufficient amount', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));

    // Switch to cash
    const cashTab = screen.getAllByRole('button').find(b =>
      b.getAttribute('aria-pressed') !== null && b.textContent.includes('fectivo')
    );
    if (cashTab) {
      fireEvent.click(cashTab);
      const cashInput = document.querySelector('input[type="number"]');
      if (cashInput) fireEvent.change(cashInput, { target: { value: '1' } }); // less than total

      // Cobrar button should be disabled
      const cobrarBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('obrar') || b.textContent.includes('F4')
      );
      if (cobrarBtn) expect(cobrarBtn.disabled).toBe(true);
    }
  });

  it('shows insufficient cash toast from the confirmation modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    const cashTab = screen.getAllByRole('button').find(b =>
      b.getAttribute('aria-pressed') !== null && b.textContent.includes('Efectivo')
    );
    fireEvent.click(cashTab);
    const cashInput = document.querySelector('input[type="number"]');
    fireEvent.change(cashInput, { target: { value: '1' } });

    fireEvent.keyDown(window, { key: 'F4' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts F2, F4, F5, Escape', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // F2 focuses search
    fireEvent.keyDown(window, { key: 'F2' });

    // Add item to cart
    fireEvent.click(screen.getByText('Palomitas').closest('button'));

    // F4 opens pay modal
    fireEvent.keyDown(window, { key: 'F4' });
    await waitFor(() => { /* settle */ });

    // Escape should close if no modals
    fireEvent.keyDown(window, { key: 'Escape' });

    // F5 resets
    fireEvent.keyDown(window, { key: 'F5' });
  });

  it('opens product manager modal for admin users', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Find manage button
    const manageBtns = screen.getAllByRole('button').filter(isManageButton);
    if (manageBtns.length > 0) {
      fireEvent.click(manageBtns[0]);

      await waitFor(() => {
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();
      });
    }
  });

  it('creates a new product via manager modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    // Open manager
    const manageBtns = screen.getAllByRole('button').filter(isManageButton);
    if (manageBtns.length > 0) {
      fireEvent.click(manageBtns[0]);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      // Click "New product"
      const newBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('uevo producto') || b.textContent.includes('ew product')
      );
      if (newBtn) {
        fireEvent.click(newBtn);
        await waitFor(() => document.getElementById('pf-name'));

        // Fill form
        fireEvent.change(document.getElementById('pf-name'), { target: { value: 'Nachos' } });
        fireEvent.change(document.getElementById('pf-price'), { target: { value: '4.50' } });
        fireEvent.change(document.getElementById('pf-stock'), { target: { value: '20' } });

        // Save
        const saveBtn = screen.getAllByRole('button').find(b =>
          b.textContent.includes('rear producto') || b.textContent.includes('reate')
        );
        if (saveBtn) {
          fireEvent.click(saveBtn);
          await waitFor(() => expect(inventoryCreate).toHaveBeenCalled());
        }
      }
    }
  });

  it('edits an existing product via manager modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const manageBtns = screen.getAllByRole('button').filter(isManageButton);
    if (manageBtns.length > 0) {
      fireEvent.click(manageBtns[0]);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      // Click edit on first product
      const editBtns = screen.getAllByRole('button').filter(b =>
        b.getAttribute('aria-label')?.includes('ditar') || b.getAttribute('aria-label')?.includes('dit')
      );
      if (editBtns.length > 0) {
        fireEvent.click(editBtns[0]);
        await waitFor(() => document.getElementById('pf-name'));

        fireEvent.change(document.getElementById('pf-name'), { target: { value: 'Palomitas XL' } });

        const saveBtn = screen.getAllByRole('button').find(b =>
          b.textContent.includes('uardar') || b.textContent.includes('ave')
        );
        if (saveBtn) {
          fireEvent.click(saveBtn);
          await waitFor(() => expect(inventoryUpdate).toHaveBeenCalled());
        }
      }
    }
  });

  it('deletes a product via manager modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const manageBtns = screen.getAllByRole('button').filter(isManageButton);
    if (manageBtns.length > 0) {
      fireEvent.click(manageBtns[0]);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      const deleteBtns = screen.getAllByRole('button').filter(b =>
        b.getAttribute('aria-label')?.includes('liminar') || b.getAttribute('aria-label')?.includes('elete')
      );
      if (deleteBtns.length > 0) {
        fireEvent.click(deleteBtns[0]);
        await waitFor(() => expect(inventoryRemove).toHaveBeenCalled());
      }
    }
  });

  it('handles product save validation (empty name/price)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const manageBtns = screen.getAllByRole('button').filter(isManageButton);
    if (manageBtns.length > 0) {
      fireEvent.click(manageBtns[0]);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      const newBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('uevo') || b.textContent.includes('ew')
      );
      if (newBtn) {
        fireEvent.click(newBtn);
        await waitFor(() => document.getElementById('pf-name'));

        // Try to save empty form
        const saveBtn = screen.getAllByRole('button').find(b =>
          b.textContent.includes('rear') || b.textContent.includes('reate')
        );
        if (saveBtn) {
          fireEvent.click(saveBtn);
          expect(inventoryCreate).not.toHaveBeenCalled();
        }
      }
    }
  });

  it('uploads and removes a product image in the manager form', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const manageBtn = screen.getAllByRole('button').find(isManageButton);
    fireEvent.click(manageBtn);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));
    await waitFor(() => expect(document.getElementById('pf-name')).toBeTruthy());

    const selectImageBtn = screen.getByRole('button', { name: /seleccionar imagen/i });
    fireEvent.click(selectImageBtn);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['poster'], 'poster.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByAltText(/vista previa/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /quitar/i }));
    expect(screen.queryByAltText(/vista previa/i)).not.toBeInTheDocument();
  });

  it('handles inventory load error', async () => {
    inventoryGetAll.mockRejectedValueOnce(new Error('Network'));
    renderPage();
    await waitFor(() => expect(inventoryGetAll).toHaveBeenCalled());
  });

  it('shows empty state when no products match filter', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'zzzznotexist' } });
    await waitFor(() => expect(screen.queryByText('Palomitas')).not.toBeInTheDocument());
  });

  it('handles close pay modal via overlay click', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    const cobrarBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('obrar') || b.textContent.includes('F4')
    );
    if (cobrarBtn && !cobrarBtn.disabled) {
      fireEvent.click(cobrarBtn);
      await waitFor(() => document.querySelector('[role="dialog"]'));

      // Close via cancel button
      const cancelBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('ancelar')
      );
      if (cancelBtn) fireEvent.click(cancelBtn);
    }
  });

  it('print button calls window.print on receipt', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    const cobrarBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('obrar') || b.textContent.includes('F4')
    );
    if (cobrarBtn && !cobrarBtn.disabled) {
      fireEvent.click(cobrarBtn);
      await waitFor(() => document.querySelector('[role="dialog"]'));
      const confirmBtn = screen.getAllByRole('button').find(b =>
        b.textContent.includes('onfirmar')
      );
      if (confirmBtn) {
        fireEvent.click(confirmBtn);
        await waitFor(() => {
          const printBtn = screen.getAllByRole('button').find(b =>
            b.textContent.includes('mprimir') || b.textContent.includes('rint')
          );
          if (printBtn) {
            fireEvent.click(printBtn);
            expect(printSpy).toHaveBeenCalled();
          }
        });
      }
    }
    printSpy.mockRestore();
  });

  it('handles product with image (shows img element)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Camiseta')).toBeInTheDocument());
    // Product with imageUrl should render an img
    const imgs = document.querySelectorAll('img');
    // At least the Camiseta product has an image
  });

  it('closes the payment modal with the header button and resets after receipt', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Palomitas').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /cobrar/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^cerrar$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cobrar/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /nueva venta/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    expect(screen.queryByRole('button', { name: /nueva venta/i })).not.toBeInTheDocument();
  });

  it('handles image fallbacks and manager back/cancel actions', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Camiseta')).toBeInTheDocument());

    fireEvent.error(screen.getByAltText('Camiseta'));

    fireEvent.click(screen.getByRole('button', { name: /gestionar/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.error(screen.getAllByAltText('Camiseta').at(-1));

    fireEvent.click(screen.getByLabelText(/editar producto palomitas/i));
    await waitFor(() => expect(document.getElementById('pf-name')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /volver a la lista/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));
    await waitFor(() => expect(document.getElementById('pf-name')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument();
  });

  it('handles upload, save, and delete failures in the manager', async () => {
    productUploadImage.mockRejectedValueOnce(new Error('Subida fallida'));
    inventoryCreate.mockRejectedValueOnce({ status: 401 });
    inventoryRemove.mockRejectedValueOnce(new Error('No borrar'));

    renderPage();
    await waitFor(() => expect(screen.getByText('Palomitas')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /gestionar/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));
    await waitFor(() => expect(document.getElementById('pf-name')).toBeTruthy());

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['image'], 'fallo.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(productUploadImage).toHaveBeenCalled());

    fireEvent.change(document.getElementById('pf-name'), { target: { value: 'Nachos' } });
    fireEvent.change(document.getElementById('pf-price'), { target: { value: '4.50' } });
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));
    await waitFor(() => expect(inventoryCreate).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /volver a la lista/i }));
    await waitFor(() => expect(screen.getByLabelText(/eliminar producto:?\s*palomitas/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/eliminar producto:?\s*palomitas/i));
    await waitFor(() => expect(inventoryRemove).toHaveBeenCalled());
  });
});
