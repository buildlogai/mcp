"use strict";
/**
 * buildlog_record_* tools - Recording session management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordStopToolDefinition = exports.recordStepToolDefinition = exports.recordStartToolDefinition = void 0;
exports.handleRecordStart = handleRecordStart;
exports.handleRecordStep = handleRecordStep;
exports.handleRecordStop = handleRecordStop;
const recording_1 = require("../state/recording");
// =============================================================================
// TOOL DEFINITIONS
// =============================================================================
exports.recordStartToolDefinition = {
    name: "buildlog_record_start",
    description: "Begin recording a new buildlog session. Call this before starting a task to capture your workflow. " +
        "Every prompt, action, and decision you make will be logged as steps.",
    inputSchema: {
        type: "object",
        properties: {
            title: {
                type: "string",
                description: "Title for the recording (e.g., 'Add Stripe Integration', 'Fix auth bug')",
            },
            description: {
                type: "string",
                description: "Optional longer description of what you're building",
            },
        },
        required: ["title"],
    },
};
exports.recordStepToolDefinition = {
    name: "buildlog_record_step",
    description: "Log a step to the active recording. Use this to capture prompts you're executing, " +
        "actions you're taking, terminal commands, or notes about decisions.",
    inputSchema: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["prompt", "action", "terminal", "note"],
                description: "Type of step: 'prompt' for AI prompts, 'action' for code changes, " +
                    "'terminal' for commands, 'note' for observations/decisions",
            },
            content: {
                type: "string",
                description: "The content of the step. For prompts: the prompt text. For actions: a summary. " +
                    "For terminal: the command. For notes: the note content.",
            },
            metadata: {
                type: "object",
                description: "Additional metadata. For actions: { filesCreated: [], filesModified: [], approach: '' }. " +
                    "For prompts: { context: [], intent: '' }. For terminal: { outcome: 'success'|'failure', summary: '' }. " +
                    "For notes: { category: 'tip'|'warning'|'decision' }",
            },
        },
        required: ["type", "content"],
    },
};
exports.recordStopToolDefinition = {
    name: "buildlog_record_stop",
    description: "End the active recording and return the completed buildlog. " +
        "Call this when you've finished the task. You can then use buildlog_upload to share it.",
    inputSchema: {
        type: "object",
        properties: {
            outcome: {
                type: "string",
                enum: ["success", "partial", "failure"],
                description: "The outcome of the session (default: 'success')",
            },
            summary: {
                type: "string",
                description: "A summary of what was accomplished",
            },
        },
        required: [],
    },
};
// =============================================================================
// HANDLERS
// =============================================================================
async function handleRecordStart(params) {
    try {
        recording_1.recordingManager.start(params.title, params.description);
        return JSON.stringify({
            success: true,
            message: `Recording started: "${params.title}"`,
            hint: "Use buildlog_record_step to log prompts and actions as you work. " +
                "Use buildlog_record_stop when finished.",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
async function handleRecordStep(params) {
    try {
        const stepNumber = recording_1.recordingManager.addStep(params.type, params.content, params.metadata);
        const stats = recording_1.recordingManager.getStats();
        return JSON.stringify({
            success: true,
            stepNumber,
            message: `Logged ${params.type} step #${stepNumber}`,
            stats: {
                totalSteps: stats.stepCount,
                duration: `${stats.duration}s`,
                prompts: stats.promptCount,
                actions: stats.actionCount,
            },
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
async function handleRecordStop(params) {
    try {
        const buildlog = recording_1.recordingManager.stop(params.outcome, params.summary);
        return JSON.stringify({
            success: true,
            message: "Recording stopped",
            buildlog,
            stats: {
                totalSteps: buildlog.steps.length,
                duration: `${buildlog.metadata.durationSeconds}s`,
                filesCreated: buildlog.outcome.filesCreated,
                filesModified: buildlog.outcome.filesModified,
            },
            hint: "Use buildlog_upload to publish this buildlog to buildlog.ai",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL3JlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQXlGSCw4Q0FnQkM7QUFFRCw0Q0EyQkM7QUFFRCw0Q0FzQkM7QUE1SkQsa0RBQXNEO0FBR3RELGdGQUFnRjtBQUNoRixtQkFBbUI7QUFDbkIsZ0ZBQWdGO0FBRW5FLFFBQUEseUJBQXlCLEdBQUc7SUFDdkMsSUFBSSxFQUFFLHVCQUF1QjtJQUM3QixXQUFXLEVBQ1QscUdBQXFHO1FBQ3JHLHNFQUFzRTtJQUN4RSxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwwRUFBMEU7YUFDeEY7WUFDRCxXQUFXLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHFEQUFxRDthQUNuRTtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3BCO0NBQ0YsQ0FBQztBQUVXLFFBQUEsd0JBQXdCLEdBQUc7SUFDdEMsSUFBSSxFQUFFLHNCQUFzQjtJQUM1QixXQUFXLEVBQ1Qsb0ZBQW9GO1FBQ3BGLHFFQUFxRTtJQUN2RSxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQztnQkFDOUMsV0FBVyxFQUNULG9FQUFvRTtvQkFDcEUsNERBQTREO2FBQy9EO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFDVCxpRkFBaUY7b0JBQ2pGLHlEQUF5RDthQUM1RDtZQUNELFFBQVEsRUFBRTtn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QU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLG1CQUFtQjtZQUM1QixRQUFRO1lBQ1IsS0FBSyxFQUFFO2dCQUNMLFVBQVUsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQ2pDLFFBQVEsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHO2dCQUNqRCxZQUFZLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxZQUFZO2dCQUMzQyxhQUFhLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhO2FBQzlDO1lBQ0QsSUFBSSxFQUFFLDZEQUE2RDtTQUNwRSxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7U0FDekUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGJ1aWxkbG9nX3JlY29yZF8qIHRvb2xzIC0gUmVjb3JkaW5nIHNlc3Npb24gbWFuYWdlbWVudFxuICovXG5cbmltcG9ydCB7IHJlY29yZGluZ01hbmFnZXIgfSBmcm9tIFwiLi4vc3RhdGUvcmVjb3JkaW5nXCI7XG5pbXBvcnQgeyBSZWNvcmRTdGFydFBhcmFtcywgUmVjb3JkU3RlcFBhcmFtcywgUmVjb3JkU3RvcFBhcmFtcyB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gVE9PTCBERUZJTklUSU9OU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGNvbnN0IHJlY29yZFN0YXJ0VG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfcmVjb3JkX3N0YXJ0XCIsXG4gIGRlc2NyaXB0aW9uOlxuICAgIFwiQmVnaW4gcmVjb3JkaW5nIGEgbmV3IGJ1aWxkbG9nIHNlc3Npb24uIENhbGwgdGhpcyBiZWZvcmUgc3RhcnRpbmcgYSB0YXNrIHRvIGNhcHR1cmUgeW91ciB3b3JrZmxvdy4gXCIgK1xuICAgIFwiRXZlcnkgcHJvbXB0LCBhY3Rpb24sIGFuZCBkZWNpc2lvbiB5b3UgbWFrZSB3aWxsIGJlIGxvZ2dlZCBhcyBzdGVwcy5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHRpdGxlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlRpdGxlIGZvciB0aGUgcmVjb3JkaW5nIChlLmcuLCAnQWRkIFN0cmlwZSBJbnRlZ3JhdGlvbicsICdGaXggYXV0aCBidWcnKVwiLFxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wdGlvbmFsIGxvbmdlciBkZXNjcmlwdGlvbiBvZiB3aGF0IHlvdSdyZSBidWlsZGluZ1wiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXCJ0aXRsZVwiXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCByZWNvcmRTdGVwVG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfcmVjb3JkX3N0ZXBcIixcbiAgZGVzY3JpcHRpb246XG4gICAgXCJMb2cgYSBzdGVwIHRvIHRoZSBhY3RpdmUgcmVjb3JkaW5nLiBVc2UgdGhpcyB0byBjYXB0dXJlIHByb21wdHMgeW91J3JlIGV4ZWN1dGluZywgXCIgK1xuICAgIFwiYWN0aW9ucyB5b3UncmUgdGFraW5nLCB0ZXJtaW5hbCBjb21tYW5kcywgb3Igbm90ZXMgYWJvdXQgZGVjaXNpb25zLlwiLFxuICBpbnB1dFNjaGVtYToge1xuICAgIHR5cGU6IFwib2JqZWN0XCIgYXMgY29uc3QsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgdHlwZToge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBlbnVtOiBbXCJwcm9tcHRcIiwgXCJhY3Rpb25cIiwgXCJ0ZXJtaW5hbFwiLCBcIm5vdGVcIl0sXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiVHlwZSBvZiBzdGVwOiAncHJvbXB0JyBmb3IgQUkgcHJvbXB0cywgJ2FjdGlvbicgZm9yIGNvZGUgY2hhbmdlcywgXCIgK1xuICAgICAgICAgIFwiJ3Rlcm1pbmFsJyBmb3IgY29tbWFuZHMsICdub3RlJyBmb3Igb2JzZXJ2YXRpb25zL2RlY2lzaW9uc1wiLFxuICAgICAgfSxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgXCJUaGUgY29udGVudCBvZiB0aGUgc3RlcC4gRm9yIHByb21wdHM6IHRoZSBwcm9tcHQgdGV4dC4gRm9yIGFjdGlvbnM6IGEgc3VtbWFyeS4gXCIgK1xuICAgICAgICAgIFwiRm9yIHRlcm1pbmFsOiB0aGUgY29tbWFuZC4gRm9yIG5vdGVzOiB0aGUgbm90ZSBjb250ZW50LlwiLFxuICAgICAgfSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiQWRkaXRpb25hbCBtZXRhZGF0YS4gRm9yIGFjdGlvbnM6IHsgZmlsZXNDcmVhdGVkOiBbXSwgZmlsZXNNb2RpZmllZDogW10sIGFwcHJvYWNoOiAnJyB9LiBcIiArXG4gICAgICAgICAgXCJGb3IgcHJvbXB0czogeyBjb250ZXh0OiBbXSwgaW50ZW50OiAnJyB9LiBGb3IgdGVybWluYWw6IHsgb3V0Y29tZTogJ3N1Y2Nlc3MnfCdmYWlsdXJlJywgc3VtbWFyeTogJycgfS4gXCIgK1xuICAgICAgICAgIFwiRm9yIG5vdGVzOiB7IGNhdGVnb3J5OiAndGlwJ3wnd2FybmluZyd8J2RlY2lzaW9uJyB9XCIsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcmVxdWlyZWQ6IFtcInR5cGVcIiwgXCJjb250ZW50XCJdLFxuICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IHJlY29yZFN0b3BUb29sRGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogXCJidWlsZGxvZ19yZWNvcmRfc3RvcFwiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIkVuZCB0aGUgYWN0aXZlIHJlY29yZGluZyBhbmQgcmV0dXJuIHRoZSBjb21wbGV0ZWQgYnVpbGRsb2cuIFwiICtcbiAgICBcIkNhbGwgdGhpcyB3aGVuIHlvdSd2ZSBmaW5pc2hlZCB0aGUgdGFzay4gWW91IGNhbiB0aGVuIHVzZSBidWlsZGxvZ191cGxvYWQgdG8gc2hhcmUgaXQuXCIsXG4gIGlucHV0U2NoZW1hOiB7XG4gICAgdHlwZTogXCJvYmplY3RcIiBhcyBjb25zdCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBvdXRjb21lOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGVudW06IFtcInN1Y2Nlc3NcIiwgXCJwYXJ0aWFsXCIsIFwiZmFpbHVyZVwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIG91dGNvbWUgb2YgdGhlIHNlc3Npb24gKGRlZmF1bHQ6ICdzdWNjZXNzJylcIixcbiAgICAgIH0sXG4gICAgICBzdW1tYXJ5OiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkEgc3VtbWFyeSBvZiB3aGF0IHdhcyBhY2NvbXBsaXNoZWRcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXF1aXJlZDogW10sXG4gIH0sXG59O1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gSEFORExFUlNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVSZWNvcmRTdGFydChwYXJhbXM6IFJlY29yZFN0YXJ0UGFyYW1zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICByZWNvcmRpbmdNYW5hZ2VyLnN0YXJ0KHBhcmFtcy50aXRsZSwgcGFyYW1zLmRlc2NyaXB0aW9uKTtcblxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogYFJlY29yZGluZyBzdGFydGVkOiBcIiR7cGFyYW1zLnRpdGxlfVwiYCxcbiAgICAgIGhpbnQ6IFwiVXNlIGJ1aWxkbG9nX3JlY29yZF9zdGVwIHRvIGxvZyBwcm9tcHRzIGFuZCBhY3Rpb25zIGFzIHlvdSB3b3JrLiBcIiArXG4gICAgICAgICAgICBcIlVzZSBidWlsZGxvZ19yZWNvcmRfc3RvcCB3aGVuIGZpbmlzaGVkLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVSZWNvcmRTdGVwKHBhcmFtczogUmVjb3JkU3RlcFBhcmFtcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RlcE51bWJlciA9IHJlY29yZGluZ01hbmFnZXIuYWRkU3RlcChcbiAgICAgIHBhcmFtcy50eXBlLFxuICAgICAgcGFyYW1zLmNvbnRlbnQsXG4gICAgICBwYXJhbXMubWV0YWRhdGFcbiAgICApO1xuXG4gICAgY29uc3Qgc3RhdHMgPSByZWNvcmRpbmdNYW5hZ2VyLmdldFN0YXRzKCk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHN0ZXBOdW1iZXIsXG4gICAgICBtZXNzYWdlOiBgTG9nZ2VkICR7cGFyYW1zLnR5cGV9IHN0ZXAgIyR7c3RlcE51bWJlcn1gLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxTdGVwczogc3RhdHMuc3RlcENvdW50LFxuICAgICAgICBkdXJhdGlvbjogYCR7c3RhdHMuZHVyYXRpb259c2AsXG4gICAgICAgIHByb21wdHM6IHN0YXRzLnByb21wdENvdW50LFxuICAgICAgICBhY3Rpb25zOiBzdGF0cy5hY3Rpb25Db3VudCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJVbmtub3duIGVycm9yIG9jY3VycmVkXCIsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29yZFN0b3AocGFyYW1zOiBSZWNvcmRTdG9wUGFyYW1zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBidWlsZGxvZyA9IHJlY29yZGluZ01hbmFnZXIuc3RvcChwYXJhbXMub3V0Y29tZSwgcGFyYW1zLnN1bW1hcnkpO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIlJlY29yZGluZyBzdG9wcGVkXCIsXG4gICAgICBidWlsZGxvZyxcbiAgICAgIHN0YXRzOiB7XG4gICAgICAgIHRvdGFsU3RlcHM6IGJ1aWxkbG9nLnN0ZXBzLmxlbmd0aCxcbiAgICAgICAgZHVyYXRpb246IGAke2J1aWxkbG9nLm1ldGFkYXRhLmR1cmF0aW9uU2Vjb25kc31zYCxcbiAgICAgICAgZmlsZXNDcmVhdGVkOiBidWlsZGxvZy5vdXRjb21lLmZpbGVzQ3JlYXRlZCxcbiAgICAgICAgZmlsZXNNb2RpZmllZDogYnVpbGRsb2cub3V0Y29tZS5maWxlc01vZGlmaWVkLFxuICAgICAgfSxcbiAgICAgIGhpbnQ6IFwiVXNlIGJ1aWxkbG9nX3VwbG9hZCB0byBwdWJsaXNoIHRoaXMgYnVpbGRsb2cgdG8gYnVpbGRsb2cuYWlcIixcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIlVua25vd24gZXJyb3Igb2NjdXJyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuIl19