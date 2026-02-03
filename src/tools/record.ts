/**
 * buildlog_record_* tools - Recording session management
 */

import { recordingManager } from "../state/recording";
import { RecordStartParams, RecordStepParams, RecordStopParams } from "../types";

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const recordStartToolDefinition = {
  name: "buildlog_record_start",
  description:
    "Begin recording a new buildlog session. Call this before starting a task to capture your workflow. " +
    "Every prompt, action, and decision you make will be logged as steps.",
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Title for the recording (e.g., 'Add Stripe Integration', 'Fix auth bug')",
      },
      description: {
        type: "string",
        description: "Optional longer description of what you're building",
      },
    },
    required: ["title"],
  },
};

export const recordStepToolDefinition = {
  name: "buildlog_record_step",
  description:
    "Log a step to the active recording. Use this to capture prompts you're executing, " +
    "actions you're taking, terminal commands, or notes about decisions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["prompt", "action", "terminal", "note"],
        description:
          "Type of step: 'prompt' for AI prompts, 'action' for code changes, " +
          "'terminal' for commands, 'note' for observations/decisions",
      },
      content: {
        type: "string",
        description:
          "The content of the step. For prompts: the prompt text. For actions: a summary. " +
          "For terminal: the command. For notes: the note content.",
      },
      metadata: {
        type: "object",
        description:
          "Additional metadata. For actions: { filesCreated: [], filesModified: [], approach: '' }. " +
          "For prompts: { context: [], intent: '' }. For terminal: { outcome: 'success'|'failure', summary: '' }. " +
          "For notes: { category: 'tip'|'warning'|'decision' }",
      },
    },
    required: ["type", "content"],
  },
};

export const recordStopToolDefinition = {
  name: "buildlog_record_stop",
  description:
    "End the active recording and return the completed buildlog. " +
    "Call this when you've finished the task. You can then use buildlog_upload to share it.",
  inputSchema: {
    type: "object" as const,
    properties: {
      outcome: {
        type: "string",
        enum: ["success", "partial", "failure"],
        description: "The outcome of the session (default: 'success')",
      },
      summary: {
        type: "string",
        description: "A summary of what was accomplished",
      },
    },
    required: [],
  },
};

// =============================================================================
// HANDLERS
// =============================================================================

export async function handleRecordStart(params: RecordStartParams): Promise<string> {
  try {
    recordingManager.start(params.title, params.description);

    return JSON.stringify({
      success: true,
      message: `Recording started: "${params.title}"`,
      hint: "Use buildlog_record_step to log prompts and actions as you work. " +
            "Use buildlog_record_stop when finished.",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function handleRecordStep(params: RecordStepParams): Promise<string> {
  try {
    const stepNumber = recordingManager.addStep(
      params.type,
      params.content,
      params.metadata
    );

    const stats = recordingManager.getStats();

    return JSON.stringify({
      success: true,
      stepNumber,
      message: `Logged ${params.type} step #${stepNumber}`,
      stats: {
        totalSteps: stats.stepCount,
        duration: `${stats.duration}s`,
        prompts: stats.promptCount,
        actions: stats.actionCount,
      },
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function handleRecordStop(params: RecordStopParams): Promise<string> {
  try {
    const buildlog = recordingManager.stop(params.outcome, params.summary);

    return JSON.stringify({
      success: true,
      message: "Recording stopped",
      buildlog,
      stats: {
        totalSteps: buildlog.steps.length,
        duration: `${buildlog.metadata.durationSeconds}s`,
        filesCreated: buildlog.outcome.filesCreated,
        filesModified: buildlog.outcome.filesModified,
      },
      hint: "Use buildlog_upload to publish this buildlog to buildlog.ai",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
