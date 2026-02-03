"use strict";
/**
 * buildlog_fork tool - Start a new recording based on an existing buildlog
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.forkToolDefinition = void 0;
exports.handleFork = handleFork;
const client_1 = require("../api/client");
const recording_1 = require("../state/recording");
exports.forkToolDefinition = {
    name: "buildlog_fork",
    description: "Start a new recording based on an existing buildlog. Copies steps from the source buildlog " +
        "as a starting point, so you can extend or modify an existing workflow.",
    inputSchema: {
        type: "object",
        properties: {
            slug: {
                type: "string",
                description: "The buildlog slug or URL to fork from",
            },
            title: {
                type: "string",
                description: "Title for the new forked buildlog",
            },
            fromStep: {
                type: "number",
                description: "Only copy steps up to this number (1-indexed). Omit to copy all steps.",
            },
        },
        required: ["slug", "title"],
    },
};
async function handleFork(params) {
    try {
        // First, fetch the source buildlog
        const sourceBuildlog = await client_1.apiClient.get(params.slug);
        // Initialize the recording with the source steps
        const stepsInherited = recording_1.recordingManager.initializeFrom(sourceBuildlog, params.title, params.fromStep);
        return JSON.stringify({
            success: true,
            message: `Forked "${sourceBuildlog.metadata.title}" as "${params.title}"`,
            forkedFrom: {
                slug: params.slug,
                title: sourceBuildlog.metadata.title,
                originalSteps: sourceBuildlog.steps.length,
            },
            stepsInherited,
            hint: "Recording is now active. Use buildlog_record_step to add new steps, " +
                "then buildlog_record_stop when finished.",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9mb3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBK0JILGdDQThCQztBQTNERCwwQ0FBMEM7QUFDMUMsa0RBQXNEO0FBR3pDLFFBQUEsa0JBQWtCLEdBQUc7SUFDaEMsSUFBSSxFQUFFLGVBQWU7SUFDckIsV0FBVyxFQUNULDZGQUE2RjtRQUM3Rix3RUFBd0U7SUFDMUUsV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLFFBQWlCO1FBQ3ZCLFVBQVUsRUFBRTtZQUNWLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsdUNBQXVDO2FBQ3JEO1lBQ0QsS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxtQ0FBbUM7YUFDakQ7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHdFQUF3RTthQUN0RjtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQztLQUM1QjtDQUNGLENBQUM7QUFFSyxLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQWtCO0lBQ2pELElBQUksQ0FBQztRQUNILG1DQUFtQztRQUNuQyxNQUFNLGNBQWMsR0FBRyxNQUFNLGtCQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4RCxpREFBaUQ7UUFDakQsTUFBTSxjQUFjLEdBQUcsNEJBQWdCLENBQUMsY0FBYyxDQUNwRCxjQUFjLEVBQ2QsTUFBTSxDQUFDLEtBQUssRUFDWixNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO1FBRUYsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLFdBQVcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLFNBQVMsTUFBTSxDQUFDLEtBQUssR0FBRztZQUN6RSxVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUNqQixLQUFLLEVBQUUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLO2dCQUNwQyxhQUFhLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNO2FBQzNDO1lBQ0QsY0FBYztZQUNkLElBQUksRUFBRSxzRUFBc0U7Z0JBQ3RFLDBDQUEwQztTQUNqRCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7U0FDekUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGJ1aWxkbG9nX2ZvcmsgdG9vbCAtIFN0YXJ0IGEgbmV3IHJlY29yZGluZyBiYXNlZCBvbiBhbiBleGlzdGluZyBidWlsZGxvZ1xuICovXG5cbmltcG9ydCB7IGFwaUNsaWVudCB9IGZyb20gXCIuLi9hcGkvY2xpZW50XCI7XG5pbXBvcnQgeyByZWNvcmRpbmdNYW5hZ2VyIH0gZnJvbSBcIi4uL3N0YXRlL3JlY29yZGluZ1wiO1xuaW1wb3J0IHsgRm9ya1BhcmFtcyB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgZm9ya1Rvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX2ZvcmtcIixcbiAgZGVzY3JpcHRpb246XG4gICAgXCJTdGFydCBhIG5ldyByZWNvcmRpbmcgYmFzZWQgb24gYW4gZXhpc3RpbmcgYnVpbGRsb2cuIENvcGllcyBzdGVwcyBmcm9tIHRoZSBzb3VyY2UgYnVpbGRsb2cgXCIgK1xuICAgIFwiYXMgYSBzdGFydGluZyBwb2ludCwgc28geW91IGNhbiBleHRlbmQgb3IgbW9kaWZ5IGFuIGV4aXN0aW5nIHdvcmtmbG93LlwiLFxuICBpbnB1dFNjaGVtYToge1xuICAgIHR5cGU6IFwib2JqZWN0XCIgYXMgY29uc3QsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgc2x1Zzoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJUaGUgYnVpbGRsb2cgc2x1ZyBvciBVUkwgdG8gZm9yayBmcm9tXCIsXG4gICAgICB9LFxuICAgICAgdGl0bGU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGl0bGUgZm9yIHRoZSBuZXcgZm9ya2VkIGJ1aWxkbG9nXCIsXG4gICAgICB9LFxuICAgICAgZnJvbVN0ZXA6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiT25seSBjb3B5IHN0ZXBzIHVwIHRvIHRoaXMgbnVtYmVyICgxLWluZGV4ZWQpLiBPbWl0IHRvIGNvcHkgYWxsIHN0ZXBzLlwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXCJzbHVnXCIsIFwidGl0bGVcIl0sXG4gIH0sXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRm9yayhwYXJhbXM6IEZvcmtQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIC8vIEZpcnN0LCBmZXRjaCB0aGUgc291cmNlIGJ1aWxkbG9nXG4gICAgY29uc3Qgc291cmNlQnVpbGRsb2cgPSBhd2FpdCBhcGlDbGllbnQuZ2V0KHBhcmFtcy5zbHVnKTtcblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHJlY29yZGluZyB3aXRoIHRoZSBzb3VyY2Ugc3RlcHNcbiAgICBjb25zdCBzdGVwc0luaGVyaXRlZCA9IHJlY29yZGluZ01hbmFnZXIuaW5pdGlhbGl6ZUZyb20oXG4gICAgICBzb3VyY2VCdWlsZGxvZyxcbiAgICAgIHBhcmFtcy50aXRsZSxcbiAgICAgIHBhcmFtcy5mcm9tU3RlcFxuICAgICk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IGBGb3JrZWQgXCIke3NvdXJjZUJ1aWxkbG9nLm1ldGFkYXRhLnRpdGxlfVwiIGFzIFwiJHtwYXJhbXMudGl0bGV9XCJgLFxuICAgICAgZm9ya2VkRnJvbToge1xuICAgICAgICBzbHVnOiBwYXJhbXMuc2x1ZyxcbiAgICAgICAgdGl0bGU6IHNvdXJjZUJ1aWxkbG9nLm1ldGFkYXRhLnRpdGxlLFxuICAgICAgICBvcmlnaW5hbFN0ZXBzOiBzb3VyY2VCdWlsZGxvZy5zdGVwcy5sZW5ndGgsXG4gICAgICB9LFxuICAgICAgc3RlcHNJbmhlcml0ZWQsXG4gICAgICBoaW50OiBcIlJlY29yZGluZyBpcyBub3cgYWN0aXZlLiBVc2UgYnVpbGRsb2dfcmVjb3JkX3N0ZXAgdG8gYWRkIG5ldyBzdGVwcywgXCIgK1xuICAgICAgICAgICAgXCJ0aGVuIGJ1aWxkbG9nX3JlY29yZF9zdG9wIHdoZW4gZmluaXNoZWQuXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJVbmtub3duIGVycm9yIG9jY3VycmVkXCIsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==