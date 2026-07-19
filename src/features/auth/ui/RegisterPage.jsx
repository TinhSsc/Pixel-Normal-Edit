import { useState } from 'react';
import GoogleButton from '../../../shared/ui/GoogleButton.jsx';
import { registerWithEmail, loginWithGoogle } from '../logic/firebase/auth-api.js';
import { setCurrentUser } from '../logic/auth-state.js';
import { setDriveToken } from '../../storage/cloud/drive-api.js';
import './AuthPages.css';

export default function RegisterPage({ onLoggedIn, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await registerWithEmail(email, password, name);
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
        <h2 data-i18n="auth.registerTitle">Đăng ký</h2>

        <div className="auth-field">
          <label data-i18n="auth.name">Họ tên</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label data-i18n="auth.email">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label data-i18n="auth.password">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          <span data-i18n="auth.registerBtn">Đăng ký</span>
        </button>

        <div className="auth-divider" data-i18n="auth.or">hoặc</div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="auth-links">
          <a onClick={() => onNavigate('login')} data-i18n="auth.alreadyHaveAccount">Đã có tài khoản? Đăng nhập</a>
        </div>
      </form>
    </div>
  );
}
