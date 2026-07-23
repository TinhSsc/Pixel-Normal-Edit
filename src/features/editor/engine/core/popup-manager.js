let activePopups = [];

function hidePopup(wrapper) {
  wrapper.dataset.clicked = 'false';
  clearTimeout(wrapper._hideTimer);
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

function closeAllPopups(exceptWrapper = null) {
  const allWrappers = document.querySelectorAll('.tool-with-popup-bottom');
  allWrappers.forEach(wrapper => {
    if (wrapper === exceptWrapper) return;
    hidePopup(wrapper);
  });
  activePopups = exceptWrapper && exceptWrapper.dataset.clicked === 'true' ? [exceptWrapper] : [];
}

export function bindPopups(containerSelector, side = 'left') {
  const wrappers = document.querySelectorAll(`${containerSelector} .tool-with-popup-bottom`);
  
  const showPopup = (wrapper) => {
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
        
        let left;
        const popupWidth = popup.offsetWidth || 150;
        const toolPopup = popup.querySelector('.tool-popup');
        
        if (toolPopup) {
          toolPopup.classList.remove('arrow-left', 'arrow-right');
        }

        if (side === 'left') {
          left = rect.right + 10;
          if (left + popupWidth > window.innerWidth) {
            left = rect.left - popupWidth - 10;
            if (toolPopup) toolPopup.classList.add('arrow-right');
          } else {
            if (toolPopup) toolPopup.classList.add('arrow-left');
          }
        } else {
          left = rect.left - popupWidth - 10;
          if (left < 0) {
            left = rect.right + 10;
            if (toolPopup) toolPopup.classList.add('arrow-left');
          } else {
            if (toolPopup) toolPopup.classList.add('arrow-right');
          }
        }
        popup.style.left = left + 'px';
      };

      updatePosition();
      if (wrapper._scrollContainer) {
        wrapper._scrollContainer.removeEventListener('scroll', wrapper._updatePosition);
      }
      wrapper._updatePosition = updatePosition;
      const container = wrapper.closest('.toolbar, .right-panel');
      if (container) {
        container.addEventListener('scroll', updatePosition, { passive: true });
        wrapper._scrollContainer = container;
      }
    }
  };

  const handleMouseEnter = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    
    // Nếu có popup đang ghim, KHÔNG cho phép mở popup hover
    if (activePopups.length > 0 && !activePopups.includes(wrapper)) {
      return; 
    }
    
    closeAllPopups(wrapper);
    showPopup(wrapper);
  };

  const handleMouseLeave = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    
    // Đã ghim -> không tự đóng khi rút chuột (không delay 5s)
    if (wrapper.dataset.clicked === 'true' || wrapper.contains(document.activeElement)) {
      return;
    }

    hidePopup(wrapper);
    activePopups = activePopups.filter(w => w !== wrapper);
  };

  const handleClick = (e) => {
    if (window.innerWidth <= 768) return;
    const wrapper = e.currentTarget;
    
    // Ignore clicks inside the popup itself
    if (e.target.closest('[class^="popup-bridge"]')) return;

    const checkbox = wrapper.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (e.target === checkbox) return; 
      
      setTimeout(() => {
        if (checkbox.checked) {
          closeAllPopups(wrapper);
          wrapper.dataset.clicked = 'true';
          if (!activePopups.includes(wrapper)) activePopups.push(wrapper);
          showPopup(wrapper);
        } else {
          hidePopup(wrapper);
          activePopups = activePopups.filter(w => w !== wrapper);
        }
      }, 10);
      return;
    }
    
    if (wrapper.dataset.clicked === 'true') {
      hidePopup(wrapper);
      activePopups = activePopups.filter(w => w !== wrapper);
    } else {
      closeAllPopups(wrapper);
      wrapper.dataset.clicked = 'true';
      if (!activePopups.includes(wrapper)) activePopups.push(wrapper);
      showPopup(wrapper);
    }
  };

  wrappers.forEach(w => {
    w.addEventListener('mouseenter', handleMouseEnter);
    w.addEventListener('mouseleave', handleMouseLeave);
    w.addEventListener('click', handleClick);
  });

  const handleClickOutside = (e) => {
    const clickedInsideAnyPopup = activePopups.some(w => w.contains(e.target));
    // Nếu click ra ngoài popup đang ghim, và cũng không click vào tool-btn (vì tool-btn đã handle click riêng)
    const isToolBtn = e.target.closest('.tool-with-popup-bottom');
    if (!clickedInsideAnyPopup && !isToolBtn) {
      closeAllPopups();
    }
  };

  if (!document.body.dataset.popupsBound) {
    document.addEventListener('click', handleClickOutside);
    document.body.dataset.popupsBound = 'true';
  }

  return () => {
    wrappers.forEach(w => {
      w.removeEventListener('mouseenter', handleMouseEnter);
      w.removeEventListener('mouseleave', handleMouseLeave);
      w.removeEventListener('click', handleClick);
    });
  };
}
