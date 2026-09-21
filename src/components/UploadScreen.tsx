import { ArrowUpRight, ImagePlus, LockKeyhole, MousePointer2, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ImageInputSource } from '@/lib/image/input';

type Props = {
  onInput: (files: File[], source: ImageInputSource) => void;
};

export function UploadScreen({ onInput }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const openPicker = () => inputRef.current?.click();

  useEffect(() => {
    const preventWindowDropNavigation = (event: DragEvent) => event.preventDefault();
    window.addEventListener('dragover', preventWindowDropNavigation);
    window.addEventListener('drop', preventWindowDropNavigation);
    return () => {
      window.removeEventListener('dragover', preventWindowDropNavigation);
      window.removeEventListener('drop', preventWindowDropNavigation);
    };
  }, []);

  const handleFiles = (files: FileList | File[], source: ImageInputSource) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length > 0) onInput(nextFiles, source);
  };

  return (
    <section className="upload-section">
      <div className="upload-orbit orbit-one" /><div className="upload-orbit orbit-two" />
      <div className="upload-content">
        <div className="upload-kicker"><span className="status-dot" /> Browser-native image editing</div>
        <h1>Make the image<br /><em>fit the idea.</em></h1>
        <p className="upload-lede">Crop, resize, transform and export without sending your image to a server. CropLab does the work on your device.</p>
        <div
          className={`upload-area${isDragOver ? ' drag-over' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            handleFiles(event.dataTransfer.files, 'drop');
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
          aria-label="Upload one or more images"
        >
          <div className="upload-drop-icon"><ImagePlus size={27} strokeWidth={1.7} /></div>
          <div><strong>Drop images here</strong><span>or choose files from your device</span></div>
          <span className="upload-browse"><ArrowUpRight size={15} /></span>
          <input id="upload-image-input" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(event) => { handleFiles(event.target.files ?? [], 'picker'); event.currentTarget.value = ''; }} />
        </div>
        <div className="upload-paste"><MousePointer2 size={13} /> Tip: paste an image with <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd></div>
        <div className="upload-benefits"><span><LockKeyhole size={14} /> Nothing uploaded</span><span><Zap size={14} /> Fast local processing</span><span>JPEG · PNG · WebP · GIF</span></div>
      </div>
    </section>
  );
}
