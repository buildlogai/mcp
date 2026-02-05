/**
 * In-memory recording state management
 */
import { BuildlogFile } from "@buildlogai/types";
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
declare class RecordingManager {
    private config;
    private state;
    private _isAutoSession;
    constructor();
    /**
     * Get whether auto-record is enabled
     */
    get autoRecordEnabled(): boolean;
    /**
     * Get whether current session is an auto-session
     */
    get isAutoSession(): boolean;
    /**
     * Start an automatic recording session
     */
    private startAutoSession;
    /**
     * Internal start method that handles the actual recording start
     */
    private startInternal;
    /**
     * Start a new recording session
     */
    start(title: string, description?: string): void;
    /**
     * Add a step to the active recording
     */
    addStep(type: "prompt" | "action" | "terminal" | "note", content: string, metadata?: Record<string, unknown>): number;
    /**
     * Stop the recording and return the buildlog
     */
    stop(outcome?: "success" | "partial" | "failure", summary?: string): BuildlogFile;
    /**
     * Check if recording is active
     */
    isActive(): boolean;
    /**
     * Get current recording statistics
     */
    getStats(): RecordingStats;
    /**
     * Get the current buildlog (for forking)
     */
    getCurrentBuildlog(): BuildlogFile | null;
    /**
     * Initialize from an existing buildlog (for forking)
     */
    initializeFrom(buildlog: BuildlogFile, title: string, fromStep?: number): number;
    /**
     * Append step to agent-feed.jsonl for VS Code extension interop
     */
    private appendToAgentFeed;
}
export declare const recordingManager: RecordingManager;
export {};
