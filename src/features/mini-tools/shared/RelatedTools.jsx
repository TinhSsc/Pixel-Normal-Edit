import { useEffect } from 'react';
import { t } from '../../../i18n/i18n.js';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import { TOOLS } from '../../../shared/config/tools-registry.js';

export default function RelatedTools({ currentTool }) {
  useEffect(() => {
    reloadLucideIcons();
  }, [currentTool]);

  const tools = TOOLS
    .filter(tt => tt.id !== '' && tt.id !== currentTool)
    .map(tt => ({
      id: tt.id,
      icon: tt.icon,
      title: t(tt.titleKey, tt.title),
      desc: t(tt.descKey, tt.desc),
      color: tt.color
    }));

  return (
    <div className="related-tools anim-fade-in" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
          // {t('mini_tools.related.label', 'Khám phá')}
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
          {t('mini_tools.related.title', 'Các công cụ khác có thể bạn quan tâm')}
        </h2>
      </div>
      <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {tools.map(tool => (
          <a
            key={tool.id}
            href={`/${tool.id}`}
            className="home-tool-card"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: '24px',
              backgroundColor: '#161B22',
              borderRadius: '20px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#F5F7FA',
              transition: 'all 0.2s',
              minHeight: '160px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: tool.color, background: `color-mix(in srgb, ${tool.color} 15%, transparent)`, padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i data-lucide={tool.icon} width="20" height="20" style={{ color: tool.color }}></i>
              </div>
              <div style={{ color: '#8B949E' }}>
                <i data-lucide={ICONS.ARROW_RIGHT} width="16" height="16"></i>
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>{tool.title}</h3>
            <p style={{ fontSize: '14px', color: '#8B949E', margin: '0', lineHeight: 1.5 }}>{tool.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
