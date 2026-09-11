import type { Metadata, Viewport } from 'next';
import '../index.css';
import '../App.css';
import '../history.css';
import '../export.css';
import '../cropper.css';
import '../dialogs.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CropLab — Free Online Image Cropper',
  description: 'Crop, resize, rotate, and export images directly in your browser. No uploads required.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
