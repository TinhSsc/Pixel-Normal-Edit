import { Icon, ICONS } from '../../../../shared/ui/icons';
import React, { useEffect } from 'react';
import { t } from '../../../../i18n/i18n.js';
import { bindPopups } from '../../engine/core/popup-manager.js';

export default function ToolbarPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toolbar-mounted'));

    const unbindPopups = bindPopups('.toolbar', 'left');

    return () => {
      unbindPopups();
    };
  }, []);

  return (
    <div className="toolbar" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div id="mobile-animation-strip-portal" className="mobile-only" style={{ width: '100%' }}></div>
      <div className="tool-group" style={{ paddingBottom: '15px', borderBottom: '1px solid #3e3e4a', marginBottom: '15px', width: '100%' }}>
        <div className="color-picker-wrapper">
          <input type="color" id="colorPicker" className="color-input primary-color" defaultValue="#000000" data-i18n="tooltip.primaryColor" />
          <input type="color" id="colorPicker2" className="color-input secondary-color" defaultValue="#ffffff" data-i18n="tooltip.secondaryColor" />
          <button id="swapColorsBtn" className="swap-colors-btn" data-i18n="tooltip.swapColors">
            <Icon name={ICONS.ARROW_LEFT_RIGHT} />
          </button>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.draw">{t('group.draw') || 'Công cụ vẽ'}</div>
        <div className="tool-grid">
          <div className="tool-with-popup-bottom">
            <button className="tool-btn active" data-tool="pixel-pen" data-i18n="tool.pixel-pen"><Icon name={ICONS.PENCIL} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.pencilSize"><span data-i18n="label.pencilSize">{t('label.pencilSize') || 'Cỡ bút'}</span></label>
                <input type="number" id="pixelPenSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="highlight-pen" data-i18n="tool.highlight-pen"><Icon name={ICONS.SUN} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.pencilSize"><span data-i18n="label.pencilSize">{t('label.pencilSize') || 'Cỡ bút'}</span></label>
                <input type="number" id="highlightPenSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="blend-brush" data-i18n="tool.blend-brush"><Icon name={ICONS.DROPLET} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.pencilSize"><span data-i18n="label.pencilSize">{t('label.pencilSize') || 'Cỡ bút'}</span></label>
                <input type="number" id="blendBrushSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="spray-pen" data-i18n="tool.spray-pen"><Icon name={ICONS.SPRAY_CAN} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.spraySize"><span data-i18n="label.spraySize">{t('label.spraySize') || 'Kích thước'}</span></label>
                <input type="number" id="sprayPenSize" min="1" max="50" defaultValue="10" />
                <label data-i18n="tooltip.sprayDensity"><span data-i18n="label.sprayDensity">{t('label.sprayDensity') || 'Mật độ'}</span></label>
                <input type="number" id="sprayPenDensity" min="1" max="100" defaultValue="10" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom" data-variants="eraser">
            <button className="tool-btn" data-tool="eraser" data-i18n="tool.eraser"><Icon name={ICONS.ERASER} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.eraserSize"><span data-i18n="label.eraserSize">{t('label.eraserSize') || 'Cỡ tẩy'}</span></label>
                <input type="number" id="eraserSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <button className="tool-btn" data-tool="select" data-variants="select" data-i18n="tool.select" title={t('tool.select') || 'Bắt (Select/Move)'}><Icon name={ICONS.MOUSE_POINTER_2} /></button>
          <button className="tool-btn" data-tool="picker" data-variants="picker" data-i18n="tool.picker"><Icon name={ICONS.PIPETTE} /></button>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.fillBg">{t('group.fillBg') || 'Đổ màu & Nền'}</div>
        <div className="tool-grid">
          <button className="tool-btn" data-tool="fill" data-variants="fill" data-i18n="tool.fill"><Icon name={ICONS.PAINT_BUCKET} /></button>
          <div className="tool-with-popup-bottom" data-variants="replace-color">
            <button className="tool-btn" data-tool="replace-color" data-i18n="tool.replaceColor"><Icon name={ICONS.REPLACE} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.replaceTolerance"><span data-i18n="magicEraser.tolerance">{t('magicEraser.tolerance') || 'Sai lệch màu'}</span></label>
                <input type="number" id="replaceTolerance" min="0" max="255" defaultValue="0" />
              </div>
            </div>
          </div>
          <button className="tool-btn" data-tool="magic-eraser" data-variants="magic-eraser" data-i18n="tool.magicEraser"><Icon name={ICONS.WAND_2} /></button>
          <div className="tool-with-popup-bottom" data-variants="outline">
            <button className="tool-btn" data-tool="outline" data-i18n="tool.outline"><Icon name={ICONS.HIGHLIGHTER} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">{t('label.outlineThick') || 'Độ dày viền'}</label>
                <input type="number" id="outlineThickness" min="1" max="10" defaultValue="1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.shape">{t('group.shape') || 'Hình khối'}</div>
        <div className="tool-grid">
          <div className="tool-with-popup-bottom" data-variants="line">
            <button className="tool-btn" data-tool="line" data-i18n="tool.line"><Icon name={ICONS.SLASH} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.shapeThick">{t('label.shapeThick') || 'Độ dày nét'}</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom" data-variants="rect">
            <button className="tool-btn" data-tool="rect" data-i18n="tool.rect"><Icon name={ICONS.SQUARE} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">{t('label.outlineThick') || 'Độ dày viền'}</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom" data-variants="circle">
            <button className="tool-btn" data-tool="circle" data-i18n="tool.circle"><Icon name={ICONS.CIRCLE} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">{t('label.outlineThick') || 'Độ dày viền'}</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
