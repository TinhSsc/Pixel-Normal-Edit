/**
 * Tools Registry - Danh mục tool config duy nhất cho toàn bộ mini tools
 * Cả HomePage và RelatedTools đều import từ file này
 */
import { ICONS } from '../ui/icons/icons.js';

export const TOOLS = [
  {
    id: 'convert',
    icon: ICONS.ARROW_LEFT_RIGHT,
    titleKey: 'home.tool.convert',
    title: 'Convert ảnh',
    descKey: 'home.tool.convertDesc',
    desc: 'Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác.',
    detailKey: 'home.tool.convertDetail',
    detail: '12 định dạng hỗ trợ',
    color: '#3b82f6'
  },
  {
    id: 'compress',
    icon: ICONS.FILE_ARCHIVE,
    titleKey: 'home.tool.compress',
    title: 'Nén ảnh',
    descKey: 'home.tool.compressDesc',
    desc: 'Giảm 60–90% dung lượng file mà không giảm chất lượng đáng kể.',
    detailKey: 'home.tool.compressDetail',
    detail: 'Lossy & lossless',
    color: '#10b981'
  },
  {
    id: 'resize',
    icon: ICONS.MAXIMIZE,
    titleKey: 'home.tool.resize',
    title: 'Resize ảnh',
    descKey: 'home.tool.resizeDesc',
    desc: 'Thay đổi kích thước tự do, theo tỉ lệ hoặc preset phổ biến.',
    detailKey: 'home.tool.resizeDetail',
    detail: 'Giữ tỉ lệ khung hình',
    color: '#f59e0b'
  },
  {
    id: 'crop',
    icon: ICONS.CROP,
    titleKey: 'home.tool.crop',
    title: 'Crop ảnh',
    descKey: 'home.tool.cropDesc',
    desc: 'Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3...',
    detailKey: 'home.tool.cropDetail',
    detail: 'Preset tỉ lệ phổ biến',
    color: '#8b5cf6'
  },
  {
    id: 'rotate',
    icon: ICONS.ROTATE_CW,
    titleKey: 'home.tool.rotate',
    title: 'Xoay / Lật',
    descKey: 'home.tool.rotateDesc',
    desc: 'Xoay góc tùy chỉnh, lật ngang và dọc theo một cú click.',
    detailKey: 'home.tool.rotateDetail',
    detail: 'Lật ngang & dọc',
    color: '#ef4444'
  },
  {
    id: 'frames-to-media',
    icon: ICONS.FILM || 'film',
    titleKey: 'home.tool.framesToMedia',
    title: 'Ghép ảnh → GIF / Video',
    descKey: 'home.tool.framesToMediaDesc',
    desc: 'Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM.',
    detailKey: 'home.tool.framesToMediaDetail',
    detail: 'GIF & WebM',
    color: '#f59e0b'
  },
  {
    id: 'media-to-frames',
    icon: ICONS.SCISSORS || 'scissors',
    titleKey: 'home.tool.mediaToFrames',
    title: 'Tách GIF / Video → Ảnh',
    descKey: 'home.tool.mediaToFramesDesc',
    desc: 'Tách từng frame của GIF hoặc Video thành ảnh riêng biệt.',
    detailKey: 'home.tool.mediaToFramesDetail',
    detail: 'Extract frames',
    color: '#06b6d4'
  },
  {
    id: 'gif-simplify',
    icon: ICONS.TIMER,
    titleKey: 'home.tool.gifSimplify',
    title: 'Đơn giản GIF / Tua nhanh video',
    descKey: 'home.tool.gifSimplifyDesc',
    desc: 'Bỏ xen kẽ frame để GIF nhẹ hơn, video chạy nhanh hơn.',
    detailKey: 'home.tool.gifSimplifyDetail',
    detail: 'Giảm x2, x3...',
    color: '#a855f7'
  },
  {
    id: 'editor',
    icon: ICONS.PEN_TOOL,
    titleKey: 'home.tool.editor',
    title: 'Pixel Editor',
    descKey: 'home.tool.editorDesc',
    desc: 'Chỉnh sửa nâng cao: layers, filters, masks, blend modes.',
    detailKey: 'home.tool.editorDetail',
    detail: 'Full-featured editor',
    color: '#ec4899'
  },
];