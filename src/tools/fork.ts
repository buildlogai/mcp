/**
 * buildlog_fork tool - Start a new recording based on an existing buildlog
 */

import { apiClient } from "../api/client";
import { recordingManager } from "../state/recording";
import { ForkParams } from "../types";

export const forkToolDefinition = {
  name: "buildlog_fork",
  description:
    "Start a new recording based on an existing buildlog. Copies steps from the source buildlog " +
    "as a starting point, so you can extend or modify an existing workflow.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: {
        type: "string",
        description: "The buildlog slug or URL to fork from",
      },
      title: {
        type: "string",
        description: "Title for the new forked buildlog",
      },
      fromStep: {
        type: "number",
        description: "Only copy steps up to this number (1-indexed). Omit to copy all steps.",
      },
    },
    required: ["slug", "title"],
  },
};

export async function handleFork(params: ForkParams): Promise<string> {
  try {
    // First, fetch the source buildlog
    const sourceBuildlog = await apiClient.get(params.slug);

    // Initialize the recording with the source steps
    const stepsInherited = recordingManager.initializeFrom(
      sourceBuildlog,
      params.title,
      params.fromStep
    );

    return JSON.stringify({
      success: true,
      message: `Forked "${sourceBuildlog.metadata.title}" as "${params.title}"`,
      forkedFrom: {
        slug: params.slug,
        title: sourceBuildlog.metadata.title,
        originalSteps: sourceBuildlog.steps.length,
      },
      stepsInherited,
      hint: "Recording is now active. Use buildlog_record_step to add new steps, " +
            "then buildlog_record_stop when finished.",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
