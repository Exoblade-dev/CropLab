import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) onStoreChange();
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: nextTheme }));
  }, []);

  return { theme, setTheme };
}
