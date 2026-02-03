/**
 * buildlog_follow tool - Return prompts from a buildlog formatted for execution
 */

import { apiClient } from "../api/client";
import { FollowParams, FollowOutput, FollowPrompt, FollowNote } from "../types";

export const followToolDefinition = {
  name: "buildlog_follow",
  description:
    "Get prompts from a buildlog formatted for execution. Returns the prompts in order with context, " +
    "so you can follow the same workflow in your current project. Use this to replicate a proven workflow.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: {
        type: "string",
        description: "The buildlog slug or full URL",
      },
      step: {
        type: "number",
        description: "Start from a specific step number (1-indexed). Omit to get all prompts.",
      },
    },
    required: ["slug"],
  },
};

export async function handleFollow(params: FollowParams): Promise<string> {
  try {
    const buildlog = await apiClient.get(params.slug);
    
    const prompts: FollowPrompt[] = [];
    const notes: FollowNote[] = [];
    
    // Filter steps starting from the specified step (if provided)
    const startIndex = params.step ? params.step - 1 : 0;
    const relevantSteps = buildlog.steps.slice(startIndex);
    
    for (let i = 0; i < relevantSteps.length; i++) {
      const step = relevantSteps[i];
      const stepNumber = startIndex + i + 1; // 1-indexed
      
      if (step.type === "prompt") {
        prompts.push({
          step: stepNumber,
          prompt: step.content,
          context: step.context,
          intent: step.intent,
        });
      } else if (step.type === "note") {
        notes.push({
          step: stepNumber,
          note: step.content,
          category: step.category,
        });
      } else if (step.type === "action" && step.approach) {
        // Include approach notes as hints
        notes.push({
          step: stepNumber,
          note: `Approach: ${step.approach}`,
          category: "decision",
        });
      }
    }

    if (prompts.length === 0) {
      return JSON.stringify({
        success: true,
        message: "No prompts found in this buildlog",
        title: buildlog.metadata.title,
        totalSteps: buildlog.steps.length,
        prompts: [],
        notes,
      });
    }

    const output: FollowOutput = {
      title: buildlog.metadata.title,
      description: buildlog.metadata.description,
      totalSteps: buildlog.steps.length,
      prompts,
      notes,
      instructions: generateInstructions(buildlog.metadata, prompts.length),
    };

    return JSON.stringify({
      success: true,
      ...output,
      hint: "Execute each prompt in sequence, adapting file paths and names to your project structure.",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

function generateInstructions(
  metadata: { language?: string; framework?: string; replicable: boolean },
  promptCount: number
): string {
  const parts = [
    `Execute each of the ${promptCount} prompts in order, adapting to your current project context.`,
  ];

  if (metadata.language || metadata.framework) {
    const stack = [metadata.framework, metadata.language].filter(Boolean).join(" / ");
    parts.push(`This workflow was built with ${stack}.`);
  }

  if (!metadata.replicable) {
    parts.push("Note: The original author marked this as potentially difficult to replicate.");
  }

  parts.push("Adjust file paths, variable names, and implementation details as needed for your project.");

  return parts.join(" ");
}
