/**
 * HTTP client for buildlog.ai API
 */
import { BuildlogFile } from "@buildlogai/types";
import { SearchResponse, UploadResponse } from "../types";
/**
 * API client for buildlog.ai
 */
export declare class BuildlogApiClient {
    private apiKey?;
    constructor();
    /**
     * Get default headers for API requests
     */
    private getHeaders;
    /**
     * Search for buildlogs matching a query
     */
    search(params: {
        query: string;
        language?: string;
        framework?: string;
        limit?: number;
    }): Promise<SearchResponse>;
    /**
     * Get a specific buildlog by slug
     */
    get(slug: string): Promise<BuildlogFile>;
    /**
     * Upload a buildlog to buildlog.ai
     */
    upload(buildlog: BuildlogFile, isPublic?: boolean): Promise<UploadResponse>;
    /**
     * Extract slug from a URL or return as-is if already a slug
     */
    private extractSlug;
}
export declare const apiClient: BuildlogApiClient;
