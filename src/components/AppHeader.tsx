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
      <div className="header-brand-group">
        <button type="button" className="brand-home" onClick={onHome} aria-label="Go to CropLab home" title="CropLab home">CropLab</button>
        <span className="brand-divider" aria-hidden="true" />
        <div className="brand-context"><strong>Image editor</strong><span>Private workspace</span></div>
      </div>
      <div className="header-actions">
        <span className="local-status"><span className="status-dot" />Local only</span>
        <button type="button" className="header-utility-button" onClick={onShortcuts} aria-label="Open keyboard shortcuts" title="Keyboard shortcuts"><Keyboard size={15} /><span>Shortcuts</span></button>
        <button type="button" className="theme-toggle" onClick={onToggle} aria-label="Toggle theme" title="Toggle light/dark mode">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
        {onExport && <button type="button" className="header-export-button" onClick={onExport} aria-label="Export image"><Download size={16} /> Export</button>}
      </div>
    </header>
  );
}
