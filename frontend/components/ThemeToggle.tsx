'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200" aria-label="Toggle theme">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
