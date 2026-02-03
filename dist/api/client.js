"use strict";
/**
 * HTTP client for buildlog.ai API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.BuildlogApiClient = void 0;
const BASE_URL = process.env.BUILDLOG_API_URL || "https://buildlog.ai/api";
/**
 * API client for buildlog.ai
 */
class BuildlogApiClient {
    apiKey;
    constructor() {
        this.apiKey = process.env.BUILDLOG_API_KEY;
    }
    /**
     * Get default headers for API requests
     */
    getHeaders() {
        const headers = {
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
    async search(params) {
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
            return await response.json();
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search buildlogs: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Get a specific buildlog by slug
     */
    async get(slug) {
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
            return await response.json();
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get buildlog: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Upload a buildlog to buildlog.ai
     */
    async upload(buildlog, isPublic = true) {
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
            return await response.json();
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to upload buildlog: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Extract slug from a URL or return as-is if already a slug
     */
    extractSlug(input) {
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
exports.BuildlogApiClient = BuildlogApiClient;
// Singleton instance
exports.apiClient = new BuildlogApiClient();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwaS9jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFLSCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLHlCQUF5QixDQUFDO0FBRTNFOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFDcEIsTUFBTSxDQUFVO0lBRXhCO1FBQ0UsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO0lBQzdDLENBQUM7SUFFRDs7T0FFRztJQUNLLFVBQVU7UUFDaEIsTUFBTSxPQUFPLEdBQTJCO1lBQ3RDLGNBQWMsRUFBRSxrQkFBa0I7WUFDbEMsWUFBWSxFQUFFLG9CQUFvQjtTQUNuQyxDQUFDO1FBRUYsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLFVBQVUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JELENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLE1BS1o7UUFDQyxNQUFNLFlBQVksR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQzNDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQixZQUFZLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JCLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakIsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxHQUFHLFFBQVEscUJBQXFCLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBRXRFLElBQUksQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDaEMsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUU7YUFDM0IsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUVELE9BQU8sTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFvQixDQUFDO1FBQ2pELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQVk7UUFDcEIsZ0NBQWdDO1FBQ2hDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxRQUFRLGNBQWMsY0FBYyxFQUFFLENBQUM7UUFFdEQsSUFBSSxDQUFDO1lBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNoQyxNQUFNLEVBQUUsS0FBSztnQkFDYixPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRTthQUMzQixDQUFDLENBQUM7WUFFSCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxRQUFRLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFFRCxPQUFPLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBa0IsQ0FBQztRQUMvQyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLElBQUksS0FBSyxZQUFZLEtBQUssRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsTUFBTSxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFzQixFQUFFLFdBQW9CLElBQUk7UUFDM0QsTUFBTSxHQUFHLEdBQUcsR0FBRyxRQUFRLG1CQUFtQixDQUFDO1FBRTNDLElBQUksQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDaEMsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQzFCLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQixRQUFRO29CQUNSLE1BQU0sRUFBRSxRQUFRO2lCQUNqQixDQUFDO2FBQ0gsQ0FBQyxDQUFDO1lBRUgsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHFFQUFxRSxDQUFDLENBQUM7WUFDekYsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixRQUFRLENBQUMsTUFBTSxNQUFNLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDdEUsQ0FBQztZQUVELE9BQU8sTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFvQixDQUFDO1FBQ2pELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxXQUFXLENBQUMsS0FBYTtRQUMvQixxREFBcUQ7UUFDckQsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ25ELElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNILENBQUM7UUFFRCxvQ0FBb0M7UUFDcEMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQzNELElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNILENBQUM7UUFFRCxpQkFBaUI7UUFDakIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUExSkQsOENBMEpDO0FBRUQscUJBQXFCO0FBQ1IsUUFBQSxTQUFTLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIVFRQIGNsaWVudCBmb3IgYnVpbGRsb2cuYWkgQVBJXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRsb2dGaWxlIH0gZnJvbSBcIkBidWlsZGxvZ2FpL3R5cGVzXCI7XG5pbXBvcnQgeyBTZWFyY2hSZXNwb25zZSwgQnVpbGRsb2dTZWFyY2hSZXN1bHQsIFVwbG9hZFJlc3BvbnNlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNvbnN0IEJBU0VfVVJMID0gcHJvY2Vzcy5lbnYuQlVJTERMT0dfQVBJX1VSTCB8fCBcImh0dHBzOi8vYnVpbGRsb2cuYWkvYXBpXCI7XG5cbi8qKlxuICogQVBJIGNsaWVudCBmb3IgYnVpbGRsb2cuYWlcbiAqL1xuZXhwb3J0IGNsYXNzIEJ1aWxkbG9nQXBpQ2xpZW50IHtcbiAgcHJpdmF0ZSBhcGlLZXk/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5hcGlLZXkgPSBwcm9jZXNzLmVudi5CVUlMRExPR19BUElfS0VZO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBkZWZhdWx0IGhlYWRlcnMgZm9yIEFQSSByZXF1ZXN0c1xuICAgKi9cbiAgcHJpdmF0ZSBnZXRIZWFkZXJzKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiVXNlci1BZ2VudFwiOiBcImJ1aWxkbG9nLW1jcC8xLjAuMFwiLFxuICAgIH07XG5cbiAgICBpZiAodGhpcy5hcGlLZXkpIHtcbiAgICAgIGhlYWRlcnNbXCJBdXRob3JpemF0aW9uXCJdID0gYEJlYXJlciAke3RoaXMuYXBpS2V5fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIGZvciBidWlsZGxvZ3MgbWF0Y2hpbmcgYSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgc2VhcmNoKHBhcmFtczoge1xuICAgIHF1ZXJ5OiBzdHJpbmc7XG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gICAgZnJhbWV3b3JrPzogc3RyaW5nO1xuICAgIGxpbWl0PzogbnVtYmVyO1xuICB9KTogUHJvbWlzZTxTZWFyY2hSZXNwb25zZT4ge1xuICAgIGNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKTtcbiAgICBzZWFyY2hQYXJhbXMuc2V0KFwicVwiLCBwYXJhbXMucXVlcnkpO1xuICAgIFxuICAgIGlmIChwYXJhbXMubGFuZ3VhZ2UpIHtcbiAgICAgIHNlYXJjaFBhcmFtcy5zZXQoXCJsYW5ndWFnZVwiLCBwYXJhbXMubGFuZ3VhZ2UpO1xuICAgIH1cbiAgICBpZiAocGFyYW1zLmZyYW1ld29yaykge1xuICAgICAgc2VhcmNoUGFyYW1zLnNldChcImZyYW1ld29ya1wiLCBwYXJhbXMuZnJhbWV3b3JrKTtcbiAgICB9XG4gICAgaWYgKHBhcmFtcy5saW1pdCkge1xuICAgICAgc2VhcmNoUGFyYW1zLnNldChcImxpbWl0XCIsIHBhcmFtcy5saW1pdC50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBgJHtCQVNFX1VSTH0vYnVpbGRsb2dzL3NlYXJjaD8ke3NlYXJjaFBhcmFtcy50b1N0cmluZygpfWA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICBoZWFkZXJzOiB0aGlzLmdldEhlYWRlcnMoKSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIFNlYXJjaFJlc3BvbnNlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBzZWFyY2ggYnVpbGRsb2dzOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc3BlY2lmaWMgYnVpbGRsb2cgYnkgc2x1Z1xuICAgKi9cbiAgYXN5bmMgZ2V0KHNsdWc6IHN0cmluZyk6IFByb21pc2U8QnVpbGRsb2dGaWxlPiB7XG4gICAgLy8gSGFuZGxlIGJvdGggc2x1ZyBhbmQgZnVsbCBVUkxcbiAgICBjb25zdCBub3JtYWxpemVkU2x1ZyA9IHRoaXMuZXh0cmFjdFNsdWcoc2x1Zyk7XG4gICAgY29uc3QgdXJsID0gYCR7QkFTRV9VUkx9L2J1aWxkbG9ncy8ke25vcm1hbGl6ZWRTbHVnfWA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICBoZWFkZXJzOiB0aGlzLmdldEhlYWRlcnMoKSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCdWlsZGxvZyBub3QgZm91bmQ6ICR7bm9ybWFsaXplZFNsdWd9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBUEkgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgQnVpbGRsb2dGaWxlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBnZXQgYnVpbGRsb2c6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWQgYSBidWlsZGxvZyB0byBidWlsZGxvZy5haVxuICAgKi9cbiAgYXN5bmMgdXBsb2FkKGJ1aWxkbG9nOiBCdWlsZGxvZ0ZpbGUsIGlzUHVibGljOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8VXBsb2FkUmVzcG9uc2U+IHtcbiAgICBjb25zdCB1cmwgPSBgJHtCQVNFX1VSTH0vYnVpbGRsb2dzL3VwbG9hZGA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczogdGhpcy5nZXRIZWFkZXJzKCksXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBidWlsZGxvZyxcbiAgICAgICAgICBwdWJsaWM6IGlzUHVibGljLFxuICAgICAgICB9KSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXV0aGVudGljYXRpb24gcmVxdWlyZWQuIFNldCBCVUlMRExPR19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlLlwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvckJvZHkgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVXBsb2FkIGZhaWxlZDogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvckJvZHl9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgVXBsb2FkUmVzcG9uc2U7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHVwbG9hZCBidWlsZGxvZzogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3Qgc2x1ZyBmcm9tIGEgVVJMIG9yIHJldHVybiBhcy1pcyBpZiBhbHJlYWR5IGEgc2x1Z1xuICAgKi9cbiAgcHJpdmF0ZSBleHRyYWN0U2x1ZyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyBIYW5kbGUgZnVsbCBVUkxzIGxpa2UgaHR0cHM6Ly9idWlsZGxvZy5haS9iL2FiYzEyM1xuICAgIGlmIChpbnB1dC5pbmNsdWRlcyhcImJ1aWxkbG9nLmFpXCIpKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IGlucHV0Lm1hdGNoKC9cXC9iXFwvKFthLXpBLVowLTlfLV0rKS8pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBtYXRjaFsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gSGFuZGxlIFVSTHMgd2l0aCAvYnVpbGRsb2dzLyBwYXRoXG4gICAgaWYgKGlucHV0LmluY2x1ZGVzKFwiL2J1aWxkbG9ncy9cIikpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gaW5wdXQubWF0Y2goL1xcL2J1aWxkbG9nc1xcLyhbYS16QS1aMC05Xy1dKykvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hbMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWxyZWFkeSBhIHNsdWdcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cbn1cblxuLy8gU2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgYXBpQ2xpZW50ID0gbmV3IEJ1aWxkbG9nQXBpQ2xpZW50KCk7XG4iXX0=