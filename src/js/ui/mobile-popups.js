export function initMobilePopups() {
  // On mobile, tool popups are triggered by a small dot button
  document.querySelectorAll('.tool-with-popup, .tool-with-popup-left, .tool-with-popup-bottom').forEach(wrapper => {
    const trigger = document.createElement('button');
    trigger.className = 'mobile-popup-trigger';
    trigger.textContent = '…';
    wrapper.appendChild(trigger);

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('show-popup');
      // Close all
      document.querySelectorAll('.tool-with-popup.show-popup, .tool-with-popup-left.show-popup, .tool-with-popup-bottom.show-popup')
        .forEach(w => w.classList.remove('show-popup'));
      if (!isOpen) wrapper.classList.add('show-popup');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.show-popup').forEach(w => w.classList.remove('show-popup'));
  });
}
