export const FORMAT_REGISTRY = [
  {
    id: 'image/jpeg',
    ext: 'jpg',
    label: 'JPEG',
    desc: 'Phổ biến nhất, nén mất dữ liệu (lossy), phù hợp ảnh chụp.',
    advanced: false
  },
  {
    id: 'image/png',
    ext: 'png',
    label: 'PNG',
    desc: 'Hỗ trợ nền trong suốt, nén không mất dữ liệu (lossless).',
    advanced: false
  },
  {
    id: 'image/webp',
    ext: 'webp',
    label: 'WebP',
    desc: 'Chất lượng cao, dung lượng nhỏ, hỗ trợ trong suốt và ảnh động.',
    advanced: false
  },
  {
    id: 'image/svg+xml',
    ext: 'svg',
    label: 'SVG',
    desc: 'Đồ họa vector cho web, có thể phóng to không vỡ hình.',
    advanced: false,
    inputOnly: true
  },
  {
    id: 'image/avif',
    ext: 'avif',
    label: 'AVIF',
    desc: 'Nén rất hiệu quả, chất lượng cao, hỗ trợ HDR và trong suốt.',
    advanced: true
  },
  {
    id: 'image/gif',
    ext: 'gif',
    label: 'GIF',
    desc: '256 màu, hỗ trợ ảnh động.',
    advanced: false // Browser đọc native, không cần WASM
  },
  {
    id: 'image/heic',
    ext: 'heic',
    label: 'HEIC / HEIF',
    desc: 'Định dạng mặc định trên nhiều thiết bị Apple, chất lượng cao.',
    advanced: true,
    inputOnly: true
  },
  {
    id: 'image/jxl',
    ext: 'jxl',
    label: 'JPEG XL',
    desc: 'Thế hệ mới của JPEG, hỗ trợ lossless/lossy, HDR và ảnh động.',
    advanced: true,
    inputOnly: true
  },
  {
    id: 'image/tiff',
    ext: 'tiff',
    label: 'TIFF',
    desc: 'Chất lượng rất cao, dùng trong in ấn, quét ảnh và lưu trữ.',
    advanced: true
  },
  {
    id: 'image/bmp',
    ext: 'bmp',
    label: 'BMP',
    desc: 'Không hoặc ít nén, dung lượng lớn, tương thích cao với Windows.',
    advanced: false // Browser đọc native, không cần WASM
  },
  {
    id: 'image/jp2',
    ext: 'jp2',
    label: 'JP2',
    desc: 'JPEG 2000, chất lượng cao hơn JPEG ở cùng dung lượng.',
    advanced: true,
    inputOnly: true
  },
  {
    id: 'image/jxr',
    ext: 'jxr',
    label: 'JXR',
    desc: 'JPEG XR của Microsoft, hỗ trợ HDR và nén tốt.',
    advanced: true,
    inputOnly: true
  },
  {
    id: 'image/tga',
    ext: 'tga',
    label: 'TGA',
    desc: 'Texture phổ biến trong game và đồ họa 3D.',
    advanced: true
  },
  {
    id: 'image/x-icon',
    ext: 'ico',
    label: 'ICO',
    desc: 'Biểu tượng ứng dụng Windows.',
    advanced: true
  },
  {
    id: 'image/vnd.ms-dds',
    ext: 'dds',
    label: 'DDS',
    desc: 'Texture cho DirectX và game.',
    advanced: true
  },
  { id: 'image/x-adobe-dng', ext: 'dng', label: 'DNG', desc: 'RAW chuẩn mở của Adobe.', advanced: true, inputOnly: true },
  { id: 'image/x-canon-cr2', ext: 'cr2', label: 'CR2', desc: 'RAW của Canon (đời cũ).', advanced: true, inputOnly: true },
  { id: 'image/x-canon-cr3', ext: 'cr3', label: 'CR3', desc: 'RAW của Canon (đời mới).', advanced: true, inputOnly: true },
  { id: 'image/x-nikon-nef', ext: 'nef', label: 'NEF', desc: 'RAW của Nikon.', advanced: true, inputOnly: true },
  { id: 'image/x-sony-arw', ext: 'arw', label: 'ARW', desc: 'RAW của Sony.', advanced: true, inputOnly: true },
  { id: 'image/x-olympus-orf', ext: 'orf', label: 'ORF', desc: 'RAW của Olympus/OM System.', advanced: true, inputOnly: true },
  { id: 'image/x-fuji-raf', ext: 'raf', label: 'RAF', desc: 'RAW của Fujifilm.', advanced: true, inputOnly: true },
  { id: 'image/x-panasonic-rw2', ext: 'rw2', label: 'RW2', desc: 'RAW của Panasonic Lumix.', advanced: true, inputOnly: true },
  { id: 'image/x-pentax-pef', ext: 'pef', label: 'PEF', desc: 'RAW của Pentax.', advanced: true, inputOnly: true },
  { id: 'image/x-sigma-x3f', ext: 'x3f', label: 'X3F', desc: 'RAW của Sigma (Foveon).', advanced: true, inputOnly: true },
  { id: 'image/x-raw', ext: 'raw', label: 'RAW', desc: 'Dữ liệu ảnh gốc chưa qua xử lý.', advanced: true, inputOnly: true },
  { id: 'application/postscript', ext: 'ai', label: 'AI', desc: 'File dự án Adobe Illustrator.', advanced: true, inputOnly: true },
  { id: 'application/eps', ext: 'eps', label: 'EPS', desc: 'Vector dùng trong in ấn và trao đổi dữ liệu.', advanced: true, inputOnly: true },
  { id: 'application/pdf', ext: 'pdf', label: 'PDF', desc: 'Có thể chứa văn bản, vector, raster, font và metadata.', advanced: true, inputOnly: true },
  { id: 'image/vnd.adobe.photoshop', ext: 'psd', label: 'PSD', desc: 'File dự án Adobe Photoshop, hỗ trợ layer.', advanced: true, inputOnly: true },
  { id: 'image/vnd.adobe.photoshop-large', ext: 'psb', label: 'PSB', desc: 'Photoshop Large Document, dành cho file rất lớn.', advanced: true, inputOnly: true },
  { id: 'image/x-exr', ext: 'exr', label: 'EXR', desc: 'OpenEXR, tiêu chuẩn trong VFX, CGI và dựng phim.', advanced: true, inputOnly: true },
  { id: 'image/vnd.radiance', ext: 'hdr', label: 'HDR', desc: 'Radiance HDR, lưu dải sáng rộng.', advanced: true, inputOnly: true },
  { id: 'image/ktx', ext: 'ktx', label: 'KTX', desc: 'Texture chuẩn OpenGL/Vulkan.', advanced: true, inputOnly: true },
  { id: 'image/ktx2', ext: 'ktx2', label: 'KTX2', desc: 'Phiên bản mới, hỗ trợ nén Basis Universal.', advanced: true, inputOnly: true },
  { id: 'image/x-icns', ext: 'icns', label: 'ICNS', desc: 'Biểu tượng ứng dụng macOS.', advanced: true, inputOnly: true }
];

export const getFormatById = (id) => FORMAT_REGISTRY.find(f => f.id === id);