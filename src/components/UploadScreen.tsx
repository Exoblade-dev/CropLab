import { ImagePlus } from 'lucide-react';
import { useRef } from 'react';

export function UploadScreen({ onLoad }: { onLoad: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <section className="upload-section">
      <div className="upload-content">
        <span className="eyebrow">Private image editor</span>
        <h1>Crop your images. Your way.</h1>
        <p className="description">Crop, resize, rotate, flip, and export images directly in your browser. Your files stay on your device.</p>

        <div
          className="upload-area"
          onDragOver={(event) => {
            event.preventDefault();
            event.currentTarget.classList.add('drag-over');
          }}
          onDragLeave={(event) => event.currentTarget.classList.remove('drag-over')}
          onDrop={(event) => {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            const file = event.dataTransfer.files[0];
            if (file) onLoad(file);
          }}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          aria-label="Upload an image"
        >
          <div className="upload-icon"><ImagePlus size={30} strokeWidth={1.7} /></div>
          <p>Drag & drop an image here, or click to select</p>
          <p className="small">You can also paste an image with Ctrl/Cmd+V</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onLoad(file);
              event.currentTarget.value = '';
            }}
          />
        </div>

        <p className="privacy-note">Your image never leaves your device.</p>
        <div className="supported-formats">JPEG · PNG · WebP · GIF · up to 50 MB</div>
      </div>
    </section>
  );
}
