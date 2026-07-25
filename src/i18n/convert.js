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
    "group.settings": "Settings",
    "group.imageOps": "Image Operations",
    "tooltip.rulerMode": "Ruler",
    "label.rulerOptions": "Ruler Options",
    "option.rulerDraw": "Draw",
    "option.rulerMeasure": "Measure",
    "tooltip.gradientMode": "Gradient",
    "label.gradDir": "Direction",
    "option.vertical": "Vertical",
    "option.horizontal": "Horizontal",
    "option.diagonal": "Diagonal",
    "option.radial": "Radial",
    "tooltip.showGrid": "Show Grid",
    "tooltip.mirrorMode": "Mirror",
    "transform.rotate": "Rotate",
    "label.rotateOptions": "Rotate Options",
    "option.rotateSize": "By Size",
    "option.rotatePixel": "By Pixel",
    "transform.flipH": "Flip Horizontal",
    "transform.flipV": "Flip Vertical",
    "group.navigation": "Navigation",
    "tool.crop": "Crop",
    "tool.cut": "Cut",
    "tool.copy": "Copy",
    "tool.paste": "Paste",
    "toolVariant.eraser": "Eraser",
    "toolVariant.picker": "Color Picker",
    "toolVariant.fill": "Fill",
    "toolVariant.magic": "Magic Eraser",
    "toolVariant.outline": "Outline",
    "toolVariant.line": "Line",
    "toolVariant.rect": "Rectangle",
    "toolVariant.circle": "Circle",
    "settings.aiConnection": "AI Connection (MCP)",
    "status.mcpConnected": "Status: MCP Connected",
    "status.mcpWaiting": "Waiting for connection...",
    "btn.copyMcpCmd": "Copy MCP Command",
    "settings.mcpOptionA": "Option A: For Claude Desktop",
    "settings.mcpOptionADesc": "Add this configuration to your claude_desktop_config.json file:",
    "settings.mcpOptionB": "Option B: For Cursor (Terminal Command)",
    "settings.mcpOptionBDesc": "Run this command in your Terminal to start the MCP server:",
    "btn.copied": "Copied!",
    "btn.copy": "Copy",
    "layer.title": "Layers",
    "layer.add": "Add Layer"
  },
  vi: {
    "group.settings": "Cài đặt",
    "group.imageOps": "Thao tác ảnh",
    "tooltip.rulerMode": "Thước đo",
    "label.rulerOptions": "Tùy chọn thước",
    "option.rulerDraw": "Vẽ",
    "option.rulerMeasure": "Đo đạc",
    "tooltip.gradientMode": "Gradient",
    "label.gradDir": "Hướng",
    "option.vertical": "Dọc",
    "option.horizontal": "Ngang",
    "option.diagonal": "Chéo",
    "option.radial": "Xung quanh",
    "tooltip.showGrid": "Lưới",
    "tooltip.mirrorMode": "Đối xứng",
    "transform.rotate": "Xoay",
    "label.rotateOptions": "Tùy chọn xoay",
    "option.rotateSize": "Theo kích thước",
    "option.rotatePixel": "Theo Pixel",
    "transform.flipH": "Lật ngang",
    "transform.flipV": "Lật dọc",
    "group.navigation": "Điều hướng",
    "tool.crop": "Cắt",
    "tool.cut": "Cắt (Cut)",
    "tool.copy": "Sao chép",
    "tool.paste": "Dán",
    "toolVariant.eraser": "Tẩy",
    "toolVariant.picker": "Lấy màu",
    "toolVariant.fill": "Đổ màu",
    "toolVariant.magic": "Xóa nền",
    "toolVariant.outline": "Tạo viền",
    "toolVariant.line": "Đường thẳng",
    "toolVariant.rect": "Hình chữ nhật",
    "toolVariant.circle": "Hình tròn",
    "settings.aiConnection": "Kết nối AI (MCP)",
    "status.mcpConnected": "Trạng thái: đã kết nối mcp",
    "status.mcpWaiting": "Đang chờ kết nối...",
    "btn.copyMcpCmd": "Copy lệnh chạy MCP",
    "settings.mcpOptionA": "Tùy chọn A: Dành cho Claude Desktop",
    "settings.mcpOptionADesc": "Thêm cấu hình này vào file claude_desktop_config.json của bạn:",
    "settings.mcpOptionB": "Tùy chọn B: Dành cho Cursor (Dạng lệnh Terminal)",
    "settings.mcpOptionBDesc": "Chạy lệnh này trong Terminal để khởi động máy chủ MCP:",
    "btn.copied": "Đã copy!",
    "btn.copy": "Copy",
    "layer.title": "Lớp (Layers)",
    "layer.add": "Thêm Lớp"
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
      const lineRegex = new RegExp(`(^\\s*(["']?)${escapedKey}\\2\\s*:)\\s*(.*?)(\\s*(?:,|$))`, "m");
      const match = content.match(lineRegex);
      if (match && value !== "") {
        const newValueStr = JSON.stringify(value);
        const currentRaw = match[3];
        let shouldReplace = false;
        
        try {
           // eval to handle both single and double quotes gracefully
           const evalValue = eval(`(${currentRaw})`);
           if (evalValue !== value) {
              shouldReplace = true;
           }
        } catch(e) {
           if (currentRaw !== newValueStr) shouldReplace = true;
        }

        if (shouldReplace) {
          content = content.replace(lineRegex, `$1 ${newValueStr}$4`);
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