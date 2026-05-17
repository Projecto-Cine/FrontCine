import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

// Column labels are user-facing strings rendered by the table, so they
// stay in Spanish (this is the locale the app ships in).
const COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'age',  label: 'Edad', sortable: true },
];

const DATA = [
  { id: 1, name: 'Ana',   age: 30 },
  { id: 2, name: 'Bruno', age: 25 },
  { id: 3, name: 'Carla', age: 40 },
];

describe('DataTable', () => {
  it('renders the columns and every row', () => {
    renderWith(<DataTable columns={COLUMNS} data={DATA} />);

    expect(screen.getByRole('columnheader', { name: /Nombre/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Edad/ })).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
  });

  it('shows the empty state when data is empty', () => {
    renderWith(<DataTable columns={COLUMNS} data={[]} />);
    // Only the empty row should be present, not the 3 normal rows.
    expect(screen.queryByText('Ana')).toBeNull();
  });

  it('filters when typing in the search box (searchKeys)', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} searchKeys={['name']} />);

    const search = screen.getByRole('searchbox');
    await user.type(search, 'ana');

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).toBeNull();
  });

  it('sorts when clicking a header (asc → desc → asc)', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} />);

    const header = screen.getByRole('columnheader', { name: /Edad/ });
    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('invokes onRowClick when clicking a row', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} onRowClick={onRowClick} />);

    await user.click(screen.getByText('Ana'));
    expect(onRowClick).toHaveBeenCalledWith(DATA[0]);
  });

  it('pagination: pageSize=2 only shows 2 rows', () => {
    renderWith(<DataTable columns={COLUMNS} data={DATA} pageSize={2} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.queryByText('Carla')).toBeNull();
  });

  it('pagination: advancing to the next page reveals the remaining rows', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} pageSize={2} />);

    // The "next page" button has an i18n aria-label; it's the last button.
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    expect(screen.getByText('Carla')).toBeInTheDocument();
  });

  it('rowActions renders the markup returned by the callback', () => {
    renderWith(
      <DataTable
        columns={COLUMNS}
        data={DATA.slice(0, 1)}
        rowActions={(row) => <button>Eliminar {row.name}</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Eliminar Ana' })).toBeInTheDocument();
  });

  it('bulkActions: ticking the header selects every row and shows the counter', async () => {
    const bulkActions = vi.fn(() => <button>Borrar selección</button>);
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} bulkActions={bulkActions} />);

    // bulkActions is NOT rendered initially (nothing selected yet).
    expect(screen.queryByRole('button', { name: 'Borrar selección' })).toBeNull();

    // Tick "select all" (first header checkbox).
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    // Now the bulk-actions slot must appear.
    expect(screen.getByRole('button', { name: 'Borrar selección' })).toBeInTheDocument();
    expect(bulkActions).toHaveBeenCalled();
  });
});
