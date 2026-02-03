#!/usr/bin/env node
/**
 * @buildlogai/mcp - MCP server entry point
 * 
 * Provides AI agents with direct access to buildlog functionality:
 * - Search for relevant workflows
 * - Follow proven buildlog recipes
 * - Record sessions as they work
 * - Upload completed buildlogs
 */

import { startServer } from "./server";

// Start the MCP server
startServer().catch((error) => {
  console.error("Failed to start buildlog MCP server:", error);
  process.exit(1);
});
