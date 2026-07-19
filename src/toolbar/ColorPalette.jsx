import React, { useEffect, useState, useCallback } from 'react';
import { getGlobalPinnedColors, toggleColorPin, debounceExtractCanvasColors } from '../js/core/color-palette.js';
import { Icon, ICONS } from '../components/icons';

export default function ColorPalette() {
  const [autoColors, setAutoColors] = useState([]);
  const [globalPins, setGlobalPins] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshState = useCallback((newAutoColors) => {
    setGlobalPins(getGlobalPinnedColors());
    if (newAutoColors) {
      setAutoColors(newAutoColors);
    }
  }, []);

  useEffect(() => {
    const handlePaletteUpdated = (e) => {
      refreshState(e.detail?.autoColors || []);
    };
    window.addEventListener('palette-updated', handlePaletteUpdated);
    
    // Initial load
    debounceExtractCanvasColors();

    return () => window.removeEventListener('palette-updated', handlePaletteUpdated);
  }, [refreshState]);

  // Merge lists to get unique colors for display, prioritizing Global > Auto
  const mergedColors = [];
  const seen = new Set();
  
  globalPins.forEach(hex => {
    if (!seen.has(hex)) {
      mergedColors.push({ hex, type: 'global' });
      seen.add(hex);
    }
  });

  autoColors.forEach(hex => {
    if (!seen.has(hex)) {
      mergedColors.push({ hex, type: 'auto' });
      seen.add(hex);
    }
  });

  const handleLeftClick = (hex) => {
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
      colorPicker.value = hex;
      // Trigger vanilla JS change event
      colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
      colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleRightClick = (e, hex) => {
    e.preventDefault();
    toggleColorPin(hex);
    // Refresh local state immediately since toggleColorPin triggers an async palette-updated event, 
    // but we want UI to feel responsive
    refreshState(autoColors);
  };

  if (mergedColors.length === 0) return null;

  const displayColors = isExpanded ? mergedColors : mergedColors.slice(0, 5);
  const hasMore = mergedColors.length > 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <div className="color-palette-grid" style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '6px', 
        maxHeight: isExpanded ? '120px' : 'none', 
        overflowY: isExpanded ? 'auto' : 'visible', 
        paddingRight: '2px' // For scrollbar
      }}>
        {displayColors.map(item => (
          <div 
            key={item.hex}
            style={{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: item.hex, 
              borderRadius: '4px', 
              cursor: 'pointer',
              border: '1px solid var(--border)',
              position: 'relative',
              boxSizing: 'border-box'
            }}
            onClick={() => handleLeftClick(item.hex)}
            onContextMenu={(e) => handleRightClick(e, item.hex)}
            title={`Màu: ${item.hex}`}
          >
            <div 
              style={{ 
                position: 'absolute', 
                top: '-6px', 
                right: '-6px', 
                padding: '6px', // Hit target padding
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleRightClick(e, item.hex);
              }}
              title={item.type === 'auto' ? 'Bấm để ghim' : 'Bấm để bỏ ghim'}
            >
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                backgroundColor: item.type === 'global' ? '#ffb300' : 'rgba(255,255,255,0.4)',
                boxShadow: '0 0 2px rgba(0,0,0,0.8)',
                border: '1px solid rgba(0,0,0,0.5)'
              }} />
            </div>
          </div>
        ))}
        {hasMore && (
          <div 
            style={{ 
              width: '24px', 
              height: '24px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px', 
              cursor: 'pointer',
              background: 'var(--surface-1)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu gọn" : "Xem thêm"}
          >
            <Icon name={isExpanded ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN} style={{ width: '16px', height: '16px' }} />
          </div>
        )}
      </div>
    </div>
  );
}
