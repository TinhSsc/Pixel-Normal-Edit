// DATA thuần: danh sách sub-tool cho từng base tool.
// icon là tên icon Lucide (dùng trực tiếp làm data-lucide).
// Muốn thêm tool khác (eraser, outline...) chỉ cần thêm 1 entry ở đây.
export const TOOL_VARIANTS = {
  eraser: [
    { id: 'normal-eraser', label: 'Tẩy (Eraser)', icon: 'eraser' },
  ],
  picker: [
    { id: 'color-picker', label: 'Lấy màu (Picker)', icon: 'pipette' },
  ],
  fill: [
    { id: 'bucket-fill', label: 'Đổ màu (Fill)', icon: 'paint-bucket' },
  ],
  'magic-eraser': [
    { id: 'magic-wand', label: 'Xoá nền (Magic)', icon: 'wand-2' },
  ],
  outline: [
    { id: 'normal-outline', label: 'Tô viền (Outline)', icon: 'highlighter' },
  ],
  line: [
    { id: 'straight-line', label: 'Đường thẳng (Line)', icon: 'slash' },
  ],
  rect: [
    { id: 'rectangle', label: 'Hình chữ nhật (Rect)', icon: 'square' },
  ],
  circle: [
    { id: 'circle-shape', label: 'Hình tròn (Circle)', icon: 'circle' },
  ],
};

