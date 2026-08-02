import React from 'react';
import { Icon, ICONS } from '../../../../shared/ui/icons';
import { t } from '../../../../i18n/i18n.js';

const DownloadModal = () => {
  return (
    <div id="downloadModal" className="modal-overlay" style={{ display: 'none' }}>
      <div className="modal-content download-modal-inner" style={{ 
        width: '100%', maxWidth: '800px', minHeight: '500px', maxHeight: '90vh', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-bright)', margin: 0, letterSpacing: '0.5px' }} data-i18n="modal.downloadTitle">{t('modal.downloadTitle') || 'Export Configuration'}</h2>
          <button id="closeDownloadModalBtn" className="btn interact-btn" style={{ padding: '6px', background: 'transparent', borderRadius: '50%', color: 'var(--color-text-muted)' }} data-i18n="tooltip.closeModal">
            <Icon name={ICONS.X} style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body - 2 Columns */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'row' }}>
          
          {/* LEFT COLUMN: Asset Selection */}
          <div style={{ width: '32%', backgroundColor: 'var(--color-surface-alt)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }} data-i18n="download.assetsTitle">{t('download.assetsTitle') || 'Select Assets'}</h3>
            </div>

            {/* Canvas List */}
            <div id="downloadCanvasList" className="download-canvas-list" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Checkboxes will be injected here via JS */}
            </div>
          </div>

          {/* RIGHT COLUMN: Settings */}
          <div style={{ width: '68%', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            
            {/* Scrollable Settings Area */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            
              {/* Format Type Tabs */}
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }} data-i18n="download.exportMode">{t('download.exportMode') || 'Export Mode'}</h3>
              <div className="modal-tabs" id="exportTypeTabs" style={{ display: 'flex', width: '100%', marginBottom: 0 }}>
                <button className="tab-btn export-type-btn active interact-btn" data-type="static" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} data-i18n="tooltip.staticExport">
                  <Icon name={ICONS.IMAGE} style={{ width: '16px', height: '16px' }} />
                  <span>{t('download.staticMode') || 'Static Image'}</span>
                </button>
                <button className="tab-btn export-type-btn interact-btn" data-type="animation" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} data-i18n="tooltip.animExport">
                  <Icon name={ICONS.LAYERS} style={{ width: '16px', height: '16px' }} />
                  <span>{t('download.animMode') || 'Sequence / Anim'}</span>
                </button>
              </div>
            </div>

              {/* Format Selection Grid */}
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }} data-i18n="download.format">{t('download.format') || 'Format'}</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  
                  {/* Static Formats */}
                  <div id="staticFormats" className="format-selector" style={{ display: 'flex', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                      <FormatButton format="png" icon={ICONS.IMAGE} label={t('download.formatPng') || "PNG"} desc="Lossless image" isDefault={true} />
                      <FormatButton format="jpeg" icon={ICONS.IMAGE} label={t('download.formatJpg') || "JPG"} desc="Small size" />
                      <FormatButton format="webp" icon={ICONS.IMAGE} label={t('download.formatWebp') || "WEBP"} desc="Web optimized" />
                      <FormatButton format="json" icon={ICONS.FILE_JSON} label={t('download.formatJson') || "JSON"} desc="Project data" />
                    </div>
                  </div>

                  {/* Anim Formats */}
                  <div id="animFormats" className="format-selector" style={{ display: 'none', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                      <FormatButton format="spritesheet" icon={ICONS.LAYOUT_GRID} label={t('download.formatSprite') || "Sprite Sheet"} desc="Game engine grid" isDefault={true} />
                      <FormatButton format="zip" icon={ICONS.FILE_ARCHIVE} label={t('download.formatZip') || "ZIP Frames"} desc="Image sequence" />
                      <FormatButton format="gif" icon={ICONS.FILE_VIDEO} label={t('download.formatGif') || "GIF"} desc="Animated file" />
                      <FormatButton format="webm" icon={ICONS.FILE_VIDEO} label={t('download.formatWebm') || "Video (WebM)"} desc="Screen record" />
                    </div>
                  </div>
                </div>

                {/* Integrated Transparent Background Toggle */}
                <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={ICONS.IMAGE} style={{ width: '16px', height: '16px', color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }} data-i18n="download.transparent">{t('download.transparent') || 'Transparent Background'}</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }} data-i18n="tooltip.transparentBg">
                    <input type="checkbox" id="dlTransparentBg" className="check" defaultChecked />
                  </label>
                </div>
              </div>

              {/* Save Location */}
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }} data-i18n="download.destination">{t('download.destination') || 'Destination'}</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="dl-dest-btn select-btn interact-btn" data-dest="download" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '12px', transition: 'all 0.2s' }} data-i18n="tooltip.downloadDest">
                    <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }} data-i18n="download.download">{t('download.download') || 'Download to device'}</span>
                    <div className="active-checkmark" style={{ top: '50%', transform: 'translateY(-50%)', right: '12px' }}>
                      <Icon name={ICONS.CHECK} style={{ width: '16px', height: '16px' }} />
                    </div>
                  </button>
                  <button className="dl-dest-btn select-btn interact-btn" data-dest="local" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '12px', transition: 'all 0.2s' }} data-i18n="tooltip.localDest">
                    <Icon name={ICONS.HARD_DRIVE} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }} data-i18n="download.folder">{t('download.folder') || 'Save to folder'}</span>
                    <div className="active-checkmark" style={{ top: '50%', transform: 'translateY(-50%)', right: '12px' }}>
                      <Icon name={ICONS.CHECK} style={{ width: '16px', height: '16px' }} />
                    </div>
                  </button>
                  <button className="dl-dest-btn select-btn interact-btn" data-dest="drive" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '12px', transition: 'all 0.2s' }} data-i18n="tooltip.driveDest">
                    <Icon name={ICONS.CLOUD} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }} data-i18n="download.drive">{t('download.drive') || 'Google Drive'}</span>
                    <div className="active-checkmark" style={{ top: '50%', transform: 'translateY(-50%)', right: '12px' }}>
                      <Icon name={ICONS.CHECK} style={{ width: '16px', height: '16px' }} />
                    </div>
                  </button>
                </div>

                {/* Local Folder Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '10px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Icon name={ICONS.HARD_DRIVE} style={{ width: '15px', height: '15px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <span id="dlFolderStatusText" style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}></span>
                  </div>
                  <button id="chooseFolderBtn" className="btn interact-btn" style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '8px', backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-bright)', flexShrink: 0 }} data-i18n="download.chooseFolder">
                    {t('download.chooseFolder') || 'Choose folder'}
                  </button>
                </div>

                {/* Drive Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '10px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Icon name={ICONS.CLOUD} style={{ width: '15px', height: '15px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <span id="dlDriveStatusText" style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}></span>
                  </div>
                  <button id="driveLoginBtn" className="btn interact-btn" style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '8px', backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-bright)', flexShrink: 0 }} data-i18n="download.chooseDriveLogin">
                    {t('download.chooseDriveLogin') || 'Sign in to Drive'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer (Now inside Right Column) */}
            <div style={{ padding: '20px 24px', backgroundColor: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                <span id="downloadStatusText">{t('download.statusReady') || 'Ready to export.'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button id="cancelDownloadBtn" className="btn interact-btn" style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500, backgroundColor: 'transparent', color: 'var(--color-text-muted)' }} data-i18n="tooltip.cancelDownload">
                  {t('download.cancel') || 'Cancel'}
                </button>
                <button id="executeDownloadBtn" className="btn btn-primary interact-btn" style={{ padding: '10px 28px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px var(--color-primary-tint)' }} data-i18n="tooltip.executeDownload">
                  <Icon name={ICONS.DOWNLOAD} style={{ width: '18px', height: '18px' }} />
                  <span data-i18n="download.execute">{t('download.execute') || 'Download'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>



      </div>
    </div>
  );
};

// Helper component for format buttons to match design
const FormatButton = ({ format, icon, label, desc, isDefault }) => (
  <button className={`dl-format-btn select-btn interact-btn ${isDefault ? 'active' : ''}`} data-format={format} style={{ 
    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', 
    borderRadius: '12px', textAlign: 'left', transition: 'all 0.2s'
  }}>
    <div className="format-icon-wrapper" style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} style={{ width: '18px', height: '18px' }} />
    </div>
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <span className="format-label" style={{ fontSize: '14px', fontWeight: 600 }} data-i18n={`format.${format}`}>{label}</span>
      <span className="format-desc" style={{ fontSize: '11px', marginTop: '2px' }} data-i18n={`format.${format}Desc`}>{desc}</span>
    </div>
    <div className="active-checkmark">
      <Icon name={ICONS.CHECK} style={{ width: '16px', height: '16px' }} />
    </div>
  </button>
);

export default DownloadModal;
