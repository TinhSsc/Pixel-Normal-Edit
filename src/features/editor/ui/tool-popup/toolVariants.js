// DATA thuần: danh sách sub-tool cho từng base tool.
// icon là tên icon Lucide (dùng trực tiếp làm data-lucide).
// Muốn thêm tool khác (eraser, outline...) chỉ cần thêm 1 entry ở đây.
export const TOOL_VARIANTS = {
  eraser: [
    { id: 'normal-eraser', label: 'Tẩy (Eraser)', icon: 'eraser', labelKey: 'toolVariant.eraser' },
  ],
  picker: [
    { id: 'color-picker', label: 'Lấy màu (Picker)', icon: 'pipette', labelKey: 'toolVariant.picker' },
  ],
  fill: [
    { id: 'bucket-fill', label: 'Đổ màu (Fill)', icon: 'paint-bucket', labelKey: 'toolVariant.fill' },
  ],
  'magic-eraser': [
    { id: 'magic-wand', label: 'Xoá nền (Magic)', icon: 'wand-2', labelKey: 'toolVariant.magic' },
  ],
  outline: [
    { id: 'normal-outline', label: 'Tô viền (Outline)', icon: 'highlighter', labelKey: 'toolVariant.outline' },
  ],
  line: [
    { id: 'straight-line', label: 'Đường thẳng (Line)', icon: 'slash', labelKey: 'toolVariant.line' },
  ],
  rect: [
    { id: 'rectangle', label: 'Hình chữ nhật (Rect)', icon: 'square', labelKey: 'toolVariant.rect' },
  ],
  circle: [
    { id: 'circle-shape', label: 'Hình tròn (Circle)', icon: 'circle', labelKey: 'toolVariant.circle' },
  ],
};

