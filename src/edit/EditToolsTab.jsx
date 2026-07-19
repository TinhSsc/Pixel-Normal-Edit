import React, { useState } from 'react';
import { editConfig } from './edit-manager.js';
import { navigationConfig } from './navigation-manager.js';
import { Icon, ICONS } from '../components/icons';

export default function EditToolsTab() {
  const groups = [...navigationConfig.groups, ...editConfig.groups];
  const allToolsConfig = { ...navigationConfig.tools, ...editConfig.tools };
  
  const [hiddenEdits, setHiddenEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pixel-edit-hidden-edits')) || [];
    } catch {
      return [];
    }
  });

  const toggleEdit = (toolId) => {
    const newHidden = hiddenEdits.includes(toolId) 
      ? hiddenEdits.filter(id => id !== toolId)
      : [...hiddenEdits, toolId];
    
    setHiddenEdits(newHidden);
    localStorage.setItem('pixel-edit-hidden-edits', JSON.stringify(newHidden));
    window.dispatchEvent(new CustomEvent('hidden-edits-changed', { detail: newHidden }));
  };

  return (
    <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div className="nested-tabs" style={{ flexWrap: 'wrap' }}>
        {groups.map((group, idx) => (
          <button 
            key={group.id}
            className={`nested-tab-btn ${idx === 0 ? 'active' : ''}`} 
            data-subtab={`subtab-edit-${group.id}`}
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
          id={`subtab-edit-${group.id}`}
        >
          {group.tools.map(toolId => {
            const tool = allToolsConfig[toolId];
            if (tool) {
              const isHidden = hiddenEdits.includes(tool.id);
              return (
                <div key={toolId} style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface-1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isHidden ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <Icon name={tool.icon} style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }} data-i18n={tool.tooltipKey}>{toolId}</span>
                    </div>
                  </div>
                  <button 
                    className={`btn ${!isHidden ? 'active' : ''}`} 
                    title={isHidden ? "Hiện công cụ này" : "Ẩn công cụ này"}
                    style={{ 
                      padding: '8px', 
                      background: isHidden ? 'transparent' : 'var(--accent)', 
                      border: isHidden ? '1px solid var(--border)' : 'none',
                      color: isHidden ? 'var(--text-muted)' : '#fff',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => toggleEdit(tool.id)}
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
