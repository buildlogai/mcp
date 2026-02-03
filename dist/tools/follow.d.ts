/**
 * buildlog_follow tool - Return prompts from a buildlog formatted for execution
 */
import { FollowParams } from "../types";
export declare const followToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            slug: {
                type: string;
                description: string;
            };
            step: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleFollow(params: FollowParams): Promise<string>;
