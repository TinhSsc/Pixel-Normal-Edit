import React, { useEffect } from 'react';
import { Icon } from '../../../../shared/ui/icons';
import { CustomNumberInput } from '../../../../shared/ui/CustomNumberInput';
import { updateDOM } from '../../../../i18n/i18n.js';

export default function ToolButton({ toolConfig }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    updateDOM();
  }, []);

  if (!toolConfig) return null;

  const { id, variants, icon, tooltipKey, hasPopup, popupPosition, settings, defaultActive } = toolConfig;

  const buttonContent = (
    <button className={`tool-btn ${defaultActive ? 'active' : ''}`} data-tool={id} data-i18n={tooltipKey} data-variants={!hasPopup ? variants : undefined}>
      <Icon name={icon} />
    </button>
  );

  if (!hasPopup) {
    return buttonContent;
  }

  return (
    <div className={`tool-with-popup-${popupPosition || 'bottom'}`} data-variants={variants}>
      {buttonContent}
      
      {settings && settings.length > 0 && (
        <div className={`popup-bridge-${popupPosition || 'bottom'}`}>
          <div className="tool-popup">
            {settings.map((setting, idx) => (
              <React.Fragment key={setting.id || idx}>
                <label data-i18n={setting.tooltipKey || setting.labelKey} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {setting.type === 'checkbox' && (
                    <input 
                      type="checkbox" 
                      id={setting.id} 
                      className={setting.className} 
                      defaultChecked={setting.defaultValue} 
                    />
                  )}
                  <span data-i18n={setting.labelKey}>{setting.defaultTitle}</span>
                </label>
                
                {setting.type === 'select' && (
                  <select id={setting.id} className={setting.className} defaultValue={setting.defaultValue}>
                    {setting.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                
                {setting.type !== 'checkbox' && setting.type !== 'select' && setting.type !== 'number' && (
                  <input 
                    type={setting.type} 
                    id={setting.id} 
                    className={setting.className} 
                    min={setting.min} 
                    max={setting.max} 
                    defaultValue={setting.defaultValue} 
                  />
                )}
                
                {setting.type === 'number' && (
                  <CustomNumberInput 
                    id={setting.id}
                    className={setting.className}
                    min={setting.min}
                    max={setting.max}
                    defaultValue={setting.defaultValue}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
