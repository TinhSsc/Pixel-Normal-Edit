#!/usr/bin/env node
/**
 * rules.js — Core Drawing Rules & Constraints
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

const DRAWING_CONSTRAINTS = {
  maxCanvasSize: { width: 256, height: 256 },
  minCanvasSize: { width: 8, height: 8 },
  allowedColors: null,
  maxStampNameLength: 32,
  maxAnchorNameLength: 32,
  maxRepairAttemptsPerObject: 3,
  maxRepairAttemptsPerMilestone: 6,
  regionClearMaxAreaRatio: 0.25,
  minOccupancyRatio: 0.05,
  recommendedLayerCount: 8,
  maxLayerCount: 32,
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
  DRAWING_CONSTRAINTS,
  validateCanvasName,
  validateStampName,
  validateCanvasSize,
};