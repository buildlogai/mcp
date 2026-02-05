/**
 * In-memory recording state management
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import {
  BuildlogFile,
  BuildlogStep,
  BuildlogOutcome,
  PromptStep,
  ActionStep,
  TerminalStep,
  NoteStep,
} from "@buildlogai/types";

// Package version for source metadata
const PACKAGE_VERSION = "1.1.0";

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Recording configuration
 */
interface RecordingConfig {
  autoRecord: boolean;
  apiKey?: string;
}

/**
 * Recording state interface
 */
interface RecordingState {
  isRecording: boolean;
  buildlog: BuildlogFile | null;
  startTime: number | null;
  stepSequence: number;
}

/**
 * Recording statistics
 */
export interface RecordingStats {
  stepCount: number;
  duration: number;
  promptCount: number;
  actionCount: number;
}

/**
 * Singleton manager for recording state
 */
class RecordingManager {
  private config: RecordingConfig;
  private state: RecordingState = {
    isRecording: false,
    buildlog: null,
    startTime: null,
    stepSequence: 0,
  };
  private _isAutoSession: boolean = false;

  constructor() {
    this.config = {
      autoRecord: process.env.BUILDLOG_AUTO_RECORD !== 'false', // Default ON
      apiKey: process.env.BUILDLOG_API_KEY
    };
    
    // If auto-record is enabled, start recording immediately
    if (this.config.autoRecord) {
      this.startAutoSession();
    }
  }

  /**
   * Get whether auto-record is enabled
   */
  get autoRecordEnabled(): boolean {
    return this.config.autoRecord;
  }

  /**
   * Get whether current session is an auto-session
   */
  get isAutoSession(): boolean {
    return this._isAutoSession;
  }

  /**
   * Start an automatic recording session
   */
  private startAutoSession(): void {
    this.startInternal('Auto-recorded session', 'Automatically captured workflow');
    this._isAutoSession = true;
  }

  /**
   * Internal start method that handles the actual recording start
   */
  private startInternal(title: string, description?: string): void {
    const now = new Date();
    
    this.state = {
      isRecording: true,
      startTime: Date.now(),
      stepSequence: 0,
      buildlog: {
        version: "2.0.0",
        format: "slim",
        metadata: {
          id: generateId(),
          title,
          description,
          createdAt: now.toISOString(),
          durationSeconds: 0,
          editor: "other",
          aiProvider: "other",
          replicable: true,
          // Source attribution
          source: {
            tool: '@buildlogai/mcp',
            version: PACKAGE_VERSION,
            client: process.env.MCP_CLIENT || 'unknown'
          }
        },
        steps: [],
        outcome: {
          status: "partial",
          summary: "",
          filesCreated: 0,
          filesModified: 0,
          canReplicate: true,
        },
      },
    };
  }

  /**
   * Start a new recording session
   */
  start(title: string, description?: string): void {
    // If auto-session is active, convert it to a named session
    if (this._isAutoSession && this.state.isRecording && this.state.buildlog) {
      this.state.buildlog.metadata.title = title;
      if (description) {
        this.state.buildlog.metadata.description = description;
      }
      this._isAutoSession = false;
      return;
    }

    if (this.state.isRecording) {
      throw new Error("A recording is already in progress. Stop it first.");
    }

    this.startInternal(title, description);
    this._isAutoSession = false;
  }

  /**
   * Add a step to the active recording
   */
  addStep(
    type: "prompt" | "action" | "terminal" | "note",
    content: string,
    metadata?: Record<string, unknown>
  ): number {
    if (!this.state.isRecording || !this.state.buildlog || !this.state.startTime) {
      throw new Error("No active recording. Start a recording first.");
    }

    const timestamp = (Date.now() - this.state.startTime) / 1000;
    const sequence = this.state.stepSequence++;
    const id = generateId();

    let step: BuildlogStep;

    switch (type) {
      case "prompt":
        step = {
          id,
          timestamp,
          sequence,
          type: "prompt",
          content,
          context: metadata?.context as string[] | undefined,
          intent: metadata?.intent as string | undefined,
        } as PromptStep;
        break;

      case "action":
        step = {
          id,
          timestamp,
          sequence,
          type: "action",
          summary: content,
          filesCreated: metadata?.filesCreated as string[] | undefined,
          filesModified: metadata?.filesModified as string[] | undefined,
          filesDeleted: metadata?.filesDeleted as string[] | undefined,
          packagesAdded: metadata?.packagesAdded as string[] | undefined,
          approach: metadata?.approach as string | undefined,
        } as ActionStep;
        break;

      case "terminal":
        step = {
          id,
          timestamp,
          sequence,
          type: "terminal",
          command: content,
          outcome: (metadata?.outcome as "success" | "failure" | "partial") || "success",
          summary: metadata?.summary as string | undefined,
        } as TerminalStep;
        break;

      case "note":
        step = {
          id,
          timestamp,
          sequence,
          type: "note",
          content,
          category: metadata?.category as NoteStep["category"] | undefined,
        } as NoteStep;
        break;

      default:
        throw new Error(`Unknown step type: ${type}`);
    }

    this.state.buildlog.steps.push(step);

    // Also write to agent-feed.jsonl for VS Code extension interop
    this.appendToAgentFeed(step);

    return sequence + 1; // Return 1-indexed step number
  }

  /**
   * Stop the recording and return the buildlog
   */
  stop(outcome?: "success" | "partial" | "failure", summary?: string): BuildlogFile {
    if (!this.state.isRecording || !this.state.buildlog || !this.state.startTime) {
      throw new Error("No active recording to stop.");
    }

    const buildlog = this.state.buildlog;
    const duration = (Date.now() - this.state.startTime) / 1000;
    const wasAutoSession = this._isAutoSession;

    // Update metadata
    buildlog.metadata.durationSeconds = Math.round(duration);

    // Calculate outcome stats
    let filesCreated = 0;
    let filesModified = 0;

    for (const step of buildlog.steps) {
      if (step.type === "action") {
        filesCreated += step.filesCreated?.length || 0;
        filesModified += step.filesModified?.length || 0;
      }
    }

    // Update outcome
    buildlog.outcome = {
      status: outcome || "success",
      summary: summary || `Completed ${buildlog.steps.length} steps`,
      filesCreated,
      filesModified,
      canReplicate: true,
    };

    // If auto-session with meaningful content, suggest upload
    if (wasAutoSession && buildlog.steps.length >= 3) {
      (buildlog.metadata as any).suggestUpload = true;
    }

    // Reset state
    this.state = {
      isRecording: false,
      buildlog: null,
      startTime: null,
      stepSequence: 0,
    };
    this._isAutoSession = false;

    return buildlog;
  }

  /**
   * Check if recording is active
   */
  isActive(): boolean {
    return this.state.isRecording;
  }

  /**
   * Get current recording statistics
   */
  getStats(): RecordingStats {
    if (!this.state.buildlog || !this.state.startTime) {
      return { stepCount: 0, duration: 0, promptCount: 0, actionCount: 0 };
    }

    const steps = this.state.buildlog.steps;
    return {
      stepCount: steps.length,
      duration: Math.round((Date.now() - this.state.startTime) / 1000),
      promptCount: steps.filter((s) => s.type === "prompt").length,
      actionCount: steps.filter((s) => s.type === "action").length,
    };
  }

  /**
   * Get the current buildlog (for forking)
   */
  getCurrentBuildlog(): BuildlogFile | null {
    return this.state.buildlog;
  }

  /**
   * Initialize from an existing buildlog (for forking)
   */
  initializeFrom(buildlog: BuildlogFile, title: string, fromStep?: number): number {
    if (this.state.isRecording) {
      throw new Error("A recording is already in progress. Stop it first.");
    }

    const now = new Date();
    const stepsToInherit = fromStep 
      ? buildlog.steps.slice(0, fromStep)
      : [...buildlog.steps];

    // Re-sequence inherited steps
    const inheritedSteps = stepsToInherit.map((step, index) => ({
      ...step,
      id: generateId(),
      sequence: index,
    }));

    this.state = {
      isRecording: true,
      startTime: Date.now(),
      stepSequence: inheritedSteps.length,
      buildlog: {
        version: "2.0.0",
        format: "slim",
        metadata: {
          id: generateId(),
          title,
          description: `Forked from: ${buildlog.metadata.title}`,
          createdAt: now.toISOString(),
          durationSeconds: 0,
          editor: buildlog.metadata.editor || "other",
          aiProvider: buildlog.metadata.aiProvider || "other",
          language: buildlog.metadata.language,
          framework: buildlog.metadata.framework,
          tags: buildlog.metadata.tags,
          replicable: true,
          dependencies: [buildlog.metadata.id],
          // Source attribution
          source: {
            tool: '@buildlogai/mcp',
            version: PACKAGE_VERSION,
            client: process.env.MCP_CLIENT || 'unknown'
          }
        },
        steps: inheritedSteps as BuildlogStep[],
        outcome: {
          status: "partial",
          summary: "",
          filesCreated: 0,
          filesModified: 0,
          canReplicate: true,
        },
      },
    };

    this._isAutoSession = false;
    return inheritedSteps.length;
  }

  /**
   * Append step to agent-feed.jsonl for VS Code extension interop
   */
  private appendToAgentFeed(step: BuildlogStep): void {
    try {
      const feedDir = path.join(os.homedir(), ".buildlog");
      const feedPath = path.join(feedDir, "agent-feed.jsonl");

      // Only write if the directory exists (VS Code extension is installed)
      if (fs.existsSync(feedDir)) {
        const feedEntry = {
          type: step.type,
          content: step.type === "prompt" ? (step as PromptStep).content : undefined,
          summary: step.type === "action" ? (step as ActionStep).summary : undefined,
          command: step.type === "terminal" ? (step as TerminalStep).command : undefined,
          filesModified: step.type === "action" ? (step as ActionStep).filesModified : undefined,
          filesCreated: step.type === "action" ? (step as ActionStep).filesCreated : undefined,
          timestamp: new Date().toISOString(),
        };

        fs.appendFileSync(feedPath, JSON.stringify(feedEntry) + "\n");
      }
    } catch (error) {
      // Silently ignore errors - this is optional interop
    }
  }
}

// Singleton instance
export const recordingManager = new RecordingManager();
