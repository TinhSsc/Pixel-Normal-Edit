/**
 * Download button dùng chung
 * - Hỗ trợ nhiều format
 * - Quality slider
 * - Preview dung lượng
 */
import { useState, useEffect } from 'react';
import { CanvasHelper } from './CanvasHelper';

/**
 * Ước tính dung lượng file đầu ra
 */
async function estimateSize(canvas, type, quality) {
  const blob = await CanvasHelper.toBlob(canvas, type, quality);
  return blob ? blob.size : 0;
}

export default function DownloadButton({
  canvas,            // Canvas cần download
  filename = 'image',
  formats = ['image/png', 'image/jpeg', 'image/webp'],
  defaultFormat = 'image/png',
  showQuality = true,
  onDownload,        // Callback khi download
  onError            // Callback khi lỗi
}) {
  const [format, setFormat] = useState(defaultFormat);
  const [quality, setQuality] = useState(0.92);
  const [estimatedSize, setEstimatedSize] = useState(null);

  // Ước tính dung lượng (chỉ gọi khi format/quality thay đổi)
  useEffect(() => {
    if (!canvas) return;
    estimateSize(canvas, format, quality).then(setEstimatedSize);
  }, [canvas, format, quality]);

  const handleDownload = async () => {
    try {
      if (!canvas) throw new Error('Chưa có ảnh để tải');

      const blob = await CanvasHelper.toBlob(canvas, format, quality);
      const ext = format.split('/')[1].replace('jpeg', 'jpg');
      CanvasHelper.downloadBlob(blob, `${filename}.${ext}`);

      if (onDownload) onDownload(blob);
    } catch (error) {
      if (onError) onError(error);
    }
  };

  return (
    <div className="download-group">
      <div className="format-selector">
        {formats.map(f => {
          const label = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' }[f];
          return (
            <button key={f} className={`btn ${format === f ? 'active' : ''}`}
                    onClick={() => setFormat(f)}>{label}</button>
          );
        })}
      </div>

      {showQuality && format !== 'image/png' && (
        <div className="quality-slider">
          <label>Quality: {Math.round(quality * 100)}%</label>
          <input type="range" min="0.1" max="1" step="0.05"
                 value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={handleDownload}>
        💾 Download {estimatedSize && `(~${CanvasHelper.formatFileSize(estimatedSize)})`}
      </button>
    </div>
  );
}