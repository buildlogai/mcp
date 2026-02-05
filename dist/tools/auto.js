"use strict";
/**
 * buildlog_auto_status tool - Check auto-recording status
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoStatusToolDefinition = void 0;
exports.handleAutoStatus = handleAutoStatus;
const recording_1 = require("../state/recording");
exports.autoStatusToolDefinition = {
    name: "buildlog_auto_status",
    description: "Check if auto-recording is active and get current session stats. " +
        "Auto-recording starts automatically when the MCP server loads (can be disabled with BUILDLOG_AUTO_RECORD=false).",
    inputSchema: {
        type: "object",
        properties: {},
        required: [],
    },
};
async function handleAutoStatus() {
    try {
        const stats = recording_1.recordingManager.getStats();
        return JSON.stringify({
            success: true,
            autoRecordEnabled: recording_1.recordingManager.autoRecordEnabled,
            isRecording: recording_1.recordingManager.isActive(),
            isAutoSession: recording_1.recordingManager.isAutoSession,
            stats: {
                stepCount: stats.stepCount,
                duration: `${stats.duration}s`,
                promptCount: stats.promptCount,
                actionCount: stats.actionCount,
            },
            hint: recording_1.recordingManager.isAutoSession
                ? "Use buildlog_record_start to convert this auto-session to a named session, or continue and it will be saved automatically."
                : recording_1.recordingManager.isActive()
                    ? "Recording is active. Use buildlog_record_step to log steps."
                    : "No active recording. Use buildlog_record_start to begin.",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9hdXRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBZ0JILDRDQTJCQztBQXpDRCxrREFBc0Q7QUFFekMsUUFBQSx3QkFBd0IsR0FBRztJQUN0QyxJQUFJLEVBQUUsc0JBQXNCO0lBQzVCLFdBQVcsRUFDVCxtRUFBbUU7UUFDbkUsa0hBQWtIO0lBQ3BILFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxRQUFpQjtRQUN2QixVQUFVLEVBQUUsRUFBRTtRQUNkLFFBQVEsRUFBRSxFQUFFO0tBQ2I7Q0FDRixDQUFDO0FBRUssS0FBSyxVQUFVLGdCQUFnQjtJQUNwQyxJQUFJLENBQUM7UUFDSCxNQUFNLEtBQUssR0FBRyw0QkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUUxQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDcEIsT0FBTyxFQUFFLElBQUk7WUFDYixpQkFBaUIsRUFBRSw0QkFBZ0IsQ0FBQyxpQkFBaUI7WUFDckQsV0FBVyxFQUFFLDRCQUFnQixDQUFDLFFBQVEsRUFBRTtZQUN4QyxhQUFhLEVBQUUsNEJBQWdCLENBQUMsYUFBYTtZQUM3QyxLQUFLLEVBQUU7Z0JBQ0wsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2dCQUMxQixRQUFRLEVBQUUsR0FBRyxLQUFLLENBQUMsUUFBUSxHQUFHO2dCQUM5QixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7Z0JBQzlCLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVzthQUMvQjtZQUNELElBQUksRUFBRSw0QkFBZ0IsQ0FBQyxhQUFhO2dCQUNsQyxDQUFDLENBQUMsNEhBQTRIO2dCQUM5SCxDQUFDLENBQUMsNEJBQWdCLENBQUMsUUFBUSxFQUFFO29CQUMzQixDQUFDLENBQUMsNkRBQTZEO29CQUMvRCxDQUFDLENBQUMsMERBQTBEO1NBQ2pFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtTQUN6RSxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogYnVpbGRsb2dfYXV0b19zdGF0dXMgdG9vbCAtIENoZWNrIGF1dG8tcmVjb3JkaW5nIHN0YXR1c1xuICovXG5cbmltcG9ydCB7IHJlY29yZGluZ01hbmFnZXIgfSBmcm9tIFwiLi4vc3RhdGUvcmVjb3JkaW5nXCI7XG5cbmV4cG9ydCBjb25zdCBhdXRvU3RhdHVzVG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfYXV0b19zdGF0dXNcIixcbiAgZGVzY3JpcHRpb246XG4gICAgXCJDaGVjayBpZiBhdXRvLXJlY29yZGluZyBpcyBhY3RpdmUgYW5kIGdldCBjdXJyZW50IHNlc3Npb24gc3RhdHMuIFwiICtcbiAgICBcIkF1dG8tcmVjb3JkaW5nIHN0YXJ0cyBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlIE1DUCBzZXJ2ZXIgbG9hZHMgKGNhbiBiZSBkaXNhYmxlZCB3aXRoIEJVSUxETE9HX0FVVE9fUkVDT1JEPWZhbHNlKS5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHt9LFxuICAgIHJlcXVpcmVkOiBbXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVBdXRvU3RhdHVzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSByZWNvcmRpbmdNYW5hZ2VyLmdldFN0YXRzKCk7XG4gICAgXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBhdXRvUmVjb3JkRW5hYmxlZDogcmVjb3JkaW5nTWFuYWdlci5hdXRvUmVjb3JkRW5hYmxlZCxcbiAgICAgIGlzUmVjb3JkaW5nOiByZWNvcmRpbmdNYW5hZ2VyLmlzQWN0aXZlKCksXG4gICAgICBpc0F1dG9TZXNzaW9uOiByZWNvcmRpbmdNYW5hZ2VyLmlzQXV0b1Nlc3Npb24sXG4gICAgICBzdGF0czoge1xuICAgICAgICBzdGVwQ291bnQ6IHN0YXRzLnN0ZXBDb3VudCxcbiAgICAgICAgZHVyYXRpb246IGAke3N0YXRzLmR1cmF0aW9ufXNgLFxuICAgICAgICBwcm9tcHRDb3VudDogc3RhdHMucHJvbXB0Q291bnQsXG4gICAgICAgIGFjdGlvbkNvdW50OiBzdGF0cy5hY3Rpb25Db3VudCxcbiAgICAgIH0sXG4gICAgICBoaW50OiByZWNvcmRpbmdNYW5hZ2VyLmlzQXV0b1Nlc3Npb25cbiAgICAgICAgPyBcIlVzZSBidWlsZGxvZ19yZWNvcmRfc3RhcnQgdG8gY29udmVydCB0aGlzIGF1dG8tc2Vzc2lvbiB0byBhIG5hbWVkIHNlc3Npb24sIG9yIGNvbnRpbnVlIGFuZCBpdCB3aWxsIGJlIHNhdmVkIGF1dG9tYXRpY2FsbHkuXCJcbiAgICAgICAgOiByZWNvcmRpbmdNYW5hZ2VyLmlzQWN0aXZlKClcbiAgICAgICAgICA/IFwiUmVjb3JkaW5nIGlzIGFjdGl2ZS4gVXNlIGJ1aWxkbG9nX3JlY29yZF9zdGVwIHRvIGxvZyBzdGVwcy5cIlxuICAgICAgICAgIDogXCJObyBhY3RpdmUgcmVjb3JkaW5nLiBVc2UgYnVpbGRsb2dfcmVjb3JkX3N0YXJ0IHRvIGJlZ2luLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=