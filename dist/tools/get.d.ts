/**
 * buildlog_get and buildlog_get_steps tools
 */
import { GetParams } from "../types";
export declare const getToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            slug: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const getStepsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            slug: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleGet(params: GetParams): Promise<string>;
export declare function handleGetSteps(params: GetParams): Promise<string>;
