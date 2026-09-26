# Kế hoạch triển khai: Tỷ lệ vùng chọn Main / Ô phụ

> Ngày lập: 25/09/2026  
> Cập nhật: 26/09/2026  
> Trạng thái: đã triển khai và kiểm thử.

## 1. Mục tiêu

Bổ sung một chế độ **Tỷ lệ vùng chọn** cho công cụ chọn vùng trên canvas. Chế độ này cho phép:

1. Kéo ô thứ nhất làm vùng **Main (gốc/chuẩn)**.
2. Kéo ô thứ hai làm **Ô phụ (so sánh)**.
3. Xem kích thước, tổng số pixel và tỷ lệ phần trăm của Ô phụ so với Main.
4. Dùng nhanh các tỷ lệ cạnh phổ biến `1/4`, `1/3`, `1/2`, `2/3`, `3/4`, `1/1`; hoặc tự kéo để chọn đúng vùng cần so.
5. Dùng nút **Chọn tất cả** để lấy toàn bộ canvas làm Main.

Tính năng chỉ đo và hiển thị tỷ lệ; không thay đổi pixel của tác phẩm.

## 2. Quy ước đã xác nhận

- Tỷ lệ `1/2`, `3/4`... áp dụng cho **cả chiều rộng và chiều cao**, không phải trực tiếp cho diện tích.
- Main là mẫu số; Ô phụ là số bị so sánh.
- Một ô canvas tương ứng với một pixel thật của dự án.
- Khi Main = `128 × 72`:
  - `1/2` → Ô phụ `64 × 36` = `2.304 px` = **25% diện tích Main**.
  - `3/4` → Ô phụ `96 × 54` = `5.184 px` = **56,25% diện tích Main**.
- Nếu phép nhân không ra số nguyên, làm tròn từng cạnh và luôn giữ kích thước tối thiểu `1 px`; phần trăm hiển thị phải tính lại từ kích thước thực tế sau làm tròn.

## 3. Công thức

Với Main có kích thước `mainW × mainH` và preset `n/d`:

```text
compareW = max(1, round(mainW × n / d))
compareH = max(1, round(mainH × n / d))
compareX = mainX + floor((mainW - compareW) / 2)
compareY = mainY + floor((mainH - compareH) / 2)

mainArea = mainW × mainH
compareArea = compareW × compareH
areaPercent = compareArea / mainArea × 100
widthPercent = compareW / mainW × 100
heightPercent = compareH / mainH × 100
remainingPixels = mainArea - compareArea
```

Preset được canh giữa trong Main để dễ quan sát. Nếu người dùng không dùng preset, Ô phụ có thể nằm bất kỳ trong canvas.

### 3.1. Pixel tham chiếu cho canvas lớn

Người dùng có thể nhập một kích thước tham chiếu riêng cho Main khi canvas thật lớn hơn nhiều, ví dụ canvas `1800 × 1000` nhưng Main được tính như `128 × 72`.

- Ô nhập rỗng: dùng kích thước vùng chọn thật.
- Có pixel tham chiếu `refW × refH`: Main hiển thị thêm kích thước tham chiếu.
- Ô phụ kéo tay trên canvas được quy đổi theo Main:

```text
virtualCompareW = max(1, round(refW × compareBox.width / mainBox.width))
virtualCompareH = max(1, round(refH × compareBox.height / mainBox.height))
```

- Mọi tỷ lệ %, tổng pixel và chênh lệch pixel dùng kích thước tham chiếu sau khi quy đổi.
- Giao diện vẫn hiển thị cả kích thước thật và kích thước tham chiếu, tránh mất thông tin vùng đang chọn trên canvas.
- Xóa/reset vùng so sánh, đổi tab, đổi kích thước canvas hoặc chuyển frame sẽ xóa pixel tham chiếu.

Ví dụ: canvas `1800 × 1000`, Main thật = toàn canvas, tham chiếu = `128 × 72`, Ô phụ thật = `900 × 500` sẽ được hiển thị là `64 × 36` và `25%` diện tích tham chiếu.

### 3.2. Dải tọa độ ô theo pixel tham chiếu

Panel phải hiển thị rõ dải ô của Main và Ô phụ trong lưới tham chiếu cục bộ. Số thứ tự bắt đầu từ `1`, và số lớn nhất là ô cuối nằm trong vùng chọn.

- Main luôn là gốc `Hàng 1, Cột 1`.
- Main kết thúc tại `Hàng refH, Cột refW`; nếu không có pixel tham chiếu thì dùng kích thước thật của Main.
- Ô phụ được đổi về tọa độ cục bộ của Main:

```text
compareStartRow = round((compareBox.y - mainBox.y) × refH / mainBox.height) + 1
compareStartCol = round((compareBox.x - mainBox.x) × refW / mainBox.width) + 1
compareEndRow = compareStartRow + virtualCompareH - 1
compareEndCol = compareStartCol + virtualCompareW - 1
```

Ví dụ Main tham chiếu `128 × 72` và Ô phụ `64 × 36` canh giữa:

- `Main: từ Hàng 1, Cột 1 → Hàng 72, Cột 128`
- `Ô phụ: từ Hàng 19, Cột 33 → Hàng 54, Cột 96`

Nếu Ô phụ nằm ngoài Main, hệ thống vẫn hiển thị tọa độ tương ứng thay vì tự cắt vào trong Main.

## 4. Luồng tương tác

### 4.1. Bật/tắt

- Thêm nút **Tỷ lệ vùng chọn** trên thanh công cụ gắn trong canvas.
- Khi bật, hệ thống tự chuyển sang công cụ `select` và bắt đầu chọn Main.
- Khi tắt, xóa hai vùng so sánh và trở về chế độ chọn vùng chuẩn.
- Khi đổi sang công cụ khác, tự tắt chế độ để không chặn thao tác vẽ/transform.

### 4.2. Chọn bằng kéo

1. Lần kéo đầu tạo Main.
2. Lần kéo tiếp theo tự động tạo Ô phụ.
3. Sau khi có đủ hai vùng, người dùng bấm thẻ **Main** hoặc **Ô phụ** để chọn vùng cần vẽ lại.
4. Vùng Main được sửa sẽ xóa kết quả Ô phụ cũ vì kết quả cũ không còn đúng.

### 4.3. Chọn nhanh

- **Chọn tất cả**: Main = toàn bộ canvas, sau đó chờ kéo Ô phụ.
- **Pixel tham chiếu**: nhập W×H của Main để tính theo kích thước ảo; có nút áp dụng và xóa.
- Các preset tỷ lệ: tạo trực tiếp Ô phụ từ Main.
- **Đặt lại**: xóa Main, Ô phụ và pixel tham chiếu.
- **Sao chép kết quả**: chép bản tóm tắt kích thước thật, kích thước tham chiếu, pixel và tỷ lệ để dùng cho tài liệu dự án.

## 5. Giao diện kết quả

Bảng nhỏ nằm trong vùng canvas, chỉ hiện khi chế độ đang bật:

- Trạng thái vùng đang kéo: Main hoặc Ô phụ.
- Ô nhập pixel tham chiếu `Main: W × H`, mặc định bỏ trống để dùng kích thước thật.
- Hai thẻ:
  - `Main: W × H — N px` thật.
  - `Main tham chiếu: W × H — N px` nếu có khai báo.
  - `Ô phụ: W × H — N px` thật.
  - `Ô phụ tham chiếu: W × H — N px` nếu có khai báo.
- Kết quả:
  - Dải ô tham chiếu của Main: `từ Hàng 1, Cột 1 → Hàng 72, Cột 128`.
  - Dải ô tham chiếu của Ô phụ: `từ Hàng 19, Cột 33 → Hàng 54, Cột 96`.
  - Tỷ lệ chiều rộng.
  - Tỷ lệ chiều cao.
  - Tỷ lệ diện tích Ô phụ/Main.
  - Số pixel chênh lệch.
- Hướng dẫn ngắn theo trạng thái, ví dụ “Kéo ô thứ nhất để tạo Main”.

Main dùng màu xanh; Ô phụ dùng màu hổ phách để phân biệt ngay trên canvas.

## 6. Kiến trúc triển khai

### Module trạng thái thuần

Tạo `src/features/editor/engine/core/selection-comparison.js` để chứa:

- State: `enabled`, `mainBox`, `compareBox`, `mainReference`, `activeTarget`.
- Các hàm bật/tắt, đặt Main, đặt Ô phụ, đặt/xóa pixel tham chiếu, chọn tất cả, đặt preset, xóa và subscribe.
- Các hàm thuần để tính box theo tỷ lệ và thống kê diện tích.
- Clone object khi trả state ra ngoài để React không bị mutate trực tiếp.

### Tích hợp engine chọn vùng

- `src/features/editor/engine/tools/select.js`
  - Khi chế độ bật, dùng luồng chọn Main/Ô phụ thay cho luồng extract/move thông thường.
  - Khi tắt, giữ nguyên hành vi select cũ.
  - Đồng bộ vùng đang chọn với `selectionBox` hiện tại để các hàm copy/cut cũ không mất trạng thái.
- `src/features/editor/engine/core/render.js`
  - Vẽ đồng thời hai overlay và giữ overlay chuẩn cho chế độ thường.
- `src/features/editor/engine/canvas-events.js`
  - Không để thao tác bấm trong bảng tỷ lệ chạm xuống canvas như một nét vẽ.

### Tích hợp React

- Tạo `src/features/editor/ui/selection/SelectionComparisonPanel.jsx`.
- `src/features/editor/ui/panels/CanvasPanel.jsx`
  - Render panel và nút bật/tắt.
  - Subscribe bằng custom event từ module trạng thái.
  - Xóa dữ liệu so sánh khi đổi tab để không áp dụng nhầm vùng giữa các canvas.
- Thêm style gọn trong `src/styles/global/canvas.css`, tôn trọng giao diện phẳng/mật độ cao của editor.

### Đa ngôn ngữ

- Thêm key vào `src/i18n/convert.js` (master), rồi chạy `node src/i18n/convert.js --sync`.
- Đủ 5 ngôn ngữ: `vi`, `en`, `id`, `ru`, `th`.

## 7. Không nằm trong phạm vi lần này

- Không phân tích số pixel có màu/nội dung; đơn vị là tổng số pixel của hình chữ nhật.
- Không hỗ trợ tỷ lệ độc lập cho từng cạnh trong một preset.
- Không sửa hoặc cắt pixel Main/Ô phụ.
- Không lưu vùng so sánh vào workspace/tab; dữ liệu chỉ tồn tại trong phiên hiện tại.
- Không thêm trình chỉnh sửa dự án hoặc backend mới.

## 8. Kiểm thử và tiêu chí nghiệm thu

### Kiểm thử logic

- Main `128 × 72` + `1/2` → `64 × 36`, `2.304 px`, `25%`.
- Main `128 × 72` + `3/4` → `96 × 54`, `5.184 px`, `56,25%`.
- Main `1 × 1` + `1/4` → vẫn là `1 × 1`, không tạo box 0 px.
- So sánh thủ công bằng kéo có thể nằm ngoài Main nhưng vẫn tính đúng `compareArea / mainArea`.
- Main thật `1800 × 1000`, tham chiếu `128 × 72`, compare thật `900 × 500` → hiển thị tham chiếu `64 × 36`, `2.304 px`, `25%`.
- Bỏ trống pixel tham chiếu → kết quả quay về kích thước thật.
- Main tham chiếu `128 × 72`, Ô phụ `64 × 36` → dải Main `H1/C1 → H72/C128`, dải Ô phụ `H19/C33 → H54/C96`.

### Kiểm thử giao diện

- Bật/tắt không gây lỗi React và trả về đúng chế độ select cũ.
- Main và Ô phụ có màu/nhãn khác nhau, cập nhật liên tục khi kéo.
- Bấm preset, Chọn tất cả, Đặt lại và Sao chép đều cập nhật đúng kết quả.
- Bảng không nhận pointer event của canvas.
- Panel không che toolbar và co lại hợp lý trên màn hình hẹp.

### Lệnh xác minh

```text
node --test tests/selection-ratio.test.mjs
node debug/check-syntax.js
node src/i18n/convert.js --audit
npm run lint
npm run build
```

Ngoài ra kiểm tra thao tác thật trên trình duyệt ở hai kích thước desktop/mobile và với canvas nhỏ nhất `1 × 1`.

## 9. Checklist triển khai

- [x] Viết test logic cho công thức tỷ lệ.
- [x] Tạo module state thuần và xác nhận các ví dụ tính đúng.
- [x] Tích hợp chọn Main/Ô phụ vào selection tool.
- [x] Render hai overlay.
- [x] Thêm panel kết quả, preset, pixel tham chiếu, Chọn tất cả, Đặt lại, Sao chép.
- [x] Hiển thị dải ô H/C theo lưới tham chiếu.
- [x] Đồng bộ đa ngôn ngữ.
- [x] Chạy syntax, i18n audit, lint mục tiêu và build.
- [x] Kiểm tra thao tác thật trên trình duyệt với canvas `128×72` và `1800×1000`.

## 10. Kết quả kiểm tra

- Unit test: `9/9` đạt.
- Quét cú pháp `src/features/editor` và `src/styles`: không có lỗi.
- Audit i18n đủ 5 ngôn ngữ: `0` lỗi; cảnh báo hardcode còn lại là của các file cũ không thuộc tính năng này.
- Lint mục tiêu cho các file mới/sửa trực tiếp: `0` lỗi.
- Build production + SSG + sitemap: thành công.
- Kiểm tra trình duyệt đạt các case `128×72 + 1/2`, `128×72 + 3/4`, và `1800×1000` với tham chiếu `128×72`.
- `npm run lint` toàn repo vẫn báo `19` lỗi cũ nằm trong `dispatchTool`/`editor-api`; không phát sinh lỗi mới từ tính năng này.
