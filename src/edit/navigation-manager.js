import { ICONS } from '../components/icons';

export const navigationConfig = {
  groups: [
    {
      id: 'navigation',
      titleKey: 'group.navigation',
      defaultTitle: 'Điều hướng & Cắt',
      tools: ['hand', 'crop']
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
    }
  }
};
