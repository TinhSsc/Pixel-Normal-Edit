## Tham khảo cấu trúc dự án
Lưu ý khi code phải nhớ đến gói lang, và ưu tiên sử dụng tiếng anh
* Đây chỉ là danh sách thông tin và các đường dẫn tham khảo.
* Icon được quản lý tập trung tại:

  * `src/components/icons.jsx`
  * Sử dụng icon từ: https://v0.lucide.dev/
* i18n (gói ngôn ngữ):

  * `src/js/lang/i18n.js`
* Settings:

  * `src/settings`
* Tabs Draw:

  * `src/toolbar`
* Tabs Edit:

  * `src/edit`
* Lưu trạng thái Toolbar:

  * `src/js/core/toolbar-save.js`
  * Thu thập trạng thái toolbar (cọ, màu, công cụ...) và lưu vào `localStorage`.
* Khôi phục trạng thái sau F5:

  * `src/js/core/toolbar-reset.js`
  * Đọc `localStorage` để khôi phục trạng thái.
  * Nếu công cụ thuộc `RESET_ON_F5_TOOLS` (ví dụ: `crop`) thì hủy và đưa về trạng thái mặc định.
* Quản lý Pen:

  * `src/js/tools/pen`
* Nguồn liên quan Select & Lịch sử:

  * [select.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/js/tools/select.js) (Xử lý logic khoanh vùng, nhấc điểm ảnh, di chuyển và hợp nhất nét vẽ)
  * [render.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/js/core/render.js) (Vẽ và hiển thị Overlay khung chọn, Partial/Full render)
  * [CanvasPanel.jsx](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/panels/CanvasPanel.jsx) (Cấu trúc HTML DOM overlay của Select, thanh điều hướng nút Copy/Paste/Undo)
  * [ToolbarPanel.jsx](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/panels/ToolbarPanel.jsx) (Giao diện bảng công cụ bên phải và cấu hình Pop-up)

* Quản lý Lịch sử (Undo/Redo):

  * [history.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/js/core/history.js) (Lõi xử lý Undo Stack, Redo Stack, lưu nét vẽ `recordChange`, gộp bước di chuyển)
  * [undo-redo.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/js/actions/undo-redo.js) (Bắt sự kiện phím tắt Ctrl+Z, Ctrl+Y để hoàn tác)

* Clipboard & Sao chép/Cắt/Dán:

  * [clipboard.js](file:///c:/Users/ADMIN/Downloads/aitaoanh/src/js/actions/clipboard.js) (Ghi chép và xử lý logic `handleCopy`, `handleCut`, `handlePaste` từ bàn phím và nút bấm)

* Định dạng Giao diện (CSS):

  * [layout.css](file:///c:/Users/ADMIN/Downloads/aitaoanh/css/layout.css) (CSS điều khiển hiển thị Menu di động, chống tràn Tool-popup, thêm thanh cuộn cho thanh nav)
