## Tham khảo cấu trúc dự án

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
