/**
 * buildlog_suggest tool - Proactive workflow suggestions
 */
export interface SuggestParams {
    taskDescription: string;
    contextFiles?: string[];
}
export declare const suggestToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskDescription: {
                type: string;
                description: string;
            };
            contextFiles: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleSuggest(params: SuggestParams): Promise<string>;
