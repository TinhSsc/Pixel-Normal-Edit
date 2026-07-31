/**
 * Trang chủ - Marketing Landing Page (Full)
 * Giao diện tối giản, tone var(--home-bg)
 *
 * Refactored per refactor-report.md:
 * - Lucide icons thay thế emoji/text icons
 * - useEffect + reloadLucideIcons() để auto-render icons
 * - ICONS constant từ shared/ui/icons/icons.js
 * - t() cho i18n với fallback
 * - CSS classes cho hover effects thay vì inline event handlers
 * - Animation classes từ animation-manager.css
 */

import { useEffect, useState } from 'react';
import SEOHeader from '../shared/SEOHeader';
import { t, getCurrentLang, toggleLang } from '../../../i18n/i18n.js';
import { reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import { ICONS } from '../../../shared/ui/icons/icons.js';
import { TOOLS } from '../../../shared/config/tools-registry.js';
import { getCurrentUser } from '../../auth/logic/auth-state.js';
import { auth } from '../../auth/logic/firebase/config.js';

const THEMES = ['dark', 'light', 'custom'];

const HOME_THEME_VARS = {
  '--home-bg': 'var(--color-bg)',
  '--home-surface': 'var(--color-surface)',
  '--home-surface-alt': 'var(--color-surface-alt)',
  '--home-text': 'var(--color-text-bright)',
  '--home-muted': 'var(--color-text-muted)',
  '--home-primary': 'var(--color-primary)',
  '--home-border': 'var(--color-border)',
  '--home-nav-bg': 'var(--color-nav-bg)',
  '--home-primary-tint': 'var(--color-primary-tint)',
};

const BENEFITS = [
  {
    icon: ICONS.LOCK,
    titleKey: 'home.benefit.privacy',
    title: 'Hoàn toàn riêng tư',
    descKey: 'home.benefit.privacyDesc',
    desc: 'Mọi xử lý diễn ra ngay trên trình duyệt của bạn. Ảnh không bao giờ rời khỏi thiết bị.'
  },
  {
    icon: ICONS.ZAP,
    titleKey: 'home.benefit.speed',
    title: 'Tốc độ tức thì',
    descKey: 'home.benefit.speedDesc',
    desc: 'Không chờ upload server. Xử lý cục bộ cho kết quả ngay lập tức.'
  },

  {
    icon: ICONS.GLOBE,
    titleKey: 'home.benefit.cross',
    title: 'Đa nền tảng',
    descKey: 'home.benefit.crossDesc',
    desc: 'Hoạt động trên mọi trình duyệt hiện đại, không cần cài đặt hay plugin.'
  },
  {
    icon: ICONS.PALETTE,
    titleKey: 'home.benefit.ui',
    title: 'Giao diện trực quan',
    descKey: 'home.benefit.uiDesc',
    desc: 'UI được thiết kế cho người dùng, không yêu cầu kiến thức kỹ thuật.'
  },
  {
    icon: ICONS.LAYERS,
    titleKey: 'home.benefit.batch',
    title: 'Batch processing',
    descKey: 'home.benefit.batchDesc',
    desc: 'Xử lý hàng chục ảnh cùng lúc, tiết kiệm thời gian đáng kể.'
  },
  {
    icon: ICONS.BOT,
    titleKey: 'home.benefit.ai',
    title: 'AI Integration (MCP)',
    descKey: 'home.benefit.aiDesc',
    desc: 'Kết nối AI agents (Claude, Cursor, Windsurf) qua giao thức MCP để AI vẽ trực tiếp lên canvas theo thời gian thực.'
  }
];

const NAV_ITEMS = [
  { key: 'home.nav.features', label: 'Tính năng', href: '#features' },
  { key: 'home.nav.products', label: 'Sản phẩm', href: '#products' },
  { key: 'home.nav.contact', label: 'Liên hệ', href: '#contact' },
];

const FOOTER_PRODUCTS = [
  { key: 'home.tool.convert', label: 'Convert ảnh' },
  { key: 'home.tool.compress', label: 'Nén ảnh' },
  { key: 'home.tool.resize', label: 'Resize ảnh' },
  { key: 'home.tool.crop', label: 'Crop ảnh' },
  { key: 'home.tool.editor', label: 'Pixel Editor' },
];

const FOOTER_COMPANY = [
  { key: 'home.footer.about', label: 'Về chúng tôi' },
  { key: 'home.footer.blog', label: 'Blog' },
  { key: 'home.footer.careers', label: 'Tuyển dụng' },
  { key: 'home.footer.press', label: 'Báo chí' },
];

const FOOTER_SUPPORT = [
  { key: 'home.footer.docs', label: 'Tài liệu' },
  { key: 'home.footer.faq', label: 'FAQ' },
  { key: 'home.footer.contact', label: 'Liên hệ', href: '#contact' },
  { key: 'home.footer.report', label: 'Báo lỗi (Google Form)', href: 'https://docs.google.com/forms/d/e/1FAIpQLSecC96xAtinjLk7LxLdBoI-o_8PmvrTQdGsb8KUrWLSPRF6Zw/viewform?usp=publish-editor' },
  { key: 'home.footer.github', label: 'GitHub Issues', href: 'https://github.com/TinhSsc/Pixel-Normal-Edit/issues' },
];

const FOOTER_LEGAL = [
  { key: 'home.footer.privacy', label: 'Chính sách bảo mật' },
  { key: 'home.footer.terms', label: 'Điều khoản sử dụng' },
  { key: 'home.footer.cookie', label: 'Cookie' },
];

function SectionTitle({ labelKey, label, titleKey, title, subtitleKey, subtitle }) {
  return (
    <div className="anim-fade-in" style={{ marginBottom: '48px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--home-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
        // {t(labelKey, label)}
      </div>
      <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--home-text)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
        {t(titleKey, title)}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '16px', color: 'var(--home-muted)', lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>
          {t(subtitleKey, subtitle)}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState(getCurrentLang());
  const [theme, setTheme] = useState(localStorage.getItem('pixel-edit-theme') || 'dark');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const handleLangChange = () => {
      setLang(getCurrentLang());
      reloadLucideIcons();
    };
    window.addEventListener('languagechange', handleLangChange);
    
    // Auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          name: user.displayName || user.email?.split('@')[0] || 'User',
          picture: user.photoURL,
          email: user.email
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      window.removeEventListener('languagechange', handleLangChange);
      unsubscribe();
    };
  }, []);


  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pixel-edit-theme', next);
  };

  const toggleLanguage = () => {
    toggleLang();
    setLang(getCurrentLang());
  };

  const homeStyle = {
    ...HOME_THEME_VARS,
    background: 'var(--home-bg)',
    minHeight: '100vh',
    display: 'block',
    overflowY: 'auto',
    color: 'var(--home-text)',
    fontFamily: 'Inter, sans-serif'
  };

  const navigate = (path) => {
    if (path === '') window.location.href = '/';
    else window.location.href = `/?tool=${path}`;
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    // Simulate sending (client-side only, actually this is a static site)
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 3000);
  };

  return (
    <div style={homeStyle}>
      <style>{`
        @media (max-width: 768px) {
          .home-desktop-nav { display: none !important; }
          .home-header { padding: 0 16px !important; }
          .home-header h1 { font-size: 16px !important; }
          .home-main { padding: 40px 16px !important; }
          .home-hero-title { font-size: 32px !important; }
        }
      `}</style>
      <SEOHeader
        title={t('seo.home.title', 'Công cụ xử lý ảnh số 1 | Pixel Normal Edit')}
        description={t('seo.home.desc', 'Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.')}
        schema={{
          "@type": "WebSite",
          "name": "Pixel Normal Edit",
          "url": "https://pixel-normal-edit.web.app/?tool=home",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://pixel-normal-edit.web.app/?tool=home",
            "query-input": "required name=search_term_string"
          },
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": TOOLS.filter(tool => tool.id).map((tool, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": t(tool.titleKey, tool.title),
              "url": `https://pixel-normal-edit.web.app/?tool=${tool.id}`
            }))
          }
        }}
      />

      {/* ── Header ─────────────────────────────────── */}
      <header className="home-header" style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--home-nav-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--home-border)', padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ color: 'var(--home-text)', fontSize: '20px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/avatar.svg" alt="Pixel Normal Edit" width="32" height="32" style={{ borderRadius: '50%', border: '2px solid var(--home-border)', background: 'var(--home-surface)' }} />
            <span>Pixel Normal Edit<span style={{ color: 'var(--home-primary)' }}>.</span></span>
          </h1>
          <nav className="home-desktop-nav" style={{ display: 'flex', gap: '24px' }}>
            {NAV_ITEMS.map(item => (
              <a key={item.key} href={item.href} className="home-nav-link" style={{ color: 'var(--home-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>{t(item.key, item.label)}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={cycleTheme} title={t('theme.title') || 'Giao diện'} className="interact-btn" style={{ background: 'var(--home-surface)', color: 'var(--home-text)', border: '1px solid var(--home-border)', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i data-lucide={theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'palette'} width="16" height="16" style={{ color: 'var(--home-primary)' }}></i>
          </button>
          <button onClick={toggleLanguage} title={t('settings.language') || 'Ngôn ngữ'} className="interact-btn" style={{ background: 'var(--home-surface)', color: 'var(--home-text)', border: '1px solid var(--home-border)', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i data-lucide="languages" width="16" height="16" style={{ color: 'var(--home-primary)' }}></i>
            <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
          </button>
          {currentUser ? (
            <div onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--home-surface)', padding: '4px 12px 4px 4px', borderRadius: '20px', border: '1px solid var(--home-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--home-surface-alt)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--home-surface)'}>
              {currentUser.picture ? (
                <img src={currentUser.picture} alt="Avatar" width="28" height="28" style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--home-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--home-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{currentUser.name}</span>
            </div>
          ) : (
            <button onClick={() => window.location.href = '/#login'} className="interact-btn" style={{ background: 'var(--home-text)', color: 'var(--home-bg)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              {t('home.nav.login', 'Đăng nhập')}
            </button>
          )}
        </div>
      </header>

      <main className="home-main" style={{ maxWidth: '1600px', margin: '0 auto', padding: '80px 24px' }}>

        {/* ── Hero Section ─────────────────────────────────── */}
        <section className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '60px', marginBottom: '120px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--home-primary-tint)', color: 'var(--home-primary)', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
              {t('home.hero.badge', 'Pixel Normal Edit')}
            </div>
            <h1 className="home-hero-title" style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: 'var(--home-text)', margin: '0 0 24px 0', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {t('home.hero.title', 'Công cụ xử lý ảnh nhanh & riêng tư.')}
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--home-muted)', lineHeight: 1.6, margin: '0 0 40px 0', maxWidth: '90%' }}>
              {t('home.hero.desc', 'Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn.')}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => navigate('')} className="interact-btn" style={{ background: 'var(--home-surface)', color: 'var(--home-text)', border: '1px solid var(--home-border)', padding: '16px 32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>
                {t('home.hero.cta.editor', 'Pixel Editor')}
              </button>
            </div>
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ width: '100%', height: '400px', background: 'var(--home-surface)', borderRadius: '20px', border: '1px solid var(--home-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', position: 'relative' }}>
              <div style={{ flex: 1, display: 'flex', background: 'var(--home-bg)', position: 'relative', overflow: 'hidden' }}>
                {/* ── Left Toolbar ── */}
                <div style={{ width: '48px', borderRight: '1px solid var(--home-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '12px', background: 'var(--home-surface)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--home-primary)', opacity: 0.8 }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--home-muted)', opacity: 0.2 }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--home-muted)', opacity: 0.2 }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--home-muted)', opacity: 0.2 }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--home-muted)', opacity: 0.2 }} />
                </div>
                
                {/* ── Center Canvas ── */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-conic-gradient(var(--home-surface) 0% 25%, transparent 0% 50%) 50% / 16px 16px', padding: '24px' }}>
                  <div style={{ width: '100%', height: '100%', maxWidth: '280px', maxHeight: '200px', background: '#ffffff', border: '1px solid var(--home-border)', borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10%', left: '20%', width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(45deg, #ef4444, #f59e0b)', filter: 'blur(8px)', opacity: 0.9 }} />
                    <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '140px', height: '100px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', filter: 'blur(6px)', opacity: 0.8 }} />
                    
                    {/* Bounding Box / Transform Controls */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1.5px dashed var(--home-primary)', width: '160px', height: '160px' }}>
                      <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--home-primary)', borderRadius: '2px' }} />
                      <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--home-primary)', borderRadius: '2px' }} />
                      <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--home-primary)', borderRadius: '2px' }} />
                      <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--home-primary)', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>

                {/* ── Right Panels (Layers/Props) ── */}
                <div style={{ width: '120px', borderLeft: '1px solid var(--home-border)', display: 'flex', flexDirection: 'column', background: 'var(--home-surface)', padding: '12px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ width: '40%', height: '6px', background: 'var(--home-muted)', borderRadius: '4px', opacity: 0.4, marginBottom: '12px' }} />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '50%', height: '24px', background: 'var(--home-surface-alt)', border: '1px solid var(--home-border)', borderRadius: '4px' }} />
                      <div style={{ width: '50%', height: '24px', background: 'var(--home-surface-alt)', border: '1px solid var(--home-border)', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '60%', height: '6px', background: 'var(--home-muted)', borderRadius: '4px', opacity: 0.4, marginBottom: '12px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'var(--home-primary-tint)', borderRadius: '4px', border: '1px solid var(--home-primary)', marginBottom: '8px' }}>
                      <div style={{ width: '16px', height: '16px', background: 'var(--home-primary)', borderRadius: '2px', opacity: 0.8 }} />
                      <div style={{ flex: 1, height: '4px', background: 'var(--home-primary)', borderRadius: '2px', opacity: 0.8 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', marginBottom: '8px', border: '1px solid transparent' }}>
                      <div style={{ width: '16px', height: '16px', background: 'var(--home-muted)', borderRadius: '2px', opacity: 0.2 }} />
                      <div style={{ flex: 1, height: '4px', background: 'var(--home-muted)', borderRadius: '2px', opacity: 0.2 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', border: '1px solid transparent' }}>
                      <div style={{ width: '16px', height: '16px', background: 'var(--home-muted)', borderRadius: '2px', opacity: 0.2 }} />
                      <div style={{ flex: 1, height: '4px', background: 'var(--home-muted)', borderRadius: '2px', opacity: 0.2 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Products Section ──────────────────────────────── */}
        <section id="products" className="anim-fade-in" style={{ marginBottom: '120px' }}>
          <SectionTitle
            labelKey="home.products.label"
            label="Sản phẩm"
            titleKey="home.products.title"
            title="Bộ công cụ toàn diện"
            subtitleKey="home.products.subtitle"
            subtitle="Từ chuyển đổi định dạng đến chỉnh sửa nâng cao — tất cả trong một nền tảng duy nhất."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {TOOLS.map(tool => (
              <button key={tool.title} onClick={() => navigate(tool.id)} className="home-tool-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '32px', background: 'var(--home-surface)', border: '1px solid var(--home-border)', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: tool.color, background: `color-mix(in srgb, ${tool.color} 15%, transparent)`, padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i data-lucide={tool.icon} width="24" height="24" style={{ color: tool.color }}></i>
                  </div>
                  <div style={{ color: 'var(--home-muted)' }}>
                    <i data-lucide={ICONS.ARROW_RIGHT} width="18" height="18"></i>
                  </div>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--home-text)', margin: '0 0 12px 0' }}>{t(tool.titleKey, tool.title)}</h3>
                <p style={{ fontSize: '14px', color: 'var(--home-muted)', margin: '0 0 24px 0', lineHeight: 1.6, flex: 1 }}>{t(tool.descKey, tool.desc)}</p>
                <div style={{ fontSize: '13px', fontWeight: 600, color: tool.color }}>{t(tool.detailKey, tool.detail)}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Benefits Section ──────────────────────────────── */}
        <section id="features" className="anim-fade-in" style={{ marginBottom: '120px' }}>
          <SectionTitle
            labelKey="home.benefits.label"
            label="Lợi ích"
            titleKey="home.benefits.title"
            title="Tại sao chọn ImgTools?"
            subtitleKey="home.benefits.subtitle"
            subtitle="Không chỉ là một công cụ xử lý ảnh — đây là trải nghiệm được thiết kế cho người dùng hiện đại."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
            {BENEFITS.map(b => (
              <div key={b.title}>
                <div style={{ marginBottom: '16px', color: 'var(--home-primary)' }}>
                  <i data-lucide={b.icon} width="32" height="32"></i>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--home-text)', margin: '0 0 12px 0' }}>{t(b.titleKey, b.title)}</h3>
                <p style={{ fontSize: '15px', color: 'var(--home-muted)', margin: 0, lineHeight: 1.6 }}>{t(b.descKey, b.desc)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="anim-fade-in" style={{ marginBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--home-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
              // {t('home.contact.label', 'Liên hệ')}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--home-text)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
              {t('home.contact.title', 'Kết nối với chúng tôi')}
            </h2>
          </div>
          <div style={{ width: '100%', maxWidth: '640px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <i data-lucide="bug" width="32" height="32"></i>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--home-text)', marginBottom: '8px' }}>{t('home.bug.title', 'Phát hiện lỗi?')}</div>
                <div style={{ fontSize: '15px', color: '#ef4444', fontWeight: 600 }}>{t('home.bug.subtitle', 'Giúp chúng tôi cải thiện sản phẩm')}</div>
              </div>
              <p style={{ fontSize: '16px', color: 'var(--home-muted)', margin: '0 0 8px 0', lineHeight: 1.6, maxWidth: '480px' }}>
                {t('home.bug.desc', 'Nếu bạn gặp sự cố khi sử dụng công cụ, vui lòng báo cáo lỗi để đội ngũ kỹ thuật có thể xử lý sớm nhất.')}
              </p>
              <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSecC96xAtinjLk7LxLdBoI-o_8PmvrTQdGsb8KUrWLSPRF6Zw/viewform?usp=publish-editor" target="_blank" rel="noreferrer" className="interact-btn" style={{ background: 'var(--home-primary)', color: '#fff', padding: '16px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minWidth: '220px' }}>
                  <i data-lucide="file-text" width="20" height="20"></i> {t('home.bug.report', 'Gửi form báo lỗi')}
                </a>
                <a href="https://github.com/TinhSsc/Pixel-Normal-Edit/issues" target="_blank" rel="noreferrer" className="interact-btn" style={{ background: 'var(--home-surface)', color: 'var(--home-text)', border: '1px solid var(--home-border)', padding: '16px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minWidth: '220px' }}>
                  <i data-lucide="github" width="20" height="20"></i> {t('home.bug.github', 'Tạo Issue trên GitHub')}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Support (Ko-fi) Section ──────────────────────── */}
        <section id="support" className="anim-fade-in" style={{ marginBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--home-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
              // {t('home.support.title', 'Ủng hộ dự án')}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--home-text)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
              {t('home.support.title', 'Ủng hộ dự án')}
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--home-muted)', lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>
              {t('home.support.desc', 'Nếu bạn thấy công cụ hữu ích, hãy ủng hộ một ly cà phê để chúng tôi tiếp tục phát triển các tính năng mới.')}
            </p>
          </div>
          <div style={{ width: '100%', maxWidth: '420px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <a href="https://ko-fi.com/de7ad9ff-aedc-4e88-800f-87f5c8c92e70" target="_blank" rel="noreferrer" style={{ background: '#3b82f6', color: '#fff', padding: '16px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(59,130,246,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi" width="24" height="24" />
              <span>Support me on Ko-fi</span>
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--home-border)', background: 'var(--home-surface)', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '80px' }}>
          <div style={{ flex: '2 1 300px' }}>
            <h2 style={{ color: 'var(--home-text)', fontSize: '24px', margin: '0 0 16px 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/avatar.svg" alt="Pixel Normal Edit" width="40" height="40" style={{ borderRadius: '50%', border: '2px solid var(--home-border)', background: 'var(--home-surface)' }} />
              <span>Pixel Normal Edit<span style={{ color: 'var(--home-primary)' }}>.</span></span>
            </h2>
            <p style={{ color: 'var(--home-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '300px' }}>
              {t('home.footer.desc', 'Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.')}
            </p>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--home-muted)', fontSize: '20px' }}>
              <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>X</span>
              <span style={{ cursor: 'pointer', fontWeight: 700 }}>f</span>
              <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>in</span>
              <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>yt</span>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--home-text)', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.products', 'Sản phẩm')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_PRODUCTS.map(l => (
                <a key={l.key} href="#" className="home-nav-link" style={{ color: 'var(--home-muted)', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--home-text)', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.company', 'Công ty')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_COMPANY.map(l => (
                <a key={l.key} href="#" className="home-nav-link" style={{ color: 'var(--home-muted)', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--home-text)', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.support', 'Hỗ trợ')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_SUPPORT.map(l => (
                <a key={l.key} href={l.href || '#'} target={l.href?.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="home-nav-link" style={{ color: 'var(--home-muted)', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1600px', margin: '0 auto', borderTop: '1px solid var(--home-border)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ color: 'var(--home-muted)', fontSize: '14px' }}>{t('home.footer.copyright', '© 2026 Pixel Normal Edit. All rights reserved.')}</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {FOOTER_LEGAL.map(l => (
              <a key={l.key} href="#" className="home-nav-link" style={{ color: 'var(--home-muted)', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}