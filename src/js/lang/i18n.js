// Copy of the finalized i18n.js from the previous session
export const dictionary = {
  vi: {
    "app.title": "Pixel Normal Edit",
    "app.desc": "Pixel Normal Edit",

    "tooltip.toggleTools": "Mở/Đóng Công cụ",
    "tooltip.undo": "Hoàn tác thao tác trước (Ctrl+Z)",
    "tooltip.redo": "Làm lại thao tác vừa hoàn tác (Ctrl+Y)",
    "tooltip.zoomIn": "Phóng to",
    "tooltip.zoomOut": "Thu nhỏ",
    "tooltip.zoomReset": "Vừa màn hình",
    "tooltip.setBg": "Dùng ảnh làm nền",
    "tooltip.compress": "Tối ưu hóa và giảm dung lượng tệp ảnh",
    "tooltip.upload": "Tải lên Ảnh / JSON",
    "tooltip.uploadFull": "Tải lên ảnh hoặc file JSON đã lưu",
    "tooltip.compressFull": "Nén và làm nhẹ ảnh hiện tại",
    "tooltip.export": "Tải xuống ảnh",
    "tooltip.exportFull": "Lưu và tải ảnh về máy",
    "tooltip.exportPng": "Tải xuống PNG",
    "tooltip.exportJpeg": "Tải xuống JPEG",
    "tooltip.exportWebp": "Tải xuống WEBP",
    "tooltip.exportJson": "Tải xuống File Dự Án (.json)",
    "tooltip.swapColors": "Đảo màu",
    "tooltip.primaryColor": "Màu chính (Click trái)",
    "tooltip.secondaryColor": "Màu phụ (Click phải)",
    "tooltip.toggleNav": "Ẩn/Hiện điều hướng",
    "tooltip.gradientMode": "Đổ bóng Gradient (Alpha)",
    "tooltip.showGrid": "Hiển thị lưới (Grid)",
    "tooltip.mirrorMode": "Vẽ đối xứng (Mirror)",
    "tooltip.gridSize": "Chọn hoặc tùy chỉnh kích thước lưới",
    "tooltip.gradDir": "Chọn hướng loang màu của Gradient",
    "tooltip.pencilSize": "Kích thước bút chì",
    "tooltip.eraserSize": "Kích thước cục tẩy",
    "tooltip.login": "Đăng nhập / Đăng ký",

    "confirm.leave": "Bạn có chắc chuyển sang nơi khác? Mọi dữ liệu bản vẽ chưa lưu sẽ bị mất!",

    "btn.upload": "Tải lên",
    "btn.compress": "Nén ảnh",
    "btn.export": "Tải xuống",
    "btn.stopTask": "Dừng",

    "tool.pencil": "Vẽ tự do (P)",
    "tool.eraser": "Tẩy (E)",
    "tool.picker": "Hút màu (I)",
    "tool.fill": "Đổ màu (F)",
    "tool.magicEraser": "Tẩy vùng màu (M)",
    "tool.outline": "Tạo viền (O)",
    "tool.line": "Đường thẳng (L)",
    "tool.rect": "Hình chữ nhật (R)",
    "tool.circle": "Hình tròn (C)",
    "tool.pan": "Kéo thả (Space)",

    "group.draw": "Công cụ vẽ",
    "group.fillBg": "Đổ màu & Nền",
    "group.shape": "Hình học",
    "group.nav": "Điều hướng",
    "group.settings": "Biến đổi",
    "group.imageOps": "Thao tác ảnh",
    "group.operations": "Thao tác",

    "label.size": "Kích thước:",
    "label.pencilSize": "Cỡ bút",
    "label.eraserSize": "Cỡ tẩy",
    "label.outlineThick": "Viền dày:",
    "label.shapeThick": "Độ dày:",
    "label.gridSize": "Khung canvas:",
    "label.gradientMode": "Đổ bóng Gradient (Alpha)",
    "label.mirrorMode": "Vẽ đối xứng (Mirror)",
    "label.showGrid": "Hiển thị lưới (Grid)",
    "label.sourceImage": "Ảnh gốc",
    "label.bg": "Nền",
    "label.gradDir": "Hướng đổ",

    "option.customSize": "Tùy chỉnh...",
    "option.vertical": "Dọc (Trên-Dưới)",
    "option.horizontal": "Ngang (Trái-Phải)",
    "option.diagonal": "Chéo (Góc)",
    "option.radial": "Tỏa tròn (Tâm)",

    "transform.rotate": "Xoay 90°",
    "transform.flipH": "Lật Ngang",
    "transform.flipV": "Lật Dọc",

    "modal.uploadTitle": "Tải lên / Mở file",
    "modal.tabImage": "Từ Ảnh",
    "modal.tabJson": "Từ JSON",
    "modal.dropImage": "Click hoặc Kéo thả ảnh vào đây",
    "modal.autoSize": "Tự động đổi kích thước khung theo ảnh tải lên",
    "modal.dropJson": "Click hoặc Kéo thả file .json (hoặc .txt) vào đây",
    "modal.jsonText": "Hoặc dán nội dung JSON:",
    "modal.parseJson": "Đọc JSON",
    "modal.downloadTitle": "Tải về máy",
    "modal.jsonPlaceholder": "Dán mã JSON (hoặc nội dung file .txt) vào đây...",

    "status.init": "Chào mừng đến với Pixel Normal Edit!",
    "status.rotated": "Đã xoay 90°.",
    "status.flippedV": "Đã lật dọc.",
    "status.flippedH": "Đã lật ngang.",
    "status.pickedColor": "Đã hút màu:",
    "status.processing": "Đang xử lý...",
    "status.fillComplete": "Đã hoàn tất đổ màu",
    "status.toolSelected": "Đã chọn công cụ:",
    "status.jsonInvalid": "Cấu trúc JSON không hợp lệ.",
    "status.jsonLoaded": "Đã tải JSON.",
    "status.jsonError": "Lỗi đọc JSON:",
    "status.imgProcessing": "Đang xử lý ảnh...",
    "status.imgComplete": "Hoàn tất nén ảnh",
    "status.imgLoaded": "Đã tải ảnh",
    "status.noArt": "Chưa có tác phẩm để lưu.",
    "status.dlWebp": "Đã tải xuống ảnh WEBP",
    "status.dlPng": "Đã tải xuống ảnh PNG",
    "status.dlJson": "Đã tải xuống dự án JSON.",
    "status.dlJpeg": "Đã tải xuống ảnh JPEG",
    "status.undo": "Undo",
    "status.redo": "Redo",
    "status.zoom": "Zoom:",
    "status.zoomFit": "Zoom: Vừa màn hình",
    "status.noBg": "Chưa có ảnh gốc.",
    "status.bgOff": "Đã tắt nền ảnh gốc.",
    "status.bgOn": "Đã đặt ảnh gốc làm nền lưới (tối màu).",
    "status.sizePrompt": "Nhập kích thước lưới (Ví dụ: 48 hoặc 43x120):",
    "status.invalidSize": "Kích thước không hợp lệ.",
    "status.sizeChanged": "Đã đổi kích thước thành",
    "status.needImg": "Vui lòng tải ảnh lên trước.",
    "status.compressing": "Đang nén ảnh...",
    "status.largeImgWarning": "Ảnh có kích thước quá lớn (>1 triệu điểm ảnh) có thể gây giật lag khi chỉnh sửa. Bạn có chắc chắn muốn tải lên không?",
    "status.taskAborted": "Đã dừng thuật toán.",

    "status.scanBg": "Đang quét nền...",
    "status.scanBgCount": "Đang quét nền: {0} khối...",
    "status.analyzeShape": "Đang phân tích hình dạng...",
    "status.calcOutline": "Đang tính toán viền...",
    "status.calcOutlinePct": "Đang tính toán viền: {0}%...",
    "status.drawOutlinePct": "Đang vẽ viền: {0}%...",
    "status.outlineDone": "Hoàn tất vẽ viền ({0} pixels).",
    "status.outlineError": "Lỗi khi tạo viền.",

    "status.scanFill": "Đang quét vùng cần đổ màu...",
    "status.scanFillCount": "Đang quét vùng: {0} khối...",
    "status.filling": "Đang đổ màu...",
    "status.fillingPct": "Đang đổ màu: {0}%...",
    "status.fillError": "Lỗi khi đổ màu.",

    "status.scanEraser": "Đang quét vùng cần tẩy...",
    "status.erasing": "Đang xóa màu...",
    "status.erasingPct": "Đang xóa màu: {0}%...",
    "status.eraserDone": "Hoàn tất tẩy vùng màu ({0} pixels).",
    "status.eraserError": "Lỗi khi tẩy màu.",

    "text.hideTools": "Ẩn công cụ",
    "text.showTools": "Mở công cụ"
  },
  en: {
    "app.title": "Pixel Normal Edit",
    "app.desc": "Pixel Normal Edit",

    "tooltip.toggleTools": "Toggle Tools",
    "tooltip.undo": "Undo (Ctrl+Z)",
    "tooltip.redo": "Redo (Ctrl+Y)",
    "tooltip.zoomIn": "Zoom In",
    "tooltip.zoomOut": "Zoom Out",
    "tooltip.zoomReset": "Fit to Screen",
    "tooltip.setBg": "Set as Background",
    "tooltip.compress": "Optimize and Compress Image",
    "tooltip.upload": "Upload Image / JSON",
    "tooltip.uploadFull": "Upload saved image or JSON file",
    "tooltip.compressFull": "Compress and optimize current image",
    "tooltip.export": "Download Image",
    "tooltip.exportFull": "Save and download image to device",
    "tooltip.exportPng": "Download PNG",
    "tooltip.exportJpeg": "Download JPEG",
    "tooltip.exportWebp": "Download WEBP",
    "tooltip.exportJson": "Download Project (.json)",
    "tooltip.swapColors": "Swap Colors",
    "tooltip.primaryColor": "Primary Color (Left Click)",
    "tooltip.secondaryColor": "Secondary Color (Right Click)",
    "tooltip.toggleNav": "Toggle Navigation",
    "tooltip.gradientMode": "Gradient Shadow (Alpha)",
    "tooltip.showGrid": "Show Grid",
    "tooltip.mirrorMode": "Mirror Draw",
    "tooltip.gridSize": "Select or customize grid size",
    "tooltip.gradDir": "Select gradient direction",
    "tooltip.pencilSize": "Pencil size",
    "tooltip.eraserSize": "Eraser size",
    "tooltip.login": "Login / Register",

    "confirm.leave": "Are you sure you want to navigate away? Unsaved drawing data will be lost!",

    "btn.upload": "Upload",
    "btn.compress": "Compress",
    "btn.export": "Download",
    "btn.stopTask": "Stop",

    "tool.pencil": "Pencil (P)",
    "tool.eraser": "Eraser (E)",
    "tool.picker": "Color Picker (I)",
    "tool.fill": "Bucket Fill (F)",
    "tool.magicEraser": "Magic Eraser (M)",
    "tool.outline": "Outline (O)",
    "tool.line": "Line (L)",
    "tool.rect": "Rectangle (R)",
    "tool.circle": "Circle (C)",
    "tool.pan": "Pan (Space)",

    "group.draw": "Draw Tools",
    "group.fillBg": "Fill & Background",
    "group.shape": "Shapes",
    "group.nav": "Navigation",
    "group.settings": "Transform",
    "group.imageOps": "Image Operations",
    "group.operations": "Operations",

    "label.size": "Size:",
    "label.pencilSize": "Pencil Size",
    "label.eraserSize": "Eraser Size",
    "label.outlineThick": "Thickness:",
    "label.shapeThick": "Thickness:",
    "label.gridSize": "Canvas Size:",
    "label.gradientMode": "Gradient Shadow (Alpha)",
    "label.mirrorMode": "Mirror Draw",
    "label.showGrid": "Show Grid",
    "label.sourceImage": "Source Image",
    "label.bg": "Background",
    "label.gradDir": "Direction",

    "option.customSize": "Custom...",
    "option.vertical": "Vertical (Top-Bottom)",
    "option.horizontal": "Horizontal (Left-Right)",
    "option.diagonal": "Diagonal (Corner)",
    "option.radial": "Radial (Center)",

    "transform.rotate": "Rotate 90°",
    "transform.flipH": "Flip Horizontal",
    "transform.flipV": "Flip Vertical",

    "modal.uploadTitle": "Upload / Open File",
    "modal.tabImage": "From Image",
    "modal.tabJson": "From JSON",
    "modal.dropImage": "Click or Drag & Drop image here",
    "modal.autoSize": "Auto-resize canvas to match image",
    "modal.dropJson": "Click or Drag & Drop .json (or .txt) file here",
    "modal.jsonText": "Or paste JSON content:",
    "modal.parseJson": "Parse JSON",
    "modal.downloadTitle": "Download File",
    "modal.jsonPlaceholder": "Paste JSON (or .txt content) here...",

    "status.init": "Welcome to Pixel Normal Edit!",
    "status.rotated": "Rotated 90°.",
    "status.flippedV": "Flipped Vertically.",
    "status.flippedH": "Flipped Horizontally.",
    "status.pickedColor": "Picked color:",
    "status.processing": "Processing...",
    "status.fillComplete": "Fill complete",
    "status.toolSelected": "Selected tool:",
    "status.jsonInvalid": "Invalid JSON structure.",
    "status.jsonLoaded": "JSON Loaded.",
    "status.jsonError": "JSON parsing error:",
    "status.imgProcessing": "Processing image...",
    "status.imgComplete": "Image compressed",
    "status.imgLoaded": "Image loaded",
    "status.noArt": "Nothing to save.",
    "status.dlWebp": "Downloaded WEBP",
    "status.dlPng": "Downloaded PNG",
    "status.dlJson": "Downloaded JSON project.",
    "status.dlJpeg": "Downloaded JPEG",
    "status.undo": "Undo",
    "status.redo": "Redo",
    "status.zoom": "Zoom:",
    "status.zoomFit": "Zoom: Fit to Screen",
    "status.noBg": "No source image available.",
    "status.bgOff": "Background disabled.",
    "status.bgOn": "Source image set as background.",
    "status.sizePrompt": "Enter grid size (e.g. 48 or 43x120):",
    "status.invalidSize": "Invalid size.",
    "status.sizeChanged": "Resized to",
    "status.needImg": "Please upload an image first.",
    "status.compressing": "Compressing image...",
    "status.largeImgWarning": "Large images (>1 million pixels) may cause lag during editing. Are you sure you want to proceed?",
    "status.taskAborted": "Task aborted.",

    "status.scanBg": "Scanning background...",
    "status.scanBgCount": "Scanning background: {0} blocks...",
    "status.analyzeShape": "Analyzing shapes...",
    "status.calcOutline": "Calculating outline...",
    "status.calcOutlinePct": "Calculating outline: {0}%...",
    "status.drawOutlinePct": "Drawing outline: {0}%...",
    "status.outlineDone": "Outline complete ({0} pixels).",
    "status.outlineError": "Error drawing outline.",

    "status.scanFill": "Scanning fill area...",
    "status.scanFillCount": "Scanning area: {0} blocks...",
    "status.filling": "Filling...",
    "status.fillingPct": "Filling: {0}%...",
    "status.fillError": "Error filling area.",

    "status.scanEraser": "Scanning erase area...",
    "status.erasing": "Erasing...",
    "status.erasingPct": "Erasing: {0}%...",
    "status.eraserDone": "Eraser complete ({0} pixels).",
    "status.eraserError": "Error erasing area.",

    "text.hideTools": "Hide Tools",
    "text.showTools": "Show Tools"
  }
};

function getDefaultLang() {
  const saved = localStorage.getItem('appLang');
  if (saved) return saved;
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang && browserLang.toLowerCase().startsWith('vi')) return 'vi';
  return 'en';
}

let currentLang = getDefaultLang();

export function t(key, ...args) {
  let str = (dictionary[currentLang] && dictionary[currentLang][key]) || key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, arg);
  });
  return str;
}

export function setLang(lang) {
  if (!dictionary[lang]) return;
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  updateDOM();
}

export function toggleLang() {
  setLang(currentLang === 'vi' ? 'en' : 'vi');
}

export function getCurrentLang() {
  return currentLang;
}

export function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);

    // <input type="color"> — set title for tooltip
    if (el.tagName === 'INPUT' && el.type === 'color') {
      el.setAttribute('title', value);
      return;
    }

    // <input type="button"> — set value
    if (el.tagName === 'INPUT' && el.type === 'button') {
      el.value = value;
      return;
    }

    // <textarea> — set placeholder
    if (el.tagName === 'TEXTAREA') {
      el.setAttribute('placeholder', value);
      return;
    }

    // <option> — set textContent directly
    if (el.tagName === 'OPTION') {
      el.textContent = value;
      return;
    }

    // tooltip.* / tool.* / transform.* — set data-tooltip attribute
    if (
      key.startsWith('tooltip.') ||
      key.startsWith('tool.') ||
      key.startsWith('transform.')
    ) {
      el.setAttribute('data-tooltip', value);
      return;
    }

    // All other elements: update text nodes only (preserves child icons)
    let updated = false;
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        node.textContent = value;
        updated = true;
      }
    });

    if (!updated && el.childNodes.length === 0) {
      el.textContent = value;
    }
  });

  // Re-render toggleToolsBtn with correct icon + text
  const toggleToolsBtn = document.getElementById('toggleToolsBtn');
  if (toggleToolsBtn) {
    const isHidden = document.querySelector('.editor-layout')?.classList.contains('tools-hidden');
    const iconStr = isHidden ? 'menu' : 'eye-off';
    const txtKey = isHidden ? 'text.showTools' : 'text.hideTools';
    toggleToolsBtn.innerHTML = `<i data-lucide="${iconStr}" style="width:18px;height:18px;"></i> ${t(txtKey)}`;
  }

  if (window.lucide) window.lucide.createIcons();
}
