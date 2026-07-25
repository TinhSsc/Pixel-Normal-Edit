#!/usr/bin/env node
/**
 * workflow.js — Workflow Engine (Strict step ordering with modes, phases, layers)
 */

const { WORKFLOW_STEPS, MODES, STATUSES, DRAWING_PHASES } = require('./rules');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'workflow_state.json');
let sessions = new Map();

// --- PERSISTENCE ---
function saveState() {
  const data = {};
  for (const [key, val] of sessions.entries()) {
    data[key] = val;
  }
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save workflow state:', e);
  }
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      const data = JSON.parse(content);
      sessions = new Map(Object.entries(data));
    } catch (e) {
      console.error('Failed to load workflow state:', e);
    }
  }
}

// Load state on startup
loadState();


/**
 * Start a new workflow for a session
 * @param {string} sessionId - Session ID (usually MCP_SESSION)
 * @param {string} mode - The mode to start in (CREATE_IMAGE, EDIT_IMAGE, CREATE_ANIMATION)
 * @returns {Object} Initial workflow state
 */
function start(sessionId, mode = MODES.CREATE_IMAGE) {
  if (!WORKFLOW_STEPS[mode]) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  const state = {
    current_mode: mode,
    currentStepIndex: 0,
    steps: WORKFLOW_STEPS[mode].map(s => ({ ...s, status: STATUSES.PENDING })),
    current_layer: 0,
    current_frame: mode === MODES.CREATE_ANIMATION ? 0 : null,
    current_phase: null,
    animation_meta: { fps: null, total_frames: null, loop: true },
    step_status: STATUSES.IN_PROGRESS,
    user_approval_required: false,
    user_input_request: null, // { id, type, fields, status, created_at, response }
    step_completion_flags: {}, // track internal flags for steps
    completedSteps: [],
    history: [],
    startedAt: Date.now(),
  };

  sessions.set(sessionId, state);
  saveState();
  return getState(sessionId);
}

/**
 * Get current workflow state
 * @param {string} sessionId
 * @returns {Object|null}
 */
function getState(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get current step
 * @param {string} sessionId
 * @returns {Object|null}
 */
function getCurrentStep(sessionId) {
  const state = sessions.get(sessionId);
  if (!state) return null;
  return state.steps[state.currentStepIndex] || null;
}

/**
 * Check if the agent is allowed to perform this action
 * @param {string} sessionId
 * @param {string} stepId - ID of the step to perform
 * @returns {{ allowed: boolean, message?: string, currentStep?: Object }}
 */
function validateStep(sessionId, stepId) {
  const state = sessions.get(sessionId);
  if (!state) {
    return {
      allowed: false,
      message: '⚠️ Workflow has not started. Call workflow_start first!',
    };
  }

  if (state.user_approval_required) {
    return {
      allowed: false,
      message: '⛔ Workflow is waiting for user approval. Ask the user for confirmation.',
      currentStep: state.steps[state.currentStepIndex]
    };
  }

  const current = state.steps[state.currentStepIndex];
  if (!current) {
    return {
      allowed: false,
      message: '✅ Workflow is complete! No remaining steps.',
    };
  }

  const targetIndex = state.steps.findIndex(s => s.id === stepId);
  if (targetIndex === -1) {
    return {
      allowed: false,
      message: `❌ Step "${stepId}" not found in current mode workflow.`,
    };
  }

  if (targetIndex < state.currentStepIndex) {
    return {
      allowed: true,
      message: `⚠️ Step "${stepId}" was already completed. Are you sure you want to redo it?`,
      currentStep: current,
    };
  }

  if (targetIndex === state.currentStepIndex) {
    return {
      allowed: true,
      currentStep: current,
    };
  }

  return {
    allowed: false,
    message: `⛔ You cannot perform "${stepId}" yet. First complete: "${current.label}" (${current.description})`,
    currentStep: current,
  };
}

/**
 * Set user approval requirement
 * @param {string} sessionId
 * @param {boolean} required
 */
function setApprovalRequired(sessionId, required) {
  const state = sessions.get(sessionId);
  if (!state) return false;
  state.user_approval_required = required;
  if (required) {
    state.step_status = STATUSES.WAITING_FOR_USER;
  } else {
    if (state.user_input_request && state.user_input_request.status === 'WAITING_FOR_USER') {
      return false; // Cannot unpause if waiting for explicit input request
    }
    state.step_status = STATUSES.IN_PROGRESS;
  }
  saveState();
  return true;
}

/**
 * Create a user input request
 * @param {string} sessionId
 * @param {string} type - e.g. CANVAS_SIZE, APPROVE_PLAN, SELECT_EDIT_REGION
 * @param {Object} fields - fields required
 */
function createInputRequest(sessionId, type, fields = {}) {
  const state = sessions.get(sessionId);
  if (!state) return false;

  state.user_input_request = {
    id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type,
    fields,
    status: 'WAITING_FOR_USER',
    created_at: Date.now()
  };
  state.step_status = STATUSES.WAITING_FOR_USER;
  state.history.push({ event: 'input_request_created', type, time: Date.now() });
  saveState();
  return state.user_input_request.id;
}

/**
 * Complete a user input request
 * @param {string} sessionId
 * @param {string} reqId
 * @param {string} response
 */
function completeInputRequest(sessionId, reqId, response) {
  const state = sessions.get(sessionId);
  if (!state || !state.user_input_request || state.user_input_request.id !== reqId) return false;

  state.user_input_request.status = 'COMPLETED';
  state.user_input_request.response = response;
  state.step_status = STATUSES.IN_PROGRESS; // Unpause workflow

  // Auto-set flags based on completed request type
  if (state.user_input_request.type === 'CANVAS_SIZE') {
    state.step_completion_flags.canvas_initialized = true;
  }
  if (state.user_input_request.type === 'APPROVE_PLAN') {
    state.step_completion_flags.plan_created = true;
  }

  state.history.push({ event: 'input_request_completed', reqId, time: Date.now() });
  saveState();
  return true;
}

/**
 * Update layer/frame
 */
function setLayerAndFrame(sessionId, layer, frame = null) {
  const state = sessions.get(sessionId);
  if (!state) return false;

  if (layer !== undefined && layer !== null) {
    state.current_layer = layer;
  }
  if (frame !== undefined && frame !== null) {
    state.current_frame = frame;
  }
  state.history.push({
    event: 'layer_frame_change',
    layer: state.current_layer,
    frame: state.current_frame,
    time: Date.now()
  });
  saveState();
  return true;
}

/**
 * Update phase
 */
function setPhase(sessionId, phase) {
  const state = sessions.get(sessionId);
  if (!state) return false;

  state.current_phase = phase;
  state.history.push({
    event: 'phase_change',
    phase: phase,
    time: Date.now()
  });
  saveState();
  return true;
}

/**
 * Set animation meta
 */
function setAnimationMeta(sessionId, fps, total_frames, loop) {
  const state = sessions.get(sessionId);
  if (!state) return false;

  if (fps !== undefined) state.animation_meta.fps = fps;
  if (total_frames !== undefined) state.animation_meta.total_frames = total_frames;
  if (loop !== undefined) state.animation_meta.loop = loop;

  saveState();
  return true;
}

/**
 * Set step completion flag (internal validation)
 */
function setStepFlag(sessionId, flagName, value) {
  const state = sessions.get(sessionId);
  if (!state) return false;
  state.step_completion_flags[flagName] = value;
  saveState();
  return true;
}

/**
 * Mark current step as completed and advance to the next step
 * @param {string} sessionId
 * @returns {Object} Step transition result
 */
function advance(sessionId) {
  const state = sessions.get(sessionId);
  if (!state) {
    return { success: false, message: 'Workflow has not started' };
  }

  if (state.user_approval_required) {
    return { success: false, message: 'Cannot advance: Waiting for user approval.' };
  }

  if (state.step_status === STATUSES.WAITING_FOR_USER) {
    return { success: false, message: 'Cannot advance: Waiting for user approval or input.' };
  }

  const current = state.steps[state.currentStepIndex];
  if (!current) {
    return { success: false, message: 'Workflow is complete' };
  }

  // Pre-condition validation block
  if (current.id === 'INITIALIZE_CANVAS' && !state.step_completion_flags.canvas_initialized) {
    return { success: false, message: 'Cannot advance: Canvas has not been initialized. You MUST use workflow_create_input_request with type CANVAS_SIZE first.' };
  }
  if (current.id === 'PLAN_DRAWING' && !state.step_completion_flags.plan_created) {
    return { success: false, message: 'Cannot advance: Drawing plan has not been finalized.' };
  }

  current.status = STATUSES.COMPLETED;
  state.completedSteps.push(current.id);
  state.history.push({ event: 'step_completed', step: current.id, layer: state.current_layer, frame: state.current_frame, time: Date.now() });

  state.currentStepIndex++;

  const next = state.steps[state.currentStepIndex] || null;
  if (next) {
    next.status = STATUSES.IN_PROGRESS;
    state.step_status = STATUSES.IN_PROGRESS;
    saveState();
    return {
      success: true,
      completedStep: current,
      nextStep: next,
      message: `✅ Completed: "${current.label}". Next step: "${next.label}" — ${next.description}`,
    };
  }

  state.step_status = STATUSES.COMPLETED;
  saveState();
  return {
    success: true,
    completedStep: current,
    nextStep: null,
    message: `🎉 All steps completed! The task is ready.`,
  };
}

/**
 * Reset workflow to the beginning
 * @param {string} sessionId
 */
function reset(sessionId) {
  const state = sessions.get(sessionId);
  const mode = state ? state.current_mode : MODES.CREATE_IMAGE;
  sessions.delete(sessionId);
  saveState();
  return start(sessionId, mode);
}

/**
 * Get text-based progress report for the agent
 * @param {string} sessionId
 * @returns {string}
 */
function getProgressReport(sessionId) {
  const state = sessions.get(sessionId);
  if (!state) return 'Workflow has not started.';

  const lines = [
    `📋 **Workflow Progress: [Mode: ${state.current_mode}]**`,
    `Layer: ${state.current_layer} | Frame: ${state.current_frame !== null ? state.current_frame : 'N/A'}`,
    `Phase: ${state.current_phase !== null ? state.current_phase : 'N/A'}`,
    `Animation Meta: FPS=${state.animation_meta.fps || 'N/A'}, Frames=${state.animation_meta.total_frames || 'N/A'}, Loop=${state.animation_meta.loop}`,
    `Status: ${state.step_status}`,
    `User Approval Required: ${state.user_approval_required ? 'YES' : 'NO'}`,
    state.user_input_request && state.user_input_request.status === 'WAITING_FOR_USER' ? `⚠️ PENDING REQUEST: ${state.user_input_request.type}` : '',
    `\n**Steps:**`
  ];

  state.steps.forEach((step, i) => {
    const icon = step.status === STATUSES.COMPLETED ? '✅' :
      step.status === STATUSES.IN_PROGRESS ? '🔄' : '⬜';
    const marker = i === state.currentStepIndex ? ' ← **IN PROGRESS**' : '';
    lines.push(`${icon} **${step.label}**${marker}`);
    if (step.status === STATUSES.IN_PROGRESS || i === state.currentStepIndex) {
      lines.push(`   → ${step.description}`);
    }
  });

  return lines.join('\n');
}

module.exports = {
  start,
  getState,
  getCurrentStep,
  validateStep,
  advance,
  reset,
  getProgressReport,
  setApprovalRequired,
  createInputRequest,
  completeInputRequest,
  setLayerAndFrame,
  setPhase,
  setAnimationMeta,
  setStepFlag
};