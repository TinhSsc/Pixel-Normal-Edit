/**
 * Trang chủ - Marketing Landing Page (Full)
 * Giao diện tối giản, tone #0B0F16
 *
 * Refactored per refactor-report.md:
 * - Lucide icons thay thế emoji/text icons
 * - useEffect + reloadLucideIcons() để auto-render icons
 * - ICONS constant từ shared/ui/icons/icons.js
 * - t() cho i18n với fallback
 * - CSS classes cho hover effects thay vì inline event handlers
 * - Animation classes từ animation-manager.css
 */

import { useEffect } from 'react';
import SEOHeader from '../shared/SEOHeader';
import { t } from '../../../i18n/i18n.js';
import { reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import { ICONS } from '../../../shared/ui/icons/icons.js';

const TOOLS = [
  {
    id: 'convert',
    icon: ICONS.ARROW_LEFT_RIGHT,
    titleKey: 'home.tool.convert',
    title: 'Convert ảnh',
    descKey: 'home.tool.convertDesc',
    desc: 'Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác.',
    detailKey: 'home.tool.convertDetail',
    detail: '12 định dạng hỗ trợ',
    color: '#3b82f6'
  },
  {
    id: 'compress',
    icon: ICONS.FILE_ARCHIVE,
    titleKey: 'home.tool.compress',
    title: 'Nén ảnh',
    descKey: 'home.tool.compressDesc',
    desc: 'Giảm 60–90% dung lượng file mà không giảm chất lượng đáng kể.',
    detailKey: 'home.tool.compressDetail',
    detail: 'Lossy & lossless',
    color: '#10b981'
  },
  {
    id: 'resize',
    icon: ICONS.MAXIMIZE,
    titleKey: 'home.tool.resize',
    title: 'Resize ảnh',
    descKey: 'home.tool.resizeDesc',
    desc: 'Thay đổi kích thước tự do, theo tỉ lệ hoặc preset phổ biến.',
    detailKey: 'home.tool.resizeDetail',
    detail: 'Giữ tỉ lệ khung hình',
    color: '#f59e0b'
  },
  {
    id: 'crop',
    icon: ICONS.CROP,
    titleKey: 'home.tool.crop',
    title: 'Crop ảnh',
    descKey: 'home.tool.cropDesc',
    desc: 'Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3...',
    detailKey: 'home.tool.cropDetail',
    detail: 'Preset tỉ lệ phổ biến',
    color: '#8b5cf6'
  },
  {
    id: 'rotate',
    icon: ICONS.ROTATE_CW,
    titleKey: 'home.tool.rotate',
    title: 'Xoay / Lật',
    descKey: 'home.tool.rotateDesc',
    desc: 'Xoay góc tùy chỉnh, lật ngang và dọc theo một cú click.',
    detailKey: 'home.tool.rotateDetail',
    detail: 'Lật ngang & dọc',
    color: '#ef4444'
  },
  {
    id: '',
    icon: ICONS.PEN_TOOL,
    titleKey: 'home.tool.editor',
    title: 'Pixel Editor',
    descKey: 'home.tool.editorDesc',
    desc: 'Chỉnh sửa nâng cao: layers, filters, masks, blend modes.',
    detailKey: 'home.tool.editorDetail',
    detail: 'Full-featured editor',
    color: '#ec4899'
  },
];

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
    icon: ICONS.GIFT,
    titleKey: 'home.benefit.free',
    title: 'Miễn phí mãi mãi',
    descKey: 'home.benefit.freeDesc',
    desc: 'Các tính năng cơ bản hoàn toàn miễn phí, không giới hạn số lượng ảnh.'
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
  { key: 'home.footer.contact', label: 'Liên hệ' },
  { key: 'home.footer.report', label: 'Báo lỗi' },
];

const FOOTER_LEGAL = [
  { key: 'home.footer.privacy', label: 'Chính sách bảo mật' },
  { key: 'home.footer.terms', label: 'Điều khoản sử dụng' },
  { key: 'home.footer.cookie', label: 'Cookie' },
];

function SectionTitle({ labelKey, label, titleKey, title, subtitleKey, subtitle }) {
  return (
    <div className="anim-fade-in" style={{ marginBottom: '48px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
        // {t(labelKey, label)}
      </div>
      <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#F5F7FA', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
        {t(titleKey, title)}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>
          {t(subtitleKey, subtitle)}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  useEffect(() => {
    reloadLucideIcons();
  }, []);

  const navigate = (path) => {
    if (path === '') window.location.href = '/';
    else window.location.href = `/?tool=${path}`;
  };

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader title="Công cụ xử lý ảnh số 1 | Pixel Normal Edit" description="Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí." />

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11, 15, 22, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: '#3b82f6' }}>.</span></h1>
          <nav style={{ display: 'flex', gap: '24px' }}>
            {NAV_ITEMS.map(item => (
              <a key={item.key} href={item.href} className="home-nav-link" style={{ color: '#B8C0CC', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>{t(item.key, item.label)}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => window.location.href = '/#login'} className="interact-btn" style={{ background: '#F5F7FA', color: '#0B0F16', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            {t('home.nav.login', 'Đăng nhập')}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>

        {/* ── Hero Section ─────────────────────────────────── */}
        <section className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '60px', marginBottom: '120px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
              {t('home.hero.badge', 'Pixel Normal Edit')}
            </div>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#F5F7FA', margin: '0 0 24px 0', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {t('home.hero.title', 'Công cụ xử lý ảnh nhanh & riêng tư.')}
            </h1>
            <p style={{ fontSize: '18px', color: '#B8C0CC', lineHeight: 1.6, margin: '0 0 40px 0', maxWidth: '90%' }}>
              {t('home.hero.desc', 'Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn.')}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => navigate('')} className="interact-btn" style={{ background: '#161B22', color: '#F5F7FA', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>
                {t('home.hero.cta.editor', 'Pixel Editor')}
              </button>
            </div>
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ width: '100%', height: '400px', background: '#161B22', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', position: 'relative' }}>
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <div style={{ fontSize: '12px', color: '#8B949E', marginLeft: '16px', fontFamily: 'monospace' }}>{t('home.hero.mockupLabel', 'Màn hình chỉnh sửa ảnh chuyên nghiệp')}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #0B0F16 25%, #161B22 25%, #161B22 50%, #0B0F16 50%, #0B0F16 75%, #161B22 75%, #161B22 100%)', backgroundSize: '20px 20px', opacity: 0.5 }}>
                <div className="anim-pulse" style={{ background: '#0B0F16', padding: '16px 32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F7FA', fontSize: '14px', fontWeight: 600 }}>{t('home.hero.stats', '2,048,391 ảnh đã xử lý hôm nay')}</div>
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
              <button key={tool.title} onClick={() => navigate(tool.id)} className="home-tool-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '32px', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: tool.color, background: `color-mix(in srgb, ${tool.color} 15%, transparent)`, padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i data-lucide={tool.icon} width="24" height="24" style={{ color: tool.color }}></i>
                  </div>
                  <div style={{ color: '#8B949E' }}>
                    <i data-lucide={ICONS.ARROW_RIGHT} width="18" height="18"></i>
                  </div>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F7FA', margin: '0 0 12px 0' }}>{t(tool.titleKey, tool.title)}</h3>
                <p style={{ fontSize: '14px', color: '#8B949E', margin: '0 0 24px 0', lineHeight: 1.6, flex: 1 }}>{t(tool.descKey, tool.desc)}</p>
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
                <div style={{ marginBottom: '16px', color: '#3b82f6' }}>
                  <i data-lucide={b.icon} width="32" height="32"></i>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F5F7FA', margin: '0 0 12px 0' }}>{t(b.titleKey, b.title)}</h3>
                <p style={{ fontSize: '15px', color: '#8B949E', margin: 0, lineHeight: 1.6 }}>{t(b.descKey, b.desc)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact Section ──────────────────────────────── */}
        <section id="contact" className="anim-fade-in" style={{ marginBottom: '120px', display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <SectionTitle
              labelKey="home.contact.label"
              label="Liên hệ"
              titleKey="home.contact.title"
              title="Kết nối với chúng tôi"
              subtitleKey="home.contact.subtitle"
              subtitle="Có câu hỏi hoặc muốn hợp tác? Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#8B949E', marginBottom: '8px', fontWeight: 600 }}>{t('home.contact.name', 'Họ và tên')}</div>
                <input type="text" placeholder={t('home.contact.namePlaceholder', 'Nguyễn Văn A')} style={{ width: '100%', padding: '16px', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F7FA', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#8B949E', marginBottom: '8px', fontWeight: 600 }}>{t('home.contact.email', 'Email')}</div>
                <input type="email" placeholder={t('home.contact.emailPlaceholder', 'email@example.com')} style={{ width: '100%', padding: '16px', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F7FA', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#8B949E', marginBottom: '8px', fontWeight: 600 }}>{t('home.contact.message', 'Nội dung')}</div>
                <textarea placeholder={t('home.contact.messagePlaceholder', 'Nội dung tin nhắn của bạn...')} style={{ width: '100%', padding: '16px', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F7FA', outline: 'none', height: '120px', resize: 'vertical' }} />
              </div>
              <button className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '16px', marginTop: '8px' }}>
                {t('home.contact.send', 'Gửi tin nhắn →')}
              </button>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '100px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontSize: '24px', color: '#3b82f6' }}>
                <i data-lucide={ICONS.MAIL} width="24" height="24"></i>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('home.contact.emailLabel', 'EMAIL')}</div>
                <div style={{ fontSize: '16px', color: '#F5F7FA', fontWeight: 500 }}>{t('home.contact.emailValue', 'hello@imgtools.vn')}</div>
                <div style={{ fontSize: '13px', color: '#8B949E', marginTop: '4px' }}>{t('home.contact.emailDesc', 'Phản hồi trong 24 giờ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontSize: '24px', color: '#3b82f6' }}>
                <i data-lucide={ICONS.PHONE} width="24" height="24"></i>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('home.contact.phoneLabel', 'ĐIỆN THOẠI')}</div>
                <div style={{ fontSize: '16px', color: '#F5F7FA', fontWeight: 500 }}>{t('home.contact.phoneValue', '0901 234 567')}</div>
                <div style={{ fontSize: '13px', color: '#8B949E', marginTop: '4px' }}>{t('home.contact.phoneDesc', 'Thứ 2 – Thứ 6, 9:00–18:00')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontSize: '24px', color: '#3b82f6' }}>
                <i data-lucide={ICONS.MAP_PIN} width="24" height="24"></i>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('home.contact.addressLabel', 'ĐỊA CHỈ')}</div>
                <div style={{ fontSize: '16px', color: '#F5F7FA', fontWeight: 500, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t('home.contact.addressValue', '123 Nguyễn Huệ, Q.1<br />TP. Hồ Chí Minh, Việt Nam') }} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#161B22', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '80px' }}>
          <div style={{ flex: '2 1 300px' }}>
            <h2 style={{ color: '#F5F7FA', fontSize: '24px', margin: '0 0 16px 0', fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: '#3b82f6' }}>.</span></h2>
            <p style={{ color: '#8B949E', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '300px' }}>
              {t('home.footer.desc', 'Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.')}
            </p>
            <div style={{ display: 'flex', gap: '16px', color: '#B8C0CC', fontSize: '20px' }}>
              <span style={{ cursor: 'pointer' }}>
                <i data-lucide={ICONS.TWITTER} width="20" height="20"></i>
              </span>
              <span style={{ cursor: 'pointer', fontWeight: 700 }}>f</span>
              <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>in</span>
              <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>yt</span>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#F5F7FA', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.products', 'Sản phẩm')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_PRODUCTS.map(l => (
                <a key={l.key} href="#" className="home-nav-link" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#F5F7FA', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.company', 'Công ty')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_COMPANY.map(l => (
                <a key={l.key} href="#" className="home-nav-link" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#F5F7FA', fontSize: '14px', fontWeight: 600, margin: '0 0 24px 0' }}>{t('home.footer.support', 'Hỗ trợ')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FOOTER_SUPPORT.map(l => (
                <a key={l.key} href="#" className="home-nav-link" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ color: '#8B949E', fontSize: '14px' }}>{t('home.footer.copyright', '© 2026 Pixel Normal Edit. All rights reserved.')}</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {FOOTER_LEGAL.map(l => (
              <a key={l.key} href="#" className="home-nav-link" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '14px' }}>{t(l.key, l.label)}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}