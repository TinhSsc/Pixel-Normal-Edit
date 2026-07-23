import { ICONS } from '../../../../shared/ui/icons';

export const toolbarConfig = {
  groups: [
    {
      id: 'colors',
      type: 'custom', // Used for color picker which doesn't fit standard tools
    },
    {
      id: 'draw',
      titleKey: 'group.draw',
      defaultTitle: 'Công cụ vẽ',
      tools: ['pixel-pen', 'highlight-pen', 'blend-brush', 'dither-brush', 'soft-brush', 'spray-pen', 'eraser', 'picker']
    },
    {
      id: 'fillBg',
      titleKey: 'group.fillBg',
      defaultTitle: 'Đổ màu & Nền',
      tools: ['fill', 'replace-color', 'magic-eraser', 'outline']
    },
    {
      id: 'shape',
      titleKey: 'group.shape',
      defaultTitle: 'Hình khối',
      tools: ['line', 'rect', 'circle', 'text']
    }
  ],
  tools: {
    'replace-color': {
      id: 'replace-color',
      variants: 'replace-color',
      icon: ICONS.REPLACE,
      tooltipKey: 'tool.replaceColor',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'replaceTolerance', labelKey: 'magicEraser.tolerance', defaultTitle: 'Sai lệch màu', min: 0, max: 255, defaultValue: 0 }
      ]
    },
    'spray-pen': {
      id: 'spray-pen',
      icon: ICONS.SPRAY_CAN,
      tooltipKey: 'tool.spray-pen',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'sprayPenSize', labelKey: 'label.spraySize', tooltipKey: 'tooltip.spraySize', defaultTitle: 'Cỡ bút', min: 1, max: 50, defaultValue: 10 },
        { type: 'number', id: 'sprayPenDensity', labelKey: 'label.sprayDensity', tooltipKey: 'tooltip.sprayDensity', defaultTitle: 'Mật độ', min: 1, max: 100, defaultValue: 10 }
      ]
    },
    'pixel-pen': {
      id: 'pixel-pen',
      icon: ICONS.PENCIL,
      tooltipKey: 'tool.pixel-pen',
      hasPopup: true,
      popupPosition: 'bottom',
      defaultActive: true,
      settings: [
        { type: 'number', id: 'pixelPenSize', labelKey: 'label.pencilSize', tooltipKey: 'tooltip.pencilSize', defaultTitle: 'Cỡ bút', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'highlight-pen': {
      id: 'highlight-pen',
      icon: ICONS.SUN,
      tooltipKey: 'tool.highlight-pen',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'highlightPenSize', labelKey: 'label.pencilSize', tooltipKey: 'tooltip.pencilSize', defaultTitle: 'Cỡ bút', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'blend-brush': {
      id: 'blend-brush',
      icon: ICONS.DROPLET,
      tooltipKey: 'tool.blend-brush',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'blendBrushSize', labelKey: 'label.pencilSize', tooltipKey: 'tooltip.pencilSize', defaultTitle: 'Cỡ bút', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'dither-brush': {
      id: 'dither-brush',
      icon: ICONS.GRID,
      tooltipKey: 'tool.dither-brush',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'ditherBrushSize', labelKey: 'label.pencilSize', tooltipKey: 'tooltip.pencilSize', defaultTitle: 'Cỡ bút', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'soft-brush': {
      id: 'soft-brush',
      icon: ICONS.CLOUD,
      tooltipKey: 'tool.soft-brush',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'softBrushSize', labelKey: 'label.pencilSize', tooltipKey: 'tooltip.pencilSize', defaultTitle: 'Cỡ bút', min: 1, max: 50, defaultValue: 3 }
      ]
    },
    'eraser': {
      id: 'eraser',
      variants: 'eraser',
      icon: ICONS.ERASER,
      tooltipKey: 'tool.eraser',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'eraserSize', labelKey: 'label.eraserSize', tooltipKey: 'tooltip.eraserSize', defaultTitle: 'Cỡ tẩy', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'picker': {
      id: 'picker',
      variants: 'picker',
      icon: ICONS.PIPETTE,
      tooltipKey: 'tool.picker',
      hasPopup: false
    },
    'fill': {
      id: 'fill',
      variants: 'fill',
      icon: ICONS.PAINT_BUCKET,
      tooltipKey: 'tool.fill',
      hasPopup: false
    },
    'magic-eraser': {
      id: 'magic-eraser',
      variants: 'magic-eraser',
      icon: ICONS.WAND_2,
      tooltipKey: 'tool.magicEraser',
      hasPopup: false
    },
    'outline': {
      id: 'outline',
      variants: 'outline',
      icon: ICONS.HIGHLIGHTER,
      tooltipKey: 'tool.outline',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', id: 'outlineThickness', labelKey: 'label.outlineThick', defaultTitle: 'Độ dày viền', min: 1, max: 10, defaultValue: 1 }
      ]
    },
    'line': {
      id: 'line',
      variants: 'line',
      icon: ICONS.SLASH,
      tooltipKey: 'tool.line',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', className: 'shape-thickness', labelKey: 'label.shapeThick', defaultTitle: 'Độ dày nét', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'rect': {
      id: 'rect',
      variants: 'rect',
      icon: ICONS.SQUARE,
      tooltipKey: 'tool.rect',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', className: 'shape-thickness', labelKey: 'label.outlineThick', defaultTitle: 'Độ dày viền', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'circle': {
      id: 'circle',
      variants: 'circle',
      icon: ICONS.CIRCLE,
      tooltipKey: 'tool.circle',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'number', className: 'shape-thickness', labelKey: 'label.outlineThick', defaultTitle: 'Độ dày viền', min: 1, max: 20, defaultValue: 1 }
      ]
    },
    'text': {
      id: 'text',
      variants: 'text',
      icon: ICONS.TYPE,
      tooltipKey: 'tool.text',
      hasPopup: true,
      popupPosition: 'bottom',
      settings: [
        { type: 'select', id: 'textToolFont', labelKey: 'text.fontFamily', defaultTitle: 'Font', options: ['Arial', 'Courier New', 'Times New Roman', 'Comic Sans MS', 'Impact', 'Verdana', 'Tahoma', 'Trebuchet MS'], defaultValue: 'Arial' },
        { type: 'number', id: 'textToolSize', labelKey: 'text.fontSize', defaultTitle: 'Cỡ chữ', min: 8, max: 100, defaultValue: 16 },
        { type: 'checkbox', id: 'textToolBold', labelKey: 'text.bold', defaultTitle: 'In đậm', defaultValue: false },
        { type: 'checkbox', id: 'textToolItalic', labelKey: 'text.italic', defaultTitle: 'In nghiêng', defaultValue: false }
      ]
    }
  }
};
