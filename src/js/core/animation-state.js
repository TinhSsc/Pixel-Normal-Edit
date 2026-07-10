// src/js/core/animation-state.js
//
// Quản lý danh sách "frame" cho tính năng Animation Mode.
// LƯU Ý QUAN TRỌNG:
// - Đây là khái niệm HOÀN TOÀN TÁCH BIỆT với "tab" trong tab-manager.js
//   (tab-manager.js quản lý các Source Image khác nhau, còn ở đây là các
//   khung hình / frame của MỘT animation).
// - File này KHÔNG được import bởi bất kỳ file nào khác ở batch này.
//   Việc nối vào UI (toolbar, canvas panel...) sẽ được thực hiện ở các
//   batch tiếp theo (1.2, 1.3, 2.1, 2.2...).
// - Mọi thao tác đọc/ghi dữ liệu pixel đều tái sử dụng resetMaps() và
//   setGridSizeParams() đã có sẵn trong state.js, không viết lại logic
//   tạo Uint32Array hay ImageData riêng.

import {
    pixelMap,
    groupMap,
    offscreenImageData,
    offscreenData32,
    GRID_WIDTH,
    GRID_HEIGHT,
    resetMaps,
    setGridSizeParams,
} from "./state.js";
import { getHistoryState, setHistoryState } from './history.js';

/**
 * Danh sách các frame của animation hiện tại.
 * Mỗi phần tử có dạng:
 * {
 *   id: string,
 *   pixelMap: Uint32Array,
 *   groupMap: Map,
 *   offscreenImageData: ImageData | null,
 *   offscreenData32: Uint32Array | null,
 *   width: number,
 *   height: number,
 * }
 */
export let frames = [];

/** Index của frame đang được chỉnh sửa / hiển thị active. */
export let activeFrameIndex = 0;

/** Đang ở chế độ Animation (true) hay Source Image (false, mặc định). */
export let isAnimationMode = false;

/** Có đang bật xem "hình mờ" của frame liền trước hay không. */
export let showOnionSkin = false;

export function setOnionSkin(value) {
    showOnionSkin = !!value;
    return showOnionSkin;
}

export function toggleOnionSkin() {
    return setOnionSkin(!showOnionSkin);
}

/** Lấy frame liền trước frame đang active, hoặc null nếu là frame đầu tiên. */
export function getPreviousFrame() {
    if (activeFrameIndex <= 0) return null;
    return frames[activeFrameIndex - 1] ?? null;
}

let frameIdCounter = 0;

function createFrameId() {
    frameIdCounter += 1;
    return `frame_${frameIdCounter}`;
}

/**
 * Bật/tắt Animation Mode.
 * KHÔNG tự động khởi tạo frame ở đây — nơi gọi hàm này (UI ở batch 1.2)
 * chịu trách nhiệm gọi initAnimationFromCurrentState() lần đầu nếu cần.
 */
export function setAnimationMode(value) {
    isAnimationMode = !!value;
    return isAnimationMode;
}

export function toggleAnimationMode() {
    return setAnimationMode(!isAnimationMode);
}

/**
 * Khởi tạo animation từ trạng thái pixel hiện tại của state.js.
 * Dùng khi người dùng bật Animation Mode lần đầu tiên: frame đầu tiên
 * (frame 0) sẽ chính là ảnh đang vẽ dở ở Source Image hiện tại.
 * Nếu đã có frame rồi (frames.length > 0) thì không làm gì cả, tránh
 * ghi đè mất dữ liệu animation đang có.
 */
export function initAnimationFromCurrentState() {
    if (frames.length > 0) {
        return frames;
    }

    frames = [
        {
            id: createFrameId(),
            pixelMap: pixelMap.slice(),
            groupMap: new Map(groupMap),
            offscreenImageData: offscreenImageData,
            offscreenData32: offscreenData32,
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            historyState: getHistoryState(),
        },
    ];
    activeFrameIndex = 0;

    return frames;
}

/**
 * Tạo 1 frame trống mới (kích thước width x height, mặc định lấy theo
 * GRID_WIDTH/GRID_HEIGHT hiện tại nếu không truyền vào) và thêm vào cuối
 * danh sách frames[]. KHÔNG tự động chuyển active sang frame mới ở đây —
 * việc set active + swap dữ liệu vào state.js sẽ do setActiveFrameIndex()
 * / loadFrameToCurrentState() đảm nhiệm, để tách rõ 2 trách nhiệm
 * "tạo dữ liệu" và "hiển thị dữ liệu".
 */
export function addFrame(width = GRID_WIDTH, height = GRID_HEIGHT) {
    const newFrame = {
        id: createFrameId(),
        pixelMap: new Uint32Array(width * height),
        groupMap: new Map(),
        offscreenImageData: null,
        offscreenData32: null,
        width,
        height,
        historyState: { undoStack: [], redoStack: [], currentStroke: null },
    };

    frames.push(newFrame);
    return newFrame;
}

/** Lấy frame đang active, hoặc null nếu chưa có frame nào. */
export function getActiveFrame() {
    return frames[activeFrameIndex] ?? null;
}

/**
 * Đặt frame active theo index, có kiểm tra biên để tránh out-of-range.
 * CHỈ đổi con trỏ activeFrameIndex — không tự sync/load dữ liệu qua
 * state.js. Việc sync/load nên gọi tường minh qua
 * syncCurrentStateToFrame() và loadFrameToCurrentState() ở batch 2.2
 * (nextFrame/prevFrame) để đảm bảo thứ tự thao tác luôn rõ ràng.
 */
export function setActiveFrameIndex(index) {
    if (frames.length === 0) return activeFrameIndex;
    const clamped = Math.max(0, Math.min(index, frames.length - 1));
    activeFrameIndex = clamped;
    return activeFrameIndex;
}

/**
 * Lưu dữ liệu pixel hiện tại của state.js vào frames[activeFrameIndex].
 * Gọi hàm này TRƯỚC khi chuyển sang frame khác, để không mất nét vẽ
 * đang dang dở của frame hiện tại.
 */
export function syncCurrentStateToFrame() {
    const frame = frames[activeFrameIndex];
    if (!frame) return null;

    frame.pixelMap = pixelMap.slice();
    frame.groupMap = new Map(groupMap);
    frame.offscreenImageData = offscreenImageData;
    frame.offscreenData32 = offscreenData32;
    frame.width = GRID_WIDTH;
    frame.height = GRID_HEIGHT;
    frame.historyState = getHistoryState();

    return frame;
}

/**
 * Nạp dữ liệu của frame tại `index` vào state.js (pixelMap, groupMap,
 * offscreenImageData/Data32, GRID_WIDTH/HEIGHT) bằng cách tái sử dụng
 * resetMaps() và setGridSizeParams() có sẵn.
 *
 * LƯU Ý: hàm này KHÔNG tự gọi syncCurrentStateToFrame() trước đó — nơi
 * gọi (ví dụ nextFrame()/prevFrame() ở batch 2.2) phải tự đảm bảo đã
 * sync frame cũ trước khi load frame mới, để tránh mất dữ liệu.
 */
export function loadFrameToCurrentState(index) {
    const frame = frames[index];
    if (!frame) return null;

    setActiveFrameIndex(index);
    setGridSizeParams(
        frame.width,
        frame.height,
        frame.offscreenImageData,
        frame.offscreenData32
    );
    resetMaps(frame.pixelMap.slice(), new Map(frame.groupMap));
    setHistoryState(
        frame.historyState || { undoStack: [], redoStack: [], currentStroke: null }
    );

    return frame;
}

/**
 * Chuyển sang frame trước đó.
 * Thứ tự bắt buộc: sync dữ liệu đang vẽ dở của frame hiện tại TRƯỚC,
 * rồi mới load dữ liệu frame mới vào state.js — để không mất nét vẽ.
 */
export function prevFrame() {
    if (activeFrameIndex <= 0) return activeFrameIndex;
    syncCurrentStateToFrame();
    loadFrameToCurrentState(activeFrameIndex - 1);
    return activeFrameIndex;
}

/** Chuyển sang frame kế tiếp — cùng nguyên tắc như prevFrame(). */
export function nextFrame() {
    if (activeFrameIndex >= frames.length - 1) return activeFrameIndex;
    syncCurrentStateToFrame();
    loadFrameToCurrentState(activeFrameIndex + 1);
    return activeFrameIndex;
}

/**
 * Chuyển thẳng tới 1 frame theo index bất kỳ (dùng khi click trực tiếp
 * vào 1 thumbnail trong AnimationStripPanel), cùng nguyên tắc sync trước
 * khi load.
 */
export function goToFrame(index) {
    if (index === activeFrameIndex) return activeFrameIndex;
    if (index < 0 || index >= frames.length) return activeFrameIndex;
    syncCurrentStateToFrame();
    loadFrameToCurrentState(index);
    return activeFrameIndex;
}

/**
 * Chèn 1 frame trắng mới vào vị trí `index`, rồi chuyển active sang frame đó.
 */
export function insertFrameAt(index, width = GRID_WIDTH, height = GRID_HEIGHT) {
    const newFrame = {
        id: createFrameId(),
        pixelMap: new Uint32Array(width * height),
        groupMap: new Map(),
        offscreenImageData: null,
        offscreenData32: null,
        width,
        height,
        historyState: { undoStack: [], redoStack: [], currentStroke: null },
    };

    syncCurrentStateToFrame();
    frames.splice(index, 0, newFrame);
    loadFrameToCurrentState(index);
    return newFrame;
}

/**
 * Xóa frame tại `index`. Không cho xóa nếu chỉ còn 1 frame.
 * Sau khi xóa, active chuyển về frame liền trước (hoặc frame 0).
 */
export function removeFrame(index) {
    if (frames.length <= 1) return false;
    if (index < 0 || index >= frames.length) return false;

    frames.splice(index, 1);
    const newIndex = Math.max(0, Math.min(index, frames.length - 1));
    loadFrameToCurrentState(newIndex);
    return true;
}