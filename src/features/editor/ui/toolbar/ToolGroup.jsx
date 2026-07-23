import React, { useState, useEffect, useCallback } from 'react';
import ToolButton from './ToolButton';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import ColorPalette from './ColorPalette';

const STORAGE_KEY = 'toolPopupPins';

function loadAllPins() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// Lấy metadata variant đã pin cho 1 baseTool từ window.__TOOL_VARIANTS__ (được expose bởi tool-popup init)
function getPinnedVariantsMeta(baseTool, pinnedIds) {
  const variantsMap = window.__TOOL_VARIANTS__ || {};
  const variants = variantsMap[baseTool] || [];
  return pinnedIds.map(id => variants.find(v => v.id === id)).filter(Boolean);
}

export default function ToolGroup({ groupConfig, toolsConfig }) {
  const [allPins, setAllPins] = useState(() => loadAllPins());
  const [hiddenTools, setHiddenTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pixel-edit-hidden-tools')) || [];
    } catch {
      return [];
    }
  });

  // Lắng nghe event 'pins-changed' từ popupState.js mỗi khi pin thay đổi
  const onPinsChanged = useCallback((e) => {
    setAllPins(e.detail?.pins || loadAllPins());
  }, []);

  useEffect(() => {
    window.addEventListener('pins-changed', onPinsChanged);
    return () => window.removeEventListener('pins-changed', onPinsChanged);
  }, [onPinsChanged]);

  useEffect(() => {
    const onHiddenToolsChanged = (e) => {
      setHiddenTools(e.detail || []);
    };
    window.addEventListener('hidden-tools-changed', onHiddenToolsChanged);
    return () => window.removeEventListener('hidden-tools-changed', onHiddenToolsChanged);
  }, []);

  if (groupConfig.type === 'custom' && groupConfig.id === 'colors') {
    return (
      <div className="tool-group">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div className="color-picker-wrapper" style={{ flexShrink: 0 }}>
            <input type="color" id="colorPicker" className="color-input primary-color" defaultValue="#000000" data-i18n="tooltip.primaryColor" />
            <input type="color" id="colorPicker2" className="color-input secondary-color" defaultValue="#ffffff" data-i18n="tooltip.secondaryColor" />
            <button id="swapColorsBtn" className="swap-colors-btn" data-i18n="tooltip.swapColors">
              <Icon name={ICONS.ARROW_LEFT_RIGHT} />
            </button>
          </div>
          <ColorPalette />
        </div>
      </div>
    );
  }

  return (
    <div className="tool-group">
      <div 
        className="tool-group-title" 
        onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} 
        style={{ cursor: 'pointer' }} 
        data-i18n={groupConfig.titleKey}
      >
        {groupConfig.defaultTitle}
      </div>
      <div className="tool-grid">
        {groupConfig.tools.map(toolId => {
          if (hiddenTools.includes(toolId)) return null;

          const toolConfig = toolsConfig[toolId];
          // baseTool là key tra cứu TOOL_VARIANTS (lấy từ toolConfig.variants nếu có)
          const baseTool = toolConfig?.variants || null;

          // Danh sách variant đã pin cho tool này
          const pinnedIds = baseTool ? (allPins[baseTool] || []) : [];
          const pinnedMeta = getPinnedVariantsMeta(baseTool, pinnedIds);

          return (
            <React.Fragment key={toolId}>
              <ToolButton toolConfig={toolConfig} />
              {/* Render pinned variant buttons ngay sau tool-btn gốc trong tool-grid */}
              {pinnedMeta.map(variant => (
                <PinnedVariantBtn
                  key={variant.id}
                  baseTool={baseTool}
                  variant={variant}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Component riêng cho từng pinned variant button
function PinnedVariantBtn({ baseTool, variant }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkActive = () => {
      const activeVariantMap = window.__ACTIVE_VARIANTS__ || {};
      setIsActive(activeVariantMap[baseTool] === variant.id);
    };
    checkActive();
    window.addEventListener('active-variant-changed', checkActive);
    return () => window.removeEventListener('active-variant-changed', checkActive);
  }, [baseTool, variant.id]);

  // Re-init lucide icon sau khi component mount
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const handleClick = (e) => {
    e.stopPropagation();
    // Xóa active khỏi tất cả .tool-btn (vanilla JS style đang dùng)
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    // Dispatch để vanilla JS (events.js bindQuickPinBarEvents) xử lý activation
    window.dispatchEvent(new CustomEvent('pinned-variant-click', {
      detail: { baseTool, variantId: variant.id, label: variant.label }
    }));
  };

  return (
    <button
      className={`tool-btn pinned-tool-btn${isActive ? ' active' : ''}`}
      data-base-tool={baseTool}
      data-variant-id={variant.id}
      data-pinned="true"
      title={variant.label}
      onClick={handleClick}
    >
      <i data-lucide={variant.icon}></i>
    </button>
  );
}
