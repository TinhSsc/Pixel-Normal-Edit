import React, { useState } from 'react';
import { toolbarConfig } from './toolbar-manager';
import { Icon, ICONS } from '../components/icons';

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

  return (
    <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
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
                <div key={toolId} style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-surface-alt)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isHidden ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <Icon name={tool.icon} style={{ width: '20px', height: '20px', color: 'var(--color-text-bright)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-bright)' }} data-i18n={tool.tooltipKey}>{tool.defaultTitle || toolId}</span>
                    </div>
                  </div>
                  <button 
                    className={`btn ${!isHidden ? 'active' : ''}`} 
                    title={isHidden ? "Hiện công cụ này" : "Ẩn công cụ này"}
                    style={{ 
                      padding: '8px', 
                      background: isHidden ? 'transparent' : 'var(--color-primary)', 
                      border: isHidden ? '1px solid var(--color-border)' : 'none',
                      color: isHidden ? 'var(--color-text-muted)' : '#fff',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <Icon name={ICONS.PIN} style={{ width: '16px', height: '16px' }} />
                  </button>
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
