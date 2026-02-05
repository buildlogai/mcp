/**
 * buildlog_auto_status tool - Check auto-recording status
 */
export declare const autoStatusToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
};
export declare function handleAutoStatus(): Promise<string>;
