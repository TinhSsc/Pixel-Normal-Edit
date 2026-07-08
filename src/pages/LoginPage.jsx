import { useState } from 'react';
import GoogleButton from '../components/GoogleButton.jsx';
import { loginWithEmail, loginWithGoogle } from '../js/firebase/auth-api.js';
import { setCurrentUser } from '../js/auth/auth-state.js';
import { setDriveToken } from '../js/services/drive-api.js';
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
        <h2 data-i18n="auth.title">Đăng nhập</h2>

        <div className="auth-field">
          <label data-i18n="auth.email">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label data-i18n="auth.password">Mật khẩu</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          <span data-i18n="auth.loginBtn">Đăng nhập</span>
        </button>

        <div className="auth-divider" data-i18n="auth.or">hoặc</div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="auth-links">
          <a onClick={() => onNavigate('forgot-password')} data-i18n="auth.forgotPassword">Quên mật khẩu?</a>
          <a onClick={() => onNavigate('register')} data-i18n="auth.createAccount">Tạo tài khoản</a>
        </div>
      </form>
    </div>
  );
}
