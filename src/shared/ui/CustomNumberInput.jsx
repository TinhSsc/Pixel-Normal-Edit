import React, { useState, useEffect, useId, useRef } from 'react';
import { Icon, ICONS } from './icons';

export const CustomNumberInput = ({
  id,
  min = 1,
  max = 100,
  defaultValue = 1,
  value,
  onChange,
  className = '',
  style = {}
}) => {
  const generatedId = useId();
  const inputId = id || `custom-number-${generatedId}`;
  
  const [internalValue, setInternalValue] = useState(
    value !== undefined ? value : defaultValue
  );
  
  const [displayValue, setDisplayValue] = useState(
    value !== undefined ? value : defaultValue
  );
  
  const currentValue = value !== undefined ? value : internalValue;
  
  // Update internal value if controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
      setDisplayValue(value);
    }
  }, [value]);

  const handleChange = (newVal) => {
    // clamp value
    const num = Math.min(Math.max(Number(newVal), min), max);
    
    if (value === undefined) {
      setInternalValue(num);
    }
    
    setDisplayValue(num);
    
    if (onChange) {
      onChange({ target: { value: num } });
    }

    // Dispatch native events for Vanilla JS compat
    setTimeout(() => {
      const hiddenInput = document.getElementById(inputId);
      if (hiddenInput) {
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 0);
  };

  const handleIncrement = () => handleChange(currentValue + 1);
  const handleDecrement = () => handleChange(currentValue - 1);

  // Sync programmatic value changes (Vanilla JS)
  useEffect(() => {
    const hiddenInput = document.getElementById(inputId);
    if (!hiddenInput) return;
    
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!originalDescriptor) return;

    Object.defineProperty(hiddenInput, 'value', {
      get: function() {
        return originalDescriptor.get.call(this);
      },
      set: function(val) {
        originalDescriptor.set.call(this, val);
        setInternalValue(Number(val));
      },
      configurable: true
    });
  }, [inputId]);

  // Handle continuous increment/decrement on hold
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  const startAction = (actionFn) => {
    actionFn();
    timeoutRef.current = setTimeout(() => {
      timerRef.current = setInterval(actionFn, 50);
    }, 300);
  };

  const stopAction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timeoutRef.current = null;
    timerRef.current = null;
  };

  return (
    <div className={`custom-number-input ${className}`} style={style}>
      {/* Hidden input for DOM sync */}
      <input
        type="hidden"
        id={inputId}
        value={currentValue}
        onChange={() => {}}
      />
      
      <input 
        className="cni-display" 
        type="text"
        value={displayValue}
        onChange={(e) => {
          const val = e.target.value;
          // Chỉ cho phép nhập số hoặc chuỗi rỗng
          if (val === '' || /^-?\d*$/.test(val)) {
             setDisplayValue(val);
          }
        }}
        onBlur={(e) => {
          let val = Number(e.target.value);
          if (isNaN(val) || e.target.value === '') val = min;
          handleChange(val);
          setDisplayValue(Math.min(Math.max(val, min), max));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            let val = Number(e.target.value);
            if (isNaN(val) || e.target.value === '') val = min;
            handleChange(val);
            setDisplayValue(Math.min(Math.max(val, min), max));
            e.target.blur();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const nextVal = Number(currentValue) + 1;
            handleChange(nextVal);
            setDisplayValue(Math.min(Math.max(nextVal, min), max));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const prevVal = Number(currentValue) - 1;
            handleChange(prevVal);
            setDisplayValue(Math.min(Math.max(prevVal, min), max));
          }
        }}
      />

      <div className="cni-controls">
        <button 
          className="cni-btn cni-inc"
          type="button"
          onMouseDown={() => startAction(handleIncrement)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => { e.preventDefault(); startAction(handleIncrement); }}
          onTouchEnd={(e) => { e.preventDefault(); stopAction(); }}
          disabled={currentValue >= max}
        >
          <Icon name={ICONS.CHEVRON_UP} style={{ width: '12px', height: '12px' }} />
        </button>
        <button 
          className="cni-btn cni-dec"
          type="button"
          onMouseDown={() => startAction(handleDecrement)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => { e.preventDefault(); startAction(handleDecrement); }}
          onTouchEnd={(e) => { e.preventDefault(); stopAction(); }}
          disabled={currentValue <= min}
        >
          <Icon name={ICONS.CHEVRON_DOWN} style={{ width: '12px', height: '12px' }} />
        </button>
      </div>
    </div>
  );
};
