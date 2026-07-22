// i18n.js — dictionary split into vi.js and en.js
import vi from './vi.js';
import en from './en.js';

export const dictionary = { vi, en };

function getDefaultLang() {
  const saved = localStorage.getItem('appLang');
  if (saved) return saved;
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang && browserLang.toLowerCase().startsWith('vi')) return 'vi';
  return 'en';
}

let currentLang = getDefaultLang();

export function t(key, ...args) {
  let str = (dictionary[currentLang] && dictionary[currentLang][key]) || key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, arg);
  });
  return str;
}

export function setLang(lang) {
  if (!dictionary[lang]) return;
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  updateDOM();
}

export function toggleLang() {
  setLang(currentLang === 'vi' ? 'en' : 'vi');
}

export function getCurrentLang() {
  return currentLang;
}

export function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);

    // <input type="color"> — set title for tooltip
    if (el.tagName === 'INPUT' && el.type === 'color') {
      el.setAttribute('title', value);
      return;
    }

    // <input type="button"> — set value
    if (el.tagName === 'INPUT' && el.type === 'button') {
      el.value = value;
      return;
    }

    // <textarea> — set placeholder
    if (el.tagName === 'TEXTAREA') {
      el.setAttribute('placeholder', value);
      return;
    }

    // <option> — set textContent directly
    if (el.tagName === 'OPTION') {
      el.textContent = value;
      return;
    }

    // tooltip.* / tool.* / transform.* — set data-tooltip attribute
    if (
      key.startsWith('tooltip.') ||
      key.startsWith('tool.') ||
      key.startsWith('transform.')
    ) {
      el.setAttribute('data-tooltip', value);
    }

    // All other elements: update text nodes only (preserves child icons)
    let updated = false;
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        node.textContent = value;
        updated = true;
      }
    });

    if (!updated && el.childNodes.length === 0) {
      el.textContent = value;
    }
  });

  // Re-render toggleToolsBtn with correct icon + text
  const toggleToolsBtn = document.getElementById('toggleToolsBtn');
  if (toggleToolsBtn) {
    const isHidden = document.querySelector('.editor-layout')?.classList.contains('tools-hidden');
    const iconStr = isHidden ? 'menu' : 'eye-off';
    const txtKey = isHidden ? 'text.showTools' : 'text.hideTools';
    toggleToolsBtn.innerHTML = `<i data-lucide="${iconStr}" style="width:18px;height:18px;"></i> ${t(txtKey)}`;
  }

  if (window.lucide) window.lucide.createIcons();
}