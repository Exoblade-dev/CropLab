type Props = {
  label: string;
};

const RECTANGLES: Record<string, { x: number; y: number; width: number; height: number }> = {
  '1:1': { x: 7, y: 7, width: 18, height: 18 },
  '4:3': { x: 4, y: 7, width: 24, height: 18 },
  '3:4': { x: 7, y: 4, width: 18, height: 24 },
  '16:9': { x: 2, y: 8, width: 28, height: 16 },
  '9:16': { x: 8, y: 2, width: 16, height: 28 },
};

export function AspectRatioIcon({ label }: Props) {
  if (label === 'Free') {
    return (
      <svg className="aspect-ratio-icon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 11V6h5M21 6h5v5M27 21v5h-5M11 26H6v-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 9h14v14H9z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity=".72" />
      </svg>
    );
  }

  const rect = RECTANGLES[label] ?? RECTANGLES['1:1'];
  return (
    <svg className="aspect-ratio-icon" viewBox="0 0 32 32" aria-hidden="true">
      <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
