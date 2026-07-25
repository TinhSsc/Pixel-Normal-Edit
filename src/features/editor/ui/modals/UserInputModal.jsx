import React, { useState, useEffect } from 'react';
import { t } from '../../../../i18n/i18n.js';
import { Icon, ICONS } from '../../../../shared/ui/icons';

const UserInputModal = () => {
  const [request, setRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const handleRequest = (e) => {
      const { reqId, type, fields, resolve } = e.detail;
      
      // Initialize default values based on type
      let defaultData = {};
      if (type === 'CANVAS_SIZE') {
        defaultData = { width: 512, height: 512 };
      } else if (type === 'APPROVE_PLAN' || type === 'REVIEW_RESULT') {
        defaultData = { approval: 'APPROVE' };
      }
      
      setRequest({ reqId, type, fields, resolve });
      setFormData(defaultData);
      setTimeLeft(30);
    };

    window.addEventListener('SHOW_USER_INPUT_REQUEST', handleRequest);
    return () => window.removeEventListener('SHOW_USER_INPUT_REQUEST', handleRequest);
  }, []);

  useEffect(() => {
    if (!request) return;

    if (timeLeft <= 0) {
      // Auto-submit on timeout
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [request, timeLeft]);

  const handleSubmit = (isAuto = false) => {
    if (!request) return;
    
    // Build final response string based on type
    let responseText = '';
    if (request.type === 'CANVAS_SIZE') {
      responseText = `Width: ${formData.width}, Height: ${formData.height}`;
    } else if (request.type === 'APPROVE_PLAN' || request.type === 'REVIEW_RESULT') {
      responseText = formData.approval;
    } else {
      responseText = JSON.stringify(formData);
    }
    
    if (isAuto) {
      responseText += ' (Auto-submitted by system due to 30s timeout)';
    }

    request.resolve(responseText);
    setRequest(null);
  };

  const handleCancel = () => {
    if (!request) return;
    request.resolve('User rejected/cancelled the request.');
    setRequest(null);
  };

  if (!request) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 99999 }}>
      <div className="modal" style={{ width: '400px', maxWidth: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Icon name={ICONS.HELP} style={{ width: 20, height: 20, marginRight: 8 }} />
            AI Needs Input ({request.type})
          </h3>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            The AI assistant is waiting for your input to proceed.
          </p>

          {request.type === 'CANVAS_SIZE' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Width</label>
                <input 
                  type="number" 
                  value={formData.width || ''} 
                  onChange={(e) => setFormData({...formData, width: e.target.value})}
                  className="input-field" 
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Height</label>
                <input 
                  type="number" 
                  value={formData.height || ''} 
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="input-field" 
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {(request.type === 'APPROVE_PLAN' || request.type === 'REVIEW_RESULT') && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setFormData({...formData, approval: 'APPROVE'})}
                style={{ 
                  flex: 1, padding: '10px', 
                  backgroundColor: formData.approval === 'APPROVE' ? 'var(--success)' : 'var(--bg-secondary)',
                  color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Approve
              </button>
              <button 
                onClick={() => setFormData({...formData, approval: 'REJECT'})}
                style={{ 
                  flex: 1, padding: '10px', 
                  backgroundColor: formData.approval === 'REJECT' ? '#d32f2f' : 'var(--bg-secondary)',
                  color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </div>
          )}

          {/* Progress Bar for Timeout */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>
              <span>Auto-submitting in:</span>
              <span>{timeLeft}s</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary, #1976d2)', 
                width: `${(timeLeft / 30) * 100}%`,
                transition: 'width 1s linear'
              }}></div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default UserInputModal;
