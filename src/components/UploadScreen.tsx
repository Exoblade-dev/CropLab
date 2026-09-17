import { ArrowUpRight, ImagePlus, LockKeyhole, MousePointer2, Zap } from 'lucide-react';
import { useRef } from 'react';

export function UploadScreen({ onLoad }: { onLoad: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.click();

  return (
    <section className="upload-section">
      <div className="upload-orbit orbit-one" /><div className="upload-orbit orbit-two" />
      <div className="upload-content">
        <div className="upload-kicker"><span className="status-dot" /> Browser-native image editing</div>
        <h1>Make the image<br /><em>fit the idea.</em></h1>
        <p className="upload-lede">Crop, resize, transform and export without sending your image to a server. CropLab does the work on your device.</p>
        <div className="upload-area" onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add('drag-over'); }} onDragLeave={(event) => event.currentTarget.classList.remove('drag-over')} onDrop={(event) => { event.preventDefault(); event.currentTarget.classList.remove('drag-over'); const file = event.dataTransfer.files[0]; if (file) onLoad(file); }} onClick={openPicker} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPicker(); } }} aria-label="Upload an image">
          <div className="upload-drop-icon"><ImagePlus size={27} strokeWidth={1.7} /></div>
          <div><strong>Drop an image here</strong><span>or choose a file from your device</span></div>
          <span className="upload-browse"><ArrowUpRight size={15} /></span>
          <input id="upload-image-input" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onLoad(file); event.currentTarget.value = ''; }} />
        </div>
        <div className="upload-paste"><MousePointer2 size={13} /> Tip: paste an image with <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd></div>
        <div className="upload-benefits"><span><LockKeyhole size={14} /> Nothing uploaded</span><span><Zap size={14} /> Fast local processing</span><span>JPEG · PNG · WebP · GIF</span></div>
      </div>
    </section>
  );
}
