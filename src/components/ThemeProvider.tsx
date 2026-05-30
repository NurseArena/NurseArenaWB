'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nursenova-theme') as Theme;
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
  }
  return 'light';
}

function syncDOM(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem('nursenova-theme', theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const actual = getInitialTheme();
    setThemeState(actual);
    syncDOM(actual);
    setResolved(true);
  }, []);

  useEffect(() => {
    if (!resolved) return;
    syncDOM(theme);
  }, [theme, resolved]);

  const setTheme = useCallback((t: Theme) => { setThemeState(t); }, []);
  const toggleTheme = useCallback(() => { setThemeState(prev => (prev === 'light' ? 'dark' : 'light')); }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useThemeResolved() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeResolved must be used within ThemeProvider');
  const [resolved, setResolved] = useState(false);
  useEffect(() => { setResolved(true); }, []);
  return resolved;
}
