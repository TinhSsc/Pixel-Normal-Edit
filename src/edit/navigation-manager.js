import { ICONS } from '../components/icons';

export const navigationConfig = {
  groups: [
    {
      id: 'navigation',
      titleKey: 'group.navigation',
      defaultTitle: 'Điều hướng & Cắt',
      tools: ['hand', 'crop', 'select', 'cut', 'copy', 'paste']
    }
  ],
  tools: {
    'hand': {
      id: 'hand',
      type: 'tool',
      icon: ICONS.HAND,
      tooltipKey: 'tool.pan',
      defaultTitle: 'Bàn tay (Pan)',
      hasPopup: false
    },
    'crop': {
      id: 'crop',
      type: 'tool',
      icon: ICONS.CROP,
      tooltipKey: 'tool.crop',
      defaultTitle: 'Cắt ảnh (Crop)',
      hasPopup: false
    },
    'select': {
      id: 'select',
      type: 'tool',
      icon: ICONS.MOUSE_POINTER_2,
      tooltipKey: 'tool.select',
      defaultTitle: 'Chọn vùng',
      hasPopup: false
    },
    'cut': {
      id: 'cut',
      type: 'action', // Indicates it triggers an action directly
      icon: ICONS.SCISSORS,
      tooltipKey: 'tool.cut',
      defaultTitle: 'Cắt (Ctrl+X)'
    },
    'copy': {
      id: 'copy',
      type: 'action',
      icon: ICONS.COPY,
      tooltipKey: 'tool.copy',
      defaultTitle: 'Sao chép (Ctrl+C)'
    },
    'paste': {
      id: 'paste',
      type: 'action',
      icon: ICONS.CLIPBOARD_PASTE,
      tooltipKey: 'tool.paste',
      defaultTitle: 'Dán (Ctrl+V)'
    }
  }
};
