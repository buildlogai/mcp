"use strict";
/**
 * buildlog_search tool - Search buildlog.ai for relevant workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchToolDefinition = void 0;
exports.handleSearch = handleSearch;
const client_1 = require("../api/client");
exports.searchToolDefinition = {
    name: "buildlog_search",
    description: "Search buildlog.ai for relevant AI coding workflows. Returns buildlogs matching your query that you can follow or use as reference.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query (e.g., 'stripe nextjs integration', 'auth with clerk')",
            },
            language: {
                type: "string",
                description: "Filter by programming language (e.g., 'typescript', 'python')",
            },
            framework: {
                type: "string",
                description: "Filter by framework (e.g., 'nextjs', 'react', 'express')",
            },
            limit: {
                type: "number",
                description: "Maximum number of results to return (default: 10)",
                default: 10,
            },
        },
        required: ["query"],
    },
};
async function handleSearch(params) {
    try {
        const response = await client_1.apiClient.search({
            query: params.query,
            language: params.language,
            framework: params.framework,
            limit: params.limit || 10,
        });
        if (response.buildlogs.length === 0) {
            return JSON.stringify({
                success: true,
                message: `No buildlogs found for "${params.query}"`,
                results: [],
                total: 0,
            });
        }
        const results = response.buildlogs.map((b) => ({
            slug: b.slug,
            title: b.title,
            description: b.description,
            author: b.author?.username || b.author?.name,
            language: b.language,
            framework: b.framework,
            tags: b.tags,
            stepCount: b.stepCount,
            url: b.url,
        }));
        return JSON.stringify({
            success: true,
            message: `Found ${response.total} buildlogs`,
            results,
            total: response.total,
            hasMore: response.hasMore,
            hint: "Use buildlog_get or buildlog_follow with the slug to retrieve a specific buildlog",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL3NlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQWtDSCxvQ0E0Q0M7QUE1RUQsMENBQTBDO0FBRzdCLFFBQUEsb0JBQW9CLEdBQUc7SUFDbEMsSUFBSSxFQUFFLGlCQUFpQjtJQUN2QixXQUFXLEVBQ1QscUlBQXFJO0lBQ3ZJLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxRQUFpQjtRQUN2QixVQUFVLEVBQUU7WUFDVixLQUFLLEVBQUU7Z0JBQ0wsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHFFQUFxRTthQUNuRjtZQUNELFFBQVEsRUFBRTtnQkFDUixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsK0RBQStEO2FBQzdFO1lBQ0QsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwwREFBMEQ7YUFDeEU7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLG1EQUFtRDtnQkFDaEUsT0FBTyxFQUFFLEVBQUU7YUFDWjtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3BCO0NBQ0YsQ0FBQztBQUVLLEtBQUssVUFBVSxZQUFZLENBQUMsTUFBb0I7SUFDckQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxrQkFBUyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbkIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO1NBQzFCLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNwQixPQUFPLEVBQUUsSUFBSTtnQkFDYixPQUFPLEVBQUUsMkJBQTJCLE1BQU0sQ0FBQyxLQUFLLEdBQUc7Z0JBQ25ELE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxDQUFDO2FBQ1QsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNaLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztZQUNkLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVztZQUMxQixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJO1lBQzVDLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUTtZQUNwQixTQUFTLEVBQUUsQ0FBQyxDQUFDLFNBQVM7WUFDdEIsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO1lBQ1osU0FBUyxFQUFFLENBQUMsQ0FBQyxTQUFTO1lBQ3RCLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztTQUNYLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLFNBQVMsUUFBUSxDQUFDLEtBQUssWUFBWTtZQUM1QyxPQUFPO1lBQ1AsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1lBQ3JCLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztZQUN6QixJQUFJLEVBQUUsbUZBQW1GO1NBQzFGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtTQUN6RSxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogYnVpbGRsb2dfc2VhcmNoIHRvb2wgLSBTZWFyY2ggYnVpbGRsb2cuYWkgZm9yIHJlbGV2YW50IHdvcmtmbG93c1xuICovXG5cbmltcG9ydCB7IGFwaUNsaWVudCB9IGZyb20gXCIuLi9hcGkvY2xpZW50XCI7XG5pbXBvcnQgeyBTZWFyY2hQYXJhbXMgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IHNlYXJjaFRvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX3NlYXJjaFwiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIlNlYXJjaCBidWlsZGxvZy5haSBmb3IgcmVsZXZhbnQgQUkgY29kaW5nIHdvcmtmbG93cy4gUmV0dXJucyBidWlsZGxvZ3MgbWF0Y2hpbmcgeW91ciBxdWVyeSB0aGF0IHlvdSBjYW4gZm9sbG93IG9yIHVzZSBhcyByZWZlcmVuY2UuXCIsXG4gIGlucHV0U2NoZW1hOiB7XG4gICAgdHlwZTogXCJvYmplY3RcIiBhcyBjb25zdCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBxdWVyeToge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTZWFyY2ggcXVlcnkgKGUuZy4sICdzdHJpcGUgbmV4dGpzIGludGVncmF0aW9uJywgJ2F1dGggd2l0aCBjbGVyaycpXCIsXG4gICAgICB9LFxuICAgICAgbGFuZ3VhZ2U6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IHByb2dyYW1taW5nIGxhbmd1YWdlIChlLmcuLCAndHlwZXNjcmlwdCcsICdweXRob24nKVwiLFxuICAgICAgfSxcbiAgICAgIGZyYW1ld29yazoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJGaWx0ZXIgYnkgZnJhbWV3b3JrIChlLmcuLCAnbmV4dGpzJywgJ3JlYWN0JywgJ2V4cHJlc3MnKVwiLFxuICAgICAgfSxcbiAgICAgIGxpbWl0OiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIk1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuIChkZWZhdWx0OiAxMClcIixcbiAgICAgICAgZGVmYXVsdDogMTAsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcmVxdWlyZWQ6IFtcInF1ZXJ5XCJdLFxuICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNlYXJjaChwYXJhbXM6IFNlYXJjaFBhcmFtcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGlDbGllbnQuc2VhcmNoKHtcbiAgICAgIHF1ZXJ5OiBwYXJhbXMucXVlcnksXG4gICAgICBsYW5ndWFnZTogcGFyYW1zLmxhbmd1YWdlLFxuICAgICAgZnJhbWV3b3JrOiBwYXJhbXMuZnJhbWV3b3JrLFxuICAgICAgbGltaXQ6IHBhcmFtcy5saW1pdCB8fCAxMCxcbiAgICB9KTtcblxuICAgIGlmIChyZXNwb25zZS5idWlsZGxvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBgTm8gYnVpbGRsb2dzIGZvdW5kIGZvciBcIiR7cGFyYW1zLnF1ZXJ5fVwiYCxcbiAgICAgICAgcmVzdWx0czogW10sXG4gICAgICAgIHRvdGFsOiAwLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IHJlc3BvbnNlLmJ1aWxkbG9ncy5tYXAoKGIpID0+ICh7XG4gICAgICBzbHVnOiBiLnNsdWcsXG4gICAgICB0aXRsZTogYi50aXRsZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBiLmRlc2NyaXB0aW9uLFxuICAgICAgYXV0aG9yOiBiLmF1dGhvcj8udXNlcm5hbWUgfHwgYi5hdXRob3I/Lm5hbWUsXG4gICAgICBsYW5ndWFnZTogYi5sYW5ndWFnZSxcbiAgICAgIGZyYW1ld29yazogYi5mcmFtZXdvcmssXG4gICAgICB0YWdzOiBiLnRhZ3MsXG4gICAgICBzdGVwQ291bnQ6IGIuc3RlcENvdW50LFxuICAgICAgdXJsOiBiLnVybCxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IGBGb3VuZCAke3Jlc3BvbnNlLnRvdGFsfSBidWlsZGxvZ3NgLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIHRvdGFsOiByZXNwb25zZS50b3RhbCxcbiAgICAgIGhhc01vcmU6IHJlc3BvbnNlLmhhc01vcmUsXG4gICAgICBoaW50OiBcIlVzZSBidWlsZGxvZ19nZXQgb3IgYnVpbGRsb2dfZm9sbG93IHdpdGggdGhlIHNsdWcgdG8gcmV0cmlldmUgYSBzcGVjaWZpYyBidWlsZGxvZ1wiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=