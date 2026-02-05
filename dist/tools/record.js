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
        "actions you're taking, terminal commands, or notes about decisions. " +
        "IMPORTANT: For prompts, always include the FULL original user prompt text - this is the primary artifact.",
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
                description: "The content of the step. For prompts: the FULL original user prompt text (this is the primary artifact, do NOT summarize). " +
                    "For actions: a summary. For terminal: the command. For notes: the note content.",
            },
            metadata: {
                type: "object",
                description: "Additional metadata. For prompts: { intent: 'short 3-7 word title', context: [] }. " +
                    "For actions: { filesCreated: [], filesModified: [], approach: '' }. " +
                    "For terminal: { outcome: 'success'|'failure', summary: '' }. " +
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL3JlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQTJGSCw4Q0FnQkM7QUFFRCw0Q0EyQkM7QUFFRCw0Q0FzQkM7QUE5SkQsa0RBQXNEO0FBR3RELGdGQUFnRjtBQUNoRixtQkFBbUI7QUFDbkIsZ0ZBQWdGO0FBRW5FLFFBQUEseUJBQXlCLEdBQUc7SUFDdkMsSUFBSSxFQUFFLHVCQUF1QjtJQUM3QixXQUFXLEVBQ1QscUdBQXFHO1FBQ3JHLHNFQUFzRTtJQUN4RSxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwwRUFBMEU7YUFDeEY7WUFDRCxXQUFXLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHFEQUFxRDthQUNuRTtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3BCO0NBQ0YsQ0FBQztBQUVXLFFBQUEsd0JBQXdCLEdBQUc7SUFDdEMsSUFBSSxFQUFFLHNCQUFzQjtJQUM1QixXQUFXLEVBQ1Qsb0ZBQW9GO1FBQ3BGLHNFQUFzRTtRQUN0RSwyR0FBMkc7SUFDN0csV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLFFBQWlCO1FBQ3ZCLFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUM7Z0JBQzlDLFdBQVcsRUFDVCxvRUFBb0U7b0JBQ3BFLDREQUE0RDthQUMvRDtZQUNELE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQ1QsNkhBQTZIO29CQUM3SCxpRkFBaUY7YUFDcEY7WUFD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Q0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLG1CQUFtQjtZQUM1QixRQUFRO1lBQ1IsS0FBSyxFQUFFO2dCQUNMLFVBQVUsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQ2pDLFFBQVEsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHO2dCQUNqRCxZQUFZLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxZQUFZO2dCQUMzQyxhQUFhLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhO2FBQzlDO1lBQ0QsSUFBSSxFQUFFLDZEQUE2RDtTQUNwRSxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7U0FDekUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGJ1aWxkbG9nX3JlY29yZF8qIHRvb2xzIC0gUmVjb3JkaW5nIHNlc3Npb24gbWFuYWdlbWVudFxuICovXG5cbmltcG9ydCB7IHJlY29yZGluZ01hbmFnZXIgfSBmcm9tIFwiLi4vc3RhdGUvcmVjb3JkaW5nXCI7XG5pbXBvcnQgeyBSZWNvcmRTdGFydFBhcmFtcywgUmVjb3JkU3RlcFBhcmFtcywgUmVjb3JkU3RvcFBhcmFtcyB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gVE9PTCBERUZJTklUSU9OU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGNvbnN0IHJlY29yZFN0YXJ0VG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfcmVjb3JkX3N0YXJ0XCIsXG4gIGRlc2NyaXB0aW9uOlxuICAgIFwiQmVnaW4gcmVjb3JkaW5nIGEgbmV3IGJ1aWxkbG9nIHNlc3Npb24uIENhbGwgdGhpcyBiZWZvcmUgc3RhcnRpbmcgYSB0YXNrIHRvIGNhcHR1cmUgeW91ciB3b3JrZmxvdy4gXCIgK1xuICAgIFwiRXZlcnkgcHJvbXB0LCBhY3Rpb24sIGFuZCBkZWNpc2lvbiB5b3UgbWFrZSB3aWxsIGJlIGxvZ2dlZCBhcyBzdGVwcy5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHRpdGxlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlRpdGxlIGZvciB0aGUgcmVjb3JkaW5nIChlLmcuLCAnQWRkIFN0cmlwZSBJbnRlZ3JhdGlvbicsICdGaXggYXV0aCBidWcnKVwiLFxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wdGlvbmFsIGxvbmdlciBkZXNjcmlwdGlvbiBvZiB3aGF0IHlvdSdyZSBidWlsZGluZ1wiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXCJ0aXRsZVwiXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCByZWNvcmRTdGVwVG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfcmVjb3JkX3N0ZXBcIixcbiAgZGVzY3JpcHRpb246XG4gICAgXCJMb2cgYSBzdGVwIHRvIHRoZSBhY3RpdmUgcmVjb3JkaW5nLiBVc2UgdGhpcyB0byBjYXB0dXJlIHByb21wdHMgeW91J3JlIGV4ZWN1dGluZywgXCIgK1xuICAgIFwiYWN0aW9ucyB5b3UncmUgdGFraW5nLCB0ZXJtaW5hbCBjb21tYW5kcywgb3Igbm90ZXMgYWJvdXQgZGVjaXNpb25zLiBcIiArXG4gICAgXCJJTVBPUlRBTlQ6IEZvciBwcm9tcHRzLCBhbHdheXMgaW5jbHVkZSB0aGUgRlVMTCBvcmlnaW5hbCB1c2VyIHByb21wdCB0ZXh0IC0gdGhpcyBpcyB0aGUgcHJpbWFyeSBhcnRpZmFjdC5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHR5cGU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZW51bTogW1wicHJvbXB0XCIsIFwiYWN0aW9uXCIsIFwidGVybWluYWxcIiwgXCJub3RlXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICBcIlR5cGUgb2Ygc3RlcDogJ3Byb21wdCcgZm9yIEFJIHByb21wdHMsICdhY3Rpb24nIGZvciBjb2RlIGNoYW5nZXMsIFwiICtcbiAgICAgICAgICBcIid0ZXJtaW5hbCcgZm9yIGNvbW1hbmRzLCAnbm90ZScgZm9yIG9ic2VydmF0aW9ucy9kZWNpc2lvbnNcIixcbiAgICAgIH0sXG4gICAgICBjb250ZW50OiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiVGhlIGNvbnRlbnQgb2YgdGhlIHN0ZXAuIEZvciBwcm9tcHRzOiB0aGUgRlVMTCBvcmlnaW5hbCB1c2VyIHByb21wdCB0ZXh0ICh0aGlzIGlzIHRoZSBwcmltYXJ5IGFydGlmYWN0LCBkbyBOT1Qgc3VtbWFyaXplKS4gXCIgK1xuICAgICAgICAgIFwiRm9yIGFjdGlvbnM6IGEgc3VtbWFyeS4gRm9yIHRlcm1pbmFsOiB0aGUgY29tbWFuZC4gRm9yIG5vdGVzOiB0aGUgbm90ZSBjb250ZW50LlwiLFxuICAgICAgfSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgIFwiQWRkaXRpb25hbCBtZXRhZGF0YS4gRm9yIHByb21wdHM6IHsgaW50ZW50OiAnc2hvcnQgMy03IHdvcmQgdGl0bGUnLCBjb250ZXh0OiBbXSB9LiBcIiArXG4gICAgICAgICAgXCJGb3IgYWN0aW9uczogeyBmaWxlc0NyZWF0ZWQ6IFtdLCBmaWxlc01vZGlmaWVkOiBbXSwgYXBwcm9hY2g6ICcnIH0uIFwiICtcbiAgICAgICAgICBcIkZvciB0ZXJtaW5hbDogeyBvdXRjb21lOiAnc3VjY2Vzcyd8J2ZhaWx1cmUnLCBzdW1tYXJ5OiAnJyB9LiBcIiArXG4gICAgICAgICAgXCJGb3Igbm90ZXM6IHsgY2F0ZWdvcnk6ICd0aXAnfCd3YXJuaW5nJ3wnZGVjaXNpb24nIH1cIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXF1aXJlZDogW1widHlwZVwiLCBcImNvbnRlbnRcIl0sXG4gIH0sXG59O1xuXG5leHBvcnQgY29uc3QgcmVjb3JkU3RvcFRvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX3JlY29yZF9zdG9wXCIsXG4gIGRlc2NyaXB0aW9uOlxuICAgIFwiRW5kIHRoZSBhY3RpdmUgcmVjb3JkaW5nIGFuZCByZXR1cm4gdGhlIGNvbXBsZXRlZCBidWlsZGxvZy4gXCIgK1xuICAgIFwiQ2FsbCB0aGlzIHdoZW4geW91J3ZlIGZpbmlzaGVkIHRoZSB0YXNrLiBZb3UgY2FuIHRoZW4gdXNlIGJ1aWxkbG9nX3VwbG9hZCB0byBzaGFyZSBpdC5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIG91dGNvbWU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZW51bTogW1wic3VjY2Vzc1wiLCBcInBhcnRpYWxcIiwgXCJmYWlsdXJlXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJUaGUgb3V0Y29tZSBvZiB0aGUgc2Vzc2lvbiAoZGVmYXVsdDogJ3N1Y2Nlc3MnKVwiLFxuICAgICAgfSxcbiAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQSBzdW1tYXJ5IG9mIHdoYXQgd2FzIGFjY29tcGxpc2hlZFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXSxcbiAgfSxcbn07XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBIQU5ETEVSU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29yZFN0YXJ0KHBhcmFtczogUmVjb3JkU3RhcnRQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIHJlY29yZGluZ01hbmFnZXIuc3RhcnQocGFyYW1zLnRpdGxlLCBwYXJhbXMuZGVzY3JpcHRpb24pO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBgUmVjb3JkaW5nIHN0YXJ0ZWQ6IFwiJHtwYXJhbXMudGl0bGV9XCJgLFxuICAgICAgaGludDogXCJVc2UgYnVpbGRsb2dfcmVjb3JkX3N0ZXAgdG8gbG9nIHByb21wdHMgYW5kIGFjdGlvbnMgYXMgeW91IHdvcmsuIFwiICtcbiAgICAgICAgICAgIFwiVXNlIGJ1aWxkbG9nX3JlY29yZF9zdG9wIHdoZW4gZmluaXNoZWQuXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJVbmtub3duIGVycm9yIG9jY3VycmVkXCIsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlY29yZFN0ZXAocGFyYW1zOiBSZWNvcmRTdGVwUGFyYW1zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGVwTnVtYmVyID0gcmVjb3JkaW5nTWFuYWdlci5hZGRTdGVwKFxuICAgICAgcGFyYW1zLnR5cGUsXG4gICAgICBwYXJhbXMuY29udGVudCxcbiAgICAgIHBhcmFtcy5tZXRhZGF0YVxuICAgICk7XG5cbiAgICBjb25zdCBzdGF0cyA9IHJlY29yZGluZ01hbmFnZXIuZ2V0U3RhdHMoKTtcblxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgc3RlcE51bWJlcixcbiAgICAgIG1lc3NhZ2U6IGBMb2dnZWQgJHtwYXJhbXMudHlwZX0gc3RlcCAjJHtzdGVwTnVtYmVyfWAsXG4gICAgICBzdGF0czoge1xuICAgICAgICB0b3RhbFN0ZXBzOiBzdGF0cy5zdGVwQ291bnQsXG4gICAgICAgIGR1cmF0aW9uOiBgJHtzdGF0cy5kdXJhdGlvbn1zYCxcbiAgICAgICAgcHJvbXB0czogc3RhdHMucHJvbXB0Q291bnQsXG4gICAgICAgIGFjdGlvbnM6IHN0YXRzLmFjdGlvbkNvdW50LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIlVua25vd24gZXJyb3Igb2NjdXJyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmVjb3JkU3RvcChwYXJhbXM6IFJlY29yZFN0b3BQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJ1aWxkbG9nID0gcmVjb3JkaW5nTWFuYWdlci5zdG9wKHBhcmFtcy5vdXRjb21lLCBwYXJhbXMuc3VtbWFyeSk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IFwiUmVjb3JkaW5nIHN0b3BwZWRcIixcbiAgICAgIGJ1aWxkbG9nLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxTdGVwczogYnVpbGRsb2cuc3RlcHMubGVuZ3RoLFxuICAgICAgICBkdXJhdGlvbjogYCR7YnVpbGRsb2cubWV0YWRhdGEuZHVyYXRpb25TZWNvbmRzfXNgLFxuICAgICAgICBmaWxlc0NyZWF0ZWQ6IGJ1aWxkbG9nLm91dGNvbWUuZmlsZXNDcmVhdGVkLFxuICAgICAgICBmaWxlc01vZGlmaWVkOiBidWlsZGxvZy5vdXRjb21lLmZpbGVzTW9kaWZpZWQsXG4gICAgICB9LFxuICAgICAgaGludDogXCJVc2UgYnVpbGRsb2dfdXBsb2FkIHRvIHB1Ymxpc2ggdGhpcyBidWlsZGxvZyB0byBidWlsZGxvZy5haVwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=