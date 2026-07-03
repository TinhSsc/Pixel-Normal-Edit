import { Icon, ICONS } from '../components/icons';
import React, { useEffect } from 'react';

export default function ToolbarPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toolbar-mounted'));

    const handleMouseEnter = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      clearTimeout(wrapper._hideTimer);
      const popup = wrapper.querySelector('.popup-bridge-bottom');
      if (popup) {
        popup.style.display = 'block';
        popup.style.position = 'fixed';
        popup.style.zIndex = '9999';
        popup.style.right = 'auto';

        const updatePosition = () => {
          const rect = wrapper.getBoundingClientRect();
          const popupHeight = popup.offsetHeight || 40;
          popup.style.top = (rect.top + (rect.height / 2) - (popupHeight / 2)) + 'px';
          
          let left = rect.right + 10;
          const popupWidth = popup.offsetWidth || 150;
          if (left + popupWidth > window.innerWidth) {
            left = rect.left - popupWidth - 10;
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
        // If the wrapper contains a focused input, don't hide it immediately
        // Or if it was clicked, give it a delay
        let delay = 0;
        if (wrapper.dataset.clicked === 'true' || wrapper.contains(document.activeElement)) {
          delay = 3000;
        }

        wrapper._hideTimer = setTimeout(() => {
          wrapper.dataset.clicked = 'false';
          popup.style.display = '';
          popup.style.position = '';
          popup.style.zIndex = '';
          popup.style.top = '';
          popup.style.left = '';
          popup.style.right = '';
          
          if (wrapper._updatePosition && wrapper._scrollContainer) {
            wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
          }
        }, delay);
      }
    };

    const handleClick = (e) => {
      if (window.innerWidth <= 768) return;
      const wrapper = e.currentTarget;
      wrapper.dataset.clicked = 'true';
      clearTimeout(wrapper._hideTimer);
    };

    const wrappers = document.querySelectorAll('.toolbar .tool-with-popup-bottom');
    wrappers.forEach(w => {
      w.addEventListener('mouseenter', handleMouseEnter);
      w.addEventListener('mouseleave', handleMouseLeave);
      w.addEventListener('click', handleClick);
    });

    const handleClickOutside = (e) => {
      wrappers.forEach(wrapper => {
        if (wrapper.dataset.clicked === 'true' && !wrapper.contains(e.target)) {
          wrapper.dataset.clicked = 'false';
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
        }
      });
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      wrappers.forEach(w => {
        w.removeEventListener('mouseenter', handleMouseEnter);
        w.removeEventListener('mouseleave', handleMouseLeave);
        w.removeEventListener('click', handleClick);
      });
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
          <div className="tool-with-popup-bottom">
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
