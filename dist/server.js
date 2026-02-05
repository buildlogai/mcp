"use strict";
/**
 * MCP Server setup and tool registration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.startServer = startServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// Tool definitions
const search_1 = require("./tools/search");
const get_1 = require("./tools/get");
const follow_1 = require("./tools/follow");
const record_1 = require("./tools/record");
const upload_1 = require("./tools/upload");
const fork_1 = require("./tools/fork");
const auto_1 = require("./tools/auto");
const suggest_1 = require("./tools/suggest");
/**
 * Create and configure the MCP server
 */
function createServer() {
    const server = new index_js_1.Server({
        name: "buildlog-mcp",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    // Register tool listing handler
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        return {
            tools: [
                search_1.searchToolDefinition,
                suggest_1.suggestToolDefinition,
                get_1.getToolDefinition,
                get_1.getStepsToolDefinition,
                follow_1.followToolDefinition,
                record_1.recordStartToolDefinition,
                record_1.recordStepToolDefinition,
                record_1.recordStopToolDefinition,
                auto_1.autoStatusToolDefinition,
                upload_1.uploadToolDefinition,
                fork_1.forkToolDefinition,
            ],
        };
    });
    // Register tool call handler
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            let result;
            switch (name) {
                case "buildlog_search":
                    result = await (0, search_1.handleSearch)(args);
                    break;
                case "buildlog_get":
                    result = await (0, get_1.handleGet)(args);
                    break;
                case "buildlog_get_steps":
                    result = await (0, get_1.handleGetSteps)(args);
                    break;
                case "buildlog_follow":
                    result = await (0, follow_1.handleFollow)(args);
                    break;
                case "buildlog_record_start":
                    result = await (0, record_1.handleRecordStart)(args);
                    break;
                case "buildlog_record_step":
                    result = await (0, record_1.handleRecordStep)(args);
                    break;
                case "buildlog_record_stop":
                    result = await (0, record_1.handleRecordStop)(args);
                    break;
                case "buildlog_upload":
                    result = await (0, upload_1.handleUpload)(args);
                    break;
                case "buildlog_fork":
                    result = await (0, fork_1.handleFork)(args);
                    break;
                case "buildlog_auto_status":
                    result = await (0, auto_1.handleAutoStatus)();
                    break;
                case "buildlog_suggest":
                    result = await (0, suggest_1.handleSuggest)(args);
                    break;
                default:
                    result = JSON.stringify({
                        success: false,
                        error: `Unknown tool: ${name}`,
                    });
            }
            return {
                content: [
                    {
                        type: "text",
                        text: result,
                    },
                ],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: errorMessage,
                        }),
                    },
                ],
                isError: true,
            };
        }
    });
    return server;
}
/**
 * Start the server with stdio transport
 */
async function startServer() {
    const server = createServer();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
        await server.close();
        process.exit(0);
    });
    process.on("SIGTERM", async () => {
        await server.close();
        process.exit(0);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBMENILG9DQXFIQztBQUtELGtDQWdCQztBQWxMRCx3RUFBbUU7QUFDbkUsd0VBQWlGO0FBQ2pGLGlFQUc0QztBQUU1QyxtQkFBbUI7QUFDbkIsMkNBQW9FO0FBQ3BFLHFDQUFtRztBQUNuRywyQ0FBb0U7QUFDcEUsMkNBT3dCO0FBQ3hCLDJDQUFvRTtBQUNwRSx1Q0FBOEQ7QUFDOUQsdUNBQTBFO0FBQzFFLDZDQUF1RTtBQWV2RTs7R0FFRztBQUNILFNBQWdCLFlBQVk7SUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBTSxDQUN2QjtRQUNFLElBQUksRUFBRSxjQUFjO1FBQ3BCLE9BQU8sRUFBRSxPQUFPO0tBQ2pCLEVBQ0Q7UUFDRSxZQUFZLEVBQUU7WUFDWixLQUFLLEVBQUUsRUFBRTtTQUNWO0tBQ0YsQ0FDRixDQUFDO0lBRUYsZ0NBQWdDO0lBQ2hDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxpQ0FBc0IsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMxRCxPQUFPO1lBQ0wsS0FBSyxFQUFFO2dCQUNMLDZCQUFvQjtnQkFDcEIsK0JBQXFCO2dCQUNyQix1QkFBaUI7Z0JBQ2pCLDRCQUFzQjtnQkFDdEIsNkJBQW9CO2dCQUNwQixrQ0FBeUI7Z0JBQ3pCLGlDQUF3QjtnQkFDeEIsaUNBQXdCO2dCQUN4QiwrQkFBd0I7Z0JBQ3hCLDZCQUFvQjtnQkFDcEIseUJBQWtCO2FBQ25CO1NBQ0YsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsNkJBQTZCO0lBQzdCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxnQ0FBcUIsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDaEUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztR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TUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUMvQixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTUNQIFNlcnZlciBzZXR1cCBhbmQgdG9vbCByZWdpc3RyYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tIFwiQG1vZGVsY29udGV4dHByb3RvY29sL3Nkay9zZXJ2ZXIvaW5kZXguanNcIjtcbmltcG9ydCB7IFN0ZGlvU2VydmVyVHJhbnNwb3J0IH0gZnJvbSBcIkBtb2RlbGNvbnRleHRwcm90b2NvbC9zZGsvc2VydmVyL3N0ZGlvLmpzXCI7XG5pbXBvcnQge1xuICBDYWxsVG9vbFJlcXVlc3RTY2hlbWEsXG4gIExpc3RUb29sc1JlcXVlc3RTY2hlbWEsXG59IGZyb20gXCJAbW9kZWxjb250ZXh0cHJvdG9jb2wvc2RrL3R5cGVzLmpzXCI7XG5cbi8vIFRvb2wgZGVmaW5pdGlvbnNcbmltcG9ydCB7IHNlYXJjaFRvb2xEZWZpbml0aW9uLCBoYW5kbGVTZWFyY2ggfSBmcm9tIFwiLi90b29scy9zZWFyY2hcIjtcbmltcG9ydCB7IGdldFRvb2xEZWZpbml0aW9uLCBnZXRTdGVwc1Rvb2xEZWZpbml0aW9uLCBoYW5kbGVHZXQsIGhhbmRsZUdldFN0ZXBzIH0gZnJvbSBcIi4vdG9vbHMvZ2V0XCI7XG5pbXBvcnQgeyBmb2xsb3dUb29sRGVmaW5pdGlvbiwgaGFuZGxlRm9sbG93IH0gZnJvbSBcIi4vdG9vbHMvZm9sbG93XCI7XG5pbXBvcnQge1xuICByZWNvcmRTdGFydFRvb2xEZWZpbml0aW9uLFxuICByZWNvcmRTdGVwVG9vbERlZmluaXRpb24sXG4gIHJlY29yZFN0b3BUb29sRGVmaW5pdGlvbixcbiAgaGFuZGxlUmVjb3JkU3RhcnQsXG4gIGhhbmRsZVJlY29yZFN0ZXAsXG4gIGhhbmRsZVJlY29yZFN0b3AsXG59IGZyb20gXCIuL3Rvb2xzL3JlY29yZFwiO1xuaW1wb3J0IHsgdXBsb2FkVG9vbERlZmluaXRpb24sIGhhbmRsZVVwbG9hZCB9IGZyb20gXCIuL3Rvb2xzL3VwbG9hZFwiO1xuaW1wb3J0IHsgZm9ya1Rvb2xEZWZpbml0aW9uLCBoYW5kbGVGb3JrIH0gZnJvbSBcIi4vdG9vbHMvZm9ya1wiO1xuaW1wb3J0IHsgYXV0b1N0YXR1c1Rvb2xEZWZpbml0aW9uLCBoYW5kbGVBdXRvU3RhdHVzIH0gZnJvbSBcIi4vdG9vbHMvYXV0b1wiO1xuaW1wb3J0IHsgc3VnZ2VzdFRvb2xEZWZpbml0aW9uLCBoYW5kbGVTdWdnZXN0IH0gZnJvbSBcIi4vdG9vbHMvc3VnZ2VzdFwiO1xuXG4vLyBUeXBlc1xuaW1wb3J0IHtcbiAgU2VhcmNoUGFyYW1zLFxuICBHZXRQYXJhbXMsXG4gIEZvbGxvd1BhcmFtcyxcbiAgUmVjb3JkU3RhcnRQYXJhbXMsXG4gIFJlY29yZFN0ZXBQYXJhbXMsXG4gIFJlY29yZFN0b3BQYXJhbXMsXG4gIFVwbG9hZFBhcmFtcyxcbiAgRm9ya1BhcmFtcyxcbiAgU3VnZ2VzdFBhcmFtcyxcbn0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqXG4gKiBDcmVhdGUgYW5kIGNvbmZpZ3VyZSB0aGUgTUNQIHNlcnZlclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VydmVyKCk6IFNlcnZlciB7XG4gIGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoXG4gICAge1xuICAgICAgbmFtZTogXCJidWlsZGxvZy1tY3BcIixcbiAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIGNhcGFiaWxpdGllczoge1xuICAgICAgICB0b29sczoge30sXG4gICAgICB9LFxuICAgIH1cbiAgKTtcblxuICAvLyBSZWdpc3RlciB0b29sIGxpc3RpbmcgaGFuZGxlclxuICBzZXJ2ZXIuc2V0UmVxdWVzdEhhbmRsZXIoTGlzdFRvb2xzUmVxdWVzdFNjaGVtYSwgYXN5bmMgKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0b29sczogW1xuICAgICAgICBzZWFyY2hUb29sRGVmaW5pdGlvbixcbiAgICAgICAgc3VnZ2VzdFRvb2xEZWZpbml0aW9uLFxuICAgICAgICBnZXRUb29sRGVmaW5pdGlvbixcbiAgICAgICAgZ2V0U3RlcHNUb29sRGVmaW5pdGlvbixcbiAgICAgICAgZm9sbG93VG9vbERlZmluaXRpb24sXG4gICAgICAgIHJlY29yZFN0YXJ0VG9vbERlZmluaXRpb24sXG4gICAgICAgIHJlY29yZFN0ZXBUb29sRGVmaW5pdGlvbixcbiAgICAgICAgcmVjb3JkU3RvcFRvb2xEZWZpbml0aW9uLFxuICAgICAgICBhdXRvU3RhdHVzVG9vbERlZmluaXRpb24sXG4gICAgICAgIHVwbG9hZFRvb2xEZWZpbml0aW9uLFxuICAgICAgICBmb3JrVG9vbERlZmluaXRpb24sXG4gICAgICBdLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIFJlZ2lzdGVyIHRvb2wgY2FsbCBoYW5kbGVyXG4gIHNlcnZlci5zZXRSZXF1ZXN0SGFuZGxlcihDYWxsVG9vbFJlcXVlc3RTY2hlbWEsIGFzeW5jIChyZXF1ZXN0KSA9PiB7XG4gICAgY29uc3QgeyBuYW1lLCBhcmd1bWVudHM6IGFyZ3MgfSA9IHJlcXVlc3QucGFyYW1zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHQ6IHN0cmluZztcblxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgXCJidWlsZGxvZ19zZWFyY2hcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVTZWFyY2goYXJncyBhcyB1bmtub3duIGFzIFNlYXJjaFBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImJ1aWxkbG9nX2dldFwiOlxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUdldChhcmdzIGFzIHVua25vd24gYXMgR2V0UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfZ2V0X3N0ZXBzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlR2V0U3RlcHMoYXJncyBhcyB1bmtub3duIGFzIEdldFBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImJ1aWxkbG9nX2ZvbGxvd1wiOlxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUZvbGxvdyhhcmdzIGFzIHVua25vd24gYXMgRm9sbG93UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0YXJ0XCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlUmVjb3JkU3RhcnQoYXJncyBhcyB1bmtub3duIGFzIFJlY29yZFN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0ZXBcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVSZWNvcmRTdGVwKGFyZ3MgYXMgdW5rbm93biBhcyBSZWNvcmRTdGVwUGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0b3BcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVSZWNvcmRTdG9wKGFyZ3MgYXMgdW5rbm93biBhcyBSZWNvcmRTdG9wUGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfdXBsb2FkXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlVXBsb2FkKGFyZ3MgYXMgdW5rbm93biBhcyBVcGxvYWRQYXJhbXMpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgXCJidWlsZGxvZ19mb3JrXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlRm9yayhhcmdzIGFzIHVua25vd24gYXMgRm9ya1BhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImJ1aWxkbG9nX2F1dG9fc3RhdHVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlQXV0b1N0YXR1cygpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgXCJidWlsZGxvZ19zdWdnZXN0XCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlU3VnZ2VzdChhcmdzIGFzIHVua25vd24gYXMgU3VnZ2VzdFBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBgVW5rbm93biB0b29sOiAke25hbWV9YCxcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgdGV4dDogcmVzdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgdGV4dDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGlzRXJyb3I6IHRydWUsXG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHNlcnZlcjtcbn1cblxuLyoqXG4gKiBTdGFydCB0aGUgc2VydmVyIHdpdGggc3RkaW8gdHJhbnNwb3J0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydFNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc2VydmVyID0gY3JlYXRlU2VydmVyKCk7XG4gIGNvbnN0IHRyYW5zcG9ydCA9IG5ldyBTdGRpb1NlcnZlclRyYW5zcG9ydCgpO1xuXG4gIGF3YWl0IHNlcnZlci5jb25uZWN0KHRyYW5zcG9ydCk7XG5cbiAgLy8gSGFuZGxlIGdyYWNlZnVsIHNodXRkb3duXG4gIHByb2Nlc3Mub24oXCJTSUdJTlRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHNlcnZlci5jbG9zZSgpO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfSk7XG5cbiAgcHJvY2Vzcy5vbihcIlNJR1RFUk1cIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHNlcnZlci5jbG9zZSgpO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfSk7XG59XG4iXX0=