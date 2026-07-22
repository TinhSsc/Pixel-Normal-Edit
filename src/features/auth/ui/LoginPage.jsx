import { useState } from 'react';
import GoogleButton from '../../../shared/ui/GoogleButton.jsx';
import { loginWithEmail, loginWithGoogle } from '../logic/firebase/auth-api.js';
import { setCurrentUser } from '../logic/auth-state.js';
import { setDriveToken } from '../../storage/cloud/drive-api.js';
import { t } from '../../../i18n/i18n.js';
import './AuthPages.css';

export default function LoginPage({ onLoggedIn, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      // user is returned from Firebase, handled automatically by auth state listener in App,
      // but we can call onLoggedIn directly to transition the UI fast.
      setCurrentUser(user);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const { user, driveToken } = await loginWithGoogle();
      if (driveToken) {
        setDriveToken(driveToken);
      }
      setCurrentUser(user);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{t('auth.loginTitle') || "Đăng nhập"}</h2>

        <div className="auth-field">
          <label>{t('auth.emailLabel') || "Email"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label>{t('auth.passwordLabel') || "Mật khẩu"}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          <span>{t('auth.loginBtn') || "Đăng nhập"}</span>
        </button>

        <div className="auth-divider">{t('auth.or') || "hoặc"}</div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="auth-links">
          <a onClick={() => onNavigate('forgot-password')}>{t('auth.forgotPassword') || "Quên mật khẩu?"}</a>
          <a onClick={() => onNavigate('register')}>{t('auth.createAccount') || "Tạo tài khoản"}</a>
        </div>
      </form>
    </div>
  );
}
