import { t } from '../../../i18n/i18n.js';

export default function SEOContentBlock({ title, description, features, faqs }) {
  let schema = null;
  if (faqs && faqs.length > 0) {
    schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
  }

  return (
    <div className="seo-content-block" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      {schema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      )}
      
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{title}</h1>
      <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>{description}</p>
      
      {features && features.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>{t('seo.features') || "Tính năng nổi bật"}</h2>
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
        <div className="seo-faq-section">
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>{t('seo.faq') || "Câu hỏi thường gặp (FAQ)"}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{faq.q}</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
