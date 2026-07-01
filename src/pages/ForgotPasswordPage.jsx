import { useState } from 'react';
import { findUserByEmail, saveUser } from '../js/auth/fake-db.js';
import './AuthPages.css';

export default function ForgotPasswordPage({ onNavigate }) {
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleCheckEmail = (e) => {
    e.preventDefault();
    if (!findUserByEmail(email)) {
      setError('Không tìm thấy tài khoản với email này.');
      return;
    }
    setError('');
    setStep('reset');
  };

  const handleReset = (e) => {
    e.preventDefault();
    saveUser({ email, password: newPassword });
    setStep('done');
  };

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={step === 'email' ? handleCheckEmail : handleReset}
      >
        <h2>Quên mật khẩu</h2>

        {step === 'email' && (
          <div className="auth-field">
            <label>Nhập email tài khoản</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        )}

        {step === 'reset' && (
          <div className="auth-field">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        )}

        {step === 'done' && (
          <p className="auth-success">Đã đặt lại mật khẩu. Bạn có thể đăng nhập ngay.</p>
        )}

        {error && <p className="auth-error">{error}</p>}

        {step !== 'done' && (
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            {step === 'email' ? 'Tiếp tục' : 'Đặt lại mật khẩu'}
          </button>
        )}

        <div className="auth-links">
          <a onClick={() => onNavigate('login')}>Quay lại đăng nhập</a>
        </div>
      </form>
    </div>
  );
}
