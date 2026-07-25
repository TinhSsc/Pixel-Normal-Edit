# RULE: QUY TRÌNH TẠO, SỬA ẢNH VÀ TẠO ANIMATION

## 1. Nguyên tắc chung

Mọi thao tác vẽ, sửa ảnh hoặc tạo animation phải được thực hiện theo quy trình tuần tự, có trạng thái rõ ràng.

AI không được tự ý:

* Bỏ qua bước.
* Nhảy sang bước tiếp theo khi bước hiện tại chưa hoàn tất.
* Tự ý tạo ảnh mới trong quy trình sửa ảnh.
* Thay đổi các thành phần không nằm trong phạm vi yêu cầu.
* Ghi đè trạng thái của bước trước nếu chưa hoàn tất hoặc chưa được xác nhận.

Mỗi bước phải được lưu vào trạng thái, ví dụ:

```text
current_mode
current_step
current_layer
current_frame
user_approval_required
step_status
```

Trạng thái mẫu:

```text
current_mode: CREATE_IMAGE
current_step: ANALYZE_REQUEST
current_layer: 0
current_frame: null
step_status: IN_PROGRESS
user_approval_required: false
```

Các trạng thái có thể sử dụng:

```text
PENDING
IN_PROGRESS
WAITING_FOR_USER
COMPLETED
FAILED
CANCELLED
```

---

# 2. TẠO ẢNH MỚI

## Bước 1: Khởi tạo Canvas

Khi người dùng yêu cầu tạo ảnh:

1. Kiểm tra kích thước canvas.
2. Kích thước pixel bắt buộc phải do người dùng cung cấp.
3. Nếu người dùng chưa cung cấp kích thước, phải hỏi lại.
4. Không tự động sử dụng kích thước mặc định 32×32 nếu chưa được người dùng xác nhận.

Ví dụ:

```text
Canvas:
width: [user_input]
height: [user_input]
```

Sau khi nhận được kích thước, tạo canvas mới.

Trạng thái:

```text
current_step: INITIALIZE_CANVAS
step_status: COMPLETED
```

---

## Bước 2: Phân tích yêu cầu

Phân tích yêu cầu của người dùng thành các thành phần có cấu trúc.

Ví dụ:

```text
Subject:
- Cây

Components:
- Thân cây
- Cành cây
- Lá cây
- Hoa/quả

Environment:
- Mặt đất
- Bầu trời
- Vật thể xung quanh

Style:
- Pixel art
- Anime
- Realistic
- ...

Lighting:
- Direction
- Intensity
- Shadow

Composition:
- Position
- Scale
- Perspective
```

Cấu trúc này phải có khả năng mở rộng tùy theo yêu cầu.

Trạng thái:

```text
current_step: ANALYZE_REQUEST
step_status: COMPLETED
```

---

## Bước 3: Lập kế hoạch vẽ

AI phải tạo kế hoạch vẽ theo thứ tự từ tổng thể đến chi tiết.

Ví dụ:

```text
1. Phác thảo bố cục tổng thể.
2. Vẽ background.
3. Vẽ các hình khối chính.
4. Vẽ line hoặc silhouette.
5. Vẽ từng thành phần chính.
6. Thêm màu cơ bản.
7. Thêm ánh sáng và bóng.
8. Thêm chi tiết nhỏ.
9. Kiểm tra tổng thể.
10. Tinh chỉnh.
```

AI phải trả kế hoạch cho người dùng trước khi bắt đầu thực hiện.

Nếu quy trình yêu cầu xác nhận, chuyển sang:

```text
step_status: WAITING_FOR_USER
user_approval_required: true
```

AI chỉ được tiếp tục sau khi người dùng xác nhận.

---

# 3. QUY TẮC VẼ THEO TỪNG GIAI ĐOẠN

AI phải vẽ theo từng giai đoạn, không thực hiện toàn bộ ảnh trong một bước duy nhất.

Thứ tự tổng quát:

```text
PHASE_0: SKETCH / BLOCKING
PHASE_1: BACKGROUND
PHASE_2: MAIN_SHAPES
PHASE_3: LINE / SILHOUETTE
PHASE_4: BASE_COLORS
PHASE_5: SHADING
PHASE_6: LIGHTING
PHASE_7: DETAILS
PHASE_8: FINAL_REVIEW
```

Sau mỗi giai đoạn:

1. Lưu trạng thái.
2. Kiểm tra kết quả.
3. Nếu cần, cung cấp ảnh xem trước hoặc cho phép người dùng sử dụng lệnh xem ảnh.
4. Nếu chưa đạt, tiếp tục chỉnh sửa ở đúng giai đoạn hiện tại.
5. Không được chuyển sang giai đoạn tiếp theo nếu giai đoạn hiện tại chưa hoàn tất.

Ví dụ:

```text
current_step: DRAW_BACKGROUND
step_status: IN_PROGRESS
```

Sau khi hoàn tất:

```text
current_step: DRAW_BACKGROUND
step_status: COMPLETED
```

Sau đó mới được chuyển sang:

```text
current_step: DRAW_MAIN_SHAPES
step_status: IN_PROGRESS
```

---

# 4. QUẢN LÝ LAYER

Layer được sử dụng xuyên suốt toàn bộ quy trình.

Cấu trúc cơ bản:

```text
Layer 0: Background
Layer 1: Main subject
Layer 2: Secondary subject
Layer 3: Details
Layer n: Additional elements
```

Tuy nhiên, layer phải được phân chia theo thành phần cần chỉnh sửa độc lập.

Ví dụ với một cái cây:

```text
Layer 0: Background
Layer 1: Trunk
Layer 2: Branches
Layer 3: Leaves
Layer 4: Fruits
Layer 5: Shadows
Layer 6: Highlights
```

Nguyên tắc:

* Mỗi thành phần có thể chỉnh sửa độc lập nên được đặt trên layer riêng.
* Không gộp nhiều thành phần khác nhau vào cùng một layer nếu việc đó làm mất khả năng chỉnh sửa riêng.
* Khi thêm một thành phần mới, phải xác định layer phù hợp trước khi vẽ.
* Mọi thay đổi phải được ghi nhận vào trạng thái.

Ví dụ:

```text
current_layer: 3
layer_name: Leaves
layer_status: IN_PROGRESS
```

---

# 5. KIỂM TRA VÀ XÁC NHẬN

Sau mỗi giai đoạn, AI phải kiểm tra:

```text
- Đúng yêu cầu người dùng chưa?
- Bố cục có đúng không?
- Tỷ lệ có phù hợp không?
- Layer có đúng không?
- Thành phần có bị ảnh hưởng ngoài phạm vi không?
- Có lỗi phát sinh từ bước trước không?
```

Nếu cần người dùng xác nhận:

```text
step_status: WAITING_FOR_USER
```

AI phải dừng và chờ phản hồi.

Người dùng có thể:

```text
APPROVE
CONTINUE
REVIEW
EDIT
UNDO
REGENERATE_CURRENT_STEP
```

Nếu người dùng yêu cầu chỉnh sửa, chỉ chỉnh sửa bước hoặc layer liên quan, không tự động tạo lại toàn bộ ảnh.

---

# 6. SỬA ẢNH

Quy trình sửa ảnh phải sử dụng ảnh hiện tại làm nguồn gốc.

AI không được tự ý tạo một ảnh mới thay thế ảnh hiện tại.

Quy trình:

```text
1. Nhận yêu cầu sửa.
2. Phân tích chính xác nội dung cần sửa.
3. Lấy ảnh hiện tại.
4. So sánh yêu cầu với ảnh hiện tại.
5. Xác định vùng hoặc layer cần chỉnh sửa.
6. Khoanh vùng khu vực cần sửa.
7. Thực hiện chỉnh sửa trong phạm vi đó.
8. Kiểm tra sự tương thích với môi trường xung quanh.
9. Điều chỉnh phần chuyển tiếp nếu cần.
10. Cập nhật thay đổi vào ảnh hiện tại.
11. Kiểm tra kết quả.
```

Ví dụ:

```text
current_mode: EDIT_IMAGE
target_area: Layer 3 / Leaves
edit_scope: Specific region
```

Nguyên tắc bắt buộc:

* Chỉ sửa phần được yêu cầu.
* Giữ nguyên các phần không liên quan.
* Không tạo lại toàn bộ ảnh.
* Không thay đổi bố cục, phong cách hoặc thành phần khác nếu người dùng không yêu cầu.
* Sau khi sửa phải kiểm tra sự hòa hợp với các vùng xung quanh.

Nếu chỉnh sửa chưa đạt:

```text
current_step: EDIT_TARGET_AREA
step_status: IN_PROGRESS
```

Không được chuyển sang bước khác cho đến khi vùng chỉnh sửa hoàn tất.

---

# 7. TẠO ANIMATION MỚI

Quy trình tạo animation tương tự quy trình tạo ảnh nhưng bổ sung hệ thống frame.

## Bước 1: Khởi tạo

Xác định:

```text
Canvas:
width
height

Animation:
fps
total_frames
loop
```

Nếu người dùng chưa cung cấp thông tin cần thiết, phải hỏi lại.

---

## Bước 2: Phân tích animation

Phân tích:

```text
- Đối tượng.
- Chuyển động.
- Hướng chuyển động.
- Frame bắt đầu.
- Frame kết thúc.
- Các keyframe.
- Các frame trung gian.
- Layer cần sử dụng.
```

Ví dụ:

```text
Frame 0: Initial pose
Frame 1: Movement begins
Frame 2: Mid movement
Frame 3: Peak movement
Frame 4: Return
```

---

## Bước 3: Tạo và xử lý từng frame

Mỗi frame phải được xử lý riêng theo đúng thứ tự:

```text
1. Activate frame.
2. Xác định trạng thái của frame.
3. Xác định layer cần vẽ.
4. Vẽ hoặc chỉnh sửa layer.
5. Kiểm tra tính liên tục với frame trước và sau.
6. Lưu frame.
7. Chuyển sang frame tiếp theo.
```

Ví dụ:

```text
current_frame: 0
current_layer: 1
current_step: DRAW_FRAME
step_status: IN_PROGRESS
```

Chỉ được chuyển sang:

```text
current_frame: 1
```

sau khi frame 0 đã hoàn tất.

---

# 8. KIỂM TRA TÍNH LIÊN TỤC CỦA ANIMATION

Sau khi hoàn thành các frame, phải kiểm tra:

```text
- Vị trí đối tượng có chuyển động liên tục không?
- Layer có nhất quán giữa các frame không?
- Có hiện tượng nhảy hình không?
- Có thay đổi ngoài ý muốn không?
- Bố cục có bị lệch không?
- Chuyển động có đúng yêu cầu không?
```

Nếu phát hiện lỗi, chỉ quay lại frame hoặc layer bị lỗi để sửa.

Không được tạo lại toàn bộ animation nếu chỉ một frame hoặc một layer bị lỗi.

---

# 9. NGUYÊN TẮC TRẠNG THÁI BẮT BUỘC

Mọi thao tác phải tuân theo:

```text
CHECK_CURRENT_STATE
→ EXECUTE_CURRENT_STEP
→ SAVE_STATE
→ VALIDATE_RESULT
→ WAIT_FOR_USER_IF_REQUIRED
→ COMPLETE_CURRENT_STEP
→ MOVE_TO_NEXT_STEP
```

Không được:

```text
CURRENT_STEP
→ SKIP
→ NEXT_STEP
```

Mọi thao tác phải có trạng thái rõ ràng:

```text
mode
step
layer
frame
status
user_approval
history
```

Mục tiêu của hệ thống là đảm bảo toàn bộ quá trình tạo ảnh, sửa ảnh và tạo animation có thể kiểm soát, theo dõi, xem lại và tiếp tục chính xác từ bất kỳ bước nào mà không làm mất trạng thái trước đó.