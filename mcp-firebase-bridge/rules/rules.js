#!/usr/bin/env node
/**
 * rules.js — Core Drawing Rules & Constraints
 *
 * IMPORTANT: Every function in here is a STRICT rule.
 * The Agent MUST NOT skip or execute them out of order.
 */

const NAMING_RULES = {
  canvasTab: {
    pattern: /^[A-Za-z0-9_\-\sÀ-ỹ]{3,64}$/,
    message: 'Canvas name must be 3-64 characters long, containing only letters, numbers, _, -, and spaces',
    example: 'Painting_1',
  },
  stamp: {
    pattern: /^[a-z][a-z0-9_]{2,32}$/,
    message: 'Stamp name must start with a lowercase letter, 3-32 characters long, containing only a-z, 0-9, _',
    example: 'my_tree_01',
  },
  anchor: {
    pattern: /^[a-z][a-z0-9_]{2,32}$/,
    message: 'Anchor name must start with a lowercase letter, 3-32 characters long',
    example: 'head_top',
  },
};

const MODES = {
  CREATE_IMAGE: 'CREATE_IMAGE',
  EDIT_IMAGE: 'EDIT_IMAGE',
  CREATE_ANIMATION: 'CREATE_ANIMATION'
};

const STATUSES = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_USER: 'WAITING_FOR_USER',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

const DRAWING_PHASES = [
  'PHASE_0_SKETCH_BLOCKING',
  'PHASE_1_BACKGROUND',
  'PHASE_2_MAIN_SHAPES',
  'PHASE_3_LINE_SILHOUETTE',
  'PHASE_4_BASE_COLORS',
  'PHASE_5_SHADING',
  'PHASE_6_LIGHTING',
  'PHASE_7_DETAILS',
  'PHASE_8_FINAL_REVIEW'
];

// Workflow Steps are now categorized by MODE
const WORKFLOW_STEPS = {
  CREATE_IMAGE: [
    { id: 'INITIALIZE_CANVAS', label: 'Khởi tạo Canvas', description: 'Kiểm tra và khởi tạo kích thước canvas' },
    { id: 'ANALYZE_REQUEST', label: 'Phân tích yêu cầu', description: 'Phân tích yêu cầu của người dùng thành các thành phần có cấu trúc' },
    { id: 'PLAN_DRAWING', label: 'Lập kế hoạch vẽ', description: 'Tạo kế hoạch vẽ theo thứ tự từ tổng thể đến chi tiết (cần user xác nhận)' },
    { id: 'EXECUTE_PHASES', label: 'Thực hiện vẽ theo giai đoạn', description: 'Vẽ theo từng giai đoạn (PHASE_0 -> PHASE_8)' },
    { id: 'FINALIZE', label: 'Hoàn thiện', description: 'Lưu và hoàn tất ảnh' }
  ],
  EDIT_IMAGE: [
    { id: 'ANALYZE_REQUEST', label: 'Nhận yêu cầu sửa', description: 'Phân tích chính xác nội dung cần sửa' },
    { id: 'GET_CURRENT_IMAGE', label: 'Lấy ảnh hiện tại', description: 'Lấy ảnh hiện tại làm nguồn gốc' },
    { id: 'COMPARE_AND_LOCATE', label: 'So sánh và xác định', description: 'Xác định vùng hoặc layer cần chỉnh sửa' },
    { id: 'EDIT_TARGET_AREA', label: 'Thực hiện chỉnh sửa', description: 'Chỉ sửa phần được yêu cầu trong phạm vi khoanh vùng' },
    { id: 'CHECK_HARMONY', label: 'Kiểm tra sự tương thích', description: 'Kiểm tra sự hòa hợp với các vùng xung quanh và điều chỉnh phần chuyển tiếp' },
    { id: 'FINALIZE', label: 'Cập nhật thay đổi', description: 'Cập nhật thay đổi vào ảnh hiện tại và kiểm tra kết quả' }
  ],
  CREATE_ANIMATION: [
    { id: 'INITIALIZE_CANVAS_AND_ANIMATION', label: 'Khởi tạo Canvas và Animation', description: 'Xác định kích thước, fps, total_frames, loop' },
    { id: 'ANALYZE_ANIMATION', label: 'Phân tích animation', description: 'Phân tích đối tượng, chuyển động, keyframe, layer...' },
    { id: 'PROCESS_FRAMES', label: 'Tạo và xử lý từng frame', description: 'Xử lý từng frame theo đúng thứ tự (0 -> n)' },
    { id: 'CHECK_CONTINUITY', label: 'Kiểm tra tính liên tục', description: 'Kiểm tra tính liên tục của animation giữa các frame' },
    { id: 'FINALIZE', label: 'Hoàn thiện', description: 'Lưu và hoàn tất animation' }
  ]
};

const DRAWING_STEPS = [
  'EXECUTE_PHASES',
  'EDIT_TARGET_AREA',
  'PROCESS_FRAMES'
];

const DRAWING_CONSTRAINTS = {
  maxCanvasSize: { width: 256, height: 256 },
  minCanvasSize: { width: 8, height: 8 },
  allowedColors: null,
  maxStampNameLength: 32,
  maxAnchorNameLength: 32,
};

/**
 * Validate if the canvas name is valid
 * @param {string} name
 * @returns {{ valid: boolean, message?: string }}
 */
function validateCanvasName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Canvas name cannot be empty' };
  }
  if (!NAMING_RULES.canvasTab.pattern.test(name)) {
    return { valid: false, message: NAMING_RULES.canvasTab.message };
  }
  return { valid: true };
}

/**
 * Validate if the stamp name is valid
 * @param {string} name
 * @returns {{ valid: boolean, message?: string }}
 */
function validateStampName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Stamp name cannot be empty' };
  }
  if (!NAMING_RULES.stamp.pattern.test(name)) {
    return { valid: false, message: NAMING_RULES.stamp.message };
  }
  return { valid: true };
}

/**
 * Validate if the canvas size is within limits
 * @param {number} w
 * @param {number} h
 * @returns {{ valid: boolean, message?: string }}
 */
function validateCanvasSize(w, h) {
  const { minCanvasSize, maxCanvasSize } = DRAWING_CONSTRAINTS;
  if (w < minCanvasSize.width || h < minCanvasSize.height) {
    return { valid: false, message: `Minimum canvas size is ${minCanvasSize.width}x${minCanvasSize.height}` };
  }
  if (w > maxCanvasSize.width || h > maxCanvasSize.height) {
    return { valid: false, message: `Maximum canvas size is ${maxCanvasSize.width}x${maxCanvasSize.height}` };
  }
  return { valid: true };
}

module.exports = {
  NAMING_RULES,
  MODES,
  STATUSES,
  DRAWING_PHASES,
  DRAWING_STEPS,
  WORKFLOW_STEPS,
  DRAWING_CONSTRAINTS,
  validateCanvasName,
  validateStampName,
  validateCanvasSize,
};