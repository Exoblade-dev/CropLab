import type { Metadata } from 'next';
import '../index.css';
import '../App.css';
import '../history.css';

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
