/**
 * buildlog_fork tool - Start a new recording based on an existing buildlog
 */
import { ForkParams } from "../types";
export declare const forkToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            slug: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            fromStep: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleFork(params: ForkParams): Promise<string>;
