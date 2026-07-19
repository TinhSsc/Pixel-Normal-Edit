import { useState } from 'react';
import { resetPassword } from '../logic/firebase/auth-api.js';
import './AuthPages.css';

export default function ForgotPasswordPage({ onNavigate }) {
  const [step, setStep] = useState('email'); // 'email' | 'done'
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={handleReset}
      >
        <h2 data-i18n="auth.forgotTitle">Quên mật khẩu</h2>

        {step === 'email' && (
          <>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }} data-i18n="auth.forgotDesc">
              Nhập email tài khoản của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.
            </p>
            <div className="auth-field">
              <label data-i18n="auth.email">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </>
        )}

        {step === 'done' && (
          <p className="auth-success" data-i18n="auth.forgotSuccess">Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.</p>
        )}

        {error && <p className="auth-error">{error}</p>}

        {step !== 'done' && (
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={loading}>
            <span data-i18n={loading ? "auth.sending" : "auth.sendLink"}>
              {loading ? 'Đang gửi...' : 'Gửi liên kết'}
            </span>
          </button>
        )}

        <div className="auth-links">
          <a onClick={() => onNavigate('login')} data-i18n="auth.backToLogin">Quay lại đăng nhập</a>
        </div>
      </form>
    </div>
  );
}
