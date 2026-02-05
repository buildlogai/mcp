/**
 * buildlog_suggest tool - Proactive workflow suggestions
 */

import { apiClient } from "../api/client";

export interface SuggestParams {
  taskDescription: string;
  contextFiles?: string[];
}

export const suggestToolDefinition = {
  name: "buildlog_suggest",
  description:
    "Get workflow suggestions based on task description. Call this BEFORE starting a complex task " +
    "to find proven approaches. Returns relevant buildlogs ranked by relevance.",
  inputSchema: {
    type: "object" as const,
    properties: {
      taskDescription: {
        type: "string",
        description: "Description of what you are about to do (e.g., 'Add Stripe subscription checkout to Next.js app')",
      },
      contextFiles: {
        type: "array",
        items: { type: "string" },
        description: "Files relevant to the task (optional, helps improve matching)",
      },
    },
    required: ["taskDescription"],
  },
};

/**
 * Extract keywords from task description
 */
function extractKeywords(text: string): string[] {
  const patterns = [
    // Frameworks and libraries
    /\b(next\.?js|react|vue|svelte|angular|express|fastapi|django|rails|flask|nestjs|remix|astro)\b/gi,
    // Common integrations
    /\b(stripe|auth0?|clerk|supabase|firebase|prisma|drizzle|mongodb|postgres|redis|oauth|jwt)\b/gi,
    // Action verbs
    /\b(add|create|build|implement|fix|refactor|migrate|deploy|test|setup|configure|integrate)\b/gi,
    // Technologies
    /\b(api|rest|graphql|websocket|database|authentication|auth|payment|upload|email|notification)\b/gi,
    // Languages
    /\b(typescript|javascript|python|rust|go|java|ruby|php)\b/gi,
  ];

  const keywords: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) keywords.push(...matches.map((m) => m.toLowerCase()));
  }
  return [...new Set(keywords)];
}

/**
 * Calculate relevance score for a buildlog
 */
function calculateRelevance(
  buildlog: {
    title: string;
    description?: string;
    tags?: string[];
    language?: string;
    framework?: string;
    stepCount: number;
  },
  keywords: string[],
  contextFiles?: string[]
): number {
  let score = 0;

  // Keyword matches in title/description/tags
  const buildlogText = `${buildlog.title} ${buildlog.description || ""} ${buildlog.tags?.join(" ") || ""}`.toLowerCase();
  for (const keyword of keywords) {
    if (buildlogText.includes(keyword)) score += 10;
  }

  // Framework/language match from context files
  if (contextFiles && contextFiles.length > 0) {
    const extensions = contextFiles.map((f) => f.split(".").pop()?.toLowerCase());
    if (
      (extensions.includes("tsx") || extensions.includes("ts")) &&
      buildlog.language?.toLowerCase() === "typescript"
    ) {
      score += 15;
    }
    if (extensions.includes("py") && buildlog.language?.toLowerCase() === "python") {
      score += 15;
    }
    if (extensions.includes("js") && buildlog.language?.toLowerCase() === "javascript") {
      score += 10;
    }
  }

  // Popularity signal (capped)
  score += Math.min(buildlog.stepCount * 0.5, 20);

  return score;
}

export async function handleSuggest(params: SuggestParams): Promise<string> {
  try {
    // Extract keywords and patterns
    const keywords = extractKeywords(params.taskDescription);

    // Search buildlog.ai
    const response = await apiClient.search({
      query: params.taskDescription,
      limit: 10,
    });

    if (response.buildlogs.length === 0) {
      return JSON.stringify({
        success: true,
        suggestions: [],
        message:
          "No relevant workflows found. This might be novel — consider recording your session for others.",
        topRecommendation: null,
        hint: "Use buildlog_record_start to begin recording this session.",
      });
    }

    // Rank by relevance
    const ranked = response.buildlogs
      .map((b) => ({
        slug: b.slug,
        title: b.title,
        description: b.description,
        relevanceScore: calculateRelevance(
          {
            title: b.title,
            description: b.description,
            tags: b.tags,
            language: b.language,
            framework: b.framework,
            stepCount: b.stepCount,
          },
          keywords,
          params.contextFiles
        ),
        stepCount: b.stepCount,
        url: b.url,
        author: b.author?.username || b.author?.name,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const topMatches = ranked.slice(0, 3);

    return JSON.stringify({
      success: true,
      suggestions: topMatches.map((s) => ({
        slug: s.slug,
        title: s.title,
        description: s.description,
        relevanceScore: s.relevanceScore,
        stepCount: s.stepCount,
        url: s.url,
        author: s.author,
      })),
      message:
        topMatches.length > 0
          ? `Found ${ranked.length} relevant workflows. Consider following the top match.`
          : "No strong matches. This might be novel — consider recording for others.",
      topRecommendation:
        topMatches.length > 0
          ? {
              ...topMatches[0],
              followCommand: `Use buildlog_follow with slug "${topMatches[0].slug}"`,
            }
          : null,
      extractedKeywords: keywords,
      hint:
        topMatches.length > 0
          ? `Use buildlog_follow with slug "${topMatches[0].slug}" to get the prompts to execute.`
          : "Use buildlog_record_start to begin recording this novel workflow.",
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
