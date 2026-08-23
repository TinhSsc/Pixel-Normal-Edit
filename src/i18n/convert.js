/**
 * ============================================================================
 *  I18N MASTER TOOL — TRA CỨU & ĐỒNG BỘ NGÔN NGỮ (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 *
 *  📌 MỤC ĐÍCH (DÀNH CHO AI VÀ DEVELOPER):
 *   - Đây là FILE DUY NHẤT cần đọc để tra cứu mọi chuỗi i18n của dự án.
 *   - KHÔNG cần mở `en.js` / `vi.js` / `id.js` (mỗi file ~1000 dòng) — TẤT CẢ key + bản
 *     dịch EN/VI/ID đều nằm ngay trong object `MASTER` ở phần [GENERATED MASTER].
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
 *   3. Script tự ghi key mới vào cả `en.js`, `vi.js` lẫn `id.js`.
 *   4. (Khuyến nghị) chạy `--audit` để xác nhận không còn lỗi.
 *
 *  🛠️  DANH SÁCH LỆNH (chạy từ thư mục gốc dự án):
 *    node src/i18n/convert.js                  → Đồng bộ (sync) + Audit đầy đủ
 *    node src/i18n/convert.js --sync           → Chỉ đồng bộ: thêm key thiếu vào en/vi.js
 *    node src/i18n/convert.js --audit          → Chỉ audit: báo cáo toàn diện
 *    node src/i18n/convert.js --lookup <key>   → Tra 1 key: EN/VI + nơi dùng trong source
 *    node src/i18n/convert.js --search <text>  → Tìm key có chứa text (theo EN hoặc VI)
 *    node src/i18n/convert.js --list           → Thống kê số key theo từng module/prefix
 *    node src/i18n/convert.js --refresh        → TÁI TẠO lại MASTER từ en.js/vi.js/id.js hiện tại
 *                                               (chỉ dùng khi các file đó bị sửa tay bên ngoài)
 *    node src/i18n/convert.js --sync --force   → Ghi đè giá trị lệch (MASTER là chuẩn)
 *    node src/i18n/convert.js --sync --prune   → Xóa key có trong en/vi.js nhưng không có trong MASTER
 *
 *  🔒 NGUYÊN TẮC QUAN TRỌNG:
 *   - `en.js` / `vi.js` / `id.js` là file PHÁT SINH (generated) → KHÔNG sửa tay.
 *   - Mọi thay đổi bản dịch phải thực hiện trong `MASTER` rồi chạy `--sync`.
 *   - `--refresh` chỉ nên dùng khi người khác đã sửa trực tiếp en.js/vi.js/id.js.
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
const ID_FILE = path.join(folderPath, 'id.js');
const RU_FILE = path.join(folderPath, 'ru.js');
const TH_FILE = path.join(folderPath, 'th.js');

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
const { default: idData } = await import(`./id.js?t=${Date.now()}`);
const { default: ruData } = await import(`./ru.js?t=${Date.now()}`);
const { default: thData } = await import(`./th.js?t=${Date.now()}`);
const enKeys = Object.keys(enData);
const viKeys = Object.keys(viData);
const idKeys = Object.keys(idData);
const ruKeys = Object.keys(ruData);
const thKeys = Object.keys(thData);

// >>>>>>>>>> BEGIN MASTER (GENERATED - 1120 keys - do not edit manually, use --refresh) <<<<<<<<<<
const MASTER = {
  "action.copy": { en: "Copy", vi: "Sao chép", id: "Salin", ru: "Копировать", th: "คัดลอก" },
  "action.cut": { en: "Cut", vi: "Cắt", id: "Potong", ru: "Вырезать", th: "ตัด" },
  "action.delete": { en: "Delete", vi: "Xóa", id: "Hapus", ru: "Удалить", th: "ลบ" },
  "action.deselect": { en: "Deselect", vi: "Bỏ chọn", id: "Batalkan Pilihan", ru: "Снять выделение", th: "ยกเลิกการเลือก" },
  "action.export": { en: "Export", vi: "Xuất file", id: "Ekspor", ru: "Экспорт", th: "ส่งออก" },
  "action.newCanvas": { en: "New Canvas", vi: "Canvas mới", id: "Kanvas Baru", ru: "Новый холст", th: "ผืนผ้าใบใหม่" },
  "action.paste": { en: "Paste", vi: "Dán", id: "Tempel", ru: "Вставить", th: "วาง" },
  "action.quickSave": { en: "Quick Save", vi: "Lưu nhanh", id: "Simpan Cepat", ru: "Быстрое сохранение", th: "บันทึกด่วน" },
  "action.redo": { en: "Redo", vi: "Làm lại", id: "Ulangi", ru: "Повторить", th: "ทำซ้ำ" },
  "action.saveAs": { en: "Save As", vi: "Lưu dưới dạng", id: "Simpan Sebagai", ru: "Сохранить как", th: "บันทึกเป็น" },
  "action.selectAll": { en: "Select All", vi: "Chọn tất cả", id: "Pilih Semua", ru: "Выделить всё", th: "เลือกทั้งหมด" },
  "action.settings": { en: "Settings", vi: "Cài đặt", id: "Pengaturan", ru: "Настройки", th: "ตั้งค่า" },
  "action.swapColors": { en: "Swap Colors", vi: "Đảo màu", id: "Tukar Warna", ru: "Поменять цвета", th: "สลับสี" },
  "action.undo": { en: "Undo", vi: "Hoàn tác", id: "Urungkan", ru: "Отменить", th: "เลิกทำ" },
  "advancedEngine.initError": { en: "Failed to initialize Advanced Mode (ImageMagick).", vi: "Không thể khởi tạo Chế độ Nâng cao (ImageMagick).", id: "Gagal menginisialisasi Mode Lanjutan (ImageMagick).", ru: "Не удалось инициализировать расширенный режим (ImageMagick).", th: "ไม่สามารถเริ่มต้นโหมดขั้นสูง (ImageMagick) ได้" },
  "advancedEngine.unsupportedFormat": { en: "Format not supported by Advanced Engine: {0}", vi: "Định dạng không được hỗ trợ bởi Advanced Engine: {0}", id: "Format tidak didukung oleh Advanced Engine: {0}", ru: "Формат не поддерживается расширенным движком: {0}", th: "รูปแบบไม่ได้รับการสนับสนุนจาก Advanced Engine: {0}" },
  "alt.oldCanvas": { en: "Old canvas", vi: "Canvas cũ", id: "Kanvas lama", ru: "Старый холст", th: "ผืนผ้าใบเดิม" },
  "anim.addFrame": { en: "Add Frame", vi: "Thêm frame", id: "Tambah Bingkai", ru: "Добавить кадр", th: "เพิ่มเฟรม" },
  "anim.deleteFrame": { en: "Delete Frame", vi: "Xóa frame", id: "Hapus Bingkai", ru: "Удалить кадр", th: "ลบเฟรม" },
  "anim.firstFrame": { en: "First Frame", vi: "Frame đầu", id: "Bingkai Pertama", ru: "Первый кадр", th: "เฟรมแรก" },
  "anim.lastFrame": { en: "Last Frame", vi: "Frame cuối", id: "Bingkai Terakhir", ru: "Последний кадр", th: "เฟรมสุดท้าย" },
  "anim.nextFrame": { en: "Next Frame", vi: "Frame sau", id: "Bingkai Berikutnya", ru: "Следующий кадр", th: "เฟรมถัดไป" },
  "anim.playPause": { en: "Play/Pause", vi: "Phát/Dừng", id: "Putar/Jeda", ru: "Воспроизвести/Пауза", th: "เล่น/หยุดชั่วคราว" },
  "anim.prevFrame": { en: "Previous Frame", vi: "Frame trước", id: "Bingkai Sebelumnya", ru: "Предыдущий кадр", th: "เฟรมก่อนหน้า" },
  "app.desc": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit", id: "Pixel Normal Edit", ru: "Pixel Normal Edit", th: "Pixel Normal Edit" },
  "app.logoAlt": { en: "Pixel Normal Edit Logo", vi: "Pixel Normal Edit Logo", id: "Logo Pixel Normal Edit", ru: "Логотип Pixel Normal Edit", th: "โลโก้ Pixel Normal Edit" },
  "app.mcpStatusTitle": { en: "MCP Status", vi: "Trạng thái MCP", id: "Status MCP", ru: "Статус MCP", th: "สถานะ MCP" },
  "app.mcpWaiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối...", id: "Menunggu koneksi...", ru: "Ожидание подключения...", th: "รอการเชื่อมต่อ..." },
  "app.title": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit", id: "Pixel Normal Edit", ru: "Pixel Normal Edit", th: "Pixel Normal Edit" },
  "auth.alreadyHaveAccount": { en: "Already have an account? Login", vi: "Đã có tài khoản? Đăng nhập", id: "Sudah punya akun? Masuk", ru: "Уже есть аккаунт? Войти", th: "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" },
  "auth.backToLogin": { en: "Back to login", vi: "Quay lại đăng nhập", id: "Kembali ke masuk", ru: "Вернуться к входу", th: "กลับไปเข้าสู่ระบบ" },
  "auth.continueWithGoogle": { en: "Continue with Google", vi: "Tiếp tục với Google", id: "Lanjutkan dengan Google", ru: "Продолжить с Google", th: "ดำเนินการต่อด้วย Google" },
  "auth.createAccount": { en: "Create account", vi: "Tạo tài khoản", id: "Buat akun", ru: "Создать аккаунт", th: "สร้างบัญชี" },
  "auth.email": { en: "Email", vi: "Email", id: "Email", ru: "Электронная почта", th: "อีเมล" },
  "auth.emailLabel": { en: "Email", vi: "Email", id: "Email", ru: "Электронная почта", th: "อีเมล" },
  "auth.errDefault": { en: "An error occurred", vi: "Có lỗi xảy ra", id: "Terjadi kesalahan", ru: "Произошла ошибка", th: "เกิดข้อผิดพลาด" },
  "auth.errEmailInUse": { en: "This email is already in use.", vi: "Email này đã được sử dụng.", id: "Email ini sudah digunakan.", ru: "Эта электронная почта уже используется.", th: "อีเมลนี้ถูกใช้งานแล้ว" },
  "auth.errEmailOrPassword": { en: "Incorrect email or password.", vi: "Email hoặc mật khẩu không chính xác.", id: "Email atau kata sandi salah.", ru: "Неверная электронная почта или пароль.", th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
  "auth.errGoogleCancelled": { en: "Google sign-in was cancelled.", vi: "Đăng nhập bằng Google đã bị hủy.", id: "Masuk dengan Google dibatalkan.", ru: "Вход через Google был отменён.", th: "การเข้าสู่ระบบด้วย Google ถูกยกเลิก" },
  "auth.errInvalidEmail": { en: "Invalid email format.", vi: "Định dạng email không hợp lệ.", id: "Format email tidak valid.", ru: "Неверный формат электронной почты.", th: "รูปแบบอีเมลไม่ถูกต้อง" },
  "auth.errWeakPassword": { en: "Password is too weak, please choose a stronger one.", vi: "Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn.", id: "Kata sandi terlalu lemah, silakan pilih yang lebih kuat.", ru: "Пароль слишком слабый, выберите более надёжный.", th: "รหัสผ่านอ่อนเกินไป กรุณาเลือกรหัสผ่านที่แข็งแกร่งกว่า" },
  "auth.forgotDesc": { en: "Enter your account email, we will send a link to reset your password.", vi: "Nhập email tài khoản của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.", id: "Masukkan email akun Anda, kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.", ru: "Введите электронную почту аккаунта, мы отправим ссылку для сброса пароля.", th: "กรอกอีเมลของบัญชี เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ" },
  "auth.forgotPassword": { en: "Forgot password?", vi: "Quên mật khẩu?", id: "Lupa kata sandi?", ru: "Забыли пароль?", th: "ลืมรหัสผ่าน?" },
  "auth.forgotPasswordDesc": { en: "Enter your account email, we will send a link to reset password.", vi: "Nhập email tài khoản của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.", id: "Masukkan email akun Anda, kami akan mengirim tautan untuk mengatur ulang kata sandi.", ru: "Введите электронную почту аккаунта, мы отправим ссылку для сброса пароля.", th: "กรอกอีเมลของบัญชี เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ" },
  "auth.forgotPasswordTitle": { en: "Forgot Password", vi: "Quên mật khẩu", id: "Lupa Kata Sandi", ru: "Забыли пароль", th: "ลืมรหัสผ่าน" },
  "auth.forgotSuccess": { en: "Password reset email sent. Please check your inbox.", vi: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.", id: "Email pengaturan ulang kata sandi terkirim. Silakan periksa kotak masuk Anda.", ru: "Письмо для сброса пароля отправлено. Проверьте почту.", th: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ" },
  "auth.forgotTitle": { en: "Forgot Password", vi: "Quên mật khẩu", id: "Lupa Kata Sandi", ru: "Забыли пароль", th: "ลืมรหัสผ่าน" },
  "auth.fullNameLabel": { en: "Full Name", vi: "Họ tên", id: "Nama Lengkap", ru: "Полное имя", th: "ชื่อ-นามสกุล" },
  "auth.google": { en: "Continue with Google", vi: "Tiếp tục với Google", id: "Lanjutkan dengan Google", ru: "Продолжить с Google", th: "ดำเนินการต่อด้วย Google" },
  "auth.loginBtn": { en: "Login", vi: "Đăng nhập", id: "Masuk", ru: "Войти", th: "เข้าสู่ระบบ" },
  "auth.loginTitle": { en: "Log In", vi: "Đăng nhập", id: "Masuk", ru: "Вход", th: "เข้าสู่ระบบ" },
  "auth.loginToSync": { en: "Please login to sync", vi: "Vui lòng đăng nhập để đồng bộ", id: "Silakan masuk untuk menyinkronkan", ru: "Войдите для синхронизации", th: "กรุณาเข้าสู่ระบบเพื่อซิงค์" },
  "auth.logout": { en: "Logout", vi: "Đăng xuất", id: "Keluar", ru: "Выйти", th: "ออกจากระบบ" },
  "auth.name": { en: "Full Name", vi: "Họ tên", id: "Nama Lengkap", ru: "Полное имя", th: "ชื่อ-นามสกุล" },
  "auth.notLoggedIn": { en: "Not logged in", vi: "Chưa đăng nhập", id: "Belum masuk", ru: "Не входили в систему", th: "ยังไม่ได้เข้าสู่ระบบ" },
  "auth.or": { en: "or", vi: "hoặc", id: "atau", ru: "или", th: "หรือ" },
  "auth.password": { en: "Password", vi: "Mật khẩu", id: "Kata Sandi", ru: "Пароль", th: "รหัสผ่าน" },
  "auth.passwordLabel": { en: "Password", vi: "Mật khẩu", id: "Kata Sandi", ru: "Пароль", th: "รหัสผ่าน" },
  "auth.registerBtn": { en: "Register", vi: "Đăng ký", id: "Daftar", ru: "Зарегистрироваться", th: "ลงทะเบียน" },
  "auth.registerTitle": { en: "Register", vi: "Đăng ký", id: "Daftar", ru: "Регистрация", th: "ลงทะเบียน" },
  "auth.resetEmailSent": { en: "Password reset email sent. Please check your inbox.", vi: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.", id: "Email pengaturan ulang kata sandi terkirim. Silakan periksa kotak masuk Anda.", ru: "Письмо для сброса пароля отправлено. Проверьте почту.", th: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ" },
  "auth.sendLink": { en: "Send reset link", vi: "Gửi link khôi phục", id: "Kirim tautan reset", ru: "Отправить ссылку", th: "ส่งลิงก์รีเซ็ต" },
  "auth.sending": { en: "Sending...", vi: "Đang gửi...", id: "Mengirim...", ru: "Отправка...", th: "กำลังส่ง..." },
  "auth.title": { en: "Login", vi: "Đăng nhập", id: "Masuk", ru: "Вход", th: "เข้าสู่ระบบ" },
  "btn.apply": { en: "Apply", vi: "Áp dụng", id: "Terapkan", ru: "Применить", th: "ใช้" },
  "btn.cancel": { en: "Cancel", vi: "Hủy", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "btn.copied": { en: "Copied!", vi: "Đã copy!", id: "Disalin!", ru: "Скопировано!", th: "คัดลอกแล้ว!" },
  "btn.copy": { en: "Copy", vi: "Copy", id: "Salin", ru: "Копировать", th: "คัดลอก" },
  "btn.copyMcpCmd": { en: "Copy MCP Command", vi: "Copy lệnh chạy MCP", id: "Salin Perintah MCP", ru: "Копировать команду MCP", th: "คัดลอกคำสั่ง MCP" },
  "btn.delete": { en: "Delete", vi: "Xóa", id: "Hapus", ru: "Удалить", th: "ลบ" },
  "btn.saveAs": { en: "Save As...", vi: "Lưu dưới dạng...", id: "Simpan Sebagai...", ru: "Сохранить как...", th: "บันทึกเป็น..." },
  "btn.stopTask": { en: "Stop", vi: "Dừng", id: "Berhenti", ru: "Остановить", th: "หยุด" },
  "btn.upload": { en: "Upload", vi: "Tải lên", id: "Unggah", ru: "Загрузить", th: "อัปโหลด" },
  "canvas.checkerColor": { en: "Checkerboard color", vi: "Màu checkerboard", id: "Warna papan catur", ru: "Цвет шахматной доски", th: "สีกระดานหมากรุก" },
  "canvas.checkerSize": { en: "Checkerboard size", vi: "Kích thước checkerboard", id: "Ukuran papan catur", ru: "Размер шахматной доски", th: "ขนาดกระดานหมากรุก" },
  "canvas.checkerboard": { en: "Checkerboard", vi: "Checkerboard (Nền ô vuông)", id: "Papan Catur", ru: "Шахматная доска", th: "กระดานหมากรุก" },
  "canvas.custom": { en: "Custom", vi: "Tùy chỉnh", id: "Kustom", ru: "Пользовательский", th: "กำหนดเอง" },
  "canvas.default": { en: "Default", vi: "Mặc định", id: "Default", ru: "По умолчанию", th: "ค่าเริ่มต้น" },
  "canvas.mode": { en: "Mode", vi: "Chế độ", id: "Mode", ru: "Режим", th: "โหมด" },
  "canvasHelper.readError": { en: "Cannot read image file", vi: "Không thể đọc file ảnh", id: "Tidak dapat membaca file gambar", ru: "Не удаётся прочитать файл изображения", th: "ไม่สามารถอ่านไฟล์รูปภาพได้" },
  "commandBus.apiNotDefined": { en: "api is not defined", vi: "api chưa được khởi tạo", id: "api tidak didefinisikan", ru: "api не определён", th: "api ยังไม่ได้ถูกกำหนด" },
  "commandBus.invalidFormat": { en: "Invalid command format", vi: "Định dạng lệnh không hợp lệ", id: "Format perintah tidak valid", ru: "Неверный формат команды", th: "รูปแบบคำสั่งไม่ถูกต้อง" },
  "commandBus.mustBeArray": { en: "Commands must be an array", vi: "Commands phải là một mảng", id: "Perintah harus berupa array", ru: "Команды должны быть массивом", th: "คำสั่งต้องเป็น array" },
  "commandBus.noBeforeState": { en: "editValidateDiff: No before state captured. Call editValidateBeforeState first.", vi: "editValidateDiff: Chưa ghi nhận trạng thái trước. Hãy gọi editValidateBeforeState trước.", id: "editValidateDiff: Tidak ada status sebelum ditangkap. Panggil editValidateBeforeState terlebih dahulu.", ru: "editValidateDiff: Предыдущее состояние не зафиксировано. Сначала вызовите editValidateBeforeState.", th: "editValidateDiff: ยังไม่ได้บันทึกสถานะก่อนหน้า กรุณาเรียก editValidateBeforeState ก่อน" },
  "commandBus.noRegionCopied": { en: "No region copied. Use copyRegion first.", vi: "Chưa có vùng nào được sao chép. Hãy gọi copyRegion trước.", id: "Tidak ada wilayah yang disalin. Gunakan copyRegion terlebih dahulu.", ru: "Регион не скопирован. Сначала вызовите copyRegion.", th: "ยังไม่ได้คัดลอกบริเวณใด กรุณาเรียก copyRegion ก่อน" },
  "commandBus.queryMissingType": { en: "query: missing type", vi: "query: thiếu kiểu (type)", id: "query: tipe hilang", ru: "query: отсутствует тип", th: "query: ขาด type" },
  "compress.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "compress.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)", id: "Mode Lanjutan (TIFF, HEIC, RAW...)", ru: "Расширенный режим (TIFF, HEIC, RAW...)", th: "โหมดขั้นสูง (TIFF, HEIC, RAW...)" },
  "compress.after": { en: "After:", vi: "Sau nén:", id: "Setelah:", ru: "После:", th: "หลังบีบอัด:" },
  "compress.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "compress.compressNow": { en: "Compress {0} images now", vi: "Nén {0} ảnh ngay", id: "Kompres {0} gambar sekarang", ru: "Сжать {0} изображений сейчас", th: "บีบอัด {0} รูปภาพทันที" },
  "compress.compressing": { en: "Compressing...", vi: "Đang nén...", id: "Mengompresi...", ru: "Сжатие...", th: "กำลังบีบอัด..." },
  "compress.desc": { en: "Reduce file size while maintaining quality. Export ZIP when multiple images are selected.", vi: "Giảm dung lượng file mà vẫn giữ chất lượng. Xuất file ZIP khi chọn nhiều ảnh.", id: "Kurangi ukuran file sambil mempertahankan kualitas. Ekspor ZIP saat banyak gambar dipilih.", ru: "Уменьшите размер файла, сохраняя качество. Экспорт ZIP при выборе нескольких изображений.", th: "ลดขนาดไฟล์โดยยังคงคุณภาพ ส่งออก ZIP เมื่อเลือกรูปภาพหลายไฟล์" },
  "compress.done": { en: "✓ Done — Saved {0}%", vi: "✓ Nén xong — Tiết kiệm {0}%", id: "✓ Selesai — Hemat {0}%", ru: "✓ Готово — Сэкономлено {0}%", th: "✓ เสร็จสิ้น — ประหยัด {0}%" },
  "compress.download": { en: "Download", vi: "Tải về", id: "Unduh", ru: "Скачать", th: "ดาวน์โหลด" },
  "compress.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về", id: "Opsi unduhan", ru: "Параметры скачивания", th: "ตัวเลือกการดาวน์โหลด" },
  "compress.downloadZip": { en: "Download ZIP", vi: "Tải file ZIP", id: "Unduh ZIP", ru: "Скачать ZIP", th: "ดาวน์โหลด ZIP" },
  "compress.drop.button": { en: "Choose images", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображения", th: "เลือกรูปภาพ" },
  "compress.drop.desc": { en: "Select multiple images at once to batch compress", vi: "Chọn nhiều ảnh cùng lúc để nén hàng loạt", id: "Pilih banyak gambar sekaligus untuk kompres batch", ru: "Выберите несколько изображений одновременно для пакетного сжатия", th: "เลือกรูปภาพหลายไฟล์พร้อมกันเพื่อบีบอัดแบบกลุ่ม" },
  "compress.drop.support": { en: "Supported: PNG, JPG, WebP, GIF, BMP", vi: "Hỗ trợ: PNG, JPG, WebP, GIF, BMP", id: "Didukung: PNG, JPG, WebP, GIF, BMP", ru: "Поддерживается: PNG, JPG, WebP, GIF, BMP", th: "รองรับ: PNG, JPG, WebP, GIF, BMP" },
  "compress.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây", id: "Seret & lepas gambar di sini", ru: "Перетащите изображения сюда", th: "ลากและวางรูปภาพที่นี่" },
  "compress.error.compress": { en: "Image compression error: {0}", vi: "Lỗi nén ảnh: {0}", id: "Kesalahan kompresi gambar: {0}", ru: "Ошибка сжатия изображения: {0}", th: "ข้อผิดพลาดในการบีบอัดรูปภาพ: {0}" },
  "compress.error.needAdvanced": { en: "File \"{0}\" requires Advanced Mode to be enabled to read.", vi: "File \"{0}\" yêu cầu bật Chế độ Nâng cao để đọc.", id: "File \"{0}\" memerlukan Mode Lanjutan untuk diaktifkan agar dapat dibaca.", ru: "Для файла \"{0}\" необходимо включить расширенный режим.", th: "ไฟล์ \"{0}\" ต้องเปิดใช้งานโหมดขั้นสูง" },
  "compress.fileList": { en: "Image list", vi: "Danh sách ảnh", id: "Daftar gambar", ru: "Список изображений", th: "รายการรูปภาพ" },
  "compress.fileSize": { en: "file size", vi: "dung lượng", id: "ukuran file", ru: "размер файла", th: "ขนาดไฟล์" },
  "compress.filename": { en: "compressed", vi: "compressed", id: "dikompresi", ru: "compressed", th: "บีบอัดแล้ว" },
  "compress.maxSize": { en: "Max file size (MB)", vi: "Dung lượng tối đa (MB)", id: "Ukuran file maks (MB)", ru: "Макс. размер файла (МБ)", th: "ขนาดไฟล์สูงสุด (MB)" },
  "compress.mode": { en: "Compression mode", vi: "Chế độ nén", id: "Mode kompresi", ru: "Режим сжатия", th: "โหมดการบีบอัด" },
  "compress.modeCustom": { en: "Custom", vi: "Tùy chỉnh", id: "Kustom", ru: "Пользовательский", th: "กำหนดเอง" },
  "compress.modeHigh": { en: "High", vi: "Cao", id: "Tinggi", ru: "Высокий", th: "สูง" },
  "compress.modeLow": { en: "Low", vi: "Thấp", id: "Rendah", ru: "Низкий", th: "ต่ำ" },
  "compress.modeMedium": { en: "Medium", vi: "Vừa", id: "Sedang", ru: "Средний", th: "ปานกลาง" },
  "compress.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "compress.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "compress.original": { en: "Original:", vi: "Gốc:", id: "Asli:", ru: "Оригинал:", th: "ต้นฉบับ:" },
  "compress.processed": { en: "✓ Processed", vi: "✓ Đã xử lý", id: "✓ Diproses", ru: "✓ Обработано", th: "✓ ประมวลผลแล้ว" },
  "compress.quality": { en: "Quality", vi: "Chất lượng", id: "Kualitas", ru: "Качество", th: "คุณภาพ" },
  "compress.title": { en: "Compress images", vi: "Nén ảnh hàng loạt", id: "Kompres gambar", ru: "Сжатие изображений", th: "บีบอัดรูปภาพ" },
  "compress.warning.largeImage": { en: "Warning: \"{0}\" is very large ({1}x{2}), may cause slowness.", vi: "Cảnh báo: \"{0}\" rất lớn ({1}x{2}), có thể gây chậm.", id: "Peringatan: \"{0}\" sangat besar ({1}x{2}), dapat menyebabkan kelambatan.", ru: "Внимание: \"{0}\" очень большой ({1}x{2}), может вызвать замедление.", th: "คำเตือน: \"{0}\" มีขนาดใหญ่มาก ({1}x{2}) อาจทำให้ช้าลง" },
  "compress.zipName": { en: "compressed_images.zip", vi: "compressed_images.zip", id: "compressed_images.zip", ru: "compressed_images.zip", th: "compressed_images.zip" },
  "confirm.closeTab": { en: "Are you sure you want to close this tab? Unsaved changes will be lost.", vi: "Bạn có chắc muốn đóng tab này? Dữ liệu chưa lưu sẽ bị mất.", id: "Anda yakin ingin menutup tab ini? Perubahan yang belum disimpan akan hilang.", ru: "Вы уверены, что хотите закрыть эту вкладку? Несохранённые изменения будут потеряны.", th: "คุณแน่ใจหรือว่าต้องการปิดแท็บนี้? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป" },
  "confirm.deleteFrame": { en: "Delete this frame? Frame data will be lost.", vi: "Xóa trang này? Dữ liệu của trang sẽ mất.", id: "Hapus bingkai ini? Data bingkai akan hilang.", ru: "Удалить этот кадр? Данные кадра будут потеряны.", th: "ลบเฟรมนี้? ข้อมูลเฟรมจะหายไป" },
  "confirm.deleteFrameMsg": { en: "Are you sure you want to delete frame {0}?", vi: "Bạn có chắc chắn muốn xóa trang {0} không?", id: "Anda yakin ingin menghapus bingkai {0}?", ru: "Вы уверены, что хотите удалить кадр {0}?", th: "คุณแน่ใจหรือว่าต้องการลบเฟรม {0}?" },
  "confirm.deleteMultipleFrames": { en: "Are you sure you want to delete the {0} selected frames?", vi: "Bạn có chắc muốn xóa {0} frame đang chọn không?", id: "Anda yakin ingin menghapus {0} bingkai yang dipilih?", ru: "Вы уверены, что хотите удалить {0} выбранных кадров?", th: "คุณแน่ใจหรือว่าต้องการลบ {0} เฟรมที่เลือก?" },
  "confirm.deleteTitle": { en: "Confirm Delete", vi: "Xác nhận xóa", id: "Konfirmasi Hapus", ru: "Подтверждение удаления", th: "ยืนยันการลบ" },
  "confirm.dontAskAgain": { en: "Don't ask again (for 2 hours)", vi: "Không nhắc lại (trong 2 giờ)", id: "Jangan tanya lagi (selama 2 jam)", ru: "Не спрашивать снова (на 2 часа)", th: "ไม่ต้องถามอีก (เป็นเวลา 2 ชั่วโมง)" },
  "confirm.leave": { en: "Are you sure you want to navigate away? Unsaved drawing data will be lost!", vi: "Bạn có chắc chuyển sang nơi khác? Mọi dữ liệu bản vẽ chưa lưu sẽ bị mất!", id: "Anda yakin ingin meninggalkan halaman? Data gambar yang belum disimpan akan hilang!", ru: "Вы уверены, что хотите уйти? Несохранённые данные рисунка будут потеряны!", th: "คุณแน่ใจหรือว่าต้องการออก? ข้อมูลรูปวาดที่ยังไม่ได้บันทึกจะหายไป!" },
  "confirm.newCanvas": { en: "Are you sure you want to create a new canvas? Current data will be lost!", vi: "Bạn có chắc muốn tạo trang mới? Mọi dữ liệu hiện tại sẽ bị mất!", id: "Anda yakin ingin membuat kanvas baru? Data saat ini akan hilang!", ru: "Вы уверены, что хотите создать новый холст? Текущие данные будут потеряны!", th: "คุณแน่ใจหรือว่าต้องการสร้างผืนผ้าใบใหม่? ข้อมูลปัจจุบันจะหายไป!" },
  "confirm.resetAllData": { en: "Are you sure you want to reset all data? This action cannot be undone!", vi: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác!", id: "Anda yakin ingin mengatur ulang semua data? Tindakan ini tidak dapat diurungkan!", ru: "Вы уверены, что хотите сбросить все данные? Это действие необратимо!", th: "คุณแน่ใจหรือว่าต้องการรีเซ็ตข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!" },
  "convert.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "convert.advancedMode": { en: "Advanced Mode (TIFF, HEIC, AVIF, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, AVIF, RAW...)", id: "Mode Lanjutan (TIFF, HEIC, AVIF, RAW...)", ru: "Расширенный режим (TIFF, HEIC, AVIF, RAW...)", th: "โหมดขั้นสูง (TIFF, HEIC, AVIF, RAW...)" },
  "convert.animationMode": { en: "Open as Animation", vi: "Mở gộp thành Ảnh động (Animation)", id: "Buka sebagai Animasi", ru: "Открыть как анимацию", th: "เปิดเป็นภาพเคลื่อนไหว" },
  "convert.buttons.chooseOther": { en: "Choose another image", vi: "Chọn ảnh khác", id: "Pilih gambar lain", ru: "Выбрать другое изображение", th: "เลือกรูปภาพอื่น" },
  "convert.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "convert.controls.download": { en: "Download", vi: "Tải về", id: "Unduh", ru: "Скачать", th: "ดาวน์โหลด" },
  "convert.controls.downloadZip": { en: "Download ZIP", vi: "Tải file ZIP", id: "Unduh ZIP", ru: "Скачать ZIP", th: "ดาวน์โหลด ZIP" },
  "convert.controls.openEditor": { en: "Open in Editor", vi: "Mở trong Editor", id: "Buka di Editor", ru: "Открыть в редакторе", th: "เปิดในตัวแก้ไข" },
  "convert.controls.outputFormat": { en: "Output format", vi: "Định dạng đầu ra", id: "Format keluaran", ru: "Формат вывода", th: "รูปแบบผลลัพธ์" },
  "convert.controls.quality": { en: "Quality", vi: "Chất lượng", id: "Kualitas", ru: "Качество", th: "คุณภาพ" },
  "convert.error.needAdvanced": { en: "File \"{0}\" requires Advanced Mode to be enabled.", vi: "File \"{0}\" yêu cầu bật Chế độ Nâng cao.", id: "File \"{0}\" memerlukan Mode Lanjutan untuk diaktifkan.", ru: "Для файла \"{0}\" необходимо включить расширенный режим.", th: "ไฟล์ \"{0}\" ต้องเปิดใช้งานโหมดขั้นสูง" },
  "convert.error.unsupportedFile": { en: "Unsupported file: {0}", vi: "File không được hỗ trợ: {0}", id: "File tidak didukung: {0}", ru: "Неподдерживаемый файл: {0}", th: "ไฟล์ที่ไม่รองรับ: {0}" },
  "convert.errors.fileTooLarge": { en: "File too large", vi: "File quá lớn", id: "File terlalu besar", ru: "Файл слишком большой", th: "ไฟล์มีขนาดใหญ่เกินไป" },
  "convert.errors.imageTooLarge": { en: "Image too large", vi: "Ảnh quá lớn", id: "Gambar terlalu besar", ru: "Изображение слишком большое", th: "รูปภาพมีขนาดใหญ่เกินไป" },
  "convert.errors.noImageToDownload": { en: "No image to download", vi: "Chưa có ảnh để tải", id: "Tidak ada gambar untuk diunduh", ru: "Нет изображения для скачивания", th: "ไม่มีรูปภาพให้ดาวน์โหลด" },
  "convert.errors.unsupportedFile": { en: "Unsupported file", vi: "File không được hỗ trợ", id: "File tidak didukung", ru: "Неподдерживаемый файл", th: "ไฟล์ที่ไม่รองรับ" },
  "convert.filename": { en: "converted", vi: "converted", id: "dikonversi", ru: "converted", th: "แปลงแล้ว" },
  "convert.filenameSuffix": { en: "_converted.", vi: "_converted.", id: "_dikonversi.", ru: "_converted.", th: "_แปลงแล้ว." },
  "convert.hero.desc": { en: "Easily batch convert between PNG, JPG, WebP, HEIC, JXL and more. Support multiple files and ZIP export. Processing happens right in your browser.", vi: "Dễ dàng chuyển đổi hàng loạt (Batch) qua lại giữa PNG, JPG, WebP, HEIC, JXL và hàng chục định dạng khác. Hỗ trợ nhiều file và xuất file ZIP. Quá trình xử lý diễn ra ngay trên trình duyệt.", id: "Mudah mengonversi batch antara PNG, JPG, WebP, HEIC, JXL dan lainnya. Mendukung banyak file dan ekspor ZIP. Pemrosesan terjadi langsung di browser Anda.", ru: "Легко пакетно конвертируйте между PNG, JPG, WebP, HEIC, JXL и другими форматами. Поддержка нескольких файлов и экспорта ZIP. Обработка происходит прямо в браузере.", th: "แปลงไฟล์แบบกลุ่มระหว่าง PNG, JPG, WebP, HEIC, JXL และอื่นๆ ได้ง่าย รองรับหลายไฟล์และส่งออก ZIP การประมวลผลเกิดขึ้นในเบราว์เซอร์ของคุณ" },
  "convert.hero.title": { en: "Instant image conversion", vi: "Chuyển đổi hình ảnh tức thì", id: "Konversi gambar instan", ru: "Мгновенное преобразование изображений", th: "การแปลงรูปภาพทันที" },
  "convert.multiTab": { en: "Open as multiple tabs", vi: "Mở thành nhiều Tabs", id: "Buka sebagai banyak tab", ru: "Открыть как несколько вкладок", th: "เปิดเป็นหลายแท็บ" },
  "convert.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "convert.preview.alt": { en: "Preview", vi: "Preview", id: "Pratinjau", ru: "Предпросмотр", th: "ตัวอย่าง" },
  "convert.preview.title": { en: "Image preview", vi: "Xem trước ảnh", id: "Pratinjau gambar", ru: "Предпросмотр изображения", th: "ตัวอย่างรูปภาพ" },
  "convert.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "convert.sending": { en: "Sending...", vi: "Đang gửi...", id: "Mengirim...", ru: "Отправка...", th: "กำลังส่ง..." },
  "convert.upload.button": { en: "Choose image", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображение", th: "เลือกรูปภาพ" },
  "convert.upload.dragDrop": { en: "Drag and drop image here", vi: "Kéo thả ảnh vào đây", id: "Seret dan lepas gambar di sini", ru: "Перетащите изображение сюда", th: "ลากและวางรูปภาพที่นี่" },
  "convert.upload.orClick": { en: "or click to browse files on your device", vi: "hoặc click để duyệt file trên thiết bị của bạn", id: "atau klik untuk menjelajahi file di perangkat Anda", ru: "или нажмите для выбора файла", th: "หรือคลิกเพื่อเลือกไฟล์" },
  "convert.upload.support": { en: "Supported: PNG, JPG, WebP, SVG, HEIC...", vi: "Hỗ trợ: PNG, JPG, WebP, SVG, HEIC...", id: "Didukung: PNG, JPG, WebP, SVG, HEIC...", ru: "Поддерживается: PNG, JPG, WebP, SVG, HEIC...", th: "รองรับ: PNG, JPG, WebP, SVG, HEIC..." },
  "convert.warning.largeImage": { en: "Warning: Image \"{0}\" is very large ({1}x{2}), may slow down the browser.", vi: "Cảnh báo: Ảnh \"{0}\" có kích thước rất lớn ({1}x{2}), có thể gây chậm trình duyệt.", id: "Peringatan: Gambar \"{0}\" sangat besar ({1}x{2}), dapat memperlambat browser.", ru: "Внимание: Изображение \"{0}\" очень большое ({1}x{2}), может замедлить браузер.", th: "คำเตือน: รูปภาพ \"{0}\" มีขนาดใหญ่มาก ({1}x{2}) อาจทำให้เบราว์เซอร์ช้าลง" },
  "convert.zipName": { en: "converted_images.zip", vi: "converted_images.zip", id: "converted_images.zip", ru: "converted_images.zip", th: "converted_images.zip" },
  "crop.apply": { en: "Apply", vi: "Áp dụng", id: "Terapkan", ru: "Применить", th: "ใช้" },
  "crop.cancel": { en: "Cancel", vi: "Hủy", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "crop.ratioFree": { en: "Free", vi: "Tự do", id: "Bebas", ru: "Свободный", th: "อิสระ" },
  "crop.title": { en: "Crop Image", vi: "Cắt ảnh (Crop)", id: "Pangkas Gambar", ru: "Обрезка изображения", th: "ตัดรูปภาพ" },
  "cropPage.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "cropPage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)", id: "Mode Lanjutan (TIFF, HEIC, RAW...)", ru: "Расширенный режим (TIFF, HEIC, RAW...)", th: "โหมดขั้นสูง (TIFF, HEIC, RAW...)" },
  "cropPage.changeImage": { en: "Choose another image", vi: "Chọn ảnh khác", id: "Pilih gambar lain", ru: "Выбрать другое изображение", th: "เลือกรูปภาพอื่น" },
  "cropPage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "cropPage.cropBtn": { en: "Apply Crop", vi: "Áp dụng Cắt", id: "Terapkan Pangkas", ru: "Применить обрезку", th: "ใช้การตัด" },
  "cropPage.cropSizeTitle": { en: "Crop Size (Pixel)", vi: "Kích thước cắt (Pixel)", id: "Ukuran Pangkas (Piksel)", ru: "Размер обрезки (пиксели)", th: "ขนาดการตัด (พิกเซล)" },
  "cropPage.desc": { en: "Crop multiple images at once with the same ratio. Export ZIP when multiple images are selected.", vi: "Cắt nhiều ảnh cùng lúc với cùng tỷ lệ. Xuất file ZIP khi chọn nhiều ảnh.", id: "Pangkas banyak gambar sekaligus dengan rasio yang sama. Ekspor ZIP saat banyak gambar dipilih.", ru: "Обрежьте несколько изображений одновременно с одинаковым соотношением сторон. Экспорт ZIP при выборе нескольких изображений.", th: "ตัดรูปภาพหลายไฟล์พร้อมกันด้วยสัดส่วนเดียวกัน ส่งออก ZIP เมื่อเลือกรูปภาพหลายไฟล์" },
  "cropPage.done": { en: "Crop successful!", vi: "Đã cắt thành công", id: "Pemangkasan berhasil!", ru: "Обрезка выполнена!", th: "การตัดเสร็จสิ้น!" },
  "cropPage.download": { en: "Download", vi: "Tải ảnh về", id: "Unduh", ru: "Скачать", th: "ดาวน์โหลด" },
  "cropPage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về", id: "Opsi unduhan", ru: "Параметры скачивания", th: "ตัวเลือกการดาวน์โหลด" },
  "cropPage.drop.button": { en: "Choose images", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображения", th: "เลือกรูปภาพ" },
  "cropPage.drop.desc": { en: "Select multiple images at once to batch crop", vi: "Chọn nhiều ảnh cùng lúc để cắt hàng loạt", id: "Pilih banyak gambar sekaligus untuk pangkas batch", ru: "Выберите несколько изображений для пакетной обрезки", th: "เลือกรูปภาพหลายไฟล์พร้อมกันเพื่อตัดแบบกลุ่ม" },
  "cropPage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây", id: "Seret & lepas gambar di sini", ru: "Перетащите изображения сюда", th: "ลากและวางรูปภาพที่นี่" },
  "cropPage.format": { en: "Format", vi: "Định dạng", id: "Format", ru: "Формат", th: "รูปแบบ" },
  "cropPage.height": { en: "Height", vi: "Cao (Height)", id: "Tinggi", ru: "Высота", th: "สูง" },
  "cropPage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "cropPage.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "cropPage.original": { en: "Original", vi: "Gốc", id: "Asli", ru: "Оригинал", th: "ต้นฉบับ" },
  "cropPage.previewAlt": { en: "Cropped preview", vi: "Xem trước ảnh đã cắt", id: "Pratinjau terpangkas", ru: "Предпросмотр обрезки", th: "ตัวอย่างการตัด" },
  "cropPage.processed": { en: "✓ Processed", vi: "✓ Đã xử lý", id: "✓ Diproses", ru: "✓ Обработано", th: "✓ ประมวลผลแล้ว" },
  "cropPage.qualityLabel": { en: "Quality: {0}%", vi: "Chất lượng: {0}%", id: "Kualitas: {0}%", ru: "Качество: {0}%", th: "คุณภาพ: {0}%" },
  "cropPage.ratio": { en: "Aspect ratio", vi: "Tỷ lệ khung hình", id: "Rasio aspek", ru: "Соотношение сторон", th: "สัดส่วนภาพ" },
  "cropPage.ratioFree": { en: "Free", vi: "Tự do", id: "Bebas", ru: "Свободный", th: "อิสระ" },
  "cropPage.reset": { en: "Reset", vi: "Reset", id: "Reset", ru: "Сбросить", th: "รีเซ็ต" },
  "cropPage.title": { en: "Crop images", vi: "Cắt ảnh hàng loạt", id: "Pangkas gambar", ru: "Обрезка изображений", th: "ตัดรูปภาพ" },
  "cropPage.transformTitle": { en: "Transform Image", vi: "Chỉnh sửa hướng ảnh", id: "Ubah Gambar", ru: "Трансформация изображения", th: "แปลงรูปภาพ" },
  "cropPage.width": { en: "Width", vi: "Rộng (Width)", id: "Lebar", ru: "Ширина", th: "กว้าง" },
  "download.animMode": { en: "Animation mode", vi: "Chế độ ảnh động", id: "Mode animasi", ru: "Режим анимации", th: "โหมดภาพเคลื่อนไหว" },
  "download.assetsTitle": { en: "Select Assets", vi: "Chọn tài nguyên", id: "Pilih Aset", ru: "Выбрать ресурсы", th: "เลือกทรัพยากร" },
  "download.cancel": { en: "Cancel", vi: "Hủy thao tác", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "download.chooseDriveLogin": { en: "Sign in to Drive", vi: "Đăng nhập Drive", id: "Masuk ke Drive", ru: "Войти в Drive", th: "เข้าสู่ Drive" },
  "download.chooseFolder": { en: "Choose folder", vi: "Chọn thư mục", id: "Pilih folder", ru: "Выбрать папку", th: "เลือกโฟลเดอร์" },
  "download.destination": { en: "Destination", vi: "Nơi lưu", id: "Tujuan", ru: "Назначение", th: "ปลายทาง" },
  "download.download": { en: "Download to device", vi: "Tải xuống máy", id: "Unduh ke perangkat", ru: "Скачать на устройство", th: "ดาวน์โหลดลงอุปกรณ์" },
  "download.drive": { en: "Google Drive", vi: "Google Drive", id: "Google Drive", ru: "Google Drive", th: "Google Drive" },
  "download.driveLoggedIn": { en: "Signed in to Google Drive", vi: "Đã đăng nhập Google Drive", id: "Masuk ke Google Drive", ru: "Вход выполнен в Google Drive", th: "เข้าสู่ Google Drive แล้ว" },
  "download.driveNotLoggedIn": { en: "Not signed in to Google Drive", vi: "Chưa đăng nhập Google Drive", id: "Belum masuk ke Google Drive", ru: "Не выполнен вход в Google Drive", th: "ยังไม่ได้เข้าสู่ Google Drive" },
  "download.driveUploaded": { en: "Uploaded to Google Drive", vi: "Đã tải lên Google Drive", id: "Diunggah ke Google Drive", ru: "Загружено в Google Drive", th: "อัปโหลดไปยัง Google Drive แล้ว" },
  "download.execute": { en: "Download Now", vi: "Tiến hành tải xuống", id: "Unduh Sekarang", ru: "Скачать сейчас", th: "ดาวน์โหลดทันที" },
  "download.exportMode": { en: "Export Mode", vi: "Chế độ xuất", id: "Mode Ekspor", ru: "Режим экспорта", th: "โหมดส่งออก" },
  "download.folder": { en: "Save to folder", vi: "Lưu vào thư mục", id: "Simpan ke folder", ru: "Сохранить в папку", th: "บันทึกลงโฟลเดอร์" },
  "download.folderNotSet": { en: "No local folder selected", vi: "Chưa chọn thư mục cục bộ", id: "Tidak ada folder lokal yang dipilih", ru: "Локальная папка не выбрана", th: "ยังไม่ได้เลือกโฟลเดอร์ท้องถิ่น" },
  "download.folderSelected": { en: "Folder:", vi: "Thư mục:", id: "Folder:", ru: "Папка:", th: "โฟลเดอร์:" },
  "download.format": { en: "Format", vi: "Định dạng", id: "Format", ru: "Формат", th: "รูปแบบ" },
  "download.formatGif": { en: "GIF (Animated GIF)", vi: "GIF (Ảnh động GIF)", id: "GIF (GIF animasi)", ru: "GIF (Анимированный GIF)", th: "GIF (GIF ภาพเคลื่อนไหว)" },
  "download.formatJpg": { en: "JPG (JPEG image)", vi: "JPG (Ảnh JPEG)", id: "JPG (Gambar JPEG)", ru: "JPG (Изображение JPEG)", th: "JPG (รูปภาพ JPEG)" },
  "download.formatJson": { en: "JSON (Save Project)", vi: "JSON (Lưu Project)", id: "JSON (Simpan Proyek)", ru: "JSON (Сохранить проект)", th: "JSON (บันทึกโปรเจกต์)" },
  "download.formatPng": { en: "PNG (Transparent image)", vi: "PNG (Ảnh trong suốt)", id: "PNG (Gambar transparan)", ru: "PNG (Прозрачное изображение)", th: "PNG (รูปภาพโปร่งใส)" },
  "download.formatSprite": { en: "SpriteSheet (Combined image)", vi: "SpriteSheet (Ảnh ghép)", id: "SpriteSheet (Gambar gabungan)", ru: "SpriteSheet (Объединённое изображение)", th: "SpriteSheet (รูปภาพรวม)" },
  "download.formatWebm": { en: "WebM (Video)", vi: "WebM (Video)", id: "WebM (Video)", ru: "WebM (Видео)", th: "WebM (วิดีโอ)" },
  "download.formatWebp": { en: "WebP (Lightweight image)", vi: "WebP (Ảnh nén nhẹ)", id: "WebP (Gambar ringan)", ru: "WebP (Лёгкое изображение)", th: "WebP (รูปภาพเบา)" },
  "download.formatZip": { en: "ZIP (Save Frames)", vi: "ZIP (Lưu các Frame)", id: "ZIP (Simpan Bingkai)", ru: "ZIP (Сохранить кадры)", th: "ZIP (บันทึกเฟรม)" },
  "download.local": { en: "Save to device", vi: "Lưu vào máy", id: "Simpan ke perangkat", ru: "Сохранить на устройство", th: "บันทึกลงอุปกรณ์" },
  "download.noCanvasSelected": { en: "Please select at least one canvas!", vi: "Vui lòng chọn ít nhất 1 canvas để tải!", id: "Silakan pilih setidaknya satu kanvas!", ru: "Пожалуйста, выберите хотя бы один холст!", th: "กรุณาเลือกผืนผ้าใบอย่างน้อย 1 รายการ!" },
  "download.selectAll": { en: "Select All", vi: "Chọn tất cả", id: "Pilih Semua", ru: "Выбрать всё", th: "เลือกทั้งหมด" },
  "download.staticMode": { en: "Static image mode", vi: "Chế độ ảnh tĩnh", id: "Mode gambar statis", ru: "Режим статичного изображения", th: "โหมดรูปภาพคงที่" },
  "download.statusReady": { en: "Ready", vi: "Sẵn sàng", id: "Siap", ru: "Готово", th: "พร้อม" },
  "download.step1": { en: "1. Select file (Canvas)", vi: "1. Chọn tệp (Canvas)", id: "1. Pilih file (Kanvas)", ru: "1. Выберите файл (холст)", th: "1. เลือกไฟล์ (ผืนผ้าใบ)" },
  "download.step2": { en: "2. Export Format", vi: "2. Định dạng xuất", id: "2. Format Ekspor", ru: "2. Формат экспорта", th: "2. รูปแบบส่งออก" },
  "download.step3": { en: "3. Save Location", vi: "3. Nơi lưu trữ", id: "3. Lokasi Simpan", ru: "3. Место сохранения", th: "3. ตำแหน่งบันทึก" },
  "download.step4": { en: "Step 4: Execute", vi: "4. Tiến hành tải", id: "Langkah 4: Jalankan", ru: "4. Выполнить", th: "4. ดำเนินการ" },
  "download.success": { en: "Downloaded {0} files!", vi: "Đã tải thành công {0} tệp!", id: "{0} file berhasil diunduh!", ru: "Скачано {0} файлов!", th: "ดาวน์โหลด {0} ไฟล์สำเร็จ!" },
  "download.transparent": { en: "Transparent Background", vi: "Nền Trong Suốt", id: "Latar Transparan", ru: "Прозрачный фон", th: "พื้นหลังโปร่งใส" },
  "download.transparentDesc": { en: "Keep empty areas transparent", vi: "Giữ các vùng trong suốt", id: "Pertahankan area kosong transparan", ru: "Сохранять пустые области прозрачными", th: "รักษาพื้นที่ว่างให้โปร่งใส" },
  "downloadButton.noImage": { en: "No image to download yet", vi: "Chưa có ảnh để tải", id: "Belum ada gambar untuk diunduh", ru: "Нет изображения для скачивания", th: "ยังไม่มีรูปภาพให้ดาวน์โหลด" },
  "drive.disconnectedTitle": { en: "Disconnected from Google Drive", vi: "Chưa kết nối Google Drive", id: "Terputus dari Google Drive", ru: "Отключено от Google Drive", th: "ตัดการเชื่อมต่อจาก Google Drive" },
  "drive.errDownload": { en: "Download error", vi: "Lỗi tải xuống", id: "Kesalahan unduh", ru: "Ошибка скачивания", th: "ข้อผิดพลาดในการดาวน์โหลด" },
  "drive.errDownloadImage": { en: "Image download error", vi: "Lỗi tải ảnh", id: "Kesalahan unduh gambar", ru: "Ошибка скачивания изображения", th: "ข้อผิดพลาดในการดาวน์โหลดรูปภาพ" },
  "drive.errInit": { en: "Google Identity Services failed to initialize.", vi: "Google Identity Services failed to initialize.", id: "Google Identity Services gagal diinisialisasi.", ru: "Не удалось инициализировать Google Identity Services.", th: "ไม่สามารถเริ่มต้น Google Identity Services ได้" },
  "drive.errListFiles": { en: "Error listing files", vi: "Lỗi danh sách tệp", id: "Kesalahan membuat daftar file", ru: "Ошибка списка файлов", th: "ข้อผิดพลาดในการแสดงรายการไฟล์" },
  "drive.errLoadingApi": { en: "Loading API library, please try again later.", vi: "Đang tải thư viện API, vui lòng thử lại sau.", id: "Memuat pustaka API, silakan coba lagi nanti.", ru: "Загрузка библиотеки API, попробуйте позже.", th: "กำลังโหลดไลบรารี API กรุณาลองใหม่ภายหลัง" },
  "drive.errMissingApiKey": { en: "Missing VITE_GOOGLE_API_KEY config in .env", vi: "Thiếu cấu hình VITE_GOOGLE_API_KEY trong .env", id: "Konfigurasi VITE_GOOGLE_API_KEY tidak ada di .env", ru: "Отсутствует конфигурация VITE_GOOGLE_API_KEY в .env", th: "ไม่มีการกำหนดค่า VITE_GOOGLE_API_KEY ใน .env" },
  "drive.errMissingClientId": { en: "Missing VITE_GOOGLE_CLIENT_ID in .env", vi: "Missing VITE_GOOGLE_CLIENT_ID in .env", id: "VITE_GOOGLE_CLIENT_ID tidak ada di .env", ru: "Отсутствует VITE_GOOGLE_CLIENT_ID в .env", th: "ไม่มี VITE_GOOGLE_CLIENT_ID ใน .env" },
  "drive.errNotLoggedIn": { en: "Not logged in to Google Drive", vi: "Chưa đăng nhập Google Drive", id: "Belum masuk ke Google Drive", ru: "Не выполнен вход в Google Drive", th: "ยังไม่ได้เข้าสู่ Google Drive" },
  "drive.errSessionExpired": { en: "Google Drive session expired. Please log in again.", vi: "Phiên đăng nhập Google Drive đã hết hạn. Vui lòng đăng nhập lại.", id: "Sesi Google Drive kedaluwarsa. Silakan masuk lagi.", ru: "Сеанс Google Drive истёк. Пожалуйста, войдите снова.", th: "เซสชัน Google Drive หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" },
  "drive.errUpload": { en: "Upload error", vi: "Lỗi tải lên", id: "Kesalahan unggah", ru: "Ошибка загрузки", th: "ข้อผิดพลาดในการอัปโหลด" },
  "drive.imageLoaded": { en: "Opened image: {0}", vi: "Đã mở ảnh: {0}", id: "Gambar dibuka: {0}", ru: "Открыто изображение: {0}", th: "เปิดรูปภาพ: {0}" },
  "drive.loadingList": { en: "Loading list...", vi: "Đang tải danh sách...", id: "Memuat daftar...", ru: "Загрузка списка...", th: "กำลังโหลดรายการ..." },
  "drive.login": { en: "Connect Drive", vi: "Kết nối Drive", id: "Hubungkan Drive", ru: "Подключить Drive", th: "เชื่อมต่อ Drive" },
  "drive.loginRequired": { en: "Login to Google Drive to select images", vi: "Bạn cần đăng nhập Google Drive để chọn ảnh", id: "Masuk ke Google Drive untuk memilih gambar", ru: "Войдите в Google Drive для выбора изображений", th: "กรุณาเข้าสู่ Google Drive เพื่อเลือกรูปภาพ" },
  "drive.logout": { en: "Disconnect Google Drive", vi: "Ngắt kết nối Google Drive", id: "Putuskan Google Drive", ru: "Отключить Google Drive", th: "ตัดการเชื่อมต่อ Google Drive" },
  "drive.noFiles": { en: "No files found on Drive", vi: "Không tìm thấy file nào trên Drive", id: "Tidak ada file ditemukan di Drive", ru: "Файлы не найдены на Drive", th: "ไม่พบไฟล์ใน Drive" },
  "drive.openPicker": { en: "Browse entire Drive...", vi: "Duyệt toàn bộ Drive...", id: "Jelajahi seluruh Drive...", ru: "Обзор всего Drive...", th: "เรียกดู Drive ทั้งหมด..." },
  "drive.projectLoaded": { en: "Opened project: {0}", vi: "Đã mở dự án: {0}", id: "Proyek dibuka: {0}", ru: "Открыт проект: {0}", th: "เปิดโปรเจกต์: {0}" },
  "drive.sectionTitle": { en: "Google Drive", vi: "Google Drive", id: "Google Drive", ru: "Google Drive", th: "Google Drive" },
  "driveUi.thumbnailError": { en: "Thumbnail load error: {0}", vi: "Lỗi tải thumbnail: {0}", id: "Kesalahan memuat thumbnail: {0}", ru: "Ошибка загрузки миниатюры: {0}", th: "ข้อผิดพลาดในการโหลดรูปขนาดย่อ: {0}" },
  "driveUi.unsupportedFormat": { en: "Unsupported format", vi: "Định dạng không hỗ trợ", id: "Format tidak didukung", ru: "Неподдерживаемый формат", th: "รูปแบบที่ไม่รองรับ" },
  "dropdown.select": { en: "Select...", vi: "Chọn...", id: "Pilih...", ru: "Выбрать...", th: "เลือก..." },
  "editorApi.framesDifferentDims": { en: "Frames have different dimensions", vi: "Các frame có kích thước khác nhau", id: "Bingkai memiliki dimensi berbeda", ru: "Кадры имеют разные размеры", th: "เฟรมมีขนาดต่างกัน" },
  "editorApi.invalidFrameIndex": { en: "Invalid frame index", vi: "Chỉ số frame không hợp lệ", id: "Indeks bingkai tidak valid", ru: "Неверный индекс кадра", th: "ดัชนีเฟรมไม่ถูกต้อง" },
  "editorApi.noActiveTab": { en: "No active tab to export", vi: "Không có tab đang mở để xuất", id: "Tidak ada tab aktif untuk diekspor", ru: "Нет активной вкладки для экспорта", th: "ไม่มีแท็บที่ใช้งานอยู่สำหรับส่งออก" },
  "editorApi.unsupportedFormat": { en: "Unsupported format: {0}", vi: "Định dạng không hỗ trợ: {0}", id: "Format tidak didukung: {0}", ru: "Неподдерживаемый формат: {0}", th: "รูปแบบที่ไม่รองรับ: {0}" },
  "encoder.advancedRequired": { en: "Format {0} requires Advanced Mode to be enabled.", vi: "Định dạng {0} yêu cầu bật Chế độ Nâng cao (Advanced Mode).", id: "Format {0} memerlukan Mode Lanjutan untuk diaktifkan.", ru: "Для формата {0} необходимо включить расширенный режим.", th: "รูปแบบ {0} ต้องเปิดใช้งานโหมดขั้นสูง" },
  "encoder.invalidFormat": { en: "Invalid format.", vi: "Định dạng không hợp lệ.", id: "Format tidak valid.", ru: "Неверный формат.", th: "รูปแบบไม่ถูกต้อง" },
  "encoder.unsupportedBrowser": { en: "Your browser does not support exporting this format. Please choose another.", vi: "Trình duyệt không hỗ trợ xuất định dạng này. Vui lòng chọn định dạng khác.", id: "Browser Anda tidak mendukung ekspor format ini. Silakan pilih yang lain.", ru: "Ваш браузер не поддерживает экспорт в этот формат. Выберите другой.", th: "เบราว์เซอร์ของคุณไม่รองรับการส่งออกในรูปแบบนี้ กรุณาเลือกรูปแบบอื่น" },
  "error.toBlobFailed": { en: "toBlob failed", vi: "Lỗi toBlob", id: "toBlob gagal", ru: "Ошибка toBlob", th: "toBlob ล้มเหลว" },
  "error.videoRead": { en: "Unable to read video", vi: "Không đọc được video", id: "Tidak dapat membaca video", ru: "Не удаётся прочитать видео", th: "ไม่สามารถอ่านวิดีโอได้" },
  "error.videoLoad": { en: "Unable to load video", vi: "Không thể tải video", id: "Tidak dapat memuat video", ru: "Не удаётся загрузить видео", th: "ไม่สามารถโหลดวิดีโอได้" },
  "error.videoSeek": { en: "Unable to seek video", vi: "Không thể seek video", id: "Tidak dapat mencari video", ru: "Не удаётся перемотать видео", th: "ไม่สามารถค้นหาวิดีโอได้" },
  "errorBoundary.retry": { en: "Try again", vi: "Thử lại", id: "Coba lagi", ru: "Попробовать снова", th: "ลองอีกครั้ง" },
  "errorBoundary.title": { en: "Something went wrong", vi: "Có lỗi xảy ra", id: "Terjadi kesalahan", ru: "Что-то пошло не так", th: "เกิดข้อผิดพลาด" },
  "exportAnim.gifError": { en: "Error creating GIF: {0}", vi: "Lỗi khi tạo GIF: {0}", id: "Kesalahan membuat GIF: {0}", ru: "Ошибка создания GIF: {0}", th: "ข้อผิดพลาดในการสร้าง GIF: {0}" },
  "exportAnim.loadGifLibError": { en: "Error loading GIF library: {0}", vi: "Lỗi khi tải thư viện GIF: {0}", id: "Kesalahan memuat pustaka GIF: {0}", ru: "Ошибка загрузки библиотеки GIF: {0}", th: "ข้อผิดพลาดในการโหลดไลบรารี GIF: {0}" },
  "exportAnim.noData": { en: "No animation data to export.", vi: "Không có dữ liệu ảnh động để xuất.", id: "Tidak ada data animasi untuk diekspor.", ru: "Нет данных анимации для экспорта.", th: "ไม่มีข้อมูลภาพเคลื่อนไหวให้ส่งออก" },
  "exportAnim.spriteSheetError": { en: "Export SpriteSheet Error: {0}", vi: "Export SpriteSheet Error: {0}", id: "Kesalahan Ekspor SpriteSheet: {0}", ru: "Ошибка экспорта SpriteSheet: {0}", th: "ข้อผิดพลาดในการส่งออก SpriteSheet: {0}" },
  "exportAnim.unsupportedFormat": { en: "Unsupported format.", vi: "Định dạng không được hỗ trợ.", id: "Format tidak didukung.", ru: "Неподдерживаемый формат.", th: "รูปแบบที่ไม่รองรับ" },
  "exportAnim.zipError": { en: "Export ZIP Error: {0}", vi: "Export ZIP Error: {0}", id: "Kesalahan Ekspor ZIP: {0}", ru: "Ошибка экспорта ZIP: {0}", th: "ข้อผิดพลาดในการส่งออก ZIP: {0}" },
  "fileUploader.drop": { en: "Drag & drop images here or click to select", vi: "Kéo thả ảnh vào đây hoặc click để chọn", id: "Seret & lepas gambar di sini atau klik untuk memilih", ru: "Перетащите изображения сюда или нажмите для выбора", th: "ลากและวางรูปภาพที่นี่หรือคลิกเพื่อเลือก" },
  "fileUploader.support": { en: "Supported: PNG, JPG, WebP, GIF, BMP, SVG, HEIC", vi: "Hỗ trợ: PNG, JPG, WebP, GIF, BMP, SVG, HEIC", id: "Didukung: PNG, JPG, WebP, GIF, BMP, SVG, HEIC", ru: "Поддерживается: PNG, JPG, WebP, GIF, BMP, SVG, HEIC", th: "รองรับ: PNG, JPG, WebP, GIF, BMP, SVG, HEIC" },
  "format.gif": { en: "GIF (Animation)", vi: "GIF (Ảnh động)", id: "GIF (Animasi)", ru: "GIF (Анимация)", th: "GIF (ภาพเคลื่อนไหว)" },
  "format.gifDesc": { en: "Animated GIF format", vi: "Định dạng ảnh động GIF", id: "Format GIF animasi", ru: "Формат анимированного GIF", th: "รูปแบบ GIF ภาพเคลื่อนไหว" },
  "format.jpeg": { en: "JPG", vi: "JPG", id: "JPG", ru: "JPG", th: "JPG" },
  "format.jpegDesc": { en: "Smaller file, no transparency", vi: "File nhỏ hơn, không nền trong suốt", id: "File lebih kecil, tanpa transparansi", ru: "Меньший размер, без прозрачности", th: "ขนาดเล็กกว่า ไม่มีความโปร่งใส" },
  "format.jpg": { en: "JPG", vi: "JPG", id: "JPG", ru: "JPG", th: "JPG" },
  "format.jpgDesc": { en: "Smaller file, no transparency", vi: "File nhỏ hơn, không nền trong suốt", id: "File lebih kecil, tanpa transparansi", ru: "Меньший размер, без прозрачности", th: "ขนาดเล็กกว่า ไม่มีความโปร่งใส" },
  "format.json": { en: "JSON", vi: "JSON", id: "JSON", ru: "JSON", th: "JSON" },
  "format.jsonDesc": { en: "Project file (editable)", vi: "File dự án (có thể sửa lại)", id: "File proyek (dapat diedit)", ru: "Файл проекта (редактируемый)", th: "ไฟล์โปรเจกต์ (แก้ไขได้)" },
  "format.png": { en: "PNG", vi: "PNG", id: "PNG", ru: "PNG", th: "PNG" },
  "format.pngDesc": { en: "High quality, transparent bg", vi: "Chất lượng cao, nền trong suốt", id: "Kualitas tinggi, latar transparan", ru: "Высокое качество, прозрачный фон", th: "คุณภาพสูง พื้นหลังโปร่งใส" },
  "format.spriteDesc": { en: "All frames in one image", vi: "Tất cả các frame trên 1 ảnh", id: "Semua bingkai dalam satu gambar", ru: "Все кадры на одном изображении", th: "ทุกเฟรมในรูปภาพเดียว" },
  "format.spritesheet": { en: "Sprite Sheet", vi: "Sprite Sheet", id: "Sprite Sheet", ru: "Sprite Sheet", th: "Sprite Sheet" },
  "format.webm": { en: "WebM (Video)", vi: "WebM (Video)", id: "WebM (Video)", ru: "WebM (Видео)", th: "WebM (วิดีโอ)" },
  "format.webmDesc": { en: "High quality animated video", vi: "Video động chất lượng cao", id: "Video animasi berkualitas tinggi", ru: "Высокое качество анимированного видео", th: "วิดีโอภาพเคลื่อนไหวคุณภาพสูง" },
  "format.webp": { en: "WEBP", vi: "WEBP", id: "WEBP", ru: "WEBP", th: "WEBP" },
  "format.webpDesc": { en: "Best size/quality ratio", vi: "Tỷ lệ dung lượng/chất lượng tốt nhất", id: "Rasio ukuran/kualitas terbaik", ru: "Лучшее соотношение размер/качество", th: "อัตราส่วนขนาด/คุณภาพที่ดีที่สุด" },
  "format.zip": { en: "ZIP Frames", vi: "ZIP Frames", id: "Bingkai ZIP", ru: "ZIP Frames", th: "ZIP Frames" },
  "format.zipDesc": { en: "Each frame as PNG in ZIP", vi: "Mỗi frame là 1 PNG trong ZIP", id: "Setiap bingkai sebagai PNG dalam ZIP", ru: "Каждый кадр как PNG в ZIP", th: "ทุกเฟรมเป็น PNG ใน ZIP" },
  "framesToMedia.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "framesToMedia.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "framesToMedia.createBtn": { en: "Create {0}", vi: "Tạo {0}", id: "Buat {0}", ru: "Создать {0}", th: "สร้าง {0}" },
  "framesToMedia.creating": { en: "Creating {0}...", vi: "Đang tạo {0}...", id: "Membuat {0}...", ru: "Создание {0}...", th: "กำลังสร้าง {0}..." },
  "framesToMedia.desc": { en: "Convert Video → GIF, GIF → Video, or combine images into GIF/WebM.", vi: "Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM.", id: "Konversi Video → GIF, GIF → Video, atau gabungkan gambar menjadi GIF/WebM.", ru: "Конвертируйте Видео → GIF, GIF → Видео или объедините изображения в GIF/WebM.", th: "แปลงวิดีโอ → GIF, GIF → วิดีโอ หรือรวมรูปภาพเป็น GIF/WebM" },
  "framesToMedia.done": { en: "Done!", vi: "Hoàn thành!", id: "Selesai!", ru: "Готово!", th: "เสร็จสิ้น!" },
  "framesToMedia.download": { en: "Download", vi: "Tải về", id: "Unduh", ru: "Скачать", th: "ดาวน์โหลด" },
  "framesToMedia.drop.button": { en: "Choose images", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображения", th: "เลือกรูปภาพ" },
  "framesToMedia.drop.desc": { en: "Choose multiple images, or drop 1 GIF / MP4 / WebM file to auto-extract frames", vi: "Chọn nhiều ảnh, hoặc kéo 1 file GIF / MP4 / WebM để tự tách frame", id: "Pilih banyak gambar, atau lepas 1 file GIF / MP4 / WebM untuk mengekstrak bingkai otomatis", ru: "Выберите несколько изображений или перетащите 1 файл GIF / MP4 / WebM для автоматического извлечения кадров", th: "เลือกรูปภาพหลายไฟล์ หรือลากไฟล์ GIF / MP4 / WebM 1 ไฟล์เพื่อแยกเฟรมอัตโนมัติ" },
  "framesToMedia.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây", id: "Seret & lepas gambar di sini", ru: "Перетащите изображения сюда", th: "ลากและวางรูปภาพที่นี่" },
  "framesToMedia.extractingFrame": { en: "Extracting frames from \"{0}\"...", vi: "Đang tách frame từ \"{0}\"...", id: "Mengekstrak bingkai dari \"{0}\"...", ru: "Извлечение кадров из \"{0}\"...", th: "กำลังแยกเฟรมจาก \"{0}\"..." },
  "framesToMedia.fps": { en: "FPS", vi: "FPS", id: "FPS", ru: "FPS", th: "FPS" },
  "framesToMedia.fpsSlow": { en: "1 (slow)", vi: "1 (chậm)", id: "1 (lambat)", ru: "1 (медленно)", th: "1 (ช้า)" },
  "framesToMedia.fpsSmooth": { en: "30 (smooth)", vi: "30 (mượt)", id: "30 (mulus)", ru: "30 (плавно)", th: "30 (ลื่น)" },
  "framesToMedia.frames": { en: "Frames", vi: "Frames", id: "Bingkai", ru: "Кадры", th: "เฟรม" },
  "framesToMedia.gifQuality": { en: "GIF quality", vi: "Chất lượng GIF", id: "Kualitas GIF", ru: "Качество GIF", th: "คุณภาพ GIF" },
  "framesToMedia.gifQualityHint": { en: "Smaller = higher quality but slower render", vi: "Số càng nhỏ = chất lượng cao hơn nhưng render lâu hơn", id: "Lebih kecil = kualitas lebih tinggi tetapi render lebih lambat", ru: "Меньше = качество выше, но рендер дольше", th: "น้อยกว่า = คุณภาพสูงขึ้น แต่เรนเดอร์ช้ากว่า" },
  "framesToMedia.heading": { en: "Combine images into GIF / Video · Convert Video ↔ GIF", vi: "Ghép ảnh thành GIF / Video · Đổi Video ↔ GIF", id: "Gabungkan gambar menjadi GIF / Video · Konversi Video ↔ GIF", ru: "Объедините изображения в GIF / Видео · Конвертируйте Видео ↔ GIF", th: "รวมรูปภาพเป็น GIF / วิดีโอ · แปลงวิดีโอ ↔ GIF" },
  "framesToMedia.loading": { en: "Loading...", vi: "Đang tải...", id: "Memuat...", ru: "Загрузка...", th: "กำลังโหลด..." },
  "framesToMedia.maxSize": { en: "Maximum size", vi: "Kích thước tối đa", id: "Ukuran maksimum", ru: "Максимальный размер", th: "ขนาดสูงสุด" },
  "framesToMedia.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "framesToMedia.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "framesToMedia.outputFormat": { en: "Output format", vi: "Định dạng đầu ra", id: "Format keluaran", ru: "Формат вывода", th: "รูปแบบผลลัพธ์" },
  "framesToMedia.preview": { en: "Preview", vi: "Xem trước", id: "Pratinjau", ru: "Предпросмотр", th: "ตัวอย่าง" },
  "framesToMedia.processed": { en: "✓ Processed", vi: "✓ Đã xử lý", id: "✓ Diproses", ru: "✓ Обработано", th: "✓ ประมวลผลแล้ว" },
  "framesToMedia.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "framesToMedia.seo.desc": { en: "Combine PNG, JPG, WebP images into animated GIF or WebM. Convert Video to GIF and back. Fully processed locally in your browser.", vi: "Ghép ảnh PNG, JPG, WebP thành GIF động hoặc WebM. Chuyển Video sang GIF và ngược lại. Hoàn toàn xử lý cục bộ trên trình duyệt.", id: "Gabungkan gambar PNG, JPG, WebP menjadi GIF animasi atau WebM. Konversi Video ke GIF dan sebaliknya. Sepenuhnya diproses lokal di browser Anda.", ru: "Объедините изображения PNG, JPG, WebP в анимированный GIF или WebM. Конвертируйте Видео в GIF и обратно. Полностью обрабатывается локально в вашем браузере.", th: "รวมรูปภาพ PNG, JPG, WebP เป็น GIF ภาพเคลื่อนไหวหรือ WebM แปลงวิดีโอเป็น GIF และกลับกัน ประมวลผลทั้งหมดในเบราว์เซอร์ของคุณ" },
  "framesToMedia.seo.title": { en: "Frames to GIF/Video | Pixel Normal Edit", vi: "Ghép ảnh thành GIF / Video, Đổi Video sang GIF | Pixel Normal Edit", id: "Bingkai ke GIF/Video | Pixel Normal Edit", ru: "Кадры в GIF/Видео | Pixel Normal Edit", th: "เฟรมไปยัง GIF/วิดีโอ | Pixel Normal Edit" },
  "framesToMedia.settings": { en: "Settings", vi: "Thiết lập", id: "Pengaturan", ru: "Настройки", th: "ตั้งค่า" },
  "framesToMedia.stop": { en: "Stop", vi: "Dừng", id: "Berhenti", ru: "Остановить", th: "หยุด" },
  "framesToMedia.title": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video", id: "Gambar → GIF / Video", ru: "Изображения → GIF / Видео", th: "รูปภาพ → GIF / วิดีโอ" },
  "framesToMedia.videoApplyToNext": { en: "Apply to videos added next", vi: "Áp dụng cho video thêm vào lần sau", id: "Terapkan ke video yang ditambahkan berikutnya", ru: "Применить к видео, добавленным позже", th: "ใช้กับวิดีโอที่เพิ่มในภายหลัง" },
  "framesToMedia.videoExtractFps": { en: "Video extraction FPS", vi: "FPS tách video", id: "FPS ekstraksi video", ru: "FPS извлечения видео", th: "FPS การแยกวิดีโอ" },
  "framesToMedia.webmVideo": { en: "WebM Video", vi: "WebM Video", id: "Video WebM", ru: "WebM Видео", th: "วิดีโอ WebM" },
  "gifSimplify.changeFile": { en: "Change file", vi: "Đổi file", id: "Ganti file", ru: "Сменить файл", th: "เปลี่ยนไฟล์" },
  "gifSimplify.completed": { en: "Completed!", vi: "Hoàn thành!", id: "Selesai!", ru: "Завершено!", th: "เสร็จสิ้น!" },
  "gifSimplify.creating": { en: "Creating {0}...", vi: "Đang tạo {0}...", id: "Membuat {0}...", ru: "Создание {0}...", th: "กำลังสร้าง {0}..." },
  "gifSimplify.desc": { en: "Upload a GIF or video, choose the reduction level. The tool keeps 1 in every N frames, then exports a lighter GIF or a faster WebM.", vi: "Tải GIF hoặc video, chọn mức giảm, tool sẽ giữ 1 trong mỗi N frame rồi xuất GIF nhẹ hơn hoặc WebM chạy nhanh hơn.", id: "Unggah GIF atau video, pilih tingkat pengurangan. Alat menyimpan 1 dari setiap N bingkai, lalu mengekspor GIF yang lebih ringan atau WebM yang lebih cepat.", ru: "Загрузите GIF или видео, выберите уровень уменьшения. Инструмент оставляет 1 из каждых N кадров, затем экспортирует более лёгкий GIF или более быстрый WebM.", th: "อัปโหลด GIF หรือวิดีโอ เลือกระดับการลด เครื่องมือจะเก็บ 1 จากทุกๆ N เฟรม แล้วส่งออก GIF ที่เบากว่าหรือ WebM ที่เร็วกว่า" },
  "gifSimplify.download": { en: "Download {0}", vi: "Tải về {0}", id: "Unduh {0}", ru: "Скачать {0}", th: "ดาวน์โหลด {0}" },
  "gifSimplify.drop.button": { en: "Choose file", vi: "Chọn file", id: "Pilih file", ru: "Выбрать файл", th: "เลือกไฟล์" },
  "gifSimplify.drop.support": { en: "Supported: GIF · MP4 · WebM · MOV", vi: "Hỗ trợ: GIF · MP4 · WebM · MOV", id: "Didukung: GIF · MP4 · WebM · MOV", ru: "Поддерживается: GIF · MP4 · WebM · MOV", th: "รองรับ: GIF · MP4 · WebM · MOV" },
  "gifSimplify.drop.title": { en: "Drag & drop GIF or Video here", vi: "Kéo thả GIF hoặc Video vào đây", id: "Seret & lepas GIF atau Video di sini", ru: "Перетащите GIF или Видео сюда", th: "ลากและวาง GIF หรือวิดีโอที่นี่" },
  "gifSimplify.error.minFrames": { en: "Need at least 2 frames.", vi: "Cần ít nhất 2 frame.", id: "Butuh setidaknya 2 bingkai.", ru: "Нужно минимум 2 кадра.", th: "ต้องการอย่างน้อย 2 เฟรม" },
  "gifSimplify.error.noFramesLeft": { en: "No frames left after reduction.", vi: "Không còn frame nào sau khi giảm.", id: "Tidak ada bingkai tersisa setelah pengurangan.", ru: "Не осталось кадров после уменьшения.", th: "ไม่เหลือเฟรมหลังการลด" },
  "gifSimplify.error.render": { en: "Render error: {0}", vi: "Lỗi render: {0}", id: "Kesalahan render: {0}", ru: "Ошибка рендера: {0}", th: "ข้อผิดพลาดในการเรนเดอร์: {0}" },
  "gifSimplify.fast": { en: "Fast", vi: "Nhanh", id: "Cepat", ru: "Быстро", th: "เร็ว" },
  "gifSimplify.frameSettings": { en: "Frame reduction settings", vi: "Thiết lập giảm frame", id: "Pengaturan pengurangan bingkai", ru: "Настройки уменьшения кадров", th: "ตั้งค่าการลดเฟรม" },
  "gifSimplify.frames": { en: "frames", vi: "frame", id: "bingkai", ru: "кадров", th: "เฟรม" },
  "gifSimplify.gifQuality": { en: "GIF quality", vi: "Chất lượng GIF", id: "Kualitas GIF", ru: "Качество GIF", th: "คุณภาพ GIF" },
  "gifSimplify.good": { en: "Good", vi: "Tốt", id: "Baik", ru: "Хорошо", th: "ดี" },
  "gifSimplify.heading": { en: "Skip frames, lighter & faster", vi: "Bỏ xen kẽ frame, nhẹ hơn & nhanh hơn", id: "Lewati bingkai, lebih ringan & lebih cepat", ru: "Пропуск кадров, легче и быстрее", th: "ข้ามเฟรม เบากว่าและเร็วกว่า" },
  "gifSimplify.keepCount": { en: "→ keep {0} (remove {1})", vi: "→ giữ {0} (bỏ {1})", id: "→ pertahankan {0} (hapus {1})", ru: "→ оставить {0} (убрать {1})", th: "→ เก็บ {0} (ลบ {1})" },
  "gifSimplify.keepEvery": { en: "Keep 1 in every", vi: "Giữ 1 trong mỗi", id: "Pertahankan 1 dari setiap", ru: "Оставлять 1 из каждых", th: "เก็บ 1 จากทุกๆ" },
  "gifSimplify.maxDim": { en: "Max dimension", vi: "Kích thước tối đa", id: "Dimensi maksimum", ru: "Макс. размер", th: "ขนาดสูงสุด" },
  "gifSimplify.medium": { en: "Medium", vi: "Vừa", id: "Sedang", ru: "Средне", th: "ปานกลาง" },
  "gifSimplify.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "gifSimplify.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "gifSimplify.outputFps": { en: "Output FPS", vi: "FPS đầu ra", id: "FPS keluaran", ru: "FPS вывода", th: "FPS ผลลัพธ์" },
  "gifSimplify.processed": { en: "✓ Processed", vi: "✓ Đã xử lý", id: "✓ Diproses", ru: "✓ Обработано", th: "✓ ประมวลผลแล้ว" },
  "gifSimplify.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "gifSimplify.reduceFrames": { en: "Reduce {0} → {1} frames", vi: "Giảm {0} → {1} frame", id: "Kurangi {0} → {1} bingkai", ru: "Уменьшить {0} → {1} кадров", th: "ลด {0} → {1} เฟรม" },
  "gifSimplify.seo.desc": { en: "Reduce the number of frames to make GIF lighter, or fast-forward video by skipping frames. Processed locally in your browser.", vi: "Giảm một nửa số frame để GIF nhẹ hơn, hoặc tua nhanh video bằng cách bỏ xen kẽ frame. Xử lý cục bộ trên trình duyệt.", id: "Kurangi jumlah bingkai untuk membuat GIF lebih ringan, atau percepat video dengan melewati bingkai. Diproses lokal di browser Anda.", ru: "Уменьшите количество кадров, чтобы GIF стал легче, или ускорьте видео, пропуская кадры. Обрабатывается локально в вашем браузере.", th: "ลดจำนวนเฟรมเพื่อทำให้ GIF เบากว่า หรือเร่งวิดีโอด้วยการข้ามเฟรม ประมวลผลในเบราว์เซอร์ของคุณ" },
  "gifSimplify.seo.title": { en: "Simplify GIF / Fast-forward video | Pixel Normal Edit", vi: "Đơn giản hóa GIF / Tua nhanh video | Pixel Normal Edit", id: "Sederhanakan GIF / Percepat video | Pixel Normal Edit", ru: "Упрощение GIF / Ускорение видео | Pixel Normal Edit", th: "ทำให้ GIF ง่ายขึ้น / เร่งวิดีโอ | Pixel Normal Edit" },
  "gifSimplify.skipEvery": { en: "Skip every", vi: "Bỏ qua mỗi", id: "Lewati setiap", ru: "Пропускать каждый", th: "ข้ามทุกๆ" },
  "gifSimplify.title": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video", id: "Sederhanakan GIF / Percepat video", ru: "Упрощение GIF / Ускорение видео", th: "ทำให้ GIF ง่ายขึ้น / เร่งวิดีโอ" },
  "gifSimplify.videoExtractFps": { en: "Video extract FPS", vi: "FPS tách video", id: "FPS ekstrak video", ru: "FPS извлечения видео", th: "FPS การแยกวิดีโอ" },
  "gifSimplify.webmVideo": { en: "WebM Video", vi: "WebM Video", id: "Video WebM", ru: "WebM Видео", th: "วิดีโอ WebM" },
  "gifSimplify.x10Fast": { en: "x10 (very fast)", vi: "x10 (rất nhanh)", id: "x10 (sangat cepat)", ru: "x10 (очень быстро)", th: "x10 (เร็วมาก)" },
  "gifSimplify.x2Light": { en: "x2 (light)", vi: "x2 (nhẹ)", id: "x2 (ringan)", ru: "x2 (легко)", th: "x2 (เบา)" },
  "group.backupSync": { en: "Backup & Sync", vi: "Lưu trữ & Đồng bộ", id: "Cadangan & Sinkronisasi", ru: "Резервное копирование и синхронизация", th: "สำรองและซิงค์" },
  "group.draw": { en: "Draw", vi: "Vẽ", id: "Gambar", ru: "Рисование", th: "วาด" },
  "group.fillBg": { en: "Fill", vi: "Tô màu", id: "Isi", ru: "Заливка", th: "เทสี" },
  "group.imageOps": { en: "Image Operations", vi: "Thao tác ảnh", id: "Operasi Gambar", ru: "Операции с изображениями", th: "การจัดการรูปภาพ" },
  "group.localImageStore": { en: "Local Image Store", vi: "Kho ảnh cục bộ", id: "Penyimpanan Gambar Lokal", ru: "Локальное хранилище изображений", th: "ที่เก็บรูปภาพท้องถิ่น" },
  "group.nav": { en: "Navigation", vi: "Điều hướng", id: "Navigasi", ru: "Навигация", th: "นำทาง" },
  "group.navigation": { en: "Navigation", vi: "Điều hướng", id: "Navigasi", ru: "Навигация", th: "นำทาง" },
  "group.operations": { en: "Edit", vi: "Chỉnh sửa", id: "Edit", ru: "Редактирование", th: "แก้ไข" },
  "group.settings": { en: "Settings", vi: "Cài đặt", id: "Pengaturan", ru: "Настройки", th: "ตั้งค่า" },
  "group.shape": { en: "Shapes", vi: "Hình", id: "Bentuk", ru: "Фигуры", th: "รูปทรง" },
  "home.benefit.ai": { en: "AI Integration (MCP)", vi: "AI Integration (MCP)", id: "Integrasi AI (MCP)", ru: "Интеграция AI (MCP)", th: "การผสานรวม AI (MCP)" },
  "home.benefit.aiDesc": { en: "Connect AI agents (Claude, Cursor, Windsurf) via the MCP protocol to draw directly on the canvas in real time.", vi: "Connect AI agents (Claude, Cursor, Windsurf) via the MCP protocol to draw directly on the canvas in real time.", id: "Hubungkan agen AI (Claude, Cursor, Windsurf) melalui protokol MCP untuk menggambar langsung di kanvas secara real time.", ru: "Подключите AI-агентов через протокол MCP для рисования на холсте в реальном времени.", th: "เชื่อมต่อ AI agents ผ่านโปรโตคอล MCP เพื่อวาดบนผืนผ้าใบแบบเรียลไทม์" },
  "home.benefit.batch": { en: "Batch processing", vi: "Batch processing", id: "Pemrosesan batch", ru: "Пакетная обработка", th: "การประมวลผลแบบกลุ่ม" },
  "home.benefit.batchDesc": { en: "Process dozens of images at once, saving significant time.", vi: "Xử lý hàng chục ảnh cùng lúc, tiết kiệm thời gian đáng kể.", id: "Proses puluhan gambar sekaligus, menghemat waktu signifikan.", ru: "Обрабатывайте десятки изображений одновременно.", th: "ประมวลผลรูปภาพหลายสิบรายการพร้อมกัน" },
  "home.benefit.cross": { en: "Cross-platform", vi: "Đa nền tảng", id: "Lintas platform", ru: "Кроссплатформенность", th: "ข้ามแพลตฟอร์ม" },
  "home.benefit.crossDesc": { en: "Works on all modern browsers, no installs or plugins needed.", vi: "Hoạt động trên mọi trình duyệt hiện đại, không cần cài đặt hay plugin.", id: "Berfungsi di semua browser modern, tanpa instalasi atau plugin.", ru: "Работает во всех современных браузерах.", th: "ทำงานในเบราว์เซอร์สมัยใหม่ทั้งหมด" },
  "home.benefit.free": { en: "Free forever", vi: "Miễn phí mãi mãi", id: "Gratis selamanya", ru: "Бесплатно навсегда", th: "ฟรีตลอดกาล" },
  "home.benefit.freeDesc": { en: "Core features are completely free, unlimited images.", vi: "Các tính năng cơ bản hoàn toàn miễn phí, không giới hạn số lượng ảnh.", id: "Fitur inti sepenuhnya gratis, gambar tanpa batas.", ru: "Основные функции полностью бесплатные.", th: "ฟีเจอร์หลักฟรีทั้งหมด" },
  "home.benefit.privacy": { en: "Completely private", vi: "Hoàn toàn riêng tư", id: "Sepenuhnya pribadi", ru: "Полная приватность", th: "เป็นส่วนตัวอย่างสมบูรณ์" },
  "home.benefit.privacyDesc": { en: "All processing happens right in your browser. Images never leave your device.", vi: "Mọi xử lý diễn ra ngay trên trình duyệt của bạn. Ảnh không bao giờ rời khỏi thiết bị.", id: "Semua pemrosesan terjadi langsung di browser Anda. Gambar tidak pernah meninggalkan perangkat Anda.", ru: "Вся обработка происходит в браузере. Изображения не покидают устройство.", th: "การประมวลผลทั้งหมดเกิดขึ้นในเบราว์เซอร์ รูปภาพไม่ออกจากอุปกรณ์" },
  "home.benefit.speed": { en: "Instant speed", vi: "Tốc độ tức thì", id: "Kecepatan instan", ru: "Мгновенная скорость", th: "ความเร็วทันที" },
  "home.benefit.speedDesc": { en: "No server upload wait. Local processing gives instant results.", vi: "Không chờ upload server. Xử lý cục bộ cho kết quả ngay lập tức.", id: "Tanpa menunggu unggah server. Pemrosesan lokal memberikan hasil instan.", ru: "Нет ожидания загрузки на сервер.", th: "ไม่ต้องรออัปโหลดเซิร์ฟเวอร์" },
  "home.benefit.subtitle": { en: "What the website brings to you.", vi: "Những gì được trang web mang lại cho bạn.", id: "Apa yang dibawa situs web ini untuk Anda.", ru: "Что сайт предлагает вам.", th: "สิ่งที่เว็บไซต์นำเสนอให้คุณ" },
  "home.benefit.title": { en: "Key benefits", vi: "Ưu điểm nổi bật", id: "Manfaat utama", ru: "Ключевые преимущества", th: "ข้อได้เปรียบหลัก" },
  "home.benefit.ui": { en: "Intuitive interface", vi: "Giao diện trực quan", id: "Antarmuka intuitif", ru: "Интуитивный интерфейс", th: "อินเทอร์เฟซใช้งานง่าย" },
  "home.benefit.uiDesc": { en: "UI designed for users, no technical knowledge required.", vi: "UI được thiết kế cho người dùng, không yêu cầu kiến thức kỹ thuật.", id: "UI dirancang untuk pengguna, tanpa pengetahuan teknis.", ru: "Интерфейс разработан для пользователей.", th: "UI ออกแบบมาสำหรับผู้ใช้" },
  "home.benefits.label": { en: "Benefits", vi: "Lợi ích", id: "Manfaat", ru: "Преимущества", th: "ประโยชน์" },
  "home.benefits.subtitle": { en: "Not just an image tool — it's an experience designed for modern users.", vi: "Không chỉ là một công cụ xử lý ảnh — đây là trải nghiệm được thiết kế cho người dùng hiện đại.", id: "Bukan sekadar alat gambar — ini adalah pengalaman yang dirancang untuk pengguna modern.", ru: "Не просто инструмент для изображений — это опыт для современных пользователей.", th: "ไม่ใช่แค่เครื่องมือรูปภาพ — เป็นประสบการณ์สำหรับผู้ใช้ยุคใหม่" },
  "home.benefits.title": { en: "Why choose ImgTools?", vi: "Tại sao chọn ImgTools?", id: "Mengapa memilih ImgTools?", ru: "Почему выбирают ImgTools?", th: "ทำไมต้องเลือก ImgTools?" },
  "home.bug.desc": { en: "If you run into an issue while using the tool, please report it so our team can fix it as soon as possible.", vi: "Nếu bạn gặp sự cố khi sử dụng công cụ, vui lòng báo cáo lỗi để đội ngũ kỹ thuật có thể xử lý sớm nhất.", id: "Jika Anda mengalami masalah saat menggunakan alat, silakan laporkan agar tim kami dapat memperbaikinya secepat mungkin.", ru: "Если вы столкнулись с проблемой, сообщите об ошибке.", th: "หากพบปัญหา กรุณารายงานข้อผิดพลาด" },
  "home.bug.github": { en: "Create a GitHub Issue", vi: "Tạo Issue trên GitHub", id: "Buat Issue GitHub", ru: "Создать Issue на GitHub", th: "สร้าง Issue บน GitHub" },
  "home.bug.report": { en: "Submit bug report", vi: "Gửi form báo lỗi", id: "Kirim laporan bug", ru: "Отправить отчёт об ошибке", th: "ส่งรายงานข้อผิดพลาด" },
  "home.bug.subtitle": { en: "Help us improve the product", vi: "Giúp chúng tôi cải thiện sản phẩm", id: "Bantu kami meningkatkan produk", ru: "Помогите нам улучшить продукт", th: "ช่วยเราปรับปรุงผลิตภัณฑ์" },
  "home.bug.title": { en: "Found a bug?", vi: "Phát hiện lỗi?", id: "Menemukan bug?", ru: "Нашли ошибку?", th: "พบข้อผิดพลาด?" },
  "home.contact.addressLabel": { en: "ADDRESS", vi: "ĐỊA CHỈ", id: "ALAMAT", ru: "АДРЕС", th: "ที่อยู่" },
  "home.contact.addressValue": { en: "123 Nguyen Hue, Q.1<br />Ho Chi Minh City, Vietnam", vi: "123 Nguyễn Huệ, Q.1<br />TP. Hồ Chí Minh, Việt Nam", id: "123 Nguyen Hue, Q.1<br />Kota Ho Chi Minh, Vietnam", ru: "123 Nguyen Hue, Q.1, Ho Chi Minh City, Vietnam", th: "123 Nguyen Hue, Q.1, โฮจิมินห์ซิตี้ เวียดนาม" },
  "home.contact.alertFill": { en: "Please fill in all information.", vi: "Vui lòng điền đầy đủ thông tin.", id: "Silakan isi semua informasi.", ru: "Пожалуйста, заполните всю информацию.", th: "กรุณากรอกข้อมูลทั้งหมด" },
  "home.contact.email": { en: "Email", vi: "Email", id: "Email", ru: "Электронная почта", th: "อีเมล" },
  "home.contact.emailDesc": { en: "Replies within 24 hours", vi: "Phản hồi trong 24 giờ", id: "Balasan dalam 24 jam", ru: "Ответ в течение 24 часов", th: "ตอบกลับภายใน 24 ชั่วโมง" },
  "home.contact.emailLabel": { en: "EMAIL", vi: "EMAIL", id: "EMAIL", ru: "ЭЛЕКТРОННАЯ ПОЧТА", th: "อีเมล" },
  "home.contact.emailPlaceholder": { en: "email@example.com", vi: "email@example.com", id: "email@example.com", ru: "email@example.com", th: "email@example.com" },
  "home.contact.emailValue": { en: "hello@imgtools.vn", vi: "hello@imgtools.vn", id: "hello@imgtools.vn", ru: "hello@imgtools.vn", th: "hello@imgtools.vn" },
  "home.contact.label": { en: "Contact", vi: "Liên hệ", id: "Kontak", ru: "Контакты", th: "ติดต่อ" },
  "home.contact.message": { en: "Message", vi: "Nội dung", id: "Pesan", ru: "Сообщение", th: "ข้อความ" },
  "home.contact.messagePlaceholder": { en: "Your message...", vi: "Nội dung tin nhắn của bạn...", id: "Pesan Anda...", ru: "Ваше сообщение...", th: "ข้อความของคุณ..." },
  "home.contact.name": { en: "Full name", vi: "Họ và tên", id: "Nama lengkap", ru: "Полное имя", th: "ชื่อ-นามสกุล" },
  "home.contact.namePlaceholder": { en: "Nguyen Van A", vi: "Nguyễn Văn A", id: "Nguyen Van A", ru: "Nguyen Van A", th: "Nguyen Van A" },
  "home.contact.phoneDesc": { en: "Mon – Fri, 9:00–18:00", vi: "Thứ 2 – Thứ 6, 9:00–18:00", id: "Sen – Jum, 9:00–18:00", ru: "Пн-Пт, 9:00-18:00", th: "จันทร์-ศุกร์, 9:00-18:00" },
  "home.contact.phoneLabel": { en: "PHONE", vi: "ĐIỆN THOẠI", id: "TELEPON", ru: "ТЕЛЕФОН", th: "โทรศัพท์" },
  "home.contact.phoneValue": { en: "0901 234 567", vi: "0901 234 567", id: "0901 234 567", ru: "0901 234 567", th: "0901 234 567" },
  "home.contact.send": { en: "Send message →", vi: "Gửi tin nhắn →", id: "Kirim pesan →", ru: "Отправить сообщение", th: "ส่งข้อความ" },
  "home.contact.sent": { en: "✓ Sent!", vi: "✓ Đã gửi!", id: "✓ Terkirim!", ru: "Отправлено!", th: "ส่งแล้ว!" },
  "home.contact.subtitle": { en: "Have questions or want to collaborate? Our team will respond within 24 hours.", vi: "Có câu hỏi hoặc muốn hợp tác? Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ.", id: "Punya pertanyaan atau ingin berkolaborasi? Tim kami akan merespons dalam 24 jam.", ru: "Есть вопросы? Наша команда ответит в течение 24 часов.", th: "มีคำถาม? ทีมของเราจะตอบกลับภายใน 24 ชั่วโมง" },
  "home.contact.title": { en: "Connect with us", vi: "Kết nối với chúng tôi", id: "Terhubung dengan kami", ru: "Свяжитесь с нами", th: "ติดต่อเรา" },
  "home.cta.button": { en: "Explore now", vi: "Khám phá ngay", id: "Jelajahi sekarang", ru: "Начать сейчас", th: "เริ่มต้นตอนนี้" },
  "home.cta.subtitle": { en: "Experience the next-generation AI image editing tools now.", vi: "Trải nghiệm công cụ chỉnh sửa ảnh AI thế hệ tiếp theo ngay bây giờ.", id: "Rasakan alat pengeditan gambar AI generasi berikutnya sekarang.", ru: "Попробуйте инструменты AI нового поколения.", th: "ทดลองใช้เครื่องมือ AI รุ่นใหม่" },
  "home.cta.title": { en: "Ready to get started?", vi: "Sẵn sàng bắt đầu?", id: "Siap untuk memulai?", ru: "Готовы начать?", th: "พร้อมเริ่มต้นหรือยัง?" },
  "home.feature.subtitle": { en: "Discover AI tools and features that will change how you edit images.", vi: "Khám phá các công cụ và tính năng AI sẽ thay đổi cách bạn chỉnh sửa ảnh.", id: "Temukan alat dan fitur AI yang akan mengubah cara Anda mengedit gambar.", ru: "Откройте инструменты AI, которые изменят редактирование изображений.", th: "ค้นพบเครื่องมือ AI ที่จะเปลี่ยนวิธีแก้ไขรูปภาพ" },
  "home.feature.title": { en: "Featured features", vi: "Tính năng nổi bật", id: "Fitur unggulan", ru: "Избранные функции", th: "ฟีเจอร์เด่น" },
  "home.featuredTools.subtitle": { en: "Everything in one powerful AI toolkit for image processing.", vi: "Tất cả trong một bộ công cụ AI mạnh mẽ để xử lý ảnh.", id: "Semuanya dalam satu toolkit AI yang kuat untuk pemrosesan gambar.", ru: "Всё в одном наборе инструментов AI.", th: "ทุกอย่างในชุดเครื่องมือ AI เดียว" },
  "home.featuredTools.title": { en: "Featured tools", vi: "Công cụ nổi bật", id: "Alat unggulan", ru: "Избранные инструменты", th: "เครื่องมือเด่น" },
  "home.footer.about": { en: "About us", vi: "Về chúng tôi", id: "Tentang kami", ru: "О нас", th: "เกี่ยวกับเรา" },
  "home.footer.blog": { en: "Blog", vi: "Blog", id: "Blog", ru: "Блог", th: "บล็อก" },
  "home.footer.careers": { en: "Careers", vi: "Tuyển dụng", id: "Karier", ru: "Карьера", th: "ร่วมงานกับเรา" },
  "home.footer.company": { en: "Company", vi: "Công ty", id: "Perusahaan", ru: "Компания", th: "บริษัท" },
  "home.footer.contact": { en: "Contact", vi: "Liên hệ", id: "Kontak", ru: "Контакты", th: "ติดต่อ" },
  "home.footer.cookie": { en: "Cookie", vi: "Cookie", id: "Cookie", ru: "Cookie", th: "Cookie" },
  "home.footer.copyright": { en: "© 2026 Pixel Normal Edit. All rights reserved.", vi: "© 2026 Pixel Normal Edit. All rights reserved.", id: "© 2026 Pixel Normal Edit. Semua hak dilindungi.", ru: "2026 Pixel Normal Edit. Все права защищены.", th: "2026 Pixel Normal Edit. สงวนลิขสิทธิ์ทุกประการ" },
  "home.footer.desc": { en: "Image processing platform running right in your browser. Fast, private, and free.", vi: "Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.", id: "Platform pemrosesan gambar berjalan langsung di browser Anda. Cepat, pribadi, dan gratis.", ru: "Платформа обработки изображений в браузере. Быстро, приватно, бесплатно.", th: "แพลตฟอร์มประมวลผลรูปภาพในเบราว์เซอร์ เร็ว เป็นส่วนตัว ฟรี" },
  "home.footer.docs": { en: "Documentation", vi: "Tài liệu", id: "Dokumentasi", ru: "Документация", th: "เอกสาร" },
  "home.footer.faq": { en: "FAQ", vi: "FAQ", id: "FAQ", ru: "FAQ", th: "FAQ" },
  "home.footer.githubIssues": { en: "GitHub Issues", vi: "GitHub Issues", id: "Issue GitHub", ru: "GitHub Issues", th: "GitHub Issues" },
  "home.footer.legal": { en: "Legal", vi: "Pháp lý", id: "Hukum", ru: "Правовая информация", th: "ข้อมูลกฎหมาย" },
  "home.footer.press": { en: "Press", vi: "Báo chí", id: "Pers", ru: "Пресса", th: "สื่อ" },
  "home.footer.privacy": { en: "Privacy", vi: "Bảo mật", id: "Privasi", ru: "Конфиденциальность", th: "ความเป็นส่วนตัว" },
  "home.footer.privacyPolicy": { en: "Privacy Policy", vi: "Chính sách bảo mật", id: "Kebijakan Privasi", ru: "Политика конфиденциальности", th: "นโยบายความเป็นส่วนตัว" },
  "home.footer.products": { en: "Products", vi: "Sản phẩm", id: "Produk", ru: "Продукты", th: "ผลิตภัณฑ์" },
  "home.footer.report": { en: "Report bug", vi: "Báo lỗi", id: "Laporkan bug", ru: "Сообщить об ошибке", th: "รายงานข้อผิดพลาด" },
  "home.footer.reportForm": { en: "Report bug (Google Form)", vi: "Báo lỗi (Google Form)", id: "Laporkan bug (Google Form)", ru: "Сообщить об ошибке (Google Form)", th: "รายงานข้อผิดพลาด (Google Form)" },
  "home.footer.support": { en: "Support", vi: "Hỗ trợ", id: "Dukungan", ru: "Поддержка", th: "สนับสนุน" },
  "home.footer.terms": { en: "Terms", vi: "Điều khoản", id: "Ketentuan", ru: "Условия", th: "เงื่อนไข" },
  "home.footer.termsOfUse": { en: "Terms of Use", vi: "Điều khoản sử dụng", id: "Ketentuan Penggunaan", ru: "Условия использования", th: "เงื่อนไขการใช้งาน" },
  "home.footer.title": { en: "AITaoanh", vi: "AITaoanh", id: "AITaoanh", ru: "AITaoanh", th: "AITaoanh" },
  "home.hero.badge": { en: "Pixel Normal Edit", vi: "Pixel Normal Edit", id: "Pixel Normal Edit", ru: "Pixel Normal Edit", th: "Pixel Normal Edit" },
  "home.hero.cta": { en: "Get started now", vi: "Bắt đầu ngay", id: "Mulai sekarang", ru: "Начать сейчас", th: "เริ่มต้นตอนนี้" },
  "home.hero.cta.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "home.hero.ctaSub": { en: "Completely free", vi: "Hoàn toàn miễn phí", id: "Sepenuhnya gratis", ru: "Полностью бесплатно", th: "ฟรีทั้งหมด" },
  "home.hero.desc": { en: "Image processing platform running right in your browser — no account needed, no server uploads, your data belongs only to you.", vi: "Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn.", id: "Platform pemrosesan gambar berjalan langsung di browser Anda — tanpa akun, tanpa unggah server, data Anda hanya milik Anda.", ru: "Платформа обработки изображений в браузере — не нужен аккаунт, данные принадлежат только вам.", th: "แพลตฟอร์มประมวลผลรูปภาพในเบราว์เซอร์ — ไม่ต้องมีบัญชี ข้อมูลเป็นของคุณเท่านั้น" },
  "home.hero.headline": { en: "Pixel Art Editor", vi: "Pixel Art Editor", id: "Editor Pixel Art", ru: "Редактор пиксельной графики", th: "ตัวแก้ไขพิกเซลอาร์ต" },
  "home.hero.mockupLabel": { en: "Professional image editing screen", vi: "Màn hình chỉnh sửa ảnh chuyên nghiệp", id: "Layar pengeditan gambar profesional", ru: "Профессиональный экран редактирования", th: "หน้าจอแก้ไขระดับมืออาชีพ" },
  "home.hero.stats": { en: "2,048,391 images processed today", vi: "2,048,391 ảnh đã xử lý hôm nay", id: "2.048.391 gambar diproses hari ini", ru: "2 048 391 изображений обработано сегодня", th: "2,048,391 รูปภาพถูกประมวลผลวันนี้" },
  "home.hero.subheadline": { en: "Professional image editing, pixel art drawing and animation creation with leading smart AI tools", vi: "Chỉnh sửa ảnh chuyên nghiệp, vẽ pixel art và tạo animation với công cụ AI thông minh hàng đầu", id: "Pengeditan gambar profesional, menggambar pixel art dan pembuatan animasi dengan alat AI cerdas terkemuka", ru: "Профессиональное редактирование, пиксельная графика и анимация с AI", th: "การแก้ไขระดับมืออาชีพ พิกเซลอาร์ต และภาพเคลื่อนไหวด้วย AI" },
  "home.hero.tagline": { en: "Turn ideas into masterpieces in an instant.", vi: "Biến ý tưởng thành tác phẩm chỉ trong nháy mắt.", id: "Ubah ide menjadi mahakarya dalam sekejap.", ru: "Превратите идеи в шедевры мгновенно.", th: "เปลี่ยนไอเดียเป็นผลงานชิ้นเอกได้ทันที" },
  "home.hero.title": { en: "Fast & private image processing tools.", vi: "Công cụ xử lý ảnh nhanh & riêng tư.", id: "Alat pemrosesan gambar cepat & pribadi.", ru: "Быстрые и приватные инструменты обработки.", th: "เครื่องมือประมวลผลที่เร็วและเป็นส่วนตัว" },
  "home.koFiSupport": { en: "Support me on Ko-fi", vi: "Ủng hộ tôi trên Ko-fi", id: "Dukung saya di Ko-fi", ru: "Поддержите меня на Ko-fi", th: "สนับสนุนฉันบน Ko-fi" },
  "home.nav.contact": { en: "Contact", vi: "Liên hệ", id: "Kontak", ru: "Контакты", th: "ติดต่อ" },
  "home.nav.features": { en: "Features", vi: "Tính năng", id: "Fitur", ru: "Функции", th: "คุณสมบัติ" },
  "home.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "home.nav.login": { en: "Login", vi: "Đăng nhập", id: "Masuk", ru: "Войти", th: "เข้าสู่ระบบ" },
  "home.nav.products": { en: "Products", vi: "Sản phẩm", id: "Produk", ru: "Продукты", th: "ผลิตภัณฑ์" },
  "home.pricing.foreverFree": { en: "Free forever", vi: "Miễn phí mãi mãi", id: "Gratis selamanya", ru: "Бесплатно навсегда", th: "ฟรีตลอดกาล" },
  "home.pricing.subtitle": { en: "Tools are always free. With an account you get access to exclusive features.", vi: "Công cụ luôn miễn phí. Với một tài khoản bạn có quyền truy cập với tính năng riêng.", id: "Alat selalu gratis. Dengan akun Anda mendapatkan akses ke fitur eksklusif.", ru: "Инструменты всегда бесплатные. С аккаунтом — доступ к эксклюзивным функциям.", th: "เครื่องมือฟรีเสมอ ด้วยบัญชีจะได้สิทธิ์ฟีเจอร์พิเศษ" },
  "home.pricing.tagline": { en: "Core tools are always free. Create an account to unlock premium features.", vi: "Công cụ cơ bản luôn miễn phí. Tạo tài khoản để mở khóa tính năng cao cấp.", id: "Alat inti selalu gratis. Buat akun untuk membuka fitur premium.", ru: "Основные инструменты бесплатны. Создайте аккаунт для премиум-функций.", th: "เครื่องมือหลักฟรี สร้างบัญชีเพื่อปลดล็อกฟีเจอร์พรีเมียม" },
  "home.pricing.title": { en: "Pricing", vi: "Giá cả", id: "Harga", ru: "Цены", th: "ราคา" },
  "home.products.label": { en: "Products", vi: "Sản phẩm", id: "Produk", ru: "Продукты", th: "ผลิตภัณฑ์" },
  "home.products.subtitle": { en: "From format conversion to advanced editing — all in one platform.", vi: "Từ chuyển đổi định dạng đến chỉnh sửa nâng cao — tất cả trong một nền tảng duy nhất.", id: "Dari konversi format hingga pengeditan lanjutan — semua dalam satu platform.", ru: "От конвертации до продвинутого редактирования — всё на одной платформе.", th: "จาการแปลงไปจนถึงการแก้ไขขั้นสูง — ทั้งหมดในแพลตฟอร์มเดียว" },
  "home.products.title": { en: "Comprehensive toolkit", vi: "Bộ công cụ toàn diện", id: "Toolkit komprehensif", ru: "Комплексный набор инструментов", th: "ชุดเครื่องมือครบวงจร" },
  "home.support.desc": { en: "If you find this tool useful, consider buying us a coffee to help us keep building new features.", vi: "Nếu bạn thấy công cụ hữu ích, hãy ủng hộ một ly cà phê để chúng tôi tiếp tục phát triển các tính năng mới.", id: "Jika Anda merasa alat ini berguna, pertimbangkan untuk membelikan kami kopi untuk membantu kami terus membangun fitur baru.", ru: "Если инструмент полезен, купите нам кофе.", th: "หากเครื่องมือนี้มีประโยชน์ โปรดสนับสนุนเราด้วยกาแฟ" },
  "home.support.title": { en: "Support this project", vi: "Ủng hộ dự án", id: "Dukung proyek ini", ru: "Поддержать проект", th: "สนับสนุนโปรเจกต์นี้" },
  "home.tool.aiPixelArtist": { en: "AI Pixel Artist", vi: "Họa sĩ pixel AI", id: "Seniman Piksel AI", ru: "AI-художник пикселей", th: "ศิลปินพิกเซล AI" },
  "home.tool.aiPixelArtistDesc": { en: "Create high-quality pixel art with AI.", vi: "Tạo pixel art chất lượng cao bằng AI.", id: "Buat pixel art berkualitas tinggi dengan AI.", ru: "Создавайте пиксельную графику с AI.", th: "สร้างพิกเซลอาร์ตด้วย AI" },
  "home.tool.aiPixelArtistDetail": { en: "Custom sizes, rich palette.", vi: "Kích thước tùy chỉnh, palette phong phú.", id: "Ukuran kustom, palet kaya.", ru: "Пользовательские размеры, богатая палитра.", th: "ขนาดกำหนดเอง จานสีหลากสี" },
  "home.tool.avatar": { en: "AI Avatar", vi: "Avatar AI", id: "Avatar AI", ru: "AI-аватар", th: "อวาตาร์ AI" },
  "home.tool.avatarDesc": { en: "Create multi-style AI avatars from selfies.", vi: "Tạo avatar AI đa phong cách từ ảnh selfie.", id: "Buat avatar AI multi-gaya dari selfie.", ru: "Создавайте AI-аватары из селфи.", th: "สร้างอวาตาร์ AI จากเซลฟี่" },
  "home.tool.avatarDetail": { en: "Hundreds of styles: anime, cyberpunk, fantasy...", vi: "Hàng trăm phong cách: anime, cyberpunk, fantasy...", id: "Ratusan gaya: anime, cyberpunk, fantasi...", ru: "Сотни стилей: аниме, киберпанк, фэнтези...", th: "หลายร้อยสไตล์: อนิเมะ ไซเบอร์พังก์ แฟนตาซี..." },
  "home.tool.bgRemove": { en: "AI Background Remover", vi: "Xóa nền AI", id: "Penghapus Latar AI", ru: "AI-удаление фона", th: "ลบพื้นหลังด้วย AI" },
  "home.tool.bgRemoveDesc": { en: "Remove image background with a single click.", vi: "Xóa nền ảnh chỉ với một cú click.", id: "Hapus latar gambar dengan satu klik.", ru: "Удалите фон одним нажатием.", th: "ลบรูปภาพพื้นหลังด้วยการคลิกเดียว" },
  "home.tool.bgRemoveDetail": { en: "Professional results, sharp edges.", vi: "Kết quả chuyên nghiệp, đường viền sắc nét.", id: "Hasil profesional, tepi tajam.", ru: "Профессиональные результаты.", th: "ผลลัพธ์ระดับมืออาชีพ" },
  "home.tool.cartoon": { en: "Cartoon Mode", vi: "Chế độ hoạt hình", id: "Mode Kartun", ru: "Режим мультфильма", th: "โหมดการ์ตูน" },
  "home.tool.cartoonDesc": { en: "Turn photos into stylish cartoons.", vi: "Biến ảnh thành tranh hoạt hình phong cách.", id: "Ubah foto menjadi kartun bergaya.", ru: "Превратите фото в мультфильмы.", th: "เปลี่ยนรูปถ่ายเป็นการ์ตูน" },
  "home.tool.cartoonDetail": { en: "Many styles: Disney, Pixar, anime...", vi: "Nhiều style: Disney, Pixar, anime...", id: "Banyak gaya: Disney, Pixar, anime...", ru: "Много стилей: Дисней, Пиксар, аниме...", th: "หลายสไตล์: ดิสนีย์ พิกซาร์ อนิเมะ..." },
  "home.tool.colorization": { en: "AI Colorization", vi: "Tô màu AI", id: "Pewarnaan AI", ru: "AI-раскрашивание", th: "ระบายสีด้วย AI" },
  "home.tool.colorizationDesc": { en: "Automatically colorize black and white photos.", vi: "Tô màu ảnh đen trắng tự động.", id: "Warnai foto hitam putih secara otomatis.", ru: "Автоматически раскрашивайте чёрно-белые фото.", th: "ระบายสีรูปถ่ายขาวดำอัตโนมัติ" },
  "home.tool.colorizationDetail": { en: "Get realistic results in seconds.", vi: "Nhận kết quả chân thực trong vài giây.", id: "Dapatkan hasil realistis dalam hitungan detik.", ru: "Реалистичные результаты за секунды.", th: "ผลลัพธ์สมจริงในไม่กี่วินาที" },
  "home.tool.compress": { en: "Compress Image", vi: "Nén ảnh", id: "Kompres Gambar", ru: "Сжатие изображения", th: "บีบอัดรูปภาพ" },
  "home.tool.compressDesc": { en: "Reduce file size 60–90% without significant quality loss.", vi: "Giảm 60–90% dung lượng file mà không giảm chất lượng đáng kể.", id: "Kurangi ukuran file 60–90% tanpa kehilangan kualitas signifikan.", ru: "Уменьшите размер файла на 60-90%.", th: "ลดขนาดไฟล์ 60-90%" },
  "home.tool.compressDetail": { en: "Lossy & lossless", vi: "Lossy & lossless", id: "Lossy & lossless", ru: "Сжатие с потерями и без", th: "บีบอัดแบบมีและไม่มีการสูญเสีย" },
  "home.tool.convert": { en: "Convert Image", vi: "Convert ảnh", id: "Konversi Gambar", ru: "Конвертирование изображений", th: "แปลงรูปภาพ" },
  "home.tool.convertDesc": { en: "Convert between PNG, WebP, AVIF, JPG and 8 other formats.", vi: "Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác.", id: "Konversi antara PNG, WebP, AVIF, JPG dan 8 format lainnya.", ru: "Конвертируйте между PNG, WebP, AVIF, JPG и другими.", th: "แปลงระหว่าง PNG, WebP, AVIF, JPG และอื่นๆ" },
  "home.tool.convertDetail": { en: "12 formats supported", vi: "12 định dạng hỗ trợ", id: "12 format didukung", ru: "12 поддерживаемых форматов", th: "รองรับ 12 รูปแบบ" },
  "home.tool.crop": { en: "Crop Image", vi: "Crop ảnh", id: "Pangkas Gambar", ru: "Обрезка изображения", th: "ตัดรูปภาพ" },
  "home.tool.cropDesc": { en: "Crop custom areas with 1:1, 16:9, 4:3 ratio presets.", vi: "Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3...", id: "Pangkas area kustom dengan prasetel rasio 1:1, 16:9, 4:3.", ru: "Обрезайте с пресетами 1:1, 16:9, 4:3.", th: "ตัดด้วยพรีเซ็ต 1:1, 16:9, 4:3" },
  "home.tool.cropDetail": { en: "Popular ratio presets", vi: "Preset tỉ lệ phổ biến", id: "Prasetel rasio populer", ru: "Популярные пресеты", th: "พรีเซ็ตยอดนิยม" },
  "home.tool.drawing": { en: "AI Drawing", vi: "Vẽ tranh AI", id: "Gambar AI", ru: "AI-рисование", th: "วาดด้วย AI" },
  "home.tool.drawingDesc": { en: "Turn text into artistic drawings.", vi: "Biến text thành tranh vẽ nghệ thuật.", id: "Ubah teks menjadi gambar artistik.", ru: "Превратите текст в рисунки.", th: "เปลี่ยนข้อความเป็นรูปวาด" },
  "home.tool.drawingDetail": { en: "Many styles: watercolor, oil painting, sketch...", vi: "Nhiều phong cách: watercolor, oil painting, sketch...", id: "Banyak gaya: cat air, lukisan minyak, sketsa...", ru: "Много стилей: акварель, масло, набросок...", th: "หลายสไตล์: สีน้ำ สีน้ำมัน สเก็ตช์..." },
  "home.tool.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "home.tool.editorDesc": { en: "Advanced editing: layers, filters, masks, blend modes.", vi: "Chỉnh sửa nâng cao: layers, filters, masks, blend modes.", id: "Pengeditan lanjutan: lapisan, filter, masker, mode campuran.", ru: "Слои, фильтры, маски, режимы смешивания.", th: "ชั้น ตัวกรอง มาสก์ โหมดผสม" },
  "home.tool.editorDetail": { en: "Full-featured editor", vi: "Full-featured editor", id: "Editor fitur lengkap", ru: "Полнофункциональный редактор", th: "ตัวแก้ไขฟีเจอร์ครบครัน" },
  "home.tool.enhance": { en: "Enhance Image", vi: "Tăng cường ảnh", id: "Tingkatkan Gambar", ru: "Улучшение изображения", th: "ปรับปรุงรูปภาพ" },
  "home.tool.enhanceDesc": { en: "Improve quality, color, contrast.", vi: "Cải thiện chất lượng, màu sắc, độ tương phản.", id: "Tingkatkan kualitas, warna, kontras.", ru: "Улучшите качество, цвет, контраст.", th: "ปรับปรุงคุณภาพ สี ความคมชัด" },
  "home.tool.enhanceDetail": { en: "Automatic optimization for best results.", vi: "Tối ưu hóa tự động cho kết quả tốt nhất.", id: "Optimasi otomatis untuk hasil terbaik.", ru: "Автоматическая оптимизация.", th: "การเพิ่มประสิทธิภาพอัตโนมัติ" },
  "home.tool.enhanceFace": { en: "Enhance Face", vi: "Nâng cấp khuôn mặt", id: "Tingkatkan Wajah", ru: "Улучшение лица", th: "ปรับปรุงใบหน้า" },
  "home.tool.enhanceFaceDesc": { en: "Improve facial detail, sharpen features.", vi: "Cải thiện chi tiết khuôn mặt, làm rõ nét.", id: "Tingkatkan detail wajah, pertajam fitur.", ru: "Улучшите детали лица.", th: "ปรับปรุงรายละเอียดใบหน้า" },
  "home.tool.enhanceFaceDetail": { en: "Automatic skin smoothing, eye detail boost.", vi: "Tự động làm mịn da, tăng chi tiết mắt.", id: "Penghalusan kulit otomatis, peningkatan detail mata.", ru: "Автоматическое сглаживание кожи.", th: "ปรับผิวให้เรียบเนียนอัตโนมัติ" },
  "home.tool.framesToMedia": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video", id: "Gambar → GIF / Video", ru: "Изображения → GIF / Видео", th: "รูปภาพ → GIF / วิดีโอ" },
  "home.tool.framesToMediaDesc": { en: "Convert Video → GIF, GIF → Video, or combine images into GIF/WebM.", vi: "Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM.", id: "Konversi Video → GIF, GIF → Video, atau gabungkan gambar menjadi GIF/WebM.", ru: "Конвертируйте Видео → GIF, GIF → Видео.", th: "แปลงวิดีโอ → GIF, GIF → วิดีโอ" },
  "home.tool.framesToMediaDetail": { en: "GIF & WebM", vi: "GIF & WebM", id: "GIF & WebM", ru: "GIF и WebM", th: "GIF และ WebM" },
  "home.tool.gifSimplify": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video", id: "Sederhanakan GIF / Percepat video", ru: "Упрощение GIF / Ускорение видео", th: "ทำให้ GIF ง่ายขึ้น / เร่งวิดีโอ" },
  "home.tool.gifSimplifyDesc": { en: "Skip frames to make GIF lighter and videos play faster.", vi: "Bỏ xen kẽ frame để GIF nhẹ hơn, video chạy nhanh hơn.", id: "Lewati bingkai untuk membuat GIF lebih ringan dan video diputar lebih cepat.", ru: "Пропускайте кадры для облегчения GIF.", th: "ข้ามเฟรมเพื่อทำให้ GIF เบากว่า" },
  "home.tool.gifSimplifyDetail": { en: "Reduce x2, x3...", vi: "Giảm x2, x3...", id: "Kurangi x2, x3...", ru: "Уменьшение x2, x3...", th: "ลด x2, x3..." },
  "home.tool.hd": { en: "HD Editor", vi: "HD Editor", id: "Editor HD", ru: "HD-редактор", th: "ตัวแก้ไข HD" },
  "home.tool.hdDesc": { en: "Edit HD photos with professional tools.", vi: "Chỉnh sửa ảnh HD với công cụ chuyên nghiệp.", id: "Edit foto HD dengan alat profesional.", ru: "Редактируйте HD-фото.", th: "แก้ไขรูปถ่าย HD" },
  "home.tool.hdDetail": { en: "No quality loss, high resolution support.", vi: "Không giảm chất lượng, hỗ trợ độ phân giải cao.", id: "Tanpa kehilangan kualitas, dukungan resolusi tinggi.", ru: "Без потери качества.", th: "ไม่สูญเสียคุณภาพ" },
  "home.tool.magicEdit": { en: "AI Magic Edit", vi: "Chỉnh sửa ma thuật AI", id: "Edit Ajaib AI", ru: "AI-магическое редактирование", th: "แก้ไขวิเศษด้วย AI" },
  "home.tool.magicEditDesc": { en: "Replace objects, add detail, fix mistakes with AI.", vi: "Thay thế đối tượng, thêm chi tiết, sửa lỗi bằng AI.", id: "Ganti objek, tambah detail, perbaiki kesalahan dengan AI.", ru: "Заменяйте объекты, добавляйте детали с AI.", th: "แทนที่วัตถุ เพิ่มรายละเอียดด้วย AI" },
  "home.tool.magicEditDetail": { en: "Describe the change and AI will do it.", vi: "Mô tả thay đổi và AI sẽ thực hiện.", id: "Jelaskan perubahan dan AI akan melakukannya.", ru: "Опишите изменение, AI выполнит.", th: "อธิบายการเปลี่ยนแปลง AI จะทำให้" },
  "home.tool.mediaToFrames": { en: "GIF / Video → Images", vi: "Tách GIF / Video → Ảnh", id: "GIF / Video → Gambar", ru: "GIF / Видео → Изображения", th: "GIF / วิดีโอ → รูปภาพ" },
  "home.tool.mediaToFramesDesc": { en: "Extract every frame of a GIF or Video into separate images.", vi: "Tách từng frame của GIF hoặc Video thành ảnh riêng biệt.", id: "Ekstrak setiap bingkai GIF atau Video menjadi gambar terpisah.", ru: "Извлеките каждый кадр GIF или Видео.", th: "แยกเฟรมของ GIF หรือวิดีโอทุกเฟรม" },
  "home.tool.mediaToFramesDetail": { en: "Extract frames", vi: "Extract frames", id: "Ekstrak bingkai", ru: "Извлечение кадров", th: "แยกเฟรม" },
  "home.tool.removeBG": { en: "Remove Background", vi: "Xóa nền", id: "Hapus Latar", ru: "Удаление фона", th: "ลบพื้นหลัง" },
  "home.tool.removeBGAdvanced": { en: "Advanced Background Removal", vi: "Xóa nền nâng cao", id: "Penghapusan Latar Lanjutan", ru: "Продвинутое удаление фона", th: "ลบพื้นหลังขั้นสูง" },
  "home.tool.removeBGAdvancedDesc": { en: "Remove backgrounds with high accuracy, separate complex detail.", vi: "Xóa nền với độ chính xác cao, tách chi tiết phức tạp.", id: "Hapus latar dengan akurasi tinggi, pisahkan detail kompleks.", ru: "Удаляйте фон с высокой точностью.", th: "ลบพื้นหลังด้วยความแม่นยำสูง" },
  "home.tool.removeBGAdvancedDetail": { en: "Separate hair, feathers, thin detail perfectly.", vi: "Tách tóc, lông vũ, chi tiết mỏng một cách hoàn hảo.", id: "Pisahkan rambut, bulu, detail tipis dengan sempurna.", ru: "Отделяйте волосы, перья идеально.", th: "แยกเส้นขน ขนนกได้อย่างสมบูรณ์แบบ" },
  "home.tool.removeBGDesc": { en: "Separate subject from image background.", vi: "Tách chủ thể ra khỏi nền ảnh.", id: "Pisahkan subjek dari latar gambar.", ru: "Отделяйте объект от фона.", th: "แยกวัตถุออกจากพื้นหลัง" },
  "home.tool.removeBGDetail": { en: "High accuracy, preserves fine detail.", vi: "Độ chính xác cao, giữ lại chi tiết tinh tế.", id: "Akurasi tinggi, mempertahankan detail halus.", ru: "Высокая точность.", th: "ความแม่นยำสูง" },
  "home.tool.removeLetter": { en: "Advanced Text Removal", vi: "Xóa chữ nâng cao", id: "Penghapusan Teks Lanjutan", ru: "Продвинутое удаление текста", th: "ลบข้อความขั้นสูง" },
  "home.tool.removeLetterDesc": { en: "Remove text from images, restore background detail.", vi: "Xóa chữ khỏi ảnh, phục hồi lại chi tiết nền.", id: "Hapus teks dari gambar, pulihkan detail latar.", ru: "Удаляйте текст, восстанавливайте фон.", th: "ลบข้อความ กู้คืนพื้นหลัง" },
  "home.tool.removeLetterDetail": { en: "AI analyzes background structure to reconstruct accurately.", vi: "AI phân tích cấu trúc nền để tái tạo chính xác.", id: "AI menganalisis struktur latar untuk merekonstruksi secara akurat.", ru: "AI анализирует структуру фона.", th: "AI วิเคราะห์โครงสร้างพื้นหลัง" },
  "home.tool.removeText": { en: "Remove Text", vi: "Xóa chữ", id: "Hapus Teks", ru: "Удаление текста", th: "ลบข้อความ" },
  "home.tool.removeTextDesc": { en: "Remove text from images, replace with AI content.", vi: "Xóa chữ khỏi ảnh, thay thế bằng nội dung AI.", id: "Hapus teks dari gambar, ganti dengan konten AI.", ru: "Удаляйте текст, заменяйте AI-содержимым.", th: "ลบข้อความ แทนที่ด้วยเนื้อหา AI" },
  "home.tool.removeTextDetail": { en: "Preserves background and surrounding context.", vi: "Giữ nguyên nền và context xung quanh.", id: "Pertahankan latar dan konteks sekitarnya.", ru: "Сохраняет фон и контекст.", th: "รักษาพื้นหลังและบริบท" },
  "home.tool.removebgVideo": { en: "Video Background Removal", vi: "Xóa nền Video", id: "Penghapusan Latar Video", ru: "Удаление фона видео", th: "ลบพื้นหลังวิดีโอ" },
  "home.tool.repair": { en: "AI Repair", vi: "Sửa ảnh AI", id: "Perbaikan AI", ru: "AI-восстановление", th: "ซ่อมแซมด้วย AI" },
  "home.tool.repairDesc": { en: "Restore old, damaged or blurry photos.", vi: "Phục hồi ảnh cũ, hư hỏng hoặc mờ.", id: "Pulihkan foto lama, rusak, atau buram.", ru: "Восстанавливайте старые фото.", th: "กู้คืนรูปถ่ายเก่า" },
  "home.tool.repairDetail": { en: "Automatically fix defects and restore detail.", vi: "Tự động sửa lỗi và khôi phục chi tiết.", id: "Perbaiki cacat dan pulihkan detail secara otomatis.", ru: "Автоматическое исправление дефектов.", th: "แก้ไขข้อบกพร่องอัตโนมัติ" },
  "home.tool.resize": { en: "Resize Image", vi: "Resize ảnh", id: "Ubah Ukuran Gambar", ru: "Изменение размера", th: "เปลี่ยนขนาด" },
  "home.tool.resizeDesc": { en: "Resize freely, by ratio or popular presets.", vi: "Thay đổi kích thước tự do, theo tỉ lệ hoặc preset phổ biến.", id: "Ubah ukuran bebas, berdasarkan rasio atau prasetel populer.", ru: "Свободно изменяйте размер.", th: "เปลี่ยนขนาดอิสระ" },
  "home.tool.resizeDetail": { en: "Keep aspect ratio", vi: "Giữ tỉ lệ khung hình", id: "Pertahankan rasio aspek", ru: "Сохранение пропорций", th: "รักษาสัดส่วนภาพ" },
  "home.tool.restore": { en: "Restore Old Photos", vi: "Khôi phục ảnh cũ", id: "Pulihkan Foto Lama", ru: "Восстановление старых фото", th: "กู้คืนรูปถ่ายเก่า" },
  "home.tool.restoreColor": { en: "Restore Color", vi: "Phục hồi màu", id: "Pulihkan Warna", ru: "Восстановление цвета", th: "กู้คืนสี" },
  "home.tool.restoreColorDesc": { en: "Colorize black and white photos with natural colors.", vi: "Tô màu cho ảnh đen trắng với màu sắc tự nhiên.", id: "Warnai foto hitam putih dengan warna alami.", ru: "Раскрашивайте чёрно-белые фото.", th: "ระบายสีรูปถ่ายขาวดำ" },
  "home.tool.restoreColorDetail": { en: "AI detects objects and colors accurately.", vi: "AI nhận diện vật thể và tô màu chính xác.", id: "AI mendeteksi objek dan warna secara akurat.", ru: "AI точно определяет объекты.", th: "AI ตรวจจับวัตถุได้อย่างแม่นยำ" },
  "home.tool.restoreDesc": { en: "Restore blurry, torn, faded photos.", vi: "Khôi phục ảnh bị mờ, rách, phai màu.", id: "Pulihkan foto buram, robek, pudar.", ru: "Восстанавливайте размытые фото.", th: "กู้คืนรูปถ่ายที่เบลอ" },
  "home.tool.restoreDetail": { en: "AI restores lost color and detail.", vi: "AI phục hồi màu sắc và chi tiết đã mất.", id: "AI memulihkan warna dan detail yang hilang.", ru: "AI восстанавливает цвет и детали.", th: "AI กู้คืนสีและรายละเอียด" },
  "home.tool.rotate": { en: "Rotate / Flip", vi: "Xoay / Lật", id: "Putar / Balik", ru: "Повернуть / Отразить", th: "หมุน / พลิก" },
  "home.tool.rotateDesc": { en: "Rotate at custom angles, flip horizontally and vertically in one click.", vi: "Xoay góc tùy chỉnh, lật ngang và dọc theo một cú click.", id: "Putar pada sudut kustom, balik horizontal dan vertikal dalam satu klik.", ru: "Поворачивайте и отражайте одним нажатием.", th: "หมุนและพลิกด้วยการคลิกเดียว" },
  "home.tool.rotateDetail": { en: "Flip horizontal & vertical", vi: "Lật ngang & dọc", id: "Balik horizontal & vertikal", ru: "Отражение горизонтально и вертикально", th: "พลิกแนวนอนและแนวตั้ง" },
  "home.tool.upScale": { en: "AI Upscale", vi: "Nâng cấp ảnh AI", id: "Peningkatan AI", ru: "AI-увеличение", th: "เพิ่มขนาดด้วย AI" },
  "home.tool.upScaleDesc": { en: "Enlarge images 2x, 4x, 8x without losing detail.", vi: "Tăng kích thước ảnh gấp 2, 4, 8 lần mà không mất chi tiết.", id: "Perbesar gambar 2x, 4x, 8x tanpa kehilangan detail.", ru: "Увеличивайте в 2, 4, 8 раз.", th: "เพิ่มขนาด 2, 4, 8 เท่า" },
  "home.tool.upScaleDetail": { en: "Automatic noise reduction.", vi: "Tự động loại bỏ nhiễu hạt (noise reduction).", id: "Pengurangan noise otomatis.", ru: "Автоматическое шумоподавление.", th: "ลดสัญญาณรบกวนอัตโนมัติ" },
  "home.tool.upscale4x": { en: "4x Upscale", vi: "Nâng cấp 4x", id: "Peningkatan 4x", ru: "Увеличение 4x", th: "เพิ่มขนาด 4 เท่า" },
  "home.tool.upscale4xDesc": { en: "Enlarge image 4 times.", vi: "Tăng kích thước ảnh gấp 4 lần.", id: "Perbesar gambar 4 kali.", ru: "Увеличьте в 4 раза.", th: "เพิ่มขนาด 4 เท่า" },
  "home.tool.upscale4xDetail": { en: "Keeps quality, sharp detail.", vi: "Giữ nguyên chất lượng, sắc nét từng chi tiết.", id: "Pertahankan kualitas, detail tajam.", ru: "Сохранение качества.", th: "รักษาคุณภาพ" },
  "home.tools.gridTitle": { en: "All tools", vi: "Tất cả công cụ", id: "Semua alat", ru: "Все инструменты", th: "เครื่องมือทั้งหมด" },
  "home.tools.subtitle": { en: "Hundreds of tools ready. Explore the real power of image editing.", vi: "Hàng trăm công cụ đã sẵn sàng. Hãy khám phá sức mạnh thực sự của việc chỉnh sửa ảnh.", id: "Ratusan alat siap. Jelajahi kekuatan nyata pengeditan gambar.", ru: "Сотни инструментов готовы.", th: "เครื่องมือหลายร้อยรายการพร้อมใช้งาน" },
  "home.tools.title": { en: "Full list", vi: "Danh sách đầy đủ", id: "Daftar lengkap", ru: "Полный список", th: "รายชื่อทั้งหมด" },
  "imagePreview.alt": { en: "Preview", vi: "Preview", id: "Pratinjau", ru: "Предпросмотр", th: "ตัวอย่าง" },
  "imagePreview.loading": { en: "Loading image...", vi: "Đang tải ảnh...", id: "Memuat gambar...", ru: "Загрузка изображения...", th: "กำลังโหลดรูปภาพ..." },
  "key": { en: "key", vi: "key", id: "kunci", ru: "клавиша", th: "ปุ่ม" },
  "keyboardShortcuts.emptyCategory": { en: "No shortcuts in this category.", vi: "Không có phím tắt trong danh mục này.", id: "Tidak ada pintasan dalam kategori ini.", ru: "Нет горячих клавиш в этой категории.", th: "ไม่มีทางลัดในหมวดนี้" },
  "label.animationPage": { en: "Page {0} / {1}", vi: "{0}/{1}", id: "Halaman {0} / {1}", ru: "Страница {0} / {1}", th: "หน้า {0} / {1}" },
  "label.bg": { en: "Background", vi: "Nền", id: "Latar", ru: "Фон", th: "พื้นหลัง" },
  "label.eraserSize": { en: "Eraser Size", vi: "Cỡ tẩy", id: "Ukuran Penghapus", ru: "Размер ластика", th: "ขนาดยางลบ" },
  "label.fps": { en: "fps", vi: "fps", id: "fps", ru: "кадр/с", th: "เฟรม/วินาที" },
  "label.gradDir": { en: "Direction", vi: "Hướng", id: "Arah", ru: "Направление", th: "ทิศทาง" },
  "label.height": { en: "Height", vi: "Height", id: "Tinggi", ru: "Высота", th: "สูง" },
  "label.limit": { en: "Limit:", vi: "Giới hạn:", id: "Batas:", ru: "Лимит:", th: "จำกัด:" },
  "label.lockRatio": { en: "Lock Ratio", vi: "Khóa tỷ lệ (Ratio)", id: "Kunci Rasio", ru: "Заблокировать пропорции", th: "ล็อกสัดส่วน" },
  "label.outlineThick": { en: "Thickness:", vi: "Độ dày viền", id: "Ketebalan:", ru: "Толщина:", th: "ความหนา:" },
  "label.pencilSize": { en: "Pencil Size", vi: "Cỡ bút", id: "Ukuran Pensil", ru: "Размер карандаша", th: "ขนาดดินสอ" },
  "label.presets": { en: "Presets", vi: "Tỷ lệ (Presets)", id: "Pratetap", ru: "Пресеты", th: "พรีเซ็ต" },
  "label.rotateOptions": { en: "Rotate Options", vi: "Tùy chọn xoay", id: "Opsi Putar", ru: "Параметры поворота", th: "ตัวเลือกการหมุน" },
  "label.rulerOptions": { en: "Ruler Options", vi: "Tùy chọn thước", id: "Opsi Penggaris", ru: "Параметры линейки", th: "ตัวเลือกไม้บรรทัด" },
  "label.shapeCircle": { en: "Circle", vi: "Tròn (Circle)", id: "Lingkaran", ru: "Круг", th: "วงกลม" },
  "label.shapeSquare": { en: "Square", vi: "Vuông (Square)", id: "Persegi", ru: "Квадрат", th: "สี่เหลี่ยมจัตุรัส" },
  "label.shapeThick": { en: "Thickness:", vi: "Độ dày:", id: "Ketebalan:", ru: "Толщина:", th: "ความหนา:" },
  "label.sourceImage": { en: "Source Image", vi: "Ảnh gốc", id: "Gambar Sumber", ru: "Исходное изображение", th: "รูปภาพต้นฉบับ" },
  "label.speed": { en: "Speed: ", vi: "Tốc độ: ", id: "Kecepatan: ", ru: "Скорость: ", th: "ความเร็ว: " },
  "label.sprayDensity": { en: "Density", vi: "Mật độ", id: "Kepadatan", ru: "Плотность", th: "ความหนาแน่น" },
  "label.spraySize": { en: "Size", vi: "Kích thước", id: "Ukuran", ru: "Размер", th: "ขนาด" },
  "label.width": { en: "Width", vi: "Width", id: "Lebar", ru: "Ширина", th: "กว้าง" },
  "layer.add": { en: "Add Layer", vi: "Thêm Lớp", id: "Tambah Lapisan", ru: "Добавить слой", th: "เพิ่มชั้น" },
  "layer.moveDown": { en: "Move Layer Down", vi: "Xuống dưới", id: "Pindahkan Lapisan ke Bawah", ru: "Переместить слой вниз", th: "เลื่อนชั้นลง" },
  "layer.moveUp": { en: "Move Layer Up", vi: "Lên trên", id: "Pindahkan Lapisan ke Atas", ru: "Переместить слой вверх", th: "เลื่อนชั้นขึ้น" },
  "layer.remove": { en: "Remove Layer", vi: "Xóa lớp", id: "Hapus Lapisan", ru: "Удалить слой", th: "ลบชั้น" },
  "layer.title": { en: "Layers", vi: "Lớp (Layers)", id: "Lapisan", ru: "Слои", th: "ชั้น" },
  "layerControl.settings": { en: "Layer Settings", vi: "Cài đặt Layer", id: "Pengaturan Lapisan", ru: "Настройки слоя", th: "ตั้งค่าชั้น" },
  "local.errListFiles": { en: "Failed to list local files:", vi: "Lỗi khi đọc danh sách file:", id: "Gagal membuat daftar file lokal:", ru: "Не удалось получить список файлов:", th: "ไม่สามารถแสดงรายการไฟล์ได้:" },
  "local.errNoDir": { en: "No working directory selected.", vi: "Chưa chọn thư mục làm việc.", id: "Tidak ada direktori kerja yang dipilih.", ru: "Рабочая папка не выбрана.", th: "ยังไม่ได้เลือกโฟลเดอร์ทำงาน" },
  "local.errNoReadPerm": { en: "No read permission. Please grant permission again.", vi: "Không có quyền đọc file. Vui lòng cấp quyền lại.", id: "Tidak ada izin membaca. Silakan beri izin lagi.", ru: "Нет прав на чтение. Пожалуйста, предоставьте разрешение.", th: "ไม่มีสิทธิ์อ่าน กรุณาให้สิทธิ์อีกครั้ง" },
  "local.errNoWritePerm": { en: "No write permission. Please grant permission in the browser.", vi: "Không có quyền ghi vào thư mục. Vui lòng cấp quyền trong trình duyệt.", id: "Tidak ada izin menulis. Silakan beri izin di browser.", ru: "Нет прав на запись. Пожалуйста, предоставьте разрешение в браузере.", th: "ไม่มีสิทธิ์เขียน กรุณาให้สิทธิ์ในเบราว์เซอร์" },
  "local.errNotSupported": { en: "Browser doesn't support File System Access API. Please use a Chromium-based browser.", vi: "Trình duyệt không hỗ trợ chọn thư mục (File System Access API).", id: "Browser tidak mendukung File System Access API. Silakan gunakan browser berbasis Chromium.", ru: "Браузер не поддерживает File System Access API. Используйте браузер на основе Chromium.", th: "เบราว์เซอร์ไม่รองรับ File System Access API กรุณาใช้เบราว์เซอร์ที่ใช้ Chromium" },
  "local.errPickDir": { en: "Failed to pick directory:", vi: "Lỗi khi chọn thư mục:", id: "Gagal memilih direktori:", ru: "Не удалось выбрать директорию:", th: "ไม่สามารถเลือกไดเรกทอรีได้:" },
  "local.imageOpened": { en: "Opened image: {0}", vi: "Đã mở ảnh: {0}", id: "Gambar dibuka: {0}", ru: "Открыто изображение: {0}", th: "เปิดรูปภาพ: {0}" },
  "local.noFilesFound": { en: "No images or projects found in Local Directory", vi: "Không tìm thấy ảnh hoặc project nào trong Thư mục cục bộ", id: "Tidak ada gambar atau proyek ditemukan di Direktori Lokal", ru: "Изображения или проекты не найдены в локальной директории", th: "ไม่พบรูปภาพหรือโปรเจกต์ในไดเรกทอรีท้องถิ่น" },
  "local.projectOpened": { en: "Opened project: {0}", vi: "Đã mở dự án: {0}", id: "Proyek dibuka: {0}", ru: "Открыт проект: {0}", th: "เปิดโปรเจกต์: {0}" },
  "magicEraser.tolerance": { en: "Tolerance", vi: "Độ sai lệch màu (Tolerance)", id: "Toleransi", ru: "Допуск", th: "ค่าความทนทาน" },
  "main.localSaveFallback": { en: "Local drive save failed, falling back to download", vi: "Lưu vào ổ cục bộ thất bại, chuyển sang tải xuống", id: "Penyimpanan drive lokal gagal, beralih ke unduhan", ru: "Не удалось сохранить на локальный диск, переход к скачиванию", th: "ไม่สามารถบันทึกลงดิสก์ท้องถิ่นได้ เปลี่ยนเป็นดาวน์โหลด" },
  "mcpFirebase.connected": { en: "Status: MCP Connected", vi: "Trạng thái: đã kết nối mcp", id: "Status: MCP Terhubung", ru: "Статус: MCP подключён", th: "สถานะ: MCP เชื่อมต่อแล้ว" },
  "mcpFirebase.spriteTooLarge": { en: "Sprite/data too large (max 256×256)", vi: "Sprite/dữ liệu quá lớn (tối đa 256×256)", id: "Sprite/data terlalu besar (maks 256×256)", ru: "Спрайт/данные слишком большие (макс. 256×256)", th: "สไปรต์/ข้อมูลมีขนาดใหญ่เกินไป (สูงสุด 256×256)" },
  "mcpFirebase.statusTitle": { en: "MCP Status", vi: "Trạng thái MCP", id: "Status MCP", ru: "Статус MCP", th: "สถานะ MCP" },
  "mcpFirebase.waiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối...", id: "Menunggu koneksi...", ru: "Ожидание подключения...", th: "รอการเชื่อมต่อ..." },
  "mediaToFrames.badge": { en: "Extract GIF / Video to images", vi: "Tách GIF / Video thành ảnh", id: "Ekstrak GIF / Video menjadi gambar", ru: "Извлечь GIF / Видео в изображения", th: "แยก GIF / วิดีโอเป็นรูปภาพ" },
  "mediaToFrames.changeFile": { en: "Change file", vi: "Đổi file", id: "Ganti file", ru: "Сменить файл", th: "เปลี่ยนไฟล์" },
  "mediaToFrames.desc": { en: "Upload a GIF or Video file. Frames are displayed progressively as they are extracted — no waiting. Download individual images or the whole ZIP.", vi: "Upload file GIF hoặc Video. Các frame được hiển thị dần ngay khi tách xong — không cần đợi. Tải về từng ảnh hoặc cả ZIP.", id: "Unggah file GIF atau Video. Bingkai ditampilkan secara progresif saat diekstrak — tanpa menunggu. Unduh gambar individual atau seluruh ZIP.", ru: "Загрузите файл GIF или Видео. Кадры отображаются по мере извлечения — без ожидания. Скачайте отдельные изображения или весь ZIP.", th: "อัปโหลดไฟล์ GIF หรือวิดีโอ เฟรมจะแสดงตามลำดับเมื่อแยกเสร็จ — ไม่ต้องรอ ดาวน์โหลดรูปภาพแต่ละรายการหรือทั้ง ZIP" },
  "mediaToFrames.downloadImage": { en: "Download image", vi: "Tải ảnh", id: "Unduh gambar", ru: "Скачать изображение", th: "ดาวน์โหลดรูปภาพ" },
  "mediaToFrames.downloadZip": { en: "Download ZIP ({0} images)", vi: "Tải ZIP ({0} ảnh)", id: "Unduh ZIP ({0} gambar)", ru: "Скачать ZIP ({0} изображений)", th: "ดาวน์โหลด ZIP ({0} รูปภาพ)" },
  "mediaToFrames.drop.button": { en: "Choose file", vi: "Chọn file", id: "Pilih file", ru: "Выбрать файл", th: "เลือกไฟล์" },
  "mediaToFrames.drop.support": { en: "Supported: GIF · MP4 · WebM · MOV", vi: "Hỗ trợ: GIF · MP4 · WebM · MOV", id: "Didukung: GIF · MP4 · WebM · MOV", ru: "Поддерживается: GIF · MP4 · WebM · MOV", th: "รองรับ: GIF · MP4 · WebM · MOV" },
  "mediaToFrames.drop.title": { en: "Drag & drop GIF or Video here", vi: "Kéo thả GIF hoặc Video vào đây", id: "Seret & lepas GIF atau Video di sini", ru: "Перетащите GIF или Видео сюда", th: "ลากและวาง GIF หรือวิดีโอที่นี่" },
  "mediaToFrames.error.extract": { en: "Frame extraction error: {0}", vi: "Lỗi tách frame: {0}", id: "Kesalahan ekstraksi bingkai: {0}", ru: "Ошибка извлечения кадров: {0}", th: "ข้อผิดพลาดในการแยกเฟรม: {0}" },
  "mediaToFrames.error.onlyGifVideo": { en: "Only GIF or Video files (MP4, WebM, MOV) are supported.", vi: "Chỉ hỗ trợ file GIF hoặc Video (MP4, WebM, MOV).", id: "Hanya file GIF atau Video (MP4, WebM, MOV) yang didukung.", ru: "Поддерживаются только файлы GIF или Видео (MP4, WebM, MOV).", th: "รองรับเฉพาะไฟล์ GIF หรือวิดีโอ (MP4, WebM, MOV) เท่านั้น" },
  "mediaToFrames.error.readVideo": { en: "Cannot read video", vi: "Không thể đọc video", id: "Tidak dapat membaca video", ru: "Не удаётся прочитать видео", th: "ไม่สามารถอ่านวิดีโอได้" },
  "mediaToFrames.exportOptions": { en: "Export options", vi: "Tùy chọn xuất", id: "Opsi ekspor", ru: "Параметры экспорта", th: "ตัวเลือกส่งออก" },
  "mediaToFrames.extracting": { en: "Extracting frames...", vi: "Đang tách frame...", id: "Mengekstrak bingkai...", ru: "Извлечение кадров...", th: "กำลังแยกเฟรม..." },
  "mediaToFrames.extractingHint": { en: "(extracting...)", vi: "(đang tách...)", id: "(mengekstrak...)", ru: "(извлечение...)", th: "(กำลังแยก...)" },
  "mediaToFrames.fpsExtract": { en: "FPS extract", vi: "FPS extract", id: "Ekstrak FPS", ru: "FPS извлечения", th: "FPS การแยก" },
  "mediaToFrames.imageFormat": { en: "Image format", vi: "Định dạng ảnh", id: "Format gambar", ru: "Формат изображения", th: "รูปแบบรูปภาพ" },
  "mediaToFrames.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "mediaToFrames.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "mediaToFrames.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "mediaToFrames.quality": { en: "Quality", vi: "Chất lượng", id: "Kualitas", ru: "Качество", th: "คุณภาพ" },
  "mediaToFrames.reloadForFps": { en: "⚠️ Please reload the video file to apply the new FPS.", vi: "⚠️ Hãy tải lại file video để áp dụng FPS mới.", id: "⚠️ Silakan muat ulang file video untuk menerapkan FPS baru.", ru: "⚠️ Пожалуйста, перезагрузите видеофайл для применения нового FPS.", th: "⚠️ กรุณาโหลดไฟล์วิดีโอใหม่เพื่อใช้ FPS ใหม่" },
  "mediaToFrames.selectAll": { en: "Select all", vi: "Chọn tất cả", id: "Pilih semua", ru: "Выбрать всё", th: "เลือกทั้งหมด" },
  "mediaToFrames.selectNone": { en: "Deselect all", vi: "Bỏ chọn", id: "Batalkan semua", ru: "Снять выделение", th: "ยกเลิกการเลือก" },
  "mediaToFrames.selected": { en: "Selected", vi: "Đã chọn", id: "Dipilih", ru: "Выбрано", th: "เลือกแล้ว" },
  "mediaToFrames.seo.desc": { en: "Extract every frame of a GIF or Video (MP4, WebM) into separate images. Displayed progressively, download as ZIP. Fully processed locally in your browser.", vi: "Tách từng frame của GIF hoặc Video (MP4, WebM) thành ảnh riêng biệt. Hiển thị dần dần, tải về ZIP. Hoàn toàn xử lý cục bộ trên trình duyệt.", id: "Ekstrak setiap bingkai GIF atau Video (MP4, WebM) menjadi gambar terpisah. Ditampilkan progresif, unduh sebagai ZIP. Sepenuhnya diproses lokal di browser Anda.", ru: "Извлеките каждый кадр GIF или Видео (MP4, WebM) в отдельные изображения. Отображается постепенно, скачивается ZIP. Полностью обрабатывается локально в вашем браузере.", th: "แยกเฟรมของ GIF หรือวิดีโอ (MP4, WebM) ทุกเฟรมเป็นรูปภาพแยก แสดงแบบค่อยเป็นค่อยไป ดาวน์โหลดเป็น ZIP ประมวลผลทั้งหมดในเบราว์เซอร์ของคุณ" },
  "mediaToFrames.seo.title": { en: "Extract GIF / Video to images | Pixel Normal Edit", vi: "Tách GIF / Video thành ảnh | Pixel Normal Edit", id: "Ekstrak GIF / Video menjadi gambar | Pixel Normal Edit", ru: "Извлечение GIF / Видео в изображения | Pixel Normal Edit", th: "แยก GIF / วิดีโอเป็นรูปภาพ | Pixel Normal Edit" },
  "mediaToFrames.status.compressingZip": { en: "Compressing ZIP...", vi: "Đang nén ZIP...", id: "Mengompresi ZIP...", ru: "Сжатие ZIP...", th: "กำลังบีบอัด ZIP..." },
  "mediaToFrames.status.creatingZip": { en: "Creating ZIP...", vi: "Đang tạo ZIP...", id: "Membuat ZIP...", ru: "Создание ZIP...", th: "กำลังสร้าง ZIP..." },
  "mediaToFrames.status.decodingGif": { en: "Decoding GIF...", vi: "Đang giải mã GIF...", id: "Mendekode GIF...", ru: "Декодирование GIF...", th: "กำลังถอดรหัส GIF..." },
  "mediaToFrames.title": { en: "Extract every frame of GIF & Video", vi: "Extract từng frame của GIF & Video", id: "Ekstrak setiap bingkai GIF & Video", ru: "Извлечение каждого кадра GIF и Видео", th: "แยกทุกเฟรมของ GIF และวิดีโอ" },
  "mediaToFrames.videoEstimate": { en: "Video 30s × {0}fps ≈ {1} images", vi: "Video 30s × {0}fps ≈ {1} ảnh", id: "Video 30s × {0}fps ≈ {1} gambar", ru: "Видео 30с × {0}fps ≈ {1} изображений", th: "วิดีโอ 30 วินาที × {0}fps ≈ {1} รูปภาพ" },
  "mediaToFrames.videoFps": { en: "Video: frames per second to extract", vi: "Video: Số frame/giây cần tách", id: "Video: bingkai per detik untuk diekstrak", ru: "Видео: кадров в секунду для извлечения", th: "วิดีโอ: เฟรมต่อวินาทีสำหรับแยก" },
  "mini_tools.compress.title": { en: "Compress Image", vi: "Nén ảnh", id: "Kompres Gambar", ru: "Сжатие изображения", th: "บีบอัดรูปภาพ" },
  "mini_tools.convert.title": { en: "Convert Image", vi: "Convert ảnh", id: "Konversi Gambar", ru: "Конвертировать изображение", th: "แปลงรูปภาพ" },
  "mini_tools.crop.title": { en: "Crop Image", vi: "Crop ảnh", id: "Pangkas Gambar", ru: "Обрезка изображения", th: "ตัดรูปภาพ" },
  "mini_tools.related.label": { en: "Explore", vi: "Khám phá", id: "Jelajahi", ru: "Исследовать", th: "สำรวจ" },
  "mini_tools.related.title": { en: "Other tools you may like:", vi: "Các công cụ khác có thể bạn quan tâm:", id: "Alat lain yang mungkin Anda suka:", ru: "Другие инструменты, которые могут понравиться:", th: "เครื่องมืออื่นๆ ที่คุณอาจสนใจ:" },
  "mini_tools.resize.title": { en: "Resize Image", vi: "Resize ảnh", id: "Ubah Ukuran Gambar", ru: "Изменение размера", th: "เปลี่ยนขนาดรูปภาพ" },
  "mini_tools.rotate.title": { en: "Rotate/Flip", vi: "Xoay/lật ảnh", id: "Putar/Balik", ru: "Повернуть/Отразить", th: "หมุน/พลิก" },
  "modal.advanced": { en: "Advanced", vi: "Nâng cao", id: "Lanjutan", ru: "Расширенный", th: "ขั้นสูง" },
  "modal.autoSize": { en: "Auto-resize canvas to match image", vi: "Tự động đổi kích thước khung theo ảnh tải lên", id: "Ubah ukuran kanvas otomatis agar sesuai gambar", ru: "Автоматически изменять размер холста под изображение", th: "เปลี่ยนขนาดผืนผ้าใบอัตโนมัติตามรูปภาพ" },
  "modal.browseDrive": { en: "Browse Google Drive", vi: "Duyệt Google Drive", id: "Jelajahi Google Drive", ru: "Обзор Google Drive", th: "เรียกดู Google Drive" },
  "modal.browseFile": { en: "Browse File", vi: "Chọn File", id: "Jelajahi File", ru: "Обзор файла", th: "เรียกดูไฟล์" },
  "modal.clickToSelect": { en: "or click to select file from computer", vi: "hoặc nhấp để chọn file từ máy tính", id: "atau klik untuk memilih file dari komputer", ru: "или нажмите для выбора файла", th: "หรือคลิกเพื่อเลือกไฟล์" },
  "modal.displayFormat": { en: "Display Format", vi: "Định dạng hiển thị", id: "Format Tampilan", ru: "Формат отображения", th: "รูปแบบการแสดงผล" },
  "modal.downloadDesc": { en: "Choose how you want to export your artwork", vi: "Chọn cách bạn muốn xuất tác phẩm", id: "Pilih cara Anda ingin mengekspor karya seni", ru: "Выберите способ экспорта вашего арта", th: "เลือกวิธีส่งออกผลงานของคุณ" },
  "modal.downloadTemplate": { en: "Download Template", vi: "Tải File Mẫu", id: "Unduh Template", ru: "Скачать шаблон", th: "ดาวน์โหลดเทมเพลต" },
  "modal.downloadTitle": { en: "Download File", vi: "Tải về máy", id: "Unduh File", ru: "Скачать файл", th: "ดาวน์โหลดไฟล์" },
  "modal.dropJson": { en: "Click or Drag & Drop .json (or .txt) file here", vi: "Click hoặc Kéo thả file .json (hoặc .txt) vào đây", id: "Klik atau Seret & Lepas file .json (atau .txt) di sini", ru: "Нажмите или перетащите файл .json (или .txt) сюда", th: "คลิกหรือลากและวางไฟล์ .json (หรือ .txt) ที่นี่" },
  "modal.filesInDrive": { en: "JSON files in Drive", vi: "Các file JSON trong Drive", id: "File JSON di Drive", ru: "JSON файлы в Drive", th: "ไฟล์ JSON ใน Drive" },
  "modal.filterAll": { en: "All", vi: "Tất cả", id: "Semua", ru: "Все", th: "ทั้งหมด" },
  "modal.filterImage": { en: "Image", vi: "Ảnh", id: "Gambar", ru: "Изображение", th: "รูปภาพ" },
  "modal.filterJson": { en: "JSON", vi: "JSON", id: "JSON", ru: "JSON", th: "JSON" },
  "modal.importMode": { en: "Import Mode:", vi: "Chế độ nhập ảnh:", id: "Mode Impor:", ru: "Режим импорта:", th: "โหมดนำเข้า:" },
  "modal.jsonPlaceholder": { en: "Paste JSON (or .txt content) here...", vi: "Dán mã JSON (hoặc nội dung file .txt) vào đây...", id: "Tempel JSON (atau konten .txt) di sini...", ru: "Вставьте JSON (или содержимое .txt) сюда...", th: "วาง JSON (หรือเนื้อหา .txt) ที่นี่..." },
  "modal.location": { en: "Location", vi: "Vị trí", id: "Lokasi", ru: "Расположение", th: "ตำแหน่ง" },
  "modal.modeAnimation": { en: "3. Open as Animation (Animation Frames)", vi: "3. Mở thành Ảnh động (Animation Frames)", id: "3. Buka sebagai Animasi (Bingkai Animasi)", ru: "3. Открыть как анимацию (кадры анимации)", th: "3. เปิดเป็นภาพเคลื่อนไหว (เฟรมภาพเคลื่อนไหว)" },
  "modal.modeCurrentTab": { en: "1. Overwrite Current Tab (1 file only)", vi: "1. Ghi đè Tab hiện tại (Chỉ 1 file)", id: "1. Timpa Tab Saat Ini (hanya 1 file)", ru: "1. Перезаписать текущую вкладку (только 1 файл)", th: "1. เขียนทับแท็บปัจจุบัน (1 ไฟล์เท่านั้น)" },
  "modal.modeIndex": { en: "Index (Index)", vi: "Chỉ mục (Index)", id: "Indeks (Index)", ru: "Индекс (Индекс)", th: "ดัชนี (Index)" },
  "modal.modeMultiTab": { en: "2. Open in New Tabs (Multi-Tab)", vi: "2. Mở vào nhiều Tabs mới (Multi-Tab)", id: "2. Buka di Tab Baru (Multi-Tab)", ru: "2. Открыть на новых вкладках (несколько вкладок)", th: "2. เปิดบนแท็บใหม่ (หลายแท็บ)" },
  "modal.modeXY": { en: "Coordinate (X, Y)", vi: "Toạ độ (X, Y)", id: "Koordinat (X, Y)", ru: "Координаты (X, Y)", th: "พิกัด (X, Y)" },
  "modal.parseJson": { en: "Parse JSON", vi: "Đọc JSON", id: "Parsing JSON", ru: "Прочитать JSON", th: "แยกวิเคราะห์ JSON" },
  "modal.recentLocalFiles": { en: "Recent Local Files", vi: "Các file gần đây", id: "File Lokal Terbaru", ru: "Недавние локальные файлы", th: "ไฟล์ท้องถิ่นล่าสุด" },
  "modal.settingsTitle": { en: "Global Settings", vi: "Cài đặt chung", id: "Pengaturan Global", ru: "Общие настройки", th: "ตั้งค่าทั่วไป" },
  "modal.sourceComputer": { en: "From computer", vi: "Từ máy tính", id: "Dari komputer", ru: "С компьютера", th: "จากคอมพิวเตอร์" },
  "modal.sourceDrive": { en: "From Google Drive", vi: "Từ Google Drive", id: "Dari Google Drive", ru: "Из Google Drive", th: "จาก Google Drive" },
  "modal.sourceJson": { en: "From JSON code", vi: "Từ mã JSON", id: "Dari kode JSON", ru: "Из кода JSON", th: "จากโค้ด JSON" },
  "modal.supportedFiles": { en: "Supported files", vi: "Các tệp được hỗ trợ", id: "File yang didukung", ru: "Поддерживаемые файлы", th: "ไฟล์ที่รองรับ" },
  "modal.tabAccount": { en: "Account", vi: "Tài khoản", id: "Akun", ru: "Аккаунт", th: "บัญชี" },
  "modal.tabAppearance": { en: "Appearance", vi: "Giao diện", id: "Tampilan", ru: "Внешний вид", th: "ลักษณะที่ปรากฏ" },
  "modal.tabComputer": { en: "Computer", vi: "Máy tính", id: "Komputer", ru: "Компьютер", th: "คอมพิวเตอร์" },
  "modal.tabDrawTools": { en: "Drawing Tools", vi: "Công cụ vẽ", id: "Alat Gambar", ru: "Инструменты рисования", th: "เครื่องมือวาด" },
  "modal.tabDrive": { en: "Google Drive", vi: "Google Drive", id: "Google Drive", ru: "Google Drive", th: "Google Drive" },
  "modal.tabEditTools": { en: "Transform", vi: "Thao tác", id: "Transformasi", ru: "Трансформация", th: "การแปลง" },
  "modal.tabImage": { en: "From Image", vi: "Từ Ảnh", id: "Dari Gambar", ru: "Из изображения", th: "จากรูปภาพ" },
  "modal.tabJson": { en: "From JSON", vi: "Từ JSON", id: "Dari JSON", ru: "Из JSON", th: "จาก JSON" },
  "modal.tabShortcuts": { en: "Shortcuts", vi: "Phím tắt", id: "Pintasan", ru: "Горячие клавиши", th: "ทางลัด" },
  "modal.uploadTitle": { en: "Upload / Open File", vi: "Tải lên / Mở file", id: "Unggah / Buka File", ru: "Загрузка / Открытие файла", th: "อัปโหลด / เปิดไฟล์" },
  "modal.uploadToDrive": { en: "Save to Google Drive", vi: "Lưu vào Google Drive", id: "Simpan ke Google Drive", ru: "Сохранить в Google Drive", th: "บันทึกลง Google Drive" },
  "modal.uploadToDriveDesc": { en: "Upload current file to Google Drive", vi: "Tải file đang mở hiện tại lên Google Drive", id: "Unggah file saat ini ke Google Drive", ru: "Загрузить текущий файл в Google Drive", th: "อัปโหลดไฟล์ปัจจุบันไปยัง Google Drive" },
  "mode.animation": { en: "Animation Mode", vi: "Animation", id: "Mode Animasi", ru: "Режим анимации", th: "โหมดภาพเคลื่อนไหว" },
  "mode.gradient": { en: "Gradient Mode", vi: "Gradient", id: "Mode Gradien", ru: "Режим градиента", th: "โหมดเกรเดียนต์" },
  "mode.grid": { en: "Show Grid", vi: "Lưới", id: "Tampilkan Kisi", ru: "Показать сетку", th: "แสดงตาราง" },
  "mode.mirror": { en: "Mirror Mode", vi: "Đối xứng", id: "Mode Cermin", ru: "Режим зеркала", th: "โหมดกระจก" },
  "mode.onionSkin": { en: "Onion Skin", vi: "Onion Skin", id: "Onion Skin", ru: "Полупрозрачный слой", th: "ชั้นโปร่งแสง" },
  "onboarding.buttons.back": { en: "Back", vi: "Quay lại", id: "Kembali", ru: "Назад", th: "ย้อนกลับ" },
  "onboarding.buttons.next": { en: "Next", vi: "Tiếp theo", id: "Berikutnya", ru: "Далее", th: "ถัดไป" },
  "onboarding.buttons.skip": { en: "Skip", vi: "Bỏ qua", id: "Lewati", ru: "Пропустить", th: "ข้าม" },
  "onboarding.phase0.description": { en: "Welcome & invitation to onboarding", vi: "Chào mừng & lời mời hướng dẫn", id: "Selamat datang & undangan onboarding", ru: "Приветствие и приглашение", th: "ยินดีต้อนรับและคำเชิญ" },
  "onboarding.phase0.name": { en: "Welcome", vi: "Chào mừng", id: "Selamat datang", ru: "Приветствие", th: "ยินดีต้อนรับ" },
  "onboarding.phase0.step000.body": { en: "Pixel Normal Edit is a pixel art editor and image tool that runs entirely in your browser. You can draw pixel art, convert/compress/resize/crop/rotate images, and split video/GIF into frames then reassemble into animation.", vi: "Pixel Normal Edit là công cụ chỉnh sửa ảnh pixel art và xử lý ảnh chạy ngay trên trình duyệt. Bạn có thể vẽ pixel art, chuyển đổi/nén/resize/crop/xoay ảnh, và tách video/GIF thành khung hình rồi ghép lại thành animation.", id: "Pixel Normal Edit adalah editor pixel art dan alat gambar yang berjalan sepenuhnya di browser Anda. Anda dapat menggambar pixel art, mengonversi/mengompresi/mengubah ukuran/memangkas/memutar gambar, dan memisahkan video/GIF menjadi bingkai lalu merakit kembali menjadi animasi.", ru: "Pixel Normal Edit — редактор пиксельной графики в браузере. Рисуйте, конвертируйте, сжимайте, обрезайте изображения.", th: "Pixel Normal Edit เป็นตัวแก้ไขพิกเซลอาร์ตในเบราว์เซอร์ วาด แปลง บีบอัด ตัดรูปภาพ" },
  "onboarding.phase0.step000.title": { en: "👋 Welcome to Pixel Normal Edit!", vi: "👋 Chào mừng bạn đến với Pixel Normal Edit!", id: "👋 Selamat datang di Pixel Normal Edit!", ru: "Добро пожаловать в Pixel Normal Edit!", th: "ยินดีต้อนรับสู่ Pixel Normal Edit!" },
  "onboarding.phase0.step001.body": { en: "We will walk you through each important area of the app using guide cards like this. Use Next to continue, Back to go back, Skip or Esc to exit anytime. The progress bar at the bottom shows where you are.", vi: "Chúng tôi sẽ dẫn bạn qua từng khu vực quan trọng của ứng dụng bằng các ô vuông hướng dẫn như thế này. Dùng Next để đi tiếp, Back để quay lại, Skip hoặc Esc để thoát bất cứ lúc nào. Thanh tiến trình ở dưới cùng cho biết bạn đang ở đâu.", id: "Kami akan memandu Anda melalui setiap area penting aplikasi menggunakan kartu panduan seperti ini. Gunakan Berikutnya untuk melanjutkan, Kembali untuk mundur, Lewati atau Esc untuk keluar kapan saja. Bilah kemajuan di bagian bawah menunjukkan posisi Anda.", ru: "Мы проведём вас по приложению. Используйте Далее, Назад, Пропустить или Esc.", th: "เราจะแนะนำคุณผ่านแอป ใช้ถัดไป ย้อนกลับ ข้าม หรือ Esc" },
  "onboarding.phase0.step001.title": { en: "🎯 Quick guide – 3 minutes", vi: "🎯 Hướng dẫn nhanh – 3 phút", id: "🎯 Panduan cepat – 3 menit", ru: "Быстрое руководство – 3 минуты", th: "คู่มือด่วน – 3 นาที" },
  "onboarding.welcome.desc": { en: "Pixel Normal Edit is a pixel art editor and image tool that runs entirely in your browser — no install, no upload to server. Everything happens on your device.", vi: "Pixel Normal Edit là công cụ chỉnh sửa ảnh pixel art và xử lý ảnh chạy ngay trên trình duyệt — không cần cài đặt, không cần tải file lên máy chủ. Mọi thứ diễn ra ngay trên thiết bị của bạn.", id: "Pixel Normal Edit adalah editor pixel art dan alat gambar yang berjalan sepenuhnya di browser Anda — tanpa instalasi, tanpa unggah ke server. Semuanya terjadi di perangkat Anda.", ru: "Pixel Normal Edit работает в браузере — без установки, без загрузки на сервер.", th: "Pixel Normal Edit ทำงานในเบราว์เซอร์ — ไม่ต้องติดตั้ง ไม่ต้องอัปโหลด" },
  "onboarding.welcome.feature1": { en: "Draw pixel art with a professional toolset", vi: "Vẽ pixel art với bộ công cụ chuyên nghiệp", id: "Gambar pixel art dengan perangkat profesional", ru: "Рисуйте пиксельную графику", th: "วาดพิกเซลอาร์ต" },
  "onboarding.welcome.feature2": { en: "Convert, compress, resize, crop, rotate images in a few clicks", vi: "Chuyển đổi, nén, resize, crop, xoay ảnh chỉ với vài cú click", id: "Konversi, kompres, ubah ukuran, pangkas, putar gambar dalam beberapa klik", ru: "Конвертируйте, сжимайте, обрезайте изображения", th: "แปลง บีบอัด ตัดรูปภาพ" },
  "onboarding.welcome.feature3": { en: "Split video/GIF into frames and reassemble into animation", vi: "Tách video/GIF thành từng khung hình và ghép lại thành animation", id: "Pisahkan video/GIF menjadi bingkai dan rakit kembali menjadi animasi", ru: "Разделяйте видео/GIF на кадры", th: "แยกวิดีโอ/GIF เป็นเฟรม" },
  "onboarding.welcome.optionGuide": { en: "I don't know yet – Guide me", vi: "Tôi chưa biết – Hướng dẫn tôi", id: "Saya belum tahu – Pandu saya", ru: "Я ещё не знаю — проведите меня", th: "ฉันยังไม่รู้ — แนะนำฉัน" },
  "onboarding.welcome.optionSkip": { en: "I already know – Skip", vi: "Tôi biết rồi – Bỏ qua", id: "Saya sudah tahu – Lewati", ru: "Я уже знаю — Пропустить", th: "ฉันรู้แล้ว — ข้าม" },
  "onboarding.welcome.question": { en: "Do you already know how to use Pixel Normal Edit?", vi: "Bạn đã biết sử dụng Pixel Normal Edit chưa?", id: "Apakah Anda sudah tahu cara menggunakan Pixel Normal Edit?", ru: "Вы уже знаете Pixel Normal Edit?", th: "คุณรู้จัก Pixel Normal Edit แล้วหรือยัง?" },
  "onboarding.welcome.sub": { en: "It only takes about 3 minutes to get familiar with everything. You can skip anytime with the Esc key.", vi: "Chỉ mất khoảng 3 phút để làm quen với mọi thứ. Bạn có thể bỏ qua bất cứ lúc nào bằng phím Esc.", id: "Hanya butuh sekitar 3 menit untuk terbiasa dengan semuanya. Anda dapat melewati kapan saja dengan tombol Esc.", ru: "Около 3 минут для знакомства. Пропустите клавишей Esc.", th: "ใช้เวลาประมาณ 3 นาที ข้ามด้วยปุ่ม Esc" },
  "onboarding.welcome.title": { en: "Welcome to Pixel Normal Edit!", vi: "Chào mừng bạn đến với Pixel Normal Edit!", id: "Selamat datang di Pixel Normal Edit!", ru: "Добро пожаловать в Pixel Normal Edit!", th: "ยินดีต้อนรับสู่ Pixel Normal Edit!" },
  "option.diagonal": { en: "Diagonal", vi: "Chéo", id: "Diagonal", ru: "Диагональ", th: "ทแยงมุม" },
  "option.horizontal": { en: "Horizontal", vi: "Ngang", id: "Horizontal", ru: "Горизонтально", th: "แนวนอน" },
  "option.radial": { en: "Radial", vi: "Xung quanh", id: "Radial", ru: "Радиально", th: "แบบรัศมี" },
  "option.rotatePixel": { en: "By Pixel", vi: "Theo Pixel", id: "Berdasarkan Piksel", ru: "По пикселям", th: "ตามพิกเซล" },
  "option.rotateSize": { en: "By Size", vi: "Theo kích thước", id: "Berdasarkan Ukuran", ru: "По размеру", th: "ตามขนาด" },
  "option.rulerDraw": { en: "Draw", vi: "Vẽ", id: "Gambar", ru: "Рисовать", th: "วาด" },
  "option.rulerMeasure": { en: "Measure", vi: "Đo đạc", id: "Ukur", ru: "Измерять", th: "วัด" },
  "option.vertical": { en: "Vertical", vi: "Dọc", id: "Vertikal", ru: "Вертикально", th: "แนวตั้ง" },
  "previewGroup.duplicateNotImpl": { en: "Not implemented: duplicatePreviewGroup", vi: "Chưa implement: duplicatePreviewGroup", id: "Belum diimplementasikan: duplicatePreviewGroup", ru: "Не реализовано: duplicatePreviewGroup", th: "ยังไม่รองรับ: duplicatePreviewGroup" },
  "previewGroup.reorderNotImpl": { en: "Not implemented: reorderPreviewImages", vi: "Chưa implement: reorderPreviewImages", id: "Belum diimplementasikan: reorderPreviewImages", ru: "Не реализовано: reorderPreviewImages", th: "ยังไม่รองรับ: reorderPreviewImages" },
  "previewGroup.transferNotImpl": { en: "Not implemented: transferToMainCanvas", vi: "Chưa implement: transferToMainCanvas", id: "Belum diimplementasikan: transferToMainCanvas", ru: "Не реализовано: transferToMainCanvas", th: "ยังไม่รองรับ: transferToMainCanvas" },
  "prompt.renameTab": { en: "Enter new tab name:", vi: "Nhập tên mới cho tab:", id: "Masukkan nama tab baru:", ru: "Введите новое имя вкладки:", th: "ป้อนชื่อแท็บใหม่:" },
  "registry.compress": { en: "Compress Image", vi: "Nén ảnh", id: "Kompres Gambar", ru: "Сжатие изображения", th: "บีบอัดรูปภาพ" },
  "registry.convert": { en: "Convert Image", vi: "Convert ảnh", id: "Konversi Gambar", ru: "Конвертировать изображение", th: "แปลงรูปภาพ" },
  "registry.crop": { en: "Crop Image", vi: "Crop ảnh", id: "Pangkas Gambar", ru: "Обрезка изображения", th: "ตัดรูปภาพ" },
  "registry.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "registry.framesToMedia": { en: "Images → GIF / Video", vi: "Ghép ảnh → GIF / Video", id: "Gambar → GIF / Video", ru: "Изображения → GIF / Видео", th: "รูปภาพ → GIF / วิดีโอ" },
  "registry.gifSimplify": { en: "Simplify GIF / Fast-forward video", vi: "Đơn giản GIF / Tua nhanh video", id: "Sederhanakan GIF / Percepat video", ru: "Упрощение GIF / Ускорение видео", th: "ทำให้ GIF ง่ายขึ้น / เร่งวิดีโอ" },
  "registry.mediaToFrames": { en: "GIF / Video → Images", vi: "Tách GIF / Video → Ảnh", id: "GIF / Video → Gambar", ru: "GIF / Видео → Изображения", th: "GIF / วิดีโอ → รูปภาพ" },
  "registry.resize": { en: "Resize Image", vi: "Resize ảnh", id: "Ubah Ukuran Gambar", ru: "Изменение размера", th: "เปลี่ยนขนาด" },
  "registry.rotate": { en: "Rotate / Flip", vi: "Xoay / Lật", id: "Putar / Balik", ru: "Повернуть / Отразить", th: "หมุน / พลิก" },
  "resize.title": { en: "Change dimensions", vi: "Thay đổi kích thước", id: "Ubah dimensi", ru: "Изменение размеров", th: "เปลี่ยนขนาด" },
  "resizeModal.clearImage": { en: "Clear current image", vi: "Xóa ảnh hiện tại", id: "Bersihkan gambar saat ini", ru: "Очистить текущее изображение", th: "ล้างรูปภาพปัจจุบัน" },
  "resizeModal.clearImageDesc": { en: "Clear all old images, create a completely blank canvas.", vi: "Xóa toàn bộ ảnh cũ, tạo canvas trắng hoàn toàn.", id: "Bersihkan semua gambar lama, buat kanvas kosong sepenuhnya.", ru: "Удалить все старые изображения, создать полностью чистый холст.", th: "ลบรูปภาพเก่าทั้งหมด สร้างผืนผ้าใบว่างเปล่า" },
  "resizeModal.keepImage": { en: "Keep original image", vi: "Giữ nguyên ảnh", id: "Pertahankan gambar asli", ru: "Сохранить исходное изображение", th: "เก็บรูปภาพต้นฉบับ" },
  "resizeModal.keepImageDesc": { en: "Keep original ratio, automatically crop or pad. (Will align in next step)", vi: "Giữ tỷ lệ gốc, tự động cắt hoặc bù thêm nền. (Sẽ căn chỉnh ở bước sau)", id: "Pertahankan rasio asli, potong atau pad otomatis. (Akan diselaraskan di langkah berikutnya)", ru: "Сохранить исходное соотношение сторон, автоматически обрезать или дополнить.", th: "รักษาสัดส่วนต้นฉบับ ตัดหรือเติมอัตโนมัติ" },
  "resizeModal.processStrategy": { en: "Processing Strategy", vi: "Thuật toán xử lý", id: "Strategi Pemrosesan", ru: "Стратегия обработки", th: "กลยุทธ์การประมวลผล" },
  "resizeModal.scaleImage": { en: "Scale image", vi: "Thu phóng ảnh", id: "Skalakan gambar", ru: "Масштабировать изображение", th: "ปรับขนาดรูปภาพ" },
  "resizeModal.scaleImageDesc": { en: "Stretch entire image to fit new size.", vi: "Co giãn toàn bộ hình ảnh vừa khít kích thước mới.", id: "Regangkan seluruh gambar agar sesuai ukuran baru.", ru: "Растянуть всё изображение под новый размер.", th: "ยืดรูปภาพทั้งหมดให้พอดีกับขนาดใหม่" },
  "resizePage.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "resizePage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)", id: "Mode Lanjutan (TIFF, HEIC, RAW...)", ru: "Расширенный режим (TIFF, HEIC, RAW...)", th: "โหมดขั้นสูง (TIFF, HEIC, RAW...)" },
  "resizePage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "resizePage.desc": { en: "Resize multiple images at once with the same dimensions. Export ZIP when multiple images are selected.", vi: "Resize nhiều ảnh cùng lúc với cùng một kích thước. Xuất file ZIP khi chọn nhiều ảnh.", id: "Ubah ukuran banyak gambar sekaligus dengan dimensi yang sama. Ekspor ZIP saat banyak gambar dipilih.", ru: "Измените размер нескольких изображений одновременно. Экспорт ZIP при выборе нескольких изображений.", th: "เปลี่ยนขนาดรูปภาพหลายไฟล์พร้อมกันด้วยขนาดเดียวกัน ส่งออก ZIP เมื่อเลือกรูปภาพหลายไฟล์" },
  "resizePage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về", id: "Opsi unduhan", ru: "Параметры скачивания", th: "ตัวเลือกการดาวน์โหลด" },
  "resizePage.drop.button": { en: "Choose images", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображения", th: "เลือกรูปภาพ" },
  "resizePage.drop.desc": { en: "Select multiple images at once to batch resize", vi: "Chọn nhiều ảnh cùng lúc để resize hàng loạt", id: "Pilih banyak gambar sekaligus untuk ubah ukuran batch", ru: "Выберите несколько изображений для пакетного изменения размера", th: "เลือกรูปภาพหลายไฟล์พร้อมกันเพื่อเปลี่ยนขนาดแบบกลุ่ม" },
  "resizePage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây", id: "Seret & lepas gambar di sini", ru: "Перетащите изображения сюда", th: "ลากและวางรูปภาพที่นี่" },
  "resizePage.error.resize": { en: "Resize error: {0}", vi: "Lỗi khi resize: {0}", id: "Kesalahan ubah ukuran: {0}", ru: "Ошибка изменения размера: {0}", th: "ข้อผิดพลาดในการเปลี่ยนขนาด: {0}" },
  "resizePage.fileList": { en: "Image list ({0})", vi: "Danh sách ảnh ({0})", id: "Daftar gambar ({0})", ru: "Список изображений ({0})", th: "รายการรูปภาพ ({0})" },
  "resizePage.height": { en: "Height (H)", vi: "Chiều Cao (H)", id: "Tinggi (H)", ru: "Высота (H)", th: "สูง (H)" },
  "resizePage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "resizePage.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "resizePage.preset": { en: "Standard size", vi: "Kích thước chuẩn", id: "Ukuran standar", ru: "Стандартный размер", th: "ขนาดมาตรฐาน" },
  "resizePage.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "resizePage.quality": { en: "Quality", vi: "Chất lượng", id: "Kualitas", ru: "Качество", th: "คุณภาพ" },
  "resizePage.resizeBtn": { en: "Resize {0} images → {1}×{2}", vi: "Resize {0} ảnh → {1}×{2}", id: "Ubah ukuran {0} gambar → {1}×{2}", ru: "Изменить размер {0} изображений → {1}×{2}", th: "เปลี่ยนขนาด {0} รูปภาพ → {1}×{2}" },
  "resizePage.title": { en: "Batch resize images", vi: "Đổi kích thước ảnh hàng loạt", id: "Ubah ukuran gambar batch", ru: "Пакетное изменение размера изображений", th: "เปลี่ยนขนาดรูปภาพแบบกลุ่ม" },
  "resizePage.width": { en: "Width (W)", vi: "Chiều Rộng (W)", id: "Lebar (W)", ru: "Ширина (W)", th: "กว้าง (W)" },
  "resizePopover.alignTitle": { en: "Alignment (Resize Preview)", vi: "Căn chỉnh (Resize Preview)", id: "Perataan (Pratinjau Resize)", ru: "Выравнивание (предпросмотр)", th: "การจัดตำแหน่ง (ตัวอย่าง)" },
  "resizePopover.anchor": { en: "Anchor:", vi: "Neo (Anchor):", id: "Jangkar:", ru: "Точка крепления:", th: "จุดยึด:" },
  "resizePopover.apply": { en: "Apply", vi: "Áp dụng", id: "Terapkan", ru: "Применить", th: "ใช้" },
  "resizePopover.cancel": { en: "Cancel", vi: "Hủy", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "resizePopover.fit": { en: "Fit", vi: "Fit", id: "Sesuaikan", ru: "Вписать", th: "พอดี" },
  "resizePopover.reset": { en: "Reset", vi: "Reset", id: "Reset", ru: "Сбросить", th: "รีเซ็ต" },
  "rotatePage.addMore": { en: "Add more images", vi: "Thêm ảnh", id: "Tambah gambar", ru: "Добавить ещё изображения", th: "เพิ่มรูปภาพอีก" },
  "rotatePage.advancedMode": { en: "Advanced Mode (TIFF, HEIC, RAW...)", vi: "Chế độ Nâng cao (TIFF, HEIC, RAW...)", id: "Mode Lanjutan (TIFF, HEIC, RAW...)", ru: "Расширенный режим (TIFF, HEIC, RAW...)", th: "โหมดขั้นสูง (TIFF, HEIC, RAW...)" },
  "rotatePage.applyBtn": { en: "Apply to {0} images", vi: "Áp dụng cho {0} ảnh", id: "Terapkan ke {0} gambar", ru: "Применить к {0} изображениям", th: "ใช้กับ {0} รูปภาพ" },
  "rotatePage.clearAll": { en: "Clear all", vi: "Xóa toàn bộ", id: "Bersihkan semua", ru: "Очистить всё", th: "ล้างทั้งหมด" },
  "rotatePage.desc": { en: "Rotate & flip multiple images at once with the same settings. Export ZIP when multiple images are selected.", vi: "Xoay & lật nhiều ảnh cùng lúc với cùng một thiết lập. Xuất file ZIP khi chọn nhiều ảnh.", id: "Putar & balik banyak gambar sekaligus dengan pengaturan yang sama. Ekspor ZIP saat banyak gambar dipilih.", ru: "Поверните и отразите несколько изображений одновременно. Экспорт ZIP при выборе нескольких изображений.", th: "หมุนและพลิกรูปภาพหลายไฟล์พร้อมกันด้วยการตั้งค่าเดียวกัน ส่งออก ZIP เมื่อเลือกรูปภาพหลายไฟล์" },
  "rotatePage.downloadOptions": { en: "Download options", vi: "Tùy chọn tải về", id: "Opsi unduhan", ru: "Параметры скачивания", th: "ตัวเลือกการดาวน์โหลด" },
  "rotatePage.drop.button": { en: "Choose images", vi: "Chọn ảnh", id: "Pilih gambar", ru: "Выбрать изображения", th: "เลือกรูปภาพ" },
  "rotatePage.drop.desc": { en: "Select multiple images at once to batch rotate", vi: "Chọn nhiều ảnh cùng lúc để xoay hàng loạt", id: "Pilih banyak gambar sekaligus untuk putar batch", ru: "Выберите несколько изображений для пакетного поворота", th: "เลือกรูปภาพหลายไฟล์พร้อมกันเพื่อหมุนแบบกลุ่ม" },
  "rotatePage.drop.title": { en: "Drag & drop images here", vi: "Kéo thả ảnh vào đây", id: "Seret & lepas gambar di sini", ru: "Перетащите изображения сюда", th: "ลากและวางรูปภาพที่นี่" },
  "rotatePage.error.apply": { en: "Apply error: {0}", vi: "Lỗi khi áp dụng: {0}", id: "Kesalahan menerapkan: {0}", ru: "Ошибка применения: {0}", th: "ข้อผิดพลาดในการใช้งาน: {0}" },
  "rotatePage.fileList": { en: "Image list ({0})", vi: "Danh sách ảnh ({0})", id: "Daftar gambar ({0})", ru: "Список изображений ({0})", th: "รายการรูปภาพ ({0})" },
  "rotatePage.flip": { en: "Flip", vi: "Lật (Flip)", id: "Balik", ru: "Отразить", th: "พลิก" },
  "rotatePage.flipH": { en: "↔ Flip horizontal", vi: "↔ Lật ngang", id: "↔ Balik horizontal", ru: "↔ Отразить по горизонтали", th: "↔ พลิกแนวนอน" },
  "rotatePage.flipV": { en: "↕ Flip vertical", vi: "↕ Lật dọc", id: "↕ Balik vertikal", ru: "↕ Отразить по вертикали", th: "↕ พลิกแนวตั้ง" },
  "rotatePage.nav.editor": { en: "Pixel Editor", vi: "Pixel Editor", id: "Editor Piksel", ru: "Pixel Editor", th: "Pixel Editor" },
  "rotatePage.nav.home": { en: "Home", vi: "Trang chủ", id: "Beranda", ru: "Главная", th: "หน้าแรก" },
  "rotatePage.processed": { en: "✓ Processed", vi: "✓ Đã xử lý", id: "✓ Diproses", ru: "✓ Обработано", th: "✓ ประมวลผลแล้ว" },
  "rotatePage.processing": { en: "Processing...", vi: "Đang xử lý...", id: "Memproses...", ru: "Обработка...", th: "กำลังประมวลผล..." },
  "rotatePage.quality": { en: "Quality", vi: "Chất lượng", id: "Kualitas", ru: "Качество", th: "คุณภาพ" },
  "rotatePage.rotate": { en: "Rotate", vi: "Xoay (Rotate)", id: "Putar", ru: "Повернуть", th: "หมุน" },
  "rotatePage.title": { en: "Batch rotate & flip images", vi: "Xoay lật ảnh hàng loạt", id: "Putar & balik gambar batch", ru: "Пакетный поворот и отражение изображений", th: "หมุนและพลิกรูปภาพแบบกลุ่ม" },
  "seo.compress.desc": { en: "Compress and reduce the file size of JPG, PNG, WebP images to the maximum while maintaining the highest quality. Completely free.", vi: "Công cụ nén giảm dung lượng ảnh JPG, PNG, WebP tối đa mà vẫn giữ chất lượng cao nhất. Hoàn toàn miễn phí.", id: "Kompres dan kurangi ukuran file gambar JPG, PNG, WebP secara maksimal sambil mempertahankan kualitas tertinggi. Sepenuhnya gratis.", ru: "Сжимайте JPG, PNG, WebP с наивысшим качеством. Бесплатно.", th: "บีบอัด JPG, PNG, WebP ด้วยคุณภาพสูงสุด ฟรี" },
  "seo.compress.f1.desc": { en: "No files uploaded to the cloud, the compression algorithm runs right on your computer.", vi: "Không upload file lên cloud, thuật toán nén chạy ngay trên máy tính của bạn.", id: "Tidak ada file yang diunggah ke cloud, algoritma kompresi berjalan tepat di komputer Anda.", ru: "Файлы не загружаются в облако.", th: "ไม่มีไฟล์อัปโหลดไปยังคลาวด์" },
  "seo.compress.f1.title": { en: "100% Secure", vi: "Bảo mật 100%", id: "100% Aman", ru: "100% безопасно", th: "ปลอดภัย 100%" },
  "seo.compress.f2.desc": { en: "Provides 3 compression modes (Low, Medium, High) or manually adjust quality from 0-100%.", vi: "Cung cấp 3 chế độ nén (Thấp, Vừa, Cao) hoặc tự chỉnh chất lượng từ 0-100%.", id: "Menyediakan 3 mode kompresi (Rendah, Sedang, Tinggi) atau sesuaikan kualitas secara manual dari 0-100%.", ru: "3 режима сжатия или ручная настройка 0-100%.", th: "3 โหมดบีบอัดหรือปรับด้วยตนเอง 0-100%" },
  "seo.compress.f2.title": { en: "Flexible customization", vi: "Tuỳ chỉnh linh hoạt", id: "Kustomisasi fleksibel", ru: "Гибкая настройка", th: "ปรับแต่งยืดหยุ่น" },
  "seo.compress.faq1.a": { en: "The WebP format provides the best compression ratio today, superior to JPG and PNG.", vi: "Định dạng WebP mang lại tỷ lệ nén tốt nhất hiện nay, vượt trội so với JPG và PNG.", id: "Format WebP memberikan rasio kompresi terbaik saat ini, lebih unggul dari JPG dan PNG.", ru: "WebP обеспечивает лучшее сжатие.", th: "WebP ให้การบีบอัดที่ดีที่สุด" },
  "seo.compress.faq1.q": { en: "Which format compresses best?", vi: "Định dạng nào nén tốt nhất?", id: "Format mana yang paling baik dikompresi?", ru: "Какой формат сжимает лучше?", th: "รูปแบบไหนบีบอัดได้ดีที่สุด?" },
  "seo.compress.h2": { en: "Why do you need an Image Compressor?", vi: "Tại sao bạn cần công cụ Nén Ảnh?", id: "Mengapa Anda membutuhkan Kompresor Gambar?", ru: "Зачем нужен сжиматель?", th: "ทำไมต้องมีตัวบีบอัด?" },
  "seo.compress.p1": { en: "Optimizing image size helps websites load faster, saves bandwidth, and is SEO-friendly. Pixel Normal Edit's image compressor uses smart compression algorithms directly in the browser.", vi: "Tối ưu dung lượng hình ảnh giúp website tải nhanh hơn, tiết kiệm băng thông và thân thiện với SEO. Trình nén ảnh của Pixel Normal Edit sử dụng thuật toán nén thông minh trực tiếp trên trình duyệt.", id: "Mengoptimalkan ukuran gambar membantu situs web memuat lebih cepat, menghemat bandwidth, dan ramah SEO. Kompresor gambar Pixel Normal Edit menggunakan algoritma kompresi cerdas langsung di browser.", ru: "Оптимизация размера помогает сайтам загружаться быстрее.", th: "การเพิ่มประสิทธิภาพขนาดช่วยให้เว็บไซต์โหลดเร็วขึ้น" },
  "seo.compress.title": { en: "Image Compressor - Reduce file size online | Pixel Normal Edit", vi: "Nén ảnh (Compress) giảm dung lượng trực tuyến | Pixel Normal Edit", id: "Kompresor Gambar - Kurangi ukuran file online | Pixel Normal Edit", ru: "Сжиматель изображений | Pixel Normal Edit", th: "ตัวบีบอัดรูปภาพ | Pixel Normal Edit" },
  "seo.convert.desc": { en: "Convert image formats WebP, PNG, JPG, GIF for free and extremely fast.", vi: "Chuyển đổi định dạng hình ảnh WebP, PNG, JPG, GIF miễn phí và cực kỳ nhanh chóng.", id: "Konversi format gambar WebP, PNG, JPG, GIF secara gratis dan sangat cepat.", ru: "Бесплатно конвертируйте WebP, PNG, JPG, GIF.", th: "แปลง WebP, PNG, JPG, GIF ฟรี" },
  "seo.convert.f1.desc": { en: "All processing happens directly on your browser (Client-side), ensuring absolute privacy.", vi: "Mọi tiến trình xử lý diễn ra trực tiếp trên trình duyệt của bạn (Client-side), đảm bảo quyền riêng tư tuyệt đối.", id: "Semua pemrosesan terjadi langsung di browser Anda (Client-side), memastikan privasi mutlak.", ru: "Обработка в браузере, абсолютная приватность.", th: "ประมวลผลในเบราว์เซอร์ ความเป็นส่วนตัวสูงสุด" },
  "seo.convert.f1.title": { en: "No Server Upload", vi: "Không tải ảnh lên máy chủ", id: "Tanpa Unggah Server", ru: "Без загрузки на сервер", th: "ไม่ต้องอัปโหลดเซิร์ฟเวอร์" },
  "seo.convert.f2.desc": { en: "Supports advanced WebP format for the web, along with popular formats like PNG, JPG, GIF.", vi: "Hỗ trợ chuẩn xuất WebP tiên tiến cho web, cùng các định dạng thông dụng như PNG, JPG, GIF.", id: "Mendukung format WebP canggih untuk web, bersama format populer seperti PNG, JPG, GIF.", ru: "Поддержка WebP, PNG, JPG, GIF.", th: "รองรับ WebP, PNG, JPG, GIF" },
  "seo.convert.f2.title": { en: "Multiple Formats", vi: "Đa định dạng", id: "Banyak Format", ru: "Множество форматов", th: "หลายรูปแบบ" },
  "seo.convert.faq1.a": { en: "No. The conversion process preserves the original quality unless you actively compress the image.", vi: "Không. Quá trình convert giữ nguyên chất lượng gốc trừ khi bạn chủ động nén ảnh.", id: "Tidak. Proses konversi mempertahankan kualitas asli kecuali Anda secara aktif mengompresi gambar.", ru: "Конвертация сохраняет качество.", th: "การแปลงรักษารูปแบบดั้งเดิม" },
  "seo.convert.faq1.q": { en: "Will my image lose quality?", vi: "Ảnh của tôi có bị giảm chất lượng không?", id: "Apakah gambar saya akan kehilangan kualitas?", ru: "Изображение потеряет качество?", th: "รูปภาพจะสูญเสียคุณภาพหรือไม่?" },
  "seo.convert.h2": { en: "Why convert image formats at Pixel Normal Edit?", vi: "Tại sao nên chuyển đổi định dạng ảnh tại Pixel Normal Edit?", id: "Mengapa mengonversi format gambar di Pixel Normal Edit?", ru: "Почему конвертировать здесь?", th: "ทำไมต้องแปลงที่นี่?" },
  "seo.convert.p1": { en: "Converting image formats (Convert) is an essential need when working with Pixel Art or web graphics. We provide a free, safe and fast solution right in your browser.", vi: "Chuyển đổi định dạng hình ảnh (Convert) là nhu cầu thiết yếu khi làm việc với Pixel Art hoặc đồ hoạ web. Chúng tôi cung cấp giải pháp miễn phí, an toàn và nhanh chóng ngay trên trình duyệt.", id: "Mengonversi format gambar (Convert) adalah kebutuhan penting saat bekerja dengan Pixel Art atau grafis web. Kami menyediakan solusi gratis, aman, dan cepat langsung di browser Anda.", ru: "Конвертация — насущная потребность для веб-графики.", th: "การแปลงเป็นความต้องการที่จำเป็นสำหรับกราฟิกเว็บ" },
  "seo.convert.title": { en: "Image Converter - Fast, Free | Pixel Normal Edit", vi: "Đổi định dạng ảnh (Convert) - Nhanh chóng, Miễn phí | Pixel Normal Edit", id: "Konverter Gambar - Cepat, Gratis | Pixel Normal Edit", ru: "Конвертер изображений | Pixel Normal Edit", th: "ตัวแปลงรูปภาพ | Pixel Normal Edit" },
  "seo.crop.desc": { en: "Free online image cropping (Crop) tool. Supports free cropping, cropping to 16:9, 1:1, 4:3 ratios quickly.", vi: "Công cụ cắt ảnh (Crop) trực tuyến miễn phí. Hỗ trợ cắt tự do, cắt theo tỷ lệ 16:9, 1:1, 4:3 nhanh chóng.", id: "Alat pemangkasan gambar (Crop) online gratis. Mendukung pemangkasan bebas, pemangkasan rasio 16:9, 1:1, 4:3 dengan cepat.", ru: "Бесплатная обрезка изображений. Поддержка 16:9, 1:1, 4:3.", th: "ตัดรูปภาพฟรี รองรับ 16:9, 1:1, 4:3" },
  "seo.crop.f1.desc": { en: "Easily crop to standard ratios like 1:1 Square, 16:9 Cover.", vi: "Dễ dàng cắt theo tỷ lệ chuẩn như Khung vuông 1:1, Ảnh bìa 16:9.", id: "Mudah memangkas ke rasio standar seperti 1:1 Persegi, 16:9 Sampul.", ru: "Легко обрезайте по стандартным пропорциям.", th: "ตัดตามสัดส่วนมาตรฐานได้ง่าย" },
  "seo.crop.f1.title": { en: "Crop by Aspect Ratio", vi: "Cắt theo Aspect Ratio", id: "Pangkas berdasarkan Rasio Aspek", ru: "Обрезка по пропорциям", th: "ตัดตามสัดส่วน" },
  "seo.crop.h2": { en: "Crop images precisely as you want", vi: "Cắt ảnh chuẩn xác theo ý muốn", id: "Pangkas gambar secara presisi sesuai keinginan Anda", ru: "Обрезайте точно как хотите", th: "ตัดได้อย่างแม่นยำตามต้องการ" },
  "seo.crop.p1": { en: "Crop out excess parts of the photo, focus on the main subject. Our Crop tool allows extremely smooth drag and drop, supporting both mobile and desktop.", vi: "Cắt xén các phần thừa của bức ảnh, tập trung vào đối tượng chính. Công cụ Crop của chúng tôi cho phép kéo thả cực kỳ mượt mà, hỗ trợ cả di động và máy tính.", id: "Pangkas bagian berlebih dari foto, fokus pada subjek utama. Alat Crop kami memungkinkan seret dan lepas yang sangat mulus, mendukung ponsel dan desktop.", ru: "Вырежьте лишнее, сосредоточьтесь на главном.", th: "ตัดส่วนเกิน มุ่งเน้นสิ่งหลัก" },
  "seo.crop.title": { en: "Crop Image Online - Accurate, easy to use | Pixel Normal Edit", vi: "Cắt ảnh trực tuyến (Crop Image) - Chuẩn xác, dễ dùng | Pixel Normal Edit", id: "Pangkas Gambar Online - Akurat, mudah digunakan | Pixel Normal Edit", ru: "Обрезка изображений | Pixel Normal Edit", th: "ตัดรูปภาพ | Pixel Normal Edit" },
  "seo.faq": { en: "Frequently Asked Questions (FAQ)", vi: "Câu hỏi thường gặp (FAQ)", id: "Pertanyaan yang Sering Diajukan (FAQ)", ru: "Часто задаваемые вопросы (FAQ)", th: "คำถามที่พบบ่อย (FAQ)" },
  "seo.features": { en: "Key Features", vi: "Tính năng nổi bật", id: "Fitur Utama", ru: "Основные возможности", th: "คุณสมบัติหลัก" },
  "seo.home.desc": { en: "A collection of ultra-fast image utilities: Convert formats, Compress file size, Crop and Resize online for free.", vi: "Tổng hợp các tiện ích ảnh cực nhanh: Convert định dạng, Nén giảm dung lượng, Cắt và Đổi kích thước trực tuyến miễn phí.", id: "Kumpulan utilitas gambar ultra-cepat: Konversi format, Kompres ukuran file, Pangkas dan Ubah ukuran online gratis.", ru: "Набор сверхбыстрых утилит: конвертация, сжатие, обрезка, изменение размера.", th: "ชุดยูทิลิตี้ที่เร็วมาก: แปลง บีบอัด ตัด เปลี่ยนขนาด" },
  "seo.home.f1.desc": { en: "No need to upload images to the cloud, 100% safe.", vi: "Không cần upload ảnh lên mây, an toàn tuyệt đối.", id: "Tidak perlu mengunggah gambar ke cloud, 100% aman.", ru: "Не нужно загружать в облако.", th: "ไม่ต้องอัปโหลดไปยังคลาวด์" },
  "seo.home.f1.title": { en: "Privacy", vi: "Bảo mật", id: "Privasi", ru: "Приватность", th: "ความเป็นส่วนตัว" },
  "seo.home.f2.desc": { en: "Takes less than 1 second to process a task.", vi: "Chỉ tốn chưa tới 1 giây để xử lý xong một tác vụ.", id: "Hanya butuh kurang dari 1 detik untuk memproses tugas.", ru: "Менее 1 секунды на задачу.", th: "น้อยกว่า 1 วินาทีต่อหนึ่งงาน" },
  "seo.home.f2.title": { en: "Speed", vi: "Tốc độ", id: "Kecepatan", ru: "Скорость", th: "ความเร็ว" },
  "seo.home.h2": { en: "Small Utilities, Big Power", vi: "Tiện ích nhỏ, Sức mạnh lớn", id: "Utilitas Kecil, Kekuatan Besar", ru: "Маленькие утилиты, большая мощь", th: "ยูทิลิตี้เล็กๆ พลังมหาศาล" },
  "seo.home.p1": { en: "Besides the powerful Pixel Art editor, Pixel Normal Edit provides you with a standalone Mini-Tools suite. All calculations are done via advanced HTML5 Canvas technology.", vi: "Ngoài trình chỉnh sửa Pixel Art mạnh mẽ, Pixel Normal Edit còn cung cấp cho bạn một bộ Mini-Tools độc lập. Tất cả tính toán đều được thực hiện thông qua công nghệ HTML5 Canvas tiên tiến.", id: "Selain editor Pixel Art yang kuat, Pixel Normal Edit menyediakan rangkaian Mini-Tools mandiri. Semua perhitungan dilakukan melalui teknologi HTML5 Canvas canggih.", ru: "Помимо Pixel Art редактора, есть набор мини-инструментов.", th: "นอกจากตัวแก้ไข Pixel Art ยังมีชุดมินิเครื่องมือ" },
  "seo.home.title": { en: "Fast Image Processing Tools | Pixel Normal Edit", vi: "Bộ công cụ xử lý ảnh nhanh | Pixel Normal Edit", id: "Alat Pemrosesan Gambar Cepat | Pixel Normal Edit", ru: "Быстрые инструменты обработки | Pixel Normal Edit", th: "เครื่องมือประมวลผลที่เร็ว | Pixel Normal Edit" },
  "seo.resize.desc": { en: "Tool to zoom in, zoom out (Resize), change Width and Height resolution quickly on any device.", vi: "Công cụ phóng to, thu nhỏ ảnh (Resize), thay đổi độ phân giải Width, Height nhanh chóng trên mọi thiết bị.", id: "Alat untuk memperbesar, memperkecil (Resize), mengubah resolusi Lebar dan Tinggi dengan cepat di perangkat apa pun.", ru: "Изменяйте размер изображений на любом устройстве.", th: "เปลี่ยนขนาดรูปภาพบนทุกอุปกรณ์" },
  "seo.resize.f1.desc": { en: "Preserve original Aspect Ratio so the image is not distorted after zooming.", vi: "Bảo toàn Aspect Ratio gốc để ảnh không bị méo lệch sau khi thu phóng.", id: "Pertahankan Rasio Aspek asli agar gambar tidak terdistorsi setelah diperbesar.", ru: "Сохраняйте пропорции.", th: "รักษาสัดส่วน" },
  "seo.resize.f1.title": { en: "Maintain aspect ratio", vi: "Giữ nguyên tỷ lệ", id: "Pertahankan rasio aspek", ru: "Сохранение пропорций", th: "รักษาสัดส่วนภาพ" },
  "seo.resize.f2.desc": { en: "Supports Pixelated (For Pixel Art) and Smooth (For regular images).", vi: "Hỗ trợ Pixelated (Dành cho Pixel Art) và Smooth (Dành cho ảnh thường).", id: "Mendukung Pixelated (Untuk Pixel Art) dan Smooth (Untuk gambar biasa).", ru: "Pixelated (для Pixel Art) и Smooth.", th: "Pixelated (สำหรับ Pixel Art) และ Smooth" },
  "seo.resize.f2.title": { en: "Algorithm options", vi: "Tuỳ chọn thuật toán", id: "Opsi algoritma", ru: "Варианты алгоритмов", th: "ตัวเลือกอัลกอริทึม" },
  "seo.resize.h2": { en: "Image Resizing Utility", vi: "Tiện ích Resize kích thước ảnh", id: "Utilitas Ubah Ukuran Gambar", ru: "Утилита изменения размера", th: "ยูทิลิตี้เปลี่ยนขนาด" },
  "seo.resize.p1": { en: "Whether you need to Resize images to post on Facebook, Instagram, or make advertising banners, our resizer will help you operate accurately to every Pixel.", vi: "Cho dù bạn cần Resize ảnh để đăng Facebook, Instagram, hoặc làm banner quảng cáo, trình thay đổi kích thước của chúng tôi sẽ giúp bạn thao tác chuẩn xác tới từng Pixel.", id: "Apakah Anda perlu mengubah ukuran gambar untuk diposting di Facebook, Instagram, atau membuat banner iklan, pengubah ukuran kami akan membantu Anda beroperasi akurat hingga setiap Piksel.", ru: "Изменяйте размер для Facebook, Instagram, баннеров.", th: "เปลี่ยนขนาดสำหรับ Facebook, Instagram ป้ายโฆษณา" },
  "seo.resize.title": { en: "Resize Image, change resolution | Pixel Normal Edit", vi: "Đổi kích thước ảnh (Resize), thay đổi phân giải | Pixel Normal Edit", id: "Ubah Ukuran Gambar, ganti resolusi | Pixel Normal Edit", ru: "Изменение размера | Pixel Normal Edit", th: "เปลี่ยนขนาด | Pixel Normal Edit" },
  "seo.rotate.desc": { en: "Tool to rotate images 90 degrees, 180 degrees, flip horizontally, flip vertically (Flip) quickly directly in the browser, without losing quality.", vi: "Công cụ xoay ảnh 90 độ, 180 độ, lật ngang, lật dọc (Flip) nhanh chóng trực tiếp trên trình duyệt, không làm giảm chất lượng.", id: "Alat untuk memutar gambar 90 derajat, 180 derajat, membalik horizontal, membalik vertikal (Flip) dengan cepat langsung di browser, tanpa kehilangan kualitas.", ru: "Поворачивайте и отражайте изображения в браузере.", th: "หมุนและพลิกรูปภาพในเบราว์เซอร์" },
  "seo.rotate.f1.desc": { en: "Rotate left, rotate right freely with an algorithm that preserves pixels.", vi: "Xoay trái, xoay phải tự do với thuật toán giữ nguyên điểm ảnh.", id: "Putar kiri, putar kanan bebas dengan algoritma yang mempertahankan piksel.", ru: "Свободный поворот.", th: "หมุนอิสระ" },
  "seo.rotate.f1.title": { en: "Rotate 90°, 180°", vi: "Xoay 90°, 180°", id: "Putar 90°, 180°", ru: "Поворот 90, 180", th: "หมุน 90, 180" },
  "seo.rotate.f2.desc": { en: "Supports horizontal or vertical flipping extremely easily.", vi: "Hỗ trợ lật ngang (Horizontal) hoặc lật dọc (Vertical) cực kỳ dễ dàng.", id: "Mendukung pembalikan horizontal atau vertikal dengan sangat mudah.", ru: "Горизонтальное и вертикальное отражение.", th: "พลิกแนวนอนและแนวตั้ง" },
  "seo.rotate.f2.title": { en: "Mirror Flip", vi: "Lật gương (Flip)", id: "Balik Cermin", ru: "Зеркальное отражение", th: "พลิกกระจก" },
  "seo.rotate.h2": { en: "Super fast Image Rotation and Flipping", vi: "Xoay và Lật hình ảnh siêu tốc", id: "Putar dan Balik Gambar Super Cepat", ru: "Сверхбыстрый поворот и отражение", th: "การหมุนและพลิกที่เร็วมาก" },
  "seo.rotate.p1": { en: "Sometimes you take a picture backwards or tilted. Don't worry, the rotate and flip tool will help you correct the angle with just one click.", vi: "Đôi khi bạn chụp ảnh bị ngược hoặc bị nghiêng. Đừng lo, công cụ xoay và lật ảnh sẽ giúp bạn sửa lại góc độ chỉ bằng một cú nhấp chuột.", id: "Terkadang Anda mengambil foto terbalik atau miring. Jangan khawatir, alat putar dan balik akan membantu Anda mengoreksi sudut hanya dengan satu klik.", ru: "Исправьте угол одним нажатием.", th: "แก้ไขมุมด้วยการคลิกเดียว" },
  "seo.rotate.title": { en: "Rotate & Flip Images Online | Pixel Normal Edit", vi: "Xoay và Lật ảnh (Rotate & Flip) trực tuyến | Pixel Normal Edit", id: "Putar & Balik Gambar Online | Pixel Normal Edit", ru: "Поворот и отражение | Pixel Normal Edit", th: "หมุนและพลิก | Pixel Normal Edit" },
  "seo.sharePrompt": { en: "Share this tool if you find it helpful!", vi: "Hãy chia sẻ công cụ này nếu bạn thấy hữu ích!", id: "Bagikan alat ini jika Anda merasa terbantu!", ru: "Поделитесь этим инструментом, если он полезен!", th: "แชร์เครื่องมือนี้หากคุณพบว่ามีประโยชน์!" },
  "settings.accountTitle": { en: "Pixel Normal Edit Account", vi: "Tài khoản Pixel Normal Edit", id: "Akun Pixel Normal Edit", ru: "Аккаунт Pixel Normal Edit", th: "บัญชี Pixel Normal Edit" },
  "settings.aiConnection": { en: "AI Connection (MCP)", vi: "Kết nối AI (MCP)", id: "Koneksi AI (MCP)", ru: "Подключение AI (MCP)", th: "การเชื่อมต่อ AI (MCP)" },
  "settings.animations": { en: "Enable UI animations", vi: "Bật hiệu ứng chuyển động (Animations)", id: "Aktifkan animasi UI", ru: "Включить анимации интерфейса", th: "เปิดใช้งานแอนิเมชัน UI" },
  "settings.autoSaveDest": { en: "Auto Save Destination", vi: "Nơi lưu tự động (Auto Save)", id: "Tujuan Simpan Otomatis", ru: "Назначение автосохранения", th: "ปลายทางบันทึกอัตโนมัติ" },
  "settings.autoSaveDest.both": { en: "Save to both Local Directory and Google Drive", vi: "Lưu vào cả Thư mục cục bộ và Google Drive", id: "Simpan ke Direktori Lokal dan Google Drive", ru: "Сохранять в локальную директорию и Google Drive", th: "บันทึกลงไดเรกทอรีท้องถิ่นและ Google Drive" },
  "settings.autoSaveDest.drive": { en: "Save to Google Drive only", vi: "Chỉ lưu vào Google Drive", id: "Simpan hanya ke Google Drive", ru: "Только Google Drive", th: "เฉพาะ Google Drive" },
  "settings.autoSaveDest.local": { en: "Save to Local Directory only", vi: "Chỉ lưu vào Thư mục cục bộ", id: "Simpan hanya ke Direktori Lokal", ru: "Только локальная директория", th: "เฉพาะไดเรกทอรีท้องถิ่น" },
  "settings.autoSaveDest.none": { en: "Disable offline auto save", vi: "Tắt tự động lưu ngoại tuyến", id: "Nonaktifkan simpan otomatis offline", ru: "Отключить автосохранение", th: "ปิดการบันทึกอัตโนมัติ" },
  "settings.autoSaveDestDesc": { en: "The system will automatically sync your files every 5 seconds when there are changes.", vi: "Hệ thống sẽ tự động đồng bộ file của bạn theo chu kỳ 5 giây mỗi khi có thay đổi.", id: "Sistem akan otomatis menyinkronkan file Anda setiap 5 detik saat ada perubahan.", ru: "Система будет автоматически синхронизировать файлы каждые 5 секунд при изменениях.", th: "ระบบจะซิงค์ไฟล์อัตโนมัติทุก 5 วินาทีเมื่อมีการเปลี่ยนแปลง" },
  "settings.canvasSize": { en: "Canvas Size Settings", vi: "Cài đặt Kích thước", id: "Pengaturan Ukuran Kanvas", ru: "Настройки размера холста", th: "ตั้งค่าขนาดผืนผ้าใบ" },
  "settings.changeDirectory": { en: "Change Directory", vi: "Thay đổi thư mục", id: "Ubah Direktori", ru: "Сменить директорию", th: "เปลี่ยนไดเรกทอรี" },
  "settings.clearDirectory": { en: "Clear Config", vi: "Xóa cấu hình", id: "Bersihkan Konfigurasi", ru: "Очистить конфигурацию", th: "ล้างการกำหนดค่า" },
  "settings.display": { en: "Display", vi: "Hiển thị", id: "Tampilan", ru: "Отображение", th: "การแสดงผล" },
  "settings.langEnglish": { en: "English", vi: "English", id: "Inggris", ru: "Английский", th: "อังกฤษ" },
  "settings.langIndonesian": { en: "Indonesian", vi: "Tiếng Indonesia", id: "Indonesia", ru: "Индонезийский", th: "อินโดนีเซีย" },
  "settings.langRussian": { en: "Russian", vi: "Tiếng Nga", id: "Rusia", ru: "Русский", th: "รัสเซีย" },
  "settings.langThai": { en: "Thai", vi: "Tiếng Thái", id: "Thai", ru: "Тайский", th: "ภาษาไทย" },
  "settings.langVietnamese": { en: "Vietnamese", vi: "Tiếng Việt", id: "Vietnam", ru: "Вьетнамский", th: "เวียดนาม" },
  "settings.language": { en: "Language", vi: "Ngôn ngữ", id: "Bahasa", ru: "Язык", th: "ภาษา" },
  "settings.localDirectory": { en: "Local Directory", vi: "Thư mục cục bộ", id: "Direktori Lokal", ru: "Локальная директория", th: "ไดเรกทอรีท้องถิ่น" },
  "settings.localDirectoryDesc": { en: "Grant permission to save files directly to your device without the download dialog.", vi: "Cấp quyền cho trình duyệt lưu file trực tiếp vào thiết bị của bạn mà không cần phải hiện hộp thoại tải xuống.", id: "Beri izin untuk menyimpan file langsung ke perangkat Anda tanpa dialog unduhan.", ru: "Предоставьте разрешение на сохранение файлов прямо на устройство без диалога скачивания.", th: "ให้สิทธิ์บันทึกไฟล์ลงอุปกรณ์โดยตรงโดยไม่ต้องแสดงกล่องดาวน์โหลด" },
  "settings.mcpOptionA": { en: "Option A: For Claude Desktop", vi: "Tùy chọn A: Dành cho Claude Desktop", id: "Opsi A: Untuk Claude Desktop", ru: "Вариант A: Для Claude Desktop", th: "ตัวเลือก A: สำหรับ Claude Desktop" },
  "settings.mcpOptionADesc": { en: "Add this configuration to your claude_desktop_config.json file:", vi: "Thêm cấu hình này vào file claude_desktop_config.json của bạn:", id: "Tambahkan konfigurasi ini ke file claude_desktop_config.json Anda:", ru: "Добавьте эту конфигурацию в файл claude_desktop_config.json:", th: "เพิ่มการกำหนดค่านี้ในไฟล์ claude_desktop_config.json ของคุณ:" },
  "settings.mcpOptionB": { en: "Option B: For Cursor (Terminal Command)", vi: "Tùy chọn B: Dành cho Cursor (Dạng lệnh Terminal)", id: "Opsi B: Untuk Cursor (Perintah Terminal)", ru: "Вариант B: Для Cursor (команда терминала)", th: "ตัวเลือก B: สำหรับ Cursor (คำสั่งเทอร์มินัล)" },
  "settings.mcpOptionBDesc": { en: "Run this command in your Terminal to start the MCP server:", vi: "Chạy lệnh này trong Terminal để khởi động máy chủ MCP:", id: "Jalankan perintah ini di Terminal Anda untuk memulai server MCP:", ru: "Запустите эту команду в терминале для запуска MCP-сервера:", th: "รันคำสั่งนี้ในเทอร์มินัลเพื่อเริ่มต้น MCP server:" },
  "settings.noDirectorySelected": { en: "No directory selected", vi: "Chưa cấu hình Thư mục cục bộ", id: "Tidak ada direktori yang dipilih", ru: "Директория не выбрана", th: "ยังไม่ได้เลือกไดเรกทอรี" },
  "settings.penShapeTitle": { en: "Pen Shape", vi: "Hình dạng bút vẽ", id: "Bentuk Pena", ru: "Форма пера", th: "รูปทรงปากกา" },
  "settings.selectDirectory": { en: "Select Directory", vi: "Chọn thư mục", id: "Pilih Direktori", ru: "Выбрать директорию", th: "เลือกไดเรกทอรี" },
  "settings.showBtnNames": { en: "Show button names", vi: "Hiện tên nút", id: "Tampilkan nama tombol", ru: "Показать названия кнопок", th: "แสดงชื่อปุ่ม" },
  "shortcuts.cat.actions": { en: "Actions", vi: "Thao tác", id: "Tindakan", ru: "Действия", th: "การกระทำ" },
  "shortcuts.cat.animation": { en: "Animation", vi: "Animation", id: "Animasi", ru: "Анимация", th: "ภาพเคลื่อนไหว" },
  "shortcuts.cat.layers": { en: "Layers", vi: "Layers", id: "Lapisan", ru: "Слои", th: "ชั้น" },
  "shortcuts.cat.modes": { en: "Modes", vi: "Chế độ", id: "Mode", ru: "Режимы", th: "โหมด" },
  "shortcuts.cat.tools": { en: "Drawing Tools", vi: "Công cụ vẽ", id: "Alat Gambar", ru: "Инструменты рисования", th: "เครื่องมือวาด" },
  "shortcuts.cat.transforms": { en: "Transforms", vi: "Biến đổi", id: "Transformasi", ru: "Трансформации", th: "การแปลง" },
  "shortcuts.cat.zoom": { en: "Zoom", vi: "Zoom", id: "Zoom", ru: "Масштаб", th: "ซูม" },
  "shortcuts.confirmReset": { en: "Reset all shortcuts to default?", vi: "Khôi phục tất cả phím tắt về mặc định?", id: "Atur ulang semua pintasan ke default?", ru: "Сбросить все горячие клавиши по умолчанию?", th: "รีเซ็ตทางลัดทั้งหมดเป็นค่าเริ่มต้น?" },
  "shortcuts.conflictDesc": { en: "This shortcut is already used by:", vi: "Phím tắt này đang được sử dụng bởi:", id: "Pintasan ini sudah digunakan oleh:", ru: "Эта горячая клавиша уже используется:", th: "ทางลัดนี้ถูกใช้งานแล้วโดย:" },
  "shortcuts.conflictTitle": { en: "Shortcut Conflict", vi: "Xung đột phím tắt", id: "Konflik Pintasan", ru: "Конфликт горячих клавиш", th: "ความขัดแย้งของทางลัด" },
  "shortcuts.edit": { en: "Edit", vi: "Sửa", id: "Edit", ru: "Редактировать", th: "แก้ไข" },
  "shortcuts.export": { en: "Export", vi: "Xuất", id: "Ekspor", ru: "Экспорт", th: "ส่งออก" },
  "shortcuts.import": { en: "Import", vi: "Nhập", id: "Impor", ru: "Импорт", th: "นำเข้า" },
  "shortcuts.importError": { en: "Error importing file", vi: "Lỗi khi import file", id: "Kesalahan mengimpor file", ru: "Ошибка импорта файла", th: "ข้อผิดพลาดในการนำเข้าไฟล์" },
  "shortcuts.override": { en: "Override", vi: "Ghi đè", id: "Timpa", ru: "Перезаписать", th: "เขียนทับ" },
  "shortcuts.pressKey": { en: "Press key...", vi: "Nhấn phím...", id: "Tekan tombol...", ru: "Нажмите клавишу...", th: "กดปุ่ม..." },
  "shortcuts.resetAll": { en: "Reset to Default", vi: "Khôi phục mặc định", id: "Atur Ulang ke Default", ru: "Сбросить по умолчанию", th: "รีเซ็ตเป็นค่าเริ่มต้น" },
  "shortcuts.title": { en: "Keyboard Shortcuts", vi: "Phím tắt", id: "Pintasan Keyboard", ru: "Горячие клавиши", th: "ทางลัดแป้นพิมพ์" },
  "status.analyzeShape": { en: "Analyzing shapes...", vi: "Đang phân tích hình dạng...", id: "Menganalisis bentuk...", ru: "Анализ форм...", th: "กำลังวิเคราะห์รูปทรง..." },
  "status.bgFlattened": { en: "Background successfully flattened into canvas.", vi: "Đã gộp ảnh nền vào canvas thành công.", id: "Latar berhasil digabungkan ke kanvas.", ru: "Фон успешно вставлен в холст.", th: "พื้นหลังถูกเพิ่มลงในผืนผ้าใบเรียบร้อยแล้ว" },
  "status.bgLoadError": { en: "Failed to load background image", vi: "Không tải được ảnh nền", id: "Gagal memuat gambar latar", ru: "Не удалось загрузить фоновое изображение", th: "ไม่สามารถโหลดรูปภาพพื้นหลังได้" },
  "status.bgOn": { en: "Source image set as background.", vi: "Đã đặt ảnh gốc làm nền lưới (tối màu).", id: "Gambar sumber disetel sebagai latar.", ru: "Исходное изображение установлено как фон.", th: "รูปภาพต้นฉบับถูกตั้งเป็นพื้นหลังแล้ว" },
  "status.blankCanvas": { en: "Canvas is empty, cannot trim!", vi: "Canvas đang trống, không thể xén!", id: "Kanvas kosong, tidak dapat memangkas!", ru: "Холст пуст, нечего обрезать!", th: "ผืนผ้าใบว่างเปล่า ไม่สามารถตัดได้!" },
  "status.calcOutline": { en: "Calculating outline...", vi: "Đang tính toán viền...", id: "Menghitung garis luar...", ru: "Вычисление контура...", th: "กำลังคำนวณเส้นรอบนอก..." },
  "status.calcOutlinePct": { en: "Calculating outline: {0}%...", vi: "Đang tính toán viền: {0}%...", id: "Menghitung garis luar: {0}%...", ru: "Вычисление контура: {0}%...", th: "กำลังคำนวณเส้นรอบนอก: {0}%..." },
  "status.compressed": { en: "Compressed", vi: "Đã nén", id: "Terkompresi", ru: "Сжато", th: "บีบอัดแล้ว" },
  "status.compressing": { en: "Compressing image...", vi: "Đang nén ảnh...", id: "Mengompresi gambar...", ru: "Сжатие изображения...", th: "กำลังบีบอัดรูปภาพ..." },
  "status.copied": { en: "Copied", vi: "Đã sao chép", id: "Disalin", ru: "Скопировано", th: "คัดลอกแล้ว" },
  "status.dlJpeg": { en: "Downloaded JPEG", vi: "Đã tải xuống ảnh JPEG", id: "JPEG diunduh", ru: "Скачан JPEG", th: "ดาวน์โหลด JPEG แล้ว" },
  "status.dlJson": { en: "Downloaded JSON project.", vi: "Đã tải xuống dự án JSON.", id: "Proyek JSON diunduh.", ru: "Скачан проект JSON.", th: "ดาวน์โหลดโปรเจกต์ JSON แล้ว" },
  "status.dlPng": { en: "Downloaded PNG", vi: "Đã tải xuống ảnh PNG", id: "PNG diunduh", ru: "Скачан PNG", th: "ดาวน์โหลด PNG แล้ว" },
  "status.dlWebp": { en: "Downloaded WEBP", vi: "Đã tải xuống ảnh WEBP", id: "WEBP diunduh", ru: "Скачан WEBP", th: "ดาวน์โหลด WEBP แล้ว" },
  "status.drawOutlinePct": { en: "Drawing outline: {0}%...", vi: "Đang vẽ viền: {0}%...", id: "Menggambar garis luar: {0}%...", ru: "Рисование контура: {0}%...", th: "กำลังวาดเส้นรอบนอก: {0}%..." },
  "status.driveConnected": { en: "Connected to Google Drive", vi: "Đã kết nối Google Drive", id: "Terhubung ke Google Drive", ru: "Подключено к Google Drive", th: "เชื่อมต่อ Google Drive แล้ว" },
  "status.driveDisconnected": { en: "Disconnected from Google Drive", vi: "Đã ngắt kết nối Google Drive", id: "Terputus dari Google Drive", ru: "Отключено от Google Drive", th: "ตัดการเชื่อมต่อ Google Drive แล้ว" },
  "status.eraserDone": { en: "Eraser complete ({0} pixels).", vi: "Hoàn tất tẩy vùng màu ({0} pixels).", id: "Penghapusan selesai ({0} piksel).", ru: "Ластик завершён ({0} пикселей).", th: "ยางลบเสร็จสิ้น ({0} พิกเซล)" },
  "status.eraserError": { en: "Error erasing area.", vi: "Lỗi khi tẩy màu.", id: "Kesalahan menghapus area.", ru: "Ошибка стирания области.", th: "ข้อผิดพลาดในการลบบริเวณ" },
  "status.erasing": { en: "Erasing...", vi: "Đang xóa màu...", id: "Menghapus...", ru: "Стирание...", th: "กำลังลบ..." },
  "status.erasingPct": { en: "Erasing: {0}%...", vi: "Đang xóa màu: {0}%...", id: "Menghapus: {0}%...", ru: "Стирание: {0}%...", th: "กำลังลบ: {0}%..." },
  "status.error": { en: "Error", vi: "Lỗi", id: "Kesalahan", ru: "Ошибка", th: "ข้อผิดพลาด" },
  "status.fileCreatedLocal": { en: "File created in Local Directory", vi: "Đã tạo file tại Thư mục cục bộ", id: "File dibuat di Direktori Lokal", ru: "Файл создан в локальной директории", th: "สร้างไฟล์ในไดเรกทอรีท้องถิ่นแล้ว" },
  "status.fillComplete": { en: "Fill complete", vi: "Đã hoàn tất đổ màu", id: "Pengisian selesai", ru: "Заливка завершена", th: "การเทสีเสร็จสิ้น" },
  "status.fillError": { en: "Error filling area.", vi: "Lỗi khi đổ màu.", id: "Kesalahan mengisi area.", ru: "Ошибка заливки области.", th: "ข้อผิดพลาดในการเทสีบริเวณ" },
  "status.filling": { en: "Filling...", vi: "Đang đổ màu...", id: "Mengisi...", ru: "Заливка...", th: "กำลังเทสี..." },
  "status.fillingPct": { en: "Filling: {0}%...", vi: "Đang đổ màu: {0}%...", id: "Mengisi: {0}%...", ru: "Заливка: {0}%...", th: "กำลังเทสี: {0}%..." },
  "status.flippedH": { en: "Flipped Horizontally.", vi: "Đã lật ngang.", id: "Dibalik Horizontal.", ru: "Отражено по горизонтали.", th: "พลิกแนวนอนแล้ว" },
  "status.flippedV": { en: "Flipped Vertically.", vi: "Đã lật dọc.", id: "Dibalik Vertikal.", ru: "Отражено по вертикали.", th: "พลิกแนวตั้งแล้ว" },
  "status.imgComplete": { en: "Image compressed", vi: "Hoàn tất nén ảnh", id: "Gambar dikompresi", ru: "Изображение сжато", th: "รูปภาพถูกบีบอัดแล้ว" },
  "status.imgLoaded": { en: "Image loaded", vi: "Đã tải ảnh", id: "Gambar dimuat", ru: "Изображение загружено", th: "โหลดรูปภาพแล้ว" },
  "status.imgProcessing": { en: "Processing image...", vi: "Đang xử lý ảnh...", id: "Memproses gambar...", ru: "Обработка изображения...", th: "กำลังประมวลผลรูปภาพ..." },
  "status.init": { en: "Welcome to Pixel Normal Edit!", vi: "Chào mừng đến với Pixel Normal Edit!", id: "Selamat datang di Pixel Normal Edit!", ru: "Добро пожаловать в Pixel Normal Edit!", th: "ยินดีต้อนรับสู่ Pixel Normal Edit!" },
  "status.jsonError": { en: "JSON parsing error:", vi: "Lỗi đọc JSON:", id: "Kesalahan parsing JSON:", ru: "Ошибка чтения JSON:", th: "ข้อผิดพลาดในการอ่าน JSON:" },
  "status.jsonInvalid": { en: "Invalid JSON structure.", vi: "Cấu trúc JSON không hợp lệ.", id: "Struktur JSON tidak valid.", ru: "Неверная структура JSON.", th: "โครงสร้าง JSON ไม่ถูกต้อง" },
  "status.jsonLoaded": { en: "JSON Loaded.", vi: "Đã tải JSON.", id: "JSON Dimuat.", ru: "JSON загружен.", th: "โหลด JSON แล้ว" },
  "status.loading": { en: "Loading...", vi: "Đang tải...", id: "Memuat...", ru: "Загрузка...", th: "กำลังโหลด..." },
  "status.mcpConnected": { en: "Status: MCP Connected", vi: "Trạng thái: đã kết nối mcp", id: "Status: MCP Terhubung", ru: "Статус: MCP подключён", th: "สถานะ: MCP เชื่อมต่อแล้ว" },
  "status.mcpWaiting": { en: "Waiting for connection...", vi: "Đang chờ kết nối...", id: "Menunggu koneksi...", ru: "Ожидание подключения...", th: "รอการเชื่อมต่อ..." },
  "status.needImg": { en: "Please upload an image first.", vi: "Vui lòng tải ảnh lên trước.", id: "Silakan unggah gambar terlebih dahulu.", ru: "Пожалуйста, загрузите изображение.", th: "กรุณาอัปโหลดรูปภาพก่อน" },
  "status.newCanvas": { en: "New canvas created.", vi: "Đã tạo trang mới.", id: "Kanvas baru dibuat.", ru: "Новый холст создан.", th: "สร้างผืนผ้าใบใหม่แล้ว" },
  "status.outlineDone": { en: "Outline complete ({0} pixels).", vi: "Hoàn tất vẽ viền ({0} pixels).", id: "Garis luar selesai ({0} piksel).", ru: "Контур готов ({0} пикселей).", th: "เส้นรอบนอกเสร็จสิ้น ({0} พิกเซล)" },
  "status.outlineError": { en: "Error drawing outline.", vi: "Lỗi khi tạo viền.", id: "Kesalahan menggambar garis luar.", ru: "Ошибка рисования контура.", th: "ข้อผิดพลาดในการวาดเส้นรอบนอก" },
  "status.pasted": { en: "Pasted", vi: "Đã dán", id: "Ditempel", ru: "Вставлено", th: "วางแล้ว" },
  "status.pickedColor": { en: "Picked color:", vi: "Đã hút màu:", id: "Warna dipilih:", ru: "Выбран цвет:", th: "เลือกสี:" },
  "status.ready": { en: "Ready", vi: "Sẵn sàng", id: "Siap", ru: "Готово", th: "พร้อม" },
  "status.redo": { en: "Redo", vi: "Redo", id: "Ulangi", ru: "Повторить", th: "ทำซ้ำ" },
  "status.rotated": { en: "Rotated 90°.", vi: "Đã xoay 90°.", id: "Diputar 90°.", ru: "Повёрнуто на 90°.", th: "หมุน 90° แล้ว" },
  "status.saved": { en: "Saved", vi: "Đã lưu", id: "Tersimpan", ru: "Сохранено", th: "บันทึกแล้ว" },
  "status.savedToDrive": { en: "Saved to Google Drive", vi: "Đã lưu vào Google Drive", id: "Tersimpan ke Google Drive", ru: "Сохранено в Google Drive", th: "บันทึกลง Google Drive แล้ว" },
  "status.savedToFolder": { en: "Saved to folder: {0}", vi: "Đã lưu vào thư mục: {0}", id: "Tersimpan ke folder: {0}", ru: "Сохранено в папку: {0}", th: "บันทึกลงโฟลเดอร์: {0}" },
  "status.savedToLocal": { en: "Saved to Local Directory", vi: "Đã lưu vào Thư mục cục bộ", id: "Tersimpan ke Direktori Lokal", ru: "Сохранено в локальную директорию", th: "บันทึกลงไดเรกทอรีท้องถิ่นแล้ว" },
  "status.saving": { en: "Saving...", vi: "Đang lưu...", id: "Menyimpan...", ru: "Сохранение...", th: "กำลังบันทึก..." },
  "status.scanBg": { en: "Scanning background...", vi: "Đang quét nền...", id: "Memindai latar...", ru: "Сканирование фона...", th: "กำลังสแกนพื้นหลัง..." },
  "status.scanBgCount": { en: "Scanning background: {0} blocks...", vi: "Đang quét nền: {0} khối...", id: "Memindai latar: {0} blok...", ru: "Сканирование фона: {0} блоков...", th: "กำลังสแกนพื้นหลัง: {0} บล็อก..." },
  "status.scanEraser": { en: "Scanning erase area...", vi: "Đang quét vùng cần tẩy...", id: "Memindai area hapus...", ru: "Сканирование области стирания...", th: "กำลังสแกนบริเวณที่จะลบ..." },
  "status.scanFill": { en: "Scanning fill area...", vi: "Đang quét vùng cần đổ màu...", id: "Memindai area isi...", ru: "Сканирование области заливки...", th: "กำลังสแกนบริเวณที่จะเทสี..." },
  "status.syncError": { en: "Sync error", vi: "Lỗi đồng bộ", id: "Kesalahan sinkronisasi", ru: "Ошибка синхронизации", th: "ข้อผิดพลาดในการซิงค์" },
  "status.taskAborted": { en: "Task aborted.", vi: "Đã dừng thuật toán.", id: "Tugas dibatalkan.", ru: "Задача прервана.", th: "งานถูกยกเลิก" },
  "status.toolHidden": { en: "Please select a tool to use.", vi: "Vui lòng chọn một công cụ để sử dụng.", id: "Silakan pilih alat untuk digunakan.", ru: "Пожалуйста, выберите инструмент.", th: "กรุณาเลือกเครื่องมือ" },
  "status.toolSelected": { en: "Selected tool:", vi: "Đã chọn công cụ:", id: "Alat dipilih:", ru: "Выбран инструмент:", th: "เลือกเครื่องมือ:" },
  "status.undo": { en: "Undo", vi: "Undo", id: "Urungkan", ru: "Отменить", th: "เลิกทำ" },
  "status.zoom": { en: "Zoom:", vi: "Zoom:", id: "Zoom:", ru: "Масштаб:", th: "ซูม:" },
  "status.zoomFit": { en: "Zoom: Fit to Screen", vi: "Zoom: Vừa màn hình", id: "Zoom: Sesuaikan ke Layar", ru: "Масштаб: Вписать в экран", th: "ซูม: พอดีหน้าจอ" },
  "tab.newCanvas": { en: "New Canvas", vi: "New Canvas", id: "Kanvas Baru", ru: "Новый холст", th: "ผืนผ้าใบใหม่" },
  "text.apply": { en: "Apply", vi: "Xác nhận", id: "Terapkan", ru: "Применить", th: "ใช้" },
  "text.bold": { en: "Bold", vi: "In đậm", id: "Tebal", ru: "Полужирный", th: "ตัวหนา" },
  "text.cancel": { en: "Cancel", vi: "Hủy", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "text.color": { en: "Color", vi: "Màu sắc", id: "Warna", ru: "Цвет", th: "สี" },
  "text.emptyStore": { en: "Empty. Use Copy/Cut to save.", vi: "Trống. Dùng Copy/Cắt để lưu.", id: "Kosong. Gunakan Salin/Potong untuk menyimpan.", ru: "Пусто. Используйте Копировать/Вырезать.", th: "ว่างเปล่า ใช้คัดลอก/ตัดเพื่อบันทึก" },
  "text.fontFamily": { en: "Font", vi: "Phông chữ", id: "Font", ru: "Шрифт", th: "แบบอักษร" },
  "text.fontSize": { en: "Size", vi: "Cỡ chữ", id: "Ukuran", ru: "Размер", th: "ขนาด" },
  "text.hideTools": { en: "Hide Tools", vi: "Đóng công cụ", id: "Sembunyikan Alat", ru: "Скрыть инструменты", th: "ซ่อนเครื่องมือ" },
  "text.italic": { en: "Italic", vi: "In nghiêng", id: "Miring", ru: "Курсив", th: "ตัวเอียง" },
  "text.showTools": { en: "Show Tools", vi: "Mở công cụ", id: "Tampilkan Alat", ru: "Показать инструменты", th: "แสดงเครื่องมือ" },
  "textTool.moveHint": { en: "Drag to move", vi: "Kéo để di chuyển", id: "Seret untuk memindahkan", ru: "Перетащите для перемещения", th: "ลากเพื่อย้าย" },
  "theme.bg": { en: "Background (Bg)", vi: "Nền (Bg)", id: "Latar (Bg)", ru: "Фон (Bg)", th: "พื้นหลัง (Bg)" },
  "theme.custom": { en: "Custom", vi: "Tùy chỉnh (Custom)", id: "Kustom", ru: "Пользовательский", th: "กำหนดเอง" },
  "theme.dark": { en: "Dark", vi: "Tối (Dark)", id: "Gelap", ru: "Тёмная", th: "มืด" },
  "theme.gridLine": { en: "Grid color", vi: "Màu lưới (Grid)", id: "Warna kisi", ru: "Цвет сетки", th: "สีตาราง" },
  "theme.light": { en: "Light", vi: "Sáng (Light)", id: "Terang", ru: "Светлая", th: "สว่าง" },
  "theme.primary": { en: "Accent (Primary)", vi: "Nhấn (Primary)", id: "Aksen (Primer)", ru: "Акцентный (Основной)", th: "สีเน้น (หลัก)" },
  "theme.title": { en: "Theme", vi: "Giao diện (Theme)", id: "Tema", ru: "Тема", th: "ธีม" },
  "tool.blend-brush": { en: "Blend colors between pixels", vi: "Trộn màu mượt giữa các pixel", id: "Campur warna antar piksel", ru: "Смешивать цвета между пикселями", th: "ผสมสีระหว่างพิกเซล" },
  "tool.blendBrush": { en: "Blend Brush", vi: "Cọ trộn", id: "Kuas Campur", ru: "Кисть смешивания", th: "แปรงผสม" },
  "tool.circle": { en: "Draw a circle", vi: "Vẽ hình tròn", id: "Gambar lingkaran", ru: "Нарисовать круг", th: "วาดวงกลม" },
  "tool.copy": { en: "Copy", vi: "Sao chép", id: "Salin", ru: "Копировать", th: "คัดลอก" },
  "tool.crop": { en: "Crop", vi: "Cắt", id: "Pangkas", ru: "Обрезать", th: "ตัด" },
  "tool.cut": { en: "Cut", vi: "Cắt (Cut)", id: "Potong", ru: "Вырезать", th: "ตัด" },
  "tool.dither-brush": { en: "Dither (checkerboard) pattern brush for blending", vi: "Cọ lưới (checkerboard) tạo hiệu ứng blending", id: "Kuas pola dither (papan catur) untuk pencampuran", ru: "Кисть с рисунком (шахматная доска) для смешивания", th: "แปรงลายจุด (กระดานหมากรุก) สำหรับผสม" },
  "tool.ditherBrush": { en: "Dither Brush", vi: "Cọ lưới", id: "Kuas Dither", ru: "Кисть дитеринга", th: "แปรง Dither" },
  "tool.eraser": { en: "Erase drawn pixels", vi: "Xóa pixel đã vẽ", id: "Hapus piksel yang digambar", ru: "Стирать нарисованные пиксели", th: "ลบพิกเซลที่วาดไว้" },
  "tool.fill": { en: "Fill", vi: "Đổ đầy vùng liền kề cùng màu", id: "Isi", ru: "Заливка", th: "เทสี" },
  "tool.highlight-pen": { en: "Draw lighter highlight pixels", vi: "Vẽ điểm sáng nổi bật", id: "Gambar piksel sorotan lebih terang", ru: "Рисовать светлые акцентные пиксели", th: "วาดพิกเซลเน้นสีสว่าง" },
  "tool.highlightPen": { en: "Highlight Pen", vi: "Bút sáng", id: "Pena Sorotan", ru: "Маркер выделения", th: "ปากกาเน้น" },
  "tool.line": { en: "Draw a straight line", vi: "Vẽ một đường thẳng", id: "Gambar garis lurus", ru: "Нарисовать прямую линию", th: "วาดเส้นตรง" },
  "tool.magicEraser": { en: "Magic Eraser", vi: "Tự động xóa nền hoặc vùng màu", id: "Penghapus Ajaib", ru: "Волшебный ластик", th: "ยางลบวิเศษ" },
  "tool.outline": { en: "Outline", vi: "Vẽ viền quanh hình vẽ", id: "Garis Luar", ru: "Контур", th: "เส้นรอบนอก" },
  "tool.pan": { en: "Pan around the canvas", vi: "Di chuyển vùng xem canvas", id: "Geser di sekitar kanvas", ru: "Перемещение по холсту", th: "เลื่อนรอบผืนผ้าใบ" },
  "tool.paste": { en: "Paste", vi: "Dán", id: "Tempel", ru: "Вставить", th: "วาง" },
  "tool.picker": { en: "Color Picker", vi: "Lấy màu từ pixel có sẵn", id: "Pemilih Warna", ru: "Пипетка", th: "eyedropper" },
  "tool.pixel-pen": { en: "Draw precise pixels", vi: "Vẽ từng pixel chính xác", id: "Gambar piksel presisi", ru: "Рисовать точные пиксели", th: "วาดพิกเซลแม่นยำ" },
  "tool.pixelPen": { en: "Pixel Pen", vi: "Bút pixel", id: "Pena Piksel", ru: "Пиксельная ручка", th: "ปากกาพิกเซล" },
  "tool.rect": { en: "Draw a rectangle", vi: "Vẽ hình chữ nhật", id: "Gambar persegi panjang", ru: "Нарисовать прямоугольник", th: "วาดสี่เหลี่ยม" },
  "tool.replaceColor": { en: "Replace one color with another", vi: "Thay toàn bộ 1 màu bằng màu khác", id: "Ganti satu warna dengan warna lain", ru: "Заменить один цвет другим", th: "แทนที่สีหนึ่งด้วยอีกสีหนึ่ง" },
  "tool.select": { en: "Select", vi: "Chọn vùng", id: "Pilih", ru: "Выделение", th: "เลือก" },
  "tool.soft-brush": { en: "Soft brush with fading edges", vi: "Cọ mềm (soft brush) làm mờ xung quanh điểm vẽ", id: "Kuas lembut dengan tepi memudar", ru: "Мягкая кисть с затухающими краями", th: "แปรงนุ่มพร้อมขอบจาง" },
  "tool.softBrush": { en: "Soft Brush", vi: "Cọ mềm", id: "Kuas Lembut", ru: "Мягкая кисть", th: "แปรงนุ่ม" },
  "tool.spray-pen": { en: "Spray scattered pixels", vi: "Phun màu rải rác ngẫu nhiên", id: "Semprotkan piksel tersebar", ru: "Разбрызгивать пиксели", th: "พ่นพิกเซลกระจาย" },
  "tool.sprayPen": { en: "Spray Pen", vi: "Phun màu", id: "Pena Semprot", ru: "Ручка-распылитель", th: "ปากกาพ่น" },
  "tool.text": { en: "Text Tool", vi: "Chèn chữ (Text)", id: "Alat Teks", ru: "Текст", th: "ข้อความ" },
  "toolLayout.backHome": { en: "Back to home", vi: "Về trang chủ", id: "Kembali ke beranda", ru: "Вернуться на главную", th: "กลับหน้าแรก" },
  "toolLayout.editor": { en: "🎨 Editor", vi: "🎨 Editor", id: "🎨 Editor", ru: "🎨 Редактор", th: "🎨 ตัวแก้ไข" },
  "toolVariant.circle": { en: "Circle", vi: "Hình tròn", id: "Lingkaran", ru: "Круг", th: "วงกลม" },
  "toolVariant.eraser": { en: "Eraser", vi: "Tẩy", id: "Penghapus", ru: "Ластик", th: "ยางลบ" },
  "toolVariant.fill": { en: "Fill", vi: "Đổ màu", id: "Isi", ru: "Заливка", th: "เทสี" },
  "toolVariant.line": { en: "Line", vi: "Đường thẳng", id: "Garis", ru: "Линия", th: "เส้น" },
  "toolVariant.magic": { en: "Magic Eraser", vi: "Xóa nền", id: "Penghapus Ajaib", ru: "Волшебный ластик", th: "ยางลบวิเศษ" },
  "toolVariant.outline": { en: "Outline", vi: "Tạo viền", id: "Garis Luar", ru: "Контур", th: "เส้นรอบนอก" },
  "toolVariant.picker": { en: "Color Picker", vi: "Lấy màu", id: "Pemilih Warna", ru: "Пипетка", th: "eyedropper" },
  "toolVariant.rect": { en: "Rectangle", vi: "Hình chữ nhật", id: "Persegi Panjang", ru: "Прямоугольник", th: "สี่เหลี่ยม" },
  "toolbarReset.error": { en: "Error restoring toolbar state", vi: "Lỗi khi phục hồi toolbar state", id: "Kesalahan memulihkan status toolbar", ru: "Ошибка восстановления панели инструментов", th: "ข้อผิดพลาดในการกู้คืนแถบเครื่องมือ" },
  "tooltip.anchorBottomCenter": { en: "Bottom Center", vi: "Neo giữa phía dưới", id: "Tengah Bawah", ru: "Снизу по центру", th: "ล่างตรงกลาง" },
  "tooltip.anchorBottomLeft": { en: "Bottom Left", vi: "Neo góc dưới bên trái", id: "Kiri Bawah", ru: "Снизу слева", th: "ล่างซ้าย" },
  "tooltip.anchorBottomRight": { en: "Bottom Right", vi: "Neo góc dưới bên phải", id: "Kanan Bawah", ru: "Снизу справа", th: "ล่างขวา" },
  "tooltip.anchorCenter": { en: "Center", vi: "Canh giữa", id: "Tengah", ru: "По центру", th: "ตรงกลาง" },
  "tooltip.anchorCenterLeft": { en: "Center Left", vi: "Neo giữa bên trái", id: "Tengah Kiri", ru: "По центру слева", th: "กลางซ้าย" },
  "tooltip.anchorCenterRight": { en: "Center Right", vi: "Neo giữa bên phải", id: "Tengah Kanan", ru: "По центру справа", th: "กลางขวา" },
  "tooltip.anchorTopCenter": { en: "Top Center", vi: "Neo giữa phía trên", id: "Tengah Atas", ru: "Сверху по центру", th: "บนตรงกลาง" },
  "tooltip.anchorTopLeft": { en: "Top Left", vi: "Neo góc trên bên trái", id: "Kiri Atas", ru: "Сверху слева", th: "บนซ้าย" },
  "tooltip.anchorTopRight": { en: "Top Right", vi: "Neo góc trên bên phải", id: "Kanan Atas", ru: "Сверху справа", th: "บนขวา" },
  "tooltip.animExport": { en: "Export as animation", vi: "Xuất ảnh động", id: "Ekspor sebagai animasi", ru: "Экспорт как анимация", th: "ส่งออกเป็นภาพเคลื่อนไหว" },
  "tooltip.cancelDownload": { en: "Cancel download", vi: "Hủy tải", id: "Batalkan unduhan", ru: "Отменить скачивание", th: "ยกเลิกการดาวน์โหลด" },
  "tooltip.closeModal": { en: "Close modal", vi: "Đóng", id: "Tutup modal", ru: "Закрыть модальное окно", th: "ปิดหน้าต่าง" },
  "tooltip.collapseAnimStrip": { en: "Collapse", vi: "Thu gọn", id: "Ciutkan", ru: "Свернуть", th: "ย่อ" },
  "tooltip.collapseToolbar": { en: "Collapse / Expand", vi: "Thu gọn / Mở rộng", id: "Ciutkan / Perluas", ru: "Свернуть / Развернуть", th: "ย่อ / ขยาย" },
  "tooltip.computerSource": { en: "Upload from computer", vi: "Tải lên từ máy tính", id: "Unggah dari komputer", ru: "Загрузить с компьютера", th: "อัปโหลดจากคอมพิวเตอร์" },
  "tooltip.copy": { en: "Copy (Ctrl+C)", vi: "Sao chép (Ctrl+C)", id: "Salin (Ctrl+C)", ru: "Копировать (Ctrl+C)", th: "คัดลอก (Ctrl+C)" },
  "tooltip.copyDesc": { en: "Copy selected area", vi: "Sao chép phần đang chọn", id: "Salin area yang dipilih", ru: "Копировать выделенную область", th: "คัดลอกบริเวณที่เลือก" },
  "tooltip.cut": { en: "Cut (Ctrl+X)", vi: "Cắt (Ctrl+X)", id: "Potong (Ctrl+X)", ru: "Вырезать (Ctrl+X)", th: "ตัด (Ctrl+X)" },
  "tooltip.cutDesc": { en: "Cut selected area", vi: "Cắt phần đang chọn", id: "Potong area yang dipilih", ru: "Вырезать выделенную область", th: "ตัดบริเวณที่เลือก" },
  "tooltip.deleteFrame": { en: "Delete this frame", vi: "Xóa trang này", id: "Hapus bingkai ini", ru: "Удалить этот кадр", th: "ลบเฟรมนี้" },
  "tooltip.deleteImage": { en: "Delete", vi: "Xóa", id: "Hapus", ru: "Удалить", th: "ลบ" },
  "tooltip.downloadDest": { en: "Download to device", vi: "Tải xuống máy", id: "Unduh ke perangkat", ru: "Скачать на устройство", th: "ดาวน์โหลดลงอุปกรณ์" },
  "tooltip.driveDest": { en: "Save to Google Drive", vi: "Lưu lên Google Drive", id: "Simpan ke Google Drive", ru: "Сохранить в Google Drive", th: "บันทึกลง Google Drive" },
  "tooltip.driveSource": { en: "Upload from Google Drive", vi: "Tải lên từ Google Drive", id: "Unggah dari Google Drive", ru: "Загрузить из Google Drive", th: "อัปโหลดจาก Google Drive" },
  "tooltip.eraserSize": { en: "Change eraser size", vi: "Đổi cỡ đầu tẩy", id: "Ubah ukuran penghapus", ru: "Изменить размер ластика", th: "เปลี่ยนขนาดยางลบ" },
  "tooltip.executeDownload": { en: "Execute download", vi: "Tiến hành tải", id: "Jalankan unduhan", ru: "Выполнить скачивание", th: "ดำเนินการดาวน์โหลด" },
  "tooltip.expandAnimStrip": { en: "Expand animation strip", vi: "Mở thanh trang vẽ", id: "Perluas strip animasi", ru: "Развернуть панель анимации", th: "ขยายแถบภาพเคลื่อนไหว" },
  "tooltip.fitInside": { en: "Fit (Keep entire image in frame)", vi: "Vừa khít (Giữ toàn bộ ảnh trong khung)", id: "Sesuaikan (Pertahankan seluruh gambar dalam bingkai)", ru: "Вписать (сохранить всё изображение в кадре)", th: "พอดี (เก็บรูปภาพทั้งหมดในเฟรม)" },
  "tooltip.flattenBg": { en: "Merge background into canvas", vi: "Gộp nền vào canvas vĩnh viễn", id: "Gabungkan latar ke kanvas", ru: "Объединить фон с холстом", th: "รวมพื้นหลังกับผืนผ้าใบ" },
  "tooltip.frameNumber": { en: "Page {0}", vi: "Trang {0}", id: "Halaman {0}", ru: "Страница {0}", th: "หน้า {0}" },
  "tooltip.gradientMode": { en: "Gradient", vi: "Gradient", id: "Gradien", ru: "Градиент", th: "เกรเดียนต์" },
  "tooltip.gridSize": { en: "Change canvas dimensions", vi: "Đổi kích thước canvas", id: "Ubah dimensi kanvas", ru: "Изменить размеры холста", th: "เปลี่ยนขนาดผืนผ้าใบ" },
  "tooltip.indexMode": { en: "Use integer key format (like export format)", vi: "Dùng Key là số nguyên (giống định dạng tải về từ máy)", id: "Gunakan format kunci bilangan bulat (seperti format ekspor)", ru: "Использовать формат целочисленных ключей", th: "ใช้รูปแบบคีย์จำนวนเต็ม" },
  "tooltip.insertAfter": { en: "Insert frame after", vi: "Chèn trang sau", id: "Sisipkan bingkai setelah", ru: "Вставить кадр после", th: "แทรกเฟรมหลัง" },
  "tooltip.insertBefore": { en: "Insert frame before", vi: "Chèn trang trước", id: "Sisipkan bingkai sebelum", ru: "Вставить кадр перед", th: "แทรกเฟรมก่อน" },
  "tooltip.localDest": { en: "Save to local device", vi: "Lưu xuống máy tính", id: "Simpan ke perangkat lokal", ru: "Сохранить на локальное устройство", th: "บันทึกลงอุปกรณ์ท้องถิ่น" },
  "tooltip.login": { en: "Login to save on Drive", vi: "Đăng nhập để lưu trên Drive", id: "Masuk untuk menyimpan di Drive", ru: "Войти для сохранения на Drive", th: "เข้าสู่ระบบเพื่อบันทึกลง Drive" },
  "tooltip.mirrorMode": { en: "Mirror", vi: "Đối xứng", id: "Cermin", ru: "Зеркало", th: "กระจก" },
  "tooltip.newCanvas": { en: "Create blank canvas in new tab", vi: "Tạo canvas trắng ở tab mới", id: "Buat kanvas kosong di tab baru", ru: "Создать пустой холст на новой вкладке", th: "สร้างผืนผ้าใบว่างบนแท็บใหม่" },
  "tooltip.nextFrame": { en: "Next frame", vi: "Trang sau", id: "Bingkai berikutnya", ru: "Следующий кадр", th: "เฟรมถัดไป" },
  "tooltip.onionSkin": { en: "View previous frame (onion skin)", vi: "Xem trang trước (onion skin)", id: "Lihat bingkai sebelumnya (onion skin)", ru: "Просмотреть предыдущий кадр", th: "ดูเฟรมก่อนหน้า" },
  "tooltip.paste": { en: "Paste (Ctrl+V)", vi: "Dán (Ctrl+V)", id: "Tempel (Ctrl+V)", ru: "Вставить (Ctrl+V)", th: "วาง (Ctrl+V)" },
  "tooltip.pasteDesc": { en: "Paste copied area", vi: "Dán phần đã sao chép", id: "Tempel area yang disalin", ru: "Вставить скопированную область", th: "วางบริเวณที่คัดลอก" },
  "tooltip.pasteImage": { en: "Click to Paste, Right-click to Pin", vi: "Click để Dán, chuột phải để Ghim", id: "Klik untuk Tempel, Klik kanan untuk Semat", ru: "Нажмите для вставки, правый клик для закрепления", th: "คลิกเพื่อวาง คลิกขวาเพื่อปักหมุด" },
  "tooltip.pasteJsonSource": { en: "Paste JSON code", vi: "Dán mã JSON", id: "Tempel kode JSON", ru: "Вставить код JSON", th: "วางโค้ด JSON" },
  "tooltip.pencilSize": { en: "Change pen brush size", vi: "Đổi cỡ đầu bút vẽ", id: "Ubah ukuran kuas pena", ru: "Изменить размер кисти", th: "เปลี่ยนขนาดแปรง" },
  "tooltip.pin": { en: "Pin", vi: "Ghim", id: "Semat", ru: "Закрепить", th: "ปักหมุด" },
  "tooltip.prevFrame": { en: "Previous frame", vi: "Trang trước", id: "Bingkai sebelumnya", ru: "Предыдущий кадр", th: "เฟรมก่อนหน้า" },
  "tooltip.primaryColor": { en: "Choose primary draw color", vi: "Chọn màu vẽ chính", id: "Pilih warna gambar utama", ru: "Выбрать основной цвет рисования", th: "เลือกสีวาดหลัก" },
  "tooltip.redo": { en: "Redo undone action", vi: "Làm lại thao tác đã hoàn tác", id: "Ulangi tindakan yang diurungkan", ru: "Повторить отменённое действие", th: "ทำซ้ำการกระทำที่เลิกทำ" },
  "tooltip.renameTab": { en: "Double-click to rename tab", vi: "Nhấp đúp để đổi tên tab", id: "Klik dua kali untuk mengganti nama tab", ru: "Дважды нажмите для переименования вкладки", th: "ดับเบิลคลิกเพื่อเปลี่ยนชื่อแท็บ" },
  "tooltip.replaceBg": { en: "Replace background image", vi: "Thay ảnh nền khác", id: "Ganti gambar latar", ru: "Заменить фоновое изображение", th: "เปลี่ยนรูปภาพพื้นหลัง" },
  "tooltip.replaceTolerance": { en: "Color Tolerance", vi: "Độ sai lệch màu", id: "Toleransi Warna", ru: "Допуск цвета", th: "ค่าความทนทานสี" },
  "tooltip.resetAnchor": { en: "Reset to default", vi: "Khôi phục mặc định", id: "Kembalikan ke default", ru: "Сбросить по умолчанию", th: "รีเซ็ตเป็นค่าเริ่มต้น" },
  "tooltip.rulerMode": { en: "Ruler", vi: "Thước đo", id: "Penggaris", ru: "Линейка", th: "ไม้บรรทัด" },
  "tooltip.secondaryColor": { en: "Choose secondary draw color", vi: "Chọn màu vẽ phụ", id: "Pilih warna gambar sekunder", ru: "Выбрать дополнительный цвет рисования", th: "เลือกสีวาดรอง" },
  "tooltip.setBg": { en: "Set image as reference background", vi: "Đặt ảnh làm nền tham chiếu", id: "Setel gambar sebagai latar referensi", ru: "Установить изображение как фон", th: "ตั้งรูปภาพเป็นพื้นหลังอ้างอิง" },
  "tooltip.settings": { en: "Settings", vi: "Cài đặt", id: "Pengaturan", ru: "Настройки", th: "ตั้งค่า" },
  "tooltip.showGrid": { en: "Show Grid", vi: "Lưới", id: "Tampilkan Kisi", ru: "Показать сетку", th: "แสดงตาราง" },
  "tooltip.sprayDensity": { en: "Pixels released per spray", vi: "Số điểm ảnh mỗi lần phun", id: "Piksel yang dilepaskan per semprotan", ru: "Пикселей при распылении", th: "พิกเซลต่อการพ่น" },
  "tooltip.spraySize": { en: "Size of spray area", vi: "Kích thước vùng phun màu", id: "Ukuran area semprotan", ru: "Размер области распыления", th: "ขนาดพื้นที่พ่น" },
  "tooltip.staticExport": { en: "Export as static image", vi: "Xuất ảnh tĩnh", id: "Ekspor sebagai gambar statis", ru: "Экспорт как статичное изображение", th: "ส่งออกเป็นรูปภาพคงที่" },
  "tooltip.swapColors": { en: "Swap primary and secondary colors", vi: "Đảo màu chính và màu phụ", id: "Tukar warna primer dan sekunder", ru: "Поменять основной и дополнительный цвета", th: "สลับสีหลักและสีรอง" },
  "tooltip.toggleNav": { en: "Show or hide navigation bar", vi: "Ẩn/hiện thanh điều hướng", id: "Tampilkan atau sembunyikan bilah navigasi", ru: "Показать или скрыть панель навигации", th: "แสดงหรือซ่อนแถบนำทาง" },
  "tooltip.toggleTools": { en: "Show or hide tool panel", vi: "Ẩn/hiện bảng công cụ", id: "Tampilkan atau sembunyikan panel alat", ru: "Показать или скрыть панель инструментов", th: "แสดงหรือซ่อนแผงเครื่องมือ" },
  "tooltip.transparentBg": { en: "Toggle transparent background", vi: "Bật/tắt nền trong suốt", id: "Aktifkan/nonaktifkan latar transparan", ru: "Переключить прозрачный фон", th: "สลับพื้นหลังโปร่งใส" },
  "tooltip.undo": { en: "Undo last action", vi: "Hoàn tác thao tác vừa làm", id: "Urungkan tindakan terakhir", ru: "Отменить последнее действие", th: "เลิกทำกระทำล่าสุด" },
  "tooltip.unpin": { en: "Unpin", vi: "Bỏ ghim", id: "Lepas sematan", ru: "Открепить", th: "เลิกปักหมุด" },
  "tooltip.uploadFull": { en: "Open image or JSON project file", vi: "Mở ảnh hoặc file JSON dự án", id: "Buka gambar atau file proyek JSON", ru: "Открыть изображение или JSON файл проекта", th: "เปิดรูปภาพหรือไฟล์ JSON โปรเจกต์" },
  "tooltip.viewAnimation": { en: "View Animation", vi: "Xem Animation", id: "Lihat Animasi", ru: "Просмотреть анимацию", th: "ดูภาพเคลื่อนไหว" },
  "tooltip.viewSource": { en: "View Source Image", vi: "Xem ảnh gốc", id: "Lihat Gambar Sumber", ru: "Просмотреть исходное изображение", th: "ดูรูปภาพต้นฉบับ" },
  "tooltip.zoomIn": { en: "Zoom in on canvas", vi: "Phóng to canvas", id: "Perbesar kanvas", ru: "Приблизить холст", th: "ซูมเข้าผืนผ้าใบ" },
  "tooltip.zoomOut": { en: "Zoom out on canvas", vi: "Thu nhỏ canvas", id: "Perkecil kanvas", ru: "Отдалить холст", th: "ซูมออกผืนผ้าใบ" },
  "tooltip.zoomReset": { en: "Fit canvas to screen", vi: "Canh vừa khung nhìn", id: "Sesuaikan kanvas ke layar", ru: "Вписать холст в экран", th: "พอดีผืนผ้าใบกับหน้าจอ" },
  "transform.flipH": { en: "Flip Horizontal", vi: "Lật ngang", id: "Balik Horizontal", ru: "Отразить по горизонтали", th: "พลิกแนวนอน" },
  "transform.flipV": { en: "Flip Vertical", vi: "Lật dọc", id: "Balik Vertikal", ru: "Отразить по вертикали", th: "พลิกแนวตั้ง" },
  "transform.rotate": { en: "Rotate", vi: "Xoay", id: "Putar", ru: "Повернуть", th: "หมุน" },
  "transform.trim": { en: "Trim Canvas", vi: "Xén canvas", id: "Pangkas Kanvas", ru: "Обрезать холст", th: "ตัดผืนผ้าใบ" },
  "troubleshoot.desc": { en: "If the app has an error or gets stuck, you can clear all local data to restore it to its initial state.", vi: "Nếu ứng dụng bị lỗi hoặc kẹt, bạn có thể xóa toàn bộ dữ liệu cục bộ để khôi phục lại trạng thái ban đầu.", id: "Jika aplikasi mengalami kesalahan atau macet, Anda dapat menghapus semua data lokal untuk mengembalikannya ke keadaan awal.", ru: "Если приложение работает с ошибками, вы можете очистить все локальные данные, чтобы вернуть его к исходному состоянию.", th: "หากแอปมีข้อผิดพลาดหรือค้าง คุณสามารถล้างข้อมูลท้องถิ่นทั้งหมดเพื่อกลับสู่สถานะเริ่มต้น" },
  "troubleshoot.reset": { en: "Restore Original Data (Reset)", vi: "Khôi phục dữ liệu gốc (Reset)", id: "Pulihkan Data Asli (Reset)", ru: "Восстановить исходные данные (Сброс)", th: "กู้คืนข้อมูลต้นฉบับ (รีเซ็ต)" },
  "troubleshoot.title": { en: "Troubleshooting", vi: "Khắc phục sự cố", id: "Pemecahan Masalah", ru: "Устранение неполадок", th: "การแก้ไขปัญหา" },
  "upload.confirmSpriteAnim": { en: "Do you want to open this Spritesheet as an Animation?\n- OK: Split into animation frames\n- Cancel: Keep as static image", vi: "Bạn có muốn mở Spritesheet này dưới dạng Ảnh động (Animation) không?\n- OK: Cắt thành các frame ảnh động\n- Hủy: Giữ nguyên ảnh tĩnh", id: "Apakah Anda ingin membuka Spritesheet ini sebagai Animasi?\n- OK: Bagi menjadi bingkai animasi\n- Batal: Pertahankan sebagai gambar statis", ru: "Вы хотите открыть этот спрайтшит как анимацию?- ОК: Разделить на кадры анимации- Отмена: Оставить как статичное изображение", th: "คุณต้องการเปิด Sprite Sheet นี้เป็นภาพเคลื่อนไหวหรือไม่?- ตกลง: แยกเป็นเฟรมภาพเคลื่อนไหว- ยกเลิก: เก็บเป็นรูปภาพคงที่" },
  "upload.maxFilesError": { en: "Exceeded maximum allowed files", vi: "Vượt quá số lượng file cho phép", id: "Melebihi jumlah file maksimum yang diizinkan", ru: "Превышен максимально допустимый файлов", th: "เกินจำนวนไฟล์สูงสุดที่อนุญาต" },
  "upload.mixFileError": { en: "Cannot upload mixed file types at once", vi: "Không thể tải lên nhiều loại file cùng lúc", id: "Tidak dapat mengunggah jenis file campuran sekaligus", ru: "Невозможно загрузить смешанные типы файлов одновременно", th: "ไม่สามารถอัปโหลดไฟล์หลายประเภทพร้อมกันได้" },
  "upload.multiFallbackConfirm": { en: "You are uploading multiple files. Do you want to open them as separate tabs?", vi: "Bạn đang tải lên nhiều file. Bạn có muốn mở chúng thành các Tab riêng biệt không?", id: "Anda mengunggah banyak file. Apakah Anda ingin membukanya sebagai tab terpisah?", ru: "Вы загружаете несколько файлов. Хотите открыть их как отдельные вкладки?", th: "คุณกำลังอัปโหลดหลายไฟล์ ต้องการเปิดเป็นแท็บแยกหรือไม่?" },
  "upload.overrideAnimConfirm": { en: "You are in animation mode. Overwrite mode will delete all old frames and keep only a single image. Are you sure you want to continue?", vi: "Bạn đang mở chế độ ảnh động. Chế độ Ghi đè sẽ xóa toàn bộ frame cũ và chỉ giữ lại 1 hình ảnh duy nhất. Bạn có chắc chắn muốn tiếp tục không?", id: "Anda dalam mode animasi. Mode Timpa akan menghapus semua bingkai lama dan hanya menyimpan satu gambar. Anda yakin ingin melanjutkan?", ru: "Вы в режиме анимации. Режим перезаписи удалит все старые кадры и оставит только одно изображение. Вы уверены?", th: "คุณอยู่ในโหมดภาพเคลื่อนไหว โหมดเขียนทับจะลบทุกเฟรมเก่าและเก็บรูปภาพเดียว คุณแน่ใจหรือ?" },
  "upload.promptSpriteFrames": { en: "Enter the number of frames for this spritesheet:", vi: "Nhập số lượng frame cho spritesheet này:", id: "Masukkan jumlah bingkai untuk spritesheet ini:", ru: "Введите количество кадров для этого спрайтшита:", th: "ป้อนจำนวนเฟรมสำหรับ Sprite Sheet นี้:" },
  "upload.singleFileOverrideError": { en: "Overwrite mode only supports uploading a single file.", vi: "Chế độ Ghi đè chỉ hỗ trợ tải lên 1 file duy nhất.", id: "Mode Timpa hanya mendukung mengunggah satu file.", ru: "Режим перезаписи поддерживает только загрузку одного файла.", th: "โหมดเขียนทับรองรับเฉพาะการอัปโหลดไฟล์เดียว" },
  "upload.singleVideoError": { en: "Only 1 Video file can be uploaded at a time.", vi: "Chỉ hỗ trợ tải lên 1 file Video mỗi lần.", id: "Hanya 1 file Video yang dapat diunggah sekaligus.", ru: "За раз можно загрузить только 1 видеофайл.", th: "อัปโหลดได้เพียง 1 ไฟล์วิดีโอต่อครั้ง" },
  "upload.singleZipError": { en: "Only 1 ZIP file can be uploaded at a time.", vi: "Chỉ hỗ trợ tải lên 1 file ZIP mỗi lần.", id: "Hanya 1 file ZIP yang dapat diunggah sekaligus.", ru: "За раз можно загрузить только 1 ZIP-файл.", th: "อัปโหลดได้เพียง 1 ไฟล์ ZIP ต่อครั้ง" },
  "upload.skipFilesError": { en: "Skipped unsupported files: {0}", vi: "Bỏ qua các file không hỗ trợ: {0}", id: "File yang tidak didukung dilewati: {0}", ru: "Пропущены неподдерживаемые файлы: {0}", th: "ข้ามไฟล์ที่ไม่รองรับ: {0}" },
  "uploadAnim.extractingFrame": { en: "Extracting video frame {0}/{1}...", vi: "Đang tách frame video {0}/{1}...", id: "Mengekstrak bingkai video {0}/{1}...", ru: "Извлечение кадра видео {0}/{1}...", th: "กำลังแยกเฟรมวิดีโอ {0}/{1}..." },
  "uploadAnim.gifError": { en: "Error reading GIF: {0}", vi: "Lỗi khi đọc GIF: {0}", id: "Kesalahan membaca GIF: {0}", ru: "Ошибка чтения GIF: {0}", th: "ข้อผิดพลาดในการอ่าน GIF: {0}" },
  "uploadAnim.gifSuccess": { en: "GIF loaded successfully ({0} frames)", vi: "Đã tải GIF thành công ({0} frames)", id: "GIF berhasil dimuat ({0} bingkai)", ru: "GIF успешно загружен ({0} кадров)", th: "โหลด GIF สำเร็จ ({0} เฟรม)" },
  "uploadAnim.gifWarning": { en: "Warning: Large GIF or many frames may freeze the browser. Continue processing...", vi: "Cảnh báo: GIF lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý...", id: "Peringatan: GIF besar atau banyak bingkai dapat membekukan browser. Lanjutkan memproses...", ru: "Внимание: Большой GIF или много кадров могут заморозить браузер. Продолжаем...", th: "คำเตือน: GIF ขนาดใหญ่หรือเฟรมจำนวนมากอาจทำให้เบราว์เซอร์ค้าง ดำเนินการต่อ..." },
  "uploadAnim.invalidFps": { en: "Invalid FPS.", vi: "FPS không hợp lệ.", id: "FPS tidak valid.", ru: "Неверный FPS.", th: "FPS ไม่ถูกต้อง" },
  "uploadAnim.noPngInZip": { en: "No .png files found in ZIP.", vi: "Không tìm thấy file .png nào trong ZIP.", id: "Tidak ada file .png ditemukan di ZIP.", ru: "Файлы .png не найдены в ZIP.", th: "ไม่พบไฟล์ .png ใน ZIP" },
  "uploadAnim.processingFrame": { en: "Processing frame {0}/{1}...", vi: "Đang xử lý frame {0}/{1}...", id: "Memproses bingkai {0}/{1}...", ru: "Обработка кадра {0}/{1}...", th: "กำลังประมวลผลเฟรม {0}/{1}..." },
  "uploadAnim.promptFps": { en: "Enter the number of frames per second (FPS) to extract:", vi: "Nhập số khung hình trên giây (FPS) muốn tách:", id: "Masukkan jumlah bingkai per detik (FPS) untuk diekstrak:", ru: "Введите количество кадров в секунду (FPS) для извлечения:", th: "ป้อนจำนวนเฟรมต่อวินาที (FPS) สำหรับแยก:" },
  "uploadAnim.spriteSuccess": { en: "Sprite Sheet loaded successfully ({0} frames)", vi: "Đã tải Sprite Sheet thành công ({0} frames)", id: "Sprite Sheet berhasil dimuat ({0} bingkai)", ru: "Sprite Sheet успешно загружен ({0} кадров)", th: "โหลด Sprite Sheet สำเร็จ ({0} เฟรม)" },
  "uploadAnim.videoError": { en: "Error reading Video: {0}", vi: "Lỗi khi đọc Video: {0}", id: "Kesalahan membaca Video: {0}", ru: "Ошибка чтения видео: {0}", th: "ข้อผิดพลาดในการอ่านวิดีโอ: {0}" },
  "uploadAnim.videoSuccess": { en: "Video loaded successfully ({0} frames)", vi: "Đã tải Video thành công ({0} frames)", id: "Video berhasil dimuat ({0} bingkai)", ru: "Видео успешно загружено ({0} кадров)", th: "โหลดวิดีโอสำเร็จ ({0} เฟรม)" },
  "uploadAnim.videoWarning": { en: "Warning: Large Video or many frames may freeze the browser. Continue processing...", vi: "Cảnh báo: Video lớn hoặc nhiều frame có thể làm đơ trình duyệt. Tiếp tục xử lý...", id: "Peringatan: Video besar atau banyak bingkai dapat membekukan browser. Lanjutkan memproses...", ru: "Внимание: Большое видео или много кадров могут заморозить браузер. Продолжаем...", th: "คำเตือน: วิดีโอขนาดใหญ่หรือเฟรมจำนวนมากอาจทำให้เบราว์เซอร์ค้าง ดำเนินการต่อ..." },
  "uploadAnim.zipError": { en: "Error reading ZIP: {0}", vi: "Lỗi khi đọc ZIP: {0}", id: "Kesalahan membaca ZIP: {0}", ru: "Ошибка чтения ZIP: {0}", th: "ข้อผิดพลาดในการอ่าน ZIP: {0}" },
  "uploadAnim.zipSuccess": { en: "ZIP loaded successfully ({0} frames)", vi: "Đã tải ZIP thành công ({0} frames)", id: "ZIP berhasil dimuat ({0} bingkai)", ru: "ZIP успешно загружен ({0} кадров)", th: "โหลด ZIP สำเร็จ ({0} เฟรม)" },
  "uploadModal.readImageError": { en: "Error reading image file", vi: "Lỗi đọc file ảnh", id: "Kesalahan membaca file gambar", ru: "Ошибка чтения файла изображения", th: "ข้อผิดพลาดในการอ่านไฟล์รูปภาพ" },
  "userInput.approve": { en: "Approve", vi: "Đồng ý", id: "Setujui", ru: "Одобрить", th: "อนุมัติ" },
  "userInput.autoSubmitIn": { en: "Auto-submitting in:", vi: "Tự động gửi sau:", id: "Kirim otomatis dalam:", ru: "Автоматическая отправка через:", th: "ส่งอัตโนมัติใน:" },
  "userInput.autoSubmitted": { en: " (Auto-submitted by system due to 15s timeout)", vi: " (Hệ thống tự gửi do quá 15 giây)", id: " (Dikirim otomatis oleh sistem karena batas waktu 15 detik)", ru: " (Автоматически отправлено системой из-за тайм-аута 15 секунд)", th: " (ส่งอัตโนมัติโดยระบบเนื่องจากหมดเวลา 15 วินาที)" },
  "userInput.cancel": { en: "Cancel", vi: "Hủy", id: "Batal", ru: "Отмена", th: "ยกเลิก" },
  "userInput.desc": { en: "The AI assistant is waiting for your input to proceed.", vi: "Trợ lý AI đang chờ bạn nhập dữ liệu để tiếp tục.", id: "Asisten AI menunggu input Anda untuk melanjutkan.", ru: "AI-ассистент ждёт вашего ввода для продолжения.", th: "ผู้ช่วย AI รอการป้อนข้อมูลของคุณเพื่อดำเนินการต่อ" },
  "userInput.height": { en: "Height", vi: "Chiều cao", id: "Tinggi", ru: "Высота", th: "สูง" },
  "userInput.reject": { en: "Reject", vi: "Từ chối", id: "Tolak", ru: "Отклонить", th: "ปฏิเสธ" },
  "userInput.rejected": { en: "User rejected/cancelled the request.", vi: "Người dùng đã từ chối/hủy yêu cầu.", id: "Pengguna menolak/membatalkan permintaan.", ru: "Пользователь отклонил/отменил запрос.", th: "ผู้ใช้ปฏิเสธ/ยกเลิกคำขอ" },
  "userInput.submit": { en: "Submit", vi: "Gửi", id: "Kirim", ru: "Отправить", th: "ส่ง" },
  "userInput.title": { en: "AI Needs Input ({0})", vi: "AI Cần Nhập Liệu ({0})", id: "AI Membutuhkan Input ({0})", ru: "AI нуждается во вводе ({0})", th: "AI ต้องการข้อมูล ({0})" },
  "userInput.width": { en: "Width", vi: "Chiều rộng", id: "Lebar", ru: "Ширина", th: "กว้าง" },
  "zoom.fit": { en: "Fit to Screen", vi: "Vừa màn hình", id: "Sesuaikan ke Layar", ru: "Вписать в экран", th: "พอดีหน้าจอ" },
  "zoom.in": { en: "Zoom In", vi: "Phóng to", id: "Perbesar", ru: "Приблизить", th: "ซูมเข้า" },
  "zoom.out": { en: "Zoom Out", vi: "Thu nhỏ", id: "Perkecil", ru: "Отдалить", th: "ซูมออก" },
};
// >>>>>>>>>> END MASTER <<<<<<<<<<

// ==========================================
// 2. SYNC — ĐỒNG BỘ MASTER → en.js / vi.js
// ==========================================
const MASTER_BLOCK_RE = /\/\/ >>>>>>>>>> BEGIN MASTER[\s\S]*?\/\/ >>>>>>>>>> END MASTER <<<<<<<<<<\r?\n/;

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

  for (const langCode of ['en', 'vi', 'id', 'ru', 'th']) {
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
      const value = MASTER[key] ? MASTER[key][langCode] : undefined;
      if (value === undefined || value === null) continue;
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
  const lineRe = /^\s*"((?:[^"\\]|\\.)*)"\s*:\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)"\s*,\s*vi:\s*"((?:[^"\\]|\\.)*)"\s*,\s*id:\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*ru:\s*"((?:[^"\\]|\\.)*)"\s*)?(?:,\s*th:\s*"((?:[^"\\]|\\.)*)"\s*)?\}\s*,?\s*$/gm;
  let m;
  while ((m = lineRe.exec(block[1])) !== null) {
    obj[unescapeJsonString(m[1])] = { en: unescapeJsonString(m[2]), vi: unescapeJsonString(m[3]), id: unescapeJsonString(m[4] || ''), ru: unescapeJsonString(m[5] || ''), th: unescapeJsonString(m[6] || '') };
  }
  return obj;
}

function generateMasterSource(merged) {
  const keys = Object.keys(merged).sort();
  let out = `// >>>>>>>>>> BEGIN MASTER (GENERATED - ${keys.length} keys - do not edit manually, use --refresh) <<<<<<<<<<\n`;
  out += 'const MASTER = {\n';
  for (const k of keys) {
    const v = merged[k];
    out += `  ${JSON.stringify(k)}: { en: ${JSON.stringify(v.en ?? '')}, vi: ${JSON.stringify(v.vi ?? '')}, id: ${JSON.stringify(v.id ?? '')}, ru: ${JSON.stringify(v.ru ?? '')}, th: ${JSON.stringify(v.th ?? '')} },\n`;
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
  const allKeys = new Set([...enKeys, ...viKeys, ...idKeys, ...ruKeys, ...thKeys, ...Object.keys(currentMaster)]);
  for (const k of allKeys) {
    if (k in enData || k in viData || k in idData || k in ruData || k in thData) {
      merged[k] = { en: enData[k] ?? '', vi: viData[k] ?? '', id: idData[k] ?? '', ru: ruData[k] ?? '', th: thData[k] ?? '' };
    } else if (k in currentMaster) {
      merged[k] = { en: currentMaster[k].en, vi: currentMaster[k].vi, id: currentMaster[k].id, ru: currentMaster[k].ru, th: currentMaster[k].th };
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
  auditDuplicates('id', ID_FILE);
  auditDuplicates('ru', RU_FILE);
  auditDuplicates('th', TH_FILE);

  printSection("2. ĐỘ PHỦ GIỮA MASTER VÀ 2 FILE NGÔN NGỮ");
  const masterKeys = Object.keys(MASTER);
  const masterSet = new Set(masterKeys);
  const orphanKeys = [...new Set([...enKeys, ...viKeys, ...idKeys, ...ruKeys, ...thKeys])].filter(k => !masterSet.has(k));
  const pendingKeys = masterKeys.filter(k => !(k in enData) && !(k in viData) && !(k in idData) && !(k in ruData) && !(k in thData));
  if (orphanKeys.length > 0) {
    report(true, `Có ${orphanKeys.length} key trong en/vi.js NHƯNG KHÔNG có trong MASTER (bỏ sót khi thêm vào MASTER):`);
    console.log("    " + orphanKeys.join(', '));
  } else reportOk("Mọi key trong en.js / vi.js đều đã có trong MASTER.");
  if (pendingKeys.length > 0) {
    report(true, `Có ${pendingKeys.length} key trong MASTER CHƯA được đồng bộ sang en/vi.js (chạy --sync):`);
    console.log("    " + pendingKeys.join(', '));
  } else reportOk("MASTER đã đồng bộ đầy đủ với cả 2 file.");

  printSection("3. KEY LỆCH GIỮA CÁC NGÔN NGỮ");
  const missingInVi = enKeys.filter(k => !(k in viData));
  const missingInEn = viKeys.filter(k => !(k in enData));
  const missingInIdFromEn = enKeys.filter(k => !(k in idData));
  const missingInRuFromEn = enKeys.filter(k => !(k in ruData));
  const missingInThFromEn = enKeys.filter(k => !(k in thData));
  if (missingInVi.length > 0) { report(true, `${missingInVi.length} key có ở EN nhưng thiếu ở VI: ${missingInVi.join(', ')}`); }
  else reportOk("VI đã có đầy đủ key so với EN.");
  if (missingInEn.length > 0) { report(true, `${missingInEn.length} key có ở VI nhưng thiếu ở EN: ${missingInEn.join(', ')}`); }
  else reportOk("EN đã có đầy đủ key so với VI.");
  if (missingInIdFromEn.length > 0) { report(false, `${missingInIdFromEn.length} key có ở EN nhưng thiếu ở ID: ${missingInIdFromEn.join(', ')}`); }
  else reportOk("ID đã có đầy đủ key so với EN.");
  if (missingInRuFromEn.length > 0) { report(false, `${missingInRuFromEn.length} key có ở EN nhưng thiếu ở RU: ${missingInRuFromEn.join(', ')}`); }
  else reportOk("RU đã có đầy đủ key so với EN.");
  if (missingInThFromEn.length > 0) { report(false, `${missingInThFromEn.length} key có ở EN nhưng thiếu ở TH: ${missingInThFromEn.join(', ')}`); }
  else reportOk("TH đã có đầy đủ key so với EN.");

  printSection("4. KEY CÓ GIÁ TRỊ RỖNG");
  const emptyVi = viKeys.filter(k => !viData[k] || String(viData[k]).trim() === "");
  const emptyEn = enKeys.filter(k => !enData[k] || String(enData[k]).trim() === "");
  const emptyId = idKeys.filter(k => !idData[k] || String(idData[k]).trim() === "");
  const emptyRu = ruKeys.filter(k => !ruData[k] || String(ruData[k]).trim() === "");
  const emptyTh = thKeys.filter(k => !thData[k] || String(thData[k]).trim() === "");
  if (emptyEn.length > 0) report(true, `${emptyEn.length} key để trống ở EN: ${emptyEn.join(', ')}`);
  else reportOk("EN không có key nào để trống.");
  if (emptyVi.length > 0) report(true, `${emptyVi.length} key để trống ở VI: ${emptyVi.join(', ')}`);
  else reportOk("VI không có key nào để trống.");
  if (emptyId.length > 0) report(false, `${emptyId.length} key để trống ở ID: ${emptyId.join(', ')}`);
  else reportOk("ID không có key nào để trống.");
  if (emptyRu.length > 0) report(false, `${emptyRu.length} key để trống ở RU: ${emptyRu.join(', ')}`);
  else reportOk("RU không có key nào để trống.");
  if (emptyTh.length > 0) report(false, `${emptyTh.length} key để trống ở TH: ${emptyTh.join(', ')}`);
  else reportOk("TH không có key nào để trống.");

  printSection("5. PLACEHOLDER LỆCH GIỮA CÁC NGÔN NGỮ ({0}, {1}...)");
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
    if (enData[k] && idData[k]) {
      const enM = String(enData[k]).match(/\{\d+\}/g) || [];
      const idM = String(idData[k]).match(/\{\d+\}/g) || [];
      if (enM.sort().join(',') !== idM.sort().join(',')) {
        report(true, `Lệch placeholder ở [${k}]: EN(${enM.join(',')}) vs ID(${idM.join(',')})`);
        phErrors++;
      }
    }
    if (enData[k] && ruData[k]) {
      const enM = String(enData[k]).match(/\{\d+\}/g) || [];
      const ruM = String(ruData[k]).match(/\{\d+\}/g) || [];
      if (enM.sort().join(',') !== ruM.sort().join(',')) {
        report(true, `Lệch placeholder ở [${k}]: EN(${enM.join(',')}) vs RU(${ruM.join(',')})`);
        phErrors++;
      }
    }
    if (enData[k] && thData[k]) {
      const enM = String(enData[k]).match(/\{\d+\}/g) || [];
      const thM = String(thData[k]).match(/\{\d+\}/g) || [];
      if (enM.sort().join(',') !== thM.sort().join(',')) {
        report(true, `Lệch placeholder ở [${k}]: EN(${enM.join(',')}) vs TH(${thM.join(',')})`);
        phErrors++;
      }
    }
  }
  if (phErrors === 0) reportOk("Không phát hiện lệch placeholder giữa các ngôn ngữ.");

  printSection("6. GIÁ TRỊ LỆCH GIỮA MASTER VÀ FILE (đổi bản dịch phải sửa MASTER)");
  let driftCount = 0;
  for (const k of masterKeys) {
    if (MASTER[k]) {
      const mEn = MASTER[k].en, mVi = MASTER[k].vi, mId = MASTER[k].id, mRu = MASTER[k].ru, mTh = MASTER[k].th;
      if ((k in enData && enData[k] !== mEn) || (k in viData && viData[k] !== mVi) || (k in idData && idData[k] !== mId) || (k in ruData && ruData[k] !== mRu) || (k in thData && thData[k] !== mTh)) driftCount++;
    }
  }
  if (driftCount > 0) {
    report(false, `${driftCount} key có giá trị trong en/vi/id/ru/th.js KHÁC với MASTER (chạy --sync --force để MASTER ghi đè):`);
    if (driftCount <= 30) {
      for (const k of masterKeys) {
        if (!MASTER[k]) continue;
        const d = [];
        if (k in enData && enData[k] !== MASTER[k].en) d.push(`EN(file="${enData[k]}", master="${MASTER[k].en}")`);
        if (k in viData && viData[k] !== MASTER[k].vi) d.push(`VI(file="${viData[k]}", master="${MASTER[k].vi}")`);
        if (k in idData && idData[k] !== MASTER[k].id) d.push(`ID(file="${idData[k]}", master="${MASTER[k].id}")`);
        if (k in ruData && ruData[k] !== MASTER[k].ru) d.push(`RU(file="${ruData[k]}", master="${MASTER[k].ru}")`);
        if (k in thData && thData[k] !== MASTER[k].th) d.push(`TH(file="${thData[k]}", master="${MASTER[k].th}")`);
        if (d.length) console.log(`    ${k}: ${d.join('; ')}`);
      }
    }
  } else reportOk("MASTER và các file ngôn ngữ đang khớp 100%.");

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
  console.log(`│ Tổng key: ${enKeys.length} (EN) / ${viKeys.length} (VI) / ${idKeys.length} (ID) / ${ruKeys.length} (RU) / ${thKeys.length} (TH) / ${masterKeys.length} (MASTER)`);
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
    console.log(`  ID: ${JSON.stringify(MASTER[key].id)}`);
    console.log(`  RU: ${JSON.stringify(MASTER[key].ru)}`);
    console.log(`  TH: ${JSON.stringify(MASTER[key].th)}`);
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
    const id = MASTER[k].id || '';
    const ru = MASTER[k].ru || '';
    const th = MASTER[k].th || '';
    if (en.toLowerCase().includes(needle) || vi.toLowerCase().includes(needle) || id.toLowerCase().includes(needle) || ru.toLowerCase().includes(needle) || th.toLowerCase().includes(needle)) {
      hits.push(k);
    }
  }
  if (hits.length === 0) {
    console.log("  Không tìm thấy key nào khớp.");
  } else {
    console.log(`  Tìm thấy ${hits.length} key:`);
    hits.forEach(k => console.log(`    ${k}\n      EN: ${JSON.stringify(MASTER[k].en)}\n      VI: ${JSON.stringify(MASTER[k].vi)}\n      ID: ${JSON.stringify(MASTER[k].id)}\n      RU: ${JSON.stringify(MASTER[k].ru)}\n      TH: ${JSON.stringify(MASTER[k].th)}`));
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
