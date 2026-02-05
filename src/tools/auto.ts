/**
 * buildlog_auto_status tool - Check auto-recording status
 */

import { recordingManager } from "../state/recording";

export const autoStatusToolDefinition = {
  name: "buildlog_auto_status",
  description:
    "Check if auto-recording is active and get current session stats. " +
    "Auto-recording starts automatically when the MCP server loads (can be disabled with BUILDLOG_AUTO_RECORD=false).",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handleAutoStatus(): Promise<string> {
  try {
    const stats = recordingManager.getStats();
    
    return JSON.stringify({
      success: true,
      autoRecordEnabled: recordingManager.autoRecordEnabled,
      isRecording: recordingManager.isActive(),
      isAutoSession: recordingManager.isAutoSession,
      stats: {
        stepCount: stats.stepCount,
        duration: `${stats.duration}s`,
        promptCount: stats.promptCount,
        actionCount: stats.actionCount,
      },
      hint: recordingManager.isAutoSession
        ? "Use buildlog_record_start to convert this auto-session to a named session, or continue and it will be saved automatically."
        : recordingManager.isActive()
          ? "Recording is active. Use buildlog_record_step to log steps."
          : "No active recording. Use buildlog_record_start to begin.",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
