import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../context/ThemeContext'

function ThemeConsumer() {
  const { theme, toggleTheme, palette, setPalette, palettes } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="palette">{palette}</span>
      <span data-testid="palettes-count">{palettes.length}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setPalette('ruby')}>set-ruby</button>
    </div>
  )
}

function renderTheme() {
  localStorage.clear()
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => localStorage.clear())

  test('default theme is dark', () => {
    renderTheme()
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  test('default palette is cinema', () => {
    renderTheme()
    expect(screen.getByTestId('palette').textContent).toBe('cinema')
  })

  test('provides 5 palettes', () => {
    renderTheme()
    expect(screen.getByTestId('palettes-count').textContent).toBe('5')
  })

  test('toggleTheme switches from dark to light', () => {
    renderTheme()
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('toggleTheme switches from light back to dark', () => {
    renderTheme()
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  test('setPalette changes palette', () => {
    renderTheme()
    fireEvent.click(screen.getByText('set-ruby'))
    expect(screen.getByTestId('palette').textContent).toBe('ruby')
  })

  test('sets data-theme attribute on documentElement', () => {
    renderTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    fireEvent.click(screen.getByText('toggle'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  test('persists theme to localStorage', () => {
    renderTheme()
    fireEvent.click(screen.getByText('toggle'))
    expect(localStorage.getItem('lc-theme')).toBe('light')
  })

  test('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow()
    spy.mockRestore()
  })
})
