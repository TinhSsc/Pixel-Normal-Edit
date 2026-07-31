import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderPath = __dirname;
const srcPath = path.resolve(__dirname, '..');

// ==========================================
// 1. PHẦN ĐỒNG BỘ (CONVERT / SYNC)
// ==========================================
printBox("I18N SYNC & CONVERT");
console.log("");

// 🔥 HƯỚNG DẪN THÊM KEY I18N MỚI (DÀNH CHO AI VÀ NGƯỜI DÙNG):
// Bước 1: Thêm các cặp "key": "value" mới vào object `en` và `vi` bên dưới.
// Bước 2: Chạy lệnh `node src/i18n/convert.js` (hoặc `npm run i18n`).
// Bước 3: Script sẽ tự động dò và ghi bổ sung các key CHƯA TỒN TẠI vào file `en.js` và `vi.js`.
// Lưu ý: Các key ĐÃ TỒN TẠI sẽ được GIỮ NGUYÊN (bỏ qua), không bị ghi đè hay mất dữ liệu cũ.
function printBox(title) {
  const width = 44;
  const pad = Math.max(0, width - title.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  console.log("╔" + "═".repeat(width) + "╗");
  console.log("║" + " ".repeat(left) + title + " ".repeat(right) + "║");
  console.log("╚" + "═".repeat(width) + "╝");
}

function printSection(title) {
  console.log("\n── " + title + " " + "─".repeat(Math.max(0, 50 - title.length)));
}

const languages = {
  en: {
    // ── HomePage (features/mini-tools/home/HomePage.jsx) ──
    "home.nav.home": "Home",
    "home.nav.login": "Login",
    "home.nav.features": "Features",
    "home.nav.products": "Products",
    "home.nav.contact": "Contact",
    "home.hero.badge": "Pixel Normal Edit",
    "home.hero.title": "Fast & private image processing tools.",
    "home.hero.desc": "Image processing platform running right in your browser — no account needed, no server uploads, your data belongs only to you.",
    "home.hero.cta.editor": "Pixel Editor",
    "home.hero.mockupLabel": "Professional image editing screen",
    "home.hero.stats": "2,048,391 images processed today",
    "home.products.label": "Products",
    "home.products.title": "Comprehensive toolkit",
    "home.products.subtitle": "From format conversion to advanced editing — all in one platform.",
    "home.benefits.label": "Benefits",
    "home.benefits.title": "Why choose ImgTools?",
    "home.benefits.subtitle": "Not just an image tool — it's an experience designed for modern users.",
    "home.contact.label": "Contact",
    "home.contact.title": "Connect with us",
    "home.contact.subtitle": "Have questions or want to collaborate? Our team will respond within 24 hours.",
    "home.contact.name": "Full name",
    "home.contact.namePlaceholder": "Nguyen Van A",
    "home.contact.email": "Email",
    "home.contact.emailPlaceholder": "email@example.com",
    "home.contact.message": "Message",
    "home.contact.messagePlaceholder": "Your message...",
    "home.contact.sent": "✓ Sent!",
    "home.contact.send": "Send message →",
    "home.contact.emailLabel": "EMAIL",
    "home.contact.emailValue": "hello@imgtools.vn",
    "home.contact.emailDesc": "Replies within 24 hours",
    "home.contact.phoneLabel": "PHONE",
    "home.contact.phoneValue": "0901 234 567",
    "home.contact.phoneDesc": "Mon – Fri, 9:00–18:00",
    "home.contact.addressLabel": "ADDRESS",
    "home.contact.addressValue": "123 Nguyen Hue, Q.1<br />Ho Chi Minh City, Vietnam",
    "home.footer.products": "Products",
    "home.footer.company": "Company",
    "home.footer.desc": "Image processing platform running right in your browser. Fast, private, and free.",
    "home.footer.copyright": "© 2026 Pixel Normal Edit. All rights reserved.",
    "home.benefit.privacy": "Completely private",
    "home.benefit.privacyDesc": "All processing happens right in your browser. Images never leave your device.",
    "home.benefit.speed": "Instant speed",
    "home.benefit.speedDesc": "No server upload wait. Local processing gives instant results.",
    "home.benefit.free": "Free forever",
    "home.benefit.freeDesc": "Core features are completely free, unlimited images.",
    "home.benefit.cross": "Cross-platform",
    "home.benefit.crossDesc": "Works on all modern browsers, no installs or plugins needed.",
    "home.benefit.ui": "Intuitive interface",
    "home.benefit.uiDesc": "UI designed for users, no technical knowledge required.",
    "home.benefit.batch": "Batch processing",
    "home.benefit.batchDesc": "Process dozens of images at once, saving significant time.",
    "home.footer.blog": "Blog",
    "home.footer.careers": "Careers",
    "home.footer.press": "Press",
    "home.footer.docs": "Documentation",
    "home.footer.faq": "FAQ",
    "home.footer.report": "Report bug",
    "home.footer.cookie": "Cookie",

    // ── Mini-Tools Registry (shared/config/tools-registry.js) ──
    "home.tool.convert": "Convert Image",
    "home.tool.convertDesc": "Convert between PNG, WebP, AVIF, JPG and 8 other formats.",
    "home.tool.convertDetail": "12 formats supported",
    "home.tool.compress": "Compress Image",
    "home.tool.compressDesc": "Reduce file size 60–90% without significant quality loss.",
    "home.tool.compressDetail": "Lossy & lossless",
    "home.tool.resize": "Resize Image",
    "home.tool.resizeDesc": "Resize freely, by ratio or popular presets.",
    "home.tool.resizeDetail": "Keep aspect ratio",
    "home.tool.crop": "Crop Image",
    "home.tool.cropDesc": "Crop custom areas with 1:1, 16:9, 4:3 ratio presets.",
    "home.tool.cropDetail": "Popular ratio presets",
    "home.tool.rotate": "Rotate / Flip",
    "home.tool.rotateDesc": "Rotate at custom angles, flip horizontally and vertically in one click.",
    "home.tool.rotateDetail": "Flip horizontal & vertical",
    "home.tool.framesToMedia": "Images → GIF / Video",
    "home.tool.framesToMediaDesc": "Convert Video → GIF, GIF → Video, or combine images into GIF/WebM.",
    "home.tool.framesToMediaDetail": "GIF & WebM",
    "home.tool.mediaToFrames": "GIF / Video → Images",
    "home.tool.mediaToFramesDesc": "Extract every frame of a GIF or Video into separate images.",
    "home.tool.mediaToFramesDetail": "Extract frames",
    "home.tool.gifSimplify": "Simplify GIF / Fast-forward video",
    "home.tool.gifSimplifyDesc": "Skip frames to make GIF lighter and videos play faster.",
    "home.tool.gifSimplifyDetail": "Reduce x2, x3...",
    "home.tool.editor": "Pixel Editor",
    "home.tool.editorDesc": "Advanced editing: layers, filters, masks, blend modes.",
    "home.tool.editorDetail": "Full-featured editor",
    "mini_tools.related.label": "Explore",

    // ── Editor (upload/confirm) ──
    "upload.multiFallbackConfirm": "You are uploading multiple files. Do you want to open them as separate tabs?",
    "upload.singleZipError": "Only 1 ZIP file can be uploaded at a time.",
    "upload.singleVideoError": "Only 1 Video file can be uploaded at a time.",
    "confirm.deleteMultipleFrames": "Are you sure you want to delete the {0} selected frames?",

    // ── Mini-Tools Convert page ──
    "convert.controls.downloadZip": "Download ZIP",
    "convert.controls.openEditor": "Open in Editor",

    // ── 8 keys present in EN but missing in VI (VI provided below) ──
    "download.step4": "Step 4: Execute",
    "group.localImageStore": "Local Image Store",
    "label.limit": "Limit:",
    "text.emptyStore": "Empty. Use Copy/Cut to save.",
    "tooltip.pasteImage": "Click to Paste, Right-click to Pin",
    "tooltip.pin": "Pin",
    "tooltip.unpin": "Unpin",
    "tooltip.deleteImage": "Delete",

    // ── HomePage legacy marketing keys (missing in EN) ──
    "resize.title": "Change dimensions",
    "home.hero.headline": "Pixel Art Editor",
    "home.hero.subheadline": "Professional image editing, pixel art drawing and animation creation with leading smart AI tools",
    "home.hero.tagline": "Turn ideas into masterpieces in an instant.",
    "home.hero.cta": "Get started now",
    "home.hero.ctaSub": "Completely free",
    "home.featuredTools.title": "Featured tools",
    "home.featuredTools.subtitle": "Everything in one powerful AI toolkit for image processing.",
    "home.tools.title": "Full list",
    "home.tools.gridTitle": "All tools",
    "home.tools.subtitle": "Hundreds of tools ready. Explore the real power of image editing.",
    "home.feature.title": "Featured features",
    "home.feature.subtitle": "Discover AI tools and features that will change how you edit images.",
    "home.benefit.title": "Key benefits",
    "home.benefit.subtitle": "What the website brings to you.",
    "home.pricing.title": "Pricing",
    "home.pricing.subtitle": "Tools are always free. With an account you get access to exclusive features.",
    "home.pricing.foreverFree": "Free forever",
    "home.pricing.tagline": "Core tools are always free. Create an account to unlock premium features.",
    "home.cta.title": "Ready to get started?",
    "home.cta.subtitle": "Experience the next-generation AI image editing tools now.",
    "home.cta.button": "Explore now",
    "home.footer.title": "AITaoanh",
    "home.footer.support": "Support",
    "home.footer.legal": "Legal",
    "home.footer.about": "About us",
    "home.footer.contact": "Contact",
    "home.footer.privacy": "Privacy",
    "home.footer.terms": "Terms",
    "home.tool.aiPixelArtist": "AI Pixel Artist",
    "home.tool.aiPixelArtistDesc": "Create high-quality pixel art with AI.",
    "home.tool.aiPixelArtistDetail": "Custom sizes, rich palette.",
    "home.tool.colorization": "AI Colorization",
    "home.tool.colorizationDesc": "Automatically colorize black and white photos.",
    "home.tool.colorizationDetail": "Get realistic results in seconds.",
    "home.tool.bgRemove": "AI Background Remover",
    "home.tool.bgRemoveDesc": "Remove image background with a single click.",
    "home.tool.bgRemoveDetail": "Professional results, sharp edges.",
    "home.tool.upScale": "AI Upscale",
    "home.tool.upScaleDesc": "Enlarge images 2x, 4x, 8x without losing detail.",
    "home.tool.upScaleDetail": "Automatic noise reduction.",
    "home.tool.repair": "AI Repair",
    "home.tool.repairDesc": "Restore old, damaged or blurry photos.",
    "home.tool.repairDetail": "Automatically fix defects and restore detail.",
    "home.tool.magicEdit": "AI Magic Edit",
    "home.tool.magicEditDesc": "Replace objects, add detail, fix mistakes with AI.",
    "home.tool.magicEditDetail": "Describe the change and AI will do it.",
    "home.tool.avatar": "AI Avatar",
    "home.tool.avatarDesc": "Create multi-style AI avatars from selfies.",
    "home.tool.avatarDetail": "Hundreds of styles: anime, cyberpunk, fantasy...",
    "home.tool.removeBG": "Remove Background",
    "home.tool.removeBGDesc": "Separate subject from image background.",
    "home.tool.removeBGDetail": "High accuracy, preserves fine detail.",
    "home.tool.restore": "Restore Old Photos",
    "home.tool.restoreDesc": "Restore blurry, torn, faded photos.",
    "home.tool.restoreDetail": "AI restores lost color and detail.",
    "home.tool.drawing": "AI Drawing",
    "home.tool.drawingDesc": "Turn text into artistic drawings.",
    "home.tool.drawingDetail": "Many styles: watercolor, oil painting, sketch...",
    "home.tool.removeText": "Remove Text",
    "home.tool.removeTextDesc": "Remove text from images, replace with AI content.",
    "home.tool.removeTextDetail": "Preserves background and surrounding context.",
    "home.tool.enhance": "Enhance Image",
    "home.tool.enhanceDesc": "Improve quality, color, contrast.",
    "home.tool.enhanceDetail": "Automatic optimization for best results.",
    "home.tool.upscale4x": "4x Upscale",
    "home.tool.upscale4xDesc": "Enlarge image 4 times.",
    "home.tool.upscale4xDetail": "Keeps quality, sharp detail.",
    "home.tool.hd": "HD Editor",
    "home.tool.hdDesc": "Edit HD photos with professional tools.",
    "home.tool.hdDetail": "No quality loss, high resolution support.",
    "home.tool.enhanceFace": "Enhance Face",
    "home.tool.enhanceFaceDesc": "Improve facial detail, sharpen features.",
    "home.tool.enhanceFaceDetail": "Automatic skin smoothing, eye detail boost.",
    "home.tool.cartoon": "Cartoon Mode",
    "home.tool.cartoonDesc": "Turn photos into stylish cartoons.",
    "home.tool.cartoonDetail": "Many styles: Disney, Pixar, anime...",
    "home.tool.restoreColor": "Restore Color",
    "home.tool.restoreColorDesc": "Colorize black and white photos with natural colors.",
    "home.tool.restoreColorDetail": "AI detects objects and colors accurately.",
    "home.tool.removeBGAdvanced": "Advanced Background Removal",
    "home.tool.removeBGAdvancedDesc": "Remove backgrounds with high accuracy, separate complex detail.",
    "home.tool.removeBGAdvancedDetail": "Separate hair, feathers, thin detail perfectly.",
    "home.tool.removeLetter": "Advanced Text Removal",
    "home.tool.removeLetterDesc": "Remove text from images, restore background detail.",
    "home.tool.removeLetterDetail": "AI analyzes background structure to reconstruct accurately.",
    "home.tool.removebgVideo": "Video Background Removal",
  },
  vi: {
    // ── HomePage (features/mini-tools/home/HomePage.jsx) ──
    "home.nav.home": "Trang chủ",
    "home.nav.login": "Đăng nhập",
    "home.nav.features": "Tính năng",
    "home.nav.products": "Sản phẩm",
    "home.nav.contact": "Liên hệ",
    "home.hero.badge": "Pixel Normal Edit",
    "home.hero.title": "Công cụ xử lý ảnh nhanh & riêng tư.",
    "home.hero.desc": "Nền tảng xử lý ảnh trực tiếp trên trình duyệt — không cần tài khoản, không upload lên server, dữ liệu của bạn chỉ thuộc về bạn.",
    "home.hero.cta.editor": "Pixel Editor",
    "home.hero.mockupLabel": "Màn hình chỉnh sửa ảnh chuyên nghiệp",
    "home.hero.stats": "2,048,391 ảnh đã xử lý hôm nay",
    "home.products.label": "Sản phẩm",
    "home.products.title": "Bộ công cụ toàn diện",
    "home.products.subtitle": "Từ chuyển đổi định dạng đến chỉnh sửa nâng cao — tất cả trong một nền tảng duy nhất.",
    "home.benefits.label": "Lợi ích",
    "home.benefits.title": "Tại sao chọn ImgTools?",
    "home.benefits.subtitle": "Không chỉ là một công cụ xử lý ảnh — đây là trải nghiệm được thiết kế cho người dùng hiện đại.",
    "home.contact.label": "Liên hệ",
    "home.contact.title": "Kết nối với chúng tôi",
    "home.contact.subtitle": "Có câu hỏi hoặc muốn hợp tác? Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ.",
    "home.contact.name": "Họ và tên",
    "home.contact.namePlaceholder": "Nguyễn Văn A",
    "home.contact.email": "Email",
    "home.contact.emailPlaceholder": "email@example.com",
    "home.contact.message": "Nội dung",
    "home.contact.messagePlaceholder": "Nội dung tin nhắn của bạn...",
    "home.contact.sent": "✓ Đã gửi!",
    "home.contact.send": "Gửi tin nhắn →",
    "home.contact.emailLabel": "EMAIL",
    "home.contact.emailValue": "hello@imgtools.vn",
    "home.contact.emailDesc": "Phản hồi trong 24 giờ",
    "home.contact.phoneLabel": "ĐIỆN THOẠI",
    "home.contact.phoneValue": "0901 234 567",
    "home.contact.phoneDesc": "Thứ 2 – Thứ 6, 9:00–18:00",
    "home.contact.addressLabel": "ĐỊA CHỈ",
    "home.contact.addressValue": "123 Nguyễn Huệ, Q.1<br />TP. Hồ Chí Minh, Việt Nam",
    "home.footer.products": "Sản phẩm",
    "home.footer.company": "Công ty",
    "home.footer.desc": "Nền tảng xử lý ảnh trực tiếp trên trình duyệt. Nhanh, riêng tư, và miễn phí.",
    "home.footer.copyright": "© 2026 Pixel Normal Edit. All rights reserved.",
    "home.benefit.privacy": "Hoàn toàn riêng tư",
    "home.benefit.privacyDesc": "Mọi xử lý diễn ra ngay trên trình duyệt của bạn. Ảnh không bao giờ rời khỏi thiết bị.",
    "home.benefit.speed": "Tốc độ tức thì",
    "home.benefit.speedDesc": "Không chờ upload server. Xử lý cục bộ cho kết quả ngay lập tức.",
    "home.benefit.free": "Miễn phí mãi mãi",
    "home.benefit.freeDesc": "Các tính năng cơ bản hoàn toàn miễn phí, không giới hạn số lượng ảnh.",
    "home.benefit.cross": "Đa nền tảng",
    "home.benefit.crossDesc": "Hoạt động trên mọi trình duyệt hiện đại, không cần cài đặt hay plugin.",
    "home.benefit.ui": "Giao diện trực quan",
    "home.benefit.uiDesc": "UI được thiết kế cho người dùng, không yêu cầu kiến thức kỹ thuật.",
    "home.benefit.batch": "Batch processing",
    "home.benefit.batchDesc": "Xử lý hàng chục ảnh cùng lúc, tiết kiệm thời gian đáng kể.",
    "home.footer.blog": "Blog",
    "home.footer.careers": "Tuyển dụng",
    "home.footer.press": "Báo chí",
    "home.footer.docs": "Tài liệu",
    "home.footer.faq": "FAQ",
    "home.footer.report": "Báo lỗi",
    "home.footer.cookie": "Cookie",

    // ── Mini-Tools Registry (shared/config/tools-registry.js) ──
    "home.tool.convert": "Convert ảnh",
    "home.tool.convertDesc": "Chuyển đổi giữa PNG, WebP, AVIF, JPG và 8 định dạng khác.",
    "home.tool.convertDetail": "12 định dạng hỗ trợ",
    "home.tool.compress": "Nén ảnh",
    "home.tool.compressDesc": "Giảm 60–90% dung lượng file mà không giảm chất lượng đáng kể.",
    "home.tool.compressDetail": "Lossy & lossless",
    "home.tool.resize": "Resize ảnh",
    "home.tool.resizeDesc": "Thay đổi kích thước tự do, theo tỉ lệ hoặc preset phổ biến.",
    "home.tool.resizeDetail": "Giữ tỉ lệ khung hình",
    "home.tool.crop": "Crop ảnh",
    "home.tool.cropDesc": "Cắt vùng tùy chọn với preset tỉ lệ 1:1, 16:9, 4:3...",
    "home.tool.cropDetail": "Preset tỉ lệ phổ biến",
    "home.tool.rotate": "Xoay / Lật",
    "home.tool.rotateDesc": "Xoay góc tùy chỉnh, lật ngang và dọc theo một cú click.",
    "home.tool.rotateDetail": "Lật ngang & dọc",
    "home.tool.framesToMedia": "Ghép ảnh → GIF / Video",
    "home.tool.framesToMediaDesc": "Chuyển Video → GIF, GIF → Video, hoặc ghép ảnh thành GIF/WebM.",
    "home.tool.framesToMediaDetail": "GIF & WebM",
    "home.tool.mediaToFrames": "Tách GIF / Video → Ảnh",
    "home.tool.mediaToFramesDesc": "Tách từng frame của GIF hoặc Video thành ảnh riêng biệt.",
    "home.tool.mediaToFramesDetail": "Extract frames",
    "home.tool.gifSimplify": "Đơn giản GIF / Tua nhanh video",
    "home.tool.gifSimplifyDesc": "Bỏ xen kẽ frame để GIF nhẹ hơn, video chạy nhanh hơn.",
    "home.tool.gifSimplifyDetail": "Giảm x2, x3...",
    "home.tool.editor": "Pixel Editor",
    "home.tool.editorDesc": "Chỉnh sửa nâng cao: layers, filters, masks, blend modes.",
    "home.tool.editorDetail": "Full-featured editor",
    "mini_tools.related.label": "Khám phá",

    // ── Editor (upload/confirm) ──
    "upload.multiFallbackConfirm": "Bạn đang tải lên nhiều file. Bạn có muốn mở chúng thành các Tab riêng biệt không?",
    "upload.singleZipError": "Chỉ hỗ trợ tải lên 1 file ZIP mỗi lần.",
    "upload.singleVideoError": "Chỉ hỗ trợ tải lên 1 file Video mỗi lần.",
    "confirm.deleteMultipleFrames": "Bạn có chắc muốn xóa {0} frame đang chọn không?",

    // ── Mini-Tools Convert page ──
    "convert.controls.downloadZip": "Tải file ZIP",
    "convert.controls.openEditor": "Mở trong Editor",

    // ── 8 keys present in EN but missing in VI ──
    "download.step4": "4. Tiến hành tải",
    "group.localImageStore": "Kho ảnh cục bộ",
    "label.limit": "Giới hạn:",
    "text.emptyStore": "Trống. Dùng Copy/Cắt để lưu.",
    "tooltip.pasteImage": "Click để Dán, chuột phải để Ghim",
    "tooltip.pin": "Ghim",
    "tooltip.unpin": "Bỏ ghim",
    "tooltip.deleteImage": "Xóa",

    // ── HomePage legacy marketing keys (missing in EN) ──
    "resize.title": "Thay đổi kích thước",
    "home.hero.headline": "Pixel Art Editor",
    "home.hero.subheadline": "Chỉnh sửa ảnh chuyên nghiệp, vẽ pixel art và tạo animation với công cụ AI thông minh hàng đầu",
    "home.hero.tagline": "Biến ý tưởng thành tác phẩm chỉ trong nháy mắt.",
    "home.hero.cta": "Bắt đầu ngay",
    "home.hero.ctaSub": "Hoàn toàn miễn phí",
    "home.featuredTools.title": "Công cụ nổi bật",
    "home.featuredTools.subtitle": "Tất cả trong một bộ công cụ AI mạnh mẽ để xử lý ảnh.",
    "home.tools.title": "Danh sách đầy đủ",
    "home.tools.gridTitle": "Tất cả công cụ",
    "home.tools.subtitle": "Hàng trăm công cụ đã sẵn sàng. Hãy khám phá sức mạnh thực sự của việc chỉnh sửa ảnh.",
    "home.feature.title": "Tính năng nổi bật",
    "home.feature.subtitle": "Khám phá các công cụ và tính năng AI sẽ thay đổi cách bạn chỉnh sửa ảnh.",
    "home.benefit.title": "Ưu điểm nổi bật",
    "home.benefit.subtitle": "Những gì được trang web mang lại cho bạn.",
    "home.pricing.title": "Giá cả",
    "home.pricing.subtitle": "Công cụ luôn miễn phí. Với một tài khoản bạn có quyền truy cập với tính năng riêng.",
    "home.pricing.foreverFree": "Miễn phí mãi mãi",
    "home.pricing.tagline": "Công cụ cơ bản luôn miễn phí. Tạo tài khoản để mở khóa tính năng cao cấp.",
    "home.cta.title": "Sẵn sàng bắt đầu?",
    "home.cta.subtitle": "Trải nghiệm công cụ chỉnh sửa ảnh AI thế hệ tiếp theo ngay bây giờ.",
    "home.cta.button": "Khám phá ngay",
    "home.footer.title": "AITaoanh",
    "home.footer.support": "Hỗ trợ",
    "home.footer.legal": "Pháp lý",
    "home.footer.about": "Về chúng tôi",
    "home.footer.contact": "Liên hệ",
    "home.footer.privacy": "Bảo mật",
    "home.footer.terms": "Điều khoản",
    "home.tool.aiPixelArtist": "Họa sĩ pixel AI",
    "home.tool.aiPixelArtistDesc": "Tạo pixel art chất lượng cao bằng AI.",
    "home.tool.aiPixelArtistDetail": "Kích thước tùy chỉnh, palette phong phú.",
    "home.tool.colorization": "Tô màu AI",
    "home.tool.colorizationDesc": "Tô màu ảnh đen trắng tự động.",
    "home.tool.colorizationDetail": "Nhận kết quả chân thực trong vài giây.",
    "home.tool.bgRemove": "Xóa nền AI",
    "home.tool.bgRemoveDesc": "Xóa nền ảnh chỉ với một cú click.",
    "home.tool.bgRemoveDetail": "Kết quả chuyên nghiệp, đường viền sắc nét.",
    "home.tool.upScale": "Nâng cấp ảnh AI",
    "home.tool.upScaleDesc": "Tăng kích thước ảnh gấp 2, 4, 8 lần mà không mất chi tiết.",
    "home.tool.upScaleDetail": "Tự động loại bỏ nhiễu hạt (noise reduction).",
    "home.tool.repair": "Sửa ảnh AI",
    "home.tool.repairDesc": "Phục hồi ảnh cũ, hư hỏng hoặc mờ.",
    "home.tool.repairDetail": "Tự động sửa lỗi và khôi phục chi tiết.",
    "home.tool.magicEdit": "Chỉnh sửa ma thuật AI",
    "home.tool.magicEditDesc": "Thay thế đối tượng, thêm chi tiết, sửa lỗi bằng AI.",
    "home.tool.magicEditDetail": "Mô tả thay đổi và AI sẽ thực hiện.",
    "home.tool.avatar": "Avatar AI",
    "home.tool.avatarDesc": "Tạo avatar AI đa phong cách từ ảnh selfie.",
    "home.tool.avatarDetail": "Hàng trăm phong cách: anime, cyberpunk, fantasy...",
    "home.tool.removeBG": "Xóa nền",
    "home.tool.removeBGDesc": "Tách chủ thể ra khỏi nền ảnh.",
    "home.tool.removeBGDetail": "Độ chính xác cao, giữ lại chi tiết tinh tế.",
    "home.tool.restore": "Khôi phục ảnh cũ",
    "home.tool.restoreDesc": "Khôi phục ảnh bị mờ, rách, phai màu.",
    "home.tool.restoreDetail": "AI phục hồi màu sắc và chi tiết đã mất.",
    "home.tool.drawing": "Vẽ tranh AI",
    "home.tool.drawingDesc": "Biến text thành tranh vẽ nghệ thuật.",
    "home.tool.drawingDetail": "Nhiều phong cách: watercolor, oil painting, sketch...",
    "home.tool.removeText": "Xóa chữ",
    "home.tool.removeTextDesc": "Xóa chữ khỏi ảnh, thay thế bằng nội dung AI.",
    "home.tool.removeTextDetail": "Giữ nguyên nền và context xung quanh.",
    "home.tool.enhance": "Tăng cường ảnh",
    "home.tool.enhanceDesc": "Cải thiện chất lượng, màu sắc, độ tương phản.",
    "home.tool.enhanceDetail": "Tối ưu hóa tự động cho kết quả tốt nhất.",
    "home.tool.upscale4x": "Nâng cấp 4x",
    "home.tool.upscale4xDesc": "Tăng kích thước ảnh gấp 4 lần.",
    "home.tool.upscale4xDetail": "Giữ nguyên chất lượng, sắc nét từng chi tiết.",
    "home.tool.hd": "HD Editor",
    "home.tool.hdDesc": "Chỉnh sửa ảnh HD với công cụ chuyên nghiệp.",
    "home.tool.hdDetail": "Không giảm chất lượng, hỗ trợ độ phân giải cao.",
    "home.tool.enhanceFace": "Nâng cấp khuôn mặt",
    "home.tool.enhanceFaceDesc": "Cải thiện chi tiết khuôn mặt, làm rõ nét.",
    "home.tool.enhanceFaceDetail": "Tự động làm mịn da, tăng chi tiết mắt.",
    "home.tool.cartoon": "Chế độ hoạt hình",
    "home.tool.cartoonDesc": "Biến ảnh thành tranh hoạt hình phong cách.",
    "home.tool.cartoonDetail": "Nhiều style: Disney, Pixar, anime...",
    "home.tool.restoreColor": "Phục hồi màu",
    "home.tool.restoreColorDesc": "Tô màu cho ảnh đen trắng với màu sắc tự nhiên.",
    "home.tool.restoreColorDetail": "AI nhận diện vật thể và tô màu chính xác.",
    "home.tool.removeBGAdvanced": "Xóa nền nâng cao",
    "home.tool.removeBGAdvancedDesc": "Xóa nền với độ chính xác cao, tách chi tiết phức tạp.",
    "home.tool.removeBGAdvancedDetail": "Tách tóc, lông vũ, chi tiết mỏng một cách hoàn hảo.",
    "home.tool.removeLetter": "Xóa chữ nâng cao",
    "home.tool.removeLetterDesc": "Xóa chữ khỏi ảnh, phục hồi lại chi tiết nền.",
    "home.tool.removeLetterDetail": "AI phân tích cấu trúc nền để tái tạo chính xác.",
    "home.tool.removebgVideo": "Xóa nền Video",
  }
};

const requiredKeys = languages.en || {};

function hasKey(content, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\n)\\s*(["']?)${escapedKey}\\1\\s*:`);
  return regex.test(content);
}

function insertBeforeClosingBrace(content, newLines) {
  const lastBraceIndex = content.lastIndexOf("}");
  if (lastBraceIndex === -1) return content;
  return content.slice(0, lastBraceIndex) + newLines + "\n" + content.slice(lastBraceIndex);
}

Object.entries(languages).forEach(([langCode, langData]) => {
  if (!langData || Object.keys(langData).length === 0) {
    console.log(`[SYNC] ⏭️ Bỏ qua ${langCode} (không có key mới cần thêm)`);
    return;
  }
  const filePath = path.join(folderPath, `${langCode}.js`);
  if (!fs.existsSync(filePath)) {
    console.log(`[SYNC] ❌ Không tìm thấy file ${langCode}.js`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let addedLines = "";
  let isModified = false;

  Object.keys(requiredKeys).forEach((key) => {
    const value = langData[key] || requiredKeys[key] || "";
    if (!hasKey(content, key)) {
      addedLines += `  "${key}": ${JSON.stringify(value)},\n`;
      console.log(`[SYNC] [${langCode}] ➕ Thêm key mới: ${key}`);
    } else {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const lineRegex = new RegExp(`(^\\s*(["']?)${escapedKey}\\2\\s*:)(.*)$`, "m");
      const match = content.match(lineRegex);
      if (match && value !== "") {
        const newValueStr = JSON.stringify(value);
        const currentRest = match[3];
        const valMatch = currentRest.match(/^\s*(.*?)\s*(,?)\s*$/);
        const currentRaw = valMatch ? valMatch[1] : currentRest.trim();
        const trailingComma = valMatch ? valMatch[2] : "";
        let shouldReplace = false;

        try {
          // eval to handle both single and double quotes gracefully
          const evalValue = eval(`(${currentRaw})`);
          if (evalValue !== value) {
            shouldReplace = true;
          }
        } catch (e) {
          if (currentRaw !== newValueStr) shouldReplace = true;
        }

        if (shouldReplace) {
          content = content.replace(lineRegex, `$1 ${newValueStr}${trailingComma}`);
          isModified = true;
          console.log(`[SYNC] [${langCode}] 🔄 Cập nhật key: ${key}`);
        }
      }
    }
  });

  if (addedLines) {
    content = insertBeforeClosingBrace(content, addedLines);
    isModified = true;
  }

  if (isModified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[SYNC] ✅ Đã ghi cập nhật vào ${langCode}.js`);
  } else {
    console.log(`[SYNC] ✔️ ${langCode}.js đã đồng bộ đầy đủ, không cần thay đổi.`);
  }
});

// ==========================================
// 2. PHẦN KIỂM TRA (AUDIT)
// ==========================================
// Dùng dynamic import kèm timestamp để nạp bản mới nhất vừa được ghi file ở trên
const { default: enData } = await import(`./en.js?t=${Date.now()}`);
const { default: viData } = await import(`./vi.js?t=${Date.now()}`);

console.log("");
printBox("I18N AUDIT REPORT");
console.log("🛠️  HƯỚNG DẪN FIX LỖI (DÀNH CHO AI):");
console.log("   - Modal/Popup (React): dùng `{t('key') || 'Giá trị mặc định'}` thay vì text cứng hoặc `data-i18n`.");
console.log("   - JS thuần: dùng `t('key')` để gán trực tiếp, hoặc gọi lại `updateDOM()` sau khi đổi ngôn ngữ.");
console.log("   - Thêm key mới: khai báo trong object `languages` ở đầu file này rồi chạy lại script.");

printSection("1. KEY BỊ TRÙNG LẶP TRONG CÙNG FILE");
function findDuplicates(langCode, filePath) {
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
  if (dupes.size > 0) console.log(`  - ⚠️ Cảnh báo: file ${langCode}.js có ${dupes.size} key bị khai báo lặp lại: ${Array.from(dupes).join(', ')}`);
  else console.log(`  - ✔️ ${langCode}.js không có key trùng lặp.`);
}
findDuplicates('en', path.join(folderPath, 'en.js'));
findDuplicates('vi', path.join(folderPath, 'vi.js'));

printSection("2. KEY BỊ LỆCH GIỮA CÁC FILE NGÔN NGỮ");
const enKeys = Object.keys(enData);
const viKeys = Object.keys(viData);
const missingInVi = enKeys.filter(k => !(k in viData));
const missingInEn = viKeys.filter(k => !(k in enData));

if (missingInVi.length > 0) {
  console.log(`  - ❌ Có ${missingInVi.length} key tồn tại ở EN nhưng còn thiếu ở VI:`);
  console.log("  " + missingInVi.join(', '));
} else console.log("  - ✔️ VI đã có đầy đủ key so với EN.");

if (missingInEn.length > 0) {
  console.log(`  - ❌ Có ${missingInEn.length} key tồn tại ở VI nhưng còn thiếu ở EN (key dư ở VI):`);
  console.log("  " + missingInEn.join(', '));
} else console.log("  - ✔️ EN đã có đầy đủ key so với VI.");

printSection("3. KEY CÓ GIÁ TRỊ RỖNG / NULL");
const emptyVi = viKeys.filter(k => !viData[k] || String(viData[k]).trim() === "");
const emptyEn = enKeys.filter(k => !enData[k] || String(enData[k]).trim() === "");
if (emptyVi.length > 0) console.log("  - ⚠️ Các key đang để trống ở VI: " + emptyVi.join(', '));
else console.log("  - ✔️ VI không có key nào để trống.");
if (emptyEn.length > 0) console.log("  - ⚠️ Các key đang để trống ở EN: " + emptyEn.join(', '));
else console.log("  - ✔️ EN không có key nào để trống.");

printSection("4. PLACEHOLDER BỊ LỆCH GIỮA 2 NGÔN NGỮ ({0}, {1}...)");
let placeholderErrors = 0;
enKeys.forEach(k => {
  if (enData[k] && viData[k]) {
    const enMatch = String(enData[k]).match(/\{\d+\}/g) || [];
    const viMatch = String(viData[k]).match(/\{\d+\}/g) || [];
    if (enMatch.sort().join(',') !== viMatch.sort().join(',')) {
      console.log(`  - ❌ Lệch placeholder ở key [${k}]: EN(${enMatch.join(',')}) vs VI(${viMatch.join(',')})`);
      placeholderErrors++;
    }
  }
});
if (placeholderErrors === 0) console.log("  - ✔️ Không phát hiện lệch placeholder giữa EN và VI.");

printSection("5. QUÉT SOURCE CODE TÌM LỖI SỬ DỤNG I18N");
const allFiles = [];
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist')) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      allFiles.push(fullPath);
    }
  }
}
walkDir(srcPath);

const usedKeys = new Set();
const potentialHardcodes = [];
const dynamicKeyPrefixes = new Set(); // static prefix part before ${...} in t(`prefix.${x}`)

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isMeaningfulText(text) {
  return !!text && /[a-zA-ZÀ-ỹ]/.test(text) &&
    !/^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(text);
}

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // --- i18n usage: t('key'), t("key"), t(`key`), t(`prefix.${value}`) ---
  const tRegex = /\bt\(\s*(['"`])([\s\S]*?)\1/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[2];
    if (key.includes('${')) {
      const staticPrefix = key.split('${')[0];
      if (staticPrefix) dynamicKeyPrefixes.add(staticPrefix);
    } else {
      usedKeys.add(key);
    }
  }

  // --- data-i18n="key" ---
  const dataI18nRegex = /data-i18n(?:-[a-z]+)?\s*=\s*(?:['"]([^'"]+)['"]|\{\s*['"]([^'"]+)['"]\s*\}|\{`([^`]+)`\})/g;
  while ((match = dataI18nRegex.exec(content)) !== null) {
    const key = match[1] || match[2] || match[3];
    if (key.includes('${')) {
      const staticPrefix = key.split('${')[0];
      if (staticPrefix) dynamicKeyPrefixes.add(staticPrefix);
    } else {
      usedKeys.add(key);
    }
  }

  // --- Dynamic object keys (titleKey, tooltipKey, labelKey) ---
  const objKeyRegex = /\b(?:titleKey|tooltipKey|labelKey|descKey)\s*:\s*['"]([^'"]+)['"]/g;
  while ((match = objKeyRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }

  // --- JSX/TSX text nodes (multi-line aware): >...text...< with no nested tags ---
  if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
    const jsxTextRegex = />\s*([^<>{}]+?)\s*</g;
    while ((match = jsxTextRegex.exec(content)) !== null) {
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (isMeaningfulText(text)) {
        potentialHardcodes.push({
          file: path.relative(srcPath, file),
          line: lineOf(content, match.index),
          text, type: 'JSX Text', severity: 'high'
        });
      }
    }

    // JSX attributes: placeholder="..." title="..." alt="..." aria-label="..." label="..."
    const jsxAttrRegex = /\b(placeholder|title|alt|aria-label|label)\s*=\s*(['"])([^'"]+)\2/g;
    while ((match = jsxAttrRegex.exec(content)) !== null) {
      const text = match[3].trim();
      if (isMeaningfulText(text) && (text.includes(' ') || /[A-ZÀ-ỹ]/.test(text))) {
        potentialHardcodes.push({
          file: path.relative(srcPath, file),
          line: lineOf(content, match.index),
          text: text.length > 50 ? text.substring(0, 50) + '...' : text,
          type: `JSX attr[${match[1]}]`, severity: 'high'
        });
      }
    }
  }

  // --- JS/TS hardcodes: function calls, DOM property assignment, object properties ---
  const jsHardcodeRegexes = [
    { regex: /toast(?:\.\w+)?\(\s*(['"])([^'"]+)\1/g, type: 'Toast', severity: 'high' },
    { regex: /\balert\(\s*(['"])([^'"]+)\1/g, type: 'Alert', severity: 'high' },
    { regex: /\bconfirm\(\s*(['"])([^'"]+)\1/g, type: 'Confirm', severity: 'high' },
    { regex: /\bprompt\(\s*(['"])([^'"]+)\1/g, type: 'Prompt', severity: 'high' },
    { regex: /(?:console\.(?:error|warn|info)|new Error)\(\s*(['"])([^'"]+)\1/g, type: 'Error/Log', severity: 'low' },
    { regex: /setAttribute\(\s*['"](?:title|alt|placeholder|label|aria-label|data-content)['"]\s*,\s*(['"])([^'"]+)\1/g, type: 'setAttribute', severity: 'high' },
    { regex: /\.(?:textContent|innerText|innerHTML)\s*=\s*(['"])([^'"]+)\1/g, type: 'DOM assign', severity: 'high' },
    { regex: /(?:title|label|message|text|description|placeholder|content|header|tooltip)\s*:\s*(['"])([^'"]+)\1/g, type: 'Object/Array', severity: 'medium' }
  ];

  jsHardcodeRegexes.forEach(({ regex, type, severity }) => {
    let jsMatch;
    while ((jsMatch = regex.exec(content)) !== null) {
      const text = jsMatch[2].trim();
      if (isMeaningfulText(text) && !/^[a-z0-9_.\-]+$/.test(text) &&
        (text.includes(' ') || /[A-ZÀ-ỹ]/.test(text))) {
        const idx = jsMatch.index;
        const lineStart = content.lastIndexOf('\n', idx) + 1;
        const lineEndIdx = content.indexOf('\n', idx);
        const surroundingLine = content.slice(lineStart, lineEndIdx === -1 ? content.length : lineEndIdx);
        if (!/\bt\(/.test(surroundingLine) && !surroundingLine.includes('i18n')) {
          potentialHardcodes.push({
            file: path.relative(srcPath, file),
            line: lineOf(content, idx),
            text: text.length > 50 ? text.substring(0, 50) + '...' : text,
            type, severity
          });
        }
      }
    }
  });
});

const undeclaredKeys = Array.from(usedKeys).filter(k => !(k in enData) && !(k in viData));
if (undeclaredKeys.length > 0) {
  console.log(`  - ❌ Có ${undeclaredKeys.length} key được gọi trong code nhưng CHƯA được khai báo trong i18n:`);
  console.log("  " + undeclaredKeys.join(', '));
} else {
  console.log("  - ✔️ Tất cả key được dùng trong code đều đã khai báo đầy đủ.");
}

const dynamicPrefixList = Array.from(dynamicKeyPrefixes);
const unusedKeys = enKeys.filter(k => {
  if (usedKeys.has(k)) return false;
  // Loại trừ key có thể được tham chiếu động qua t(`prefix.${value}`)
  return !dynamicPrefixList.some(prefix => k.startsWith(prefix));
});
if (unusedKeys.length > 0) {
  console.log(`  - ⚠️ Có ${unusedKeys.length} key đã khai báo nhưng có thể KHÔNG được sử dụng trong code:`);
  console.log("  (Lưu ý: nếu code gọi key động dạng t(`prefix.${val}`), key khớp prefix đó đã được loại trừ khỏi danh sách này)");
  console.log("  " + unusedKeys.join(', '));
} else {
  console.log("  - ✔️ Không phát hiện key nào bị thừa/không sử dụng.");
}

printSection("6. TEXT HARDCODE (cảnh báo tiềm năng, cần kiểm tra lại thủ công)");
if (potentialHardcodes.length > 0) {
  console.log(`  - ⚠️ Phát hiện khoảng ${potentialHardcodes.length} đoạn text có thể chưa dùng i18n:`);
  potentialHardcodes.forEach(h => {
    console.log(`  [${h.severity.toUpperCase()}] [${h.file}:${h.line}] [${h.type}] "${h.text}"`);
  });
} else {
  console.log("  - ✔️ Không phát hiện text hardcode rõ ràng.");
}

console.log("");
printBox("HOÀN TẤT KIỂM TRA I18N");