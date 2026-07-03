import { Icon, ICONS } from '../components/icons';
import React, { useEffect } from 'react';
import { bindPopups } from '../js/core/popup-manager.js';

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
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.draw">Công cụ vẽ</div>
        <div className="tool-grid">
          <div className="tool-with-popup-bottom" data-variants="pencil">
            <button className="tool-btn active" data-tool="pencil" data-i18n="tool.pencil"><Icon name={ICONS.PENCIL} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.pencilSize"><span data-i18n="label.pencilSize">Cỡ bút</span></label>
                <input type="number" id="pencilSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="eraser" data-i18n="tool.eraser"><Icon name={ICONS.ERASER} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="tooltip.eraserSize"><span data-i18n="label.eraserSize">Cỡ tẩy</span></label>
                <input type="number" id="eraserSize" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <button className="tool-btn" data-tool="picker" data-i18n="tool.picker"><Icon name={ICONS.PIPETTE} /></button>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.fillBg">Đổ màu &amp; Nền</div>
        <div className="tool-grid">
          <button className="tool-btn" data-tool="fill" data-i18n="tool.fill"><Icon name={ICONS.PAINT_BUCKET} /></button>
          <button className="tool-btn" data-tool="magic-eraser" data-i18n="tool.magicEraser"><Icon name={ICONS.WAND_2} /></button>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="outline" data-i18n="tool.outline"><Icon name={ICONS.HIGHLIGHTER} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">Độ dày viền</label>
                <input type="number" id="outlineThickness" min="1" max="10" defaultValue="1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-group">
        <div className="tool-group-title" onClick={(e) => e.target.closest('.tool-group').classList.toggle('collapsed')} style={{ cursor: 'pointer' }} data-i18n="group.shape">Hình khối</div>
        <div className="tool-grid">
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="line" data-i18n="tool.line"><Icon name={ICONS.SLASH} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.shapeThick">Độ dày nét</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="rect" data-i18n="tool.rect"><Icon name={ICONS.SQUARE} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">Độ dày viền</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
          <div className="tool-with-popup-bottom">
            <button className="tool-btn" data-tool="circle" data-i18n="tool.circle"><Icon name={ICONS.CIRCLE} /></button>
            <div className="popup-bridge-bottom">
              <div className="tool-popup">
                <label data-i18n="label.outlineThick">Độ dày viền</label>
                <input type="number" className="shape-thickness" min="1" max="20" defaultValue="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
