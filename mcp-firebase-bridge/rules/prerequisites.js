#!/usr/bin/env node
/**
 * prerequisites.js — Prerequisites Check
 *
 * This is an MCP Tool for the agent to call before starting to draw.
 * It will check all prerequisites and return detailed instructions.
 *
 * IMPORTANT: The Agent MUST call this tool FIRST
 * before performing any drawing operations.
 */

const { z } = require('zod');
const { validateCanvasName, validateCanvasSize, DRAWING_CONSTRAINTS, MODES, DRAWING_PHASES } = require('./rules');
const workflow = require('./workflow');
const { registerTool } = require('../core/server');

/**
 * Register workflow/prerequisite tools on the MCP server
 * @param {McpServer} server
 */
function register(server) {
  registerTool(server, 'workflow_start',
    `🚀 REQUIRED: Call this tool FIRST before drawing anything.
This tool initializes a drawing workflow with sequential steps for a specific mode.
Modes: CREATE_IMAGE, EDIT_IMAGE, CREATE_ANIMATION`,
    { mode: z.enum([MODES.CREATE_IMAGE, MODES.EDIT_IMAGE, MODES.CREATE_ANIMATION]).describe('Workflow mode to start') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const state = workflow.start(session, p.mode);
      return {
        content: [{ type: 'text', text: `🚀 **Workflow started in mode: ${p.mode}!**\n\n${workflow.getProgressReport(session)}\n\n---\nStart with step: **${state.steps[0].label}** → ${state.steps[0].description}` }]
      };
    });

  registerTool(server, 'workflow_status',
    'View current workflow progress: current mode, layer, frame, steps and statuses.',
    {},
    () => {
      const session = require('../core/command-bus').SESSION;
      const report = workflow.getProgressReport(session);
      const current = workflow.getCurrentStep(session);
      if (!current) {
        return { content: [{ type: 'text', text: '⚠️ Workflow has not started. Call **workflow_start** first.' }] };
      }
      return {
        content: [{
          type: 'text',
          text: `${report}\n\n👉 **Pending:** ${current.label} — ${current.description}`
        }]
      };
    });

  registerTool(server, 'workflow_advance',
    '✅ Mark current step as complete and move to the next step. Only call AFTER successfully finishing the current step.',
    {},
    () => {
      const session = require('../core/command-bus').SESSION;
      const result = workflow.advance(session);
      if (!result.success) {
        return { isError: true, content: [{ type: 'text', text: `❌ ${result.message}` }] };
      }
      if (!result.nextStep) {
        return { content: [{ type: 'text', text: `🎉 ${result.message}` }] };
      }
      return { content: [{ type: 'text', text: result.message }] };
    });

  registerTool(server, 'workflow_validate',
    `🔍 Check if the agent is allowed to perform a certain action.
  Call this tool BEFORE performing operations to ensure correct workflow order.`,
    { stepId: z.string().describe('ID of the step to validate (e.g., "INITIALIZE_CANVAS")') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const result = workflow.validateStep(session, p.stepId);
      if (!result.allowed) {
        return { isError: true, content: [{ type: 'text', text: result.message }] };
      }
      return { content: [{ type: 'text', text: result.message || `✅ You can perform "${p.stepId}". Please proceed!` }] };
    });

  registerTool(server, 'workflow_set_layer',
    'Set the active layer for the workflow tracking.',
    { layer: z.number().int().describe('The layer index') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const success = workflow.setLayerAndFrame(session, p.layer, undefined);
      if (!success) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      return { content: [{ type: 'text', text: `✅ Active layer set to ${p.layer}` }] };
    });

  registerTool(server, 'workflow_set_frame',
    'Set the active frame for the workflow tracking (useful for animation mode).',
    { frame: z.number().int().describe('The frame index') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const success = workflow.setLayerAndFrame(session, undefined, p.frame);
      if (!success) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      return { content: [{ type: 'text', text: `✅ Active frame set to ${p.frame}` }] };
    });

  registerTool(server, 'workflow_set_phase',
    'Set the active drawing phase (e.g. PHASE_0_SKETCH_BLOCKING, PHASE_1_BACKGROUND, etc.).',
    { phase: z.enum(DRAWING_PHASES).describe('The drawing phase') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const success = workflow.setPhase(session, p.phase);
      if (!success) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      return { content: [{ type: 'text', text: `✅ Active phase set to ${p.phase}` }] };
    });

  registerTool(server, 'workflow_setup_animation',
    'Declare animation metadata for tracking (fps, total_frames, loop).',
    { 
      fps: z.number().int().optional().describe('Frames per second'),
      total_frames: z.number().int().optional().describe('Total frames in the animation'),
      loop: z.boolean().optional().describe('Whether the animation loops')
    },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const success = workflow.setAnimationMeta(session, p.fps, p.total_frames, p.loop);
      if (!success) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      return { content: [{ type: 'text', text: `✅ Animation meta updated: FPS=${p.fps}, Frames=${p.total_frames}, Loop=${p.loop}` }] };
    });

  registerTool(server, 'workflow_create_input_request',
    'Pause the workflow and ask the user for specific input via the UI (e.g. CANVAS_SIZE, APPROVE_PLAN, SELECT_EDIT_REGION).',
    { 
      type: z.enum(['CANVAS_SIZE', 'APPROVE_PLAN', 'REVIEW_RESULT', 'SELECT_EDIT_REGION', 'ANIMATION_SETUP']).describe('The type of request'),
      fields: z.record(z.any()).optional().describe('Context or fields for the request')
    },
    async (p) => {
      const { sendCommand, SESSION } = require('../core/command-bus');
      const reqId = workflow.createInputRequest(SESSION, p.type, p.fields || {});
      if (!reqId) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      
      const res = await sendCommand({ action: 'showUserInputRequest', type: p.type, fields: p.fields || {}, reqId }, 35000);
      
      if (!res.isError) {
        workflow.completeInputRequest(SESSION, reqId, res.content[0].text);
      }
      
      return res;
    });

  registerTool(server, 'workflow_require_approval',
    'Pause the workflow and require user approval before continuing.',
    { required: z.boolean().describe('True to pause and wait for user, False to resume') },
    (p) => {
      const session = require('../core/command-bus').SESSION;
      const success = workflow.setApprovalRequired(session, p.required);
      if (!success) {
        return { isError: true, content: [{ type: 'text', text: '❌ Workflow not started' }] };
      }
      return { content: [{ type: 'text', text: p.required ? '✅ Workflow paused, waiting for user approval.' : '✅ Workflow resumed.' }] };
    });

  registerTool(server, 'workflow_reset',
    '🔄 Reset workflow to initial state. Clears all progress.',
    {},
    () => {
      const session = require('../core/command-bus').SESSION;
      workflow.reset(session);
      return { content: [{ type: 'text', text: '🔄 Workflow reset. Please start from the beginning.' }] };
    });

  registerTool(server, 'validate_canvas_name',
    `Validate canvas name before setting it.
  Rules: 3-64 characters, letters, numbers, _, -, and spaces only.
  Example: "Painting_1", "My Canvas 2024"`,
    { name: z.string().describe('Canvas name to validate') },
    (p) => {
      const result = validateCanvasName(p.name);
      if (!result.valid) {
        return { isError: true, content: [{ type: 'text', text: `❌ ${result.message}` }] };
      }
      return { content: [{ type: 'text', text: `✅ Name "${p.name}" is valid!` }] };
    });

  registerTool(server, 'validate_canvas_size',
    `Validate if canvas size is within allowed limits.
  Limits: ${DRAWING_CONSTRAINTS.minCanvasSize.width}x${DRAWING_CONSTRAINTS.minCanvasSize.height} to ${DRAWING_CONSTRAINTS.maxCanvasSize.width}x${DRAWING_CONSTRAINTS.maxCanvasSize.height}`,
    { width: z.number().int().describe('Width'), height: z.number().int().describe('Height') },
    (p) => {
      const result = validateCanvasSize(p.width, p.height);
      if (!result.valid) {
        return { isError: true, content: [{ type: 'text', text: `❌ ${result.message}` }] };
      }
      return { content: [{ type: 'text', text: `✅ Size ${p.width}x${p.height} is valid!` }] };
    });
}

module.exports = { register };