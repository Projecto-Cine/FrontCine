import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const room = { id: 1, name: 'Sala 1 IMAX', capacity: 100 };
const movie = { id: 1, title: 'Dune', genre: 'Ciencia ficción', format: 'IMAX', language: 'ES' };
const screening = {
  id: 1,
  startTime: '2026-05-18T20:00:00',
  dateTime: '2026-05-18T20:00:00',
  price: 13.5,
  basePrice: 13.5,
  movie,
  theater: room,
  availableSeats: 98,
  capacity: 100,
  full: false,
};

const sessionsGetAll = vi.fn().mockResolvedValue([screening]);
const seatsGetByScreening = vi.fn().mockResolvedValue([
  { seat: { id: 1, row: 'A', number: 1 }, occupied: false },
  { seat: { id: 2, row: 'A', number: 2 }, occupied: false },
  { seat: { id: 3, row: 'A', number: 3 }, occupied: true },
]);
const seatsGetByTheater = vi.fn().mockResolvedValue([
  { id: 1, row: 'A', number: 1 },
  { id: 2, row: 'A', number: 2 },
  { id: 3, row: 'A', number: 3 },
]);
const clientsSearch = vi.fn().mockResolvedValue([
  { id: 7, name: 'Ana López', email: 'ana@x.com', fidelityDiscountEligible: true },
]);
const createPurchase = vi.fn().mockResolvedValue({
  id: 50,
  tickets: [
    { id: 1, row: 'A', number: 1, ticketType: 'ADULT' },
    { id: 2, row: 'A', number: 2, ticketType: 'ADULT' },
  ],
});
const confirmPurchase = vi.fn().mockResolvedValue({});
const roomsGetById = vi.fn().mockResolvedValue(room);

vi.mock('../../services/sessionsService', () => ({
  sessionsService: { getAll: (...args) => sessionsGetAll(...args) },
}));

vi.mock('../../services/seatsService', () => ({
  seatsService: {
    getByScreening: (...args) => seatsGetByScreening(...args),
    getByTheater: (...args) => seatsGetByTheater(...args),
  },
}));

vi.mock('../../services/clientsService', () => ({
  clientsService: { search: (...args) => clientsSearch(...args) },
}));

vi.mock('../../services/salesService', () => ({
  salesService: {
    createPurchase: (...args) => createPurchase(...args),
    confirmPurchase: (...args) => confirmPurchase(...args),
  },
}));

vi.mock('../../services/roomsService', () => ({
  roomsService: { getById: (...args) => roomsGetById(...args) },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin' }, can: () => true }),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr">{value}</div>,
}));

import BoxOfficePage from './BoxOfficePage';

beforeEach(() => {
  vi.clearAllMocks();
  sessionsGetAll.mockResolvedValue([screening]);
  window.print = vi.fn();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <BoxOfficePage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

async function openSeats() {
  await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /20:00/i }));
  await waitFor(() => expect(screen.getByLabelText('Butaca A01 libre')).toBeInTheDocument());
}

describe('BoxOfficePage verified purchase flow', () => {
  it('goes from session selection to seats, client search, cash/card payment, and ticket success', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: /20:00/i })[0]);

    await waitFor(() => expect(screen.getByLabelText('Butaca A01 libre')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Butaca A01 libre'));
    fireEvent.click(screen.getByLabelText('Butaca A02 libre'));
    expect(document.body.textContent).toContain('2 butacas seleccionadas');

    const proceed = screen.getAllByRole('button', { name: /cobrar/i }).find(button => !button.disabled);
    fireEvent.click(proceed);
    await waitFor(() => expect(screen.getByText(/cliente/i)).toBeInTheDocument());

    const clientInput = screen.getByLabelText(/buscar cliente/i);
    fireEvent.change(clientInput, { target: { value: 'Ana' } });
    await waitFor(() => expect(clientsSearch).toHaveBeenCalledWith('Ana'), { timeout: 1000 });
    fireEvent.click(await screen.findByRole('button', { name: /Ana López/i }));
    expect(document.body.textContent).toContain('Socio');

    fireEvent.click(screen.getByRole('button', { name: /efectivo/i }));
    const cashInput = screen.getByLabelText(/importe entregado/i);
    fireEvent.change(cashInput, { target: { value: '5' } });
    expect(document.body.textContent).toContain('Importe insuficiente');

    fireEvent.click(screen.getByRole('button', { name: '€50' }));
    expect(document.body.textContent).toContain('Cambio a devolver');

    fireEvent.click(screen.getByLabelText(/quitar cliente/i));
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tarjeta/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));

    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('¡Cobro completado!')).toBeInTheDocument());
    expect(screen.getAllByTestId('qr').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /2/i }));
    fireEvent.click(screen.getByRole('button', { name: /imprimir/i }));
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    expect(window.print).toHaveBeenCalled();
  });

  it('uses fallback ticket generation when the backend returns no tickets', async () => {
    createPurchase.mockResolvedValueOnce({ id: 60, tickets: [] });
    renderPage();

    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: /20:00/i })[0]);
    await waitFor(() => expect(screen.getByLabelText('Butaca A01 libre')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Butaca A01 libre'));

    fireEvent.click(screen.getAllByRole('button', { name: /cobrar/i }).find(button => !button.disabled));
    await waitFor(() => expect(screen.getByText(/cliente/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));

    await waitFor(() => expect(screen.getByText('¡Cobro completado!')).toBeInTheDocument());
    expect(document.body.textContent).toContain('TKT-');
  });

  it('loads room details when the session only contains room_id and falls back to screening seats', async () => {
    sessionsGetAll.mockResolvedValueOnce([{ ...screening, theater: undefined, room: undefined, room_id: 1 }]);
    seatsGetByTheater.mockResolvedValueOnce([]);
    renderPage();

    await openSeats();

    expect(roomsGetById).toHaveBeenCalledWith(1);
    expect(screen.getByLabelText('Butaca A01 libre')).toBeInTheDocument();
  });

  it('handles client-search failure and payment failure without leaving the payment step', async () => {
    clientsSearch.mockRejectedValueOnce(new Error('search failed'));
    createPurchase.mockRejectedValueOnce(new Error('payment failed'));
    renderPage();

    await openSeats();
    fireEvent.click(screen.getByLabelText('Butaca A01 libre'));

    const proceed = screen.getAllByRole('button', { name: /cobrar/i }).at(-1);
    fireEvent.click(proceed);
    await waitFor(() => expect(screen.getByText(/cliente/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/buscar cliente/i), { target: { value: 'Ana' } });
    await waitFor(() => expect(clientsSearch).toHaveBeenCalledWith('Ana'), { timeout: 1000 });

    fireEvent.click(screen.getByRole('button', { name: /confirmar cobro/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    expect(screen.getByText(/cliente/i)).toBeInTheDocument();
  });

  it('removes seats from the summary and pays from the F4 shortcut', async () => {
    renderPage();
    await openSeats();

    fireEvent.click(screen.getByLabelText('Butaca A01 libre'));
    fireEvent.click(screen.getByLabelText(/eliminar butaca A01/i));
    expect(screen.queryByLabelText(/eliminar butaca A01/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Butaca A02 libre'));
    fireEvent.keyDown(window, { key: 'F4' });

    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
  });

  it('uses poster fallback and detects 4DX and VIP supplements', async () => {
    sessionsGetAll.mockResolvedValueOnce([
      {
        ...screening,
        id: 11,
        movie: { ...movie, id: 11, title: 'Avatar', format: '4DX', imageUrl: 'https://cdn/poster.jpg' },
        theater: { id: 11, name: 'Sala 4DX', capacity: 90 },
      },
      {
        ...screening,
        id: 12,
        movie: { ...movie, id: 12, title: 'Drama VIP', format: '2D' },
        theater: { id: 12, name: 'Sala VIP', capacity: 20 },
      },
    ]);
    renderPage();

    await waitFor(() => expect(screen.getByText('Avatar')).toBeInTheDocument());
    fireEvent.error(screen.getByAltText('Avatar'));

    fireEvent.click(screen.getAllByRole('button', { name: /20:00/i })[0]);
    await waitFor(() => expect(screen.getByText(/\+ suplemento 4DX/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cambiar sesión/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /20:00/i }).at(-1));
    await waitFor(() => expect(screen.getByText(/\+ suplemento VIP/i)).toBeInTheDocument());
  });

  it('recovers from seat loading failures', async () => {
    seatsGetByScreening.mockRejectedValueOnce(new Error('seats failed'));
    renderPage();

    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /20:00/i }));

    await waitFor(() => expect(seatsGetByScreening).toHaveBeenCalled());
    expect(screen.getAllByText('Dune').length).toBeGreaterThan(0);
  });
});
