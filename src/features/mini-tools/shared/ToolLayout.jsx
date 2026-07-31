/**
 * Layout chuẩn cho tất cả mini-tools
 * - Header: back button, title, editor link
 * - Content: upload area + preview + controls
 * - Footer: actions (download, reset)
 */
export default function ToolLayout({
  title,           // Tiêu đề trang
  icon,            // Icon trang (emoji)
  children,        // Nội dung chính
  actions,         // Các nút action (download, reset, v.v.)
  onBack,          // Hàm back về home
  onNavigateEditor // Hàm chuyển đến editor
}) {
  return (
    <div className="mini-tools-layout">
      <header className="mini-tools-header">
        <button className="btn btn-icon" onClick={onBack} title="Về trang chủ">
          ←
        </button>
        <h1>{icon} {title}</h1>
        <div className="header-spacer" />
        <button className="btn btn-outline" onClick={onNavigateEditor}>
          🎨 Editor
        </button>
      </header>

      <main className="tool-content">
        {children}
      </main>

      {actions && (
        <footer className="tool-footer">
          {actions}
        </footer>
      )}
    </div>
  );
}