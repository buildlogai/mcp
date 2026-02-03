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
                get_1.getToolDefinition,
                get_1.getStepsToolDefinition,
                follow_1.followToolDefinition,
                record_1.recordStartToolDefinition,
                record_1.recordStepToolDefinition,
                record_1.recordStopToolDefinition,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBdUNILG9DQTJHQztBQUtELGtDQWdCQztBQXJLRCx3RUFBbUU7QUFDbkUsd0VBQWlGO0FBQ2pGLGlFQUc0QztBQUU1QyxtQkFBbUI7QUFDbkIsMkNBQW9FO0FBQ3BFLHFDQUFtRztBQUNuRywyQ0FBb0U7QUFDcEUsMkNBT3dCO0FBQ3hCLDJDQUFvRTtBQUNwRSx1Q0FBOEQ7QUFjOUQ7O0dBRUc7QUFDSCxTQUFnQixZQUFZO0lBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksaUJBQU0sQ0FDdkI7UUFDRSxJQUFJLEVBQUUsY0FBYztRQUNwQixPQUFPLEVBQUUsT0FBTztLQUNqQixFQUNEO1FBQ0UsWUFBWSxFQUFFO1lBQ1osS0FBSyxFQUFFLEVBQUU7U0FDVjtLQUNGLENBQ0YsQ0FBQztJQUVGLGdDQUFnQztJQUNoQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsaUNBQXNCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDMUQsT0FBTztZQUNMLEtBQUssRUFBRTtnQkFDTCw2QkFBb0I7Z0JBQ3BCLHVCQUFpQjtnQkFDakIsNEJBQXNCO2dCQUN0Qiw2QkFBb0I7Z0JBQ3BCLGtDQUF5QjtnQkFDekIsaUNBQXdCO2dCQUN4QixpQ0FBd0I7Z0JBQ3hCLDZCQUFvQjtnQkFDcEIseUJBQWtCO2FBQ25CO1NBQ0YsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsNkJBQTZCO0lBQzdCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxnQ0FBcUIsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDaEUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUVqRCxJQUFJLENBQUM7WUFDSCxJQUFJLE1BQWMsQ0FBQztZQUVuQixRQUFRLElBQUksRUFB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QztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1DUCBTZXJ2ZXIgc2V0dXAgYW5kIHRvb2wgcmVnaXN0cmF0aW9uXG4gKi9cblxuaW1wb3J0IHsgU2VydmVyIH0gZnJvbSBcIkBtb2RlbGNvbnRleHRwcm90b2NvbC9zZGsvc2VydmVyL2luZGV4LmpzXCI7XG5pbXBvcnQgeyBTdGRpb1NlcnZlclRyYW5zcG9ydCB9IGZyb20gXCJAbW9kZWxjb250ZXh0cHJvdG9jb2wvc2RrL3NlcnZlci9zdGRpby5qc1wiO1xuaW1wb3J0IHtcbiAgQ2FsbFRvb2xSZXF1ZXN0U2NoZW1hLFxuICBMaXN0VG9vbHNSZXF1ZXN0U2NoZW1hLFxufSBmcm9tIFwiQG1vZGVsY29udGV4dHByb3RvY29sL3Nkay90eXBlcy5qc1wiO1xuXG4vLyBUb29sIGRlZmluaXRpb25zXG5pbXBvcnQgeyBzZWFyY2hUb29sRGVmaW5pdGlvbiwgaGFuZGxlU2VhcmNoIH0gZnJvbSBcIi4vdG9vbHMvc2VhcmNoXCI7XG5pbXBvcnQgeyBnZXRUb29sRGVmaW5pdGlvbiwgZ2V0U3RlcHNUb29sRGVmaW5pdGlvbiwgaGFuZGxlR2V0LCBoYW5kbGVHZXRTdGVwcyB9IGZyb20gXCIuL3Rvb2xzL2dldFwiO1xuaW1wb3J0IHsgZm9sbG93VG9vbERlZmluaXRpb24sIGhhbmRsZUZvbGxvdyB9IGZyb20gXCIuL3Rvb2xzL2ZvbGxvd1wiO1xuaW1wb3J0IHtcbiAgcmVjb3JkU3RhcnRUb29sRGVmaW5pdGlvbixcbiAgcmVjb3JkU3RlcFRvb2xEZWZpbml0aW9uLFxuICByZWNvcmRTdG9wVG9vbERlZmluaXRpb24sXG4gIGhhbmRsZVJlY29yZFN0YXJ0LFxuICBoYW5kbGVSZWNvcmRTdGVwLFxuICBoYW5kbGVSZWNvcmRTdG9wLFxufSBmcm9tIFwiLi90b29scy9yZWNvcmRcIjtcbmltcG9ydCB7IHVwbG9hZFRvb2xEZWZpbml0aW9uLCBoYW5kbGVVcGxvYWQgfSBmcm9tIFwiLi90b29scy91cGxvYWRcIjtcbmltcG9ydCB7IGZvcmtUb29sRGVmaW5pdGlvbiwgaGFuZGxlRm9yayB9IGZyb20gXCIuL3Rvb2xzL2ZvcmtcIjtcblxuLy8gVHlwZXNcbmltcG9ydCB7XG4gIFNlYXJjaFBhcmFtcyxcbiAgR2V0UGFyYW1zLFxuICBGb2xsb3dQYXJhbXMsXG4gIFJlY29yZFN0YXJ0UGFyYW1zLFxuICBSZWNvcmRTdGVwUGFyYW1zLFxuICBSZWNvcmRTdG9wUGFyYW1zLFxuICBVcGxvYWRQYXJhbXMsXG4gIEZvcmtQYXJhbXMsXG59IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBjb25maWd1cmUgdGhlIE1DUCBzZXJ2ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlcnZlcigpOiBTZXJ2ZXIge1xuICBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKFxuICAgIHtcbiAgICAgIG5hbWU6IFwiYnVpbGRsb2ctbWNwXCIsXG4gICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgdG9vbHM6IHt9LFxuICAgICAgfSxcbiAgICB9XG4gICk7XG5cbiAgLy8gUmVnaXN0ZXIgdG9vbCBsaXN0aW5nIGhhbmRsZXJcbiAgc2VydmVyLnNldFJlcXVlc3RIYW5kbGVyKExpc3RUb29sc1JlcXVlc3RTY2hlbWEsIGFzeW5jICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdG9vbHM6IFtcbiAgICAgICAgc2VhcmNoVG9vbERlZmluaXRpb24sXG4gICAgICAgIGdldFRvb2xEZWZpbml0aW9uLFxuICAgICAgICBnZXRTdGVwc1Rvb2xEZWZpbml0aW9uLFxuICAgICAgICBmb2xsb3dUb29sRGVmaW5pdGlvbixcbiAgICAgICAgcmVjb3JkU3RhcnRUb29sRGVmaW5pdGlvbixcbiAgICAgICAgcmVjb3JkU3RlcFRvb2xEZWZpbml0aW9uLFxuICAgICAgICByZWNvcmRTdG9wVG9vbERlZmluaXRpb24sXG4gICAgICAgIHVwbG9hZFRvb2xEZWZpbml0aW9uLFxuICAgICAgICBmb3JrVG9vbERlZmluaXRpb24sXG4gICAgICBdLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIFJlZ2lzdGVyIHRvb2wgY2FsbCBoYW5kbGVyXG4gIHNlcnZlci5zZXRSZXF1ZXN0SGFuZGxlcihDYWxsVG9vbFJlcXVlc3RTY2hlbWEsIGFzeW5jIChyZXF1ZXN0KSA9PiB7XG4gICAgY29uc3QgeyBuYW1lLCBhcmd1bWVudHM6IGFyZ3MgfSA9IHJlcXVlc3QucGFyYW1zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHQ6IHN0cmluZztcblxuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgXCJidWlsZGxvZ19zZWFyY2hcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVTZWFyY2goYXJncyBhcyB1bmtub3duIGFzIFNlYXJjaFBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImJ1aWxkbG9nX2dldFwiOlxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUdldChhcmdzIGFzIHVua25vd24gYXMgR2V0UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfZ2V0X3N0ZXBzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlR2V0U3RlcHMoYXJncyBhcyB1bmtub3duIGFzIEdldFBhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImJ1aWxkbG9nX2ZvbGxvd1wiOlxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZUZvbGxvdyhhcmdzIGFzIHVua25vd24gYXMgRm9sbG93UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0YXJ0XCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlUmVjb3JkU3RhcnQoYXJncyBhcyB1bmtub3duIGFzIFJlY29yZFN0YXJ0UGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0ZXBcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVSZWNvcmRTdGVwKGFyZ3MgYXMgdW5rbm93biBhcyBSZWNvcmRTdGVwUGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfcmVjb3JkX3N0b3BcIjpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVSZWNvcmRTdG9wKGFyZ3MgYXMgdW5rbm93biBhcyBSZWNvcmRTdG9wUGFyYW1zKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwiYnVpbGRsb2dfdXBsb2FkXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlVXBsb2FkKGFyZ3MgYXMgdW5rbm93biBhcyBVcGxvYWRQYXJhbXMpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgXCJidWlsZGxvZ19mb3JrXCI6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaGFuZGxlRm9yayhhcmdzIGFzIHVua25vd24gYXMgRm9ya1BhcmFtcyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBgVW5rbm93biB0b29sOiAke25hbWV9YCxcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgdGV4dDogcmVzdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgdGV4dDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGlzRXJyb3I6IHRydWUsXG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHNlcnZlcjtcbn1cblxuLyoqXG4gKiBTdGFydCB0aGUgc2VydmVyIHdpdGggc3RkaW8gdHJhbnNwb3J0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydFNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc2VydmVyID0gY3JlYXRlU2VydmVyKCk7XG4gIGNvbnN0IHRyYW5zcG9ydCA9IG5ldyBTdGRpb1NlcnZlclRyYW5zcG9ydCgpO1xuXG4gIGF3YWl0IHNlcnZlci5jb25uZWN0KHRyYW5zcG9ydCk7XG5cbiAgLy8gSGFuZGxlIGdyYWNlZnVsIHNodXRkb3duXG4gIHByb2Nlc3Mub24oXCJTSUdJTlRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHNlcnZlci5jbG9zZSgpO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfSk7XG5cbiAgcHJvY2Vzcy5vbihcIlNJR1RFUk1cIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHNlcnZlci5jbG9zZSgpO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfSk7XG59XG4iXX0=