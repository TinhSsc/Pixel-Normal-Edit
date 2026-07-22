import React, { useEffect } from 'react';
import { CustomDropdown } from '../../../shared/ui/CustomDropdown';
import { t, getCurrentLang, setLang } from '../../../i18n/i18n.js';

export default function AppearanceTab() {
  useEffect(() => {
    const themeSelect = document.getElementById('themeSelect');
    const customThemeSettings = document.getElementById('customThemeSettings');
    const customBgColor = document.getElementById('customBgColor');
    const customPrimaryColor = document.getElementById('customPrimaryColor');
    const customGridLineColor = document.getElementById('customGridLineColor');

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
        const gridColor = customGridLineColor?.value || '#ffffff';
        document.documentElement.style.setProperty('--custom-grid-line', gridColor + '33');
      } else {
        customThemeSettings.style.display = 'none';
        document.documentElement.style.removeProperty('--custom-bg');
        document.documentElement.style.removeProperty('--custom-primary');
        document.documentElement.style.removeProperty('--custom-grid-line');
      }

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

  return (
    <div className="tab-content active" id="tab-appearance">
      <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.language') || 'Ngôn ngữ (Language)'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CustomDropdown
            id="languageSelect"
            defaultValue={getCurrentLang()}
            onChange={(e) => {
              setLang(e.target.value);
              window.location.reload();
            }}
            options={[
              { value: 'vi', label: 'Tiếng Việt' },
              { value: 'en', label: 'English' }
            ]}
          />
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('theme.title') || 'Giao diện (Theme)'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CustomDropdown
            id="themeSelect"
            defaultValue={localStorage.getItem('pixel-edit-theme') || 'dark'}
            options={[
              { value: 'dark', label: t('theme.dark') || 'Tối (Dark)' },
              { value: 'light', label: t('theme.light') || 'Sáng (Light)' },
              { value: 'custom', label: t('theme.custom') || 'Tùy chỉnh (Custom)' }
            ]}
          />

          <div id="customThemeSettings" style={{ display: 'none', padding: '16px', background: 'var(--color-surface-alt)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customBgColor">{t('theme.bg') || 'Nền (Bg)'}</label>
              <input type="color" id="customBgColor" defaultValue="#191920" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customPrimaryColor">{t('theme.primary') || 'Nhấn (Primary)'}</label>
              <input type="color" id="customPrimaryColor" defaultValue="#5b5bf0" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }} htmlFor="customGridLineColor">{t('theme.gridLine') || 'Lưới (Grid)'}</label>
              <input type="color" id="customGridLineColor" defaultValue="#ffffff" style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.penShapeTitle') || 'Hình dạng bút vẽ'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CustomDropdown
            id="globalPenShape"
            defaultValue="circle"
            options={[
              { value: 'circle', label: t('label.shapeCircle') || 'Tròn (Circle)' },
              { value: 'square', label: t('label.shapeSquare') || 'Vuông (Square)' }
            ]}
          />
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '12px' }}>
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{t('settings.display') || 'Hiển thị'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" id="showBtnNamesToggle" className="check" />
            <span>{t('settings.showBtnNames') || 'Hiển thị tên công cụ dưới biểu tượng'}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input type="checkbox" id="animationsToggle" defaultChecked className="check" />
            <span>{t('settings.animations') || 'Bật hiệu ứng chuyển động (Animations)'}</span>
          </label>
        </div>
      </div>
    </div>
  );
}