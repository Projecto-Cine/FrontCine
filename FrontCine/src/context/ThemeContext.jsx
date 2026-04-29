import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const PALETTES = [
  { id: 'cinema', label: 'Cinema', color: '#c9a84c' },
  { id: 'ruby', label: 'Rubí', color: '#e74c3c' },
  { id: 'sapphire', label: 'Zafiro', color: '#2980b9' },
  { id: 'emerald', label: 'Esmeralda', color: '#27ae60' },
  { id: 'violet', label: 'Violeta', color: '#8e44ad' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('lc-theme') || 'dark')
  const [palette, setPalette] = useState(() => localStorage.getItem('lc-palette') || 'cinema')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lc-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem('lc-palette', palette)
  }, [palette])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, palette, setPalette, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
