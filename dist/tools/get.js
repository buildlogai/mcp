"use strict";
/**
 * buildlog_get and buildlog_get_steps tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStepsToolDefinition = exports.getToolDefinition = void 0;
exports.handleGet = handleGet;
exports.handleGetSteps = handleGetSteps;
const client_1 = require("../api/client");
exports.getToolDefinition = {
    name: "buildlog_get",
    description: "Fetch a specific buildlog by slug or URL. Returns the full buildlog including metadata, all steps, and outcome.",
    inputSchema: {
        type: "object",
        properties: {
            slug: {
                type: "string",
                description: "The buildlog slug or full URL (e.g., 'abc123' or 'https://buildlog.ai/b/abc123')",
            },
        },
        required: ["slug"],
    },
};
exports.getStepsToolDefinition = {
    name: "buildlog_get_steps",
    description: "Get just the steps from a buildlog. Useful when you only need the workflow steps without full metadata.",
    inputSchema: {
        type: "object",
        properties: {
            slug: {
                type: "string",
                description: "The buildlog slug or full URL",
            },
        },
        required: ["slug"],
    },
};
async function handleGet(params) {
    try {
        const buildlog = await client_1.apiClient.get(params.slug);
        return JSON.stringify({
            success: true,
            buildlog: {
                version: buildlog.version,
                format: buildlog.format,
                metadata: buildlog.metadata,
                stepCount: buildlog.steps.length,
                steps: buildlog.steps,
                outcome: buildlog.outcome,
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
async function handleGetSteps(params) {
    try {
        const buildlog = await client_1.apiClient.get(params.slug);
        // Return just the steps with minimal context
        const steps = buildlog.steps.map((step, index) => {
            const base = {
                step: index + 1,
                type: step.type,
                timestamp: step.timestamp,
            };
            switch (step.type) {
                case "prompt":
                    return {
                        ...base,
                        content: step.content,
                        context: step.context,
                        intent: step.intent,
                    };
                case "action":
                    return {
                        ...base,
                        summary: step.summary,
                        filesCreated: step.filesCreated,
                        filesModified: step.filesModified,
                        approach: step.approach,
                    };
                case "terminal":
                    return {
                        ...base,
                        command: step.command,
                        outcome: step.outcome,
                        summary: step.summary,
                    };
                case "note":
                    return {
                        ...base,
                        content: step.content,
                        category: step.category,
                    };
                case "checkpoint":
                    return {
                        ...base,
                        name: step.name,
                        summary: step.summary,
                    };
                case "error":
                    return {
                        ...base,
                        message: step.message,
                        resolution: step.resolution,
                        resolved: step.resolved,
                    };
                default:
                    return base;
            }
        });
        return JSON.stringify({
            success: true,
            title: buildlog.metadata.title,
            totalSteps: steps.length,
            steps,
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL2dldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQXFDSCw4QkFxQkM7QUFFRCx3Q0F1RUM7QUFqSUQsMENBQTBDO0FBRzdCLFFBQUEsaUJBQWlCLEdBQUc7SUFDL0IsSUFBSSxFQUFFLGNBQWM7SUFDcEIsV0FBVyxFQUNULGlIQUFpSDtJQUNuSCxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxrRkFBa0Y7YUFDaEc7U0FDRjtRQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztLQUNuQjtDQUNGLENBQUM7QUFFVyxRQUFBLHNCQUFzQixHQUFHO0lBQ3BDLElBQUksRUFBRSxvQkFBb0I7SUFDMUIsV0FBVyxFQUNULHlHQUF5RztJQUMzRyxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwrQkFBK0I7YUFDN0M7U0FDRjtRQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztLQUNuQjtDQUNGLENBQUM7QUFFSyxLQUFLLFVBQVUsU0FBUyxDQUFDLE1BQWlCO0lBQy9DLElBQUksQ0FBQztRQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sa0JBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRTtnQkFDUixPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU87Z0JBQ3pCLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtnQkFDdkIsUUFBUSxFQUFFLFFBQVEs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QyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtTQUN6RSxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogYnVpbGRsb2dfZ2V0IGFuZCBidWlsZGxvZ19nZXRfc3RlcHMgdG9vbHNcbiAqL1xuXG5pbXBvcnQgeyBhcGlDbGllbnQgfSBmcm9tIFwiLi4vYXBpL2NsaWVudFwiO1xuaW1wb3J0IHsgR2V0UGFyYW1zIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBnZXRUb29sRGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogXCJidWlsZGxvZ19nZXRcIixcbiAgZGVzY3JpcHRpb246XG4gICAgXCJGZXRjaCBhIHNwZWNpZmljIGJ1aWxkbG9nIGJ5IHNsdWcgb3IgVVJMLiBSZXR1cm5zIHRoZSBmdWxsIGJ1aWxkbG9nIGluY2x1ZGluZyBtZXRhZGF0YSwgYWxsIHN0ZXBzLCBhbmQgb3V0Y29tZS5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHNsdWc6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGJ1aWxkbG9nIHNsdWcgb3IgZnVsbCBVUkwgKGUuZy4sICdhYmMxMjMnIG9yICdodHRwczovL2J1aWxkbG9nLmFpL2IvYWJjMTIzJylcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXF1aXJlZDogW1wic2x1Z1wiXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRTdGVwc1Rvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX2dldF9zdGVwc1wiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIkdldCBqdXN0IHRoZSBzdGVwcyBmcm9tIGEgYnVpbGRsb2cuIFVzZWZ1bCB3aGVuIHlvdSBvbmx5IG5lZWQgdGhlIHdvcmtmbG93IHN0ZXBzIHdpdGhvdXQgZnVsbCBtZXRhZGF0YS5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHNsdWc6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGJ1aWxkbG9nIHNsdWcgb3IgZnVsbCBVUkxcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXF1aXJlZDogW1wic2x1Z1wiXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHZXQocGFyYW1zOiBHZXRQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJ1aWxkbG9nID0gYXdhaXQgYXBpQ2xpZW50LmdldChwYXJhbXMuc2x1Zyk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGJ1aWxkbG9nOiB7XG4gICAgICAgIHZlcnNpb246IGJ1aWxkbG9nLnZlcnNpb24sXG4gICAgICAgIGZvcm1hdDogYnVpbGRsb2cuZm9ybWF0LFxuICAgICAgICBtZXRhZGF0YTogYnVpbGRsb2cubWV0YWRhdGEsXG4gICAgICAgIHN0ZXBDb3VudDogYnVpbGRsb2cuc3RlcHMubGVuZ3RoLFxuICAgICAgICBzdGVwczogYnVpbGRsb2cuc3RlcHMsXG4gICAgICAgIG91dGNvbWU6IGJ1aWxkbG9nLm91dGNvbWUsXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHZXRTdGVwcyhwYXJhbXM6IEdldFBhcmFtcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVpbGRsb2cgPSBhd2FpdCBhcGlDbGllbnQuZ2V0KHBhcmFtcy5zbHVnKTtcblxuICAgIC8vIFJldHVybiBqdXN0IHRoZSBzdGVwcyB3aXRoIG1pbmltYWwgY29udGV4dFxuICAgIGNvbnN0IHN0ZXBzID0gYnVpbGRsb2cuc3RlcHMubWFwKChzdGVwLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgYmFzZSA9IHtcbiAgICAgICAgc3RlcDogaW5kZXggKyAxLFxuICAgICAgICB0eXBlOiBzdGVwLnR5cGUsXG4gICAgICAgIHRpbWVzdGFtcDogc3RlcC50aW1lc3RhbXAsXG4gICAgICB9O1xuXG4gICAgICBzd2l0Y2ggKHN0ZXAudHlwZSkge1xuICAgICAgICBjYXNlIFwicHJvbXB0XCI6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmJhc2UsXG4gICAgICAgICAgICBjb250ZW50OiBzdGVwLmNvbnRlbnQsXG4gICAgICAgICAgICBjb250ZXh0OiBzdGVwLmNvbnRleHQsXG4gICAgICAgICAgICBpbnRlbnQ6IHN0ZXAuaW50ZW50LFxuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgXCJhY3Rpb25cIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgIHN1bW1hcnk6IHN0ZXAuc3VtbWFyeSxcbiAgICAgICAgICAgIGZpbGVzQ3JlYXRlZDogc3RlcC5maWxlc0NyZWF0ZWQsXG4gICAgICAgICAgICBmaWxlc01vZGlmaWVkOiBzdGVwLmZpbGVzTW9kaWZpZWQsXG4gICAgICAgICAgICBhcHByb2FjaDogc3RlcC5hcHByb2FjaCxcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwidGVybWluYWxcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgIGNvbW1hbmQ6IHN0ZXAuY29tbWFuZCxcbiAgICAgICAgICAgIG91dGNvbWU6IHN0ZXAub3V0Y29tZSxcbiAgICAgICAgICAgIHN1bW1hcnk6IHN0ZXAuc3VtbWFyeSxcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5iYXNlLFxuICAgICAgICAgICAgY29udGVudDogc3RlcC5jb250ZW50LFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHN0ZXAuY2F0ZWdvcnksXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSBcImNoZWNrcG9pbnRcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgIG5hbWU6IHN0ZXAubmFtZSxcbiAgICAgICAgICAgIHN1bW1hcnk6IHN0ZXAuc3VtbWFyeSxcbiAgICAgICAgICB9O1xuICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHN0ZXAubWVzc2FnZSxcbiAgICAgICAgICAgIHJlc29sdXRpb246IHN0ZXAucmVzb2x1dGlvbixcbiAgICAgICAgICAgIHJlc29sdmVkOiBzdGVwLnJlc29sdmVkLFxuICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHRpdGxlOiBidWlsZGxvZy5tZXRhZGF0YS50aXRsZSxcbiAgICAgIHRvdGFsU3RlcHM6IHN0ZXBzLmxlbmd0aCxcbiAgICAgIHN0ZXBzLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=