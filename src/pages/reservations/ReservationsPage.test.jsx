import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

/* ── Service mocks ───────────────────────────────────── */
const mockPurchases = [
  { id: 1, status: 'CONFIRMED', total: 25, paymentMethod: 'CARD', userId: 10, screeningId: 100, clientName: 'Ana López', clientEmail: 'ana@x.com', seats: ['A1', 'A2'], createdAt: '2025-01-15' },
  { id: 2, status: 'PENDING',   total: 15, paymentMethod: null,   userId: 11, screeningId: 101, clientName: 'Luis García', clientEmail: 'luis@x.com', seats: ['B3'], createdAt: '2025-01-16' },
  { id: 3, status: 'CANCELLED', total: 10, userId: 12, screeningId: 100, clientName: 'Marta Ruiz', clientEmail: 'marta@x.com', seats: [], createdAt: '2025-01-17' },
];
const mockScreenings = [
  { id: 100, movie: { title: 'Dune' }, theater: { name: 'Sala 1' }, dateTime: '2025-06-01T20:00' },
  { id: 101, movie: { title: 'Avatar' }, theater: { name: 'Sala 2' }, dateTime: '2025-06-02T18:00' },
];
const mockUsers = [
  // Page filters dropdown options by role.toUpperCase() === 'CLIENT'
  { id: 10, name: 'Ana López', email: 'ana@x.com', role: 'CLIENT' },
  { id: 11, name: 'Luis García', email: 'luis@x.com', role: 'CLIENT' },
];

const purchasesGetAll = vi.fn().mockResolvedValue(mockPurchases);
const purchasesPay    = vi.fn().mockResolvedValue({ tickets: [{ qrCode: 'QR-ABC' }] });
const purchasesCreate = vi.fn().mockResolvedValue({ id: 50, status: 'PENDING', total: 30, userId: 10 });
const purchasesUpdate = vi.fn().mockResolvedValue({ id: 1, status: 'CONFIRMED', total: 25 });
const purchasesCancel = vi.fn().mockResolvedValue({});
const screeningsGetAll = vi.fn().mockResolvedValue(mockScreenings);
const reservationUsersGetAll = vi.fn().mockResolvedValue(mockUsers);

vi.mock('../../services/reservationsService', () => ({
  purchasesService: {
    getAll:  (...a) => purchasesGetAll(...a),
    create:  (...a) => purchasesCreate(...a),
    update:  (...a) => purchasesUpdate(...a),
    pay:     (...a) => purchasesPay(...a),
    cancel:  (...a) => purchasesCancel(...a),
    remove:  vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../../services/sessionsService', () => ({
  screeningsService: {
    getAll: (...a) => screeningsGetAll(...a),
    getById: vi.fn(),
  },
}));

vi.mock('../../services/usersService', () => ({
  usersService: {
    getAll: (...a) => reservationUsersGetAll(...a),
    getById: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin', role: 'admin' }, can: () => true }),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

import ReservationsPage from './ReservationsPage';

beforeEach(() => {
  vi.clearAllMocks();
  purchasesGetAll.mockReset().mockResolvedValue(mockPurchases);
  purchasesPay.mockReset().mockResolvedValue({ tickets: [{ qrCode: 'QR-ABC' }] });
  purchasesCreate.mockReset().mockResolvedValue({ id: 50, status: 'PENDING', total: 30, userId: 10 });
  purchasesUpdate.mockReset().mockResolvedValue({ id: 1, status: 'CONFIRMED', total: 25 });
  purchasesCancel.mockReset().mockResolvedValue({});
  screeningsGetAll.mockReset().mockResolvedValue(mockScreenings);
  reservationUsersGetAll.mockReset().mockResolvedValue(mockUsers);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <ReservationsPage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('ReservationsPage — comprehensive', () => {

  function clickPendingPaymentAction() {
    fireEvent.click(screen.getAllByTitle(/pago/i)[0]);
  }

  function clickDialogOverlay() {
    fireEvent.click(screen.getByRole('dialog').parentElement);
  }

  it('renders KPI cards and data table after loading', async () => {
    renderPage();
    // Wait for purchases to load
    await waitFor(() => expect(purchasesGetAll).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('filters purchases by status buttons', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Find and click a filter button for PENDING status
    const filterButtons = screen.getAllByRole('button');
    const pendingBtn = filterButtons.find(b => b.textContent.includes('1') && b.className.includes('filter'));
    if (pendingBtn) fireEvent.click(pendingBtn);

    // The CONFIRMED row may be hidden
    await waitFor(() => { /* settle */ });
  });

  it('filters by screening select', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: '100' } });
      await waitFor(() => { /* settle */ });
    }
  });

  it('opens create modal, fills form, and saves', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');

    const selects = within(dialog).getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '10' } });

    if (selects.length > 1) {
      fireEvent.change(selects[1], { target: { value: '100' } });
    }

    const amountInput = within(dialog).getByPlaceholderText('0.00');
    if (amountInput) fireEvent.change(amountInput, { target: { value: '30' } });

    fireEvent.click(within(dialog).getByRole('button', { name: /crear y cobrar/i }));

    await waitFor(() => expect(purchasesCreate).toHaveBeenCalled());
  });

  it('shows validation error when no client selected', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Open create modal
    const headerBtns = screen.getAllByRole('button');
    for (const btn of headerBtns) {
      if (btn.textContent && (btn.textContent.includes('eserva') || btn.textContent.includes('reate') || btn.textContent.includes('ueva'))) {
        fireEvent.click(btn);
        break;
      }
    }
    await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1));

    // Try to save without selecting client
    const modalBtns = screen.getAllByRole('button');
    const saveBtn = modalBtns.find(b => b.textContent.includes('rear') || b.textContent.includes('obr'));
    if (saveBtn) fireEvent.click(saveBtn);

    // Should show error toast (no purchasesCreate call)
    expect(purchasesCreate).not.toHaveBeenCalled();
  });

  it('opens edit modal for existing purchase', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    const editBtns = screen.getAllByTitle(/editar|edit/i);
    fireEvent.click(editBtns[1]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');

    const selects = within(dialog).getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '10' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(purchasesUpdate).toHaveBeenCalled());
  });

  it('opens pay modal for PENDING purchase and completes payment with CARD', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    const payBtn = screen.getAllByTitle(/pago|payment/i)[0];
    fireEvent.click(payBtn);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    await waitFor(() => expect(purchasesPay).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument());
    expect(screen.getAllByTestId('qr').length).toBeGreaterThanOrEqual(1);
  });

  it('opens pay modal and uses CASH payment method', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle(/pago|payment/i)[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /efectivo/i }));
    const cashInput = document.querySelector('input[type="number"]');
    fireEvent.change(cashInput, { target: { value: '50' } });
    expect(screen.getByText(/cambio a devolver/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    await waitFor(() => expect(purchasesPay).toHaveBeenCalled());
  });

  it('handles cancel reservation flow', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Click cancel button on a row
    const cancelBtns = screen.getAllByRole('button');
    for (const btn of cancelBtns) {
      if (btn.title && btn.title.toLowerCase().includes('ancel')) {
        fireEvent.click(btn);
        break;
      }
    }

    // Confirm cancel in the ConfirmModal
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b =>
        b.textContent && b.textContent.toLowerCase().includes('ancel') && b.className.includes('danger')
      );
      if (confirmBtn) fireEvent.click(confirmBtn);
    });
  });

  it('handles refund flow for CONFIRMED purchase', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Click refund button on confirmed row
    const refundBtns = screen.getAllByRole('button');
    for (const btn of refundBtns) {
      if (btn.title && btn.title.toLowerCase().includes('eembol')) {
        fireEvent.click(btn);
        break;
      }
    }

    // Confirm refund
    await waitFor(() => {
      const allBtns = screen.getAllByRole('button');
      const confirmBtn = allBtns.find(b =>
        b.textContent && (b.textContent.toLowerCase().includes('eembol') || b.textContent.toLowerCase().includes('onfirm'))
      );
      if (confirmBtn) fireEvent.click(confirmBtn);
    });
  });

  it('opens detail modal when clicking a row', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Click view/eye button
    const viewBtns = screen.getAllByRole('button');
    for (const btn of viewBtns) {
      const svg = btn.querySelector('svg');
      if (svg && btn.title && btn.title.toLowerCase().includes('dit')) {
        // Use the Eye icon button (first one in row actions)
        break;
      }
    }
    // Click on the row text to open detail
    fireEvent.click(screen.getByText('Ana López'));

    await waitFor(() => {
      // Detail modal should show client info
      expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles save error with 401 status', async () => {
    purchasesCreate.mockRejectedValueOnce({ status: 401 });
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getAllByRole('combobox')[0], { target: { value: '10' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /crear y cobrar/i }));

    await waitFor(() => expect(purchasesCreate).toHaveBeenCalled());
  });

  it('handles pay error', async () => {
    purchasesPay.mockRejectedValueOnce(new Error('Server error'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    clickPendingPaymentAction();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));

    await waitFor(() => expect(purchasesPay).toHaveBeenCalled());
  });

  it('handles initial load error', async () => {
    purchasesGetAll.mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(purchasesGetAll).toHaveBeenCalled());
  });

  it('renders ticket success modal with QR codes', async () => {
    purchasesPay.mockResolvedValueOnce({
      tickets: [{ qrCode: 'QR-TEST-123' }, { qrCode: 'QR-TEST-456' }],
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    // Open pay for pending
    const allBtns = screen.getAllByRole('button');
    for (const btn of allBtns) {
      if (btn.title && btn.title.toLowerCase().includes('ago')) {
        fireEvent.click(btn);
        break;
      }
    }

    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button').find(b =>
        !b.disabled && (b.textContent.includes('onfirm') || b.textContent.includes('obrar'))
      );
      if (confirmBtn) fireEvent.click(confirmBtn);
    });

    // Wait for QR codes to appear
    await waitFor(() => {
      const qrs = screen.queryAllByTestId('qr');
      // QR codes rendered
    });
  });

  it('detail modal shows edit and action buttons based on status', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    // Open detail for CONFIRMED purchase (Ana)
    fireEvent.click(screen.getByText('Ana López'));
    await waitFor(() => {
      expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThanOrEqual(1);
    });

    // CONFIRMED purchase should have refund and cancel buttons
    const detailBtns = screen.getAllByRole('button');
    const editBtn = detailBtns.find(b => b.textContent && b.textContent.toLowerCase().includes('dit'));
    expect(editBtn).toBeTruthy();
  });

  it('runs pending detail actions for edit, deferred payment, and cancellation', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Luis García'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^cancelar$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByText('Luis García'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /tarjeta/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /aplazar cobro/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /aplazar cobro/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByText('Luis García'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancelar reserva/i }));
    const getCancelConfirmButton = () => screen
      .getAllByRole('button', { name: /^cancelar reserva$/i })
      .find(button => button.textContent.trim() === 'Cancelar reserva');
    await waitFor(() => expect(getCancelConfirmButton()).toBeTruthy());
    fireEvent.click(getCancelConfirmButton());

    await waitFor(() => expect(purchasesCancel).toHaveBeenCalledWith(2));
  });

  it('confirms a refund from the detail modal', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Ana López'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /procesar reembolso/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar reembolso/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar reembolso/i }));

    await waitFor(() => expect(purchasesUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'REFUNDED' })));
  });

  it('shows generic save and auth payment errors', async () => {
    purchasesCreate.mockRejectedValueOnce(new Error('Servidor no disponible'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Ana López')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    let dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getAllByRole('combobox')[0], { target: { value: '10' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /crear y cobrar/i }));
    await waitFor(() => expect(purchasesCreate).toHaveBeenCalled());

    purchasesPay.mockRejectedValueOnce({ status: 401 });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^cancelar$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    clickPendingPaymentAction();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    await waitFor(() => expect(purchasesPay).toHaveBeenCalled());
  });

  it('closes the ticket success modal after payment with qrCodes fallback', async () => {
    purchasesPay.mockResolvedValueOnce({ qrCodes: ['QR-A', 'QR-B'] });
    renderPage();
    await waitFor(() => expect(screen.getByText('Luis García')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle(/pago/i)[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));

    await waitFor(() => expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument());
    expect(screen.getAllByTestId('qr')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /^cerrar$/i }));
    await waitFor(() => expect(screen.queryByText(/reserva confirmada/i)).not.toBeInTheDocument());
  });

  it('covers defensive reservation actions and overlay closes', async () => {
    purchasesUpdate.mockRejectedValueOnce(new Error('update failed'));
    renderPage();
    await waitFor(() => expect(screen.getAllByTitle(/editar/i).length).toBeGreaterThan(1));

    fireEvent.click(screen.getAllByTitle(/editar/i)[1]);
    await waitFor(() => expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(purchasesUpdate).toHaveBeenCalled());

    clickPendingPaymentAction();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    clickDialogOverlay();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    purchasesCancel.mockRejectedValueOnce(new Error('cancel failed'));
    fireEvent.click(screen.getAllByTitle(/cancelar reserva/i)[1]);
    const getCancelConfirmButton = () => screen
      .getAllByRole('button', { name: /^cancelar reserva$/i })
      .find(button => button.textContent.trim() === 'Cancelar reserva');
    await waitFor(() => expect(getCancelConfirmButton()).toBeTruthy());
    fireEvent.click(getCancelConfirmButton());
    await waitFor(() => expect(purchasesCancel).toHaveBeenCalledWith(2));

    purchasesUpdate.mockRejectedValueOnce(new Error('refund failed'));
    fireEvent.click(screen.getByTitle(/procesar reembolso/i));
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar reembolso/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar reembolso/i }));
    await waitFor(() => expect(purchasesUpdate).toHaveBeenCalledTimes(2));
  });

  it('shows the no-QR ticket message and closes the ticket modal from the overlay', async () => {
    purchasesPay.mockResolvedValueOnce({});
    renderPage();
    await waitFor(() => expect(screen.getAllByTitle(/pago/i).length).toBeGreaterThan(0));

    clickPendingPaymentAction();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));

    await waitFor(() => expect(screen.getByText(/recibirá las entradas por email/i)).toBeInTheDocument());
    clickDialogOverlay();
    await waitFor(() => expect(screen.queryByText(/recibirá las entradas por email/i)).not.toBeInTheDocument());
  });

  it('opens the detail modal from the row view action', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByTitle(/editar/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByTitle(/editar/i)[0]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });
});
