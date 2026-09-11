import { Download, Keyboard, Moon, Sun } from 'lucide-react';
import type { Theme } from '@/hooks/use-theme';

type Props = {
  theme: Theme;
  onToggle: () => void;
  onExport?: () => void;
  onHome: () => void;
  onShortcuts: () => void;
};

export function AppHeader({ theme, onToggle, onExport, onHome, onShortcuts }: Props) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <button type="button" className="brand-home" onClick={onHome} aria-label="Go to CropLab home" title="CropLab home">
          CropLab
        </button>
        <span>Image editor</span>
      </div>
      <div className="header-actions">
        {onExport && <button className="mobile-header-export" onClick={onExport}><Download size={15} /> Export</button>}
        <button type="button" className="shortcut-header-button" onClick={onShortcuts} aria-label="Open keyboard shortcut guide" title="Keyboard shortcuts">
          <Keyboard size={15} /> <span>Shortcuts</span>
        </button>
        <span className="local-status">Local · no upload</span>
        <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme" title="Toggle light/dark mode">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
      </div>
    </header>
  );
}
