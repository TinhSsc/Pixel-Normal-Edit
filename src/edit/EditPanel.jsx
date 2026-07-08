import { Icon, ICONS } from '../components/icons';
import React, { useEffect, useState } from 'react';
import { bindPopups } from '../js/core/popup-manager.js';
import { editConfig } from './edit-manager.js';
import { navigationConfig } from './navigation-manager.js';
import { updateDOM } from '../js/lang/i18n.js';
import ToolButton from '../toolbar/ToolButton';

export default function EditPanel() {
  const [hiddenEdits, setHiddenEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pixel-edit-hidden-edits')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onHiddenEditsChanged = (e) => setHiddenEdits(e.detail || []);
    window.addEventListener('hidden-edits-changed', onHiddenEditsChanged);
    return () => window.removeEventListener('hidden-edits-changed', onHiddenEditsChanged);
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    updateDOM();
  }, [hiddenEdits]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settings-mounted'));

    const themeSelect = document.getElementById('themeSelect');
    const customThemeSettings = document.getElementById('customThemeSettings');
    const customBgColor = document.getElementById('customBgColor');
    const customPrimaryColor = document.getElementById('customPrimaryColor');
    const customGridLineColor = document.getElementById('customGridLineColor');

    // Injects a dynamic <style> tag to override Dockview CSS variables AFTER the library's own
    // styles are loaded. This is needed because !important has no effect on CSS custom properties,
    // and Dockview's stylesheet is injected by the JS bundle (after style.css).
    const getDvStyle = () => {
      let s = document.getElementById('__theme-dv-override');
      if (!s) {
        s = document.createElement('style');
        s.id = '__theme-dv-override';
        document.head.appendChild(s);
      }
      return s;
    };

    const applyDvOverride = () => {
      // Read current resolved values from :root so we pick up whatever theme is active
      const root = getComputedStyle(document.documentElement);
      const bg = root.getPropertyValue('--color-bg').trim();
      const surface = root.getPropertyValue('--color-surface').trim();
      const border = root.getPropertyValue('--color-border').trim();
      const text = root.getPropertyValue('--color-text-bright').trim();
      const textMuted = root.getPropertyValue('--color-text-muted').trim();
      const primary = root.getPropertyValue('--color-primary').trim();

      getDvStyle().textContent = `
        .dockview-theme-dark, .dockview-theme-light {
          --dv-tabs-and-actions-container-background-color: ${surface};
          --dv-activegroup-visiblepanel-tab-background-color: ${bg};
          --dv-activegroup-hiddenpanel-tab-background-color: ${surface};
          --dv-inactivegroup-visiblepanel-tab-background-color: ${bg};
          --dv-inactivegroup-hiddenpanel-tab-background-color: ${surface};
          --dv-activegroup-visiblepanel-tab-color: ${text};
          --dv-activegroup-hiddenpanel-tab-color: ${textMuted};
          --dv-inactivegroup-visiblepanel-tab-color: ${textMuted};
          --dv-inactivegroup-hiddenpanel-tab-color: ${textMuted};
          --dv-group-view-background-color: ${bg};
          --dv-separator-border: ${border};
          --dv-tab-divider-color: ${border};
          --dv-active-sash-color: ${primary};
          --dv-paneview-header-border-color: ${border};
        }
      `;
    };

    const updateTheme = () => {
      if (!themeSelect) return;
      const theme = themeSelect.value;
      document.documentElement.setAttribute('data-theme', theme);

      if (theme === 'custom') {
        customThemeSettings.style.display = 'block';
        document.documentElement.style.setProperty('--custom-bg', customBgColor.value);
        document.documentElement.style.setProperty('--custom-primary', customPrimaryColor.value);

        // Add 33 for 20% opacity for the grid line
        const gridColor = customGridLineColor?.value || '#ffffff';
        document.documentElement.style.setProperty('--custom-grid-line', gridColor + '33');
      } else {
        customThemeSettings.style.display = 'none';
        document.documentElement.style.removeProperty('--custom-bg');
        document.documentElement.style.removeProperty('--custom-primary');
        document.documentElement.style.removeProperty('--custom-grid-line');
      }

      // Give the browser one frame to resolve the new CSS vars before reading them
      requestAnimationFrame(applyDvOverride);

      localStorage.setItem('pixel-edit-theme', theme);
      localStorage.setItem('pixel-edit-custom-bg', customBgColor.value);
      localStorage.setItem('pixel-edit-custom-primary', customPrimaryColor.value);
      if (customGridLineColor) {
        localStorage.setItem('pixel-edit-custom-grid-line', customGridLineColor.value);
      }
    };

    if (themeSelect) {
      const savedTheme = localStorage.getItem('pixel-edit-theme');
      if (savedTheme) {
        themeSelect.value = savedTheme;
        if (savedTheme === 'custom') {
          customBgColor.value = localStorage.getItem('pixel-edit-custom-bg') || '#191920';
          customPrimaryColor.value = localStorage.getItem('pixel-edit-custom-primary') || '#5b5bf0';
          if (customGridLineColor) {
            customGridLineColor.value = localStorage.getItem('pixel-edit-custom-grid-line') || '#ffffff';
          }
        }
        updateTheme();
      } else {
        // Apply Dockview override for the default dark theme on first load
        requestAnimationFrame(applyDvOverride);
      }

      themeSelect.addEventListener('change', updateTheme);
      customBgColor.addEventListener('input', updateTheme);
      customPrimaryColor.addEventListener('input', updateTheme);
      if (customGridLineColor) {
        customGridLineColor.addEventListener('input', updateTheme);
      }
    }

    const showBtnNamesToggle = document.getElementById('showBtnNamesToggle');
    const updateShowNames = () => {
      if (!showBtnNamesToggle) return;
      const isChecked = showBtnNamesToggle.checked;
      localStorage.setItem('pixel-edit-show-btn-names', isChecked);
      if (isChecked) {
        document.documentElement.classList.add('show-btn-names');
      } else {
        document.documentElement.classList.remove('show-btn-names');
      }
    };

    if (showBtnNamesToggle) {
      const savedShowNames = localStorage.getItem('pixel-edit-show-btn-names') === 'true';
      showBtnNamesToggle.checked = savedShowNames;
      if (savedShowNames) {
        document.documentElement.classList.add('show-btn-names');
      } else {
        document.documentElement.classList.remove('show-btn-names');
      }
      showBtnNamesToggle.addEventListener('change', updateShowNames);
    }

    const animationsToggle = document.getElementById('animationsToggle');
    const updateAnimations = () => {
      if (!animationsToggle) return;
      const isChecked = animationsToggle.checked;
      localStorage.setItem('pixel-edit-animations-enabled', isChecked);
      if (isChecked) {
        document.documentElement.classList.add('animations-enabled');
      } else {
        document.documentElement.classList.remove('animations-enabled');
      }
    };

    if (animationsToggle) {
      const savedAnimations = localStorage.getItem('pixel-edit-animations-enabled');
      // Default to true if not set
      const isEnabled = savedAnimations === null ? true : savedAnimations === 'true';
      animationsToggle.checked = isEnabled;
      if (isEnabled) {
        document.documentElement.classList.add('animations-enabled');
      } else {
        document.documentElement.classList.remove('animations-enabled');
      }
      animationsToggle.addEventListener('change', updateAnimations);
    }

    return () => {
      if (themeSelect) {
        themeSelect.removeEventListener('change', updateTheme);
        customBgColor.removeEventListener('input', updateTheme);
        customPrimaryColor.removeEventListener('input', updateTheme);
      }
      if (showBtnNamesToggle) {
        showBtnNamesToggle.removeEventListener('change', updateShowNames);
      }
      if (animationsToggle) {
        animationsToggle.removeEventListener('change', updateAnimations);
      }
    };
  }, []);

  useEffect(() => {
    let unbind = () => {};
    // Need a small timeout to let React render the new DOM elements first
    const timer = setTimeout(() => {
      unbind = bindPopups('.right-panel', 'right');
    }, 50);
    return () => {
      clearTimeout(timer);
      unbind();
    };
  }, [hiddenEdits]);

  return (
    <div className="right-panel" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {[...navigationConfig.groups, ...editConfig.groups].map(group => {
        const isNavigation = navigationConfig.groups.some(g => g.id === group.id);
        const configToUse = isNavigation ? navigationConfig : editConfig;
        
        const visibleTools = group.tools.filter(toolId => !hiddenEdits.includes(toolId));
        if (visibleTools.length === 0) return null;

        return (
          <div className="tool-group" key={group.id}>
            <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n={group.titleKey}>{group.defaultTitle}</div>
            <div className="tool-grid" style={{ gap: '10px' }}>
              {visibleTools.map(toolId => {
                const tool = configToUse.tools[toolId];
                if (!tool) return null;

                let btnContent = null;
                if (tool.type === 'checkbox') {
                  btnContent = (
                    <label data-i18n={tool.tooltipKey} className={`tool-btn ${tool.defaultActive ? 'active' : ''}`} id={tool.labelId} style={{ cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" id={tool.inputId} style={{ display: 'none' }} defaultChecked={tool.defaultActive} />
                      <Icon name={tool.icon} />
                    </label>
                  );
                } else if (tool.type === 'button') {
                  btnContent = (
                    <button id={tool.buttonId} className="tool-btn" data-i18n={tool.tooltipKey}>
                      <Icon name={tool.icon} />
                    </button>
                  );
                } else if (tool.type === 'tool') {
                  btnContent = <ToolButton toolConfig={tool} />;
                }

                if (!tool.hasPopup) {
                  return <React.Fragment key={toolId}>{btnContent}</React.Fragment>;
                }

                return (
                  <div key={toolId} className={`tool-with-popup-${tool.popupPosition}`}>
                    {btnContent}
                    <div className={`popup-bridge-${tool.popupPosition}`}>
                      <div className="tool-popup" style={tool.type === 'button' ? { width: 'max-content' } : {}}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }} data-i18n={tool.popupContent.labelKey}>{tool.popupContent.defaultTitle}</label>
                        <select id={tool.popupContent.selectId} className="btn" style={{ fontSize: '12px', padding: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px' }} data-i18n={tool.popupContent.selectTooltipKey}>
                          {tool.popupContent.options.map((opt, idx) => (
                            <option key={idx} value={opt.value} data-i18n={opt.labelKey}>{opt.defaultLabel}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="panel-section" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }} data-i18n="label.sourceImage">Ảnh gốc</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button id="setBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px' }} data-i18n="tooltip.setBg">
              <Icon name={ICONS.IMAGE_PLUS} style={{ width: '14px', height: '14px' }} />
              <span data-i18n="label.bg">Nền</span>
            </button>
            <button id="replaceBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px', display: 'none' }} data-i18n="tooltip.replaceBg">
              <Icon name={ICONS.IMAGE} style={{ width: '14px', height: '14px' }} />
            </button>
            <button id="flattenBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px', display: 'none' }} data-i18n="tooltip.flattenBg">
              <Icon name={ICONS.BLEND} style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
        <img id="imagePreview" style={{ display: 'none' }} alt="" />
      </div>
    </div>
  );
}
