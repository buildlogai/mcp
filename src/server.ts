/**
 * MCP Server setup and tool registration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tool definitions
import { searchToolDefinition, handleSearch } from "./tools/search";
import { getToolDefinition, getStepsToolDefinition, handleGet, handleGetSteps } from "./tools/get";
import { followToolDefinition, handleFollow } from "./tools/follow";
import {
  recordStartToolDefinition,
  recordStepToolDefinition,
  recordStopToolDefinition,
  handleRecordStart,
  handleRecordStep,
  handleRecordStop,
} from "./tools/record";
import { uploadToolDefinition, handleUpload } from "./tools/upload";
import { forkToolDefinition, handleFork } from "./tools/fork";

// Types
import {
  SearchParams,
  GetParams,
  FollowParams,
  RecordStartParams,
  RecordStepParams,
  RecordStopParams,
  UploadParams,
  ForkParams,
} from "./types";

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "buildlog-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        searchToolDefinition,
        getToolDefinition,
        getStepsToolDefinition,
        followToolDefinition,
        recordStartToolDefinition,
        recordStepToolDefinition,
        recordStopToolDefinition,
        uploadToolDefinition,
        forkToolDefinition,
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "buildlog_search":
          result = await handleSearch(args as unknown as SearchParams);
          break;

        case "buildlog_get":
          result = await handleGet(args as unknown as GetParams);
          break;

        case "buildlog_get_steps":
          result = await handleGetSteps(args as unknown as GetParams);
          break;

        case "buildlog_follow":
          result = await handleFollow(args as unknown as FollowParams);
          break;

        case "buildlog_record_start":
          result = await handleRecordStart(args as unknown as RecordStartParams);
          break;

        case "buildlog_record_step":
          result = await handleRecordStep(args as unknown as RecordStepParams);
          break;

        case "buildlog_record_stop":
          result = await handleRecordStop(args as unknown as RecordStopParams);
          break;

        case "buildlog_upload":
          result = await handleUpload(args as unknown as UploadParams);
          break;

        case "buildlog_fork":
          result = await handleFork(args as unknown as ForkParams);
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
    } catch (error) {
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
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

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
