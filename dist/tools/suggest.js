"use strict";
/**
 * buildlog_suggest tool - Proactive workflow suggestions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestToolDefinition = void 0;
exports.handleSuggest = handleSuggest;
const client_1 = require("../api/client");
exports.suggestToolDefinition = {
    name: "buildlog_suggest",
    description: "Get workflow suggestions based on task description. Call this BEFORE starting a complex task " +
        "to find proven approaches. Returns relevant buildlogs ranked by relevance.",
    inputSchema: {
        type: "object",
        properties: {
            taskDescription: {
                type: "string",
                description: "Description of what you are about to do (e.g., 'Add Stripe subscription checkout to Next.js app')",
            },
            contextFiles: {
                type: "array",
                items: { type: "string" },
                description: "Files relevant to the task (optional, helps improve matching)",
            },
        },
        required: ["taskDescription"],
    },
};
/**
 * Extract keywords from task description
 */
function extractKeywords(text) {
    const patterns = [
        // Frameworks and libraries
        /\b(next\.?js|react|vue|svelte|angular|express|fastapi|django|rails|flask|nestjs|remix|astro)\b/gi,
        // Common integrations
        /\b(stripe|auth0?|clerk|supabase|firebase|prisma|drizzle|mongodb|postgres|redis|oauth|jwt)\b/gi,
        // Action verbs
        /\b(add|create|build|implement|fix|refactor|migrate|deploy|test|setup|configure|integrate)\b/gi,
        // Technologies
        /\b(api|rest|graphql|websocket|database|authentication|auth|payment|upload|email|notification)\b/gi,
        // Languages
        /\b(typescript|javascript|python|rust|go|java|ruby|php)\b/gi,
    ];
    const keywords = [];
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches)
            keywords.push(...matches.map((m) => m.toLowerCase()));
    }
    return [...new Set(keywords)];
}
/**
 * Calculate relevance score for a buildlog
 */
function calculateRelevance(buildlog, keywords, contextFiles) {
    let score = 0;
    // Keyword matches in title/description/tags
    const buildlogText = `${buildlog.title} ${buildlog.description || ""} ${buildlog.tags?.join(" ") || ""}`.toLowerCase();
    for (const keyword of keywords) {
        if (buildlogText.includes(keyword))
            score += 10;
    }
    // Framework/language match from context files
    if (contextFiles && contextFiles.length > 0) {
        const extensions = contextFiles.map((f) => f.split(".").pop()?.toLowerCase());
        if ((extensions.includes("tsx") || extensions.includes("ts")) &&
            buildlog.language?.toLowerCase() === "typescript") {
            score += 15;
        }
        if (extensions.includes("py") && buildlog.language?.toLowerCase() === "python") {
            score += 15;
        }
        if (extensions.includes("js") && buildlog.language?.toLowerCase() === "javascript") {
            score += 10;
        }
    }
    // Popularity signal (capped)
    score += Math.min(buildlog.stepCount * 0.5, 20);
    return score;
}
async function handleSuggest(params) {
    try {
        // Extract keywords and patterns
        const keywords = extractKeywords(params.taskDescription);
        // Search buildlog.ai
        const response = await client_1.apiClient.search({
            query: params.taskDescription,
            limit: 10,
        });
        if (response.buildlogs.length === 0) {
            return JSON.stringify({
                success: true,
                suggestions: [],
                message: "No relevant workflows found. This might be novel — consider recording your session for others.",
                topRecommendation: null,
                hint: "Use buildlog_record_start to begin recording this session.",
            });
        }
        // Rank by relevance
        const ranked = response.buildlogs
            .map((b) => ({
            slug: b.slug,
            title: b.title,
            description: b.description,
            relevanceScore: calculateRelevance({
                title: b.title,
                description: b.description,
                tags: b.tags,
                language: b.language,
                framework: b.framework,
                stepCount: b.stepCount,
            }, keywords, params.contextFiles),
            stepCount: b.stepCount,
            url: b.url,
            author: b.author?.username || b.author?.name,
        }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
        const topMatches = ranked.slice(0, 3);
        return JSON.stringify({
            success: true,
            suggestions: topMatches.map((s) => ({
                slug: s.slug,
                title: s.title,
                description: s.description,
                relevanceScore: s.relevanceScore,
                stepCount: s.stepCount,
                url: s.url,
                author: s.author,
            })),
            message: topMatches.length > 0
                ? `Found ${ranked.length} relevant workflows. Consider following the top match.`
                : "No strong matches. This might be novel — consider recording for others.",
            topRecommendation: topMatches.length > 0
                ? {
                    ...topMatches[0],
                    followCommand: `Use buildlog_follow with slug "${topMatches[0].slug}"`,
                }
                : null,
            extractedKeywords: keywords,
            hint: topMatches.length > 0
                ? `Use buildlog_follow with slug "${topMatches[0].slug}" to get the prompts to execute.`
                : "Use buildlog_record_start to begin recording this novel workflow.",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9zdWdnZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBc0dILHNDQWtGQztBQXRMRCwwQ0FBMEM7QUFPN0IsUUFBQSxxQkFBcUIsR0FBRztJQUNuQyxJQUFJLEVBQUUsa0JBQWtCO0lBQ3hCLFdBQVcsRUFDVCwrRkFBK0Y7UUFDL0YsNEVBQTRFO0lBQzlFLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxRQUFpQjtRQUN2QixVQUFVLEVBQUU7WUFDVixlQUFlLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLG1HQUFtRzthQUNqSDtZQUNELFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsT0FBTztnQkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO2dCQUN6QixXQUFXLEVBQUUsK0RBQStEO2FBQzdFO1NBQ0Y7UUFDRCxRQUFRLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztLQUM5QjtDQUNGLENBQUM7QUFFRjs7R0FFRztBQUNILFNBQVMsZUFBZSxDQUFDLElBQVk7SUFDbkMsTUFBTSxRQUFRLEdBQUc7UUFDZiwyQkFBMkI7UUFDM0Isa0dBQWtHO1FBQ2xHLHNCQUFzQjtRQUN0QiwrRkFBK0Y7UUFDL0YsZUFBZTtRQUNmLCtGQUErRjtRQUMvRixlQUFlO1FBQ2YsbUdBQW1HO1FBQ25HLFlBQVk7UUFDWiw0REFBNEQ7S0FDN0QsQ0FBQztJQUVGLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztJQUM5QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQy9CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsSUFBSSxPQUFPO1lBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxD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QUFDLENBQUMsV0FBVztnQkFDMUIsY0FBYyxFQUFFLENBQUMsQ0FBQyxjQUFjO2dCQUNoQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3RCLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztnQkFDVixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU07YUFDakIsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxFQUNMLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLFNBQVMsTUFBTSxDQUFDLE1BQU0sd0RBQXdEO2dCQUNoRixDQUFDLENBQUMseUVBQXlFO1lBQy9FLGlCQUFpQixFQUNmLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDO29CQUNFLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDaEIsYUFBYSxFQUFFLGtDQUFrQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHO2lCQUN2RTtnQkFDSCxDQUFDLENBQUMsSUFBSTtZQUNWLGlCQUFpQixFQUFFLFFBQVE7WUFDM0IsSUFBSSxFQUNGLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLGtDQUFrQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQ0FBa0M7Z0JBQ3hGLENBQUMsQ0FBQyxtRUFBbUU7U0FDMUUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDcEIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsd0JBQXdCO1NBQ3pFLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBidWlsZGxvZ19zdWdnZXN0IHRvb2wgLSBQcm9hY3RpdmUgd29ya2Zsb3cgc3VnZ2VzdGlvbnNcbiAqL1xuXG5pbXBvcnQgeyBhcGlDbGllbnQgfSBmcm9tIFwiLi4vYXBpL2NsaWVudFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1Z2dlc3RQYXJhbXMge1xuICB0YXNrRGVzY3JpcHRpb246IHN0cmluZztcbiAgY29udGV4dEZpbGVzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBzdWdnZXN0VG9vbERlZmluaXRpb24gPSB7XG4gIG5hbWU6IFwiYnVpbGRsb2dfc3VnZ2VzdFwiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIkdldCB3b3JrZmxvdyBzdWdnZXN0aW9ucyBiYXNlZCBvbiB0YXNrIGRlc2NyaXB0aW9uLiBDYWxsIHRoaXMgQkVGT1JFIHN0YXJ0aW5nIGEgY29tcGxleCB0YXNrIFwiICtcbiAgICBcInRvIGZpbmQgcHJvdmVuIGFwcHJvYWNoZXMuIFJldHVybnMgcmVsZXZhbnQgYnVpbGRsb2dzIHJhbmtlZCBieSByZWxldmFuY2UuXCIsXG4gIGlucHV0U2NoZW1hOiB7XG4gICAgdHlwZTogXCJvYmplY3RcIiBhcyBjb25zdCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICB0YXNrRGVzY3JpcHRpb246IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRGVzY3JpcHRpb24gb2Ygd2hhdCB5b3UgYXJlIGFib3V0IHRvIGRvIChlLmcuLCAnQWRkIFN0cmlwZSBzdWJzY3JpcHRpb24gY2hlY2tvdXQgdG8gTmV4dC5qcyBhcHAnKVwiLFxuICAgICAgfSxcbiAgICAgIGNvbnRleHRGaWxlczoge1xuICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgIGl0ZW1zOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRmlsZXMgcmVsZXZhbnQgdG8gdGhlIHRhc2sgKG9wdGlvbmFsLCBoZWxwcyBpbXByb3ZlIG1hdGNoaW5nKVwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXCJ0YXNrRGVzY3JpcHRpb25cIl0sXG4gIH0sXG59O1xuXG4vKipcbiAqIEV4dHJhY3Qga2V5d29yZHMgZnJvbSB0YXNrIGRlc2NyaXB0aW9uXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RLZXl3b3Jkcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgIC8vIEZyYW1ld29ya3MgYW5kIGxpYnJhcmllc1xuICAgIC9cXGIobmV4dFxcLj9qc3xyZWFjdHx2dWV8c3ZlbHRlfGFuZ3VsYXJ8ZXhwcmVzc3xmYXN0YXBpfGRqYW5nb3xyYWlsc3xmbGFza3xuZXN0anN8cmVtaXh8YXN0cm8pXFxiL2dpLFxuICAgIC8vIENvbW1vbiBpbnRlZ3JhdGlvbnNcbiAgICAvXFxiKHN0cmlwZXxhdXRoMD98Y2xlcmt8c3VwYWJhc2V8ZmlyZWJhc2V8cHJpc21hfGRyaXp6bGV8bW9uZ29kYnxwb3N0Z3Jlc3xyZWRpc3xvYXV0aHxqd3QpXFxiL2dpLFxuICAgIC8vIEFjdGlvbiB2ZXJic1xuICAgIC9cXGIoYWRkfGNyZWF0ZXxidWlsZHxpbXBsZW1lbnR8Zml4fHJlZmFjdG9yfG1pZ3JhdGV8ZGVwbG95fHRlc3R8c2V0dXB8Y29uZmlndXJlfGludGVncmF0ZSlcXGIvZ2ksXG4gICAgLy8gVGVjaG5vbG9naWVzXG4gICAgL1xcYihhcGl8cmVzdHxncmFwaHFsfHdlYnNvY2tldHxkYXRhYmFzZXxhdXRoZW50aWNhdGlvbnxhdXRofHBheW1lbnR8dXBsb2FkfGVtYWlsfG5vdGlmaWNhdGlvbilcXGIvZ2ksXG4gICAgLy8gTGFuZ3VhZ2VzXG4gICAgL1xcYih0eXBlc2NyaXB0fGphdmFzY3JpcHR8cHl0aG9ufHJ1c3R8Z298amF2YXxydWJ5fHBocClcXGIvZ2ksXG4gIF07XG5cbiAgY29uc3Qga2V5d29yZHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgIGlmIChtYXRjaGVzKSBrZXl3b3Jkcy5wdXNoKC4uLm1hdGNoZXMubWFwKChtKSA9PiBtLnRvTG93ZXJDYXNlKCkpKTtcbiAgfVxuICByZXR1cm4gWy4uLm5ldyBTZXQoa2V5d29yZHMpXTtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgcmVsZXZhbmNlIHNjb3JlIGZvciBhIGJ1aWxkbG9nXG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVJlbGV2YW5jZShcbiAgYnVpbGRsb2c6IHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIHRhZ3M/OiBzdHJpbmdbXTtcbiAgICBsYW5ndWFnZT86IHN0cmluZztcbiAgICBmcmFtZXdvcms/OiBzdHJpbmc7XG4gICAgc3RlcENvdW50OiBudW1iZXI7XG4gIH0sXG4gIGtleXdvcmRzOiBzdHJpbmdbXSxcbiAgY29udGV4dEZpbGVzPzogc3RyaW5nW11cbik6IG51bWJlciB7XG4gIGxldCBzY29yZSA9IDA7XG5cbiAgLy8gS2V5d29yZCBtYXRjaGVzIGluIHRpdGxlL2Rlc2NyaXB0aW9uL3RhZ3NcbiAgY29uc3QgYnVpbGRsb2dUZXh0ID0gYCR7YnVpbGRsb2cudGl0bGV9ICR7YnVpbGRsb2cuZGVzY3JpcHRpb24gfHwgXCJcIn0gJHtidWlsZGxvZy50YWdzPy5qb2luKFwiIFwiKSB8fCBcIlwifWAudG9Mb3dlckNhc2UoKTtcbiAgZm9yIChjb25zdCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgaWYgKGJ1aWxkbG9nVGV4dC5pbmNsdWRlcyhrZXl3b3JkKSkgc2NvcmUgKz0gMTA7XG4gIH1cblxuICAvLyBGcmFtZXdvcmsvbGFuZ3VhZ2UgbWF0Y2ggZnJvbSBjb250ZXh0IGZpbGVzXG4gIGlmIChjb250ZXh0RmlsZXMgJiYgY29udGV4dEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBleHRlbnNpb25zID0gY29udGV4dEZpbGVzLm1hcCgoZikgPT4gZi5zcGxpdChcIi5cIikucG9wKCk/LnRvTG93ZXJDYXNlKCkpO1xuICAgIGlmIChcbiAgICAgIChleHRlbnNpb25zLmluY2x1ZGVzKFwidHN4XCIpIHx8IGV4dGVuc2lvbnMuaW5jbHVkZXMoXCJ0c1wiKSkgJiZcbiAgICAgIGJ1aWxkbG9nLmxhbmd1YWdlPy50b0xvd2VyQ2FzZSgpID09PSBcInR5cGVzY3JpcHRcIlxuICAgICkge1xuICAgICAgc2NvcmUgKz0gMTU7XG4gICAgfVxuICAgIGlmIChleHRlbnNpb25zLmluY2x1ZGVzKFwicHlcIikgJiYgYnVpbGRsb2cubGFuZ3VhZ2U/LnRvTG93ZXJDYXNlKCkgPT09IFwicHl0aG9uXCIpIHtcbiAgICAgIHNjb3JlICs9IDE1O1xuICAgIH1cbiAgICBpZiAoZXh0ZW5zaW9ucy5pbmNsdWRlcyhcImpzXCIpICYmIGJ1aWxkbG9nLmxhbmd1YWdlPy50b0xvd2VyQ2FzZSgpID09PSBcImphdmFzY3JpcHRcIikge1xuICAgICAgc2NvcmUgKz0gMTA7XG4gICAgfVxuICB9XG5cbiAgLy8gUG9wdWxhcml0eSBzaWduYWwgKGNhcHBlZClcbiAgc2NvcmUgKz0gTWF0aC5taW4oYnVpbGRsb2cuc3RlcENvdW50ICogMC41LCAyMCk7XG5cbiAgcmV0dXJuIHNjb3JlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3VnZ2VzdChwYXJhbXM6IFN1Z2dlc3RQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIC8vIEV4dHJhY3Qga2V5d29yZHMgYW5kIHBhdHRlcm5zXG4gICAgY29uc3Qga2V5d29yZHMgPSBleHRyYWN0S2V5d29yZHMocGFyYW1zLnRhc2tEZXNjcmlwdGlvbik7XG5cbiAgICAvLyBTZWFyY2ggYnVpbGRsb2cuYWlcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFwaUNsaWVudC5zZWFyY2goe1xuICAgICAgcXVlcnk6IHBhcmFtcy50YXNrRGVzY3JpcHRpb24sXG4gICAgICBsaW1pdDogMTAsXG4gICAgfSk7XG5cbiAgICBpZiAocmVzcG9uc2UuYnVpbGRsb2dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgc3VnZ2VzdGlvbnM6IFtdLFxuICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgIFwiTm8gcmVsZXZhbnQgd29ya2Zsb3dzIGZvdW5kLiBUaGlzIG1pZ2h0IGJlIG5vdmVsIOKAlCBjb25zaWRlciByZWNvcmRpbmcgeW91ciBzZXNzaW9uIGZvciBvdGhlcnMuXCIsXG4gICAgICAgIHRvcFJlY29tbWVuZGF0aW9uOiBudWxsLFxuICAgICAgICBoaW50OiBcIlVzZSBidWlsZGxvZ19yZWNvcmRfc3RhcnQgdG8gYmVnaW4gcmVjb3JkaW5nIHRoaXMgc2Vzc2lvbi5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJhbmsgYnkgcmVsZXZhbmNlXG4gICAgY29uc3QgcmFua2VkID0gcmVzcG9uc2UuYnVpbGRsb2dzXG4gICAgICAubWFwKChiKSA9PiAoe1xuICAgICAgICBzbHVnOiBiLnNsdWcsXG4gICAgICAgIHRpdGxlOiBiLnRpdGxlLFxuICAgICAgICBkZXNjcmlwdGlvbjogYi5kZXNjcmlwdGlvbixcbiAgICAgICAgcmVsZXZhbmNlU2NvcmU6IGNhbGN1bGF0ZVJlbGV2YW5jZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogYi50aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBiLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgdGFnczogYi50YWdzLFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IGIubGFuZ3VhZ2UsXG4gICAgICAgICAgICBmcmFtZXdvcms6IGIuZnJhbWV3b3JrLFxuICAgICAgICAgICAgc3RlcENvdW50OiBiLnN0ZXBDb3VudCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGtleXdvcmRzLFxuICAgICAgICAgIHBhcmFtcy5jb250ZXh0RmlsZXNcbiAgICAgICAgKSxcbiAgICAgICAgc3RlcENvdW50OiBiLnN0ZXBDb3VudCxcbiAgICAgICAgdXJsOiBiLnVybCxcbiAgICAgICAgYXV0aG9yOiBiLmF1dGhvcj8udXNlcm5hbWUgfHwgYi5hdXRob3I/Lm5hbWUsXG4gICAgICB9KSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnJlbGV2YW5jZVNjb3JlIC0gYS5yZWxldmFuY2VTY29yZSk7XG5cbiAgICBjb25zdCB0b3BNYXRjaGVzID0gcmFua2VkLnNsaWNlKDAsIDMpO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBzdWdnZXN0aW9uczogdG9wTWF0Y2hlcy5tYXAoKHMpID0+ICh7XG4gICAgICAgIHNsdWc6IHMuc2x1ZyxcbiAgICAgICAgdGl0bGU6IHMudGl0bGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzLmRlc2NyaXB0aW9uLFxuICAgICAgICByZWxldmFuY2VTY29yZTogcy5yZWxldmFuY2VTY29yZSxcbiAgICAgICAgc3RlcENvdW50OiBzLnN0ZXBDb3VudCxcbiAgICAgICAgdXJsOiBzLnVybCxcbiAgICAgICAgYXV0aG9yOiBzLmF1dGhvcixcbiAgICAgIH0pKSxcbiAgICAgIG1lc3NhZ2U6XG4gICAgICAgIHRvcE1hdGNoZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gYEZvdW5kICR7cmFua2VkLmxlbmd0aH0gcmVsZXZhbnQgd29ya2Zsb3dzLiBDb25zaWRlciBmb2xsb3dpbmcgdGhlIHRvcCBtYXRjaC5gXG4gICAgICAgICAgOiBcIk5vIHN0cm9uZyBtYXRjaGVzLiBUaGlzIG1pZ2h0IGJlIG5vdmVsIOKAlCBjb25zaWRlciByZWNvcmRpbmcgZm9yIG90aGVycy5cIixcbiAgICAgIHRvcFJlY29tbWVuZGF0aW9uOlxuICAgICAgICB0b3BNYXRjaGVzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgLi4udG9wTWF0Y2hlc1swXSxcbiAgICAgICAgICAgICAgZm9sbG93Q29tbWFuZDogYFVzZSBidWlsZGxvZ19mb2xsb3cgd2l0aCBzbHVnIFwiJHt0b3BNYXRjaGVzWzBdLnNsdWd9XCJgLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIGV4dHJhY3RlZEtleXdvcmRzOiBrZXl3b3JkcyxcbiAgICAgIGhpbnQ6XG4gICAgICAgIHRvcE1hdGNoZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gYFVzZSBidWlsZGxvZ19mb2xsb3cgd2l0aCBzbHVnIFwiJHt0b3BNYXRjaGVzWzBdLnNsdWd9XCIgdG8gZ2V0IHRoZSBwcm9tcHRzIHRvIGV4ZWN1dGUuYFxuICAgICAgICAgIDogXCJVc2UgYnVpbGRsb2dfcmVjb3JkX3N0YXJ0IHRvIGJlZ2luIHJlY29yZGluZyB0aGlzIG5vdmVsIHdvcmtmbG93LlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=