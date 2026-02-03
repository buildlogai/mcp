/**
 * buildlog_upload tool - Upload a buildlog to buildlog.ai
 */

import { BuildlogFile } from "@buildlogai/types";
import { apiClient } from "../api/client";
import { UploadParams } from "../types";

export const uploadToolDefinition = {
  name: "buildlog_upload",
  description:
    "Upload a buildlog to buildlog.ai. Requires BUILDLOG_API_KEY environment variable for authentication. " +
    "Use this after buildlog_record_stop to share your workflow with others.",
  inputSchema: {
    type: "object" as const,
    properties: {
      buildlog: {
        type: "object",
        description: "The buildlog object to upload (returned from buildlog_record_stop)",
      },
      public: {
        type: "boolean",
        description: "Whether the buildlog should be publicly visible (default: true)",
        default: true,
      },
    },
    required: ["buildlog"],
  },
};

export async function handleUpload(params: UploadParams): Promise<string> {
  try {
    // Validate the buildlog structure
    const buildlog = params.buildlog as unknown as BuildlogFile;
    
    if (!buildlog.version || !buildlog.metadata || !buildlog.steps) {
      return JSON.stringify({
        success: false,
        error: "Invalid buildlog structure. Must include version, metadata, and steps.",
      });
    }

    const response = await apiClient.upload(buildlog, params.public ?? true);

    return JSON.stringify({
      success: true,
      message: "Buildlog uploaded successfully",
      slug: response.slug,
      url: response.url,
      public: params.public ?? true,
      hint: `View at ${response.url}`,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
