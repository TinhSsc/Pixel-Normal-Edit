import { useState, useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = ['Tính năng', 'Sản phẩm', 'Bảng giá', 'Blog', 'Liên hệ']

const TOOLS = [
  { id: 'convert',  label: 'CNV', title: 'Convert ảnh',  desc: 'Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác chỉ trong vài giây.', detail: '12 định dạng hỗ trợ', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { id: 'compress', label: 'CMP', title: 'Nén ảnh',      desc: 'Giảm 60–90% dung lượng file mà không làm giảm chất lượng hiển thị đáng kể.', detail: 'Lossy & lossless', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { id: 'resize',   label: 'RSZ', title: 'Resize ảnh',   desc: 'Thay đổi kích thước tự do, theo tỉ lệ hoặc theo preset phổ biến nhất.', detail: 'Giữ tỉ lệ khung hình', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { id: 'crop',     label: 'CRP', title: 'Crop ảnh',     desc: 'Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3 và nhiều hơn nữa.', detail: 'Preset tỉ lệ phổ biến', color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  { id: 'rotate',   label: 'ROT', title: 'Xoay / Lật',   desc: 'Xoay bất kỳ góc độ tùy chỉnh, lật ngang và dọc theo một cú click.', detail: 'Lật ngang & dọc', color: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
  { id: 'editor',   label: 'EDI', title: 'Pixel Editor',  desc: 'Chỉnh sửa nâng cao: layers, filters, masks, blend modes toàn diện.', detail: 'Full-featured editor', color: '#ec4899', glow: 'rgba(236,72,153,0.15)' },
]

const BENEFITS = [
  { icon: '🔒', title: 'Hoàn toàn riêng tư', desc: 'Mọi xử lý diễn ra ngay trên trình duyệt của bạn. Ảnh không bao giờ rời khỏi thiết bị.' },
  { icon: '⚡', title: 'Tốc độ tức thì',     desc: 'Không chờ upload server. Xử lý cục bộ bằng WebAssembly cho kết quả ngay lập tức.' },
  { icon: '🆓', title: 'Miễn phí mãi mãi',  desc: 'Các tính năng cơ bản hoàn toàn miễn phí, không giới hạn số lượng ảnh xử lý.' },
  { icon: '🌐', title: 'Đa nền tảng',        desc: 'Hoạt động trên mọi trình duyệt hiện đại, không cần cài đặt hay plugin.' },
  { icon: '🎨', title: 'Giao diện trực quan', desc: 'UI được thiết kế cho người dùng, không yêu cầu kiến thức kỹ thuật.' },
  { icon: '📦', title: 'Batch processing',   desc: 'Xử lý hàng chục ảnh cùng lúc, tiết kiệm thời gian đáng kể.' },
]

const REVIEWS = [
  { name: 'Minh Châu', role: 'Content Creator', avatar: 'MC', rating: 5, text: 'ImgTools đã thay đổi hoàn toàn workflow của mình. Không cần cài Photoshop, mọi thứ xong trong browser. Cực kỳ nhanh!', color: '#3b82f6' },
  { name: 'Tuấn Kiệt',  role: 'Lập trình viên', avatar: 'TK', rating: 5, text: 'Tính năng batch compress tuyệt vời. Tôi convert hàng trăm ảnh sang WebP mỗi ngày, tiết kiệm 80% dung lượng.', color: '#10b981' },
  { name: 'Hà Linh',    role: 'Nhiếp ảnh gia',  avatar: 'HL', rating: 5, text: 'Crop và resize siêu mượt, giữ nguyên EXIF data. Đây là tool duy nhất tôi cần cho chỉnh sửa ảnh nhanh.', color: '#8b5cf6' },
]

const POSTS = [
  { tag: 'Hướng dẫn', title: 'Tối ưu ảnh WebP: Tại sao nên chuyển đổi ngay hôm nay', date: '28 Jul 2026', read: '5 phút', img: 'photo-1777019075773-a231fa4e4534' },
  { tag: 'Mẹo hay',   title: 'Batch compress 500 ảnh trong 30 giây với ImgTools', date: '22 Jul 2026', read: '3 phút', img: 'photo-1781966995939-3748dc1f1742' },
  { tag: 'Cập nhật',  title: 'ImgTools 2.0: Pixel Editor với Layers & Blend Modes',  date: '15 Jul 2026', read: '4 phút', img: 'photo-1767126600994-e509dacc967c' },
]

const PARTNERS = ['Shopee', 'Tiki', 'Lazada', 'VnExpress', 'Kênh 14', 'Zing', 'ZaloPay', 'MoMo']

const STATS = [
  { value: '2M+',   label: 'Ảnh đã xử lý' },
  { value: '150K+', label: 'Người dùng' },
  { value: '12+',   label: 'Định dạng' },
  { value: '100%',  label: 'Riêng tư' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? '#f59e0b' : '#1e293b', fontSize: '13px' }}>★</span>
      ))}
    </div>
  )
}

function SectionLabel({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
        // {tag}
      </div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: '15px', color: '#475569', margin: 0, maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0' }} />
}

// ─── Dot Grid ─────────────────────────────────────────────────────────────────

function DotGrid({ cursor, hovering }: { cursor: { x: number; y: number }; hovering: boolean }) {
  const mask = `radial-gradient(circle at ${cursor.x}px ${cursor.y}px, #000 80px, transparent 140px)`
  const base: CSSProperties = { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,0.14) 1px, transparent 1.2px)', backgroundSize: '24px 24px', pointerEvents: 'none' }
  return (
    <>
      <div style={base} />
      <div style={{ ...base, backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,0.4) 1.8px, transparent 2px)', opacity: hovering ? 1 : 0, transition: 'opacity 0.3s ease', maskImage: mask, WebkitMaskImage: mask }} />
    </>
  )
}

// ─── Tool Card ────────────────────────────────────────────────────────────────

function ToolCard({ tool, onClick }: { tool: typeof TOOLS[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg, #0d1520 0%, ${tool.glow.replace('0.15','0.06')} 100%)` : 'rgba(13,21,32,0.7)',
        borderColor: hovered ? tool.color : 'rgba(255,255,255,0.06)',
        boxShadow: hovered ? `0 0 0 1px ${tool.color}40, 0 12px 40px ${tool.glow}` : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: tool.color, letterSpacing: '0.1em', background: `${tool.color}18`, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${tool.color}28` }}>{tool.label}</span>
        <span style={{ color: hovered ? tool.color : 'rgba(255,255,255,0.12)', fontSize: '14px', transition: 'color 0.22s' }}>→</span>
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600, color: hovered ? '#f1f5f9' : '#cbd5e1', margin: '0 0 6px', transition: 'color 0.22s' }}>{tool.title}</h3>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.6 }}>{tool.desc}</p>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: 'auto' }}>{tool.detail}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: tool.color, opacity: hovered ? 1 : 0, borderRadius: '3px 0 0 3px', transition: 'opacity 0.22s' }} />
    </button>
  )
}

// ─── Sub-pages ────────────────────────────────────────────────────────────────

function ToolPage({ id, onBack }: { id: string; onBack: () => void }) {
  const tool = TOOLS.find(t => t.id === id)
  return (
    <div style={{ background: '#080c14', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      {tool && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: tool.color, letterSpacing: '0.15em', background: `${tool.color}18`, padding: '6px 14px', borderRadius: '6px', border: `1px solid ${tool.color}30` }}>{tool.label} MODULE</div>}
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{tool?.title ?? id}</h2>
      <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Module đang được phát triển</p>
      <button onClick={onBack} style={{ fontFamily: 'var(--font-sans)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', marginTop: '8px', transition: 'all 0.2s' }}>← Trang chủ</button>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [route, setRoute]         = useState('home')
  const [menuOpen, setMenuOpen]   = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [hovering, setHovering]   = useState(false)
  const [cursor, setCursor]       = useState({ x: 0, y: 0 })
  const [contactForm, setContact] = useState({ name: '', email: '', msg: '' })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  if (route !== 'home') return <ToolPage id={route} onBack={() => setRoute('home')} />

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const NAV_TARGETS: Record<string, string> = {
    'Tính năng': 'features', 'Sản phẩm': 'products', 'Bảng giá': 'benefits',
    'Blog': 'blog', 'Liên hệ': 'contact',
  }

  return (
    <div style={{ background: '#080c14', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        background: scrolled ? 'rgba(8,12,20,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: '64px', gap: '32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#f8fafc', letterSpacing: '-0.02em' }}>ImgTools</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 7px', borderRadius: '4px' }}>v2.0</span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {NAV_LINKS.map(link => (
              <button key={link} onClick={() => scrollTo(NAV_TARGETS[link])}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
              >{link}</button>
            ))}
          </nav>

          {/* Auth buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 18px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
            >Đăng nhập</button>
            <button style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-sans)', boxShadow: '0 0 20px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >Đăng ký</button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: '64px' }}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovering(false)}
      >
        <DotGrid cursor={cursor} hovering={hovering} />
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', height: '1px', background: '#3b82f6', display: 'inline-block' }} />
              Công cụ xử lý ảnh số 1
            </div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 20px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
              Xử lý ảnh<br />
              <span style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                nhanh & riêng tư.
              </span>
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.7, margin: '0 0 36px', maxWidth: '420px' }}>
              Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '36px' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-sans)', boxShadow: '0 4px 24px rgba(99,102,241,0.35)', transition: 'all 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(99,102,241,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)' }}
              >Dùng miễn phí →</button>
              <button onClick={() => setRoute('editor')}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-sans)', transition: 'all 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#f1f5f9' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
              >Pixel Editor</button>
            </div>
          </div>

          {/* Right – hero image */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle at 60% 40%, rgba(99,102,241,0.15) 0%, transparent 60%)', borderRadius: '24px', pointerEvents: 'none' }} />
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <img
                src="https://images.unsplash.com/photo-1777019075773-a231fa4e4534?w=700&h=480&fit=crop&auto=format"
                alt="Màn hình chỉnh sửa ảnh chuyên nghiệp"
                style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block', background: '#0d1520' }}
              />
              {/* Floating badge */}
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#94a3b8' }}>2,048,391 ảnh đã xử lý hôm nay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.35 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', letterSpacing: '0.1em' }}>SCROLL</div>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #3b82f6, transparent)' }} />
        </div>
      </section>

      <Divider />

      {/* ── INTRO ──────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>// Về ImgTools</div>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, color: '#f8fafc', margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Công cụ xử lý ảnh<br />
              <span style={{ color: '#3b82f6' }}>dành cho thế hệ mới.</span>
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.75, margin: '0 0 16px' }}>
              ImgTools được xây dựng với triết lý đơn giản: mọi xử lý ảnh cơ bản đến nâng cao đều phải diễn ra ngay trên thiết bị của bạn, không phụ thuộc vào máy chủ bên ngoài.
            </p>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.75, margin: '0 0 28px' }}>
              Được tin dùng bởi hơn 150,000 content creator, nhà thiết kế và lập trình viên Việt Nam, ImgTools giúp tiết kiệm hàng giờ công việc mỗi tuần.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[{ v: '150K+', l: 'Người dùng' }, { v: '4.9★', l: 'Đánh giá' }, { v: '2026', l: 'Thành lập' }].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{s.v}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&h=420&fit=crop&auto=format" alt="Đội ngũ phát triển ImgTools" style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block', background: '#0d1520' }} />
            </div>
            <div style={{ position: 'absolute', top: '-16px', right: '-16px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>100%</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Riêng tư & an toàn</div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── PRODUCTS ───────────────────────────────────────────────── */}
      <section id="products" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel tag="Sản phẩm" title="Bộ công cụ toàn diện" sub="Từ chuyển đổi định dạng đến chỉnh sửa nâng cao — tất cả trong một nền tảng duy nhất." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {TOOLS.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={() => setRoute(tool.id)} />
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── BENEFITS ───────────────────────────────────────────────── */}
      <section id="benefits" style={{ padding: '96px 24px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel tag="Lợi ích" title="Tại sao chọn ImgTools?" sub="Không chỉ là một công cụ xử lý ảnh — đây là trải nghiệm được thiết kế cho người dùng hiện đại." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '28px', transition: 'all 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{b.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>{b.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.65 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── REVIEWS ────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel tag="Đánh giá" title="Người dùng nói gì?" sub="Hơn 150,000 người đã tin tưởng sử dụng ImgTools trong công việc hàng ngày." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <StarRating n={r.rating} />
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, margin: 0, flex: 1 }}>"{r.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `${r.color}22`, border: `1px solid ${r.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: r.color, flexShrink: 0 }}>{r.avatar}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{r.name}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── BLOG ───────────────────────────────────────────────────── */}
      <section id="blog" style={{ padding: '96px 24px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel tag="Blog" title="Tin tức & hướng dẫn" sub="Cập nhật tính năng mới, mẹo tối ưu ảnh và kiến thức kỹ thuật từ đội ngũ ImgTools." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {POSTS.map((p, i) => (
              <article key={i} style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ height: '180px', overflow: 'hidden', background: '#0d1520' }}>
                  <img src={`https://images.unsplash.com/${p.img}?w=500&h=240&fit=crop&auto=format`} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{p.tag}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#334155' }}>{p.read} đọc</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 10px', lineHeight: 1.5 }}>{p.title}</h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#334155' }}>{p.date}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── PARTNERS ───────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#334155', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '40px' }}>
            Được tin dùng bởi các doanh nghiệp hàng đầu
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {PARTNERS.map(p => (
              <div key={p} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#334155', letterSpacing: '0.05em', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#94a3b8'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = '#334155'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
              >{p}</div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── CONTACT ────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel tag="Liên hệ" title="Kết nối với chúng tôi" sub="Có câu hỏi hoặc muốn hợp tác? Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Form */}
            <div style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '36px' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 24px' }}>Gửi tin nhắn</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Họ và tên', key: 'name', type: 'text', placeholder: 'Nguyễn Văn A' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#475569', marginBottom: '6px', letterSpacing: '0.08em' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(contactForm as any)[f.key]} onChange={e => setContact(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#475569', marginBottom: '6px', letterSpacing: '0.08em' }}>Nội dung</label>
                  <textarea rows={4} placeholder="Nội dung tin nhắn của bạn..." value={contactForm.msg} onChange={e => setContact(prev => ({ ...prev, msg: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', resize: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  />
                </div>
                <button onClick={() => alert('Đã gửi! Chúng tôi sẽ phản hồi sớm.')}
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', color: '#fff', padding: '13px', borderRadius: '11px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-sans)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', transition: 'all 0.2s', marginTop: '4px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)' }}
                >Gửi tin nhắn →</button>
              </div>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: '📧', label: 'Email', value: 'hello@imgtools.vn', sub: 'Phản hồi trong 24 giờ' },
                { icon: '📞', label: 'Điện thoại', value: '0901 234 567', sub: 'Thứ 2 – Thứ 6, 9:00–18:00' },
                { icon: '📍', label: 'Địa chỉ', value: '123 Nguyễn Huệ, Q.1', sub: 'TP. Hồ Chí Minh, Việt Nam' },
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#475569', letterSpacing: '0.08em', marginBottom: '4px' }}>{c.label.toUpperCase()}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{c.value}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{c.sub}</div>
                  </div>
                </div>
              ))}

              {/* Map placeholder */}
              <div style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', height: '160px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,0.06) 1px, transparent 1.2px)', backgroundSize: '16px 16px' }} />
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📍</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#334155' }}>123 Nguyễn Huệ, Q.1, HCM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>ImgTools</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '240px' }}>
                Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.
              </p>
              {/* Social */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['𝕏', 'f', 'in', 'yt'].map(s => (
                  <button key={s} style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-mono)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Sản phẩm', links: ['Convert ảnh', 'Nén ảnh', 'Resize ảnh', 'Crop ảnh', 'Pixel Editor'] },
              { title: 'Công ty', links: ['Về chúng tôi', 'Blog', 'Tuyển dụng', 'Báo chí'] },
              { title: 'Hỗ trợ', links: ['Tài liệu', 'FAQ', 'Liên hệ', 'Báo lỗi'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>{col.title}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {col.links.map(l => (
                    <li key={l}><button style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', transition: 'color 0.2s', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                      onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                    >{l}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1e293b' }}>
              © 2026 ImgTools. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Chính sách bảo mật', 'Điều khoản sử dụng', 'Cookie'].map(l => (
                <button key={l} style={{ background: 'none', border: 'none', color: '#1e293b', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#1e293b'}
                >{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
