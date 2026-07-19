## Tham khảo cấu trúc dự án (FSD - Feature-Sliced Design)

Lưu ý khi code phải nhớ đến gói lang, và ưu tiên sử dụng tiếng anh
* Đây chỉ là danh sách thông tin và các đường dẫn tham khảo.
* Icon được quản lý tập trung tại:
  * `src/shared/ui/icons/` (VD: `icons.jsx`)
  * Sử dụng icon từ: https://v0.lucide.dev/

* i18n (gói ngôn ngữ):
  * `src/i18n/i18n.js`

* Cài đặt (Settings):
  * `src/features/settings`

* Giao diện Công cụ vẽ (Tabs Draw / Toolbar):
  * `src/features/editor/ui/toolbar`

* Giao diện Thao tác (Tabs Edit / Edit Panel):
  * `src/features/editor/ui/edit-panel`

* Lưu trạng thái Toolbar:
  * `src/features/editor/engine/tool-registry/toolbar-save.js`
  * Thu thập trạng thái toolbar (cọ, màu, công cụ...) và lưu vào `localStorage`.

* Khôi phục trạng thái sau F5:
  * `src/features/editor/engine/tool-registry/toolbar-reset.js`
  * Đọc `localStorage` để khôi phục trạng thái.
  * Nếu công cụ thuộc `RESET_ON_F5_TOOLS` (ví dụ: `crop`) thì hủy và đưa về trạng thái mặc định.

* Quản lý Pen:
  * `src/features/editor/engine/tools/pen`

* Nguồn liên quan Select & Lịch sử:
  * [select.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/engine/tools/select.js) (Xử lý logic khoanh vùng, nhấc điểm ảnh, di chuyển và hợp nhất nét vẽ)
  * [render.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/engine/core/render.js) (Vẽ và hiển thị Overlay khung chọn, Partial/Full render)
  * [CanvasPanel.jsx](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/ui/panels/CanvasPanel.jsx) (Cấu trúc HTML DOM overlay của Select, thanh điều hướng nút Copy/Paste/Undo)
  * [ToolbarPanel.jsx](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/ui/toolbar/ToolbarPanel.jsx) (Giao diện bảng công cụ và cấu hình Pop-up)

* Quản lý Lịch sử (Undo/Redo):
  * [history.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/engine/core/history.js) (Lõi xử lý Undo Stack, Redo Stack, lưu nét vẽ `recordChange`, gộp bước di chuyển)
  * [undo-redo.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/engine/actions/undo-redo.js) (Bắt sự kiện phím tắt Ctrl+Z, Ctrl+Y để hoàn tác)

* Clipboard & Sao chép/Cắt/Dán:
  * [clipboard.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/features/editor/engine/actions/clipboard.js) (Ghi chép và xử lý logic `handleCopy`, `handleCut`, `handlePaste` từ bàn phím và nút bấm)

* Định dạng Giao diện (CSS):
  * Tất cả CSS được quản lý tại thư mục `src/styles/`
  * VD: `src/styles/legacy-editor/layout.css` (CSS điều khiển hiển thị Menu di động, chống tràn Tool-popup, thêm thanh cuộn cho thanh nav)

### Mode Manager

- `src/features/editor/engine/modes/mode-manager.js`
  - Facade quản lý tập trung các chế độ của Canvas.
  - API: `get/set/toggle` cho `Gradient`, `Mirror`, `Grid`, `Animation`, `Onion Skin`.
- `src/features/editor/engine/core/pixel-writer.js` (hoặc các core module)
  - `isGradientModeActive()`
- `src/features/editor/engine/core/render.js`
  - `isShowGrid()`
- Các module UI (`gradient-mode.js`, `mirror-mode.js`, `show-grid.js`) đều truy cập thông qua `ModeManager`.

Luồng hiển thị preview pixel:
1. `CanvasPanel.jsx`: Render các `<canvas>` preview từ `getPreviewItems()`.
2. `preview-group-manager.js`: Quản lý danh sách preview và dùng `syncPreviewPixels()` để copy ảnh từ canvas chính sang canvas preview.
3. `render.js`: Sau mỗi lần vẽ hoặc cập nhật `previewPixels`, `renderPixels()` gọi `syncPreviewPixels()` để đồng bộ ngay preview.

Các file chính của Main Canvas:
- `CanvasPanel.jsx`: Tạo `<canvas id="pixelCanvas">` và các lớp overlay.
- `render.js`: Vẽ `pixelMap` và `previewPixels` lên canvas (`renderPixels()`).
- `viewport.js`: Quản lý zoom, pan và transform của canvas.
- `canvas-events.js`: Xử lý sự kiện chuột, touch, wheel.
- `state.js`: Lưu `pixelCanvas` và `ctx` để các module dùng chung.

### Main Canvas Manager

- `src/features/editor/engine/core/main-canvas-manager.js`
  - Facade khởi tạo Main Canvas.
  - API: `initMainCanvasLayout()`, `bindMainCanvasEvents()`.
- `src/features/editor/engine/main.js`
  - Thay các lệnh khởi tạo Canvas riêng lẻ bằng 2 API trên, giúp code gọn và dễ quản lý.