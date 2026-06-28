import React, { useEffect } from 'react';

export default function SettingsPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settings-mounted'));

    const handleMouseEnter = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      const popup = wrapper.querySelector('.popup-bridge-bottom');
      if (popup) {
        popup.style.display = 'block';
        popup.style.position = 'fixed';
        popup.style.zIndex = '9999';
        popup.style.right = 'auto';

        const updatePosition = () => {
          const rect = wrapper.getBoundingClientRect();
          popup.style.top = (rect.bottom + 5) + 'px';
          
          let left = rect.left;
          const popupRect = popup.getBoundingClientRect();
          if (left + popupRect.width > window.innerWidth) {
            left = window.innerWidth - popupRect.width - 10;
          }
          popup.style.left = left + 'px';
        };

        updatePosition();
        wrapper._updatePosition = updatePosition;
        const container = wrapper.closest('.toolbar, .right-panel');
        if (container) {
          container.addEventListener('scroll', updatePosition, { passive: true });
          wrapper._scrollContainer = container;
        }
      }
    };

    const handleMouseLeave = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      const popup = wrapper.querySelector('.popup-bridge-bottom');
      if (popup) {
        popup.style.display = '';
        popup.style.position = '';
        popup.style.zIndex = '';
        popup.style.top = '';
        popup.style.left = '';
        popup.style.right = '';
        
        if (wrapper._updatePosition && wrapper._scrollContainer) {
          wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
        }
      }
    };

    const wrappers = document.querySelectorAll('.right-panel .tool-with-popup-bottom');
    wrappers.forEach(w => {
      w.addEventListener('mouseenter', handleMouseEnter);
      w.addEventListener('mouseleave', handleMouseLeave);
    });

    const themeSelect = document.getElementById('themeSelect');
    const customThemeSettings = document.getElementById('customThemeSettings');
    const customBgColor = document.getElementById('customBgColor');
    const customPrimaryColor = document.getElementById('customPrimaryColor');

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
      } else {
        customThemeSettings.style.display = 'none';
        document.documentElement.style.removeProperty('--custom-bg');
        document.documentElement.style.removeProperty('--custom-primary');
      }
      
      // Give the browser one frame to resolve the new CSS vars before reading them
      requestAnimationFrame(applyDvOverride);
      
      localStorage.setItem('pixel-edit-theme', theme);
      localStorage.setItem('pixel-edit-custom-bg', customBgColor.value);
      localStorage.setItem('pixel-edit-custom-primary', customPrimaryColor.value);
    };

    if (themeSelect) {
      const savedTheme = localStorage.getItem('pixel-edit-theme');
      if (savedTheme) {
        themeSelect.value = savedTheme;
        if (savedTheme === 'custom') {
          customBgColor.value = localStorage.getItem('pixel-edit-custom-bg') || '#191920';
          customPrimaryColor.value = localStorage.getItem('pixel-edit-custom-primary') || '#5b5bf0';
        }
        updateTheme();
      } else {
        // Apply Dockview override for the default dark theme on first load
        requestAnimationFrame(applyDvOverride);
      }

      themeSelect.addEventListener('change', updateTheme);
      customBgColor.addEventListener('input', updateTheme);
      customPrimaryColor.addEventListener('input', updateTheme);
    }

    return () => {
      if (themeSelect) {
        themeSelect.removeEventListener('change', updateTheme);
        customBgColor.removeEventListener('input', updateTheme);
        customPrimaryColor.removeEventListener('input', updateTheme);
      }
      wrappers.forEach(w => {
        w.removeEventListener('mouseenter', handleMouseEnter);
        w.removeEventListener('mouseleave', handleMouseLeave);
      });
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
              <i data-lucide="blend"></i>
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
            <i data-lucide="grid"></i>
          </label>

          <label data-i18n="tooltip.mirrorMode" className="tool-btn" id="mirrorModeLabel" style={{ cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" id="mirrorMode" style={{ display: 'none' }} />
            <i data-lucide="split-square-vertical"></i>
          </label>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }}>Giao diện (Theme)</div>
        <div className="tool-grid" style={{ gap: '10px', display: 'block' }}>
          <select id="themeSelect" className="btn" style={{ width: '100%', fontSize: '12px', padding: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px', marginBottom: '10px' }}>
            <option value="dark">Tối (Dark)</option>
            <option value="light">Sáng (Light)</option>
            <option value="custom">Tùy chỉnh (Custom)</option>
          </select>
          <div id="customThemeSettings" style={{ display: 'none', padding: '10px', background: 'var(--color-surface)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Nền (Bg)</label>
              <input type="color" id="customBgColor" defaultValue="#191920" style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Nhấn (Primary)</label>
              <input type="color" id="customPrimaryColor" defaultValue="#5b5bf0" style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.imageOps">Thao tác ảnh</div>
        <div className="tool-grid" style={{ gap: '10px' }}>
          <button id="rotateBtn" className="tool-btn" data-i18n="transform.rotate"><i data-lucide="rotate-cw"></i></button>
          <button id="flipHBtn" className="tool-btn" data-i18n="transform.flipH"><i data-lucide="flip-horizontal"></i></button>
          <button id="flipVBtn" className="tool-btn" data-i18n="transform.flipV"><i data-lucide="flip-vertical"></i></button>
        </div>
      </div>

      <div className="panel-section" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
          <h3 style={{ margin: 0, border: 'none', padding: 0 }} data-i18n="label.sourceImage">Ảnh gốc</h3>
          <button id="setBgBtn" className="btn" style={{ padding: '4px 8px', fontSize: '11px' }} data-i18n="tooltip.setBg">
            <i data-lucide="image-plus" style={{ width: '14px', height: '14px' }}></i>
            <span data-i18n="label.bg">Nền</span>
          </button>
        </div>
        <img id="imagePreview" style={{ display: 'none' }} alt="" />
      </div>
    </div>
  );
}
