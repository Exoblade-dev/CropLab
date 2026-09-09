import { Moon, Sun, Download } from 'lucide-react';
import type { Theme } from '@/hooks/use-theme';

type Props = {
  theme: Theme;
  onToggle: () => void;
  onExport?: () => void;
};

export function AppHeader({ theme, onToggle, onExport }: Props) {
  return (
    <header className="app-header">
      <div className="header-brand"><h1>CropLab</h1><span>Image editor</span></div>
      <div className="header-actions">
        {onExport && <button className="mobile-header-export" onClick={onExport}><Download size={15} /> Export</button>}
        <span className="local-status">Local · no upload</span>
        <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme" title="Toggle light/dark mode">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
      </div>
    </header>
  );
}
