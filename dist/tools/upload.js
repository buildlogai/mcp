"use strict";
/**
 * buildlog_upload tool - Upload a buildlog to buildlog.ai
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToolDefinition = void 0;
exports.handleUpload = handleUpload;
const client_1 = require("../api/client");
exports.uploadToolDefinition = {
    name: "buildlog_upload",
    description: "Upload a buildlog to buildlog.ai. Requires BUILDLOG_API_KEY environment variable for authentication. " +
        "Use this after buildlog_record_stop to share your workflow with others.",
    inputSchema: {
        type: "object",
        properties: {
            buildlog: {
                type: "object",
                description: "The buildlog object to upload (returned from buildlog_record_stop)",
            },
            public: {
                type: "boolean",
                description: "Whether the buildlog should be publicly visible (default: true)",
                default: true,
            },
        },
        required: ["buildlog"],
    },
};
async function handleUpload(params) {
    try {
        // Validate the buildlog structure
        const buildlog = params.buildlog;
        if (!buildlog.version || !buildlog.metadata || !buildlog.steps) {
            return JSON.stringify({
                success: false,
                error: "Invalid buildlog structure. Must include version, metadata, and steps.",
            });
        }
        const response = await client_1.apiClient.upload(buildlog, params.public ?? true);
        return JSON.stringify({
            success: true,
            message: "Buildlog uploaded successfully",
            slug: response.slug,
            url: response.url,
            public: params.public ?? true,
            hint: `View at ${response.url}`,
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL3VwbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQTRCSCxvQ0E0QkM7QUFyREQsMENBQTBDO0FBRzdCLFFBQUEsb0JBQW9CLEdBQUc7SUFDbEMsSUFBSSxFQUFFLGlCQUFpQjtJQUN2QixXQUFXLEVBQ1QsdUdBQXVHO1FBQ3ZHLHlFQUF5RTtJQUMzRSxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsUUFBUSxFQUFFO2dCQUNSLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxvRUFBb0U7YUFDbEY7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLGlFQUFpRTtnQkFDOUUsT0FBTyxFQUFFLElBQUk7YUFDZDtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDO0tBQ3ZCO0NBQ0YsQ0FBQztBQUVLLEtBQUssVUFBVSxZQUFZLENBQUMsTUFBb0I7SUFDckQsSUFBSSxDQUFDO1FBQ0gsa0NBQWtDO1FBQ2xDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFtQyxDQUFDO1FBRTVELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3BCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSx3RUFBd0U7YUFDaEYsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sa0JBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUM7UUFFekUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLGdDQUFnQztZQUN6QyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7WUFDbkIsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUk7WUFDN0IsSUFBSSxFQUFFLFdBQVcsUUFBUSxDQUFDLEdBQUcsRUFBRTtTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7U0FDekUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGJ1aWxkbG9nX3VwbG9hZCB0b29sIC0gVXBsb2FkIGEgYnVpbGRsb2cgdG8gYnVpbGRsb2cuYWlcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGxvZ0ZpbGUgfSBmcm9tIFwiQGJ1aWxkbG9nYWkvdHlwZXNcIjtcbmltcG9ydCB7IGFwaUNsaWVudCB9IGZyb20gXCIuLi9hcGkvY2xpZW50XCI7XG5pbXBvcnQgeyBVcGxvYWRQYXJhbXMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IHVwbG9hZFRvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX3VwbG9hZFwiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIlVwbG9hZCBhIGJ1aWxkbG9nIHRvIGJ1aWxkbG9nLmFpLiBSZXF1aXJlcyBCVUlMRExPR19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIGZvciBhdXRoZW50aWNhdGlvbi4gXCIgK1xuICAgIFwiVXNlIHRoaXMgYWZ0ZXIgYnVpbGRsb2dfcmVjb3JkX3N0b3AgdG8gc2hhcmUgeW91ciB3b3JrZmxvdyB3aXRoIG90aGVycy5cIixcbiAgaW5wdXRTY2hlbWE6IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiIGFzIGNvbnN0LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGJ1aWxkbG9nOiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBidWlsZGxvZyBvYmplY3QgdG8gdXBsb2FkIChyZXR1cm5lZCBmcm9tIGJ1aWxkbG9nX3JlY29yZF9zdG9wKVwiLFxuICAgICAgfSxcbiAgICAgIHB1YmxpYzoge1xuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiV2hldGhlciB0aGUgYnVpbGRsb2cgc2hvdWxkIGJlIHB1YmxpY2x5IHZpc2libGUgKGRlZmF1bHQ6IHRydWUpXCIsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcmVxdWlyZWQ6IFtcImJ1aWxkbG9nXCJdLFxuICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVVwbG9hZChwYXJhbXM6IFVwbG9hZFBhcmFtcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgLy8gVmFsaWRhdGUgdGhlIGJ1aWxkbG9nIHN0cnVjdHVyZVxuICAgIGNvbnN0IGJ1aWxkbG9nID0gcGFyYW1zLmJ1aWxkbG9nIGFzIHVua25vd24gYXMgQnVpbGRsb2dGaWxlO1xuICAgIFxuICAgIGlmICghYnVpbGRsb2cudmVyc2lvbiB8fCAhYnVpbGRsb2cubWV0YWRhdGEgfHwgIWJ1aWxkbG9nLnN0ZXBzKSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IFwiSW52YWxpZCBidWlsZGxvZyBzdHJ1Y3R1cmUuIE11c3QgaW5jbHVkZSB2ZXJzaW9uLCBtZXRhZGF0YSwgYW5kIHN0ZXBzLlwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGlDbGllbnQudXBsb2FkKGJ1aWxkbG9nLCBwYXJhbXMucHVibGljID8/IHRydWUpO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiBcIkJ1aWxkbG9nIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgc2x1ZzogcmVzcG9uc2Uuc2x1ZyxcbiAgICAgIHVybDogcmVzcG9uc2UudXJsLFxuICAgICAgcHVibGljOiBwYXJhbXMucHVibGljID8/IHRydWUsXG4gICAgICBoaW50OiBgVmlldyBhdCAke3Jlc3BvbnNlLnVybH1gLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=