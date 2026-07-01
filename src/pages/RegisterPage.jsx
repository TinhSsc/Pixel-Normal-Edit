import { useState, useCallback } from 'react';
import GoogleButton from '../components/GoogleButton.jsx';
import { findUserByEmail, saveUser } from '../js/auth/fake-db.js';
import { setCurrentUser } from '../js/auth/auth-state.js';
import './AuthPages.css';

export default function RegisterPage({ onLoggedIn, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Set once a Google account has been picked; user must then set a password to finish.
  const [googleUser, setGoogleUser] = useState(null);
  const [googlePassword, setGooglePassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (findUserByEmail(email)) {
      setError('Email này đã được đăng ký.');
      return;
    }
    const user = saveUser({ name, email, password });
    setCurrentUser(user);
    onLoggedIn(user);
  };

  const handleGoogle = useCallback((data) => {
    setGoogleUser(data);
    setError('');
  }, []);

  const handleGoogleConfirm = (e) => {
    e.preventDefault();
    const user = saveUser({ ...googleUser, password: googlePassword });
    setCurrentUser(user);
    onLoggedIn(user);
  };

  if (googleUser) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleGoogleConfirm}>
          <h2>Đặt mật khẩu</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Đăng ký bằng Gmail: <b>{googleUser.email}</b>
          </p>
          <div className="auth-field">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={googlePassword}
              onChange={(e) => setGooglePassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            Hoàn tất đăng ký
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng ký</h2>

        <div className="auth-field">
          <label>Họ tên</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label>Mật khẩu</label>
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
          Đăng ký
        </button>

        <div className="auth-divider">hoặc</div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="auth-links">
          <a onClick={() => onNavigate('login')}>Đã có tài khoản? Đăng nhập</a>
        </div>
      </form>
    </div>
  );
}
