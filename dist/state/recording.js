"use strict";
/**
 * In-memory recording state management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordingManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
/**
 * Generate a UUID v4
 */
function generateId() {
    return crypto.randomUUID();
}
/**
 * Singleton manager for recording state
 */
class RecordingManager {
    state = {
        isRecording: false,
        buildlog: null,
        startTime: null,
        stepSequence: 0,
    };
    /**
     * Start a new recording session
     */
    start(title, description) {
        if (this.state.isRecording) {
            throw new Error("A recording is already in progress. Stop it first.");
        }
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
     * Add a step to the active recording
     */
    addStep(type, content, metadata) {
        if (!this.state.isRecording || !this.state.buildlog || !this.state.startTime) {
            throw new Error("No active recording. Start a recording first.");
        }
        const timestamp = (Date.now() - this.state.startTime) / 1000;
        const sequence = this.state.stepSequence++;
        const id = generateId();
        let step;
        switch (type) {
            case "prompt":
                step = {
                    id,
                    timestamp,
                    sequence,
                    type: "prompt",
                    content,
                    context: metadata?.context,
                    intent: metadata?.intent,
                };
                break;
            case "action":
                step = {
                    id,
                    timestamp,
                    sequence,
                    type: "action",
                    summary: content,
                    filesCreated: metadata?.filesCreated,
                    filesModified: metadata?.filesModified,
                    filesDeleted: metadata?.filesDeleted,
                    packagesAdded: metadata?.packagesAdded,
                    approach: metadata?.approach,
                };
                break;
            case "terminal":
                step = {
                    id,
                    timestamp,
                    sequence,
                    type: "terminal",
                    command: content,
                    outcome: metadata?.outcome || "success",
                    summary: metadata?.summary,
                };
                break;
            case "note":
                step = {
                    id,
                    timestamp,
                    sequence,
                    type: "note",
                    content,
                    category: metadata?.category,
                };
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
    stop(outcome, summary) {
        if (!this.state.isRecording || !this.state.buildlog || !this.state.startTime) {
            throw new Error("No active recording to stop.");
        }
        const buildlog = this.state.buildlog;
        const duration = (Date.now() - this.state.startTime) / 1000;
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
        // Reset state
        this.state = {
            isRecording: false,
            buildlog: null,
            startTime: null,
            stepSequence: 0,
        };
        return buildlog;
    }
    /**
     * Check if recording is active
     */
    isActive() {
        return this.state.isRecording;
    }
    /**
     * Get current recording statistics
     */
    getStats() {
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
    getCurrentBuildlog() {
        return this.state.buildlog;
    }
    /**
     * Initialize from an existing buildlog (for forking)
     */
    initializeFrom(buildlog, title, fromStep) {
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
                },
                steps: inheritedSteps,
                outcome: {
                    status: "partial",
                    summary: "",
                    filesCreated: 0,
                    filesModified: 0,
                    canReplicate: true,
                },
            },
        };
        return inheritedSteps.length;
    }
    /**
     * Append step to agent-feed.jsonl for VS Code extension interop
     */
    appendToAgentFeed(step) {
        try {
            const feedDir = path.join(os.homedir(), ".buildlog");
            const feedPath = path.join(feedDir, "agent-feed.jsonl");
            // Only write if the directory exists (VS Code extension is installed)
            if (fs.existsSync(feedDir)) {
                const feedEntry = {
                    type: step.type,
                    content: step.type === "prompt" ? step.content : undefined,
                    summary: step.type === "action" ? step.summary : undefined,
                    command: step.type === "terminal" ? step.command : undefined,
                    filesModified: step.type === "action" ? step.filesModified : undefined,
                    filesCreated: step.type === "action" ? step.filesCreated : undefined,
                    timestamp: new Date().toISOString(),
                };
                fs.appendFileSync(feedPath, JSON.stringify(feedEntry) + "\n");
            }
        }
        catch (error) {
            // Silently ignore errors - this is optional interop
        }
    }
}
// Singleton instance
exports.recordingManager = new RecordingManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N0YXRlL3JlY29yZGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBQ3pCLCtDQUFpQztBQVdqQzs7R0FFRztBQUNILFNBQVMsVUFBVTtJQUNqQixPQUFPLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM3QixDQUFDO0FBc0JEOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0I7SUFDWixLQUFLLEdBQW1CO1FBQzlCLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7UUFDZixZQUFZLEVBQUUsQ0FBQztLQUNoQixDQUFDO0lBRUY7O09BRUc7SUFDSCxLQUFLLENBQUMsS0FBYSxFQUFFLFdBQW9CO1FBQ3ZDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFFdkIsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3JCLFlBQVksRUFBRSxDQUFDO1lBQ2YsUUFBUSxFQUFFO2dCQUNSLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxRQUFRLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLFVBQVUsRUFBRTtvQkFDaEIsS0FBSztvQkFDTCxXQUFXO29CQUNYLFNBQVMsRUFBRSxHQUFHLENBQUMsV0FBVyxFQUFFO29CQUM1QixlQUFlLEVBQUUsQ0FBQztvQkFDbEIs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QUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDMUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDMUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBRSxJQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDOUUsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDdEYsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDcEYsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2lCQUNwQyxDQUFDO2dCQUVGLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDaEUsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2Ysb0RBQW9EO1FBQ3RELENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxxQkFBcUI7QUFDUixRQUFBLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW4tbWVtb3J5IHJlY29yZGluZyBzdGF0ZSBtYW5hZ2VtZW50XG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQge1xuICBCdWlsZGxvZ0ZpbGUsXG4gIEJ1aWxkbG9nU3RlcCxcbiAgQnVpbGRsb2dPdXRjb21lLFxuICBQcm9tcHRTdGVwLFxuICBBY3Rpb25TdGVwLFxuICBUZXJtaW5hbFN0ZXAsXG4gIE5vdGVTdGVwLFxufSBmcm9tIFwiQGJ1aWxkbG9nYWkvdHlwZXNcIjtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIFVVSUQgdjRcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJZCgpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbn1cblxuLyoqXG4gKiBSZWNvcmRpbmcgc3RhdGUgaW50ZXJmYWNlXG4gKi9cbmludGVyZmFjZSBSZWNvcmRpbmdTdGF0ZSB7XG4gIGlzUmVjb3JkaW5nOiBib29sZWFuO1xuICBidWlsZGxvZzogQnVpbGRsb2dGaWxlIHwgbnVsbDtcbiAgc3RhcnRUaW1lOiBudW1iZXIgfCBudWxsO1xuICBzdGVwU2VxdWVuY2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZWNvcmRpbmcgc3RhdGlzdGljc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlY29yZGluZ1N0YXRzIHtcbiAgc3RlcENvdW50OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHByb21wdENvdW50OiBudW1iZXI7XG4gIGFjdGlvbkNvdW50OiBudW1iZXI7XG59XG5cbi8qKlxuICogU2luZ2xldG9uIG1hbmFnZXIgZm9yIHJlY29yZGluZyBzdGF0ZVxuICovXG5jbGFzcyBSZWNvcmRpbmdNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBzdGF0ZTogUmVjb3JkaW5nU3RhdGUgPSB7XG4gICAgaXNSZWNvcmRpbmc6IGZhbHNlLFxuICAgIGJ1aWxkbG9nOiBudWxsLFxuICAgIHN0YXJ0VGltZTogbnVsbCxcbiAgICBzdGVwU2VxdWVuY2U6IDAsXG4gIH07XG5cbiAgLyoqXG4gICAqIFN0YXJ0IGEgbmV3IHJlY29yZGluZyBzZXNzaW9uXG4gICAqL1xuICBzdGFydCh0aXRsZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlLmlzUmVjb3JkaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIHJlY29yZGluZyBpcyBhbHJlYWR5IGluIHByb2dyZXNzLiBTdG9wIGl0IGZpcnN0LlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIFxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpc1JlY29yZGluZzogdHJ1ZSxcbiAgICAgIHN0YXJ0VGltZTogRGF0ZS5ub3coKSxcbiAgICAgIHN0ZXBTZXF1ZW5jZTogMCxcbiAgICAgIGJ1aWxkbG9nOiB7XG4gICAgICAgIHZlcnNpb246IFwiMi4wLjBcIixcbiAgICAgICAgZm9ybWF0OiBcInNsaW1cIixcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBpZDogZ2VuZXJhdGVJZCgpLFxuICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgIGNyZWF0ZWRBdDogbm93LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZHVyYXRpb25TZWNvbmRzOiAwLFxuICAgICAgICAgIGVkaXRvcjogXCJvdGhlclwiLFxuICAgICAgICAgIGFpUHJvdmlkZXI6IFwib3RoZXJcIixcbiAgICAgICAgICByZXBsaWNhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzdGVwczogW10sXG4gICAgICAgIG91dGNvbWU6IHtcbiAgICAgICAgICBzdGF0dXM6IFwicGFydGlhbFwiLFxuICAgICAgICAgIHN1bW1hcnk6IFwiXCIsXG4gICAgICAgICAgZmlsZXNDcmVhdGVkOiAwLFxuICAgICAgICAgIGZpbGVzTW9kaWZpZWQ6IDAsXG4gICAgICAgICAgY2FuUmVwbGljYXRlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHN0ZXAgdG8gdGhlIGFjdGl2ZSByZWNvcmRpbmdcbiAgICovXG4gIGFkZFN0ZXAoXG4gICAgdHlwZTogXCJwcm9tcHRcIiB8IFwiYWN0aW9uXCIgfCBcInRlcm1pbmFsXCIgfCBcIm5vdGVcIixcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgbWV0YWRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICApOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc1JlY29yZGluZyB8fCAhdGhpcy5zdGF0ZS5idWlsZGxvZyB8fCAhdGhpcy5zdGF0ZS5zdGFydFRpbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGFjdGl2ZSByZWNvcmRpbmcuIFN0YXJ0IGEgcmVjb3JkaW5nIGZpcnN0LlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lc3RhbXAgPSAoRGF0ZS5ub3coKSAtIHRoaXMuc3RhdGUuc3RhcnRUaW1lKSAvIDEwMDA7XG4gICAgY29uc3Qgc2VxdWVuY2UgPSB0aGlzLnN0YXRlLnN0ZXBTZXF1ZW5jZSsrO1xuICAgIGNvbnN0IGlkID0gZ2VuZXJhdGVJZCgpO1xuXG4gICAgbGV0IHN0ZXA6IEJ1aWxkbG9nU3RlcDtcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcInByb21wdFwiOlxuICAgICAgICBzdGVwID0ge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICBzZXF1ZW5jZSxcbiAgICAgICAgICB0eXBlOiBcInByb21wdFwiLFxuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgY29udGV4dDogbWV0YWRhdGE/LmNvbnRleHQgYXMgc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICAgICAgaW50ZW50OiBtZXRhZGF0YT8uaW50ZW50IGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgfSBhcyBQcm9tcHRTdGVwO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImFjdGlvblwiOlxuICAgICAgICBzdGVwID0ge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICBzZXF1ZW5jZSxcbiAgICAgICAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgICAgICAgIHN1bW1hcnk6IGNvbnRlbnQsXG4gICAgICAgICAgZmlsZXNDcmVhdGVkOiBtZXRhZGF0YT8uZmlsZXNDcmVhdGVkIGFzIHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgICAgIGZpbGVzTW9kaWZpZWQ6IG1ldGFkYXRhPy5maWxlc01vZGlmaWVkIGFzIHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgICAgIGZpbGVzRGVsZXRlZDogbWV0YWRhdGE/LmZpbGVzRGVsZXRlZCBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICBwYWNrYWdlc0FkZGVkOiBtZXRhZGF0YT8ucGFja2FnZXNBZGRlZCBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICBhcHByb2FjaDogbWV0YWRhdGE/LmFwcHJvYWNoIGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgfSBhcyBBY3Rpb25TdGVwO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInRlcm1pbmFsXCI6XG4gICAgICAgIHN0ZXAgPSB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgIHNlcXVlbmNlLFxuICAgICAgICAgIHR5cGU6IFwidGVybWluYWxcIixcbiAgICAgICAgICBjb21tYW5kOiBjb250ZW50LFxuICAgICAgICAgIG91dGNvbWU6IChtZXRhZGF0YT8ub3V0Y29tZSBhcyBcInN1Y2Nlc3NcIiB8IFwiZmFpbHVyZVwiIHwgXCJwYXJ0aWFsXCIpIHx8IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIHN1bW1hcnk6IG1ldGFkYXRhPy5zdW1tYXJ5IGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgfSBhcyBUZXJtaW5hbFN0ZXA7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICBzdGVwID0ge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICBzZXF1ZW5jZSxcbiAgICAgICAgICB0eXBlOiBcIm5vdGVcIixcbiAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgIGNhdGVnb3J5OiBtZXRhZGF0YT8uY2F0ZWdvcnkgYXMgTm90ZVN0ZXBbXCJjYXRlZ29yeVwiXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgfSBhcyBOb3RlU3RlcDtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBzdGVwIHR5cGU6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlLmJ1aWxkbG9nLnN0ZXBzLnB1c2goc3RlcCk7XG5cbiAgICAvLyBBbHNvIHdyaXRlIHRvIGFnZW50LWZlZWQuanNvbmwgZm9yIFZTIENvZGUgZXh0ZW5zaW9uIGludGVyb3BcbiAgICB0aGlzLmFwcGVuZFRvQWdlbnRGZWVkKHN0ZXApO1xuXG4gICAgcmV0dXJuIHNlcXVlbmNlICsgMTsgLy8gUmV0dXJuIDEtaW5kZXhlZCBzdGVwIG51bWJlclxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgdGhlIHJlY29yZGluZyBhbmQgcmV0dXJuIHRoZSBidWlsZGxvZ1xuICAgKi9cbiAgc3RvcChvdXRjb21lPzogXCJzdWNjZXNzXCIgfCBcInBhcnRpYWxcIiB8IFwiZmFpbHVyZVwiLCBzdW1tYXJ5Pzogc3RyaW5nKTogQnVpbGRsb2dGaWxlIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNSZWNvcmRpbmcgfHwgIXRoaXMuc3RhdGUuYnVpbGRsb2cgfHwgIXRoaXMuc3RhdGUuc3RhcnRUaW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhY3RpdmUgcmVjb3JkaW5nIHRvIHN0b3AuXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkbG9nID0gdGhpcy5zdGF0ZS5idWlsZGxvZztcbiAgICBjb25zdCBkdXJhdGlvbiA9IChEYXRlLm5vdygpIC0gdGhpcy5zdGF0ZS5zdGFydFRpbWUpIC8gMTAwMDtcblxuICAgIC8vIFVwZGF0ZSBtZXRhZGF0YVxuICAgIGJ1aWxkbG9nLm1ldGFkYXRhLmR1cmF0aW9uU2Vjb25kcyA9IE1hdGgucm91bmQoZHVyYXRpb24pO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG91dGNvbWUgc3RhdHNcbiAgICBsZXQgZmlsZXNDcmVhdGVkID0gMDtcbiAgICBsZXQgZmlsZXNNb2RpZmllZCA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHN0ZXAgb2YgYnVpbGRsb2cuc3RlcHMpIHtcbiAgICAgIGlmIChzdGVwLnR5cGUgPT09IFwiYWN0aW9uXCIpIHtcbiAgICAgICAgZmlsZXNDcmVhdGVkICs9IHN0ZXAuZmlsZXNDcmVhdGVkPy5sZW5ndGggfHwgMDtcbiAgICAgICAgZmlsZXNNb2RpZmllZCArPSBzdGVwLmZpbGVzTW9kaWZpZWQ/Lmxlbmd0aCB8fCAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBvdXRjb21lXG4gICAgYnVpbGRsb2cub3V0Y29tZSA9IHtcbiAgICAgIHN0YXR1czogb3V0Y29tZSB8fCBcInN1Y2Nlc3NcIixcbiAgICAgIHN1bW1hcnk6IHN1bW1hcnkgfHwgYENvbXBsZXRlZCAke2J1aWxkbG9nLnN0ZXBzLmxlbmd0aH0gc3RlcHNgLFxuICAgICAgZmlsZXNDcmVhdGVkLFxuICAgICAgZmlsZXNNb2RpZmllZCxcbiAgICAgIGNhblJlcGxpY2F0ZTogdHJ1ZSxcbiAgICB9O1xuXG4gICAgLy8gUmVzZXQgc3RhdGVcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgaXNSZWNvcmRpbmc6IGZhbHNlLFxuICAgICAgYnVpbGRsb2c6IG51bGwsXG4gICAgICBzdGFydFRpbWU6IG51bGwsXG4gICAgICBzdGVwU2VxdWVuY2U6IDAsXG4gICAgfTtcblxuICAgIHJldHVybiBidWlsZGxvZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiByZWNvcmRpbmcgaXMgYWN0aXZlXG4gICAqL1xuICBpc0FjdGl2ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5pc1JlY29yZGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCByZWNvcmRpbmcgc3RhdGlzdGljc1xuICAgKi9cbiAgZ2V0U3RhdHMoKTogUmVjb3JkaW5nU3RhdHMge1xuICAgIGlmICghdGhpcy5zdGF0ZS5idWlsZGxvZyB8fCAhdGhpcy5zdGF0ZS5zdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiB7IHN0ZXBDb3VudDogMCwgZHVyYXRpb246IDAsIHByb21wdENvdW50OiAwLCBhY3Rpb25Db3VudDogMCB9O1xuICAgIH1cblxuICAgIGNvbnN0IHN0ZXBzID0gdGhpcy5zdGF0ZS5idWlsZGxvZy5zdGVwcztcbiAgICByZXR1cm4ge1xuICAgICAgc3RlcENvdW50OiBzdGVwcy5sZW5ndGgsXG4gICAgICBkdXJhdGlvbjogTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIHRoaXMuc3RhdGUuc3RhcnRUaW1lKSAvIDEwMDApLFxuICAgICAgcHJvbXB0Q291bnQ6IHN0ZXBzLmZpbHRlcigocykgPT4gcy50eXBlID09PSBcInByb21wdFwiKS5sZW5ndGgsXG4gICAgICBhY3Rpb25Db3VudDogc3RlcHMuZmlsdGVyKChzKSA9PiBzLnR5cGUgPT09IFwiYWN0aW9uXCIpLmxlbmd0aCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBidWlsZGxvZyAoZm9yIGZvcmtpbmcpXG4gICAqL1xuICBnZXRDdXJyZW50QnVpbGRsb2coKTogQnVpbGRsb2dGaWxlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUuYnVpbGRsb2c7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBmcm9tIGFuIGV4aXN0aW5nIGJ1aWxkbG9nIChmb3IgZm9ya2luZylcbiAgICovXG4gIGluaXRpYWxpemVGcm9tKGJ1aWxkbG9nOiBCdWlsZGxvZ0ZpbGUsIHRpdGxlOiBzdHJpbmcsIGZyb21TdGVwPzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5pc1JlY29yZGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSByZWNvcmRpbmcgaXMgYWxyZWFkeSBpbiBwcm9ncmVzcy4gU3RvcCBpdCBmaXJzdC5cIik7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzdGVwc1RvSW5oZXJpdCA9IGZyb21TdGVwIFxuICAgICAgPyBidWlsZGxvZy5zdGVwcy5zbGljZSgwLCBmcm9tU3RlcClcbiAgICAgIDogWy4uLmJ1aWxkbG9nLnN0ZXBzXTtcblxuICAgIC8vIFJlLXNlcXVlbmNlIGluaGVyaXRlZCBzdGVwc1xuICAgIGNvbnN0IGluaGVyaXRlZFN0ZXBzID0gc3RlcHNUb0luaGVyaXQubWFwKChzdGVwLCBpbmRleCkgPT4gKHtcbiAgICAgIC4uLnN0ZXAsXG4gICAgICBpZDogZ2VuZXJhdGVJZCgpLFxuICAgICAgc2VxdWVuY2U6IGluZGV4LFxuICAgIH0pKTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpc1JlY29yZGluZzogdHJ1ZSxcbiAgICAgIHN0YXJ0VGltZTogRGF0ZS5ub3coKSxcbiAgICAgIHN0ZXBTZXF1ZW5jZTogaW5oZXJpdGVkU3RlcHMubGVuZ3RoLFxuICAgICAgYnVpbGRsb2c6IHtcbiAgICAgICAgdmVyc2lvbjogXCIyLjAuMFwiLFxuICAgICAgICBmb3JtYXQ6IFwic2xpbVwiLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGlkOiBnZW5lcmF0ZUlkKCksXG4gICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBGb3JrZWQgZnJvbTogJHtidWlsZGxvZy5tZXRhZGF0YS50aXRsZX1gLFxuICAgICAgICAgIGNyZWF0ZWRBdDogbm93LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZHVyYXRpb25TZWNvbmRzOiAwLFxuICAgICAgICAgIGVkaXRvcjogYnVpbGRsb2cubWV0YWRhdGEuZWRpdG9yIHx8IFwib3RoZXJcIixcbiAgICAgICAgICBhaVByb3ZpZGVyOiBidWlsZGxvZy5tZXRhZGF0YS5haVByb3ZpZGVyIHx8IFwib3RoZXJcIixcbiAgICAgICAgICBsYW5ndWFnZTogYnVpbGRsb2cubWV0YWRhdGEubGFuZ3VhZ2UsXG4gICAgICAgICAgZnJhbWV3b3JrOiBidWlsZGxvZy5tZXRhZGF0YS5mcmFtZXdvcmssXG4gICAgICAgICAgdGFnczogYnVpbGRsb2cubWV0YWRhdGEudGFncyxcbiAgICAgICAgICByZXBsaWNhYmxlOiB0cnVlLFxuICAgICAgICAgIGRlcGVuZGVuY2llczogW2J1aWxkbG9nLm1ldGFkYXRhLmlkXSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RlcHM6IGluaGVyaXRlZFN0ZXBzIGFzIEJ1aWxkbG9nU3RlcFtdLFxuICAgICAgICBvdXRjb21lOiB7XG4gICAgICAgICAgc3RhdHVzOiBcInBhcnRpYWxcIixcbiAgICAgICAgICBzdW1tYXJ5OiBcIlwiLFxuICAgICAgICAgIGZpbGVzQ3JlYXRlZDogMCxcbiAgICAgICAgICBmaWxlc01vZGlmaWVkOiAwLFxuICAgICAgICAgIGNhblJlcGxpY2F0ZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHJldHVybiBpbmhlcml0ZWRTdGVwcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHN0ZXAgdG8gYWdlbnQtZmVlZC5qc29ubCBmb3IgVlMgQ29kZSBleHRlbnNpb24gaW50ZXJvcFxuICAgKi9cbiAgcHJpdmF0ZSBhcHBlbmRUb0FnZW50RmVlZChzdGVwOiBCdWlsZGxvZ1N0ZXApOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmVlZERpciA9IHBhdGguam9pbihvcy5ob21lZGlyKCksIFwiLmJ1aWxkbG9nXCIpO1xuICAgICAgY29uc3QgZmVlZFBhdGggPSBwYXRoLmpvaW4oZmVlZERpciwgXCJhZ2VudC1mZWVkLmpzb25sXCIpO1xuXG4gICAgICAvLyBPbmx5IHdyaXRlIGlmIHRoZSBkaXJlY3RvcnkgZXhpc3RzIChWUyBDb2RlIGV4dGVuc2lvbiBpcyBpbnN0YWxsZWQpXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhmZWVkRGlyKSkge1xuICAgICAgICBjb25zdCBmZWVkRW50cnkgPSB7XG4gICAgICAgICAgdHlwZTogc3RlcC50eXBlLFxuICAgICAgICAgIGNvbnRlbnQ6IHN0ZXAudHlwZSA9PT0gXCJwcm9tcHRcIiA/IChzdGVwIGFzIFByb21wdFN0ZXApLmNvbnRlbnQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgc3VtbWFyeTogc3RlcC50eXBlID09PSBcImFjdGlvblwiID8gKHN0ZXAgYXMgQWN0aW9uU3RlcCkuc3VtbWFyeSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjb21tYW5kOiBzdGVwLnR5cGUgPT09IFwidGVybWluYWxcIiA/IChzdGVwIGFzIFRlcm1pbmFsU3RlcCkuY29tbWFuZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaWxlc01vZGlmaWVkOiBzdGVwLnR5cGUgPT09IFwiYWN0aW9uXCIgPyAoc3RlcCBhcyBBY3Rpb25TdGVwKS5maWxlc01vZGlmaWVkIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZpbGVzQ3JlYXRlZDogc3RlcC50eXBlID09PSBcImFjdGlvblwiID8gKHN0ZXAgYXMgQWN0aW9uU3RlcCkuZmlsZXNDcmVhdGVkIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGZzLmFwcGVuZEZpbGVTeW5jKGZlZWRQYXRoLCBKU09OLnN0cmluZ2lmeShmZWVkRW50cnkpICsgXCJcXG5cIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIFNpbGVudGx5IGlnbm9yZSBlcnJvcnMgLSB0aGlzIGlzIG9wdGlvbmFsIGludGVyb3BcbiAgICB9XG4gIH1cbn1cblxuLy8gU2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgcmVjb3JkaW5nTWFuYWdlciA9IG5ldyBSZWNvcmRpbmdNYW5hZ2VyKCk7XG4iXX0=