import { useState, useCallback } from 'react';
import GoogleButton from '../components/GoogleButton.jsx';
import { findUserByEmail, saveUser } from '../js/auth/fake-db.js';
import { setCurrentUser } from '../js/auth/auth-state.js';
import './AuthPages.css';

export default function LoginPage({ onLoggedIn, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      setError('Email hoặc mật khẩu không đúng.');
      return;
    }
    setCurrentUser(user);
    onLoggedIn(user);
  };

  const handleGoogle = useCallback((googleUser) => {
    const user = saveUser(googleUser);
    setCurrentUser(user);
    onLoggedIn(user);
  }, [onLoggedIn]);

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>

        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label>Mật khẩu</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          Đăng nhập
        </button>

        <div className="auth-divider">hoặc</div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="auth-links">
          <a onClick={() => onNavigate('forgot-password')}>Quên mật khẩu?</a>
          <a onClick={() => onNavigate('register')}>Tạo tài khoản</a>
        </div>
      </form>
    </div>
  );
}
