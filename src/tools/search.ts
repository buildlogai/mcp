/**
 * buildlog_search tool - Search buildlog.ai for relevant workflows
 */

import { apiClient } from "../api/client";
import { SearchParams } from "../types";

export const searchToolDefinition = {
  name: "buildlog_search",
  description:
    "Search buildlog.ai for relevant AI coding workflows. Returns buildlogs matching your query that you can follow or use as reference.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search query (e.g., 'stripe nextjs integration', 'auth with clerk')",
      },
      language: {
        type: "string",
        description: "Filter by programming language (e.g., 'typescript', 'python')",
      },
      framework: {
        type: "string",
        description: "Filter by framework (e.g., 'nextjs', 'react', 'express')",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10,
      },
    },
    required: ["query"],
  },
};

export async function handleSearch(params: SearchParams): Promise<string> {
  try {
    const response = await apiClient.search({
      query: params.query,
      language: params.language,
      framework: params.framework,
      limit: params.limit || 10,
    });

    if (response.buildlogs.length === 0) {
      return JSON.stringify({
        success: true,
        message: `No buildlogs found for "${params.query}"`,
        results: [],
        total: 0,
      });
    }

    const results = response.buildlogs.map((b) => ({
      slug: b.slug,
      title: b.title,
      description: b.description,
      author: b.author?.username || b.author?.name,
      language: b.language,
      framework: b.framework,
      tags: b.tags,
      stepCount: b.stepCount,
      url: b.url,
    }));

    return JSON.stringify({
      success: true,
      message: `Found ${response.total} buildlogs`,
      results,
      total: response.total,
      hasMore: response.hasMore,
      hint: "Use buildlog_get or buildlog_follow with the slug to retrieve a specific buildlog",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
