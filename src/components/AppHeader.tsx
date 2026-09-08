import { Moon, Sun } from 'lucide-react';
import type { Theme } from '@/hooks/use-theme';

export function AppHeader({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <header className="app-header"><div className="header-content"><h1>CropLab</h1><p className="tagline">Simple image editing, entirely in your browser</p></div><button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme" title="Toggle light/dark mode">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button></header>;
}
