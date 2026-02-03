/**
 * buildlog_upload tool - Upload a buildlog to buildlog.ai
 */
import { UploadParams } from "../types";
export declare const uploadToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            buildlog: {
                type: string;
                description: string;
            };
            public: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
};
export declare function handleUpload(params: UploadParams): Promise<string>;
