#!/usr/bin/env node
"use strict";
/**
 * @buildlogai/mcp - MCP server entry point
 *
 * Provides AI agents with direct access to buildlog functionality:
 * - Search for relevant workflows
 * - Follow proven buildlog recipes
 * - Record sessions as they work
 * - Upload completed buildlogs
 */
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
// Start the MCP server
(0, server_1.startServer)().catch((error) => {
    console.error("Failed to start buildlog MCP server:", error);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7Ozs7Ozs7R0FRRzs7QUFFSCxxQ0FBdUM7QUFFdkMsdUJBQXVCO0FBQ3ZCLElBQUEsb0JBQVcsR0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO0lBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8qKlxuICogQGJ1aWxkbG9nYWkvbWNwIC0gTUNQIHNlcnZlciBlbnRyeSBwb2ludFxuICogXG4gKiBQcm92aWRlcyBBSSBhZ2VudHMgd2l0aCBkaXJlY3QgYWNjZXNzIHRvIGJ1aWxkbG9nIGZ1bmN0aW9uYWxpdHk6XG4gKiAtIFNlYXJjaCBmb3IgcmVsZXZhbnQgd29ya2Zsb3dzXG4gKiAtIEZvbGxvdyBwcm92ZW4gYnVpbGRsb2cgcmVjaXBlc1xuICogLSBSZWNvcmQgc2Vzc2lvbnMgYXMgdGhleSB3b3JrXG4gKiAtIFVwbG9hZCBjb21wbGV0ZWQgYnVpbGRsb2dzXG4gKi9cblxuaW1wb3J0IHsgc3RhcnRTZXJ2ZXIgfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcblxuLy8gU3RhcnQgdGhlIE1DUCBzZXJ2ZXJcbnN0YXJ0U2VydmVyKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc3RhcnQgYnVpbGRsb2cgTUNQIHNlcnZlcjpcIiwgZXJyb3IpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcbiJdfQ==