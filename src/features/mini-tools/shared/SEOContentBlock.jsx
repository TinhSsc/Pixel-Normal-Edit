import { t } from '../../../i18n/i18n.js';

export default function SEOContentBlock({ title, description, features, faqs }) {
  return (
    <div className="seo-content-block" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>{title}</h2>
      <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>{description}</p>
      
      {features && features.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('seo.features') || "Tính năng nổi bật"}</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)' }}>
            {features.map((feat, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{feat.title}:</strong> {feat.desc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('seo.faq') || "Câu hỏi thường gặp (FAQ)"}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, index) => (
              <div key={index}>
                <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{faq.q}</h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
