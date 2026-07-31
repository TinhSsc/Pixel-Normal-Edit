/**
 * Upload component dùng chung
 * - Drag & drop
 * - Click to browse
 * - Hỗ trợ: PNG, JPG, WebP, GIF, BMP, SVG, HEIC
 * - Xử lý lỗi: file không hợp lệ, ảnh quá lớn
 * - Giới hạn: max 4096x4096 pixels
 */
import { useRef } from 'react';
import { CanvasHelper } from './CanvasHelper';

export default function FileUploader({
  onFileLoad,      // Callback khi load thành công
  onError,         // Callback khi có lỗi
  accept = 'image/*',
  maxSizeMB = 50,   // Giới hạn dung lượng (50MB)
  maxDimension = 4096, // Giới hạn kích thước (4096px)
  multiple = false
}) {
  const fileInputRef = useRef(null);

  const MAX_SIZE = maxSizeMB * 1024 * 1024;
  const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp',
                           'image/gif', 'image/bmp', 'image/svg+xml',
                           'image/heic', 'image/heif'];

  const validateFile = (file) => {
    // Kiểm tra định dạng
    if (!SUPPORTED_TYPES.includes(file.type) &&
        !file.name.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg|heic|heif)$/i)) {
      throw new Error(`File không được hỗ trợ: ${file.name}`);
    }

    // Kiểm tra dung lượng
    if (file.size > MAX_SIZE) {
      throw new Error(`File quá lớn (tối đa ${maxSizeMB}MB): ${file.name}`);
    }

    return true;
  };

  const handleFile = async (file) => {
    try {
      validateFile(file);

      // Kiểm tra kích thước ảnh
      const img = await CanvasHelper.loadImage(URL.createObjectURL(file));
      if (img.naturalWidth > maxDimension || img.naturalHeight > maxDimension) {
        throw new Error(`Ảnh quá lớn (tối đa ${maxDimension}px): ${img.naturalWidth}x${img.naturalHeight}`);
      }

      onFileLoad(img, file);
    } catch (error) {
      onError(error);
    }
  };

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="upload-area" onDrop={handleDrop} onDragOver={handleDragOver}
         onClick={() => fileInputRef.current.click()}>
      <input ref={fileInputRef} type="file" accept={accept} multiple={multiple} hidden
             onChange={(e) => handleFiles(e.target.files)} />
      <div className="upload-icon">📁</div>
      <p className="upload-text">Kéo thả ảnh vào đây hoặc click để chọn</p>
      <p className="upload-hint">Hỗ trợ: PNG, JPG, WebP, GIF, BMP, SVG, HEIC (tối đa {maxSizeMB}MB)</p>
    </div>
  );
}