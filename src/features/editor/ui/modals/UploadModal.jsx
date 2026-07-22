import React, { useState, useEffect } from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { CustomDropdown } from '../../../../shared/ui/CustomDropdown';
import { loadLocalDirFileList, loadDriveFileList } from '../../../storage/cloud/drive-ui.js';

// Reusable NavItem Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    className={`interact-btn ${isActive ? 'active' : ''}`}
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: 'none',
      background: isActive ? 'var(--color-surface-alt)' : 'transparent',
      color: isActive ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px',
      textAlign: 'left'
    }}
    onMouseOver={(e) => {
      if (!isActive) {
        e.currentTarget.style.color = 'var(--color-text)';
        e.currentTarget.style.background = 'var(--color-surface)';
      }
    }}
    onMouseOut={(e) => {
      if (!isActive) {
        e.currentTarget.style.color = 'var(--color-text-muted)';
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <Icon name={icon} style={{ width: '18px', height: '18px', color: isActive ? 'var(--color-primary)' : 'inherit' }} />
    <span>{label}</span>
  </button>
);



const UploadModal = () => {
  const [activeSource, setActiveSource] = useState('computer'); // 'computer', 'drive', or 'paste_json'
  const [fileFilter, setFileFilter] = useState('all'); // 'all', 'image', 'json'
  const [isDragging, setIsDragging] = useState(false);
  const [jsonFormatMode, setJsonFormatMode] = useState('xy'); // 'xy' or 'index'

  // Sync state with file lists loading
  useEffect(() => {
    if (activeSource === 'computer') {
      loadLocalDirFileList();
    } else if (activeSource === 'drive') {
      loadDriveFileList();
    }
  }, [activeSource]);

  // Handle drive connection/disconnection events to refresh file lists
  useEffect(() => {
    const handleDriveConnected = () => {
      if (activeSource === 'drive') {
        loadDriveFileList();
      }
    };
    const handleDriveDisconnected = () => {
      if (activeSource === 'drive') {
        loadDriveFileList();
      }
    };
    window.addEventListener('drive-connected', handleDriveConnected);
    window.addEventListener('drive-disconnected', handleDriveDisconnected);
    return () => {
      window.removeEventListener('drive-connected', handleDriveConnected);
      window.removeEventListener('drive-disconnected', handleDriveDisconnected);
    };
  }, [activeSource]);

  // Synchronize state with DOM mutation filtering
  useEffect(() => {
    const filterItems = (listEl) => {
      if (!listEl) return;
      const items = listEl.children;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const nameEl = item.querySelector('div[title]');
        if (!nameEl) continue;

        const fileName = nameEl.getAttribute('title').toLowerCase();
        const isJson = fileName.endsWith('.json') || fileName.endsWith('.txt');
        const isImage = fileName.match(/\.(png|jpe?g|gif|webp)$/i);

        if (fileFilter === 'all') {
          item.style.display = 'flex';
        } else if (fileFilter === 'image') {
          item.style.display = isImage ? 'flex' : 'none';
        } else if (fileFilter === 'json') {
          item.style.display = isJson ? 'flex' : 'none';
        }
      }
    };

    const observerConfig = { childList: true };
    const observers = [];

    const setupObserver = (id) => {
      const el = document.getElementById(id);
      if (!el) return;

      // Filter initial items
      filterItems(el);

      const observer = new MutationObserver(() => {
        filterItems(el);
      });
      observer.observe(el, observerConfig);
      observers.push(observer);
    };

    setupObserver('localDirUploadList');
    setupObserver('driveUploadList');

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [fileFilter, activeSource]);

  const dropZoneStyle = {
    width: '100%',
    border: isDragging ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
    background: isDragging ? 'var(--color-primary)' : 'var(--color-surface)',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
    marginBottom: '24px'
  };

  return (
    <div id="uploadModal" className="modal-overlay" style={{ display: 'none' }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '100%', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'var(--color-bg)' }}>

        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-bright)', margin: 0, letterSpacing: '0.5px' }} data-i18n="modal.uploadTitle">Tải dữ liệu lên / Mở file</h2>
          <button id="closeUploadModalBtn" className="btn interact-btn" style={{ padding: '6px', background: 'transparent', borderRadius: '50%', color: 'var(--color-text-muted)' }}>
            <Icon name={ICONS.X} style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{ width: '224px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '16px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 8px' }}>Vị trí</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavItem icon={ICONS.MONITOR} label="Máy tính" isActive={activeSource === 'computer'} onClick={() => setActiveSource('computer')} />
                <NavItem icon={ICONS.CLOUD} label="Google Drive" isActive={activeSource === 'drive'} onClick={() => setActiveSource('drive')} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 8px' }}>Nâng cao</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavItem icon={ICONS.CODE} label="Dán mã JSON" isActive={activeSource === 'paste_json'} onClick={() => setActiveSource('paste_json')} />
              </div>
            </div>


          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>

            {/* Contextual Header */}
            <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-surface-alt)' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <div style={{ display: activeSource === 'computer' ? 'flex' : 'none', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.HARD_DRIVE} style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)' }} /> <span>Bộ nhớ cục bộ</span>
                  </div>
                  <div style={{ display: activeSource === 'drive' ? 'flex' : 'none', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.CLOUD} style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} /> <span>Google Drive</span>
                  </div>
                  <div style={{ display: activeSource === 'paste_json' ? 'flex' : 'none', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.CODE} style={{ width: '16px', height: '16px', color: 'var(--success, #10b981)' }} /> <span>Dữ liệu JSON thô</span>
                  </div>
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CustomDropdown
                  id="fileFilterSelect"
                  value={fileFilter}
                  options={[
                    { value: 'all', label: 'Tất cả các tệp' },
                    { value: 'image', label: 'Hình ảnh' },
                    { value: 'json', label: 'Dữ liệu JSON' }
                  ]}
                  onChange={(e) => setFileFilter(e.target.value)}
                  style={{ minWidth: '150px' }}
                />

                <button id="openDrivePickerBtn" className="interact-btn" style={{ display: activeSource === 'drive' ? 'flex' : 'none', fontSize: '13px', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>

                  <span data-i18n="drive.openPicker">Duyệt toàn bộ Drive...</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* === COMPUTER VIEW === */}
              <div style={{ display: activeSource === 'computer' ? 'block' : 'none' }}>
                <div
                  id="imageDropZone"
                  style={dropZoneStyle}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                >
                  <Icon name={ICONS.UPLOAD_CLOUD} style={{ width: '32px', height: '32px', color: isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 4px 0' }} data-i18n="modal.clickToSelect">
                    Nhấp hoặc kéo thả file để tải lên
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>Hỗ trợ PNG, JPG, WEBP, hoặc file JSON cấu hình.</p>
                  <button className="btn btn-secondary" style={{ padding: '8px 20px', fontWeight: 500, pointerEvents: 'none' }}>Duyệt file</button>
                  <input type="file" id="imageUploadModal" accept="image/*, .zip" multiple style={{ display: 'none' }} />
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }} data-i18n="modal.importMode">Chế độ nhập ảnh:</label>
                    <CustomDropdown
                      id="importModeSelect"
                      defaultValue="current-tab"
                      options={[
                        { value: 'current-tab', label: '1. Ghi đè Tab hiện tại (Chỉ 1 file)' },
                        { value: 'multi-tab', label: '2. Mở vào nhiều Tabs mới (Multi-Tab)' },
                        { value: 'animation', label: '3. Mở thành Ảnh động (Animation Frames)' }
                      ]}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <label id="autoSizeLabel" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--color-text)', cursor: 'pointer', marginBottom: '24px', fontWeight: 500 }}>
                  <input type="checkbox" id="autoSizeOnUpload" className="check" defaultChecked />
                  <span data-i18n="modal.autoSize">Tự động chỉnh lưới theo kích thước ảnh</span>
                </label>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>Tệp cục bộ gần đây</h3>
                    {fileFilter !== 'all' && (
                      <span style={{ fontSize: '11px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '6px', fontWeight: 500 }}>
                        Đang lọc: {fileFilter.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div id="localDirUploadList" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                      <Icon name={ICONS.FOLDER} style={{ width: '40px', height: '40px', margin: '0 auto 16px', opacity: 0.4 }} />
                      <div style={{ marginBottom: '16px', fontSize: '14px' }} data-i18n="settings.noDirectorySelected">Bạn chưa cấu hình Thư mục cục bộ</div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 500 }} onClick={() => {
                          document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
                          document.getElementById('globalSettingsModal').style.display = 'flex';
                          setTimeout(() => {
                            const accountBtn = document.querySelector('.tab-btn[data-tab="tab-account"]');
                            if (accountBtn) accountBtn.click();
                          }, 50);
                        }} data-i18n="settings.changeDirectory">Đi tới Cài đặt</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === DRIVE VIEW === */}
              <div id="source-drive-content" style={{ display: activeSource === 'drive' ? 'block' : 'none' }}>
                <div
                  style={{ ...dropZoneStyle, marginBottom: '24px' }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                >
                  <Icon name={ICONS.CLOUD} style={{ width: '32px', height: '32px', color: isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                    Tải tệp lên Drive
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>Tải tệp trực tiếp lên thư mục Google Drive hiện tại.</p>
                  <button className="btn btn-secondary" style={{ padding: '8px 20px', fontWeight: 500, pointerEvents: 'none' }}>Duyệt Drive</button>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>Tệp trong Drive</h3>
                    {fileFilter !== 'all' && (
                      <span style={{ fontSize: '11px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '6px', fontWeight: 500 }}>
                        Đang lọc: {fileFilter.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div id="driveUploadList" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                      <Icon name={ICONS.CLOUD} style={{ width: '40px', height: '40px', margin: '0 auto 16px', opacity: 0.4 }} />
                      <div style={{ marginBottom: '16px', fontSize: '14px' }} data-i18n="drive.loginRequired">Bạn cần đăng nhập Google Drive để chọn ảnh</div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button id="uploadDriveLoginBtn" className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 500 }} data-i18n="drive.login">Kết nối Drive</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === PASTE JSON VIEW === */}
              <div style={{ display: activeSource === 'paste_json' ? 'block' : 'none', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>Định dạng hiển thị mẫu</h3>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
                        <input type="radio" name="jsonFormatMode" value="xy" checked={jsonFormatMode === 'xy'} onChange={() => setJsonFormatMode('xy')} />
                        Chế độ (x,y)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }} title="Dùng Key là số nguyên (giống định dạng tải về từ máy)">
                        <input type="radio" name="jsonFormatMode" value="index" checked={jsonFormatMode === 'index'} onChange={() => setJsonFormatMode('index')} />
                        Chế độ Key (Index)
                      </label>
                    </div>
                  </div>

                  <div style={{ flex: 1, minHeight: '180px', marginBottom: '16px' }}>
                    <textarea
                      id="jsonInputText"
                      data-i18n="modal.jsonPlaceholder"
                      placeholder={jsonFormatMode === 'xy' ? 
                        'Dán mã JSON (hoặc nội dung file .txt) vào đây...\n\nVí dụ mẫu (Chế độ tọa độ x,y):\n{\n  "width": 32,\n  "height": 32,\n  "pixels": {\n    "0,0": "#FF0000",\n    "1,1": "#00FF00"\n  }\n}' : 
                        'Dán mã JSON (hoặc nội dung file .txt) vào đây...\n\nVí dụ mẫu (Chế độ Index - mã hóa số nguyên):\n{\n  "width": 32,\n  "height": 32,\n  "pixels": {\n    "0": "#FF0000",\n    "65537": "#00FF00"\n  }\n}'
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontFamily: 'monospace',
                        resize: 'none',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button 
                      id="parseJsonTextBtn" 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                      onClick={async () => {
                        const { handleJsonText } = await import('../../io/upload/upload-modal.js');
                        const text = document.getElementById('jsonInputText').value;
                        if (text) handleJsonText(text);
                      }}
                    >
                      <Icon name={ICONS.CODE} style={{ width: '18px', height: '18px' }} />
                      <span data-i18n="modal.parseJson">Phân tích JSON</span>
                    </button>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '14px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}
                      onClick={() => {
                        const sampleData = jsonFormatMode === 'xy' ? {
                          width: 32,
                          height: 32,
                          pixels: {
                            "0,0": "#FF0000",
                            "1,1": "#00FF00",
                            "2,2": "#0000FF"
                          }
                        } : {
                          width: 32,
                          height: 32,
                          pixels: {
                            "0": "#FF0000",
                            "65537": "#00FF00",
                            "131074": "#0000FF"
                          }
                        };
                        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sample_template_${jsonFormatMode}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
                      <span>Tải template mẫu</span>
                    </button>
                  </div>

                  <div
                    id="jsonDropZone"
                    style={{ ...dropZoneStyle, marginBottom: 0, padding: '24px' }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => { 
                      e.preventDefault(); 
                      setIsDragging(false); 
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const { handleJsonFile } = await import('../../io/upload/upload-modal.js');
                        handleJsonFile(file);
                      }
                    }}
                    onClick={() => document.getElementById('jsonUploadModal').click()}
                  >
                    <Icon name={ICONS.FILE_JSON} style={{ width: '28px', height: '28px', color: isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-muted)' }} data-i18n="modal.dropJson">Nhấp hoặc kéo thả file .json (hoặc .txt) vào đây</div>
                    <input 
                      type="file" 
                      id="jsonUploadModal" 
                      accept=".json, .txt, application/json, text/plain" 
                      style={{ display: 'none' }} 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const { handleJsonFile } = await import('../../io/upload/upload-modal.js');
                          handleJsonFile(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;

