import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-code">{value}</div>,
}));

const t = (key, params = {}) => {
  const labels = {
    'box_office.success.title': '¡Cobro completado!',
    'box_office.success.print': 'Imprimir',
    'box_office.success.newSale': 'Nueva venta',
    'box_office.pay.card': 'Tarjeta',
    'box_office.pay.cash': 'Efectivo',
    'box_office.ticket.dubbed': 'Doblada',
    'box_office.ticket.original': 'V. Original',
    'box_office.ticket.subbed': 'V. Subtitulada',
    'box_office.ticket.date': 'FECHA',
    'box_office.ticket.time': 'HORA',
    'box_office.ticket.room': 'SALA',
    'box_office.ticket.seat': 'BUTACA',
    'box_office.ticket.scan': 'Escanear en entrada',
    'box_office.ticket.footer': 'Conserve este ticket.',
    'box_office.ticketNavLabel': 'Navegar entre entradas',
    'box_office.qrLabel': 'Código QR del ticket, butaca',
  };
  if (key === 'box_office.ticket.total') return `TOTAL (${params.n} ent.)`;
  return labels[key] ?? key;
};

const tickets = [
  { id: 'T1', movie: 'Dune', room: 'Sala 1', date: '2026-05-18', time: '20:00', seat: 'A01', format: 'IMAX', language: 'ES', qrValue: 'QR-1' },
  { id: 'T2', movie: 'Dune', room: 'Sala 1', date: '2026-05-18', time: '20:00', seat: 'A02', format: 'IMAX', language: 'VO', qrValue: 'QR-2' },
  { id: 'T3', movie: 'Dune', room: 'Sala 1', date: '2026-05-18', time: '20:00', seat: 'A03', format: 'IMAX', language: 'VOSE', qrValue: 'QR-3' },
];

describe('TicketSuccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.print = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prints automatically, navigates tickets, prints manually, and starts a new sale', async () => {
    const { TicketSuccess } = await import('./BoxOfficePage');
    const onReset = vi.fn();

    render(<TicketSuccess tickets={tickets} total={42.5} payMethod="cash" onReset={onReset} t={t} />);

    expect(screen.getByText('¡Cobro completado!')).toBeInTheDocument();
    vi.advanceTimersByTime(300);
    expect(window.print).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(document.body.textContent).toContain('V. Original');

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(document.body.textContent).toContain('V. Subtitulada');

    fireEvent.click(screen.getByRole('button', { name: /imprimir/i }));
    expect(window.print).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
