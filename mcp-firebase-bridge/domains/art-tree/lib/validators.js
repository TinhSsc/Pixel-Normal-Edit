#!/usr/bin/env node
/**
 * validators.js — Art Tree: Shared Zod Validators
 *
 * Common validation schemas used across all Art Tree tools.
 * Centralizes repeated patterns to reduce code duplication.
 */

const { z } = require('zod');

/**
 * Hex color validator - ensures valid 6-character hex color codes
 */
const hexColor = z.string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .describe('Hex color e.g. #ff0000');

/**
 * Canvas size validator - ensures reasonable canvas dimensions
 */
const canvasSize = z.number()
  .int()
  .min(16)
  .max(128)
  .default(32)
  .describe('Canvas dimension (16-128, default 32)');

/**
 * Coordinate validator - ensures integer coordinates
 */
const coordinate = z.number()
  .int()
  .describe('Integer coordinate');

/**
 * Positive integer validator - for sizes, counts, etc.
 */
const positiveInt = z.number()
  .int()
  .min(1)
  .describe('Positive integer (min 1)');

/**
 * Radius validator - ensures positive radius
 */
const radius = z.number()
  .int()
  .min(1)
  .describe('Radius (min 1)');

/**
 * Boolean with default false
 */
const booleanFalse = z.boolean()
  .default(false)
  .describe('Boolean flag (default false)');

/**
 * Common tool parameter schemas
 */
const schemas = {
  hexColor,
  canvasSize,
  coordinate,
  positiveInt,
  radius,
  booleanFalse,
};

module.exports = {
  hexColor,
  canvasSize,
  coordinate,
  positiveInt,
  radius,
  booleanFalse,
  schemas,
};