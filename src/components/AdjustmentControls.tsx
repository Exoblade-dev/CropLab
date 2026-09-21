import { RotateCcw } from 'lucide-react';
import type { AdjustmentState } from '@/types/editor';
import { ADJUSTMENT_LIMITS } from '@/lib/image/adjustments';

type Props = {
  adjustments: AdjustmentState;
  isLoading: boolean;
  compact?: boolean;
  onChange: (key: keyof AdjustmentState, value: number) => void;
  onCommit: (key: keyof AdjustmentState) => void;
  onReset: () => void;
};

const controls: Array<{ key: keyof AdjustmentState; label: string; min: number; max: number; step: number; unit: string }> = [
  { key: 'brightness', label: 'Brightness', min: ADJUSTMENT_LIMITS.brightness.min, max: ADJUSTMENT_LIMITS.brightness.max, step: 1, unit: '' },
  { key: 'contrast', label: 'Contrast', min: ADJUSTMENT_LIMITS.contrast.min, max: ADJUSTMENT_LIMITS.contrast.max, step: 1, unit: '' },
  { key: 'saturation', label: 'Saturation', min: ADJUSTMENT_LIMITS.saturation.min, max: ADJUSTMENT_LIMITS.saturation.max, step: 1, unit: '' },
  { key: 'exposure', label: 'Exposure', min: ADJUSTMENT_LIMITS.exposure.min, max: ADJUSTMENT_LIMITS.exposure.max, step: 1, unit: '' },
  { key: 'sharpen', label: 'Sharpen', min: ADJUSTMENT_LIMITS.sharpen.min, max: ADJUSTMENT_LIMITS.sharpen.max, step: 1, unit: '' },
  { key: 'blur', label: 'Blur', min: ADJUSTMENT_LIMITS.blur.min, max: ADJUSTMENT_LIMITS.blur.max, step: 0.5, unit: 'px' },
];

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function AdjustmentControls({ adjustments, isLoading, compact = false, onChange, onCommit, onReset }: Props) {
  const hasChanges = Object.values(adjustments).some((value) => value !== 0);
  return (
    <div className={compact ? 'adjustment-controls compact' : 'adjustment-controls'}>
      {!compact && <div className="adjustment-heading"><div><span className="inspector-eyebrow">Adjust</span><h2>Fine-tune the image</h2><p>These controls change the exported pixels, not the crop viewport.</p></div><button type="button" className="ghost-action" onClick={onReset} disabled={isLoading || !hasChanges} title="Reset adjustments"><RotateCcw size={14} /> Reset</button></div>}
      {controls.map((control) => {
        const value = adjustments[control.key];
        const display = value > 0 ? `+${formatValue(value)}` : formatValue(value);
        return (
          <label className="adjustment-control" key={control.key}>
            <span className="adjustment-control-head"><span>{control.label}</span><strong>{display}{control.unit}</strong></span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              disabled={isLoading}
              aria-label={control.label} aria-valuetext={`${display}${control.unit}`}
              onChange={(event) => onChange(control.key, Number(event.target.value))}
              onMouseUp={() => onCommit(control.key)}
              onTouchEnd={() => onCommit(control.key)}
              onKeyUp={(event) => { if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') onCommit(control.key); }}
            />
          </label>
        );
      })}
      {compact && <button type="button" className="mobile-secondary-button" onClick={onReset} disabled={isLoading || !hasChanges}><RotateCcw size={14} /> Reset adjustments</button>}
    </div>
  );
}
