// i18n.js — dictionary split into vi.js, en.js, id.js, ru.js and th.js
import vi from './vi.js';
import en from './en.js';
import id from './id.js';
import ru from './ru.js';
import th from './th.js';

export const dictionary = { vi, en, id, ru, th };

function getDefaultLang() {
  if (window.__APP_LANG_FROM_URL__) {
    return window.__APP_LANG_FROM_URL__;
  }
  
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && dictionary[pathParts[0]]) {
    return pathParts[0];
  }

  const saved = localStorage.getItem('appLang');
  if (saved && dictionary[saved]) return saved;
  return 'en';
}

let currentLang = getDefaultLang();

export function t(key, ...args) {
  let str = (dictionary[currentLang] && dictionary[currentLang][key]);
  
  if (!str) {
    // If the key is missing, check if the first argument is a fallback string
    if (args.length === 1 && typeof args[0] === 'string' && !args[0].includes('{0}')) {
      return args[0]; // Return the fallback string directly
    }
    str = key; // Otherwise fallback to the key itself
  }

  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, arg);
  });
  return str;
}

export function setLang(lang) {
  if (!dictionary[lang]) return;
  if (currentLang === lang) return;
  
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  
  // Update the URL to reflect the new language
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && dictionary[pathParts[0]]) {
    pathParts[0] = lang; // replace existing lang
  } else {
    pathParts.unshift(lang); // prepend lang
  }
  
  const newPath = '/' + pathParts.join('/');
  
  // Also preserve query string if any
  window.location.assign(newPath + window.location.search);
}
export function toggleLang() {
  const order = ['vi', 'en', 'id', 'ru', 'th'];
  const idx = order.indexOf(currentLang);
  setLang(order[(idx + 1) % order.length]);
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