import React from 'react';
import { t } from '../../../i18n/i18n.js';

export default function SocialSharePanel({ url = window.location.href, text = "Tôi vừa xử lý ảnh cực nhanh trên Pixel Normal Edit! #pixelart #tools" }) {
  const shareTwitter = () => {
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const shareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div style={{ 
      marginTop: '16px', 
      padding: '16px', 
      background: 'var(--bg-secondary)', 
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '500' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        <span>{t('seo.sharePrompt') || "Chia sẻ công cụ này nếu bạn thấy hữu ích!"}</span>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={shareTwitter}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '6px',
            background: '#000', color: '#fff', border: 'none',
            cursor: 'pointer', fontWeight: '500', fontSize: '14px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z"></path></svg> Twitter (X)
        </button>
        <button 
          onClick={shareFacebook}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '6px',
            background: '#1877F2', color: '#fff', border: 'none',
            cursor: 'pointer', fontWeight: '500', fontSize: '14px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> Facebook
        </button>
      </div>
    </div>
  );
}
