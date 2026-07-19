import { Icon, ICONS } from './icons';

export default function GoogleButton({ onCredential }) {
  return (
    <button 
      type="button" 
      className="btn" 
      onClick={onCredential} 
      style={{ 
        width: '100%', 
        justifyContent: 'center', 
        padding: '10px', 
        fontSize: '14px', 
        gap: '8px',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        color: 'var(--text-primary)'
      }}
    >
      <Icon name={ICONS.CHROME} style={{ width: '18px', height: '18px' }} />
      <span data-i18n="auth.google">Tiếp tục với Google</span>
    </button>
  );
}

