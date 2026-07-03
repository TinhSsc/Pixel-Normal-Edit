import { Icon, ICONS } from '../components/icons';
import React, { useEffect } from 'react';
import { bindPopups } from '../js/core/popup-manager.js';

export default function SettingsPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settings-mounted'));

    const unbindPopups = bindPopups('.right-panel', 'right');


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

    return () => {
      unbindPopups();
      if (themeSelect) {
        themeSelect.removeEventListener('change', updateTheme);
        customBgColor.removeEventListener('input', updateTheme);
        customPrimaryColor.removeEventListener('input', updateTheme);
      }
      if (showBtnNamesToggle) {
        showBtnNamesToggle.removeEventListener('change', updateShowNames);
      }
    };
  }, []);

  return (
    <div className="right-panel" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.settings">Chế độ &amp; Trạng thái</div>
        <div className="tool-grid" style={{ gap: '10px' }}>
          <div className="tool-with-popup-bottom">
            <label data-i18n="tooltip.gradientMode" className="tool-btn" id="gradientModeLabel" style={{ cursor: 'pointer', margin: 0 }}>
              <input type="checkbox" id="gradientMode" style={{ display: 'none' }} />
              <Icon name={ICONS.BLEND} />
            </label>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }} data-i18n="label.gradDir">Hướng đổ</label>
                <select id="gradientDirection" className="btn" style={{ fontSize: '12px', padding: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px' }} data-i18n="tooltip.gradDir">
                  <option value="vertical" data-i18n="option.vertical">Dọc (Trên-Dưới)</option>
                  <option value="horizontal" data-i18n="option.horizontal">Ngang (Trái-Phải)</option>
                  <option value="diagonal" data-i18n="option.diagonal">Chéo (Góc)</option>
                  <option value="radial" data-i18n="option.radial">Tỏa tròn (Tâm)</option>
                </select>
              </div>
            </div>
          </div>

          <label data-i18n="tooltip.showGrid" className="tool-btn active" id="showGridLabel" style={{ cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" id="showGrid" style={{ display: 'none' }} defaultChecked />
            <Icon name={ICONS.GRID} />
          </label>

          <label data-i18n="tooltip.mirrorMode" className="tool-btn" id="mirrorModeLabel" style={{ cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" id="mirrorMode" style={{ display: 'none' }} />
            <Icon name={ICONS.SPLIT_SQUARE_VERTICAL} />
          </label>
        </div>
      </div>



      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.imageOps">Thao tác ảnh</div>
        <div className="tool-grid" style={{ gap: '10px' }}>
          <div className="tool-with-popup-bottom">
            <button id="rotateBtn" className="tool-btn" data-i18n="transform.rotate"><Icon name={ICONS.ROTATE_CW} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup" style={{ width: 'max-content' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }} data-i18n="label.rotateOptions">Tùy chọn xoay (khi không vuông)</label>
                <select id="rotateModeSelect" className="btn" style={{ fontSize: '12px', padding: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px' }}>
                  <option value="size" data-i18n="option.rotateSize">Xoay luôn size pixel</option>
                  <option value="pixel" data-i18n="option.rotatePixel">Chỉ xoay pixel thôi</option>
                </select>
              </div>
            </div>
          </div>
          <button id="flipHBtn" className="tool-btn" data-i18n="transform.flipH"><Icon name={ICONS.FLIP_HORIZONTAL} /></button>
          <button id="flipVBtn" className="tool-btn" data-i18n="transform.flipV"><Icon name={ICONS.FLIP_VERTICAL} /></button>
        </div>
      </div>

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
