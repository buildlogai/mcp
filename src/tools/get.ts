/**
 * buildlog_get and buildlog_get_steps tools
 */

import { apiClient } from "../api/client";
import { GetParams } from "../types";

export const getToolDefinition = {
  name: "buildlog_get",
  description:
    "Fetch a specific buildlog by slug or URL. Returns the full buildlog including metadata, all steps, and outcome.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: {
        type: "string",
        description: "The buildlog slug or full URL (e.g., 'abc123' or 'https://buildlog.ai/b/abc123')",
      },
    },
    required: ["slug"],
  },
};

export const getStepsToolDefinition = {
  name: "buildlog_get_steps",
  description:
    "Get just the steps from a buildlog. Useful when you only need the workflow steps without full metadata.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: {
        type: "string",
        description: "The buildlog slug or full URL",
      },
    },
    required: ["slug"],
  },
};

export async function handleGet(params: GetParams): Promise<string> {
  try {
    const buildlog = await apiClient.get(params.slug);

    return JSON.stringify({
      success: true,
      buildlog: {
        version: buildlog.version,
        format: buildlog.format,
        metadata: buildlog.metadata,
        stepCount: buildlog.steps.length,
        steps: buildlog.steps,
        outcome: buildlog.outcome,
      },
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function handleGetSteps(params: GetParams): Promise<string> {
  try {
    const buildlog = await apiClient.get(params.slug);

    // Return just the steps with minimal context
    const steps = buildlog.steps.map((step, index) => {
      const base = {
        step: index + 1,
        type: step.type,
        timestamp: step.timestamp,
      };

      switch (step.type) {
        case "prompt":
          return {
            ...base,
            content: step.content,
            context: step.context,
            intent: step.intent,
          };
        case "action":
          return {
            ...base,
            summary: step.summary,
            filesCreated: step.filesCreated,
            filesModified: step.filesModified,
            approach: step.approach,
          };
        case "terminal":
          return {
            ...base,
            command: step.command,
            outcome: step.outcome,
            summary: step.summary,
          };
        case "note":
          return {
            ...base,
            content: step.content,
            category: step.category,
          };
        case "checkpoint":
          return {
            ...base,
            name: step.name,
            summary: step.summary,
          };
        case "error":
          return {
            ...base,
            message: step.message,
            resolution: step.resolution,
            resolved: step.resolved,
          };
        default:
          return base;
      }
    });

    return JSON.stringify({
      success: true,
      title: buildlog.metadata.title,
      totalSteps: steps.length,
      steps,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
