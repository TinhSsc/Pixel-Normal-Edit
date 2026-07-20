import React, { useState, useEffect } from 'react';
import { toolbarConfig } from "../../engine/tool-registry/toolbar-manager.js";
import { updateDOM } from "../../../../i18n/i18n.js";
import { Icon, ICONS } from '../../../../shared/ui/icons';

export default function DrawToolsTab() {
  const groups = toolbarConfig.groups.filter(g => g.type !== 'custom');
  
  const [hiddenTools, setHiddenTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pixel-edit-hidden-tools')) || [];
    } catch {
      return [];
    }
  });

  const toggleTool = (toolId) => {
    const newHidden = hiddenTools.includes(toolId) 
      ? hiddenTools.filter(id => id !== toolId)
      : [...hiddenTools, toolId];
    
    setHiddenTools(newHidden);
    localStorage.setItem('pixel-edit-hidden-tools', JSON.stringify(newHidden));
    window.dispatchEvent(new CustomEvent('hidden-tools-changed', { detail: newHidden }));
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    updateDOM();
  }, [hiddenTools]);

  return (
    <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
      <div className="nested-tabs" style={{ flexWrap: 'wrap' }}>
        {groups.map((group, idx) => (
          <button 
            key={group.id}
            className={`nested-tab-btn ${idx === 0 ? 'active' : ''}`} 
            data-subtab={`subtab-${group.id}`}
            data-tools={group.tools.join(' ')}
            data-i18n={group.titleKey}
          >
            {group.defaultTitle}
          </button>
        ))}
      </div>
      
      {groups.map((group, idx) => (
        <div 
          key={group.id}
          className={`nested-tab-content ${idx === 0 ? 'active' : ''}`} 
          id={`subtab-${group.id}`}
        >
          {group.tools.map(toolId => {
            const tool = toolbarConfig.tools[toolId];
            if (tool) {
              const isHidden = hiddenTools.includes(tool.id);
              return (
                <div key={toolId} style={{ marginBottom: '12px', padding: '14px 18px', background: 'var(--color-surface-alt)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: isHidden ? 0.4 : 1, transition: 'opacity 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <Icon name={tool.icon} style={{ width: '20px', height: '20px', color: 'var(--color-text)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }} data-i18n={tool.tooltipKey}>{tool.defaultTitle || toolId}</span>
                    </div>
                  </div>
                  <label className="ui-bookmark" title={isHidden ? "Hiện công cụ này" : "Ẩn công cụ này"}>
                    <input 
                      type="checkbox" 
                      checked={!isHidden}
                      onChange={() => toggleTool(tool.id)}
                    />
                    <div className="bookmark">
                      <svg viewBox="0 0 32 32">
                        <g>
                          <path d="M27 4v27a1 1 0 0 1-1.625.781L16 24.281l-9.375 7.5A1 1 0 0 1 5 31V4a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4z"></path>
                        </g>
                      </svg>
                    </div>
                  </label>
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}
