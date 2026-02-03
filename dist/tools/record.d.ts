/**
 * buildlog_record_* tools - Recording session management
 */
import { RecordStartParams, RecordStepParams, RecordStopParams } from "../types";
export declare const recordStartToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const recordStepToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            metadata: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const recordStopToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            outcome: {
                type: string;
                enum: string[];
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleRecordStart(params: RecordStartParams): Promise<string>;
export declare function handleRecordStep(params: RecordStepParams): Promise<string>;
export declare function handleRecordStop(params: RecordStopParams): Promise<string>;
