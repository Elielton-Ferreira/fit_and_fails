import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextState = {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'fit-fails-theme'
const ThemeContext = createContext<ThemeContextState | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved)
      document.body.classList.remove('theme-light', 'theme-dark')
      document.body.classList.add(`theme-${saved}`)
    } else {
      document.body.classList.add('theme-dark')
    }
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.body.classList.remove('theme-light', 'theme-dark')
    document.body.classList.add(`theme-${next}`)
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
