/**
 * Preview component dùng chung
 * Hiển thị ảnh gốc và ảnh sau khi xử lý
 */
import { useState } from 'react';
import { CanvasHelper } from './CanvasHelper';

export default function ImagePreview({
  imageSrc,          // URL ảnh gốc
  processedSrc,      // URL ảnh đã xử lý (optional)
  imageInfo,         // { width, height, size, type }
  onImageLoad,       // Callback khi ảnh load
  children,          // Overlay content (crop area, v.v.)
  className = ''
}) {
  const [loading, setLoading] = useState(true);

  return (
    <div className={`preview-container ${className}`}>
      {loading && <div className="preview-loading">Đang tải ảnh...</div>}

      <div className="preview-image-wrapper">
        <img
          src={processedSrc || imageSrc}
          alt="Preview"
          className="preview-image"
          onLoad={() => { setLoading(false); if (onImageLoad) onImageLoad(); }}
          onError={() => setLoading(false)}
        />
        {children}
      </div>

      {imageInfo && (
        <div className="image-info">
          {imageInfo.width && imageInfo.height && (
            <span>{imageInfo.width}×{imageInfo.height}</span>
          )}
          {imageInfo.size && (
            <span>{CanvasHelper.formatFileSize(imageInfo.size)}</span>
          )}
          {imageInfo.type && (
            <span>{imageInfo.type}</span>
          )}
        </div>
      )}
    </div>
  );
}