import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import './App.css';

// Types
type ImageFormat = 'png' | 'jpeg' | 'webp';
type TransformState = {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
};
type CropState = {
  crop: Point;
  zoom: number;
  transform: TransformState;
};
type AspectRatio = { label: string; value: number | null };

export function App() {
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  // Image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cropState, setCropState] = useState<CropState>({
    crop: { x: 50, y: 50 },
    zoom: 1,
    transform: { rotation: 0, flipX: false, flipY: false }
  });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Undo/redo
  const [undoStack, setUndoStack] = useState<CropState[]>([]);
  const [redoStack, setRedoStack] = useState<CropState[]>([]);

  // Export settings
  const [exportFormat, setExportFormat] = useState<ImageFormat>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.9);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);

  // Refs
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast message
  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Load image
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      showToastMessage('Please select an image file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToastMessage('Image is too large (max 50MB)');
      return;
    }
    setOriginalFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImageSrc(src);
        setCropState({
          crop: { x: 50, y: 50 },
          zoom: 1,
          transform: { rotation: 0, flipX: false, flipY: false }
        });
        setUndoStack([]);
        setRedoStack([]);
        setSelectedAspect(null);
        setCustomWidth(null);
        setCustomHeight(null);
        showToastMessage('Image loaded successfully');
      };
      img.onerror = () => showToastMessage('Failed to load image. File may be corrupted.');
      img.src = src;
    };
    reader.onerror = () => showToastMessage('Failed to read file');
    reader.readAsDataURL(file);
  }, [showToastMessage]);

  // File input change
  const handleImageLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [loadImage]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    uploadAreaRef.current?.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    uploadAreaRef.current?.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    uploadAreaRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) loadImage(file);
    else showToastMessage('Please drop an image file');
  }, [loadImage, showToastMessage]);

  // Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            loadImage(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadImage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (redoStack.length > 0) {
            setUndoStack(prev => [...prev, cropState]);
            setCropState(redoStack[0]);
            setRedoStack(prev => prev.slice(1));
            showToastMessage('Redo');
          }
        } else {
          // Undo
          if (undoStack.length > 0) {
            setRedoStack(prev => [cropState, ...prev]);
            setCropState(undoStack[undoStack.length - 1]);
            setUndoStack(prev => prev.slice(0, -1));
            showToastMessage('Undo');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropState, undoStack, redoStack, showToastMessage]);

  // Save state to undo
  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev, cropState]);
    setRedoStack([]);
  }, [cropState]);

  // Cropper callbacks
  const handleCropChange = useCallback((crop: Point) => {
    setCropState(prev => ({ ...prev, crop }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCropState(prev => ({ ...prev, zoom }));
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setCropState(prev => ({ ...prev, transform: { ...prev.transform, rotation } }));
  }, []);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Rotation
  const handleRotateLeft = useCallback(() => {
    saveState();
    setCropState(prev => ({
      ...prev,
      transform: { ...prev.transform, rotation: ((prev.transform.rotation - 90) % 360 + 360) % 360 }
    }));
    showToastMessage('Rotated left');
  }, [saveState, showToastMessage]);

  const handleRotateRight = useCallback(() => {
    saveState();
    setCropState(prev => ({
      ...prev,
      transform: { ...prev.transform, rotation: ((prev.transform.rotation + 90) % 360 + 360) % 360 }
    }));
    showToastMessage('Rotated right');
  }, [saveState, showToastMessage]);

  // Flip
  const handleFlipHorizontal = useCallback(() => {
    saveState();
    setCropState(prev => ({
      ...prev,
      transform: { ...prev.transform, flipX: !prev.transform.flipX }
    }));
    showToastMessage('Flipped horizontally');
  }, [saveState, showToastMessage]);

  const handleFlipVertical = useCallback(() => {
    saveState();
    setCropState(prev => ({
      ...prev,
      transform: { ...prev.transform, flipY: !prev.transform.flipY }
    }));
    showToastMessage('Flipped vertically');
  }, [saveState, showToastMessage]);

  // Aspect ratio
  const handleAspectRatioChange = useCallback((aspect: number | null) => {
    saveState();
    setSelectedAspect(aspect);
    showToastMessage(`Aspect ratio set to ${aspect ? `${aspect}:1` : 'Free'}`);
  }, [saveState, showToastMessage]);

  // Reset
  const handleReset = useCallback(() => {
    if (window.confirm('Reset all edits to original state?')) {
      setCropState({
        crop: { x: 50, y: 50 },
        zoom: 1,
        transform: { rotation: 0, flipX: false, flipY: false }
      });
      setUndoStack([]);
      setRedoStack([]);
      setSelectedAspect(null);
      showToastMessage('Reset to original');
    }
  }, [showToastMessage]);

  // Replace
  const handleReplaceImage = useCallback(() => {
    if (undoStack.length > 0 || redoStack.length > 0) {
      if (!window.confirm('Replace image? This will discard current edits.')) return;
    }
    fileInputRef.current?.click();
  }, [undoStack.length, redoStack.length]);

  // Clear
  const handleClearImage = useCallback(() => {
    if (window.confirm('Clear current image and return to upload screen?')) {
      setImageSrc(null);
      setOriginalImage(null);
      setUndoStack([]);
      setRedoStack([]);
      showToastMessage('Image cleared');
    }
  }, [showToastMessage]);

  // Export
  const handleFormatChange = useCallback((format: ImageFormat) => {
    setExportFormat(format);
    showToastMessage(`Format set to ${format.toUpperCase()}`);
  }, [showToastMessage]);

  const handleQualityChange = useCallback((value: number) => {
    setExportQuality(value);
  }, []);

  const handleWidthChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setCustomWidth(num);
      if (lockAspectRatio) setCustomHeight(null);
    }
  }, [lockAspectRatio]);

  const handleHeightChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setCustomHeight(num);
      if (lockAspectRatio) setCustomWidth(null);
    }
  }, [lockAspectRatio]);

  const handleToggleLock = useCallback(() => {
    setLockAspectRatio(prev => !prev);
  }, []);

  // Download
  const handleDownload = useCallback(async () => {
    if (!originalImage || !croppedAreaPixels) {
      showToastMessage('No image to export');
      return;
    }

    setIsLoading(true);
    try {
      const { rotation, flipX, flipY } = cropState.transform;

      let outputWidth = croppedAreaPixels.width;
      let outputHeight = croppedAreaPixels.height;

      if (customWidth && customHeight) {
        outputWidth = customWidth;
        outputHeight = customHeight;
      } else if (customWidth) {
        outputHeight = Math.round(customWidth * (outputHeight / outputWidth));
        outputWidth = customWidth;
      } else if (customHeight) {
        outputWidth = Math.round(customHeight * (outputWidth / outputHeight));
        outputHeight = customHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipX) ctx.scale(-1, 1);
      if (flipY) ctx.scale(1, -1);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);

      ctx.drawImage(
        originalImage,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        outputWidth, outputHeight
      );
      ctx.restore();

      const mimeType = exportFormat === 'png' ? 'image/png'
        : exportFormat === 'jpeg' ? 'image/jpeg'
        : 'image/webp';

      canvas.toBlob((blob) => {
        if (!blob) {
          showToastMessage('Failed to create image');
          setIsLoading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `croplab-${Date.now()}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
        showToastMessage('Image downloaded successfully');
        setIsLoading(false);
      }, mimeType, exportQuality);

    } catch (err) {
      console.error('Export error:', err);
      showToastMessage('Failed to export image. Please try again.');
      setIsLoading(false);
    }
  }, [originalImage, croppedAreaPixels, cropState, exportFormat, exportQuality, customWidth, customHeight, showToastMessage]);

  // Build CSS transform string for the cropper image (flip + rotation)
  const cropperTransform = React.useMemo(() => {
    const { flipX, flipY } = cropState.transform;
    const parts: string[] = [];
    if (flipX) parts.push('scaleX(-1)');
    if (flipY) parts.push('scaleY(-1)');
    return parts.join(' ');
  }, [cropState.transform]);

  // Aspect ratio options
  const aspectRatios: AspectRatio[] = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '3:2', value: 3 / 2 },
    { label: '2:3', value: 2 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

  // Render
  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <div className="header-content">
          <h1>CropLab</h1>
          <p className="tagline">Simple image editing, entirely in your browser</p>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
          title="Toggle light/dark mode"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <main className="app-main">
        {!imageSrc ? (
          <div className="upload-section">
            <div className="upload-content">
              <h1>Crop your images. Your way.</h1>
              <p className="description">
                Edit, crop, and export images directly in your browser. Your images never leave your device.
              </p>
              <div
                className="upload-area"
                ref={uploadAreaRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <div className="upload-icon">📷</div>
                <p>Drag & drop an image here, or click to select</p>
                <p className="small">or paste an image (Ctrl/Cmd+V)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageLoad}
                />
              </div>
              <p className="privacy-note">
                🔒 Your image never leaves your device.
              </p>
              <div className="supported-formats">
                Supported: JPEG, PNG, WebP, GIF
              </div>
            </div>
          </div>
        ) : (
          <div className="editor-container">
            <div className="editor-toolbar">
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleReplaceImage} title="Replace image" aria-label="Replace image">📁</button>
                <button className="toolbar-btn" onClick={handleClearImage} title="Clear image" aria-label="Clear image">🗑️</button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={() => {
                  if (undoStack.length === 0) return;
                  setRedoStack(prev => [cropState, ...prev]);
                  setCropState(undoStack[undoStack.length - 1]);
                  setUndoStack(prev => prev.slice(0, -1));
                  showToastMessage('Undo');
                }} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
                <button className="toolbar-btn" onClick={() => {
                  if (redoStack.length === 0) return;
                  setUndoStack(prev => [...prev, cropState]);
                  setCropState(redoStack[0]);
                  setRedoStack(prev => prev.slice(1));
                  showToastMessage('Redo');
                }} disabled={redoStack.length === 0} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleRotateLeft} title="Rotate left 90°" aria-label="Rotate left">↺</button>
                <button className="toolbar-btn" onClick={handleRotateRight} title="Rotate right 90°" aria-label="Rotate right">↻</button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleFlipHorizontal} title="Flip horizontal" aria-label="Flip horizontal">↔</button>
                <button className="toolbar-btn" onClick={handleFlipVertical} title="Flip vertical" aria-label="Flip vertical">↕</button>
              </div>
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleReset} title="Reset all edits" aria-label="Reset">⟲</button>
              </div>
            </div>

            <div className="editor-main">
              <div className="editor-canvas-wrapper">
                <Cropper
                  image={imageSrc}
                  crop={cropState.crop}
                  zoom={cropState.zoom}
                  aspect={selectedAspect ?? 0}
                  onCropChange={handleCropChange}
                  onZoomChange={handleZoomChange}
                  rotation={cropState.transform.rotation}
                  onRotationChange={handleRotationChange}
                  onCropComplete={handleCropComplete}
                  showGrid={true}
                  transform={cropperTransform || undefined}
                />
              </div>

              <div className="editor-sidebar">
                <div className="sidebar-section">
                  <h3>Aspect Ratio</h3>
                  <div className="aspect-ratio-list">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.label}
                        className={`aspect-btn ${selectedAspect === ratio.value ? 'active' : ''}`}
                        onClick={() => handleAspectRatioChange(ratio.value)}
                        title={ratio.label}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section">
                  <h3>Zoom</h3>
                  <div className="zoom-controls">
                    <button className="zoom-btn" onClick={() => {
                      saveState();
                      handleZoomChange(Math.max(0.1, cropState.zoom - 0.1));
                    }} title="Zoom out" aria-label="Zoom out">−</button>
                    <div className="zoom-slider-container">
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.05"
                        value={cropState.zoom}
                        onChange={(e) => {
                          saveState();
                          handleZoomChange(parseFloat(e.target.value));
                        }}
                        onMouseDown={() => saveState()}
                        className="zoom-slider"
                        aria-label="Zoom level"
                      />
                      <span className="zoom-value">{Math.round(cropState.zoom * 100)}%</span>
                    </div>
                    <button className="zoom-btn" onClick={() => {
                      saveState();
                      handleZoomChange(Math.min(5, cropState.zoom + 0.1));
                    }} title="Zoom in" aria-label="Zoom in">+</button>
                    <button className="zoom-btn" onClick={() => {
                      saveState();
                      handleZoomChange(1);
                    }} title="Reset zoom" aria-label="Reset zoom">⌂</button>
                  </div>
                </div>

                <div className="sidebar-section">
                  <h3>Rotate</h3>
                  <div className="rotate-slider-container">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={cropState.transform.rotation}
                      onChange={(e) => {
                        saveState();
                        handleRotationChange(parseInt(e.target.value, 10));
                      }}
                      onMouseDown={() => saveState()}
                      className="rotate-slider"
                      aria-label="Rotation"
                    />
                    <span className="rotate-value">{cropState.transform.rotation}°</span>
                  </div>
                </div>

                <div className="sidebar-section">
                  <h3>Flip</h3>
                  <div className="flip-toggle-group">
                    <label className="flip-toggle">
                      <input
                        type="checkbox"
                        checked={cropState.transform.flipX}
                        onChange={handleFlipHorizontal}
                      />
                      <span className="toggle-label">Horizontal</span>
                    </label>
                    <label className="flip-toggle">
                      <input
                        type="checkbox"
                        checked={cropState.transform.flipY}
                        onChange={handleFlipVertical}
                      />
                      <span className="toggle-label">Vertical</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="export-section">
              <div className="export-content">
                <div className="export-top">
                  <div className="image-info">
                    <div className="info-item">
                      <span className="info-label">Original</span>
                      <span className="info-value">
                        {originalImage ? `${originalImage.width} × ${originalImage.height}` : '--'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Crop</span>
                      <span className="info-value">
                        {croppedAreaPixels ? `${Math.round(croppedAreaPixels.width)} × ${Math.round(croppedAreaPixels.height)}` : '--'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Output</span>
                      <span className="info-value">
                        {customWidth && customHeight ? `${customWidth} × ${customHeight}` :
                         customWidth ? `${customWidth} × auto` :
                         customHeight ? `auto × ${customHeight}` :
                         croppedAreaPixels ? `${Math.round(croppedAreaPixels.width)} × ${Math.round(croppedAreaPixels.height)}` : '--'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">File Size</span>
                      <span className="info-value">{(originalFileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="export-controls">
                    <div className="format-group">
                      <label htmlFor="format-select">Format</label>
                      <select
                        id="format-select"
                        value={exportFormat}
                        onChange={(e) => handleFormatChange(e.target.value as ImageFormat)}
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>

                    {exportFormat !== 'png' && (
                      <div className="quality-group">
                        <label htmlFor="quality-slider">Quality</label>
                        <div className="quality-slider-container">
                          <input
                            type="range"
                            id="quality-slider"
                            min="0.1"
                            max="1"
                            step="0.01"
                            value={exportQuality}
                            onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                            className="quality-slider"
                          />
                          <span className="quality-value">{Math.round(exportQuality * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="dimensions-group">
                      <label>Dimensions (px)</label>
                      <div className="dimensions-inputs">
                        <input
                          type="number"
                          placeholder="Width"
                          value={customWidth ?? ''}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          min="1"
                          className="dimension-input"
                          aria-label="Custom width"
                        />
                        <button
                          className="lock-btn"
                          onClick={handleToggleLock}
                          title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                          aria-label={lockAspectRatio ? 'Unlock' : 'Lock'}
                        >
                          {lockAspectRatio ? '🔒' : '🔓'}
                        </button>
                        <input
                          type="number"
                          placeholder="Height"
                          value={customHeight ?? ''}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          min="1"
                          className="dimension-input"
                          aria-label="Custom height"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Processing...' : '⬇ Download Image'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showToast && (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>CropLab</strong>
            <span> · Private by design — runs entirely in your browser</span>
          </div>
          <div className="footer-meta">
            <span>Supports JPEG, PNG, WebP, GIF</span>
            <span className="footer-divider">·</span>
            <span>© {new Date().getFullYear()} CropLab</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
