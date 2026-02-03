/**
 * HTTP client for buildlog.ai API
 */

import { BuildlogFile } from "@buildlogai/types";
import { SearchResponse, BuildlogSearchResult, UploadResponse } from "../types";

const BASE_URL = process.env.BUILDLOG_API_URL || "https://buildlog.ai/api";

/**
 * API client for buildlog.ai
 */
export class BuildlogApiClient {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.BUILDLOG_API_KEY;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "buildlog-mcp/1.0.0",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Search for buildlogs matching a query
   */
  async search(params: {
    query: string;
    language?: string;
    framework?: string;
    limit?: number;
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("q", params.query);
    
    if (params.language) {
      searchParams.set("language", params.language);
    }
    if (params.framework) {
      searchParams.set("framework", params.framework);
    }
    if (params.limit) {
      searchParams.set("limit", params.limit.toString());
    }

    const url = `${BASE_URL}/buildlogs/search?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as SearchResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search buildlogs: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get a specific buildlog by slug
   */
  async get(slug: string): Promise<BuildlogFile> {
    // Handle both slug and full URL
    const normalizedSlug = this.extractSlug(slug);
    const url = `${BASE_URL}/buildlogs/${normalizedSlug}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        throw new Error(`Buildlog not found: ${normalizedSlug}`);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as BuildlogFile;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get buildlog: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Upload a buildlog to buildlog.ai
   */
  async upload(buildlog: BuildlogFile, isPublic: boolean = true): Promise<UploadResponse> {
    const url = `${BASE_URL}/buildlogs/upload`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          buildlog,
          public: isPublic,
        }),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Set BUILDLOG_API_KEY environment variable.");
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorBody}`);
      }

      return await response.json() as UploadResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload buildlog: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract slug from a URL or return as-is if already a slug
   */
  private extractSlug(input: string): string {
    // Handle full URLs like https://buildlog.ai/b/abc123
    if (input.includes("buildlog.ai")) {
      const match = input.match(/\/b\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Handle URLs with /buildlogs/ path
    if (input.includes("/buildlogs/")) {
      const match = input.match(/\/buildlogs\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return match[1];
      }
    }

    // Already a slug
    return input;
  }
}

// Singleton instance
export const apiClient = new BuildlogApiClient();
