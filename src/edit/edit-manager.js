import { ICONS } from '../components/icons';

export const editConfig = {
  groups: [
    {
      id: 'settings',
      titleKey: 'group.settings',
      defaultTitle: 'Chế độ & Trạng thái',
      tools: ['rulerMode', 'gradientMode', 'showGrid', 'mirrorMode']
    },
    {
      id: 'imageOps',
      titleKey: 'group.imageOps',
      defaultTitle: 'Thao tác ảnh',
      tools: ['rotate', 'flipH', 'flipV']
    }
  ],
  tools: {
    'rulerMode': {
      id: 'rulerMode',
      type: 'checkbox',
      labelId: 'rulerModeLabel',
      inputId: 'rulerMode',
      icon: ICONS.RULER,
      tooltipKey: 'tooltip.rulerMode',
      defaultActive: false,
      hasPopup: true,
      popupPosition: 'bottom',
      popupContent: {
        labelKey: 'label.rulerOptions',
        defaultTitle: 'Tùy chọn thước đo',
        selectId: 'rulerOptionSelect',
        options: [
          { value: 'draw', labelKey: 'option.rulerDraw', defaultLabel: 'Đo khi vẽ' },
          { value: 'measure', labelKey: 'option.rulerMeasure', defaultLabel: 'Chỉ đo (không vẽ)' }
        ]
      }
    },
    'gradientMode': {
      id: 'gradientMode',
      type: 'checkbox',
      labelId: 'gradientModeLabel',
      inputId: 'gradientMode',
      icon: ICONS.BLEND,
      tooltipKey: 'tooltip.gradientMode',
      defaultActive: false,
      hasPopup: true,
      popupPosition: 'bottom',
      popupContent: {
        labelKey: 'label.gradDir',
        defaultTitle: 'Hướng đổ',
        selectId: 'gradientDirection',
        selectTooltipKey: 'tooltip.gradDir',
        options: [
          { value: 'vertical', labelKey: 'option.vertical', defaultLabel: 'Dọc (Trên-Dưới)' },
          { value: 'horizontal', labelKey: 'option.horizontal', defaultLabel: 'Ngang (Trái-Phải)' },
          { value: 'diagonal', labelKey: 'option.diagonal', defaultLabel: 'Chéo (Góc)' },
          { value: 'radial', labelKey: 'option.radial', defaultLabel: 'Tỏa tròn (Tâm)' }
        ]
      }
    },
    'showGrid': {
      id: 'showGrid',
      type: 'checkbox',
      labelId: 'showGridLabel',
      inputId: 'showGrid',
      icon: ICONS.GRID,
      tooltipKey: 'tooltip.showGrid',
      defaultActive: true
    },
    'mirrorMode': {
      id: 'mirrorMode',
      type: 'checkbox',
      labelId: 'mirrorModeLabel',
      inputId: 'mirrorMode',
      icon: ICONS.SPLIT_SQUARE_VERTICAL,
      tooltipKey: 'tooltip.mirrorMode',
      defaultActive: false
    },
    'rotate': {
      id: 'rotate',
      type: 'button',
      buttonId: 'rotateBtn',
      icon: ICONS.ROTATE_CW,
      tooltipKey: 'transform.rotate',
      hasPopup: true,
      popupPosition: 'bottom',
      popupContent: {
        labelKey: 'label.rotateOptions',
        defaultTitle: 'Tùy chọn xoay (khi không vuông)',
        selectId: 'rotateModeSelect',
        options: [
          { value: 'size', labelKey: 'option.rotateSize', defaultLabel: 'Xoay luôn size pixel' },
          { value: 'pixel', labelKey: 'option.rotatePixel', defaultLabel: 'Chỉ xoay pixel thôi' }
        ]
      }
    },
    'flipH': {
      id: 'flipH',
      type: 'button',
      buttonId: 'flipHBtn',
      icon: ICONS.FLIP_HORIZONTAL,
      tooltipKey: 'transform.flipH'
    },
    'flipV': {
      id: 'flipV',
      type: 'button',
      buttonId: 'flipVBtn',
      icon: ICONS.FLIP_VERTICAL,
      tooltipKey: 'transform.flipV'
    }
  }
};
