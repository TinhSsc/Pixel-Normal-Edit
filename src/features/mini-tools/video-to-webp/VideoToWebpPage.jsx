/**
 * VideoToWebp Page — Chuyển Video → WebP / GIF, tự fit dung lượng mục tiêu.
 * NGUYÊN TẮC: giữ nguyên toàn bộ video (KHÔNG cắt). Chỉ giảm quality,
 * giảm kích thước, giảm fps hoặc tua nhanh nhẹ để vừa target.
 * Mỗi file xử lý độc lập. So sánh GIF vs WebP và gợi ý phương án tối ưu.
 */
import { useState, useRef, useEffect } from 'react';
import SEOHeader from '../shared/SEOHeader';
import RelatedTools from '../shared/RelatedTools';
import { t } from '../../../i18n/i18n.js';
import { LucideIcon, reloadLucideIcons } from '../../../shared/dom/lucide-utils';
import { navigate } from '../../../shared/lib/file-utils.js';
import { CanvasHelper } from '../shared/CanvasHelper';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { loadEngine, isEngineLoaded, cancelEngine } from './ffmpeg-client.js';
import { probeVideo, autofitFile, previewPlan, formatBytes } from './autofit-engine.js';
import { DEFAULT_CONFIG, listPresets, getDefaultPreset, savePreset, deletePreset, setDefaultPreset } from './preset-store.js';

const ACCENT = '#ec4899';
const yieldToMain = () => new Promise((r) => setTimeout(r, 0));

let jobSeq = 0;

export default function VideoToWebpPage() {
  const [config, setConfig] = useState(() => {
    const def = getDefaultPreset();
    return def ? { ...DEFAULT_CONFIG, ...def.config } : { ...DEFAULT_CONFIG };
  });
  const [jobs, setJobs] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [engine, setEngine] = useState('idle'); // idle | loading | ready | error
  const [engineMsg, setEngineMsg] = useState('');
  const [error, setError] = useState(null);

  const [presets, setPresets] = useState(() => listPresets());
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState(() => getDefaultPreset()?.id || '');
  const [autoConvert, setAutoConvert] = useState(() => {
    try { return localStorage.getItem('v2w_autoconvert') !== '0'; } catch (_) { return true; }
  });

  const fileInputRef = useRef(null);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  const attemptsMapRef = useRef({});
  const jobsRef = useRef([]);
  const configRef = useRef(config);
  const autoConvertRef = useRef(autoConvert);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => {
    autoConvertRef.current = autoConvert;
    try { localStorage.setItem('v2w_autoconvert', autoConvert ? '1' : '0'); } catch (_) { /* ignore */ }
  }, [autoConvert]);

  useEffect(() => { reloadLucideIcons(); }, []);
  useEffect(() => { reloadLucideIcons(); }, [jobs, engine, processing]);

  // Preload engine khi mở trang để bấm convert là chạy ngay
  useEffect(() => {
    let alive = true;
    setEngine('loading');
    setEngineMsg(t('v2w.engine.loading', 'Đang tải bộ mã hóa (lần đầu ~30MB, chỉ 1 lần)...'));
    loadEngine()
      .then(() => {
        if (!alive) return;
        setEngine('ready');
        setEngineMsg(t('v2w.engine.ready', 'Bộ mã hóa sẵn sàng. Xử lý 100% trên máy bạn.'));
      })
      .catch(() => {
        if (!alive) return;
        setEngine('error');
        setEngineMsg(t('v2w.engine.error', 'Không tải được bộ mã hóa. Kiểm tra mạng rồi bấm "Tải lại".'));
      });
    return () => { alive = false; };
  }, []);

  const retryEngine = () => {
    setEngine('loading');
    setEngineMsg(t('v2w.engine.loading', 'Đang tải bộ mã hóa (lần đầu ~30MB, chỉ 1 lần)...'));
    loadEngine()
      .then(() => { setEngine('ready'); setEngineMsg(t('v2w.engine.ready', 'Bộ mã hóa sẵn sàng. Xử lý 100% trên máy bạn.')); })
      .catch(() => { setEngine('error'); setEngineMsg(t('v2w.engine.error', 'Không tải được bộ mã hóa. Kiểm tra mạng rồi bấm "Tải lại".')); });
  };

  const patchJob = (id, patch) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const items = Array.from(files);
    const added = [];
    for (const file of items) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
      if (!isVideo) {
        setError(t('v2w.error.onlyVideo', 'Chỉ hỗ trợ file Video (MP4, WebM, MOV). Đã bỏ qua file không hợp lệ.'));
        continue;
      }
      const id = `job${++jobSeq}`;
      const job = { id, file, name: file.name, size: file.size, status: 'probing', meta: null, error: null };
      added.push(job);
    }
    if (!added.length) return;
    setError(null);
    setJobs((prev) => [...prev, ...added]);
    // Probe metadata + vạch kế hoạch riêng cho từng video ngay khi tải lên
    for (const job of added) {
      try {
        const meta = await probeVideo(job.file);
        const plan = previewPlan(meta, configRef.current);
        const reasonKey = `v2w.reason${plan.reason[0].toUpperCase()}${plan.reason.slice(1)}`;
        const reasonText = t(reasonKey);
        const fmt = configRef.current.format;
        let planText;
        if (fmt === 'auto') {
          planText = t('v2w.plan', String((plan.starts.webp ?? 0) + 1), String(plan.total), String((plan.starts.gif ?? 0) + 1), String(plan.total), reasonText);
        } else {
          planText = t('v2w.planSingle', fmt.toUpperCase(), String((plan.starts[fmt] ?? 0) + 1), String(plan.total), reasonText);
        }
        patchJob(job.id, { meta, status: 'queued', plan: planText });
      } catch (e) {
        patchJob(job.id, { status: 'error', error: e.message });
      }
      await yieldToMain();
    }
    // Tự chạy luôn nếu bật auto (engine sẽ tự tải nếu chưa sẵn sàng)
    if (autoConvertRef.current) processAll();
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => e.preventDefault();

  const removeJob = (id) => {
    setJobs((prev) => {
      const j = prev.find((x) => x.id === id);
      if (j?.resultWebp?.url) URL.revokeObjectURL(j.resultWebp.url);
      if (j?.resultGif?.url) URL.revokeObjectURL(j.resultGif.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearDone = () => {
    setJobs((prev) => {
      prev.forEach((j) => {
        if (j.status === 'done' || j.status === 'error') {
          if (j.resultWebp?.url) URL.revokeObjectURL(j.resultWebp.url);
          if (j.resultGif?.url) URL.revokeObjectURL(j.resultGif.url);
        }
      });
      return prev.filter((j) => j.status !== 'done' && j.status !== 'error');
    });
  };

  const stopAll = async () => {
    cancelRef.current = true;
    await cancelEngine();
  };

  const ensureEngine = async () => {
    if (engine === 'ready' || isEngineLoaded()) return true;
    setEngine('loading');
    try {
      await loadEngine();
      setEngine('ready');
      return true;
    } catch (_) {
      setEngine('error');
      setError(t('v2w.engine.error', 'Không tải được bộ mã hóa. Kiểm tra mạng rồi bấm "Tải lại".'));
      return false;
    }
  };

  const runOne = async (job) => {
    const cfg = { ...configRef.current };
    const targetBytes = Math.round(cfg.targetMB * 1024 * 1024);
    patchJob(job.id, { status: 'encoding', progress: 0, attemptLabel: '', attempts: [], skipped: [], error: null });
    attemptsMapRef.current[job.id] = [];
    try {
      const onAttempt = ({ format, index, total, step, progress, done }) => {
        if (typeof done === 'number') {
          attemptsMapRef.current[job.id].push({ format, step, size: done });
          patchJob(job.id, { attempts: [...attemptsMapRef.current[job.id]] });
        } else if (typeof progress === 'number') {
          patchJob(job.id, {
            progress: Math.round(((index + progress) / total / (cfg.format === 'auto' ? 2 : 1)) * 100),
            attemptLabel: `${format.toUpperCase()} · ${t('v2w.try', 'thử')} ${index + 1}/${total} · ${step.dim}p ${step.fps}fps${step.speed > 1 ? ` ×${step.speed}` : ''}`,
          });
        } else {
          patchJob(job.id, {
            attemptLabel: `${format.toUpperCase()} · ${t('v2w.try', 'thử')} ${index + 1}/${total} · ${step.dim}p ${step.fps}fps${step.speed > 1 ? ` ×${step.speed}` : ''}`,
          });
        }
      };
      const res = await autofitFile({
          file: job.file,
          meta: job.meta,
          config: cfg,
          onAttempt,
          shouldCancel: () => cancelRef.current,
        });
        const mk = (r) => {
          const fit = r?.bestFit;
          const fb = r?.smallest;
          const chosen = fit || fb;
          if (!chosen) return null;
          return { blob: chosen.blob, url: URL.createObjectURL(chosen.blob), size: chosen.size, step: chosen.step, score: chosen.score, fits: !!fit };
        };
        const resultWebp = res.webp ? mk(res.webp) : null;
        const resultGif = res.gif ? mk(res.gif) : null;
        patchJob(job.id, {
          status: 'done',
          progress: 100,
          attemptLabel: null,
          attempts: [
            ...(res.webp?.attempts.map((a) => ({ format: 'webp', step: a.step, size: a.size })) || []),
            ...(res.gif?.attempts.map((a) => ({ format: 'gif', step: a.step, size: a.size })) || []),
          ],
          skipped: [
            ...(res.webp?.skipped ? [{ format: 'webp', count: res.webp.skipped }] : []),
            ...(res.gif?.skipped ? [{ format: 'gif', count: res.gif.skipped }] : []),
          ],
          resultWebp,
          resultGif,
          recommendation: res.recommendation,
          recoNote: res.note,
          targetBytes,
        });
      } catch (e) {
        if (e.message === 'cancelled') {
          patchJob(job.id, { status: 'queued', progress: null, attemptLabel: null });
        } else {
          patchJob(job.id, { status: 'error', error: e.message, progress: null, attemptLabel: null });
        }
      }
      await yieldToMain();
  };

  // Vòng lặp sống: cuốn cả file mới upload giữa chừng. Chỉ nhận job 'queued'.
  const processAll = async () => {
    if (runningRef.current) return;
    if (!jobsRef.current.some((j) => j.status === 'queued' && j.meta)) {
      setError(t('v2w.error.noQueued', 'Chưa có video nào sẵn sàng. Hãy tải video lên trước.'));
      return;
    }
    if (!(await ensureEngine())) return;
    runningRef.current = true;
    cancelRef.current = false;
    setProcessing(true);
    setError(null);
    try {
      for (;;) {
        if (cancelRef.current) break;
        const next = jobsRef.current.find((j) => j.status === 'queued' && j.meta);
        if (!next) break;
        await runOne(next);
      }
    } finally {
      runningRef.current = false;
      setProcessing(false);
    }
  };

  // Nút Convert tay: đưa cả file lỗi về hàng chờ rồi chạy
  const processAllManual = async () => {
    setJobs((prev) => prev.map((j) => (j.status === 'error' && j.meta ? { ...j, status: 'queued', error: null } : j)));
    await yieldToMain();
    processAll();
  };

  const downloadOne = (job, fmt) => {
    const r = fmt === 'webp' ? job.resultWebp : job.resultGif;
    if (!r) return;
    const base = job.name.replace(/\.[^.]+$/, '');
    CanvasHelper.downloadBlob(r.blob, `${base}_${config.targetMB}MB.${fmt === 'webp' ? 'webp' : 'gif'}`);
  };

  const downloadAllZip = async () => {
    const done = jobs.filter((j) => j.status === 'done' && (j.resultWebp || j.resultGif));
    if (!done.length) return;
    const zip = new JSZip();
    for (const j of done) {
      const base = j.name.replace(/\.[^.]+$/, '');
      const fmt = j.recommendation === 'gif' ? 'gif' : 'webp';
      const r = fmt === 'gif' ? j.resultGif || j.resultWebp : j.resultWebp || j.resultGif;
      if (r) zip.file(`${base}_${config.targetMB}MB.${fmt}`, r.blob);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `video_to_${config.targetMB}MB.zip`);
  };

  // — Preset handlers —
  const applyPreset = (id) => {
    setActivePresetId(id);
    const p = presets.find((x) => x.id === id);
    if (p) setConfig({ ...DEFAULT_CONFIG, ...p.config });
  };
  const handleSavePreset = () => {
    const next = savePreset(presetName || `Preset ${presets.length + 1}`, config);
    setPresets(next);
    const saved = next.find((x) => x.name === (presetName.trim() || `Preset ${presets.length + 1}`));
    if (saved) setActivePresetId(saved.id);
    setPresetName('');
  };

  const readyCount = jobs.filter((j) => j.status === 'done').length;
  const targetBytes = Math.round(config.targetMB * 1024 * 1024);

  return (
    <div style={{ background: '#0B0F16', minHeight: '100vh', display: 'block', overflowY: 'auto', color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
      <SEOHeader
        title={t('v2w.seo.title', 'Chuyển Video sang WebP/GIF đúng dung lượng | Pixel Normal Edit')}
        description={t('v2w.seo.desc', 'Upload video, chọn dung lượng tối đa (vd 2MB), tool tự canh quality/kích thước/tốc độ để vừa file, giữ nguyên toàn bộ video. So sánh WebP vs GIF và gợi ý phương án tối ưu. Xử lý 100% trên trình duyệt.')}
        schema={{ applicationCategory: 'UtilitiesApplication' }}
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,22,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('home')}>
          <h1 style={{ color: '#F5F7FA', fontSize: '20px', margin: 0, fontWeight: 700 }}>Pixel Normal Edit<span style={{ color: ACCENT }}>.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('home')} className="interact-btn" style={{ background: 'transparent', color: '#B8C0CC', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LucideIcon name="arrow-left" width="16" height="16" /> {t('home.nav.home', 'Trang chủ')}
          </button>
          <button onClick={() => window.location.href = '/'} className="interact-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Pixel Editor
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
        <div className="anim-fade-in" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(236,72,153,0.12)', color: ACCENT, borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <LucideIcon name="film" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {t('v2w.badge', 'Video → WebP / GIF theo dung lượng')}
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 14px 0', letterSpacing: '-0.02em' }}>
            {t('v2w.title', 'Video vừa khít dung lượng bạn chọn')}
          </h2>
          <p style={{ fontSize: '16px', color: '#B8C0CC', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
            {t('v2w.desc', 'Chọn dung lượng tối đa (vd 2MB) — tool tự giảm chất lượng → thu nhỏ kích thước → tua nhanh nhẹ để vừa file, giữ nguyên toàn bộ video (không cắt). Tự so sánh WebP vs GIF và gợi ý bản tối ưu.')}
          </p>
        </div>

        {/* Engine status */}
        <div style={{ background: '#161B22', border: `1px solid ${engine === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(236,72,153,0.25)'}`, borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: engine === 'error' ? '#ef4444' : '#B8C0CC' }}>
          <LucideIcon name={engine === 'ready' ? 'check-circle' : engine === 'error' ? 'alert-circle' : 'loader'} width="16" height="16" className={engine === 'loading' ? 'spin' : ''} style={{ color: engine === 'ready' ? '#10b981' : ACCENT }} />
          <span>{engineMsg}</span>
          {engine === 'error' && (
            <button onClick={retryEngine} style={{ marginLeft: 'auto', background: ACCENT, color: '#000', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
              {t('v2w.engine.retry', 'Tải lại')}
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LucideIcon name="alert-circle" width="18" height="18" /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left: global config + presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '84px' }}>
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA', marginBottom: '18px' }}>{t('v2w.settings', 'Cấu hình chung')}</div>

              {/* Target size */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('v2w.target', 'Dung lượng tối đa')}</span><span style={{ color: ACCENT }}>{config.targetMB} MB</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[1, 2, 4, 8].map((v) => (
                    <button key={v} onClick={() => setConfig((c) => ({ ...c, targetMB: v }))} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', background: config.targetMB === v ? ACCENT : '#0B0F16', color: config.targetMB === v ? '#000' : '#8B949E' }}>
                      {v}MB
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="range" min="0.5" max="20" step="0.5" value={config.targetMB} onChange={(e) => setConfig((c) => ({ ...c, targetMB: Number(e.target.value) }))} style={{ flex: 1, accentColor: ACCENT }} />
                  <input type="number" min="0.2" max="50" step="0.5" value={config.targetMB} onChange={(e) => setConfig((c) => ({ ...c, targetMB: Math.min(50, Math.max(0.2, Number(e.target.value) || 2)) }))} style={{ width: '70px', padding: '6px 8px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F7FA', fontSize: '13px' }} />
                </div>
              </div>

              {/* Format */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{t('v2w.format', 'Định dạng xuất')}</div>
                <div style={{ display: 'flex', gap: '6px', background: '#0B0F16', padding: '5px', borderRadius: '10px' }}>
                  {[{ v: 'auto', l: t('v2w.formatAuto', 'Tự động (gợi ý)') }, { v: 'webp', l: 'WebP' }, { v: 'gif', l: 'GIF' }].map((o) => (
                    <button key={o.v} onClick={() => setConfig((c) => ({ ...c, format: o.v }))} style={{ flex: 1, padding: '9px 4px', borderRadius: '7px', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', background: config.format === o.v ? ACCENT : 'transparent', color: config.format === o.v ? '#000' : '#8B949E' }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cap dim */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('v2w.maxDim', 'Kích thước tối đa')}</span><span style={{ color: ACCENT }}>{config.capDim}p</span>
                </div>
                <input type="range" min="240" max="1080" step="120" value={config.capDim} onChange={(e) => setConfig((c) => ({ ...c, capDim: Number(e.target.value) }))} style={{ width: '100%', accentColor: ACCENT }} />
              </div>

              {/* FPS */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('v2w.fps', 'FPS')}</span><span style={{ color: ACCENT }}>{config.baseFps}</span>
                </div>
                <input type="range" min="6" max="24" step="1" value={config.baseFps} onChange={(e) => setConfig((c) => ({ ...c, baseFps: Number(e.target.value) }))} style={{ width: '100%', accentColor: ACCENT }} />
              </div>

              {/* Max speed */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('v2w.maxSpeed', 'Tua nhanh tối đa')}</span><span style={{ color: ACCENT }}>×{config.maxSpeed}</span>
                </div>
                <input type="range" min="1" max="2" step="0.25" value={config.maxSpeed} onChange={(e) => setConfig((c) => ({ ...c, maxSpeed: Number(e.target.value) }))} style={{ width: '100%', accentColor: ACCENT }} />
                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '3px' }}>{t('v2w.noCut', 'Giữ nguyên toàn bộ video — không cắt, chỉ tăng tốc phát lại.')}</div>
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#8B949E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{t('v2w.priority', 'Ưu tiên')}</div>
                <div style={{ display: 'flex', gap: '6px', background: '#0B0F16', padding: '5px', borderRadius: '10px' }}>
                  {[{ v: 'balanced', l: t('v2w.priorityBalanced', 'Cân bằng') }, { v: 'sharpest', l: t('v2w.prioritySharpest', 'Nét nhất') }, { v: 'smallest', l: t('v2w.prioritySmallest', 'Nhẹ nhất') }].map((o) => (
                    <button key={o.v} onClick={() => setConfig((c) => ({ ...c, priority: o.v }))} style={{ flex: 1, padding: '9px 4px', borderRadius: '7px', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', background: config.priority === o.v ? ACCENT : 'transparent', color: config.priority === o.v ? '#000' : '#8B949E' }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={processAllManual} disabled={processing} className="interact-btn" style={{ width: '100%', background: processing ? '#374151' : ACCENT, color: processing ? '#9ca3af' : '#000', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LucideIcon name={processing ? 'loader' : 'zap'} width="18" height="18" className={processing ? 'spin' : ''} />
                {processing ? t('v2w.converting', 'Đang convert...') : t('v2w.convertBtn', 'Convert vừa khít')}
              </button>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginTop: '10px', background: autoConvert ? 'rgba(236,72,153,0.08)' : '#0B0F16', padding: '10px 12px', borderRadius: '10px', border: autoConvert ? '1px solid rgba(236,72,153,0.35)' : '1px solid rgba(255,255,255,0.06)' }}>
                <input type="checkbox" checked={autoConvert} onChange={(e) => setAutoConvert(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: ACCENT, cursor: 'pointer', marginTop: '2px' }} />
                <span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: autoConvert ? ACCENT : '#8B949E', display: 'block' }}>{t('v2w.auto', 'Tự convert khi tải lên')}</span>
                  <span style={{ fontSize: '11px', color: '#4b5563', display: 'block', marginTop: '2px' }}>{t('v2w.autoDesc', 'Mỗi video được phân tích, vạch kế hoạch riêng ngay khi tải lên rồi tự chạy.')}</span>
                </span>
              </label>
              {processing && (
                <button onClick={stopAll} style={{ width: '100%', marginTop: '8px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', padding: '10px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  {t('v2w.stop', 'Dừng')}
                </button>
              )}
              {readyCount > 1 && (
                <button onClick={downloadAllZip} className="interact-btn" style={{ width: '100%', marginTop: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LucideIcon name="download" width="16" height="16" />
                  {t('v2w.downloadAll', 'Tải tất cả (ZIP)')} ({readyCount})
                </button>
              )}
            </div>

            {/* Presets */}
            <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA', marginBottom: '6px' }}>{t('v2w.preset.title', 'Cấu hình đã lưu')}</div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '14px' }}>{t('v2w.preset.desc', 'Lưu trên máy bạn (localStorage).')}</div>
              {presets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {presets.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: activePresetId === p.id ? 'rgba(236,72,153,0.1)' : '#0B0F16', border: activePresetId === p.id ? '1px solid rgba(236,72,153,0.4)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 10px' }}>
                      <button onClick={() => applyPreset(p.id)} style={{ flex: 1, background: 'none', border: 'none', color: '#F5F7FA', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        {p.name} <span style={{ color: '#4b5563', fontWeight: 400 }}>· {p.config.targetMB}MB · {p.config.format}</span>
                      </button>
                      <button onClick={() => { const s = setDefaultPreset(p.id); setPresets(s.presets); }} title={t('v2w.preset.default', 'Mặc định')} style={{ background: 'none', border: 'none', color: getDefaultPreset()?.id === p.id ? ACCENT : '#4b5563', cursor: 'pointer', fontSize: '14px' }}>★</button>
                      <button onClick={() => { setPresets(deletePreset(p.id)); if (activePresetId === p.id) setActivePresetId(''); }} title={t('v2w.preset.delete', 'Xóa')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder={t('v2w.preset.namePh', 'Tên cấu hình...')} style={{ flex: 1, padding: '9px 12px', background: '#0B0F16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#F5F7FA', fontSize: '13px', outline: 'none' }} />
                <button onClick={handleSavePreset} style={{ background: 'rgba(236,72,153,0.15)', color: ACCENT, border: '1px solid rgba(236,72,153,0.4)', padding: '9px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {t('v2w.preset.save', 'Lưu')}
                </button>
              </div>
            </div>
          </div>

          {/* Right: drop + jobs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current.click()} style={{ background: '#161B22', border: `2px dashed ${jobs.length ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '20px', padding: jobs.length ? '20px' : '60px 40px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <input ref={fileInputRef} type="file" multiple accept="video/*,.mp4,.webm,.mov,.m4v" hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
              {jobs.length === 0 ? (
                <>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(236,72,153,0.12)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LucideIcon name="film" width="28" height="28" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F5F7FA', margin: 0 }}>{t('v2w.drop.title', 'Kéo thả video vào đây (nhiều file cùng lúc)')}</h3>
                  <p style={{ fontSize: '14px', color: '#8B949E', margin: 0 }}>{t('v2w.drop.support', 'Hỗ trợ: MP4 · WebM · MOV — mỗi file xử lý riêng')}</p>
                  <button className="interact-btn" style={{ background: ACCENT, color: '#000', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    {t('v2w.drop.button', 'Chọn video')}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: ACCENT, fontWeight: 600, fontSize: '14px' }}>
                  <LucideIcon name="plus-circle" width="18" height="18" /> {t('v2w.addMore', 'Thêm video')}
                  <button onClick={(e) => { e.stopPropagation(); clearDone(); }} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', marginLeft: '12px' }}>
                    {t('v2w.clearDone', 'Xóa các file đã xong')}
                  </button>
                </div>
              )}
            </div>

            {jobs.map((job) => (
              <JobCard key={job.id} job={job} targetBytes={targetBytes} onRemove={() => removeJob(job.id)} onDownload={(fmt) => downloadOne(job, fmt)} />
            ))}
          </div>
        </div>
      </main>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
        <RelatedTools currentTool="video-to-webp" />
      </div>
    </div>
  );
}

function JobCard({ job, targetBytes, onRemove, onDownload }) {
  const [showAttempts, setShowAttempts] = useState(false);
  const reco = job.recommendation;

  return (
    <div className="anim-fade-in" style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#F5F7FA', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</div>
          <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '3px' }}>
            {formatBytes(job.size)}
            {job.meta && ` · ${job.meta.width}×${job.meta.height} · ${isFinite(job.meta.duration) ? job.meta.duration.toFixed(1) : '?'}s · ${t('v2w.fullKept', 'giữ nguyên toàn bộ')}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <StatusBadge status={job.status} />
          <button onClick={onRemove} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', color: '#fff', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LucideIcon name="x" width="12" height="12" />
          </button>
        </div>
      </div>

      {(job.status === 'encoding' || job.status === 'probing') && (
        <div style={{ padding: '14px 18px' }}>
          {job.plan && job.status === 'encoding' && (
            <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '8px' }}>📋 {job.plan}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B949E', marginBottom: '6px' }}>
            <span style={{ color: ACCENT }}>{job.status === 'probing' ? t('v2w.probing', 'Đang đọc thông tin video...') : job.attemptLabel || t('v2w.encoding', 'Đang encode...')}</span>
            {job.status === 'encoding' && <span>{job.progress ?? 0}%</span>}
          </div>
          <div style={{ background: '#0B0F16', borderRadius: '6px', height: '6px' }}>
            <div style={{ background: ACCENT, height: '100%', width: `${job.progress ?? 5}%`, borderRadius: '6px', transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {job.status === 'queued' && job.plan && (
        <div style={{ padding: '12px 18px', fontSize: '12px', color: '#8B949E', background: 'rgba(236,72,153,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          📋 {job.plan}
        </div>
      )}

      {job.status === 'error' && !job.meta && (
        <div style={{ padding: '14px 18px', fontSize: '13px', color: '#ef4444' }}>{job.error}</div>
      )}
      {job.status === 'error' && job.meta && (
        <div style={{ padding: '14px 18px', fontSize: '13px', color: '#ef4444' }}>
          {t('v2w.error.encode', 'Lỗi convert')}: {job.error}
          <span style={{ color: '#8B949E' }}> — {t('v2w.retryHint', 'bấm "Convert vừa khít" để thử lại file này')}</span>
        </div>
      )}

      {job.status === 'done' && (
        <div style={{ padding: '18px' }}>
          {/* Recommendation */}
          <div style={{ background: job.recoNote === 'over' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: job.recoNote === 'over' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: job.recoNote === 'over' ? '#f87171' : '#10b981', fontWeight: 600 }}>
            {job.recoNote === 'over'
              ? t('v2w.reco.over', `Không vừa ${formatBytes(targetBytes)} ở chất lượng tốt nhất — đây là bản nhẹ nhất, gần target nhất. Hãy tăng target hoặc cho phép tua nhanh ×2.`)
              : reco === 'webp'
                ? t('v2w.reco.webp', 'Đề xuất: WebP — nhẹ, nét, hỗ trợ trong suốt và animation mượt.')
                : t('v2w.reco.gif', 'Đề xuất: GIF — tương thích mọi nơi (Zalo, Discord, web cũ).')}
            {job.recoNote === 'only-fit' && ` (${t('v2w.reco.onlyFit', 'chỉ phương án này vừa target')})`}
            {job.recoNote === 'smaller' && ` (${t('v2w.reco.smaller', 'nhẹ hơn hẳn')})`}
            {job.recoNote === 'sharper' && ` (${t('v2w.reco.sharper', 'nét hơn ở cùng mức dung lượng')})`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <PreviewBox fmt="webp" result={job.resultWebp} targetBytes={targetBytes} recommended={reco === 'webp'} onDownload={() => onDownload('webp')} />
            <PreviewBox fmt="gif" result={job.resultGif} targetBytes={targetBytes} recommended={reco === 'gif'} onDownload={() => onDownload('gif')} />
          </div>

          {job.attempts?.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => setShowAttempts((s) => !s)} style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                {showAttempts ? '▾' : '▸'} {t('v2w.attempts', 'Quá trình thử')} ({job.attempts.length})
                {job.skipped?.some((s) => s.count > 0) && (
                  <span style={{ color: '#4b5563' }}> · {t('v2w.skipped', String(job.skipped.filter((s) => s.count > 0).map((s) => `${s.format.toUpperCase()}:${s.count}`).join(' ')))}</span>
                )}
              </button>
              {showAttempts && (
                <div style={{ marginTop: '8px', background: '#0B0F16', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#8B949E', display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace' }}>
                  {job.attempts.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span>#{i + 1} {a.format.toUpperCase()} · q{a.step.q} · {a.step.dim}p · {a.step.fps}fps{a.step.speed > 1 ? ` · ×${a.step.speed}` : ''}</span>
                      <span style={{ color: a.size <= targetBytes ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{formatBytes(a.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewBox({ fmt, result, targetBytes, recommended, onDownload }) {
  if (!result) return <div style={{ background: '#0B0F16', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#4b5563', textAlign: 'center' }}>—</div>;
  const fits = result.size <= targetBytes;
  return (
    <div style={{ background: '#0B0F16', border: `1px solid ${recommended ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
        <span style={{ color: recommended ? ACCENT : '#8B949E' }}>{fmt.toUpperCase()} {recommended && '★'}</span>
        <span style={{ color: fits ? '#10b981' : '#f59e0b' }}>{formatBytes(result.size)}{fits ? ' ✓' : ''}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', minHeight: '110px', alignItems: 'center' }}>
        <img src={result.url} alt={`${fmt} preview`} style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px' }} />
      </div>
      <div style={{ padding: '6px 12px', fontSize: '11px', color: '#4b5563', display: 'flex', justifyContent: 'space-between' }}>
        <span>{result.step.dim}p · {result.step.fps}fps{result.step.speed > 1 ? ` · ×${result.step.speed}` : ''}</span>
        <span>{t('v2w.score', 'điểm')}: {result.score}</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <button onClick={onDownload} className="interact-btn" style={{ width: '100%', background: recommended ? ACCENT : '#3b82f6', color: recommended ? '#000' : '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LucideIcon name="download" width="14" height="14" />
          {t('v2w.downloadFmt', 'Tải')} {fmt.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    probing: ['#8B949E', 'Đọc...'],
    queued: ['#8B949E', 'Chờ'],
    encoding: [ACCENT, 'Encoding'],
    done: ['#10b981', 'Xong'],
    error: ['#ef4444', 'Lỗi'],
  };
  const [c, l] = map[status] || map.queued;
  return <span style={{ fontSize: '11px', fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}55`, padding: '3px 10px', borderRadius: '12px' }}>{l}</span>;
}
