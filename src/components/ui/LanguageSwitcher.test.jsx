import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

// LanguageSwitcher consume el contexto de idioma → lo envolvemos.
const renderWithProvider = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

beforeEach(() => localStorage.clear());

describe('LanguageSwitcher', () => {
  it('renderiza un botón por idioma soportado', () => {
    renderWithProvider(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
  });

  it('marca aria-pressed=true en el idioma activo', () => {
    localStorage.setItem('lumen_lang', 'es');
    renderWithProvider(<LanguageSwitcher />);
    const es = screen.getByRole('button', { name: /Español/i });
    const en = screen.getByRole('button', { name: /English/i });
    expect(es).toHaveAttribute('aria-pressed', 'true');
    expect(en).toHaveAttribute('aria-pressed', 'false');
  });

  it('al hacer click cambia el idioma activo', async () => {
    localStorage.setItem('lumen_lang', 'es');
    const user = userEvent.setup();
    renderWithProvider(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /English/i }));

    expect(screen.getByRole('button', { name: /English/i })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('lumen_lang')).toBe('en');
  });
});
