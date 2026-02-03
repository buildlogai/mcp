/**
 * MCP Server setup and tool registration
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
/**
 * Create and configure the MCP server
 */
export declare function createServer(): Server;
/**
 * Start the server with stdio transport
 */
export declare function startServer(): Promise<void>;
