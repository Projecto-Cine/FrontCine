import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

// LanguageSwitcher consumes the language context → wrap it.
const renderWithProvider = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

beforeEach(() => localStorage.clear());

describe('LanguageSwitcher', () => {
  it('renders one button per supported language', () => {
    renderWithProvider(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
  });

  it('marks aria-pressed=true on the active language', () => {
    localStorage.setItem('lumen_lang', 'es');
    renderWithProvider(<LanguageSwitcher />);
    const es = screen.getByRole('button', { name: /Español/i });
    const en = screen.getByRole('button', { name: /English/i });
    expect(es).toHaveAttribute('aria-pressed', 'true');
    expect(en).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking changes the active language', async () => {
    localStorage.setItem('lumen_lang', 'es');
    const user = userEvent.setup();
    renderWithProvider(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /English/i }));

    expect(screen.getByRole('button', { name: /English/i })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('lumen_lang')).toBe('en');
  });
});
