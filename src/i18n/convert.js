/**
 * ============================================================================
 *  I18N MASTER TOOL — TRA CỨU & ĐỒNG BỘ NGÔN NGỮ (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 *
 *  📌 MỤC ĐÍCH (DÀNH CHO AI VÀ DEVELOPER):
 *   - Đây là FILE DUY NHẤT cần đọc để tra cứu mọi chuỗi i18n của dự án.
 *   - KHÔNG cần mở `en.js` / `vi.js` (mỗi file ~1000 dòng) — TẤT CẢ key + bản
 *     dịch EN/VI đều nằm ngay trong object `MASTER` ở phần [GENERATED MASTER].
 *
 *  🔎 CÁCH TRA CỨU (AI / Developer):
 *   - Muốn biết một key dịch ra sao: Ctrl+F tìm `"tên.key"` trong file này.
 *       VD: tìm `"convert.filenameSuffix"` → thấy ngay EN + VI trên 1 dòng.
 *   - Nếu KHÔNG thấy key → key đó CHƯA TỒN TẠI trong hệ thống → cần thêm mới
 *     (xem quy trình bên dưới).
 *   - Khi một key như 'some.key' được gọi trong source code mà không có trong
 *     MASTER → key thiếu, cần bổ sung. Lệnh `--lookup` / `--audit` sẽ chỉ ra chính xác.
 *
 *  ➕ CÁCH THÊM KEY MỚI (QUY TRÌNH CHUẨN — BẮT BUỘC LÀM THEO):
 *   1. Thêm 1 dòng vào object `MASTER` (phần [GENERATED MASTER]):
 *        "module.keyName": { en: "English text", vi: "Tiếng Việt" },
 *      ⚠️ PHẢI ghi đủ CẢ `en` VÀ `vi` (script dùng cả 2 để ghi vào 2 file).
 *   2. Chạy lệnh:   node src/i18n/convert.js --sync
 *   3. Script tự ghi key mới vào cả `en.js` lẫn `vi.js`.
 *   4. (Khuyến nghị) chạy `--audit` để xác nhận không còn lỗi.
 *
 *  🛠️  DANH SÁCH LỆNH (chạy từ thư mục gốc dự án):
 *    node src/i18n/convert.js                  → Đồng bộ (sync) + Audit đầy đủ
 *    node src/i18n/convert.js --sync           → Chỉ đồng bộ: thêm key thiếu vào en/vi.js
 *    node src/i18n/convert.js --audit          → Chỉ audit: báo cáo toàn diện
 *    node src/i18n/convert.js --lookup <key>   → Tra 1 key: EN/VI + nơi dùng trong source
 *    node src/i18n/convert.js --search <text>  → Tìm key có chứa text (theo EN hoặc VI)
 *    node src/i18n/convert.js --list           → Thống kê số key theo từng module/prefix
 *    node src/i18n/convert.js --refresh        → TÁI TẠO lại MASTER từ en.js/vi.js hiện tại
 *                                               (chỉ dùng khi 2 file đó bị sửa tay bên ngoài)
 *    node src/i18n/convert.js --sync --force   → Ghi đè giá trị lệch (MASTER là chuẩn)
 *    node src/i18n/convert.js --sync --prune   → Xóa key có trong en/vi.js nhưng không có trong MASTER
 *
 *  🔒 NGUYÊN TẮC QUAN TRỌNG:
 *   - `en.js` / `vi.js` là file PHÁT SINH (generated) → KHÔNG sửa tay.
 *   - Mọi thay đổi bản dịch phải thực hiện trong `MASTER` rồi chạy `--sync`.
 *   - `--refresh` chỉ nên dùng khi người khác đã sửa trực tiếp en.js/vi.js.
 * ============================================================================
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderPath = __dirname;
const srcPath = path.resolve(__dirname, '..');
const EN_FILE = path.join(folderPath, 'en.js');
const VI_FILE = path.join(folderPath, 'vi.js');

// ==========================================
// 0. CLI ARGS
// ==========================================
const args = process.argv.slice(2);
const opt = {
  force: args.includes('--force'),
  prune: args.includes('--prune'),
};
let action = 'all';
if (args.includes('--sync')) action = 'sync';
else if (args.includes('--audit')) action = 'audit';
else if (args.includes('--refresh')) action = 'refresh';
else if (args.includes('--list')) action = 'list';
const lookupIdx = args.indexOf('--lookup');
if (lookupIdx !== -1) { action = 'lookup'; opt.key = args[lookupIdx + 1]; }
const searchIdx = args.indexOf('--search');
if (searchIdx !== -1) { action = 'search'; opt.text = args[searchIdx + 1]; }

// ==========================================
// 0.5. PRINT HELPERS
// ==========================================
function printBox(title) {
  const width = 64;
  const pad = Math.max(0, width - title.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  console.log("╔" + "═".repeat(width) + "╗");
  console.log("║" + " ".repeat(left) + title + " ".repeat(right) + "║");
  console.log("╚" + "═".repeat(width) + "╝");
}

function printSection(title) {
  console.log("\n── " + title + " " + "─".repeat(Math.max(0, 52 - title.length)));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescapeJsonString(inner) {
  try { return JSON.parse('"' + inner + '"'); } catch { return inner; }
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isMeaningfulText(text) {
  return !!text && /[a-zA-ZÀ-ỹ]/.test(text) &&
    !/^[0-9\s!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]+$/.test(text);
}

// Các token "thương hiệu / tên riêng" cố định — không phải nội dung cần dịch.
const BRAND_TOKENS = new Set([
  'Pixel Normal Edit', 'Pixel Normal Edit.', 'Pixel Editor', 'ImgTools', 'Ko-fi', 'Avatar',
]);

function isBrandToken(text) {
  const t0 = text.trim();
  return BRAND_TOKENS.has(t0) || t0.toLowerCase().startsWith('pixel normal edit');
}

// Văn bản có cấu trúc code (biểu thức JS bị lẫn vào JSX) — KHÔNG phải text hiển thị.
function looksLikeCode(text) {
  return /[{}]/.test(text)
    || /(^|\s)(return|if|else|for|while|const|let|var|function|=>|&&|\|\||\?\?|\?\.|===|!==|\.length|\.push|\.map|\.filter|\.includes|\.slice|\.split|Math\.|oldSize|nx|ny|maxX|maxY)\b/.test(text)
    || /^[)\]=]/.test(text)
    || /^\d+[);,]/.test(text)
    || /\b\w+\([^)]*\)/.test(text)
    || /;\s*$/.test(text)
    || /\b(undefined|null|NaN|setError|chunks|recorder|frameDelay)\b/.test(text);
}

// Chuỗi dạng kích thước / số liệu: "32x32", "1920×1080", "1 (chậm)"...
function isDimensionLike(text) {
  return /^[\d\sx×.,/:~\-–]+$/i.test(text) || /^\d+\s*[x×]\s*\d+$/.test(text);
}

// Kiểm tra chuỗi giá trị có đúng bằng 1 i18n key đang tồn tại (dạng `prefix.name`)
function isExistingKeyLiteral(text) {
  return /^[a-z][a-zA-Z0-9]*\.[a-zA-Z0-9_.]+$/.test(text) && (text in enData);
}

// Kiểm tra object đang chứa cặp `*Key:` (dạng fallback `label` + `labelKey`)
// hoặc cặp `key:` + `label:` (config dùng t(key))
function hasKeyFallback(content, idx) {
  const start = content.lastIndexOf('{', idx);
  const end = content.indexOf('}', idx);
  if (start === -1 || end === -1) return false;
  const win = content.slice(start, end);
  return /\b\w+Key\s*:\s*['"`][^'"]+['"`]/.test(win)
    || /\bkey\s*:\s*['"`][^'"]+['"`]/.test(win);
}

// Match nằm trong dòng comment `//` → false positive (văn bản bị lẫn trong comment)
function inLineComment(content, idx) {
  const lineStart = content.lastIndexOf('\n', idx);
  const before = content.slice(lineStart + 1, idx);
  const c = before.indexOf('//');
  if (c !== -1 && !before.slice(0, c).includes('"') && !before.slice(0, c).includes("'")) return true;
  return false;
}

// Các prefix key được resolve ĐỘNG lúc runtime (t(prefix + '.' + biến)) mà scanner
// không nhìn thấy hết được — đây là các prefix ĐANG thực sự được dùng.
const KNOWN_DYNAMIC_PREFIXES = [
  'tool.', 'action.', 'anim.', 'layer.', 'transform.', 'mode.', 'zoom.',
  'registry.', 'home.tool.', 'group.', 'shortcuts.cat.',
  'toolVariant.', 'canvas.mode.',
];

// ==========================================
// 1. LOAD CURRENT DICTIONARIES (en.js / vi.js)
// ==========================================
// Dùng dynamic import kèm timestamp để luôn nạp bản mới nhất vừa được ghi file.
const { default: enData } = await import(`./en.js?t=${Date.now()}`);
const { default: viData } = await import(`./vi.js?t=${Date.now()}`);
const enKeys = Object.keys(enData);
const viKeys = Object.keys(viData);

// >>>>>>>>>> BEGIN MASTER (GENERATED - 1033 keys - do not edit manually, use --refresh) <<<<<<<<<<
const MASTER = {
  "action.copy": { en: "Copy", vi: "Sao chép" },
  "action.cut": { en: "Cut", vi: "Cắt" },
  "action.delete": { en: "Delete", vi: "Xóa" },
  "action.deselect": { en: "Deselect", vi: "Bỏ chọn" },
  "action.export": { en: "Export", vi: "Xuất file" },
  "action.newCanvas": { en: "New Canvas", vi: "Canvas mới" },
  "action.paste": { en: "Paste", vi: "Dán" },
  "action.quickSave": { en: "Quick Save", vi: "Lưu nhanh" },
  "action.redo": { en: "Redo", vi: "Làm lại" },
  "action.saveAs": { en: "Save As", vi: "Lưu dưới dạng" },
  "action.selectAll": { en: "Select All", vi: "Chọn tất cả" },
  "action.settings": { en: "Settings", vi: "Cài đặt" },
  "action.swapColors": { en: "Swap Colors", vi: "Đảo màu" },
  "action.undo": { en: "Undo", vi: "Hoàn tác" },
  "alt.oldCanvas": { en: "Old canvas", vi: "Canvas cũ" },
  "anim.addFrame": { en: "Add Frame", vi: "Thêm frame" },
  "anim.deleteFrame": { en: "Delete Frame", vi: "Xóa frame" },
  "anim.firstFrame": { en: "First Frame", vi: "Frame đầu" },
  "anim.lastFrame": { en: "Last Frame", vi: "Frame cuối" },
  "anim.nextFrame": { en: "Next Frame", vi: "Frame sau" },
  "anim.playPause": { en: "Play/Pause", vi: "Phát/Dừng" },
  "anim.prevFrame": { en: "Previous Frame", vi: "Frame trước" },
  "app.desc": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit" },
  "app.logoAlt": { en: "Pixel Normal Edit Logo", vi: "Pixel Normal Edit Logo" },
  "app.mcpStatusTitle": { en: "MCP Status", vi: "Trạng thái MCP" },
  "app.mcpWaiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối..." },
  "app.title": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit" },
  "auth.alreadyHaveAccount": { en: "Already have an account? Login", vi: "Đã có tài khoản? Đăng nhập" },
  "auth.backToLogin": { en: "Back to login", vi: "Quay lại đăng nhập" },
  "auth.continueWithGoogle": { en: "Continue with Google", vi: "Tiếp tục với Google" },
  "auth.createAccount": { en: "Create account", vi: "Tạo tài khoản" },
  "auth.email": { en: "Email", vi: "Email" },
  "auth.emailLabel": { en: "Email", vi: "Email" },
  "auth.errDefault": { en: "An error occurred", vi: "Có lỗi xảy ra" },
  "auth.errEmailInUse": { en: "This email is already in use.", vi: "Email này đã được sử dụng." },
  "auth.errEmailOrPassword": { en: "Incorrect email or password.", vi: "Email hoặc mật khẩu không chính xác." },
  "auth.errGoogleCancelled": { en: "Google sign-in was cancelled.", vi: "Đăng nhập bằng Google đã bị hủy." },
  "auth.errInvalidEmail": { en: "Invalid email format.", vi: "Định dạng email không hợp lệ." },
  "auth.errWeakPassword": { en: "Password is too weak, please choose a stronger one.", vi: "Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn." },
  "auth.forgotDesc": { en: "Enter your account email, we will send a link to reset your password.", vi: "Nhập email tài khoản của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu." },
  "auth.forgotPassword": { en: "Forgot password?", vi: "Quên mật khẩu?" },
  "auth.forgotPasswordDesc": { en: "Enter your account email, we will send a link to reset password.", vi: "Nhập email tài khoản của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu." },
  "auth.forgotPasswordTitle": { en: "Forgot Password", vi: "Quên mật khẩu" },
  "auth.forgotSuccess": { en: "Password reset email sent. Please check your inbox.", vi: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn." },
  "auth.forgotTitle": { en: "Forgot Password", vi: "Quên mật khẩu" },
  "auth.fullNameLabel": { en: "Full Name", vi: "Họ tên" },
  "auth.google": { en: "Continue with Google", vi: "Tiếp tục với Google" },
  "auth.loginBtn": { en: "Login", vi: "Đăng nhập" },
  "auth.loginTitle": { en: "Log In", vi: "Đăng nhập" },
  "auth.loginToSync": { en: "Please login to sync", vi: "Vui lòng đăng nhập để đồng bộ" },
  "auth.logout": { en: "Logout", vi: "Đăng xuất" },
  "auth.name": { en: "Full Name", vi: "Họ tên" },
  "auth.notLoggedIn": { en: "Not logged in", vi: "Chưa đăng nhập" },
  "auth.or": { en: "or", vi: "hoặc" },
  "auth.password": { en: "Password", vi: "Mật khẩu" },
  "auth.passwordLabel": { en: "Password", vi: "Mật khẩu" },
  "auth.registerBtn": { en: "Register", vi: "Đăng ký" },
  "auth.registerTitle": { en: "Register", vi: "Đăng ký" },
  "auth.resetEmailSent": { en: "Password reset email sent. Please check your inbox.", vi: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn." },
  "auth.sendLink": { en: "Send reset link", vi: "Gửi link khôi phục" },
  "auth.sending": { en: "Sending...", vi: "Đang gửi..." },
  "auth.title": { en: "Login", vi: "Đăng nhập" },
  "btn.apply": { en: "Apply", vi: "Áp dụng" },
  "btn.cancel": { en: "Cancel", vi: "Hủy" },
  "btn.copied": { en: "Copied!", vi: "Đã copy!" },
  "btn.copy": { en: "Copy", vi: "Copy" },
  "btn.copyMcpCmd": { en: "Copy MCP Command", vi: "Copy lệnh chạy MCP" },
  "btn.delete": { en: "Delete", vi: "Xóa" },
  "btn.saveAs": { en: "Save As...", vi: "Lưu dưới dạng..." },
  "btn.stopTask": { en: "Stop", vi: "Dừng" },
  "btn.upload": { en: "Upload", vi: "Tải lên" },
  "canvas.checkerColor": { en: "Checkerboard color", vi: "Màu checkerboard" },
  "canvas.checkerSize": { en: "Checkerboard size", vi: "Kích thước checkerboard" },
  "canvas.checkerboard": { en: "Checkerboard", vi: "Checkerboard (Nền ô vuông)" },
  "canvas.custom": { en: "Custom", vi: "Tùy chỉnh" },
  "canvas.default": { en: "Default", vi: "Mặc định" },
  "canvas.mode": { en: "Mode", vi: "Chế độ" },
  "canvasHelper.readError": { en: "Cannot read image file", vi: "Không thể đọc file ảnh" },
  "compress.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "compress.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)" },
  "compress.after": { en: "After:", vi: "Sau nén:" },
  "compress.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "compress.compressNow": { en: "Compress {0} images now", vi: "Nén {0} ảnh ngay" },
  "compress.compressing": { en: "Compressing...", vi: "Đang nén..." },
  "compress.desc": { en: "Reduce file size while maintaining quality. Export ZIP when multiple images are selected.", vi: "Giảm dung lượng file mà vẫn giữ chất lượng. Xuất file ZIP khi chọn nhiều ảnh." },
  "compress.done": { en: "✓ Done — Saved {0}%", vi: "✓ Nén xong — Tiết kiệm {0}%" },
  "compress.download": { en: "Download", vi: "Tải về" },
  "compress.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về" },
  "compress.downloadZip": { en: "Download ZIP", vi: "Tải file ZIP" },
  "compress.drop.button": { en: "Choose images", vi: "Chọn ảnh" },
  "compress.drop.desc": { en: "Select multiple images at once to batch compress", vi: "Chọn nhiều ảnh cùng lúc để nén hàng loạt" },
  "compress.drop.support": { en: "Supported: PNG, JPG, WebP, GIF, BMP", vi: "Hỗ trợ: PNG, JPG, WebP, GIF, BMP" },
  "compress.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây" },
  "compress.error.compress": { en: "Image compression error: {0}", vi: "Lỗi nén ảnh: {0}" },
  "compress.error.needAdvanced": { en: "File \"{0}\" requires Advanced Mode to be enabled to read.", vi: "File \"{0}\" yêu cầu bật Chế độ Nâng cao để đọc." },
  "compress.fileList": { en: "Image list", vi: "Danh sách ảnh" },
  "compress.fileSize": { en: "file size", vi: "dung lượng" },
  "compress.filename": { en: "compressed", vi: "compressed" },
  "compress.maxSize": { en: "Max file size (MB)", vi: "Dung lượng tối đa (MB)" },
  "compress.mode": { en: "Compression mode", vi: "Chế độ nén" },
  "compress.modeCustom": { en: "Custom", vi: "Tùy chỉnh" },
  "compress.modeHigh": { en: "High", vi: "Cao" },
  "compress.modeLow": { en: "Low", vi: "Thấp" },
  "compress.modeMedium": { en: "Medium", vi: "Vừa" },
  "compress.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "compress.nav.home": { en: "Home", vi: "Trang chủ" },
  "compress.original": { en: "Original:", vi: "Gốc:" },
  "compress.processed": { en: "✓ Processed", vi: "✓ Đã xử lý" },
  "compress.quality": { en: "Quality", vi: "Chất lượng" },
  "compress.title": { en: "Compress images", vi: "Nén ảnh hàng loạt" },
  "compress.warning.largeImage": { en: "Warning: \"{0}\" is very large ({1}x{2}), may cause slowness.", vi: "Cảnh báo: \"{0}\" rất lớn ({1}x{2}), có thể gây chậm." },
  "compress.zipName": { en: "compressed_images.zip", vi: "compressed_images.zip" },
  "confirm.closeTab": { en: "Are you sure you want to close this tab? Unsaved changes will be lost.", vi: "Bạn có chắc muốn đóng tab này? Dữ liệu chưa lưu sẽ bị mất." },
  "confirm.deleteFrame": { en: "Delete this frame? Frame data will be lost.", vi: "Xóa trang này? Dữ liệu của trang sẽ mất." },
  "confirm.deleteFrameMsg": { en: "Are you sure you want to delete frame {0}?", vi: "Bạn có chắc chắn muốn xóa trang {0} không?" },
  "confirm.deleteMultipleFrames": { en: "Are you sure you want to delete the {0} selected frames?", vi: "Bạn có chắc muốn xóa {0} frame đang chọn không?" },
  "confirm.deleteTitle": { en: "Confirm Delete", vi: "Xác nhận xóa" },
  "confirm.dontAskAgain": { en: "Don't ask again (for 2 hours)", vi: "Không nhắc lại (trong 2 giờ)" },
  "confirm.leave": { en: "Are you sure you want to navigate away? Unsaved drawing data will be lost!", vi: "Bạn có chắc chuyển sang nơi khác? Mọi dữ liệu bản vẽ chưa lưu sẽ bị mất!" },
  "confirm.newCanvas": { en: "Are you sure you want to create a new canvas? Current data will be lost!", vi: "Bạn có chắc muốn tạo trang mới? Mọi dữ liệu hiện tại sẽ bị mất!" },
  "confirm.resetAllData": { en: "Are you sure you want to reset all data? This action cannot be undone!", vi: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác!" },
  "convert.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "convert.advancedMode": { en: "Advanced Mode (TIFF, HEIC, AVIF, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, AVIF, RAW...)" },
  "convert.animationMode": { en: "Open as Animation", vi: "Mở gộp thành Ảnh động (Animation)" },
  "convert.buttons.chooseOther": { en: "Choose another image", vi: "Chọn ảnh khác" },
  "convert.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "convert.controls.download": { en: "Download", vi: "Tải về" },
  "convert.controls.downloadZip": { en: "Download ZIP", vi: "Tải file ZIP" },
  "convert.controls.openEditor": { en: "Open in Editor", vi: "Mở trong Editor" },
  "convert.controls.outputFormat": { en: "Output format", vi: "Định dạng đầu ra" },
  "convert.controls.quality": { en: "Quality", vi: "Chất lượng" },
  "convert.error.needAdvanced": { en: "File \"{0}\" requires Advanced Mode to be enabled.", vi: "File \"{0}\" yêu cầu bật Chế độ Nâng cao." },
  "convert.error.unsupportedFile": { en: "Unsupported file: {0}", vi: "File không được hỗ trợ: {0}" },
  "convert.errors.fileTooLarge": { en: "File too large", vi: "File quá lớn" },
  "convert.errors.imageTooLarge": { en: "Image too large", vi: "Ảnh quá lớn" },
  "convert.errors.noImageToDownload": { en: "No image to download", vi: "Chưa có ảnh để tải" },
  "convert.errors.unsupportedFile": { en: "Unsupported file", vi: "File không được hỗ trợ" },
  "convert.filename": { en: "converted", vi: "converted" },
  "convert.filenameSuffix": { en: "_converted.", vi: "_converted." },
  "convert.hero.desc": { en: "Easily batch convert between PNG, JPG, WebP, HEIC, JXL and more. Support multiple files and ZIP export. Processing happens right in your browser.", vi: "Dễ dàng chuyển đổi hàng loạt (Batch) qua lại giữa PNG, JPG, WebP, HEIC, JXL và hàng chục định dạng khác. Hỗ trợ nhiều file và xuất file ZIP. Quá trình xử lý diễn ra ngay trên trình duyệt." },
  "convert.hero.title": { en: "Instant image conversion", vi: "Chuyển đổi hình ảnh tức thì" },
  "convert.multiTab": { en: "Open as multiple tabs", vi: "Mở thành nhiều Tabs" },
  "convert.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "convert.preview.alt": { en: "Preview", vi: "Preview" },
  "convert.preview.title": { en: "Image preview", vi: "Xem trước ảnh" },
  "convert.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "convert.sending": { en: "Sending...", vi: "Đang gửi..." },
  "convert.upload.button": { en: "Choose image", vi: "Chọn ảnh" },
  "convert.upload.dragDrop": { en: "Drag and drop image here", vi: "Kéo thả ảnh vào đây" },
  "convert.upload.orClick": { en: "or click to browse files on your device", vi: "hoặc click để duyệt file trên thiết bị của bạn" },
  "convert.upload.support": { en: "Supported: PNG, JPG, WebP, SVG, HEIC...", vi: "Hỗ trợ: PNG, JPG, WebP, SVG, HEIC..." },
  "convert.warning.largeImage": { en: "Warning: Image \"{0}\" is very large ({1}x{2}), may slow down the browser.", vi: "Cảnh báo: Ảnh \"{0}\" có kích thước rất lớn ({1}x{2}), có thể gây chậm trình duyệt." },
  "convert.zipName": { en: "converted_images.zip", vi: "converted_images.zip" },
  "crop.apply": { en: "Apply", vi: "Áp dụng" },
  "crop.cancel": { en: "Cancel", vi: "Hủy" },
  "crop.ratioFree": { en: "Free", vi: "Tự do" },
  "crop.title": { en: "Crop Image", vi: "Cắt ảnh (Crop)" },
  "cropPage.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "cropPage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)" },
  "cropPage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "cropPage.desc": { en: "Crop multiple images at once with the same ratio. Export ZIP when multiple images are selected.", vi: "Cắt nhiều ảnh cùng lúc với cùng tỷ lệ. Xuất file ZIP khi chọn nhiều ảnh." },
  "cropPage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về" },
  "cropPage.drop.button": { en: "Choose images", vi: "Chọn ảnh" },
  "cropPage.drop.desc": { en: "Select multiple images at once to batch crop", vi: "Chọn nhiều ảnh cùng lúc để cắt hàng loạt" },
  "cropPage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây" },
  "cropPage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "cropPage.nav.home": { en: "Home", vi: "Trang chủ" },
  "cropPage.processed": { en: "✓ Processed", vi: "✓ Đã xử lý" },
  "cropPage.ratio": { en: "Aspect ratio", vi: "Tỷ lệ khung hình" },
  "cropPage.ratioFree": { en: "Free", vi: "Tự do" },
  "cropPage.title": { en: "Crop images", vi: "Cắt ảnh hàng loạt" },
  "download.animMode": { en: "Animation mode", vi: "Chế độ ảnh động" },
  "download.assetsTitle": { en: "Select Assets", vi: "Chọn tài nguyên" },
  "download.cancel": { en: "Cancel", vi: "Hủy thao tác" },
  "download.destination": { en: "Destination", vi: "Nơi lưu" },
  "download.drive": { en: "Google Drive", vi: "Google Drive" },
  "download.execute": { en: "Download Now", vi: "Tiến hành tải xuống" },
  "download.exportMode": { en: "Export Mode", vi: "Chế độ xuất" },
  "download.format": { en: "Format", vi: "Định dạng" },
  "download.formatGif": { en: "GIF (Animated GIF)", vi: "GIF (Ảnh động GIF)" },
  "download.formatJpg": { en: "JPG (JPEG image)", vi: "JPG (Ảnh JPEG)" },
  "download.formatJson": { en: "JSON (Save Project)", vi: "JSON (Lưu Project)" },
  "download.formatPng": { en: "PNG (Transparent image)", vi: "PNG (Ảnh trong suốt)" },
  "download.formatSprite": { en: "SpriteSheet (Combined image)", vi: "SpriteSheet (Ảnh ghép)" },
  "download.formatWebm": { en: "WebM (Video)", vi: "WebM (Video)" },
  "download.formatWebp": { en: "WebP (Lightweight image)", vi: "WebP (Ảnh nén nhẹ)" },
  "download.formatZip": { en: "ZIP (Save Frames)", vi: "ZIP (Lưu các Frame)" },
  "download.local": { en: "Save to device", vi: "Lưu vào máy" },
  "download.noCanvasSelected": { en: "Please select at least one canvas!", vi: "Vui lòng chọn ít nhất 1 canvas để tải!" },
  "download.selectAll": { en: "Select All", vi: "Chọn tất cả" },
  "download.staticMode": { en: "Static image mode", vi: "Chế độ ảnh tĩnh" },
  "download.statusReady": { en: "Ready", vi: "Sẵn sàng" },
  "download.step1": { en: "1. Select file (Canvas)", vi: "1. Chọn tệp (Canvas)" },
  "download.step2": { en: "2. Export Format", vi: "2. Định dạng xuất" },
  "download.step3": { en: "3. Save Location", vi: "3. Nơi lưu trữ" },
  "download.step4": { en: "Step 4: Execute", vi: "4. Tiến hành tải" },
  "download.success": { en: "Downloaded {0} files!", vi: "Đã tải thành công {0} tệp!" },
  "download.transparent": { en: "Transparent Background", vi: "Nền Trong Suốt" },
  "download.transparentDesc": { en: "Keep empty areas transparent", vi: "Giữ các vùng trong suốt" },
  "downloadButton.noImage": { en: "No image to download yet", vi: "Chưa có ảnh để tải" },
  "drive.disconnectedTitle": { en: "Disconnected from Google Drive", vi: "Chưa kết nối Google Drive" },
  "drive.errDownload": { en: "Download error", vi: "Lỗi tải xuống" },
  "drive.errDownloadImage": { en: "Image download error", vi: "Lỗi tải ảnh" },
  "drive.errInit": { en: "Google Identity Services failed to initialize.", vi: "Google Identity Services failed to initialize." },
  "drive.errListFiles": { en: "Error listing files", vi: "Lỗi danh sách tệp" },
  "drive.errLoadingApi": { en: "Loading API library, please try again later.", vi: "Đang tải thư viện API, vui lòng thử lại sau." },
  "drive.errMissingApiKey": { en: "Missing VITE_GOOGLE_API_KEY config in .env", vi: "Thiếu cấu hình VITE_GOOGLE_API_KEY trong .env" },
  "drive.errMissingClientId": { en: "Missing VITE_GOOGLE_CLIENT_ID in .env", vi: "Missing VITE_GOOGLE_CLIENT_ID in .env" },
  "drive.errNotLoggedIn": { en: "Not logged in to Google Drive", vi: "Chưa đăng nhập Google Drive" },
  "drive.errSessionExpired": { en: "Google Drive session expired. Please log in again.", vi: "Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại." },
  "drive.errUpload": { en: "Upload error", vi: "Lỗi tải lên" },
  "drive.imageLoaded": { en: "Opened image: {0}", vi: "Đã mở ảnh: {0}" },
  "drive.loadingList": { en: "Loading list...", vi: "Đang tải danh sách..." },
  "drive.login": { en: "Connect Drive", vi: "Kết nối Drive" },
  "drive.loginRequired": { en: "Login to Google Drive to select images", vi: "Bạn cần đăng nhập Google Drive để chọn ảnh" },
  "drive.logout": { en: "Disconnect Google Drive", vi: "Ngắt kết nối Google Drive" },
  "drive.noFiles": { en: "No files found on Drive", vi: "Không tìm thấy file nào trên Drive" },
  "drive.openPicker": { en: "Browse entire Drive...", vi: "Duyệt toàn bộ Drive..." },
  "drive.projectLoaded": { en: "Opened project: {0}", vi: "Đã mở dự án: {0}" },
  "drive.sectionTitle": { en: "Google Drive", vi: "Google Drive" },
  "driveUi.thumbnailError": { en: "Thumbnail load error: {0}", vi: "Lỗi tải thumbnail: {0}" },
  "driveUi.unsupportedFormat": { en: "Unsupported format", vi: "Định dạng không hỗ trợ" },
  "dropdown.select": { en: "Select...", vi: "Chọn..." },
  "errorBoundary.retry": { en: "Try again", vi: "Thử lại" },
  "errorBoundary.title": { en: "Something went wrong", vi: "Có lỗi xảy ra" },
  "exportAnim.gifError": { en: "Error creating GIF: {0}", vi: "Lỗi khi tạo GIF: {0}" },
  "exportAnim.loadGifLibError": { en: "Error loading GIF library: {0}", vi: "Lỗi khi tải thư viện GIF: {0}" },
  "exportAnim.noData": { en: "No animation data to export.", vi: "Không có dữ liệu ảnh động để xuất." },
  "exportAnim.spriteSheetError": { en: "Export SpriteSheet Error: {0}", vi: "Export SpriteSheet Error: {0}" },
  "exportAnim.unsupportedFormat": { en: "Unsupported format.", vi: "Định dạng không được hỗ trợ." },
  "exportAnim.zipError": { en: "Export ZIP Error: {0}", vi: "Export ZIP Error: {0}" },
  "fileUploader.drop": { en: "Drag & drop images here or click to select", vi: "Kéo thả ảnh vào đây hoặc click để chọn" },
  "fileUploader.support": { en: "Supported: PNG, JPG, WebP, GIF, BMP, SVG, HEIC", vi: "Hỗ trợ: PNG, JPG, WebP, GIF, BMP, SVG, HEIC" },
  "format.gif": { en: "GIF (Animation)", vi: "GIF (Ảnh động)" },
  "format.gifDesc": { en: "Animated GIF format", vi: "Định dạng ảnh động GIF" },
  "format.jpg": { en: "JPG", vi: "JPG" },
  "format.jpgDesc": { en: "Smaller file, no transparency", vi: "File nhỏ hơn, không nền trong suốt" },
  "format.json": { en: "JSON", vi: "JSON" },
  "format.jsonDesc": { en: "Project file (editable)", vi: "File dự án (có thể sửa lại)" },
  "format.png": { en: "PNG", vi: "PNG" },
  "format.pngDesc": { en: "High quality, transparent bg", vi: "Chất lượng cao, nền trong suốt" },
  "format.spriteDesc": { en: "All frames in one image", vi: "Tất cả các frame trên 1 ảnh" },
  "format.spritesheet": { en: "Sprite Sheet", vi: "Sprite Sheet" },
  "format.webm": { en: "WebM (Video)", vi: "WebM (Video)" },
  "format.webmDesc": { en: "High quality animated video", vi: "Video động chất lượng cao" },
  "format.webp": { en: "WEBP", vi: "WEBP" },
  "format.webpDesc": { en: "Best size/quality ratio", vi: "Tỷ lệ dung lượng/chất lượng tốt nhất" },
  "format.zip": { en: "ZIP Frames", vi: "ZIP Frames" },
  "format.zipDesc": { en: "Each frame as PNG in ZIP", vi: "Mỗi frame là 1 PNG trong ZIP" },
  "framesToMedia.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "framesToMedia.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "framesToMedia.desc": { en: "Convert Video → GIF, GIF → Video, or combine images into GIF/WebM.", vi: "Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM." },
  "framesToMedia.download": { en: "Download", vi: "Tải về" },
  "framesToMedia.drop.button": { en: "Choose images", vi: "Chọn ảnh" },
  "framesToMedia.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây" },
  "framesToMedia.fps": { en: "FPS", vi: "FPS" },
  "framesToMedia.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "framesToMedia.nav.home": { en: "Home", vi: "Trang chủ" },
  "framesToMedia.outputFormat": { en: "Output format", vi: "Định dạng đầu ra" },
  "framesToMedia.processed": { en: "✓ Processed", vi: "✓ Đã xử lý" },
  "framesToMedia.title": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video" },
  "gifSimplify.changeFile": { en: "Change file", vi: "Đổi file" },
  "gifSimplify.completed": { en: "Completed!", vi: "Hoàn thành!" },
  "gifSimplify.creating": { en: "Creating {0}...", vi: "Đang tạo {0}..." },
  "gifSimplify.desc": { en: "Upload a GIF or video, choose the reduction level. The tool keeps 1 in every N frames, then exports a lighter GIF or a faster WebM.", vi: "Tải GIF hoặc video, chọn mức giảm, tool sẽ giữ 1 trong mỗi N frame rồi xuất GIF nhẹ hơn hoặc WebM chạy nhanh hơn." },
  "gifSimplify.download": { en: "Download {0}", vi: "Tải về {0}" },
  "gifSimplify.drop.button": { en: "Choose file", vi: "Chọn file" },
  "gifSimplify.drop.support": { en: "Supported: GIF · MP4 · WebM · MOV", vi: "Hỗ trợ: GIF · MP4 · WebM · MOV" },
  "gifSimplify.drop.title": { en: "Drag & drop GIF or Video here", vi: "Kéo thả GIF hoặc Video vào đây" },
  "gifSimplify.error.minFrames": { en: "Need at least 2 frames.", vi: "Cần ít nhất 2 frame." },
  "gifSimplify.error.noFramesLeft": { en: "No frames left after reduction.", vi: "Không còn frame nào sau khi giảm." },
  "gifSimplify.error.render": { en: "Render error: {0}", vi: "Lỗi render: {0}" },
  "gifSimplify.fast": { en: "Fast", vi: "Nhanh" },
  "gifSimplify.frameSettings": { en: "Frame reduction settings", vi: "Thiết lập giảm frame" },
  "gifSimplify.frames": { en: "frames", vi: "frame" },
  "gifSimplify.gifQuality": { en: "GIF quality", vi: "Chất lượng GIF" },
  "gifSimplify.good": { en: "Good", vi: "Tốt" },
  "gifSimplify.heading": { en: "Skip frames, lighter & faster", vi: "Bỏ xen kẽ frame, nhẹ hơn & nhanh hơn" },
  "gifSimplify.keepCount": { en: "→ keep {0} (remove {1})", vi: "→ giữ {0} (bỏ {1})" },
  "gifSimplify.keepEvery": { en: "Keep 1 in every", vi: "Giữ 1 trong mỗi" },
  "gifSimplify.maxDim": { en: "Max dimension", vi: "Kích thước tối đa" },
  "gifSimplify.medium": { en: "Medium", vi: "Vừa" },
  "gifSimplify.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "gifSimplify.nav.home": { en: "Home", vi: "Trang chủ" },
  "gifSimplify.outputFps": { en: "Output FPS", vi: "FPS đầu ra" },
  "gifSimplify.processed": { en: "✓ Processed", vi: "✓ Đã xử lý" },
  "gifSimplify.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "gifSimplify.reduceFrames": { en: "Reduce {0} → {1} frames", vi: "Giảm {0} → {1} frame" },
  "gifSimplify.seo.desc": { en: "Reduce the number of frames to make GIF lighter, or fast-forward video by skipping frames. Processed locally in your browser.", vi: "Giảm một nửa số frame để GIF nhẹ hơn, hoặc tua nhanh video bằng cách bỏ xen kẽ frame. Xử lý cục bộ trên trình duyệt." },
  "gifSimplify.seo.title": { en: "Simplify GIF / Fast-forward video | Pixel Normal Edit", vi: "Đơn giản hóa GIF / Tua nhanh video | Pixel Normal Edit" },
  "gifSimplify.skipEvery": { en: "Skip every", vi: "Bỏ qua mỗi" },
  "gifSimplify.title": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video" },
  "gifSimplify.videoExtractFps": { en: "Video extract FPS", vi: "FPS tách video" },
  "gifSimplify.webmVideo": { en: "WebM Video", vi: "WebM Video" },
  "gifSimplify.x10Fast": { en: "x10 (very fast)", vi: "x10 (rất nhanh)" },
  "gifSimplify.x2Light": { en: "x2 (light)", vi: "x2 (nhẹ)" },
  "group.backupSync": { en: "Backup & Sync", vi: "Lưu trữ & Đồng bộ" },
  "group.draw": { en: "Draw", vi: "Vẽ" },
  "group.fillBg": { en: "Fill", vi: "Tô màu" },
  "group.imageOps": { en: "Image Operations", vi: "Thao tác ảnh" },
  "group.localImageStore": { en: "Local Image Store", vi: "Kho ảnh cục bộ" },
  "group.nav": { en: "Navigation", vi: "Điều hướng" },
  "group.navigation": { en: "Navigation", vi: "Điều hướng" },
  "group.operations": { en: "Edit", vi: "Chỉnh sửa" },
  "group.settings": { en: "Settings", vi: "Cài đặt" },
  "group.shape": { en: "Shapes", vi: "Hình" },
  "home.benefit.ai": { en: "AI Integration (MCP)", vi: "AI Integration (MCP)" },
  "home.benefit.aiDesc": { en: "Connect AI agents (Claude, Cursor, Windsurf) via the MCP protocol to draw directly on the canvas in real time.", vi: "Connect AI agents (Claude, Cursor, Windsurf) via the MCP protocol to draw directly on the canvas in real time." },
  "home.benefit.batch": { en: "Batch processing", vi: "Batch processing" },
  "home.benefit.batchDesc": { en: "Process dozens of images at once, saving significant time.", vi: "Xử lý hàng chục ảnh cùng lúc, tiết kiệm thời gian đáng kể." },
  "home.benefit.cross": { en: "Cross-platform", vi: "Đa nền tảng" },
  "home.benefit.crossDesc": { en: "Works on all modern browsers, no installs or plugins needed.", vi: "Hoạt động trên mọi trình duyệt hiện đại, không cần cài đặt hay plugin." },
  "home.benefit.free": { en: "Free forever", vi: "Miễn phí mãi mãi" },
  "home.benefit.freeDesc": { en: "Core features are completely free, unlimited images.", vi: "Các tính năng cơ bản hoàn toàn miễn phí, không giới hạn số lượng ảnh." },
  "home.benefit.privacy": { en: "Completely private", vi: "Hoàn toàn riêng tư" },
  "home.benefit.privacyDesc": { en: "All processing happens right in your browser. Images never leave your device.", vi: "Mọi xử lý diễn ra ngay trên trình duyệt của bạn. Ảnh không bao giờ rời khỏi thiết bị." },
  "home.benefit.speed": { en: "Instant speed", vi: "Tốc độ tức thì" },
  "home.benefit.speedDesc": { en: "No server upload wait. Local processing gives instant results.", vi: "Không chờ upload server. Xử lý cục bộ cho kết quả ngay lập tức." },
  "home.benefit.subtitle": { en: "What the website brings to you.", vi: "Những gì được trang web mang lại cho bạn." },
  "home.benefit.title": { en: "Key benefits", vi: "Ưu điểm nổi bật" },
  "home.benefit.ui": { en: "Intuitive interface", vi: "Giao diện trực quan" },
  "home.benefit.uiDesc": { en: "UI designed for users, no technical knowledge required.", vi: "UI được thiết kế cho người dùng, không yêu cầu kiến thức kỹ thuật." },
  "home.benefits.label": { en: "Benefits", vi: "Lợi ích" },
  "home.benefits.subtitle": { en: "Not just an image tool — it's an experience designed for modern users.", vi: "Không chỉ là một công cụ xử lý ảnh — đây là trải nghiệm được thiết kế cho người dùng hiện đại." },
  "home.benefits.title": { en: "Why choose ImgTools?", vi: "Tại sao chọn ImgTools?" },
  "home.bug.desc": { en: "If you run into an issue while using the tool, please report it so our team can fix it as soon as possible.", vi: "Nếu bạn gặp sự cố khi sử dụng công cụ, vui lòng báo cáo lỗi để đội ngũ kỹ thuật có thể xử lý sớm nhất." },
  "home.bug.github": { en: "Create a GitHub Issue", vi: "Tạo Issue trên GitHub" },
  "home.bug.report": { en: "Submit bug report", vi: "Gửi form báo lỗi" },
  "home.bug.subtitle": { en: "Help us improve the product", vi: "Giúp chúng tôi cải thiện sản phẩm" },
  "home.bug.title": { en: "Found a bug?", vi: "Phát hiện lỗi?" },
  "home.contact.addressLabel": { en: "ADDRESS", vi: "ĐỊA CHỈ" },
  "home.contact.addressValue": { en: "123 Nguyen Hue, Q.1<br />Ho Chi Minh City, Vietnam", vi: "123 Nguyễn Huệ, Q.1<br />TP. Hồ Chí Minh, Việt Nam" },
  "home.contact.alertFill": { en: "Please fill in all information.", vi: "Vui lòng điền đầy đủ thông tin." },
  "home.contact.email": { en: "Email", vi: "Email" },
  "home.contact.emailDesc": { en: "Replies within 24 hours", vi: "Phản hồi trong 24 giờ" },
  "home.contact.emailLabel": { en: "EMAIL", vi: "EMAIL" },
  "home.contact.emailPlaceholder": { en: "email@example.com", vi: "email@example.com" },
  "home.contact.emailValue": { en: "hello@imgtools.vn", vi: "hello@imgtools.vn" },
  "home.contact.label": { en: "Contact", vi: "Liên hệ" },
  "home.contact.message": { en: "Message", vi: "Nội dung" },
  "home.contact.messagePlaceholder": { en: "Your message...", vi: "Nội dung tin nhắn của bạn..." },
  "home.contact.name": { en: "Full name", vi: "Họ và tên" },
  "home.contact.namePlaceholder": { en: "Nguyen Van A", vi: "Nguyễn Văn A" },
  "home.contact.phoneDesc": { en: "Mon – Fri, 9:00–18:00", vi: "Thứ 2 – Thứ 6, 9:00–18:00" },
  "home.contact.phoneLabel": { en: "PHONE", vi: "ĐIỆN THOẠI" },
  "home.contact.phoneValue": { en: "0901 234 567", vi: "0901 234 567" },
  "home.contact.send": { en: "Send message →", vi: "Gửi tin nhắn →" },
  "home.contact.sent": { en: "✓ Sent!", vi: "✓ Đã gửi!" },
  "home.contact.subtitle": { en: "Have questions or want to collaborate? Our team will respond within 24 hours.", vi: "Có câu hỏi hoặc muốn hợp tác? Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ." },
  "home.contact.title": { en: "Connect with us", vi: "Kết nối với chúng tôi" },
  "home.cta.button": { en: "Explore now", vi: "Khám phá ngay" },
  "home.cta.subtitle": { en: "Experience the next-generation AI image editing tools now.", vi: "Trải nghiệm công cụ chỉnh sửa ảnh AI thế hệ tiếp theo ngay bây giờ." },
  "home.cta.title": { en: "Ready to get started?", vi: "Sẵn sàng bắt đầu?" },
  "home.feature.subtitle": { en: "Discover AI tools and features that will change how you edit images.", vi: "Khám phá các công cụ và tính năng AI sẽ thay đổi cách bạn chỉnh sửa ảnh." },
  "home.feature.title": { en: "Featured features", vi: "Tính năng nổi bật" },
  "home.featuredTools.subtitle": { en: "Everything in one powerful AI toolkit for image processing.", vi: "Tất cả trong một bộ công cụ AI mạnh mẽ để xử lý ảnh." },
  "home.featuredTools.title": { en: "Featured tools", vi: "Công cụ nổi bật" },
  "home.footer.about": { en: "About us", vi: "Về chúng tôi" },
  "home.footer.blog": { en: "Blog", vi: "Blog" },
  "home.footer.careers": { en: "Careers", vi: "Tuyển dụng" },
  "home.footer.company": { en: "Company", vi: "Công ty" },
  "home.footer.contact": { en: "Contact", vi: "Liên hệ" },
  "home.footer.cookie": { en: "Cookie", vi: "Cookie" },
  "home.footer.copyright": { en: "© 2026 Pixel Normal Edit. All rights reserved.", vi: "© 2026 Pixel Normal Edit. All rights reserved." },
  "home.footer.desc": { en: "Image processing platform running right in your browser. Fast, private, and free.", vi: "Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí." },
  "home.footer.docs": { en: "Documentation", vi: "Tài liệu" },
  "home.footer.faq": { en: "FAQ", vi: "FAQ" },
  "home.footer.githubIssues": { en: "GitHub Issues", vi: "GitHub Issues" },
  "home.footer.legal": { en: "Legal", vi: "Pháp lý" },
  "home.footer.press": { en: "Press", vi: "Báo chí" },
  "home.footer.privacy": { en: "Privacy", vi: "Bảo mật" },
  "home.footer.privacyPolicy": { en: "Privacy Policy", vi: "Chính sách bảo mật" },
  "home.footer.products": { en: "Products", vi: "Sản phẩm" },
  "home.footer.report": { en: "Report bug", vi: "Báo lỗi" },
  "home.footer.reportForm": { en: "Report bug (Google Form)", vi: "Báo lỗi (Google Form)" },
  "home.footer.support": { en: "Support", vi: "Hỗ trợ" },
  "home.footer.terms": { en: "Terms", vi: "Điều khoản" },
  "home.footer.termsOfUse": { en: "Terms of Use", vi: "Điều khoản sử dụng" },
  "home.footer.title": { en: "AITaoanh", vi: "AITaoanh" },
  "home.hero.badge": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit" },
  "home.hero.cta": { en: "Get started now", vi: "Bắt đầu ngay" },
  "home.hero.cta.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "home.hero.ctaSub": { en: "Completely free", vi: "Hoàn toàn miễn phí" },
  "home.hero.desc": { en: "Image processing platform running right in your browser — no account needed, no server uploads, your data belongs only to you.", vi: "Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn." },
  "home.hero.headline": { en: "Pixel Art Editor", vi: "Pixel Art Editor" },
  "home.hero.mockupLabel": { en: "Professional image editing screen", vi: "Màn hình chỉnh sửa ảnh chuyên nghiệp" },
  "home.hero.stats": { en: "2,048,391 images processed today", vi: "2,048,391 ảnh đã xử lý hôm nay" },
  "home.hero.subheadline": { en: "Professional image editing, pixel art drawing and animation creation with leading smart AI tools", vi: "Chỉnh sửa ảnh chuyên nghiệp, vẽ pixel art và tạo animation với công cụ AI thông minh hàng đầu" },
  "home.hero.tagline": { en: "Turn ideas into masterpieces in an instant.", vi: "Biến ý tưởng thành tác phẩm chỉ trong nháy mắt." },
  "home.hero.title": { en: "Fast & private image processing tools.", vi: "Công cụ xử lý ảnh nhanh & riêng tư." },
  "home.nav.contact": { en: "Contact", vi: "Liên hệ" },
  "home.nav.features": { en: "Features", vi: "Tính năng" },
  "home.nav.home": { en: "Home", vi: "Trang chủ" },
  "home.nav.login": { en: "Login", vi: "Đăng nhập" },
  "home.nav.products": { en: "Products", vi: "Sản phẩm" },
  "home.pricing.foreverFree": { en: "Free forever", vi: "Miễn phí mãi mãi" },
  "home.pricing.subtitle": { en: "Tools are always free. With an account you get access to exclusive features.", vi: "Công cụ luôn miễn phí. Với một tài khoản bạn có quyền truy cập với tính năng riêng." },
  "home.pricing.tagline": { en: "Core tools are always free. Create an account to unlock premium features.", vi: "Công cụ cơ bản luôn miễn phí. Tạo tài khoản để mở khóa tính năng cao cấp." },
  "home.pricing.title": { en: "Pricing", vi: "Giá cả" },
  "home.products.label": { en: "Products", vi: "Sản phẩm" },
  "home.products.subtitle": { en: "From format conversion to advanced editing — all in one platform.", vi: "Từ chuyển đổi định dạng đến chỉnh sửa nâng cao — tất cả trong một nền tảng duy nhất." },
  "home.products.title": { en: "Comprehensive toolkit", vi: "Bộ công cụ toàn diện" },
  "home.support.desc": { en: "If you find this tool useful, consider buying us a coffee to help us keep building new features.", vi: "Nếu bạn thấy công cụ hữu ích, hãy ủng hộ một ly cà phê để chúng tôi tiếp tục phát triển các tính năng mới." },
  "home.support.title": { en: "Support this project", vi: "Ủng hộ dự án" },
  "home.tool.aiPixelArtist": { en: "AI Pixel Artist", vi: "Họa sĩ pixel AI" },
  "home.tool.aiPixelArtistDesc": { en: "Create high-quality pixel art with AI.", vi: "Tạo pixel art chất lượng cao bằng AI." },
  "home.tool.aiPixelArtistDetail": { en: "Custom sizes, rich palette.", vi: "Kích thước tùy chỉnh, palette phong phú." },
  "home.tool.avatar": { en: "AI Avatar", vi: "Avatar AI" },
  "home.tool.avatarDesc": { en: "Create multi-style AI avatars from selfies.", vi: "Tạo avatar AI đa phong cách từ ảnh selfie." },
  "home.tool.avatarDetail": { en: "Hundreds of styles: anime, cyberpunk, fantasy...", vi: "Hàng trăm phong cách: anime, cyberpunk, fantasy..." },
  "home.tool.bgRemove": { en: "AI Background Remover", vi: "Xóa nền AI" },
  "home.tool.bgRemoveDesc": { en: "Remove image background with a single click.", vi: "Xóa nền ảnh chỉ với một cú click." },
  "home.tool.bgRemoveDetail": { en: "Professional results, sharp edges.", vi: "Kết quả chuyên nghiệp, đường viền sắc nét." },
  "home.tool.cartoon": { en: "Cartoon Mode", vi: "Chế độ hoạt hình" },
  "home.tool.cartoonDesc": { en: "Turn photos into stylish cartoons.", vi: "Biến ảnh thành tranh hoạt hình phong cách." },
  "home.tool.cartoonDetail": { en: "Many styles: Disney, Pixar, anime...", vi: "Nhiều style: Disney, Pixar, anime..." },
  "home.tool.colorization": { en: "AI Colorization", vi: "Tô màu AI" },
  "home.tool.colorizationDesc": { en: "Automatically colorize black and white photos.", vi: "Tô màu ảnh đen trắng tự động." },
  "home.tool.colorizationDetail": { en: "Get realistic results in seconds.", vi: "Nhận kết quả chân thực trong vài giây." },
  "home.tool.compress": { en: "Compress Image", vi: "Nén ảnh" },
  "home.tool.compressDesc": { en: "Reduce file size 60–90% without significant quality loss.", vi: "Giảm 60–90% dung lượng file mà không giảm chất lượng đáng kể." },
  "home.tool.compressDetail": { en: "Lossy & lossless", vi: "Lossy & lossless" },
  "home.tool.convert": { en: "Convert Image", vi: "Convert ảnh" },
  "home.tool.convertDesc": { en: "Convert between PNG, WebP, AVIF, JPG and 8 other formats.", vi: "Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác." },
  "home.tool.convertDetail": { en: "12 formats supported", vi: "12 định dạng hỗ trợ" },
  "home.tool.crop": { en: "Crop Image", vi: "Crop ảnh" },
  "home.tool.cropDesc": { en: "Crop custom areas with 1:1, 16:9, 4:3 ratio presets.", vi: "Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3..." },
  "home.tool.cropDetail": { en: "Popular ratio presets", vi: "Preset tỉ lệ phổ biến" },
  "home.tool.drawing": { en: "AI Drawing", vi: "Vẽ tranh AI" },
  "home.tool.drawingDesc": { en: "Turn text into artistic drawings.", vi: "Biến text thành tranh vẽ nghệ thuật." },
  "home.tool.drawingDetail": { en: "Many styles: watercolor, oil painting, sketch...", vi: "Nhiều phong cách: watercolor, oil painting, sketch..." },
  "home.tool.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "home.tool.editorDesc": { en: "Advanced editing: layers, filters, masks, blend modes.", vi: "Chỉnh sửa nâng cao: layers, filters, masks, blend modes." },
  "home.tool.editorDetail": { en: "Full-featured editor", vi: "Full-featured editor" },
  "home.tool.enhance": { en: "Enhance Image", vi: "Tăng cường ảnh" },
  "home.tool.enhanceDesc": { en: "Improve quality, color, contrast.", vi: "Cải thiện chất lượng, màu sắc, độ tương phản." },
  "home.tool.enhanceDetail": { en: "Automatic optimization for best results.", vi: "Tối ưu hóa tự động cho kết quả tốt nhất." },
  "home.tool.enhanceFace": { en: "Enhance Face", vi: "Nâng cấp khuôn mặt" },
  "home.tool.enhanceFaceDesc": { en: "Improve facial detail, sharpen features.", vi: "Cải thiện chi tiết khuôn mặt, làm rõ nét." },
  "home.tool.enhanceFaceDetail": { en: "Automatic skin smoothing, eye detail boost.", vi: "Tự động làm mịn da, tăng chi tiết mắt." },
  "home.tool.framesToMedia": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video" },
  "home.tool.framesToMediaDesc": { en: "Convert Video → GIF, GIF → Video, or combine images into GIF/WebM.", vi: "Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM." },
  "home.tool.framesToMediaDetail": { en: "GIF & WebM", vi: "GIF & WebM" },
  "home.tool.gifSimplify": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video" },
  "home.tool.gifSimplifyDesc": { en: "Skip frames to make GIF lighter and videos play faster.", vi: "Bỏ xen kẽ frame để GIF nhẹ hơn, video chạy nhanh hơn." },
  "home.tool.gifSimplifyDetail": { en: "Reduce x2, x3...", vi: "Giảm x2, x3..." },
  "home.tool.hd": { en: "HD Editor", vi: "HD Editor" },
  "home.tool.hdDesc": { en: "Edit HD photos with professional tools.", vi: "Chỉnh sửa ảnh HD với công cụ chuyên nghiệp." },
  "home.tool.hdDetail": { en: "No quality loss, high resolution support.", vi: "Không giảm chất lượng, hỗ trợ độ phân giải cao." },
  "home.tool.magicEdit": { en: "AI Magic Edit", vi: "Chỉnh sửa ma thuật AI" },
  "home.tool.magicEditDesc": { en: "Replace objects, add detail, fix mistakes with AI.", vi: "Thay thế đối tượng, thêm chi tiết, sửa lỗi bằng AI." },
  "home.tool.magicEditDetail": { en: "Describe the change and AI will do it.", vi: "Mô tả thay đổi và AI sẽ thực hiện." },
  "home.tool.mediaToFrames": { en: "GIF / Video → Images", vi: "Tách GIF / Video → Ảnh" },
  "home.tool.mediaToFramesDesc": { en: "Extract every frame of a GIF or Video into separate images.", vi: "Tách từng frame của GIF hoặc Video thành ảnh riêng biệt." },
  "home.tool.mediaToFramesDetail": { en: "Extract frames", vi: "Extract frames" },
  "home.tool.removeBG": { en: "Remove Background", vi: "Xóa nền" },
  "home.tool.removeBGAdvanced": { en: "Advanced Background Removal", vi: "Xóa nền nâng cao" },
  "home.tool.removeBGAdvancedDesc": { en: "Remove backgrounds with high accuracy, separate complex detail.", vi: "Xóa nền với độ chính xác cao, tách chi tiết phức tạp." },
  "home.tool.removeBGAdvancedDetail": { en: "Separate hair, feathers, thin detail perfectly.", vi: "Tách tóc, lông vũ, chi tiết mỏng một cách hoàn hảo." },
  "home.tool.removeBGDesc": { en: "Separate subject from image background.", vi: "Tách chủ thể ra khỏi nền ảnh." },
  "home.tool.removeBGDetail": { en: "High accuracy, preserves fine detail.", vi: "Độ chính xác cao, giữ lại chi tiết tinh tế." },
  "home.tool.removeLetter": { en: "Advanced Text Removal", vi: "Xóa chữ nâng cao" },
  "home.tool.removeLetterDesc": { en: "Remove text from images, restore background detail.", vi: "Xóa chữ khỏi ảnh, phục hồi lại chi tiết nền." },
  "home.tool.removeLetterDetail": { en: "AI analyzes background structure to reconstruct accurately.", vi: "AI phân tích cấu trúc nền để tái tạo chính xác." },
  "home.tool.removeText": { en: "Remove Text", vi: "Xóa chữ" },
  "home.tool.removeTextDesc": { en: "Remove text from images, replace with AI content.", vi: "Xóa chữ khỏi ảnh, thay thế bằng nội dung AI." },
  "home.tool.removeTextDetail": { en: "Preserves background and surrounding context.", vi: "Giữ nguyên nền và context xung quanh." },
  "home.tool.removebgVideo": { en: "Video Background Removal", vi: "Xóa nền Video" },
  "home.tool.repair": { en: "AI Repair", vi: "Sửa ảnh AI" },
  "home.tool.repairDesc": { en: "Restore old, damaged or blurry photos.", vi: "Phục hồi ảnh cũ, hư hỏng hoặc mờ." },
  "home.tool.repairDetail": { en: "Automatically fix defects and restore detail.", vi: "Tự động sửa lỗi và khôi phục chi tiết." },
  "home.tool.resize": { en: "Resize Image", vi: "Resize ảnh" },
  "home.tool.resizeDesc": { en: "Resize freely, by ratio or popular presets.", vi: "Thay đổi kích thước tự do, theo tỉ lệ hoặc preset phổ biến." },
  "home.tool.resizeDetail": { en: "Keep aspect ratio", vi: "Giữ tỉ lệ khung hình" },
  "home.tool.restore": { en: "Restore Old Photos", vi: "Khôi phục ảnh cũ" },
  "home.tool.restoreColor": { en: "Restore Color", vi: "Phục hồi màu" },
  "home.tool.restoreColorDesc": { en: "Colorize black and white photos with natural colors.", vi: "Tô màu cho ảnh đen trắng với màu sắc tự nhiên." },
  "home.tool.restoreColorDetail": { en: "AI detects objects and colors accurately.", vi: "AI nhận diện vật thể và tô màu chính xác." },
  "home.tool.restoreDesc": { en: "Restore blurry, torn, faded photos.", vi: "Khôi phục ảnh bị mờ, rách, phai màu." },
  "home.tool.restoreDetail": { en: "AI restores lost color and detail.", vi: "AI phục hồi màu sắc và chi tiết đã mất." },
  "home.tool.rotate": { en: "Rotate / Flip", vi: "Xoay / Lật" },
  "home.tool.rotateDesc": { en: "Rotate at custom angles, flip horizontally and vertically in one click.", vi: "Xoay góc tùy chỉnh, lật ngang và dọc theo một cú click." },
  "home.tool.rotateDetail": { en: "Flip horizontal & vertical", vi: "Lật ngang & dọc" },
  "home.tool.upScale": { en: "AI Upscale", vi: "Nâng cấp ảnh AI" },
  "home.tool.upScaleDesc": { en: "Enlarge images 2x, 4x, 8x without losing detail.", vi: "Tăng kích thước ảnh gấp 2, 4, 8 lần mà không mất chi tiết." },
  "home.tool.upScaleDetail": { en: "Automatic noise reduction.", vi: "Tự động loại bỏ nhiễu hạt (noise reduction)." },
  "home.tool.upscale4x": { en: "4x Upscale", vi: "Nâng cấp 4x" },
  "home.tool.upscale4xDesc": { en: "Enlarge image 4 times.", vi: "Tăng kích thước ảnh gấp 4 lần." },
  "home.tool.upscale4xDetail": { en: "Keeps quality, sharp detail.", vi: "Giữ nguyên chất lượng, sắc nét từng chi tiết." },
  "home.tools.gridTitle": { en: "All tools", vi: "Tất cả công cụ" },
  "home.tools.subtitle": { en: "Hundreds of tools ready. Explore the real power of image editing.", vi: "Hàng trăm công cụ đã sẵn sàng. Hãy khám phá sức mạnh thực sự của việc chỉnh sửa ảnh." },
  "home.tools.title": { en: "Full list", vi: "Danh sách đầy đủ" },
  "imagePreview.alt": { en: "Preview", vi: "Preview" },
  "imagePreview.loading": { en: "Loading image...", vi: "Đang tải ảnh..." },
  "key": { en: "key", vi: "key" },
  "label.animationPage": { en: "Page {0} / {1}", vi: "{0}/{1}" },
  "label.bg": { en: "Background", vi: "Nền" },
  "label.eraserSize": { en: "Eraser Size", vi: "Cỡ tẩy" },
  "label.fps": { en: "fps", vi: "fps" },
  "label.gradDir": { en: "Direction", vi: "Hướng" },
  "label.height": { en: "Height", vi: "Height" },
  "label.limit": { en: "Limit:", vi: "Giới hạn:" },
  "label.lockRatio": { en: "Lock Ratio", vi: "Khóa tỷ lệ (Ratio)" },
  "label.outlineThick": { en: "Thickness:", vi: "Độ dày viền" },
  "label.pencilSize": { en: "Pencil Size", vi: "Cỡ bút" },
  "label.presets": { en: "Presets", vi: "Tỷ lệ (Presets)" },
  "label.rotateOptions": { en: "Rotate Options", vi: "Tùy chọn xoay" },
  "label.rulerOptions": { en: "Ruler Options", vi: "Tùy chọn thước" },
  "label.shapeCircle": { en: "Circle", vi: "Tròn (Circle)" },
  "label.shapeSquare": { en: "Square", vi: "Vuông (Square)" },
  "label.shapeThick": { en: "Thickness:", vi: "Độ dày:" },
  "label.sourceImage": { en: "Source Image", vi: "Ảnh gốc" },
  "label.speed": { en: "Speed: ", vi: "Tốc độ: " },
  "label.sprayDensity": { en: "Density", vi: "Mật độ" },
  "label.spraySize": { en: "Size", vi: "Kích thước" },
  "label.width": { en: "Width", vi: "Width" },
  "layer.add": { en: "Add Layer", vi: "Thêm Lớp" },
  "layer.moveDown": { en: "Move Layer Down", vi: "Xuống dưới" },
  "layer.moveUp": { en: "Move Layer Up", vi: "Lên trên" },
  "layer.remove": { en: "Remove Layer", vi: "Xóa lớp" },
  "layer.title": { en: "Layers", vi: "Lớp (Layers)" },
  "local.errListFiles": { en: "Failed to list local files:", vi: "Lỗi khi đọc danh sách file:" },
  "local.errNoDir": { en: "No working directory selected.", vi: "Chưa chọn thư mục làm việc." },
  "local.errNoReadPerm": { en: "No read permission. Please grant permission again.", vi: "Không có quyền đọc file. Vui lòng cấp quyền lại." },
  "local.errNoWritePerm": { en: "No write permission. Please grant permission in the browser.", vi: "Không có quyền ghi vào thư mục. Vui lòng cấp quyền trong trình duyệt." },
  "local.errNotSupported": { en: "Browser doesn't support File System Access API. Please use a Chromium-based browser.", vi: "Trình duyệt không hỗ trợ chọn thư mục (File System Access API)." },
  "local.errPickDir": { en: "Failed to pick directory:", vi: "Lỗi khi chọn thư mục:" },
  "local.imageOpened": { en: "Opened image: {0}", vi: "Đã mở ảnh: {0}" },
  "local.noFilesFound": { en: "No images or projects found in Local Directory", vi: "Không tìm thấy ảnh hoặc project nào trong Thư mục cục bộ" },
  "local.projectOpened": { en: "Opened project: {0}", vi: "Đã mở dự án: {0}" },
  "magicEraser.tolerance": { en: "Tolerance", vi: "Độ sai lệch màu (Tolerance)" },
  "main.localSaveFallback": { en: "Local drive save failed, falling back to download", vi: "Lưu vào ổ cục bộ thất bại, chuyển sang tải xuống" },
  "mcpFirebase.connected": { en: "Status: MCP Connected", vi: "Trạng thái: đã kết nối mcp" },
  "mcpFirebase.waiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối..." },
  "mediaToFrames.badge": { en: "Extract GIF / Video to images", vi: "Tách GIF / Video thành ảnh" },
  "mediaToFrames.changeFile": { en: "Change file", vi: "Đổi file" },
  "mediaToFrames.desc": { en: "Upload a GIF or Video file. Frames are displayed progressively as they are extracted — no waiting. Download individual images or the whole ZIP.", vi: "Upload file GIF hoặc Video. Các frame được hiển thị dần ngay khi tách xong — không cần đợi. Tải về từng ảnh hoặc cả ZIP." },
  "mediaToFrames.downloadImage": { en: "Download image", vi: "Tải ảnh" },
  "mediaToFrames.downloadZip": { en: "Download ZIP ({0} images)", vi: "Tải ZIP ({0} ảnh)" },
  "mediaToFrames.drop.button": { en: "Choose file", vi: "Chọn file" },
  "mediaToFrames.drop.support": { en: "Supported: GIF · MP4 · WebM · MOV", vi: "Hỗ trợ: GIF · MP4 · WebM · MOV" },
  "mediaToFrames.drop.title": { en: "Drag & drop GIF or Video here", vi: "Kéo thả GIF hoặc Video vào đây" },
  "mediaToFrames.error.extract": { en: "Frame extraction error: {0}", vi: "Lỗi tách frame: {0}" },
  "mediaToFrames.error.onlyGifVideo": { en: "Only GIF or Video files (MP4, WebM, MOV) are supported.", vi: "Chỉ hỗ trợ file GIF hoặc Video (MP4, WebM, MOV)." },
  "mediaToFrames.error.readVideo": { en: "Cannot read video", vi: "Không thể đọc video" },
  "mediaToFrames.exportOptions": { en: "Export options", vi: "Tùy chọn xuất" },
  "mediaToFrames.extracting": { en: "Extracting frames...", vi: "Đang tách frame..." },
  "mediaToFrames.extractingHint": { en: "(extracting...)", vi: "(đang tách...)" },
  "mediaToFrames.fpsExtract": { en: "FPS extract", vi: "FPS extract" },
  "mediaToFrames.imageFormat": { en: "Image format", vi: "Định dạng ảnh" },
  "mediaToFrames.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "mediaToFrames.nav.home": { en: "Home", vi: "Trang chủ" },
  "mediaToFrames.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "mediaToFrames.quality": { en: "Quality", vi: "Chất lượng" },
  "mediaToFrames.reloadForFps": { en: "⚠️ Please reload the video file to apply the new FPS.", vi: "⚠️ Hãy tải lại file video để áp dụng FPS mới." },
  "mediaToFrames.selectAll": { en: "Select all", vi: "Chọn tất cả" },
  "mediaToFrames.selectNone": { en: "Deselect all", vi: "Bỏ chọn" },
  "mediaToFrames.selected": { en: "Selected", vi: "Đã chọn" },
  "mediaToFrames.seo.desc": { en: "Extract every frame of a GIF or Video (MP4, WebM) into separate images. Displayed progressively, download as ZIP. Fully processed locally in your browser.", vi: "Tách từng frame của GIF hoặc Video (MP4, WebM) thành ảnh riêng biệt. Hiển thị dần dần, tải về ZIP. Hoàn toàn xử lý cục bộ trên trình duyệt." },
  "mediaToFrames.seo.title": { en: "Extract GIF / Video to images | Pixel Normal Edit", vi: "Tách GIF / Video thành ảnh | Pixel Normal Edit" },
  "mediaToFrames.status.compressingZip": { en: "Compressing ZIP...", vi: "Đang nén ZIP..." },
  "mediaToFrames.status.creatingZip": { en: "Creating ZIP...", vi: "Đang tạo ZIP..." },
  "mediaToFrames.status.decodingGif": { en: "Decoding GIF...", vi: "Đang giải mã GIF..." },
  "mediaToFrames.title": { en: "Extract every frame of GIF & Video", vi: "Extract từng frame của GIF & Video" },
  "mediaToFrames.videoEstimate": { en: "Video 30s × {0}fps ≈ {1} images", vi: "Video 30s × {0}fps ≈ {1} ảnh" },
  "mediaToFrames.videoFps": { en: "Video: frames per second to extract", vi: "Video: Số frame/giây cần tách" },
  "mini_tools.compress.title": { en: "Compress Image", vi: "Nén ảnh" },
  "mini_tools.convert.title": { en: "Convert Image", vi: "Convert ảnh" },
  "mini_tools.crop.title": { en: "Crop Image", vi: "Crop ảnh" },
  "mini_tools.related.label": { en: "Explore", vi: "Khám phá" },
  "mini_tools.related.title": { en: "Other tools you may like:", vi: "Các công cụ khác có thể bạn quan tâm:" },
  "mini_tools.resize.title": { en: "Resize Image", vi: "Resize ảnh" },
  "mini_tools.rotate.title": { en: "Rotate/Flip", vi: "Xoay/lật ảnh" },
  "modal.advanced": { en: "Advanced", vi: "Nâng cao" },
  "modal.autoSize": { en: "Auto-resize canvas to match image", vi: "Tự động đổi kích thước khung theo ảnh tải lên" },
  "modal.browseDrive": { en: "Browse Google Drive", vi: "Duyệt Google Drive" },
  "modal.browseFile": { en: "Browse File", vi: "Chọn File" },
  "modal.clickToSelect": { en: "or click to select file from computer", vi: "hoặc nhấp để chọn file từ máy tính" },
  "modal.displayFormat": { en: "Display Format", vi: "Định dạng hiển thị" },
  "modal.downloadDesc": { en: "Choose how you want to export your artwork", vi: "Chọn cách bạn muốn xuất tác phẩm" },
  "modal.downloadTemplate": { en: "Download Template", vi: "Tải File Mẫu" },
  "modal.downloadTitle": { en: "Download File", vi: "Tải về máy" },
  "modal.dropJson": { en: "Click or Drag & Drop .json (or .txt) file here", vi: "Click hoặc Kéo thả file .json (hoặc .txt) vào đây" },
  "modal.filesInDrive": { en: "JSON files in Drive", vi: "Các file JSON trong Drive" },
  "modal.filterAll": { en: "All", vi: "Tất cả" },
  "modal.filterImage": { en: "Image", vi: "Ảnh" },
  "modal.filterJson": { en: "JSON", vi: "JSON" },
  "modal.importMode": { en: "Import Mode:", vi: "Chế độ nhập ảnh:" },
  "modal.jsonPlaceholder": { en: "Paste JSON (or .txt content) here...", vi: "Dán mã JSON (hoặc nội dung file .txt) vào đây..." },
  "modal.location": { en: "Location", vi: "Vị trí" },
  "modal.modeAnimation": { en: "3. Open as Animation (Animation Frames)", vi: "3. Mở thành Ảnh động (Animation Frames)" },
  "modal.modeCurrentTab": { en: "1. Overwrite Current Tab (1 file only)", vi: "1. Ghi đè Tab hiện tại (Chỉ 1 file)" },
  "modal.modeIndex": { en: "Index (Index)", vi: "Chỉ mục (Index)" },
  "modal.modeMultiTab": { en: "2. Open in New Tabs (Multi-Tab)", vi: "2. Mở vào nhiều Tabs mới (Multi-Tab)" },
  "modal.modeXY": { en: "Coordinate (X, Y)", vi: "Toạ độ (X, Y)" },
  "modal.parseJson": { en: "Parse JSON", vi: "Đọc JSON" },
  "modal.recentLocalFiles": { en: "Recent Local Files", vi: "Các file gần đây" },
  "modal.settingsTitle": { en: "Global Settings", vi: "Cài đặt chung" },
  "modal.sourceComputer": { en: "From computer", vi: "Từ máy tính" },
  "modal.sourceDrive": { en: "From Google Drive", vi: "Từ Google Drive" },
  "modal.sourceJson": { en: "From JSON code", vi: "Từ mã JSON" },
  "modal.supportedFiles": { en: "Supported files", vi: "Các tệp được hỗ trợ" },
  "modal.tabAccount": { en: "Account", vi: "Tài khoản" },
  "modal.tabAppearance": { en: "Appearance", vi: "Giao diện" },
  "modal.tabComputer": { en: "Computer", vi: "Máy tính" },
  "modal.tabDrawTools": { en: "Drawing Tools", vi: "Công cụ vẽ" },
  "modal.tabDrive": { en: "Google Drive", vi: "Google Drive" },
  "modal.tabEditTools": { en: "Transform", vi: "Thao tác" },
  "modal.tabImage": { en: "From Image", vi: "Từ Ảnh" },
  "modal.tabJson": { en: "From JSON", vi: "Từ JSON" },
  "modal.tabShortcuts": { en: "Shortcuts", vi: "Phím tắt" },
  "modal.uploadTitle": { en: "Upload / Open File", vi: "Tải lên / Mở file" },
  "modal.uploadToDrive": { en: "Save to Google Drive", vi: "Lưu vào Google Drive" },
  "modal.uploadToDriveDesc": { en: "Upload current file to Google Drive", vi: "Tải file đang mở hiện tại lên Google Drive" },
  "mode.animation": { en: "Animation Mode", vi: "Animation" },
  "mode.gradient": { en: "Gradient Mode", vi: "Gradient" },
  "mode.grid": { en: "Show Grid", vi: "Lưới" },
  "mode.mirror": { en: "Mirror Mode", vi: "Đối xứng" },
  "mode.onionSkin": { en: "Onion Skin", vi: "Onion Skin" },
  "option.diagonal": { en: "Diagonal", vi: "Chéo" },
  "option.horizontal": { en: "Horizontal", vi: "Ngang" },
  "option.radial": { en: "Radial", vi: "Xung quanh" },
  "option.rotatePixel": { en: "By Pixel", vi: "Theo Pixel" },
  "option.rotateSize": { en: "By Size", vi: "Theo kích thước" },
  "option.rulerDraw": { en: "Draw", vi: "Vẽ" },
  "option.rulerMeasure": { en: "Measure", vi: "Đo đạc" },
  "option.vertical": { en: "Vertical", vi: "Dọc" },
  "previewGroup.duplicateNotImpl": { en: "Not implemented: duplicatePreviewGroup", vi: "Chưa implement: duplicatePreviewGroup" },
  "previewGroup.reorderNotImpl": { en: "Not implemented: reorderPreviewImages", vi: "Chưa implement: reorderPreviewImages" },
  "previewGroup.transferNotImpl": { en: "Not implemented: transferToMainCanvas", vi: "Chưa implement: transferToMainCanvas" },
  "prompt.renameTab": { en: "Enter new tab name:", vi: "Nhập tên mới cho tab:" },
  "registry.compress": { en: "Compress Image", vi: "Nén ảnh" },
  "registry.convert": { en: "Convert Image", vi: "Convert ảnh" },
  "registry.crop": { en: "Crop Image", vi: "Crop ảnh" },
  "registry.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "registry.framesToMedia": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video" },
  "registry.gifSimplify": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video" },
  "registry.mediaToFrames": { en: "GIF / Video → Images", vi: "Tách GIF / Video → Ảnh" },
  "registry.resize": { en: "Resize Image", vi: "Resize ảnh" },
  "registry.rotate": { en: "Rotate / Flip", vi: "Xoay / Lật" },
  "resize.title": { en: "Change dimensions", vi: "Thay đổi kích thước" },
  "resizeModal.clearImage": { en: "Clear current image", vi: "Xóa ảnh hiện tại" },
  "resizeModal.clearImageDesc": { en: "Clear all old images, create a completely blank canvas.", vi: "Xóa toàn bộ ảnh cũ, tạo canvas trắng hoàn toàn." },
  "resizeModal.keepImage": { en: "Keep original image", vi: "Giữ nguyên ảnh" },
  "resizeModal.keepImageDesc": { en: "Keep original ratio, automatically crop or pad. (Will align in next step)", vi: "Giữ tỷ lệ gốc, tự động cắt hoặc bù thêm nền. (Sẽ căn chỉnh ở bước sau)" },
  "resizeModal.processStrategy": { en: "Processing Strategy", vi: "Thuật toán xử lý" },
  "resizeModal.scaleImage": { en: "Scale image", vi: "Thu phóng ảnh" },
  "resizeModal.scaleImageDesc": { en: "Stretch entire image to fit new size.", vi: "Co giãn toàn bộ hình ảnh vừa khít kích thước mới." },
  "resizePage.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "resizePage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)" },
  "resizePage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "resizePage.desc": { en: "Resize multiple images at once with the same dimensions. Export ZIP when multiple images are selected.", vi: "Resize nhiều ảnh cùng lúc với cùng một kích thước. Xuất file ZIP khi chọn nhiều ảnh." },
  "resizePage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về" },
  "resizePage.drop.button": { en: "Choose images", vi: "Chọn ảnh" },
  "resizePage.drop.desc": { en: "Select multiple images at once to batch resize", vi: "Chọn nhiều ảnh cùng lúc để resize hàng loạt" },
  "resizePage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây" },
  "resizePage.error.resize": { en: "Resize error: {0}", vi: "Lỗi khi resize: {0}" },
  "resizePage.fileList": { en: "Image list ({0})", vi: "Danh sách ảnh ({0})" },
  "resizePage.height": { en: "Height (H)", vi: "Chiều Cao (H)" },
  "resizePage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "resizePage.nav.home": { en: "Home", vi: "Trang chủ" },
  "resizePage.preset": { en: "Standard size", vi: "Kích thước chuẩn" },
  "resizePage.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "resizePage.quality": { en: "Quality", vi: "Chất lượng" },
  "resizePage.resizeBtn": { en: "Resize {0} images → {1}×{2}", vi: "Resize {0} ảnh → {1}×{2}" },
  "resizePage.title": { en: "Batch resize images", vi: "Đổi kích thước ảnh hàng loạt" },
  "resizePage.width": { en: "Width (W)", vi: "Chiều Rộng (W)" },
  "resizePopover.alignTitle": { en: "Alignment (Resize Preview)", vi: "Căn chỉnh (Resize Preview)" },
  "resizePopover.anchor": { en: "Anchor:", vi: "Neo (Anchor):" },
  "resizePopover.apply": { en: "Apply", vi: "Áp dụng" },
  "resizePopover.cancel": { en: "Cancel", vi: "Hủy" },
  "resizePopover.fit": { en: "Fit", vi: "Fit" },
  "resizePopover.reset": { en: "Reset", vi: "Reset" },
  "rotatePage.addMore": { en: "Add more images", vi: "Thêm ảnh" },
  "rotatePage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)" },
  "rotatePage.applyBtn": { en: "Apply to {0} images", vi: "Áp dụng cho {0} ảnh" },
  "rotatePage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ" },
  "rotatePage.desc": { en: "Rotate & flip multiple images at once with the same settings. Export ZIP when multiple images are selected.", vi: "Xoay & lật nhiều ảnh cùng lúc với cùng một thiết lập. Xuất file ZIP khi chọn nhiều ảnh." },
  "rotatePage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về" },
  "rotatePage.drop.button": { en: "Choose images", vi: "Chọn ảnh" },
  "rotatePage.drop.desc": { en: "Select multiple images at once to batch rotate", vi: "Chọn nhiều ảnh cùng lúc để xoay hàng loạt" },
  "rotatePage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây" },
  "rotatePage.error.apply": { en: "Apply error: {0}", vi: "Lỗi khi áp dụng: {0}" },
  "rotatePage.fileList": { en: "Image list ({0})", vi: "Danh sách ảnh ({0})" },
  "rotatePage.flip": { en: "Flip", vi: "Lật (Flip)" },
  "rotatePage.flipH": { en: "↔ Flip horizontal", vi: "↔ Lật ngang" },
  "rotatePage.flipV": { en: "↕ Flip vertical", vi: "↕ Lật dọc" },
  "rotatePage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor" },
  "rotatePage.nav.home": { en: "Home", vi: "Trang chủ" },
  "rotatePage.processed": { en: "✓ Processed", vi: "✓ Đã xử lý" },
  "rotatePage.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "rotatePage.quality": { en: "Quality", vi: "Chất lượng" },
  "rotatePage.rotate": { en: "Rotate", vi: "Xoay (Rotate)" },
  "rotatePage.title": { en: "Batch rotate & flip images", vi: "Xoay lật ảnh hàng loạt" },
  "seo.compress.desc": { en: "Compress and reduce the file size of JPG, PNG, WebP images to the maximum while maintaining the highest quality. Completely free.", vi: "Công cụ nén giảm dung lượng ảnh JPG, PNG, WebP tối đa mà vẫn giữ chất lượng cao nhất. Hoàn toàn miễn phí." },
  "seo.compress.f1.desc": { en: "No files uploaded to the cloud, the compression algorithm runs right on your computer.", vi: "Không upload file lên cloud, thuật toán nén chạy ngay trên máy tính của bạn." },
  "seo.compress.f1.title": { en: "100% Secure", vi: "Bảo mật 100%" },
  "seo.compress.f2.desc": { en: "Provides 3 compression modes (Low, Medium, High) or manually adjust quality from 0-100%.", vi: "Cung cấp 3 chế độ nén (Thấp, Vừa, Cao) hoặc tự chỉnh chất lượng từ 0-100%." },
  "seo.compress.f2.title": { en: "Flexible customization", vi: "Tuỳ chỉnh linh hoạt" },
  "seo.compress.faq1.a": { en: "The WebP format provides the best compression ratio today, superior to JPG and PNG.", vi: "Định dạng WebP mang lại tỷ lệ nén tốt nhất hiện nay, vượt trội so với JPG và PNG." },
  "seo.compress.faq1.q": { en: "Which format compresses best?", vi: "Định dạng nào nén tốt nhất?" },
  "seo.compress.h2": { en: "Why do you need an Image Compressor?", vi: "Tại sao bạn cần công cụ Nén Ảnh?" },
  "seo.compress.p1": { en: "Optimizing image size helps websites load faster, saves bandwidth, and is SEO-friendly. Pixel Normal Edit's image compressor uses smart compression algorithms directly in the browser.", vi: "Tối ưu dung lượng hình ảnh giúp website tải nhanh hơn, tiết kiệm băng thông và thân thiện với SEO. Trình nén ảnh của Pixel Normal Edit sử dụng thuật toán nén thông minh trực tiếp trên trình duyệt." },
  "seo.compress.title": { en: "Image Compressor - Reduce file size online | Pixel Normal Edit", vi: "Nén ảnh (Compress) giảm dung lượng trực tuyến | Pixel Normal Edit" },
  "seo.convert.desc": { en: "Convert image formats WebP, PNG, JPG, GIF for free and extremely fast.", vi: "Chuyển đổi định dạng hình ảnh WebP, PNG, JPG, GIF miễn phí và cực kỳ nhanh chóng." },
  "seo.convert.f1.desc": { en: "All processing happens directly on your browser (Client-side), ensuring absolute privacy.", vi: "Mọi tiến trình xử lý diễn ra trực tiếp trên trình duyệt của bạn (Client-side), đảm bảo quyền riêng tư tuyệt đối." },
  "seo.convert.f1.title": { en: "No Server Upload", vi: "Không tải ảnh lên máy chủ" },
  "seo.convert.f2.desc": { en: "Supports advanced WebP format for the web, along with popular formats like PNG, JPG, GIF.", vi: "Hỗ trợ chuẩn xuất WebP tiên tiến cho web, cùng các định dạng thông dụng như PNG, JPG, GIF." },
  "seo.convert.f2.title": { en: "Multiple Formats", vi: "Đa định dạng" },
  "seo.convert.faq1.a": { en: "No. The conversion process preserves the original quality unless you actively compress the image.", vi: "Không. Quá trình convert giữ nguyên chất lượng gốc trừ khi bạn chủ động nén ảnh." },
  "seo.convert.faq1.q": { en: "Will my image lose quality?", vi: "Ảnh của tôi có bị giảm chất lượng không?" },
  "seo.convert.h2": { en: "Why convert image formats at Pixel Normal Edit?", vi: "Tại sao nên chuyển đổi định dạng ảnh tại Pixel Normal Edit?" },
  "seo.convert.p1": { en: "Converting image formats (Convert) is an essential need when working with Pixel Art or web graphics. We provide a free, safe and fast solution right in your browser.", vi: "Chuyển đổi định dạng hình ảnh (Convert) là nhu cầu thiết yếu khi làm việc với Pixel Art hoặc đồ hoạ web. Chúng tôi cung cấp giải pháp miễn phí, an toàn và nhanh chóng ngay trên trình duyệt." },
  "seo.convert.title": { en: "Image Converter - Fast, Free | Pixel Normal Edit", vi: "Đổi định dạng ảnh (Convert) - Nhanh chóng, Miễn phí | Pixel Normal Edit" },
  "seo.crop.desc": { en: "Free online image cropping (Crop) tool. Supports free cropping, cropping to 16:9, 1:1, 4:3 ratios quickly.", vi: "Công cụ cắt ảnh (Crop) trực tuyến miễn phí. Hỗ trợ cắt tự do, cắt theo tỷ lệ 16:9, 1:1, 4:3 nhanh chóng." },
  "seo.crop.f1.desc": { en: "Easily crop to standard ratios like 1:1 Square, 16:9 Cover.", vi: "Dễ dàng cắt theo tỷ lệ chuẩn như Khung vuông 1:1, Ảnh bìa 16:9." },
  "seo.crop.f1.title": { en: "Crop by Aspect Ratio", vi: "Cắt theo Aspect Ratio" },
  "seo.crop.h2": { en: "Crop images precisely as you want", vi: "Cắt ảnh chuẩn xác theo ý muốn" },
  "seo.crop.p1": { en: "Crop out excess parts of the photo, focus on the main subject. Our Crop tool allows extremely smooth drag and drop, supporting both mobile and desktop.", vi: "Cắt xén các phần thừa của bức ảnh, tập trung vào đối tượng chính. Công cụ Crop của chúng tôi cho phép kéo thả cực kỳ mượt mà, hỗ trợ cả di động và máy tính." },
  "seo.crop.title": { en: "Crop Image Online - Accurate, easy to use | Pixel Normal Edit", vi: "Cắt ảnh trực tuyến (Crop Image) - Chuẩn xác, dễ dùng | Pixel Normal Edit" },
  "seo.faq": { en: "Frequently Asked Questions (FAQ)", vi: "Câu hỏi thường gặp (FAQ)" },
  "seo.features": { en: "Key Features", vi: "Tính năng nổi bật" },
  "seo.home.desc": { en: "A collection of ultra-fast image utilities: Convert formats, Compress file size, Crop and Resize online for free.", vi: "Tổng hợp các tiện ích ảnh cực nhanh: Convert định dạng, Nén giảm dung lượng, Cắt và Đổi kích thước trực tuyến miễn phí." },
  "seo.home.f1.desc": { en: "No need to upload images to the cloud, 100% safe.", vi: "Không cần upload ảnh lên mây, an toàn tuyệt đối." },
  "seo.home.f1.title": { en: "Privacy", vi: "Bảo mật" },
  "seo.home.f2.desc": { en: "Takes less than 1 second to process a task.", vi: "Chỉ tốn chưa tới 1 giây để xử lý xong một tác vụ." },
  "seo.home.f2.title": { en: "Speed", vi: "Tốc độ" },
  "seo.home.h2": { en: "Small Utilities, Big Power", vi: "Tiện ích nhỏ, Sức mạnh lớn" },
  "seo.home.p1": { en: "Besides the powerful Pixel Art editor, Pixel Normal Edit provides you with a standalone Mini-Tools suite. All calculations are done via advanced HTML5 Canvas technology.", vi: "Ngoài trình chỉnh sửa Pixel Art mạnh mẽ, Pixel Normal Edit còn cung cấp cho bạn một bộ Mini-Tools độc lập. Tất cả tính toán đều được thực hiện thông qua công nghệ HTML5 Canvas tiên tiến." },
  "seo.home.title": { en: "Fast Image Processing Tools | Pixel Normal Edit", vi: "Bộ công cụ xử lý ảnh nhanh | Pixel Normal Edit" },
  "seo.resize.desc": { en: "Tool to zoom in, zoom out (Resize), change Width and Height resolution quickly on any device.", vi: "Công cụ phóng to, thu nhỏ ảnh (Resize), thay đổi độ phân giải Width, Height nhanh chóng trên mọi thiết bị." },
  "seo.resize.f1.desc": { en: "Preserve original Aspect Ratio so the image is not distorted after zooming.", vi: "Bảo toàn Aspect Ratio gốc để ảnh không bị méo lệch sau khi thu phóng." },
  "seo.resize.f1.title": { en: "Maintain aspect ratio", vi: "Giữ nguyên tỷ lệ" },
  "seo.resize.f2.desc": { en: "Supports Pixelated (For Pixel Art) and Smooth (For regular images).", vi: "Hỗ trợ Pixelated (Dành cho Pixel Art) và Smooth (Dành cho ảnh thường)." },
  "seo.resize.f2.title": { en: "Algorithm options", vi: "Tuỳ chọn thuật toán" },
  "seo.resize.h2": { en: "Image Resizing Utility", vi: "Tiện ích Resize kích thước ảnh" },
  "seo.resize.p1": { en: "Whether you need to Resize images to post on Facebook, Instagram, or make advertising banners, our resizer will help you operate accurately to every Pixel.", vi: "Cho dù bạn cần Resize ảnh để đăng Facebook, Instagram, hoặc làm banner quảng cáo, trình thay đổi kích thước của chúng tôi sẽ giúp bạn thao tác chuẩn xác tới từng Pixel." },
  "seo.resize.title": { en: "Resize Image, change resolution | Pixel Normal Edit", vi: "Đổi kích thước ảnh (Resize), thay đổi phân giải | Pixel Normal Edit" },
  "seo.rotate.desc": { en: "Tool to rotate images 90 degrees, 180 degrees, flip horizontally, flip vertically (Flip) quickly directly in the browser, without losing quality.", vi: "Công cụ xoay ảnh 90 độ, 180 độ, lật ngang, lật dọc (Flip) nhanh chóng trực tiếp trên trình duyệt, không làm giảm chất lượng." },
  "seo.rotate.f1.desc": { en: "Rotate left, rotate right freely with an algorithm that preserves pixels.", vi: "Xoay trái, xoay phải tự do với thuật toán giữ nguyên điểm ảnh." },
  "seo.rotate.f1.title": { en: "Rotate 90°, 180°", vi: "Xoay 90°, 180°" },
  "seo.rotate.f2.desc": { en: "Supports horizontal or vertical flipping extremely easily.", vi: "Hỗ trợ lật ngang (Horizontal) hoặc lật dọc (Vertical) cực kỳ dễ dàng." },
  "seo.rotate.f2.title": { en: "Mirror Flip", vi: "Lật gương (Flip)" },
  "seo.rotate.h2": { en: "Super fast Image Rotation and Flipping", vi: "Xoay và Lật hình ảnh siêu tốc" },
  "seo.rotate.p1": { en: "Sometimes you take a picture backwards or tilted. Don't worry, the rotate and flip tool will help you correct the angle with just one click.", vi: "Đôi khi bạn chụp ảnh bị ngược hoặc bị nghiêng. Đừng lo, công cụ xoay và lật ảnh sẽ giúp bạn sửa lại góc độ chỉ bằng một cú nhấp chuột." },
  "seo.rotate.title": { en: "Rotate & Flip Images Online | Pixel Normal Edit", vi: "Xoay và Lật ảnh (Rotate & Flip) trực tuyến | Pixel Normal Edit" },
  "settings.accountTitle": { en: "Pixel Normal Edit Account", vi: "Tài khoản Pixel Normal Edit" },
  "settings.aiConnection": { en: "AI Connection (MCP)", vi: "Kết nối AI (MCP)" },
  "settings.animations": { en: "Enable UI animations", vi: "Bật hiệu ứng chuyển động (Animations)" },
  "settings.autoSaveDest": { en: "Auto Save Destination", vi: "Nơi lưu tự động (Auto Save)" },
  "settings.autoSaveDest.both": { en: "Save to both Local Directory and Google Drive", vi: "Lưu vào cả Thư mục cục bộ và Google Drive" },
  "settings.autoSaveDest.drive": { en: "Save to Google Drive only", vi: "Chỉ lưu vào Google Drive" },
  "settings.autoSaveDest.local": { en: "Save to Local Directory only", vi: "Chỉ lưu vào Thư mục cục bộ" },
  "settings.autoSaveDest.none": { en: "Disable offline auto save", vi: "Tắt tự động lưu ngoại tuyến" },
  "settings.autoSaveDestDesc": { en: "The system will automatically sync your files every 5 seconds when there are changes.", vi: "Hệ thống sẽ tự động đồng bộ file của bạn theo chu kỳ 5 giây mỗi khi có thay đổi." },
  "settings.canvasSize": { en: "Canvas Size Settings", vi: "Cài đặt Kích thước" },
  "settings.changeDirectory": { en: "Change Directory", vi: "Thay đổi thư mục" },
  "settings.clearDirectory": { en: "Clear Config", vi: "Xóa cấu hình" },
  "settings.display": { en: "Display", vi: "Hiển thị" },
  "settings.langEnglish": { en: "English", vi: "English" },
  "settings.langVietnamese": { en: "Vietnamese", vi: "Tiếng Việt" },
  "settings.language": { en: "Language", vi: "Ngôn ngữ" },
  "settings.localDirectory": { en: "Local Directory", vi: "Thư mục cục bộ" },
  "settings.localDirectoryDesc": { en: "Grant permission to save files directly to your device without the download dialog.", vi: "Cấp quyền cho trình duyệt lưu file trực tiếp vào thiết bị của bạn mà không cần phải hiện hộp thoại tải xuống." },
  "settings.mcpOptionA": { en: "Option A: For Claude Desktop", vi: "Tùy chọn A: Dành cho Claude Desktop" },
  "settings.mcpOptionADesc": { en: "Add this configuration to your claude_desktop_config.json file:", vi: "Thêm cấu hình này vào file claude_desktop_config.json của bạn:" },
  "settings.mcpOptionB": { en: "Option B: For Cursor (Terminal Command)", vi: "Tùy chọn B: Dành cho Cursor (Dạng lệnh Terminal)" },
  "settings.mcpOptionBDesc": { en: "Run this command in your Terminal to start the MCP server:", vi: "Chạy lệnh này trong Terminal để khởi động máy chủ MCP:" },
  "settings.noDirectorySelected": { en: "No directory selected", vi: "Chưa cấu hình Thư mục cục bộ" },
  "settings.penShapeTitle": { en: "Pen Shape", vi: "Hình dạng bút vẽ" },
  "settings.selectDirectory": { en: "Select Directory", vi: "Chọn thư mục" },
  "settings.showBtnNames": { en: "Show button names", vi: "Hiện tên nút" },
  "shortcuts.cat.actions": { en: "Actions", vi: "Thao tác" },
  "shortcuts.cat.animation": { en: "Animation", vi: "Animation" },
  "shortcuts.cat.layers": { en: "Layers", vi: "Layers" },
  "shortcuts.cat.modes": { en: "Modes", vi: "Chế độ" },
  "shortcuts.cat.tools": { en: "Drawing Tools", vi: "Công cụ vẽ" },
  "shortcuts.cat.transforms": { en: "Transforms", vi: "Biến đổi" },
  "shortcuts.cat.zoom": { en: "Zoom", vi: "Zoom" },
  "shortcuts.confirmReset": { en: "Reset all shortcuts to default?", vi: "Khôi phục tất cả phím tắt về mặc định?" },
  "shortcuts.conflictDesc": { en: "This shortcut is already used by:", vi: "Phím tắt này đang được sử dụng bởi:" },
  "shortcuts.conflictTitle": { en: "Shortcut Conflict", vi: "Xung đột phím tắt" },
  "shortcuts.edit": { en: "Edit", vi: "Sửa" },
  "shortcuts.export": { en: "Export", vi: "Xuất" },
  "shortcuts.import": { en: "Import", vi: "Nhập" },
  "shortcuts.importError": { en: "Error importing file", vi: "Lỗi khi import file" },
  "shortcuts.override": { en: "Override", vi: "Ghi đè" },
  "shortcuts.pressKey": { en: "Press key...", vi: "Nhấn phím..." },
  "shortcuts.resetAll": { en: "Reset to Default", vi: "Khôi phục mặc định" },
  "shortcuts.title": { en: "Keyboard Shortcuts", vi: "Phím tắt" },
  "status.analyzeShape": { en: "Analyzing shapes...", vi: "Đang phân tích hình dạng..." },
  "status.bgFlattened": { en: "Background successfully flattened into canvas.", vi: "Đã gộp ảnh nền vào canvas thành công." },
  "status.bgOn": { en: "Source image set as background.", vi: "Đã đặt ảnh gốc làm nền lưới (tối màu)." },
  "status.blankCanvas": { en: "Canvas is empty, cannot trim!", vi: "Canvas đang trống, không thể xén!" },
  "status.calcOutline": { en: "Calculating outline...", vi: "Đang tính toán viền..." },
  "status.calcOutlinePct": { en: "Calculating outline: {0}%...", vi: "Đang tính toán viền: {0}%..." },
  "status.compressed": { en: "Compressed", vi: "Đã nén" },
  "status.compressing": { en: "Compressing image...", vi: "Đang nén ảnh..." },
  "status.copied": { en: "Copied", vi: "Đã sao chép" },
  "status.dlJpeg": { en: "Downloaded JPEG", vi: "Đã tải xuống ảnh JPEG" },
  "status.dlJson": { en: "Downloaded JSON project.", vi: "Đã tải xuống dự án JSON." },
  "status.dlPng": { en: "Downloaded PNG", vi: "Đã tải xuống ảnh PNG" },
  "status.dlWebp": { en: "Downloaded WEBP", vi: "Đã tải xuống ảnh WEBP" },
  "status.drawOutlinePct": { en: "Drawing outline: {0}%...", vi: "Đang vẽ viền: {0}%..." },
  "status.driveConnected": { en: "Connected to Google Drive", vi: "Đã kết nối Google Drive" },
  "status.driveDisconnected": { en: "Disconnected from Google Drive", vi: "Đã ngắt kết nối Google Drive" },
  "status.eraserDone": { en: "Eraser complete ({0} pixels).", vi: "Hoàn tất tẩy vùng màu ({0} pixels)." },
  "status.eraserError": { en: "Error erasing area.", vi: "Lỗi khi tẩy màu." },
  "status.erasing": { en: "Erasing...", vi: "Đang xóa màu..." },
  "status.erasingPct": { en: "Erasing: {0}%...", vi: "Đang xóa màu: {0}%..." },
  "status.error": { en: "Error", vi: "Lỗi" },
  "status.fileCreatedLocal": { en: "File created in Local Directory", vi: "Đã tạo file tại Thư mục cục bộ" },
  "status.fillComplete": { en: "Fill complete", vi: "Đã hoàn tất đổ màu" },
  "status.fillError": { en: "Error filling area.", vi: "Lỗi khi đổ màu." },
  "status.filling": { en: "Filling...", vi: "Đang đổ màu..." },
  "status.fillingPct": { en: "Filling: {0}%...", vi: "Đang đổ màu: {0}%..." },
  "status.flippedH": { en: "Flipped Horizontally.", vi: "Đã lật ngang." },
  "status.flippedV": { en: "Flipped Vertically.", vi: "Đã lật dọc." },
  "status.imgComplete": { en: "Image compressed", vi: "Hoàn tất nén ảnh" },
  "status.imgLoaded": { en: "Image loaded", vi: "Đã tải ảnh" },
  "status.imgProcessing": { en: "Processing image...", vi: "Đang xử lý ảnh..." },
  "status.init": { en: "Welcome to Pixel Normal Edit!", vi: "Chào mừng đến với Pixel Normal Edit!" },
  "status.jsonError": { en: "JSON parsing error:", vi: "Lỗi đọc JSON:" },
  "status.jsonInvalid": { en: "Invalid JSON structure.", vi: "Cấu trúc JSON không hợp lệ." },
  "status.jsonLoaded": { en: "JSON Loaded.", vi: "Đã tải JSON." },
  "status.loading": { en: "Loading...", vi: "Đang tải..." },
  "status.mcpConnected": { en: "Status: MCP Connected", vi: "Trạng thái: đã kết nối mcp" },
  "status.mcpWaiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối..." },
  "status.needImg": { en: "Please upload an image first.", vi: "Vui lòng tải ảnh lên trước." },
  "status.newCanvas": { en: "New canvas created.", vi: "Đã tạo trang mới." },
  "status.outlineDone": { en: "Outline complete ({0} pixels).", vi: "Hoàn tất vẽ viền ({0} pixels)." },
  "status.outlineError": { en: "Error drawing outline.", vi: "Lỗi khi tạo viền." },
  "status.pasted": { en: "Pasted", vi: "Đã dán" },
  "status.pickedColor": { en: "Picked color:", vi: "Đã hút màu:" },
  "status.ready": { en: "Ready", vi: "Sẵn sàng" },
  "status.redo": { en: "Redo", vi: "Redo" },
  "status.rotated": { en: "Rotated 90°.", vi: "Đã xoay 90°." },
  "status.saved": { en: "Saved", vi: "Đã lưu" },
  "status.savedToDrive": { en: "Saved to Google Drive", vi: "Đã lưu vào Google Drive" },
  "status.savedToLocal": { en: "Saved to Local Directory", vi: "Đã lưu vào Thư mục cục bộ" },
  "status.saving": { en: "Saving...", vi: "Đang lưu..." },
  "status.scanBg": { en: "Scanning background...", vi: "Đang quét nền..." },
  "status.scanBgCount": { en: "Scanning background: {0} blocks...", vi: "Đang quét nền: {0} khối..." },
  "status.scanEraser": { en: "Scanning erase area...", vi: "Đang quét vùng cần tẩy..." },
  "status.scanFill": { en: "Scanning fill area...", vi: "Đang quét vùng cần đổ màu..." },
  "status.syncError": { en: "Sync error", vi: "Lỗi đồng bộ" },
  "status.taskAborted": { en: "Task aborted.", vi: "Đã dừng thuật toán." },
  "status.toolHidden": { en: "Please select a tool to use.", vi: "Vui lòng chọn một công cụ để sử dụng." },
  "status.toolSelected": { en: "Selected tool:", vi: "Đã chọn công cụ:" },
  "status.undo": { en: "Undo", vi: "Undo" },
  "status.zoom": { en: "Zoom:", vi: "Zoom:" },
  "status.zoomFit": { en: "Zoom: Fit to Screen", vi: "Zoom: Vừa màn hình" },
  "tab.newCanvas": { en: "New Canvas", vi: "New Canvas" },
  "text.apply": { en: "Apply", vi: "Xác nhận" },
  "text.bold": { en: "Bold", vi: "In đậm" },
  "text.cancel": { en: "Cancel", vi: "Hủy" },
  "text.color": { en: "Color", vi: "Màu sắc" },
  "text.emptyStore": { en: "Empty. Use Copy/Cut to save.", vi: "Trống. Dùng Copy/Cắt để lưu." },
  "text.fontFamily": { en: "Font", vi: "Phông chữ" },
  "text.fontSize": { en: "Size", vi: "Cỡ chữ" },
  "text.hideTools": { en: "Hide Tools", vi: "Đóng công cụ" },
  "text.italic": { en: "Italic", vi: "In nghiêng" },
  "text.showTools": { en: "Show Tools", vi: "Mở công cụ" },
  "theme.bg": { en: "Background (Bg)", vi: "Nền (Bg)" },
  "theme.custom": { en: "Custom", vi: "Tùy chỉnh (Custom)" },
  "theme.dark": { en: "Dark", vi: "Tối (Dark)" },
  "theme.gridLine": { en: "Grid color", vi: "Màu lưới (Grid)" },
  "theme.light": { en: "Light", vi: "Sáng (Light)" },
  "theme.primary": { en: "Accent (Primary)", vi: "Nhấn (Primary)" },
  "theme.title": { en: "Theme", vi: "Giao diện (Theme)" },
  "tool.blend-brush": { en: "Blend colors between pixels", vi: "Trộn màu mượt giữa các pixel" },
  "tool.blendBrush": { en: "Blend Brush", vi: "Cọ trộn" },
  "tool.circle": { en: "Draw a circle", vi: "Vẽ hình tròn" },
  "tool.copy": { en: "Copy", vi: "Sao chép" },
  "tool.crop": { en: "Crop", vi: "Cắt" },
  "tool.cut": { en: "Cut", vi: "Cắt (Cut)" },
  "tool.dither-brush": { en: "Dither (checkerboard) pattern brush for blending", vi: "Cọ lưới (checkerboard) tạo hiệu ứng blending" },
  "tool.ditherBrush": { en: "Dither Brush", vi: "Cọ lưới" },
  "tool.eraser": { en: "Erase drawn pixels", vi: "Xóa pixel đã vẽ" },
  "tool.fill": { en: "Fill", vi: "Đổ đầy vùng liền kề cùng màu" },
  "tool.highlight-pen": { en: "Draw lighter highlight pixels", vi: "Vẽ điểm sáng nổi bật" },
  "tool.highlightPen": { en: "Highlight Pen", vi: "Bút sáng" },
  "tool.line": { en: "Draw a straight line", vi: "Vẽ một đường thẳng" },
  "tool.magicEraser": { en: "Magic Eraser", vi: "Tự động xóa nền hoặc vùng màu" },
  "tool.outline": { en: "Outline", vi: "Vẽ viền quanh hình vẽ" },
  "tool.pan": { en: "Pan around the canvas", vi: "Di chuyển vùng xem canvas" },
  "tool.paste": { en: "Paste", vi: "Dán" },
  "tool.picker": { en: "Color Picker", vi: "Lấy màu từ pixel có sẵn" },
  "tool.pixel-pen": { en: "Draw precise pixels", vi: "Vẽ từng pixel chính xác" },
  "tool.pixelPen": { en: "Pixel Pen", vi: "Bút pixel" },
  "tool.rect": { en: "Draw a rectangle", vi: "Vẽ hình chữ nhật" },
  "tool.replaceColor": { en: "Replace one color with another", vi: "Thay toàn bộ 1 màu bằng màu khác" },
  "tool.select": { en: "Select", vi: "Chọn vùng" },
  "tool.soft-brush": { en: "Soft brush with fading edges", vi: "Cọ mềm (soft brush) làm mờ xung quanh điểm vẽ" },
  "tool.softBrush": { en: "Soft Brush", vi: "Cọ mềm" },
  "tool.spray-pen": { en: "Spray scattered pixels", vi: "Phun màu rải rác ngẫu nhiên" },
  "tool.sprayPen": { en: "Spray Pen", vi: "Phun màu" },
  "tool.text": { en: "Text Tool", vi: "Chèn chữ (Text)" },
  "toolLayout.backHome": { en: "Back to home", vi: "Về trang chủ" },
  "toolLayout.editor": { en: "🎨 Editor", vi: "🎨 Editor" },
  "toolVariant.circle": { en: "Circle", vi: "Hình tròn" },
  "toolVariant.eraser": { en: "Eraser", vi: "Tẩy" },
  "toolVariant.fill": { en: "Fill", vi: "Đổ màu" },
  "toolVariant.line": { en: "Line", vi: "Đường thẳng" },
  "toolVariant.magic": { en: "Magic Eraser", vi: "Xóa nền" },
  "toolVariant.outline": { en: "Outline", vi: "Tạo viền" },
  "toolVariant.picker": { en: "Color Picker", vi: "Lấy màu" },
  "toolVariant.rect": { en: "Rectangle", vi: "Hình chữ nhật" },
  "toolbarReset.error": { en: "Error restoring toolbar state", vi: "Lỗi khi phục hồi toolbar state" },
  "tooltip.anchorBottomCenter": { en: "Bottom Center", vi: "Neo giữa phía dưới" },
  "tooltip.anchorBottomLeft": { en: "Bottom Left", vi: "Neo góc dưới bên trái" },
  "tooltip.anchorBottomRight": { en: "Bottom Right", vi: "Neo góc dưới bên phải" },
  "tooltip.anchorCenter": { en: "Center", vi: "Canh giữa" },
  "tooltip.anchorCenterLeft": { en: "Center Left", vi: "Neo giữa bên trái" },
  "tooltip.anchorCenterRight": { en: "Center Right", vi: "Neo giữa bên phải" },
  "tooltip.anchorTopCenter": { en: "Top Center", vi: "Neo giữa phía trên" },
  "tooltip.anchorTopLeft": { en: "Top Left", vi: "Neo góc trên bên trái" },
  "tooltip.anchorTopRight": { en: "Top Right", vi: "Neo góc trên bên phải" },
  "tooltip.animExport": { en: "Export as animation", vi: "Xuất ảnh động" },
  "tooltip.cancelDownload": { en: "Cancel download", vi: "Hủy tải" },
  "tooltip.closeModal": { en: "Close modal", vi: "Đóng" },
  "tooltip.collapseAnimStrip": { en: "Collapse", vi: "Thu gọn" },
  "tooltip.collapseToolbar": { en: "Collapse / Expand", vi: "Thu gọn / Mở rộng" },
  "tooltip.computerSource": { en: "Upload from computer", vi: "Tải lên từ máy tính" },
  "tooltip.copy": { en: "Copy (Ctrl+C)", vi: "Sao chép (Ctrl+C)" },
  "tooltip.copyDesc": { en: "Copy selected area", vi: "Sao chép phần đang chọn" },
  "tooltip.cut": { en: "Cut (Ctrl+X)", vi: "Cắt (Ctrl+X)" },
  "tooltip.cutDesc": { en: "Cut selected area", vi: "Cắt phần đang chọn" },
  "tooltip.deleteFrame": { en: "Delete this frame", vi: "Xóa trang này" },
  "tooltip.deleteImage": { en: "Delete", vi: "Xóa" },
  "tooltip.driveDest": { en: "Save to Google Drive", vi: "Lưu lên Google Drive" },
  "tooltip.driveSource": { en: "Upload from Google Drive", vi: "Tải lên từ Google Drive" },
  "tooltip.eraserSize": { en: "Change eraser size", vi: "Đổi cỡ đầu tẩy" },
  "tooltip.executeDownload": { en: "Execute download", vi: "Tiến hành tải" },
  "tooltip.expandAnimStrip": { en: "Expand animation strip", vi: "Mở thanh trang vẽ" },
  "tooltip.fitInside": { en: "Fit (Keep entire image in frame)", vi: "Vừa khít (Giữ toàn bộ ảnh trong khung)" },
  "tooltip.flattenBg": { en: "Merge background into canvas", vi: "Gộp nền vào canvas vĩnh viễn" },
  "tooltip.frameNumber": { en: "Page {0}", vi: "Trang {0}" },
  "tooltip.gradientMode": { en: "Gradient", vi: "Gradient" },
  "tooltip.gridSize": { en: "Change canvas dimensions", vi: "Đổi kích thước canvas" },
  "tooltip.indexMode": { en: "Use integer key format (like export format)", vi: "Dùng Key là số nguyên (giống định dạng tải về từ máy)" },
  "tooltip.insertAfter": { en: "Insert frame after", vi: "Chèn trang sau" },
  "tooltip.insertBefore": { en: "Insert frame before", vi: "Chèn trang trước" },
  "tooltip.localDest": { en: "Save to local device", vi: "Lưu xuống máy tính" },
  "tooltip.login": { en: "Login to save on Drive", vi: "Đăng nhập để lưu trên Drive" },
  "tooltip.mirrorMode": { en: "Mirror", vi: "Đối xứng" },
  "tooltip.newCanvas": { en: "Create blank canvas in new tab", vi: "Tạo canvas trắng ở tab mới" },
  "tooltip.nextFrame": { en: "Next frame", vi: "Trang sau" },
  "tooltip.onionSkin": { en: "View previous frame (onion skin)", vi: "Xem trang trước (onion skin)" },
  "tooltip.paste": { en: "Paste (Ctrl+V)", vi: "Dán (Ctrl+V)" },
  "tooltip.pasteDesc": { en: "Paste copied area", vi: "Dán phần đã sao chép" },
  "tooltip.pasteImage": { en: "Click to Paste, Right-click to Pin", vi: "Click để Dán, chuột phải để Ghim" },
  "tooltip.pasteJsonSource": { en: "Paste JSON code", vi: "Dán mã JSON" },
  "tooltip.pencilSize": { en: "Change pen brush size", vi: "Đổi cỡ đầu bút vẽ" },
  "tooltip.pin": { en: "Pin", vi: "Ghim" },
  "tooltip.prevFrame": { en: "Previous frame", vi: "Trang trước" },
  "tooltip.primaryColor": { en: "Choose primary draw color", vi: "Chọn màu vẽ chính" },
  "tooltip.redo": { en: "Redo undone action", vi: "Làm lại thao tác đã hoàn tác" },
  "tooltip.renameTab": { en: "Double-click to rename tab", vi: "Nhấp đúp để đổi tên tab" },
  "tooltip.replaceBg": { en: "Replace background image", vi: "Thay ảnh nền khác" },
  "tooltip.replaceTolerance": { en: "Color Tolerance", vi: "Độ sai lệch màu" },
  "tooltip.resetAnchor": { en: "Reset to default", vi: "Khôi phục mặc định" },
  "tooltip.rulerMode": { en: "Ruler", vi: "Thước đo" },
  "tooltip.secondaryColor": { en: "Choose secondary draw color", vi: "Chọn màu vẽ phụ" },
  "tooltip.setBg": { en: "Set image as reference background", vi: "Đặt ảnh làm nền tham chiếu" },
  "tooltip.settings": { en: "Settings", vi: "Cài đặt" },
  "tooltip.showGrid": { en: "Show Grid", vi: "Lưới" },
  "tooltip.sprayDensity": { en: "Pixels released per spray", vi: "Số điểm ảnh mỗi lần phun" },
  "tooltip.spraySize": { en: "Size of spray area", vi: "Kích thước vùng phun màu" },
  "tooltip.staticExport": { en: "Export as static image", vi: "Xuất ảnh tĩnh" },
  "tooltip.swapColors": { en: "Swap primary and secondary colors", vi: "Đảo màu chính và màu phụ" },
  "tooltip.toggleNav": { en: "Show or hide navigation bar", vi: "Ẩn/hiện thanh điều hướng" },
  "tooltip.toggleTools": { en: "Show or hide tool panel", vi: "Ẩn/hiện bảng công cụ" },
  "tooltip.transparentBg": { en: "Toggle transparent background", vi: "Bật/tắt nền trong suốt" },
  "tooltip.undo": { en: "Undo last action", vi: "Hoàn tác thao tác vừa làm" },
  "tooltip.unpin": { en: "Unpin", vi: "Bỏ ghim" },
  "tooltip.uploadFull": { en: "Open image or JSON project file", vi: "Mở ảnh hoặc file JSON dự án" },
  "tooltip.viewAnimation": { en: "View Animation", vi: "Xem Animation" },
  "tooltip.viewSource": { en: "View Source Image", vi: "Xem ảnh gốc" },
  "tooltip.zoomIn": { en: "Zoom in on canvas", vi: "Phóng to canvas" },
  "tooltip.zoomOut": { en: "Zoom out on canvas", vi: "Thu nhỏ canvas" },
  "tooltip.zoomReset": { en: "Fit canvas to screen", vi: "Canh vừa khung nhìn" },
  "transform.flipH": { en: "Flip Horizontal", vi: "Lật ngang" },
  "transform.flipV": { en: "Flip Vertical", vi: "Lật dọc" },
  "transform.rotate": { en: "Rotate", vi: "Xoay" },
  "transform.trim": { en: "Trim Canvas", vi: "Xén canvas" },
  "troubleshoot.desc": { en: "If the app has an error or gets stuck, you can clear all local data to restore it to its initial state.", vi: "Nếu ứng dụng bị lỗi hoặc kẹt, bạn có thể xóa toàn bộ dữ liệu cục bộ để khôi phục lại trạng thái ban đầu." },
  "troubleshoot.reset": { en: "Restore Original Data (Reset)", vi: "Khôi phục dữ liệu gốc (Reset)" },
  "troubleshoot.title": { en: "Troubleshooting", vi: "Khắc phục sự cố" },
  "upload.confirmSpriteAnim": { en: "Do you want to open this Spritesheet as an Animation?\n- OK: Split into animation frames\n- Cancel: Keep as static image", vi: "Bạn có muốn mở Spritesheet này dưới dạng Ảnh động (Animation) không?\n- OK: Cắt thành các frame ảnh động\n- Hủy: Giữ nguyên ảnh tĩnh" },
  "upload.maxFilesError": { en: "Exceeded maximum allowed files", vi: "Vượt quá số lượng file cho phép" },
  "upload.mixFileError": { en: "Cannot upload mixed file types at once", vi: "Không thể tải lên nhiều loại file cùng lúc" },
  "upload.multiFallbackConfirm": { en: "You are uploading multiple files. Do you want to open them as separate tabs?", vi: "Bạn đang tải lên nhiều file. Bạn có muốn mở chúng thành các Tab riêng biệt không?" },
  "upload.overrideAnimConfirm": { en: "You are in animation mode. Overwrite mode will delete all old frames and keep only a single image. Are you sure you want to continue?", vi: "Bạn đang mở chế độ ảnh động. Chế độ Ghi đè sẽ xóa toàn bộ frame cũ và chỉ giữ lại 1 hình ảnh duy nhất. Bạn có chắc chắn muốn tiếp tục không?" },
  "upload.promptSpriteFrames": { en: "Enter the number of frames for this spritesheet:", vi: "Nhập số lượng frame cho spritesheet này:" },
  "upload.singleFileOverrideError": { en: "Overwrite mode only supports uploading a single file.", vi: "Chế độ Ghi đè chỉ hỗ trợ tải lên 1 file duy nhất." },
  "upload.singleVideoError": { en: "Only 1 Video file can be uploaded at a time.", vi: "Chỉ hỗ trợ tải lên 1 file Video mỗi lần." },
  "upload.singleZipError": { en: "Only 1 ZIP file can be uploaded at a time.", vi: "Chỉ hỗ trợ tải lên 1 file ZIP mỗi lần." },
  "upload.skipFilesError": { en: "Skipped unsupported files: {0}", vi: "Bỏ qua các file không hỗ trợ: {0}" },
  "uploadAnim.extractingFrame": { en: "Extracting video frame {0}/{1}...", vi: "Đang tách frame video {0}/{1}..." },
  "uploadAnim.gifError": { en: "Error reading GIF: {0}", vi: "Lỗi khi đọc GIF: {0}" },
  "uploadAnim.gifSuccess": { en: "GIF loaded successfully ({0} frames)", vi: "Đã tải GIF thành công ({0} frames)" },
  "uploadAnim.gifWarning": { en: "Warning: Large GIF or many frames may freeze the browser. Continue processing...", vi: "Cảnh báo: GIF lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý..." },
  "uploadAnim.invalidFps": { en: "Invalid FPS.", vi: "FPS không hợp lệ." },
  "uploadAnim.noPngInZip": { en: "No .png files found in ZIP.", vi: "Không tìm thấy file .png nào trong ZIP." },
  "uploadAnim.processingFrame": { en: "Processing frame {0}/{1}...", vi: "Đang xử lý frame {0}/{1}..." },
  "uploadAnim.promptFps": { en: "Enter the number of frames per second (FPS) to extract:", vi: "Nhập số khung hình trên giây (FPS) muốn tách:" },
  "uploadAnim.spriteSuccess": { en: "Sprite Sheet loaded successfully ({0} frames)", vi: "Đã tải Sprite Sheet thành công ({0} frames)" },
  "uploadAnim.videoError": { en: "Error reading Video: {0}", vi: "Lỗi khi đọc Video: {0}" },
  "uploadAnim.videoSuccess": { en: "Video loaded successfully ({0} frames)", vi: "Đã tải Video thành công ({0} frames)" },
  "uploadAnim.videoWarning": { en: "Warning: Large Video or many frames may freeze the browser. Continue processing...", vi: "Cảnh báo: Video lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý..." },
  "uploadAnim.zipError": { en: "Error reading ZIP: {0}", vi: "Lỗi khi đọc ZIP: {0}" },
  "uploadAnim.zipSuccess": { en: "ZIP loaded successfully ({0} frames)", vi: "Đã tải ZIP thành công ({0} frames)" },
  "uploadModal.readImageError": { en: "Error reading image file", vi: "Lỗi đọc file ảnh" },
  "userInput.approve": { en: "Approve", vi: "Đồng ý" },
  "userInput.autoSubmitIn": { en: "Auto-submitting in:", vi: "Tự động gửi sau:" },
  "userInput.autoSubmitted": { en: " (Auto-submitted by system due to 15s timeout)", vi: " (Hệ thống tự gửi do quá 15 giây)" },
  "userInput.cancel": { en: "Cancel", vi: "Hủy" },
  "userInput.desc": { en: "The AI assistant is waiting for your input to proceed.", vi: "Trợ lý AI đang chờ bạn nhập dữ liệu để tiếp tục." },
  "userInput.height": { en: "Height", vi: "Chiều cao" },
  "userInput.reject": { en: "Reject", vi: "Từ chối" },
  "userInput.rejected": { en: "User rejected/cancelled the request.", vi: "Người dùng đã từ chối/hủy yêu cầu." },
  "userInput.submit": { en: "Submit", vi: "Gửi" },
  "userInput.title": { en: "AI Needs Input ({0})", vi: "AI Cần Nhập Liệu ({0})" },
  "userInput.width": { en: "Width", vi: "Chiều rộng" },
  "zoom.fit": { en: "Fit to Screen", vi: "Vừa màn hình" },
  "zoom.in": { en: "Zoom In", vi: "Phóng to" },
  "zoom.out": { en: "Zoom Out", vi: "Thu nhỏ" },
  "advancedEngine.initError": { en: "Failed to initialize Advanced Mode (ImageMagick).", vi: "Không thể khởi tạo Chế độ Nâng cao (ImageMagick)." },
  "advancedEngine.unsupportedFormat": { en: "Format not supported by Advanced Engine: {0}", vi: "Định dạng không được hỗ trợ bởi Advanced Engine: {0}" },
  "commandBus.apiNotDefined": { en: "api is not defined", vi: "api chưa được khởi tạo" },
  "commandBus.invalidFormat": { en: "Invalid command format", vi: "Định dạng lệnh không hợp lệ" },
  "commandBus.mustBeArray": { en: "Commands must be an array", vi: "Commands phải là một mảng" },
  "commandBus.noBeforeState": { en: "editValidateDiff: No before state captured. Call editValidateBeforeState first.", vi: "editValidateDiff: Chưa ghi nhận trạng thái trước. Hãy gọi editValidateBeforeState trước." },
  "commandBus.noRegionCopied": { en: "No region copied. Use copyRegion first.", vi: "Chưa có vùng nào được sao chép. Hãy gọi copyRegion trước." },
  "commandBus.queryMissingType": { en: "query: missing type", vi: "query: thiếu kiểu (type)" },
  "cropPage.changeImage": { en: "Choose another image", vi: "Chọn ảnh khác" },
  "cropPage.cropBtn": { en: "Apply Crop", vi: "Áp dụng Cắt" },
  "cropPage.done": { en: "Crop successful!", vi: "Đã cắt thành công" },
  "cropPage.download": { en: "Download", vi: "Tải ảnh về" },
  "cropPage.previewAlt": { en: "Cropped preview", vi: "Xem trước ảnh đã cắt" },
  "cropPage.reset": { en: "Reset", vi: "Reset" },
  "editorApi.framesDifferentDims": { en: "Frames have different dimensions", vi: "Các frame có kích thước khác nhau" },
  "editorApi.invalidFrameIndex": { en: "Invalid frame index", vi: "Chỉ số frame không hợp lệ" },
  "editorApi.noActiveTab": { en: "No active tab to export", vi: "Không có tab đang mở để xuất" },
  "editorApi.unsupportedFormat": { en: "Unsupported format: {0}", vi: "Định dạng không hỗ trợ: {0}" },
  "encoder.invalidFormat": { en: "Invalid format.", vi: "Định dạng không hợp lệ." },
  "encoder.advancedRequired": { en: "Format {0} requires Advanced Mode to be enabled.", vi: "Định dạng {0} yêu cầu bật Chế độ Nâng cao (Advanced Mode)." },
  "encoder.unsupportedBrowser": { en: "Your browser does not support exporting this format. Please choose another.", vi: "Trình duyệt không hỗ trợ xuất định dạng này. Vui lòng chọn định dạng khác." },
  "error.toBlobFailed": { en: "toBlob failed", vi: "Lỗi toBlob" },
  "error.videoRead": { en: "Unable to read video", vi: "Không đọc được video" },
  "error.videoSeek": { en: "Unable to seek video", vi: "Không thể seek video" },
  "framesToMedia.createBtn": { en: "Create {0}", vi: "Tạo {0}" },
  "framesToMedia.creating": { en: "Creating {0}...", vi: "Đang tạo {0}..." },
  "framesToMedia.done": { en: "Done!", vi: "Hoàn thành!" },
  "framesToMedia.drop.desc": { en: "Choose multiple images, or drop 1 GIF / MP4 / WebM file to auto-extract frames", vi: "Chọn nhiều ảnh, hoặc kéo 1 file GIF / MP4 / WebM để tự tách frame" },
  "framesToMedia.extractingFrame": { en: "Extracting frames from \"{0}\"...", vi: "Đang tách frame từ \"{0}\"..." },
  "framesToMedia.frames": { en: "Frames", vi: "Frames" },
  "framesToMedia.fpsSlow": { en: "1 (slow)", vi: "1 (chậm)" },
  "framesToMedia.fpsSmooth": { en: "30 (smooth)", vi: "30 (mượt)" },
  "framesToMedia.gifQuality": { en: "GIF quality", vi: "Chất lượng GIF" },
  "framesToMedia.gifQualityHint": { en: "Smaller = higher quality but slower render", vi: "Số càng nhỏ = chất lượng cao hơn nhưng render lâu hơn" },
  "framesToMedia.heading": { en: "Combine images into GIF / Video · Convert Video ↔ GIF", vi: "Ghép ảnh thành GIF / Video · Đổi Video ↔ GIF" },
  "framesToMedia.maxSize": { en: "Maximum size", vi: "Kích thước tối đa" },
  "framesToMedia.preview": { en: "Preview", vi: "Xem trước" },
  "framesToMedia.processing": { en: "Processing...", vi: "Đang xử lý..." },
  "framesToMedia.loading": { en: "Loading...", vi: "Đang tải..." },
  "framesToMedia.seo.desc": { en: "Combine PNG, JPG, WebP images into animated GIF or WebM. Convert Video to GIF and back. Fully processed locally in your browser.", vi: "Ghép ảnh PNG, JPG, WebP thành GIF động hoặc WebM. Chuyển Video sang GIF và ngược lại. Hoàn toàn xử lý cục bộ trên trình duyệt." },
  "framesToMedia.seo.title": { en: "Frames to GIF/Video | Pixel Normal Edit", vi: "Ghép ảnh thành GIF / Video, Đổi Video sang GIF | Pixel Normal Edit" },
  "framesToMedia.settings": { en: "Settings", vi: "Thiết lập" },
  "framesToMedia.stop": { en: "Stop", vi: "Dừng" },
  "framesToMedia.videoApplyToNext": { en: "Apply to videos added next", vi: "Áp dụng cho video thêm vào lần sau" },
  "framesToMedia.videoExtractFps": { en: "Video extraction FPS", vi: "FPS tách video" },
  "framesToMedia.webmVideo": { en: "WebM Video", vi: "WebM Video" },
  "home.koFiSupport": { en: "Support me on Ko-fi", vi: "Ủng hộ tôi trên Ko-fi" },
  "keyboardShortcuts.emptyCategory": { en: "No shortcuts in this category.", vi: "Không có phím tắt trong danh mục này." },
  "layerControl.settings": { en: "Layer Settings", vi: "Cài đặt Layer" },
  "mcpFirebase.spriteTooLarge": { en: "Sprite/data too large (max 256×256)", vi: "Sprite/dữ liệu quá lớn (tối đa 256×256)" },
  "mcpFirebase.statusTitle": { en: "MCP Status", vi: "Trạng thái MCP" },
  "status.bgLoadError": { en: "Failed to load background image", vi: "Không tải được ảnh nền" },
  "textTool.moveHint": { en: "Drag to move", vi: "Kéo để di chuyển" },
};
// >>>>>>>>>> END MASTER <<<<<<<<<<

// ==========================================
// 2. SYNC — ĐỒNG BỘ MASTER → en.js / vi.js
// ==========================================
const MASTER_BLOCK_RE = /\/\/ >>>>>>>>>> BEGIN MASTER[\s\S]*?\/\/ >>>>>>>>>> END MASTER <<<<<<<<<<\n/;

function deduplicateKeys(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const seen = new Set();
  const result = [];
  let removed = 0;
  for (const line of lines) {
    const match = line.match(/^\s*(["']?)([^"':\s]+)\1\s*:/);
    if (match) {
      const key = match[2];
      if (key === 'export' || key === 'default' || key === 'import') {
        result.push(line);
        continue;
      }
      if (seen.has(key)) { removed++; continue; }
      seen.add(key);
    }
    result.push(line);
  }
  if (removed > 0) {
    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[DEDUP] ✅ Đã xóa ${removed} key trùng lặp trong ${path.basename(filePath)}`);
  }
}

function hasKey(content, key) {
  return new RegExp(`(?:^|\\n)\\s*(["']?)${escapeRegExp(key)}\\1\\s*:`).test(content);
}

function getFileValue(content, key) {
  const m = content.match(new RegExp(`(?:^|\\n)\\s*(["']?)${escapeRegExp(key)}\\1\\s*:\\s*([^\\n]+)`, 'm'));
  if (!m) return undefined;
  const raw = m[2].trim().replace(/,$/, '');
  try { return JSON.parse(raw); } catch { return raw; }
}

function setFileValue(content, key, newValue) {
  const lineRegex = new RegExp(`(^\\s*(["']?)${escapeRegExp(key)}\\2\\s*:)(.*)$`, 'm');
  const match = content.match(lineRegex);
  if (!match) return content;
  const rest = match[3];
  const valMatch = rest.match(/^\s*(.*?)\s*(,?)\s*$/);
  const trailingComma = valMatch ? valMatch[2] : "";
  return content.replace(lineRegex, `$1 ${JSON.stringify(newValue)}${trailingComma}`);
}

function insertBeforeClosingBrace(content, newLines) {
  // Chèn trước dấu "}" cuối cùng thật sự của object (dòng chỉ có "}").
  const idx = content.lastIndexOf("\n}");
  if (idx === -1) return content;
  return content.slice(0, idx + 1) + newLines + content.slice(idx + 1);
}

function syncLanguages() {
  console.log("");
  printBox("I18N SYNC");
  const masterKeys = Object.keys(MASTER);
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalPruned = 0;

  for (const langCode of ['en', 'vi']) {
    const filePath = path.join(folderPath, `${langCode}.js`);
    if (!fs.existsSync(filePath)) {
      console.log(`[SYNC] ❌ Không tìm thấy ${filePath}`);
      continue;
    }
    deduplicateKeys(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let addedLines = "";
    let isModified = false;
    const masterSet = new Set(masterKeys);

    // 2.1 Thêm key còn thiếu + (nếu --force) cập nhật giá trị lệch
    for (const key of masterKeys) {
      const value = MASTER[key][langCode];
      if (!hasKey(content, key)) {
        addedLines += `  ${JSON.stringify(key)}: ${JSON.stringify(value)},\n`;
        totalAdded++;
      } else if (opt.force) {
        const current = getFileValue(content, key);
        if (current !== value) {
          content = setFileValue(content, key, value);
          totalUpdated++;
          isModified = true;
        }
      }
    }

    // 2.2 (nếu --prune) Xóa key không còn trong MASTER
    if (opt.prune) {
      const lineRe = /^(\s*)("((?:[^"\\]|\\.)*)"\s*:).*\r?\n?/gm;
      content = content.replace(lineRe, (whole, _indent, _keyPart, keyRaw) => {
        const key = unescapeJsonString(keyRaw);
        if (!masterSet.has(key)) { totalPruned++; isModified = true; return ''; }
        return whole;
      });
    }

    if (addedLines) {
      content = insertBeforeClosingBrace(content, addedLines);
      isModified = true;
    }
    if (isModified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[SYNC] ✅ Đã ghi cập nhật vào ${langCode}.js`);
    } else {
      console.log(`[SYNC] ✔️ ${langCode}.js đã đồng bộ đầy đủ, không cần thay đổi.`);
    }
  }

  console.log(`[SYNC] 📊 Thêm ${totalAdded} key, cập nhật ${totalUpdated} giá trị${opt.force ? '' : ' (dùng --force để ghi đè giá trị lệch)'}${opt.prune ? `, xóa ${totalPruned} key` : ''}.`);
}

// ==========================================
// 3. REFRESH — TÁI TẠO MASTER TỪ en.js / vi.js
// ==========================================
function parseMasterFromSource(content) {
  const block = content.match(/const MASTER\s*=\s*\{([\s\S]*?)\};/);
  if (!block) return {};
  const obj = {};
  const lineRe = /^\s*"((?:[^"\\]|\\.)*)"\s*:\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)"\s*,\s*vi:\s*"((?:[^"\\]|\\.)*)"\s*\}\s*,?\s*$/gm;
  let m;
  while ((m = lineRe.exec(block[1])) !== null) {
    obj[unescapeJsonString(m[1])] = { en: unescapeJsonString(m[2]), vi: unescapeJsonString(m[3]) };
  }
  return obj;
}

function generateMasterSource(merged) {
  const keys = Object.keys(merged).sort();
  let out = `// >>>>>>>>>> BEGIN MASTER (GENERATED - ${keys.length} keys - do not edit manually, use --refresh) <<<<<<<<<<\n`;
  out += 'const MASTER = {\n';
  for (const k of keys) {
    const v = merged[k];
    out += `  ${JSON.stringify(k)}: { en: ${JSON.stringify(v.en ?? '')}, vi: ${JSON.stringify(v.vi ?? '')} },\n`;
  }
  out += '};\n';
  out += '// >>>>>>>>>> END MASTER <<<<<<<<<<\n';
  return out;
}

function refreshMaster() {
  console.log("");
  printBox("I18N REFRESH MASTER");
  const filePath = __filename;
  let content = fs.readFileSync(filePath, 'utf8');
  const currentMaster = parseMasterFromSource(content);

  // Merge: ưu tiên dữ liệu file (thực tế đang chạy) + giữ các key "đang chờ" (chỉ có trong MASTER)
  const merged = {};
  const allKeys = new Set([...enKeys, ...viKeys, ...Object.keys(currentMaster)]);
  for (const k of allKeys) {
    if (k in enData || k in viData) {
      merged[k] = { en: enData[k], vi: viData[k] ?? enData[k] };
    } else if (k in currentMaster) {
      merged[k] = { en: currentMaster[k].en, vi: currentMaster[k].vi };
    }
  }

  const newBlock = generateMasterSource(merged);
  if (!MASTER_BLOCK_RE.test(content)) {
    console.log("[REFRESH] ❌ Không tìm thấy khối MASTER trong file. Bỏ qua.");
    return;
  }
  content = content.replace(MASTER_BLOCK_RE, () => newBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[REFRESH] ✅ Đã tái tạo khối MASTER: ${Object.keys(merged).length} key (EN + VI).`);
  console.log(`[REFRESH] ⚠️  LƯU Ý: chạy lại lệnh khác để dùng dữ liệu mới nhất.`);
}

// ==========================================
// 4. AUDIT — BÁO CÁO TOÀN DIỆN
// ==========================================
let auditErrors = 0;
let auditWarnings = 0;

function report(err, msg) {
  if (err) auditErrors++; else auditWarnings++;
  console.log("  " + (err ? "❌" : "⚠️") + " " + msg);
}
function reportOk(msg) {
  console.log("  ✔️ " + msg);
}

function auditDuplicates(langCode, filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /(?:^|\n)\s*(["']?)([^"':\s]+)\1\s*:/g;
  let match;
  const seen = new Set();
  const dupes = new Set();
  while ((match = regex.exec(content)) !== null) {
    const key = match[2];
    if (key === 'export' || key === 'default' || key === 'import') continue;
    if (seen.has(key)) dupes.add(key);
    seen.add(key);
  }
  if (dupes.size > 0) report(true, `${langCode}.js có ${dupes.size} key khai báo lặp: ${Array.from(dupes).join(', ')}`);
  else reportOk(`${langCode}.js không có key trùng lặp.`);
}

function walkDir(dir, out) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist')) continue;
    if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(file)) out.push(fullPath);
  }
}
let _allFiles = null;
function getAllSourceFiles() {
  if (_allFiles) return _allFiles;
  const files = [];
  walkDir(srcPath, files);
  _allFiles = files;
  return files;
}

function audit() {
  console.log("");
  printBox("I18N AUDIT REPORT");
  console.log("🛠️  HƯỚNG DẪN FIX LỖI (DÀNH CHO AI):");
  console.log("   - Modal/Popup (React): dùng `{t('key') || 'Giá trị mặc định'}` thay vì text cứng hoặc `data-i18n`.");
  console.log("   - JS thuần: dùng `t('key')` để gán trực tiếp, hoặc gọi lại `updateDOM()` sau khi đổi ngôn ngữ.");
  console.log("   - Thêm key mới: khai báo trong MASTER rồi chạy `node src/i18n/convert.js --sync`.");

  printSection("1. KEY TRÙNG LẶP TRONG CÙNG FILE");
  auditDuplicates('en', EN_FILE);
  auditDuplicates('vi', VI_FILE);

  printSection("2. ĐỘ PHỦ GIỮA MASTER VÀ 2 FILE NGÔN NGỮ");
  const masterKeys = Object.keys(MASTER);
  const masterSet = new Set(masterKeys);
  const orphanKeys = [...new Set([...enKeys, ...viKeys])].filter(k => !masterSet.has(k));
  const pendingKeys = masterKeys.filter(k => !(k in enData) && !(k in viData));
  if (orphanKeys.length > 0) {
    report(true, `Có ${orphanKeys.length} key trong en/vi.js NHƯNG KHÔNG có trong MASTER (bỏ sót khi thêm vào MASTER):`);
    console.log("    " + orphanKeys.join(', '));
  } else reportOk("Mọi key trong en.js / vi.js đều đã có trong MASTER.");
  if (pendingKeys.length > 0) {
    report(true, `Có ${pendingKeys.length} key trong MASTER CHƯA được đồng bộ sang en/vi.js (chạy --sync):`);
    console.log("    " + pendingKeys.join(', '));
  } else reportOk("MASTER đã đồng bộ đầy đủ với cả 2 file.");

  printSection("3. KEY LỆCH GIỮA EN VÀ VI");
  const missingInVi = enKeys.filter(k => !(k in viData));
  const missingInEn = viKeys.filter(k => !(k in enData));
  if (missingInVi.length > 0) { report(true, `${missingInVi.length} key có ở EN nhưng thiếu ở VI: ${missingInVi.join(', ')}`); }
  else reportOk("VI đã có đầy đủ key so với EN.");
  if (missingInEn.length > 0) { report(true, `${missingInEn.length} key có ở VI nhưng thiếu ở EN: ${missingInEn.join(', ')}`); }
  else reportOk("EN đã có đầy đủ key so với VI.");

  printSection("4. KEY CÓ GIÁ TRỊ RỖNG");
  const emptyVi = viKeys.filter(k => !viData[k] || String(viData[k]).trim() === "");
  const emptyEn = enKeys.filter(k => !enData[k] || String(enData[k]).trim() === "");
  if (emptyEn.length > 0) report(true, `${emptyEn.length} key để trống ở EN: ${emptyEn.join(', ')}`);
  else reportOk("EN không có key nào để trống.");
  if (emptyVi.length > 0) report(true, `${emptyVi.length} key để trống ở VI: ${emptyVi.join(', ')}`);
  else reportOk("VI không có key nào để trống.");

  printSection("5. PLACEHOLDER LỆCH GIỮA EN VÀ VI ({0}, {1}...)");
  let phErrors = 0;
  for (const k of enKeys) {
    if (enData[k] && viData[k]) {
      const enM = String(enData[k]).match(/\{\d+\}/g) || [];
      const viM = String(viData[k]).match(/\{\d+\}/g) || [];
      if (enM.sort().join(',') !== viM.sort().join(',')) {
        report(true, `Lệch placeholder ở [${k}]: EN(${enM.join(',')}) vs VI(${viM.join(',')})`);
        phErrors++;
      }
    }
  }
  if (phErrors === 0) reportOk("Không phát hiện lệch placeholder giữa EN và VI.");

  printSection("6. GIÁ TRỊ LỆCH GIỮA MASTER VÀ FILE (đổi bản dịch phải sửa MASTER)");
  let driftCount = 0;
  for (const k of masterKeys) {
    if (MASTER[k]) {
      const mEn = MASTER[k].en, mVi = MASTER[k].vi;
      if ((k in enData && enData[k] !== mEn) || (k in viData && viData[k] !== mVi)) driftCount++;
    }
  }
  if (driftCount > 0) {
    report(false, `${driftCount} key có giá trị trong en/vi.js KHÁC với MASTER (chạy --sync --force để MASTER ghi đè):`);
    if (driftCount <= 30) {
      for (const k of masterKeys) {
        if (!MASTER[k]) continue;
        const d = [];
        if (k in enData && enData[k] !== MASTER[k].en) d.push(`EN(file="${enData[k]}", master="${MASTER[k].en}")`);
        if (k in viData && viData[k] !== MASTER[k].vi) d.push(`VI(file="${viData[k]}", master="${MASTER[k].vi}")`);
        if (d.length) console.log(`    ${k}: ${d.join('; ')}`);
      }
    }
  } else reportOk("MASTER và 2 file ngôn ngữ đang khớp 100%.");

  printSection("7. QUÉT SOURCE CODE TÌM LỖI SỬ DỤNG I18N");
  const usedKeys = new Set();
  const potentialHardcodes = [];
  const dynamicKeyPrefixes = new Set();

  for (const file of getAllSourceFiles()) {
    const content = fs.readFileSync(file, 'utf8');

    const tRegex = /\bt\(\s*(['"`])([\s\S]*?)\1/g;
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const key = match[2];
      if (key.includes('${')) {
        const p = key.split('${')[0];
        if (p) dynamicKeyPrefixes.add(p);
      } else usedKeys.add(key);
    }

    const dataI18nRegex = /data-i18n(?:-[a-z]+)?\s*=\s*(?:['"]([^'"]+)['"]|\{\s*['"]([^'"]+)['"]\s*\}|\{`([^`]+)`\})/g;
    while ((match = dataI18nRegex.exec(content)) !== null) {
      const key = match[1] || match[2] || match[3];
      if (key.includes('${')) {
        const p = key.split('${')[0];
        if (p) dynamicKeyPrefixes.add(p);
      } else usedKeys.add(key);
    }

    const objKeyRegex = /\b(?:titleKey|tooltipKey|labelKey|descKey)\s*:\s*['"]([^'"]+)['"]/g;
    while ((match = objKeyRegex.exec(content)) !== null) usedKeys.add(match[1]);

    if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      const jsxTextRegex = />\s*([^<>{}]+?)\s*</g;
      while ((match = jsxTextRegex.exec(content)) !== null) {
        const text = match[1].replace(/\s+/g, ' ').trim();
        if (isMeaningfulText(text) && text.length > 2 &&
            !looksLikeCode(text) && !isDimensionLike(text) && !isBrandToken(text) &&
            !inLineComment(content, match.index)) {
          potentialHardcodes.push({ file: path.relative(srcPath, file), line: lineOf(content, match.index), text, type: 'JSX Text', severity: 'high' });
        }
      }
      const jsxAttrRegex = /\b(placeholder|title|alt|aria-label|label)\s*=\s*(['"])([^'"]+)\2/g;
      while ((match = jsxAttrRegex.exec(content)) !== null) {
        const text = match[3].trim();
        if (isMeaningfulText(text) && !isBrandToken(text) &&
          (text.includes(' ') || /[A-ZÀ-ỹ]/.test(text)) &&
          !inLineComment(content, match.index)) {
          potentialHardcodes.push({ file: path.relative(srcPath, file), line: lineOf(content, match.index), text: text.length > 50 ? text.substring(0, 50) + '...' : text, type: `JSX attr[${match[1]}]`, severity: 'high' });
        }
      }
    }

    const jsHardcodeRegexes = [
      { regex: /toast(?:\.\w+)?\(\s*(['"])([^'"]+)\1/g, type: 'Toast', severity: 'high' },
      { regex: /\balert\(\s*(['"])([^'"]+)\1/g, type: 'Alert', severity: 'high' },
      { regex: /\bconfirm\(\s*(['"])([^'"]+)\1/g, type: 'Confirm', severity: 'high' },
      { regex: /\bprompt\(\s*(['"])([^'"]+)\1/g, type: 'Prompt', severity: 'high' },
      { regex: /new Error\(\s*(['"])([^'"]+)\1/g, type: 'Error', severity: 'high' },
      { regex: /setAttribute\(\s*['"](?:title|alt|placeholder|label|aria-label|data-content)['"]\s*,\s*(['"])([^'"]+)\1/g, type: 'setAttribute', severity: 'high' },
      { regex: /\.(?:textContent|innerText|innerHTML)\s*=\s*(['"])([^'"]+)\1/g, type: 'DOM assign', severity: 'high' },
      { regex: /(?:title|label|message|text|description|placeholder|content|header|tooltip)\s*:\s*(['"])([^'"]+)\1/g, type: 'Object/Array', severity: 'medium' }
    ];
    for (const { regex, type, severity } of jsHardcodeRegexes) {
      let jsMatch;
      while ((jsMatch = regex.exec(content)) !== null) {
        const text = jsMatch[2].trim();
        if (isMeaningfulText(text) && !/^[a-z0-9_.-]+$/.test(text) &&
          (text.includes(' ') || /[A-ZÀ-ỹ]/.test(text))) {
          // format-registry = dữ liệu tên định dạng file (JPEG, PNG...) không phải bản dịch
          if (type === 'Object/Array' && path.basename(file).includes('format-registry')) continue;
          // Object/Array fallback (label + labelKey) → bỏ qua
          if (type === 'Object/Array' && hasKeyFallback(content, jsMatch.index)) continue;
          // Bỏ qua giá trị là chính i18n key (config tham chiếu)
          if (isExistingKeyLiteral(text)) continue;
          if (isBrandToken(text) || isDimensionLike(text)) continue;
          const idx = jsMatch.index;
          const lineStart = content.lastIndexOf('\n', idx) + 1;
          const lineEndIdx = content.indexOf('\n', idx);
          const surroundingLine = content.slice(lineStart, lineEndIdx === -1 ? content.length : lineEndIdx);
          if (!/\bt\(/.test(surroundingLine) && !surroundingLine.includes('i18n')) {
            potentialHardcodes.push({ file: path.relative(srcPath, file), line: lineOf(content, idx), text: text.length > 50 ? text.substring(0, 50) + '...' : text, type, severity });
          }
        }
      }
    }

    // String literal khớp đúng 1 key i18n (dạng `prefix.name`) → key đang được dùng động
    const keyLiteralRegex = /['"`]([a-z][a-zA-Z0-9]*\.[a-zA-Z0-9_.]+)['"`]/g;
    while ((match = keyLiteralRegex.exec(content)) !== null) {
      if (match[1] in enData) usedKeys.add(match[1]);
    }
  }

  const undeclaredKeys = Array.from(usedKeys).filter(k => !(k in enData) && !(k in viData));
  if (undeclaredKeys.length > 0) {
    report(true, `${undeclaredKeys.length} key được gọi trong code nhưng CHƯA khai báo trong i18n: ${undeclaredKeys.join(', ')}`);
  } else reportOk("Tất cả key được dùng trong code đều đã khai báo đầy đủ.");

  const dynamicPrefixList = Array.from(dynamicKeyPrefixes).concat(KNOWN_DYNAMIC_PREFIXES);
  const unusedKeys = enKeys.filter(k => {
    if (usedKeys.has(k)) return false;
    return !dynamicPrefixList.some(prefix => k.startsWith(prefix));
  });
  if (unusedKeys.length > 0) {
    report(false, `${unusedKeys.length} key đã khai báo nhưng có thể KHÔNG được dùng trong code (key động t(\`prefix.${'{'}{val}\`) đã loại trừ): ${unusedKeys.join(', ')}`);
  } else reportOk("Không phát hiện key thừa/không sử dụng.");

  printSection("8. TEXT HARDCODE (cảnh báo tiềm năng, cần kiểm tra thủ công)");
  if (potentialHardcodes.length > 0) {
    report(false, `Phát hiện khoảng ${potentialHardcodes.length} đoạn text có thể chưa dùng i18n:`);
    potentialHardcodes.forEach(h => {
      console.log(`  [${h.severity.toUpperCase()}] [${h.file}:${h.line}] [${h.type}] "${h.text}"`);
    });
  } else reportOk("Không phát hiện text hardcode rõ ràng.");

  console.log("");
  console.log("┌" + "─".repeat(58) + "┐");
  console.log(`│ Tổng key: ${enKeys.length} (EN) / ${viKeys.length} (VI) / ${masterKeys.length} (MASTER)`);
  console.log(`│ ❌ Lỗi (cần sửa): ${auditErrors}      ⚠️ Cảnh báo: ${auditWarnings}`);
  console.log("└" + "─".repeat(58) + "┘");
}

// ==========================================
// 5. LOOKUP / SEARCH / LIST (tra cứu nhanh)
// ==========================================
function findUsage(key) {
  const hits = [];
  const patterns = [
    new RegExp(`t\\(\\s*['"\`]${escapeRegExp(key)}['"\`]`, 'g'),
    new RegExp(`data-i18n(?:-[a-z]+)?\\s*=\\s*['"\`]${escapeRegExp(key)}['"\`]`, 'g'),
    new RegExp(`(?:titleKey|tooltipKey|labelKey|descKey)\\s*:\\s*['"\`]${escapeRegExp(key)}['"\`]`, 'g'),
  ];
  for (const file of getAllSourceFiles()) {
    const content = fs.readFileSync(file, 'utf8');
    for (const re of patterns) {
      let m;
      while ((m = re.exec(content)) !== null) {
        hits.push(`${path.relative(srcPath, file)}:${lineOf(content, m.index)}`);
      }
    }
  }
  return hits;
}

function lookup(key) {
  console.log("");
  printBox(`LOOKUP: ${key}`);
  if (MASTER[key]) {
    console.log(`  EN: ${JSON.stringify(MASTER[key].en)}`);
    console.log(`  VI: ${JSON.stringify(MASTER[key].vi)}`);
  } else {
    console.log(`  ❌ Key "${key}" CHƯA tồn tại trong MASTER.`);
    const similar = Object.keys(MASTER).filter(k => k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase()) || k.split('.').pop() === key.split('.').pop());
    if (similar.length > 0) {
      console.log(`  💡 Key tương tự (${similar.length}):`);
      similar.slice(0, 15).forEach(k => console.log(`      ${k}`));
    } else {
      console.log(`  💡 Chưa có key tương tự. Thêm mới vào MASTER rồi chạy --sync.`);
    }
  }
  const hits = findUsage(key);
  console.log(`  📍 Dùng trong source: ${hits.length} chỗ`);
  hits.forEach(h => console.log(`      ${h}`));
}

function search(text) {
  console.log("");
  printBox(`SEARCH: "${text}"`);
  const needle = text.toLowerCase();
  const hits = [];
  for (const k of Object.keys(MASTER)) {
    const en = MASTER[k].en || '';
    const vi = MASTER[k].vi || '';
    if (en.toLowerCase().includes(needle) || vi.toLowerCase().includes(needle)) {
      hits.push(k);
    }
  }
  if (hits.length === 0) {
    console.log("  Không tìm thấy key nào khớp.");
  } else {
    console.log(`  Tìm thấy ${hits.length} key:`);
    hits.forEach(k => console.log(`    ${k}\n      EN: ${JSON.stringify(MASTER[k].en)}\n      VI: ${JSON.stringify(MASTER[k].vi)}`));
  }
}

function list() {
  console.log("");
  printBox("KEY STATISTICS BY MODULE");
  const groups = {};
  for (const k of Object.keys(MASTER)) {
    const segs = k.split('.');
    const module = segs.length >= 2 ? `${segs[0]}.${segs[1]}` : segs[0];
    groups[module] = (groups[module] || 0) + 1;
  }
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const width = Math.max(...sorted.map(([k]) => k.length), 8);
  for (const [mod, count] of sorted) {
    const bar = "█".repeat(Math.max(1, Math.round((count / sorted[0][1]) * 20)));
    console.log(`  ${mod.padEnd(width)} ${String(count).padStart(4)}  ${bar}`);
  }
  console.log("");
  console.log(`  TỔNG: ${Object.keys(MASTER).length} key.`);
}

// ==========================================
// 6. MAIN DISPATCH
// ==========================================
if (action === 'refresh') {
  refreshMaster();
} else {
  if (action === 'all' || action === 'sync') syncLanguages();
  if (action === 'all' || action === 'audit') audit();
  if (action === 'lookup') lookup(opt.key);
  if (action === 'search') search(opt.text);
  if (action === 'list') list();

  if (action === 'audit' || action === 'all') {
    console.log("");
    printBox("HOÀN TẤT KIỂM TRA I18N");
    process.exitCode = auditErrors > 0 ? 1 : 0;
  }
}
