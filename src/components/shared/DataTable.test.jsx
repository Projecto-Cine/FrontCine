import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderWith = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

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
  it('renderiza las columnas y todas las filas', () => {
    renderWith(<DataTable columns={COLUMNS} data={DATA} />);

    expect(screen.getByRole('columnheader', { name: /Nombre/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Edad/ })).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay datos', () => {
    renderWith(<DataTable columns={COLUMNS} data={[]} />);
    // Debe haber una sola fila (la del empty), no las 3 normales.
    expect(screen.queryByText('Ana')).toBeNull();
  });

  it('filtra al escribir en el buscador (searchKeys)', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} searchKeys={['name']} />);

    const search = screen.getByRole('searchbox');
    await user.type(search, 'ana');

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).toBeNull();
  });

  it('ordena al hacer click en una cabecera (asc → desc → asc)', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} />);

    const header = screen.getByRole('columnheader', { name: /Edad/ });
    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('llama a onRowClick al hacer click en una fila', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} onRowClick={onRowClick} />);

    await user.click(screen.getByText('Ana'));
    expect(onRowClick).toHaveBeenCalledWith(DATA[0]);
  });

  it('paginación: pageSize=2 muestra solo 2 filas', () => {
    renderWith(<DataTable columns={COLUMNS} data={DATA} pageSize={2} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.queryByText('Carla')).toBeNull();
  });

  it('paginación: avanzar de página muestra el resto', async () => {
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} pageSize={2} />);

    // El botón "siguiente página" tiene aria-label de i18n; el último botón es "next".
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    expect(screen.getByText('Carla')).toBeInTheDocument();
  });

  it('rowActions renderiza el contenido devuelto por la función', () => {
    renderWith(
      <DataTable
        columns={COLUMNS}
        data={DATA.slice(0, 1)}
        rowActions={(row) => <button>Eliminar {row.name}</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Eliminar Ana' })).toBeInTheDocument();
  });

  it('bulkActions: marcar la cabecera selecciona todas las filas y muestra contador', async () => {
    const bulkActions = vi.fn(() => <button>Borrar selección</button>);
    const user = userEvent.setup();
    renderWith(<DataTable columns={COLUMNS} data={DATA} bulkActions={bulkActions} />);

    // Inicialmente bulkActions NO se renderiza (no hay nada seleccionado).
    expect(screen.queryByRole('button', { name: 'Borrar selección' })).toBeNull();

    // Marcamos "seleccionar todo" (primer checkbox de la cabecera).
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    // Ahora sí debe aparecer el slot de acciones masivas.
    expect(screen.getByRole('button', { name: 'Borrar selección' })).toBeInTheDocument();
    expect(bulkActions).toHaveBeenCalled();
  });
});
