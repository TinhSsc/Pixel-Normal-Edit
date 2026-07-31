/**
 * Xử lý lỗi cho mini-tools
 * - Hiển thị thông báo lỗi thân thiện
 * - Cho phép thử lại
 */
import { Component, useState, useEffect } from 'react';

/**
 * React class ErrorBoundary wrapper
 */
class ErrorBoundaryWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Functional ErrorBoundary with fallback UI
 * Usage: <ErrorBoundary><SomePage /></ErrorBoundary>
 */
export default function ErrorBoundary({ children, fallback }) {
  const [error, setError] = useState(null);

  // Reset error when children change
  useEffect(() => {
    setError(null);
  }, [children]);

  if (error) {
    return fallback ? (
      fallback(error, () => setError(null))
    ) : (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Có lỗi xảy ra</h3>
        <p className="error-message">{error.message}</p>
        <button className="btn" onClick={() => setError(null)}>Thử lại</button>
      </div>
    );
  }

  return (
    <ErrorBoundaryWrapper onError={setError}>
      {children}
    </ErrorBoundaryWrapper>
  );
}