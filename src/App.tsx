'use client';

import { AppHeader } from '@/components/AppHeader';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ExportPanel } from '@/components/ExportPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ShortcutGuide } from '@/components/ShortcutGuide';
import { Toast } from '@/components/Toast';
import { UploadScreen } from '@/components/UploadScreen';
import { EditorWorkspace } from '@/components/EditorWorkspace';
import { useCropLabEditor } from '@/hooks/use-croplab-editor';

export function App() {
  const editor = useCropLabEditor();
  const {
    theme, setTheme, loadedImage, loadAndReset, goHome, setIsShortcutGuideOpen, setIsExportOpen,
    isExportOpen, preview, outputDimensions, exportFormat, exportQuality, backgroundColor,
    isLoading, supportedFormats, visibleExportStatus, handleFormatChange, handleQualityChange,
    handleQualityInteractionStart, handleQualityCommit, handleBackgroundChange, handleDownload,
    isHistoryOpen, historyEntries, historyCurrentIndex, handleHistorySelect, setIsHistoryOpen,
    toast, isShortcutGuideOpen, confirmation, confirmAction, cancelConfirmation,
  } = editor;

  return <div className={`app ${theme}`}>
    <a className="skip-link" href="#main-content">Skip to editor</a>
    <AppHeader
      theme={theme}
      onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      onExport={loadedImage ? () => setIsExportOpen(true) : undefined}
      onHome={goHome}
      onShortcuts={() => setIsShortcutGuideOpen(true)}
    />
    <main className="app-main" id="main-content">
      {!loadedImage ? <UploadScreen onLoad={(file) => void loadAndReset(file)} /> : <EditorWorkspace editor={editor} />}
    </main>
    <ExportPanel
      open={isExportOpen}
      onClose={() => setIsExportOpen(false)}
      originalWidth={loadedImage?.element.naturalWidth ?? 0}
      originalHeight={loadedImage?.element.naturalHeight ?? 0}
      fileSize={loadedImage?.fileSize ?? 0}
      cropWidth={editor.croppedAreaPixels?.width ?? null}
      cropHeight={editor.croppedAreaPixels?.height ?? null}
      outputWidth={outputDimensions?.width ?? null}
      outputHeight={outputDimensions?.height ?? null}
      format={exportFormat}
      quality={exportQuality}
      backgroundColor={backgroundColor}
      estimatedSize={preview.size}
      exportStatus={visibleExportStatus}
      supportedFormats={supportedFormats}
      isLoading={isLoading}
      onFormatChange={handleFormatChange}
      onQualityChange={handleQualityChange}
      onQualityInteractionStart={handleQualityInteractionStart}
      onQualityCommit={handleQualityCommit}
      onBackgroundChange={handleBackgroundChange}
      onDownload={() => void handleDownload()}
    />
    <Toast visible={toast.visible} message={toast.message} />
    <HistoryPanel open={isHistoryOpen} entries={historyEntries} currentIndex={historyCurrentIndex} onSelect={handleHistorySelect} onClose={() => setIsHistoryOpen(false)} />
    <ShortcutGuide open={isShortcutGuideOpen} onClose={() => setIsShortcutGuideOpen(false)} />
    <ConfirmationDialog open={confirmation !== null} title={confirmation?.title ?? ''} message={confirmation?.message ?? ''} confirmLabel={confirmation?.confirmLabel ?? 'Yes'} onConfirm={confirmAction} onCancel={cancelConfirmation} />
    <footer className="app-footer"><div className="footer-content"><span><strong>CropLab</strong> · Private by design</span><span>JPEG · PNG · WebP · runs entirely in your browser</span><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}

export default App;
