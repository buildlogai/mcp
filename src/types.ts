/**
 * Local type definitions for the MCP server
 * Re-exports from @buildlogai/types and adds MCP-specific types
 */

// Re-export core types from @buildlogai/types
export {
  BuildlogFile,
  BuildlogFormat,
  BuildlogMetadata,
  BuildlogStep,
  BuildlogOutcome,
  BuildlogAuthor,
  PromptStep,
  ActionStep,
  TerminalStep,
  NoteStep,
  CheckpointStep,
  ErrorStep,
  EditorType,
  AIProvider,
  StepType,
} from "@buildlogai/types";

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Search result from buildlog.ai API
 */
export interface BuildlogSearchResult {
  slug: string;
  title: string;
  description?: string;
  author?: {
    name?: string;
    username?: string;
  };
  language?: string;
  framework?: string;
  tags?: string[];
  stepCount: number;
  createdAt: string;
  url: string;
}

/**
 * Search response from API
 */
export interface SearchResponse {
  buildlogs: BuildlogSearchResult[];
  total: number;
  hasMore: boolean;
}

/**
 * Upload response from API
 */
export interface UploadResponse {
  slug: string;
  url: string;
  success: boolean;
}

// =============================================================================
// TOOL PARAMETER TYPES
// =============================================================================

export interface SearchParams {
  query: string;
  language?: string;
  framework?: string;
  limit?: number;
}

export interface GetParams {
  slug: string;
}

export interface FollowParams {
  slug: string;
  step?: number;
}

export interface RecordStartParams {
  title: string;
  description?: string;
}

export interface RecordStepParams {
  type: "prompt" | "action" | "terminal" | "note";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RecordStopParams {
  outcome?: "success" | "partial" | "failure";
  summary?: string;
}

export interface UploadParams {
  buildlog: Record<string, unknown>;
  public?: boolean;
}

export interface ForkParams {
  slug: string;
  title: string;
  fromStep?: number;
}

export interface SuggestParams {
  taskDescription: string;
  contextFiles?: string[];
}

// =============================================================================
// FOLLOW OUTPUT TYPES
// =============================================================================

export interface FollowPrompt {
  step: number;
  prompt: string;
  context?: string[];
  intent?: string;
}

export interface FollowNote {
  step: number;
  note: string;
  category?: string;
}

export interface FollowOutput {
  title: string;
  description?: string;
  totalSteps: number;
  prompts: FollowPrompt[];
  notes: FollowNote[];
  instructions: string;
}
