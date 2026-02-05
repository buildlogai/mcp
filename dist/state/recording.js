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
// Package version for source metadata
const PACKAGE_VERSION = "1.1.0";
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
    config;
    state = {
        isRecording: false,
        buildlog: null,
        startTime: null,
        stepSequence: 0,
    };
    _isAutoSession = false;
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
    get autoRecordEnabled() {
        return this.config.autoRecord;
    }
    /**
     * Get whether current session is an auto-session
     */
    get isAutoSession() {
        return this._isAutoSession;
    }
    /**
     * Start an automatic recording session
     */
    startAutoSession() {
        this.startInternal('Auto-recorded session', 'Automatically captured workflow');
        this._isAutoSession = true;
    }
    /**
     * Internal start method that handles the actual recording start
     */
    startInternal(title, description) {
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
    start(title, description) {
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
            buildlog.metadata.suggestUpload = true;
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
                    // Source attribution
                    source: {
                        tool: '@buildlogai/mcp',
                        version: PACKAGE_VERSION,
                        client: process.env.MCP_CLIENT || 'unknown'
                    }
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
        this._isAutoSession = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N0YXRlL3JlY29yZGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBQ3pCLCtDQUFpQztBQVdqQyxzQ0FBc0M7QUFDdEMsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDO0FBRWhDOztHQUVHO0FBQ0gsU0FBUyxVQUFVO0lBQ2pCLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzdCLENBQUM7QUE4QkQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQjtJQUNaLE1BQU0sQ0FBa0I7SUFDeEIsS0FBSyxHQUFtQjtRQUM5QixXQUFXLEVBQUUsS0FBSztRQUNsQixRQUFRLEVBQUUsSUFBSTtRQUNkLFNBQVMsRUFBRSxJQUFJO1FBQ2YsWUFBWSxFQUFFLENBQUM7S0FDaEIsQ0FBQztJQUNNLGNBQWMsR0FBWSxLQUFLLENBQUM7SUFFeEM7UUFDRSxJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1osVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEtBQUssT0FBTyxFQUFFLGFBQWE7WUFDdkUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCO1NBQ3JDLENBQUM7UUFFRix5REFBeUQ7UUFDekQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLGlCQUFpQjtRQUNuQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksYUFBYTtRQUNmLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxnQkFBZ0I7UUFDdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNLLGFBQWEsQ0FBQyxLQUFhLEVBQUUsV0FBb0I7UUFDdkQsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUV2QixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsV0FBVyxFQUFFLElBQUk7WUFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDckIsWUFBWSxFQUFFLENBQUM7WUFDZixRQUFRLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsVUFBVSxFQUFFO29CQUNoQixLQUFLO29CQUNMLFdBQVc7b0JBQ1gsU0FBUyxFQUFFLEdBQUcsQ0FBQyxXQUFXLEVBQUU7b0JBQzVCLGVBQWUsRUFBRSxDQUFDO29CQUNsQixNQUFNLEVBQUUsT0FBTztvQkFDZixVQUFVLEVBQUUsT0FBTztvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLHFCQUFxQjtvQkFDckIsTUFBTSxFQUFFO3dCQUNOLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLE9BQU8sRUFBRSxlQUFlO3dCQUN4QixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUztxQkFDNUM7aUJBQ0Y7Z0JBQ0QsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsT0FBTyxFQUFFO29CQUNQLE1BQU0sRUFBRSxTQUFTO29CQUNqQixPQUFPLEVBQUUsRUFBRTtvQkFDWCxZQUFZLEVBQUUsQ0FBQztvQkFDZixhQUFhLEVBQUUsQ0FBQztvQkFDaEIsWUFBWSxFQUFFLElBQUk7aUJBQ25CO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLEtBQWEsRUFBRSxXQUFvQjtRQUN2QywyREFBMkQ7UUFDM0QsSUFBSSxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDM0MsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFDekQsQ0FBQztZQUNELElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQzVCLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTyxDQUNMLElBQStDLEVBQy9DLE9BQWUsRUFDZixRQUFrQztRQUVsQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDN0UsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUM3RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzNDLE1BQU0sRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFDO1FBRXhCLElBQUksSUFBa0IsQ0FBQztRQUV2QixRQUFRLElBQUksRUFBRSxDQUFDO1lBQ2IsS0FBSyxRQUFRO2dCQUNYLElBQUksR0FBRztvQkFDTCxFQUFFO29CQUNGLFNBQVM7b0JBQ1QsUUFBUTtvQkFDUixJQUFJLEVBQUUsUUFBUTtvQkFDZCxPQUFPO29CQUNQLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBK0I7b0JBQ2xELE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBNEI7aUJBQ2pDLENBQUM7Z0JBQ2hCLE1BQU07WUFFUixLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxHQUFHO29CQUNMLEVBQUU7b0JBQ0YsU0FBUztvQkFDVCxRQUFRO29CQUNSLElBQUksRUFBRSxRQUFRO29CQUNkLE9BQU8sRUFBRSxPQUFPO29CQUNoQixZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQW9DO29CQUM1RCxhQUFhLEVBQUUsUUFBUSxFQUFFLGFBQXFDO29CQUM5RCxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQW9DO29CQUM1RCxhQUFhLEVBQUUsUUFBUSxFQUFFLGFBQXFDO29CQUM5RCxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQThCO2lCQUNyQyxDQUFDO2dCQUNoQixNQUFNO1lBRVIsS0FBSyxVQUFVO2dCQUNiLElBQUksR0FBRztvQkFDTCxFQUFFO29CQUNGLFNBQVM7b0JBQ1QsUUFBUTtvQkFDUixJQUFJLEVBQUUsVUFBVTtvQkFDaEIsT0FBTyxFQUFFLE9BQU87b0JBQ2hCLE9BQU8sRUFBRyxRQUFRLEVBQUUsT0FBNkMsSUFBSSxTQUFTO29CQUM5RSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQTZCO2lCQUNqQyxDQUFDO2dCQUNsQixNQUFNO1lBRVIsS0FBSyxNQUFNO2dCQUNULElBQUksR0FBRztvQkFDTCxFQUFFO29CQUNGLFNBQVM7b0JBQ1QsUUFBUTtvQkFDUixJQUFJLEVBQUUsTUFBTTtvQkFDWixPQUFPO29CQUNQLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBNEM7aUJBQ3JELENBQUM7Z0JBQ2QsTUFBTTtZQUVSO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckMsK0RBQStEO1FBQy9ELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QixPQUFPLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQywrQkFBK0I7SUFDdEQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxDQUFDLE9BQTJDLEVBQUUsT0FBZ0I7UUFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdFLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDNUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUUzQyxrQkFBa0I7UUFDbEIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV6RCwwQkFBMEI7UUFDMUIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUV0QixLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzNCLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0JBQy9DLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNILENBQUM7UUFFRCxpQkFBaUI7UUFDakIsUUFBUSxDQUFDLE9BQU8sR0FBRztZQUNqQixNQUFNLEVBQUUsT0FBTyxJQUFJLFNBQVM7WUFDNUIsT0FBTyxFQUFFLE9BQU8sSUFBSSxhQUFhLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxRQUFRO1lBQzlELFlBQVk7WUFDWixhQUFhO1lBQ2IsWUFBWSxFQUFFLElBQUk7U0FDbkIsQ0FBQztRQUVGLDBEQUEwRDtRQUMxRCxJQUFJLGNBQWMsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoRCxRQUFRLENBQUMsUUFBZ0IsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ2xELENBQUM7UUFFRCxjQUFjO1FBQ2QsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsQ0FBQztTQUNoQixDQUFDO1FBQ0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFFNUIsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN2RSxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3hDLE9BQU87WUFDTCxTQUFTLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDdkIsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDaEUsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsTUFBTTtZQUM1RCxXQUFXLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxNQUFNO1NBQzdELENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxrQkFBa0I7UUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjLENBQUMsUUFBc0IsRUFBRSxLQUFhLEVBQUUsUUFBaUI7UUFDckUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUN2QixNQUFNLGNBQWMsR0FBRyxRQUFRO1lBQzdCLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDhCQUE4QjtRQUM5QixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxRCxHQUFHLElBQUk7WUFDUCxFQUFFLEVBQUUsVUFBVSxFQUFFO1lBQ2hCLFFBQVEsRUFBRSxLQUFLO1NBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3JCLFlBQVksRUFBRSxjQUFjLENBQUMsTUFBTTtZQUNuQyxRQUFRLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsVUFBVSxFQUFFO29CQUNoQixLQUFLO29CQUNMLFdBQVcsRUFBRSxnQkFBZ0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7b0JBQ3RELFNBQVMsRUFBRSxHQUFHLENBQUMsV0FBVyxFQUFFO29CQUM1QixlQUFlLEVBQUUsQ0FBQztvQkFDbEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLE9BQU87b0JBQzNDLFVBQVUsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsSUFBSSxPQUFPO29CQUNuRCxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRO29CQUNwQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTO29CQUN0QyxJQUFJLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJO29CQUM1QixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLHFCQUFxQjtvQkFDckIsTUFBTSxFQUFFO3dCQUNOLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLE9BQU8sRUFBRSxlQUFlO3dCQUN4QixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUztxQkFDNUM7aUJBQ0Y7Z0JBQ0QsS0FBSyxFQUFFLGNBQWdDO2dCQUN2QyxPQUFPLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLE9BQU8sRUFBRSxFQUFFO29CQUNYLFlBQVksRUFBRSxDQUFDO29CQUNmLGFBQWEsRUFBRSxDQUFDO29CQUNoQixZQUFZLEVBQUUsSUFBSTtpQkFDbkI7YUFDRjtTQUNGLENBQUM7UUFFRixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztRQUM1QixPQUFPLGNBQWMsQ0FBQyxNQUFNLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0ssaUJBQWlCLENBQUMsSUFBa0I7UUFDMUMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUV4RCxzRUFBc0U7WUFDdEUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sU0FBUyxHQUFHO29CQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDMUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDMUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBRSxJQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDOUUsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDdEYsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxJQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDcEYsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2lCQUNwQyxDQUFDO2dCQUVGLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDaEUsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2Ysb0RBQW9EO1FBQ3RELENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxxQkFBcUI7QUFDUixRQUFBLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW4tbWVtb3J5IHJlY29yZGluZyBzdGF0ZSBtYW5hZ2VtZW50XG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQge1xuICBCdWlsZGxvZ0ZpbGUsXG4gIEJ1aWxkbG9nU3RlcCxcbiAgQnVpbGRsb2dPdXRjb21lLFxuICBQcm9tcHRTdGVwLFxuICBBY3Rpb25TdGVwLFxuICBUZXJtaW5hbFN0ZXAsXG4gIE5vdGVTdGVwLFxufSBmcm9tIFwiQGJ1aWxkbG9nYWkvdHlwZXNcIjtcblxuLy8gUGFja2FnZSB2ZXJzaW9uIGZvciBzb3VyY2UgbWV0YWRhdGFcbmNvbnN0IFBBQ0tBR0VfVkVSU0lPTiA9IFwiMS4xLjBcIjtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIFVVSUQgdjRcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJZCgpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbn1cblxuLyoqXG4gKiBSZWNvcmRpbmcgY29uZmlndXJhdGlvblxuICovXG5pbnRlcmZhY2UgUmVjb3JkaW5nQ29uZmlnIHtcbiAgYXV0b1JlY29yZDogYm9vbGVhbjtcbiAgYXBpS2V5Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFJlY29yZGluZyBzdGF0ZSBpbnRlcmZhY2VcbiAqL1xuaW50ZXJmYWNlIFJlY29yZGluZ1N0YXRlIHtcbiAgaXNSZWNvcmRpbmc6IGJvb2xlYW47XG4gIGJ1aWxkbG9nOiBCdWlsZGxvZ0ZpbGUgfCBudWxsO1xuICBzdGFydFRpbWU6IG51bWJlciB8IG51bGw7XG4gIHN0ZXBTZXF1ZW5jZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlY29yZGluZyBzdGF0aXN0aWNzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb3JkaW5nU3RhdHMge1xuICBzdGVwQ291bnQ6IG51bWJlcjtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgcHJvbXB0Q291bnQ6IG51bWJlcjtcbiAgYWN0aW9uQ291bnQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaW5nbGV0b24gbWFuYWdlciBmb3IgcmVjb3JkaW5nIHN0YXRlXG4gKi9cbmNsYXNzIFJlY29yZGluZ01hbmFnZXIge1xuICBwcml2YXRlIGNvbmZpZzogUmVjb3JkaW5nQ29uZmlnO1xuICBwcml2YXRlIHN0YXRlOiBSZWNvcmRpbmdTdGF0ZSA9IHtcbiAgICBpc1JlY29yZGluZzogZmFsc2UsXG4gICAgYnVpbGRsb2c6IG51bGwsXG4gICAgc3RhcnRUaW1lOiBudWxsLFxuICAgIHN0ZXBTZXF1ZW5jZTogMCxcbiAgfTtcbiAgcHJpdmF0ZSBfaXNBdXRvU2Vzc2lvbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgYXV0b1JlY29yZDogcHJvY2Vzcy5lbnYuQlVJTERMT0dfQVVUT19SRUNPUkQgIT09ICdmYWxzZScsIC8vIERlZmF1bHQgT05cbiAgICAgIGFwaUtleTogcHJvY2Vzcy5lbnYuQlVJTERMT0dfQVBJX0tFWVxuICAgIH07XG4gICAgXG4gICAgLy8gSWYgYXV0by1yZWNvcmQgaXMgZW5hYmxlZCwgc3RhcnQgcmVjb3JkaW5nIGltbWVkaWF0ZWx5XG4gICAgaWYgKHRoaXMuY29uZmlnLmF1dG9SZWNvcmQpIHtcbiAgICAgIHRoaXMuc3RhcnRBdXRvU2Vzc2lvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciBhdXRvLXJlY29yZCBpcyBlbmFibGVkXG4gICAqL1xuICBnZXQgYXV0b1JlY29yZEVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmF1dG9SZWNvcmQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgY3VycmVudCBzZXNzaW9uIGlzIGFuIGF1dG8tc2Vzc2lvblxuICAgKi9cbiAgZ2V0IGlzQXV0b1Nlc3Npb24oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQXV0b1Nlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgYW4gYXV0b21hdGljIHJlY29yZGluZyBzZXNzaW9uXG4gICAqL1xuICBwcml2YXRlIHN0YXJ0QXV0b1Nlc3Npb24oKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydEludGVybmFsKCdBdXRvLXJlY29yZGVkIHNlc3Npb24nLCAnQXV0b21hdGljYWxseSBjYXB0dXJlZCB3b3JrZmxvdycpO1xuICAgIHRoaXMuX2lzQXV0b1Nlc3Npb24gPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIHN0YXJ0IG1ldGhvZCB0aGF0IGhhbmRsZXMgdGhlIGFjdHVhbCByZWNvcmRpbmcgc3RhcnRcbiAgICovXG4gIHByaXZhdGUgc3RhcnRJbnRlcm5hbCh0aXRsZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGlzUmVjb3JkaW5nOiB0cnVlLFxuICAgICAgc3RhcnRUaW1lOiBEYXRlLm5vdygpLFxuICAgICAgc3RlcFNlcXVlbmNlOiAwLFxuICAgICAgYnVpbGRsb2c6IHtcbiAgICAgICAgdmVyc2lvbjogXCIyLjAuMFwiLFxuICAgICAgICBmb3JtYXQ6IFwic2xpbVwiLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGlkOiBnZW5lcmF0ZUlkKCksXG4gICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgY3JlYXRlZEF0OiBub3cudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBkdXJhdGlvblNlY29uZHM6IDAsXG4gICAgICAgICAgZWRpdG9yOiBcIm90aGVyXCIsXG4gICAgICAgICAgYWlQcm92aWRlcjogXCJvdGhlclwiLFxuICAgICAgICAgIHJlcGxpY2FibGU6IHRydWUsXG4gICAgICAgICAgLy8gU291cmNlIGF0dHJpYnV0aW9uXG4gICAgICAgICAgc291cmNlOiB7XG4gICAgICAgICAgICB0b29sOiAnQGJ1aWxkbG9nYWkvbWNwJyxcbiAgICAgICAgICAgIHZlcnNpb246IFBBQ0tBR0VfVkVSU0lPTixcbiAgICAgICAgICAgIGNsaWVudDogcHJvY2Vzcy5lbnYuTUNQX0NMSUVOVCB8fCAndW5rbm93bidcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHN0ZXBzOiBbXSxcbiAgICAgICAgb3V0Y29tZToge1xuICAgICAgICAgIHN0YXR1czogXCJwYXJ0aWFsXCIsXG4gICAgICAgICAgc3VtbWFyeTogXCJcIixcbiAgICAgICAgICBmaWxlc0NyZWF0ZWQ6IDAsXG4gICAgICAgICAgZmlsZXNNb2RpZmllZDogMCxcbiAgICAgICAgICBjYW5SZXBsaWNhdGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgYSBuZXcgcmVjb3JkaW5nIHNlc3Npb25cbiAgICovXG4gIHN0YXJ0KHRpdGxlOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gSWYgYXV0by1zZXNzaW9uIGlzIGFjdGl2ZSwgY29udmVydCBpdCB0byBhIG5hbWVkIHNlc3Npb25cbiAgICBpZiAodGhpcy5faXNBdXRvU2Vzc2lvbiAmJiB0aGlzLnN0YXRlLmlzUmVjb3JkaW5nICYmIHRoaXMuc3RhdGUuYnVpbGRsb2cpIHtcbiAgICAgIHRoaXMuc3RhdGUuYnVpbGRsb2cubWV0YWRhdGEudGl0bGUgPSB0aXRsZTtcbiAgICAgIGlmIChkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLnN0YXRlLmJ1aWxkbG9nLm1ldGFkYXRhLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICB9XG4gICAgICB0aGlzLl9pc0F1dG9TZXNzaW9uID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUuaXNSZWNvcmRpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgcmVjb3JkaW5nIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MuIFN0b3AgaXQgZmlyc3QuXCIpO1xuICAgIH1cblxuICAgIHRoaXMuc3RhcnRJbnRlcm5hbCh0aXRsZSwgZGVzY3JpcHRpb24pO1xuICAgIHRoaXMuX2lzQXV0b1Nlc3Npb24gPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBzdGVwIHRvIHRoZSBhY3RpdmUgcmVjb3JkaW5nXG4gICAqL1xuICBhZGRTdGVwKFxuICAgIHR5cGU6IFwicHJvbXB0XCIgfCBcImFjdGlvblwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJub3RlXCIsXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIG1ldGFkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNSZWNvcmRpbmcgfHwgIXRoaXMuc3RhdGUuYnVpbGRsb2cgfHwgIXRoaXMuc3RhdGUuc3RhcnRUaW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhY3RpdmUgcmVjb3JkaW5nLiBTdGFydCBhIHJlY29yZGluZyBmaXJzdC5cIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGltZXN0YW1wID0gKERhdGUubm93KCkgLSB0aGlzLnN0YXRlLnN0YXJ0VGltZSkgLyAxMDAwO1xuICAgIGNvbnN0IHNlcXVlbmNlID0gdGhpcy5zdGF0ZS5zdGVwU2VxdWVuY2UrKztcbiAgICBjb25zdCBpZCA9IGdlbmVyYXRlSWQoKTtcblxuICAgIGxldCBzdGVwOiBCdWlsZGxvZ1N0ZXA7XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJwcm9tcHRcIjpcbiAgICAgICAgc3RlcCA9IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgc2VxdWVuY2UsXG4gICAgICAgICAgdHlwZTogXCJwcm9tcHRcIixcbiAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgIGNvbnRleHQ6IG1ldGFkYXRhPy5jb250ZXh0IGFzIHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgICAgIGludGVudDogbWV0YWRhdGE/LmludGVudCBhcyBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgICAgIH0gYXMgUHJvbXB0U3RlcDtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJhY3Rpb25cIjpcbiAgICAgICAgc3RlcCA9IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgc2VxdWVuY2UsXG4gICAgICAgICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICAgICAgICBzdW1tYXJ5OiBjb250ZW50LFxuICAgICAgICAgIGZpbGVzQ3JlYXRlZDogbWV0YWRhdGE/LmZpbGVzQ3JlYXRlZCBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaWxlc01vZGlmaWVkOiBtZXRhZGF0YT8uZmlsZXNNb2RpZmllZCBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaWxlc0RlbGV0ZWQ6IG1ldGFkYXRhPy5maWxlc0RlbGV0ZWQgYXMgc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICAgICAgcGFja2FnZXNBZGRlZDogbWV0YWRhdGE/LnBhY2thZ2VzQWRkZWQgYXMgc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICAgICAgYXBwcm9hY2g6IG1ldGFkYXRhPy5hcHByb2FjaCBhcyBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgICAgIH0gYXMgQWN0aW9uU3RlcDtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJ0ZXJtaW5hbFwiOlxuICAgICAgICBzdGVwID0ge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICBzZXF1ZW5jZSxcbiAgICAgICAgICB0eXBlOiBcInRlcm1pbmFsXCIsXG4gICAgICAgICAgY29tbWFuZDogY29udGVudCxcbiAgICAgICAgICBvdXRjb21lOiAobWV0YWRhdGE/Lm91dGNvbWUgYXMgXCJzdWNjZXNzXCIgfCBcImZhaWx1cmVcIiB8IFwicGFydGlhbFwiKSB8fCBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBzdW1tYXJ5OiBtZXRhZGF0YT8uc3VtbWFyeSBhcyBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgICAgIH0gYXMgVGVybWluYWxTdGVwO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcIm5vdGVcIjpcbiAgICAgICAgc3RlcCA9IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgc2VxdWVuY2UsXG4gICAgICAgICAgdHlwZTogXCJub3RlXCIsXG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBjYXRlZ29yeTogbWV0YWRhdGE/LmNhdGVnb3J5IGFzIE5vdGVTdGVwW1wiY2F0ZWdvcnlcIl0gfCB1bmRlZmluZWQsXG4gICAgICAgIH0gYXMgTm90ZVN0ZXA7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3RlcCB0eXBlOiAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0ZS5idWlsZGxvZy5zdGVwcy5wdXNoKHN0ZXApO1xuXG4gICAgLy8gQWxzbyB3cml0ZSB0byBhZ2VudC1mZWVkLmpzb25sIGZvciBWUyBDb2RlIGV4dGVuc2lvbiBpbnRlcm9wXG4gICAgdGhpcy5hcHBlbmRUb0FnZW50RmVlZChzdGVwKTtcblxuICAgIHJldHVybiBzZXF1ZW5jZSArIDE7IC8vIFJldHVybiAxLWluZGV4ZWQgc3RlcCBudW1iZXJcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wIHRoZSByZWNvcmRpbmcgYW5kIHJldHVybiB0aGUgYnVpbGRsb2dcbiAgICovXG4gIHN0b3Aob3V0Y29tZT86IFwic3VjY2Vzc1wiIHwgXCJwYXJ0aWFsXCIgfCBcImZhaWx1cmVcIiwgc3VtbWFyeT86IHN0cmluZyk6IEJ1aWxkbG9nRmlsZSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzUmVjb3JkaW5nIHx8ICF0aGlzLnN0YXRlLmJ1aWxkbG9nIHx8ICF0aGlzLnN0YXRlLnN0YXJ0VGltZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYWN0aXZlIHJlY29yZGluZyB0byBzdG9wLlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZGxvZyA9IHRoaXMuc3RhdGUuYnVpbGRsb2c7XG4gICAgY29uc3QgZHVyYXRpb24gPSAoRGF0ZS5ub3coKSAtIHRoaXMuc3RhdGUuc3RhcnRUaW1lKSAvIDEwMDA7XG4gICAgY29uc3Qgd2FzQXV0b1Nlc3Npb24gPSB0aGlzLl9pc0F1dG9TZXNzaW9uO1xuXG4gICAgLy8gVXBkYXRlIG1ldGFkYXRhXG4gICAgYnVpbGRsb2cubWV0YWRhdGEuZHVyYXRpb25TZWNvbmRzID0gTWF0aC5yb3VuZChkdXJhdGlvbik7XG5cbiAgICAvLyBDYWxjdWxhdGUgb3V0Y29tZSBzdGF0c1xuICAgIGxldCBmaWxlc0NyZWF0ZWQgPSAwO1xuICAgIGxldCBmaWxlc01vZGlmaWVkID0gMDtcblxuICAgIGZvciAoY29uc3Qgc3RlcCBvZiBidWlsZGxvZy5zdGVwcykge1xuICAgICAgaWYgKHN0ZXAudHlwZSA9PT0gXCJhY3Rpb25cIikge1xuICAgICAgICBmaWxlc0NyZWF0ZWQgKz0gc3RlcC5maWxlc0NyZWF0ZWQ/Lmxlbmd0aCB8fCAwO1xuICAgICAgICBmaWxlc01vZGlmaWVkICs9IHN0ZXAuZmlsZXNNb2RpZmllZD8ubGVuZ3RoIHx8IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIG91dGNvbWVcbiAgICBidWlsZGxvZy5vdXRjb21lID0ge1xuICAgICAgc3RhdHVzOiBvdXRjb21lIHx8IFwic3VjY2Vzc1wiLFxuICAgICAgc3VtbWFyeTogc3VtbWFyeSB8fCBgQ29tcGxldGVkICR7YnVpbGRsb2cuc3RlcHMubGVuZ3RofSBzdGVwc2AsXG4gICAgICBmaWxlc0NyZWF0ZWQsXG4gICAgICBmaWxlc01vZGlmaWVkLFxuICAgICAgY2FuUmVwbGljYXRlOiB0cnVlLFxuICAgIH07XG5cbiAgICAvLyBJZiBhdXRvLXNlc3Npb24gd2l0aCBtZWFuaW5nZnVsIGNvbnRlbnQsIHN1Z2dlc3QgdXBsb2FkXG4gICAgaWYgKHdhc0F1dG9TZXNzaW9uICYmIGJ1aWxkbG9nLnN0ZXBzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAoYnVpbGRsb2cubWV0YWRhdGEgYXMgYW55KS5zdWdnZXN0VXBsb2FkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBSZXNldCBzdGF0ZVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpc1JlY29yZGluZzogZmFsc2UsXG4gICAgICBidWlsZGxvZzogbnVsbCxcbiAgICAgIHN0YXJ0VGltZTogbnVsbCxcbiAgICAgIHN0ZXBTZXF1ZW5jZTogMCxcbiAgICB9O1xuICAgIHRoaXMuX2lzQXV0b1Nlc3Npb24gPSBmYWxzZTtcblxuICAgIHJldHVybiBidWlsZGxvZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiByZWNvcmRpbmcgaXMgYWN0aXZlXG4gICAqL1xuICBpc0FjdGl2ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5pc1JlY29yZGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCByZWNvcmRpbmcgc3RhdGlzdGljc1xuICAgKi9cbiAgZ2V0U3RhdHMoKTogUmVjb3JkaW5nU3RhdHMge1xuICAgIGlmICghdGhpcy5zdGF0ZS5idWlsZGxvZyB8fCAhdGhpcy5zdGF0ZS5zdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiB7IHN0ZXBDb3VudDogMCwgZHVyYXRpb246IDAsIHByb21wdENvdW50OiAwLCBhY3Rpb25Db3VudDogMCB9O1xuICAgIH1cblxuICAgIGNvbnN0IHN0ZXBzID0gdGhpcy5zdGF0ZS5idWlsZGxvZy5zdGVwcztcbiAgICByZXR1cm4ge1xuICAgICAgc3RlcENvdW50OiBzdGVwcy5sZW5ndGgsXG4gICAgICBkdXJhdGlvbjogTWF0aC5yb3VuZCgoRGF0ZS5ub3coKSAtIHRoaXMuc3RhdGUuc3RhcnRUaW1lKSAvIDEwMDApLFxuICAgICAgcHJvbXB0Q291bnQ6IHN0ZXBzLmZpbHRlcigocykgPT4gcy50eXBlID09PSBcInByb21wdFwiKS5sZW5ndGgsXG4gICAgICBhY3Rpb25Db3VudDogc3RlcHMuZmlsdGVyKChzKSA9PiBzLnR5cGUgPT09IFwiYWN0aW9uXCIpLmxlbmd0aCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBidWlsZGxvZyAoZm9yIGZvcmtpbmcpXG4gICAqL1xuICBnZXRDdXJyZW50QnVpbGRsb2coKTogQnVpbGRsb2dGaWxlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUuYnVpbGRsb2c7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBmcm9tIGFuIGV4aXN0aW5nIGJ1aWxkbG9nIChmb3IgZm9ya2luZylcbiAgICovXG4gIGluaXRpYWxpemVGcm9tKGJ1aWxkbG9nOiBCdWlsZGxvZ0ZpbGUsIHRpdGxlOiBzdHJpbmcsIGZyb21TdGVwPzogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5pc1JlY29yZGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSByZWNvcmRpbmcgaXMgYWxyZWFkeSBpbiBwcm9ncmVzcy4gU3RvcCBpdCBmaXJzdC5cIik7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzdGVwc1RvSW5oZXJpdCA9IGZyb21TdGVwIFxuICAgICAgPyBidWlsZGxvZy5zdGVwcy5zbGljZSgwLCBmcm9tU3RlcClcbiAgICAgIDogWy4uLmJ1aWxkbG9nLnN0ZXBzXTtcblxuICAgIC8vIFJlLXNlcXVlbmNlIGluaGVyaXRlZCBzdGVwc1xuICAgIGNvbnN0IGluaGVyaXRlZFN0ZXBzID0gc3RlcHNUb0luaGVyaXQubWFwKChzdGVwLCBpbmRleCkgPT4gKHtcbiAgICAgIC4uLnN0ZXAsXG4gICAgICBpZDogZ2VuZXJhdGVJZCgpLFxuICAgICAgc2VxdWVuY2U6IGluZGV4LFxuICAgIH0pKTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpc1JlY29yZGluZzogdHJ1ZSxcbiAgICAgIHN0YXJ0VGltZTogRGF0ZS5ub3coKSxcbiAgICAgIHN0ZXBTZXF1ZW5jZTogaW5oZXJpdGVkU3RlcHMubGVuZ3RoLFxuICAgICAgYnVpbGRsb2c6IHtcbiAgICAgICAgdmVyc2lvbjogXCIyLjAuMFwiLFxuICAgICAgICBmb3JtYXQ6IFwic2xpbVwiLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGlkOiBnZW5lcmF0ZUlkKCksXG4gICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBGb3JrZWQgZnJvbTogJHtidWlsZGxvZy5tZXRhZGF0YS50aXRsZX1gLFxuICAgICAgICAgIGNyZWF0ZWRBdDogbm93LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZHVyYXRpb25TZWNvbmRzOiAwLFxuICAgICAgICAgIGVkaXRvcjogYnVpbGRsb2cubWV0YWRhdGEuZWRpdG9yIHx8IFwib3RoZXJcIixcbiAgICAgICAgICBhaVByb3ZpZGVyOiBidWlsZGxvZy5tZXRhZGF0YS5haVByb3ZpZGVyIHx8IFwib3RoZXJcIixcbiAgICAgICAgICBsYW5ndWFnZTogYnVpbGRsb2cubWV0YWRhdGEubGFuZ3VhZ2UsXG4gICAgICAgICAgZnJhbWV3b3JrOiBidWlsZGxvZy5tZXRhZGF0YS5mcmFtZXdvcmssXG4gICAgICAgICAgdGFnczogYnVpbGRsb2cubWV0YWRhdGEudGFncyxcbiAgICAgICAgICByZXBsaWNhYmxlOiB0cnVlLFxuICAgICAgICAgIGRlcGVuZGVuY2llczogW2J1aWxkbG9nLm1ldGFkYXRhLmlkXSxcbiAgICAgICAgICAvLyBTb3VyY2UgYXR0cmlidXRpb25cbiAgICAgICAgICBzb3VyY2U6IHtcbiAgICAgICAgICAgIHRvb2w6ICdAYnVpbGRsb2dhaS9tY3AnLFxuICAgICAgICAgICAgdmVyc2lvbjogUEFDS0FHRV9WRVJTSU9OLFxuICAgICAgICAgICAgY2xpZW50OiBwcm9jZXNzLmVudi5NQ1BfQ0xJRU5UIHx8ICd1bmtub3duJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc3RlcHM6IGluaGVyaXRlZFN0ZXBzIGFzIEJ1aWxkbG9nU3RlcFtdLFxuICAgICAgICBvdXRjb21lOiB7XG4gICAgICAgICAgc3RhdHVzOiBcInBhcnRpYWxcIixcbiAgICAgICAgICBzdW1tYXJ5OiBcIlwiLFxuICAgICAgICAgIGZpbGVzQ3JlYXRlZDogMCxcbiAgICAgICAgICBmaWxlc01vZGlmaWVkOiAwLFxuICAgICAgICAgIGNhblJlcGxpY2F0ZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuX2lzQXV0b1Nlc3Npb24gPSBmYWxzZTtcbiAgICByZXR1cm4gaW5oZXJpdGVkU3RlcHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBzdGVwIHRvIGFnZW50LWZlZWQuanNvbmwgZm9yIFZTIENvZGUgZXh0ZW5zaW9uIGludGVyb3BcbiAgICovXG4gIHByaXZhdGUgYXBwZW5kVG9BZ2VudEZlZWQoc3RlcDogQnVpbGRsb2dTdGVwKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZlZWREaXIgPSBwYXRoLmpvaW4ob3MuaG9tZWRpcigpLCBcIi5idWlsZGxvZ1wiKTtcbiAgICAgIGNvbnN0IGZlZWRQYXRoID0gcGF0aC5qb2luKGZlZWREaXIsIFwiYWdlbnQtZmVlZC5qc29ubFwiKTtcblxuICAgICAgLy8gT25seSB3cml0ZSBpZiB0aGUgZGlyZWN0b3J5IGV4aXN0cyAoVlMgQ29kZSBleHRlbnNpb24gaXMgaW5zdGFsbGVkKVxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZmVlZERpcikpIHtcbiAgICAgICAgY29uc3QgZmVlZEVudHJ5ID0ge1xuICAgICAgICAgIHR5cGU6IHN0ZXAudHlwZSxcbiAgICAgICAgICBjb250ZW50OiBzdGVwLnR5cGUgPT09IFwicHJvbXB0XCIgPyAoc3RlcCBhcyBQcm9tcHRTdGVwKS5jb250ZW50IDogdW5kZWZpbmVkLFxuICAgICAgICAgIHN1bW1hcnk6IHN0ZXAudHlwZSA9PT0gXCJhY3Rpb25cIiA/IChzdGVwIGFzIEFjdGlvblN0ZXApLnN1bW1hcnkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY29tbWFuZDogc3RlcC50eXBlID09PSBcInRlcm1pbmFsXCIgPyAoc3RlcCBhcyBUZXJtaW5hbFN0ZXApLmNvbW1hbmQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgZmlsZXNNb2RpZmllZDogc3RlcC50eXBlID09PSBcImFjdGlvblwiID8gKHN0ZXAgYXMgQWN0aW9uU3RlcCkuZmlsZXNNb2RpZmllZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaWxlc0NyZWF0ZWQ6IHN0ZXAudHlwZSA9PT0gXCJhY3Rpb25cIiA/IChzdGVwIGFzIEFjdGlvblN0ZXApLmZpbGVzQ3JlYXRlZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfTtcblxuICAgICAgICBmcy5hcHBlbmRGaWxlU3luYyhmZWVkUGF0aCwgSlNPTi5zdHJpbmdpZnkoZmVlZEVudHJ5KSArIFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBTaWxlbnRseSBpZ25vcmUgZXJyb3JzIC0gdGhpcyBpcyBvcHRpb25hbCBpbnRlcm9wXG4gICAgfVxuICB9XG59XG5cbi8vIFNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IHJlY29yZGluZ01hbmFnZXIgPSBuZXcgUmVjb3JkaW5nTWFuYWdlcigpO1xuIl19