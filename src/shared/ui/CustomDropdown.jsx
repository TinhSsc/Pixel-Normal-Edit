import React, { useId, useRef, useEffect, useState } from 'react';
import { Icon, ICONS } from './icons';
import { t } from '../../i18n/i18n.js';


/**
 * Custom Dropdown Component using CSS tricks for animations
 * Replaces native <select> elements across the app.
 *
 * @param {Array} options - Array of { value: string|number, label: string }
 * @param {string|number} value - Currently selected value
 * @param {function} onChange - Callback (e) => void where e.target.value is the selected value
 * @param {string} id - Optional ID, if not provided a unique ID is generated
 * @param {object} style - Optional styles for the container
 */
export const CustomDropdown = ({ options = [], value, onChange, id, style, defaultValue }) => {
  const generatedId = useId();
  const dropdownId = id || `custom-dropdown-${generatedId}`;
  
  const [internalValue, setInternalValue] = useState(defaultValue || (options[0] ? options[0].value : ''));
  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => opt.value === currentValue) || options[0];
  
  const containerRef = useRef(null);
  const checkboxRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (checkboxRef.current) checkboxRef.current.checked = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    if (onChange) {
      onChange({ target: { value: val } });
    }
    
    // Dispatch a native change event for Vanilla JS compatibility
    setTimeout(() => {
      const hiddenInput = document.getElementById(dropdownId);
      if (hiddenInput) {
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 0);

    if (checkboxRef.current) checkboxRef.current.checked = false;
  };

  // Add an effect to listen for programmatic value changes on the hidden input
  useEffect(() => {
    const hiddenInput = document.getElementById(dropdownId);
    if (!hiddenInput) return;
    
    // We override the value setter to catch programmatic changes
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!originalDescriptor) return;

    Object.defineProperty(hiddenInput, 'value', {
      get: function() {
        return originalDescriptor.get.call(this);
      },
      set: function(val) {
        originalDescriptor.set.call(this, val);
        setInternalValue(val); // Sync React state with DOM change
      },
      configurable: true
    });
  }, [dropdownId]);

  return (
    <div className="custom-css-dropdown" style={style} ref={containerRef}>
      {/* Hidden input holds the actual value for document.getElementById(id).value */}
      <input 
        type="hidden" 
        id={dropdownId} 
        value={currentValue || ''} 
        onChange={() => {}} 
      />
      
      {/* Checkbox for CSS dropdown logic */}
      <input
        hidden
        className="sr-only"
        name={`toggle-${dropdownId}`}
        id={`toggle-${dropdownId}`}
        type="checkbox"
        ref={checkboxRef}
      />
      <label htmlFor={`toggle-${dropdownId}`} className="dropdown-trigger">
        <span className="trigger-text">
          {selectedOption ? selectedOption.label : (t('dropdown.select') || 'Select...')}
        </span>
        <span className="trigger-icon">
          <Icon name={ICONS.CHEVRON_DOWN} />
        </span>
      </label>

      <ul className="dropdown-list" role="list" dir="auto">
        {options.map((opt) => (
          <li 
            key={opt.value} 
            className={`dropdown-listitem ${opt.value === value ? 'selected' : ''}`} 
            role="listitem"
            onClick={() => handleSelect(opt.value)}
          >
            <div className="dropdown-article">{opt.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
