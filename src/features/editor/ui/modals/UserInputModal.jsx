import React, { useState, useEffect } from 'react';
import { t } from '../../../../i18n/i18n.js';
import { Icon, ICONS } from '../../../../shared/ui/icons';

const UserInputModal = () => {
  const [request, setRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
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
      setTimeLeft(60);
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
      responseText += ' (Auto-submitted by system due to 15s timeout)';
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
    <div className="modal-overlay">
      <div className="modal-content user-input-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <Icon name={ICONS.HELP} style={{ width: 20, height: 20, marginRight: 8 }} />
            {t('userInput.title', request.type)}
          </h3>
        </div>
        
        <div className="modal-body user-input-body">
          <p className="user-input-description">
            {t('userInput.desc')}
          </p>

          {request.type === 'CANVAS_SIZE' && (
            <div className="user-input-size-row">
              <div className="user-input-field-group">
                <label className="user-input-label">{t('userInput.width')}</label>
                <input 
                  type="number" 
                  value={formData.width || ''} 
                  onChange={(e) => setFormData({...formData, width: e.target.value})}
                  className="user-input-field" 
                  placeholder="512"
                />
              </div>
              <div className="user-input-field-group">
                <label className="user-input-label">{t('userInput.height')}</label>
                <input 
                  type="number" 
                  value={formData.height || ''} 
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="user-input-field" 
                  placeholder="512"
                />
              </div>
            </div>
          )}

          {(request.type === 'APPROVE_PLAN' || request.type === 'REVIEW_RESULT') && (
            <div className="user-input-approval-row">
              <button 
                onClick={() => setFormData({...formData, approval: 'APPROVE'})}
                className={`user-input-approve-btn ${formData.approval === 'APPROVE' ? 'active' : ''}`}
              >
                <Icon name={ICONS.CLOUD_CHECK} style={{ width: 16, height: 16 }} />
                {t('userInput.approve')}
              </button>
              <button 
                onClick={() => setFormData({...formData, approval: 'REJECT'})}
                className={`user-input-reject-btn ${formData.approval === 'REJECT' ? 'active' : ''}`}
              >
                <Icon name={ICONS.X} style={{ width: 16, height: 16 }} />
                {t('userInput.reject')}
              </button>
            </div>
          )}

          {/* Progress Bar for Timeout */}
          <div className="user-input-timer">
            <div className="user-input-timer-header">
              <span>{t('userInput.autoSubmitIn')}</span>
              <span className="user-input-timer-count">{timeLeft}s</span>
            </div>
            <div className="user-input-progress-track">
              <div 
                className="user-input-progress-bar"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="modal-footer user-input-footer">
          <button className="btn" onClick={handleCancel}>{t('userInput.cancel')}</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)}>{t('userInput.submit')}</button>
        </div>
      </div>
    </div>
  );
};

export default UserInputModal;