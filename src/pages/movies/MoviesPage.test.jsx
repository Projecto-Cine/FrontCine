import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AppProvider } from '../../contexts/AppContext';

const mockMovies = [
  {
    id: 1,
    title: 'Dune',
    director: 'Denis Villeneuve',
    year: 2021,
    durationMin: 155,
    genre: 'Ciencia ficción',
    language: 'ES',
    format: 'IMAX',
    ageRating: 'PG-13',
    active: true,
    description: 'Arrakis despierta.',
    imageUrl: '',
  },
  {
    id: 2,
    title: 'Old Drama',
    director: 'A. Director',
    year: 1999,
    duration: 100,
    genre: 'Drama',
    language: 'VO',
    format: '2D',
    rating: 'R',
    status: 'inactive',
    poster: 'https://cdn/old.jpg',
  },
];

const moviesGetAll = vi.fn().mockResolvedValue(mockMovies);
const moviesCreate = vi.fn().mockResolvedValue({ id: 3, title: 'Nueva', durationMin: 120, active: true });
const moviesUpdate = vi.fn().mockResolvedValue({ id: 1, title: 'Dune 2', durationMin: 166, active: true });
const moviesRemove = vi.fn().mockResolvedValue(null);
const uploadImage = vi.fn().mockResolvedValue('https://cdn/new-poster.jpg');

vi.mock('../../services/moviesService', () => ({
  moviesService: {
    getAll: (...args) => moviesGetAll(...args),
    create: (...args) => moviesCreate(...args),
    update: (...args) => moviesUpdate(...args),
    remove: (...args) => moviesRemove(...args),
  },
}));

vi.mock('../../services/cloudinaryService', () => ({
  uploadImage: (...args) => uploadImage(...args),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'admin' }, can: () => true }),
}));

import MoviesPage from './MoviesPage';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  moviesGetAll.mockResolvedValue(mockMovies);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>
          <MoviesPage />
        </AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

function fillMovieForm(dialog, { title = 'Nueva película', duration = '120' } = {}) {
  fireEvent.change(dialog.querySelector('#mov-title'), { target: { value: title } });
  fireEvent.change(dialog.querySelector('#mov-duration'), { target: { value: duration } });
  fireEvent.change(dialog.querySelector('#mov-director'), { target: { value: 'Directora' } });
  fireEvent.change(dialog.querySelector('#mov-year'), { target: { value: '2026' } });
  fireEvent.change(dialog.querySelector('#mov-genre'), { target: { value: 'Acción' } });
  fireEvent.change(dialog.querySelector('#mov-language'), { target: { value: 'VOSE' } });
  fireEvent.change(dialog.querySelector('#mov-format'), { target: { value: '4DX' } });
  fireEvent.change(dialog.querySelector('#mov-rating'), { target: { value: 'PG' } });
  fireEvent.change(dialog.querySelector('#mov-status'), { target: { value: 'inactive' } });
  fireEvent.change(dialog.querySelector('#mov-desc'), { target: { value: 'Descripción de prueba' } });
}

describe('MoviesPage', () => {
  it('loads movies, opens detail, creates, edits, deletes and bulk deletes', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());
    expect(screen.getByText('Old Drama')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Dune'));
    await waitFor(() => expect(screen.getByText('Arrakis despierta.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    fireEvent.click(screen.getByRole('button', { name: /nueva película/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    let dialog = screen.getByRole('dialog');
    fillMovieForm(dialog);

    fireEvent.click(within(dialog).getByRole('button', { name: /seleccionar póster/i }));
    const fileInput = dialog.querySelector('input[type="file"]');
    fireEvent.change(fileInput, {
      target: { files: [new File(['image'], 'poster.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(uploadImage).toHaveBeenCalled());

    fireEvent.click(within(dialog).getByRole('button', { name: /quitar/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /crear película/i }));
    await waitFor(() => expect(moviesCreate).toHaveBeenCalled());

    const editButtons = screen.getAllByTitle(/editar/i);
    fireEvent.click(editButtons[1]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    dialog = screen.getByRole('dialog');
    fillMovieForm(dialog, { title: 'Dune 2', duration: '166' });
    fireEvent.click(within(dialog).getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(moviesUpdate).toHaveBeenCalled());

    fireEvent.click(screen.getAllByTitle(/eliminar/i)[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^eliminar$/i }));
    await waitFor(() => expect(moviesRemove).toHaveBeenCalled());

    const rowCheckbox = screen.getAllByLabelText(/seleccionar fila/i)[0];
    fireEvent.click(rowCheckbox.closest('td'));
    fireEvent.click(screen.getByRole('button', { name: /eliminar selección/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar todas/i }));
  });

  it('validates required fields and handles load errors', async () => {
    moviesGetAll.mockRejectedValueOnce(new Error('Network'));
    renderPage();
    await waitFor(() => expect(moviesGetAll).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /nueva película/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /crear película/i }));
    expect(moviesCreate).not.toHaveBeenCalled();
  });

  it('handles poster upload errors, preview fallback, and cancel', async () => {
    uploadImage.mockRejectedValueOnce(new Error('Subida fallida'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva película/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    let dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: /seleccionar póster/i }));
    fireEvent.change(dialog.querySelector('input[type="file"]'), {
      target: { files: [new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(uploadImage).toHaveBeenCalled());

    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /nueva película/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: /seleccionar póster/i }));
    fireEvent.change(dialog.querySelector('input[type="file"]'), {
      target: { files: [new File(['ok'], 'ok.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(screen.getByAltText(/vista previa/i)).toBeInTheDocument());
    fireEvent.error(screen.getByAltText(/vista previa/i));
  });
});
