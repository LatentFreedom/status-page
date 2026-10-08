'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // The no-flash script in the root layout already applied the class before
    // paint; read back from the DOM so the toggle icon starts in sync.
    const isDark = document.documentElement.classList.contains('dark');
    const saved = (localStorage.getItem('theme') as Theme | null) || (isDark ? 'dark' : 'light');
    setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
