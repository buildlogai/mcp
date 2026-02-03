"use strict";
/**
 * buildlog_follow tool - Return prompts from a buildlog formatted for execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.followToolDefinition = void 0;
exports.handleFollow = handleFollow;
const client_1 = require("../api/client");
exports.followToolDefinition = {
    name: "buildlog_follow",
    description: "Get prompts from a buildlog formatted for execution. Returns the prompts in order with context, " +
        "so you can follow the same workflow in your current project. Use this to replicate a proven workflow.",
    inputSchema: {
        type: "object",
        properties: {
            slug: {
                type: "string",
                description: "The buildlog slug or full URL",
            },
            step: {
                type: "number",
                description: "Start from a specific step number (1-indexed). Omit to get all prompts.",
            },
        },
        required: ["slug"],
    },
};
async function handleFollow(params) {
    try {
        const buildlog = await client_1.apiClient.get(params.slug);
        const prompts = [];
        const notes = [];
        // Filter steps starting from the specified step (if provided)
        const startIndex = params.step ? params.step - 1 : 0;
        const relevantSteps = buildlog.steps.slice(startIndex);
        for (let i = 0; i < relevantSteps.length; i++) {
            const step = relevantSteps[i];
            const stepNumber = startIndex + i + 1; // 1-indexed
            if (step.type === "prompt") {
                prompts.push({
                    step: stepNumber,
                    prompt: step.content,
                    context: step.context,
                    intent: step.intent,
                });
            }
            else if (step.type === "note") {
                notes.push({
                    step: stepNumber,
                    note: step.content,
                    category: step.category,
                });
            }
            else if (step.type === "action" && step.approach) {
                // Include approach notes as hints
                notes.push({
                    step: stepNumber,
                    note: `Approach: ${step.approach}`,
                    category: "decision",
                });
            }
        }
        if (prompts.length === 0) {
            return JSON.stringify({
                success: true,
                message: "No prompts found in this buildlog",
                title: buildlog.metadata.title,
                totalSteps: buildlog.steps.length,
                prompts: [],
                notes,
            });
        }
        const output = {
            title: buildlog.metadata.title,
            description: buildlog.metadata.description,
            totalSteps: buildlog.steps.length,
            prompts,
            notes,
            instructions: generateInstructions(buildlog.metadata, prompts.length),
        };
        return JSON.stringify({
            success: true,
            ...output,
            hint: "Execute each prompt in sequence, adapting file paths and names to your project structure.",
        });
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
function generateInstructions(metadata, promptCount) {
    const parts = [
        `Execute each of the ${promptCount} prompts in order, adapting to your current project context.`,
    ];
    if (metadata.language || metadata.framework) {
        const stack = [metadata.framework, metadata.language].filter(Boolean).join(" / ");
        parts.push(`This workflow was built with ${stack}.`);
    }
    if (!metadata.replicable) {
        parts.push("Note: The original author marked this as potentially difficult to replicate.");
    }
    parts.push("Adjust file paths, variable names, and implementation details as needed for your project.");
    return parts.join(" ");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rvb2xzL2ZvbGxvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQTBCSCxvQ0FxRUM7QUE3RkQsMENBQTBDO0FBRzdCLFFBQUEsb0JBQW9CLEdBQUc7SUFDbEMsSUFBSSxFQUFFLGlCQUFpQjtJQUN2QixXQUFXLEVBQ1Qsa0dBQWtHO1FBQ2xHLHVHQUF1RztJQUN6RyxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsUUFBaUI7UUFDdkIsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwrQkFBK0I7YUFDN0M7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHlFQUF5RTthQUN2RjtTQUNGO1FBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO0tBQ25CO0NBQ0YsQ0FBQztBQUVLLEtBQUssVUFBVSxZQUFZLENBQUMsTUFBb0I7SUFDckQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEQsTUFBTSxPQUFPLEdBQW1CLEVBQUUsQ0FBQztRQUNuQyxNQUFNLEtBQUssR0FBaUIsRUFBRSxDQUFDO1FBRS9CLDhEQUE4RDtRQUM5RCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXZELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMs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T0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xGLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDekIsS0FBSyxDQUFDLElBQUksQ0FBQyw4RUFBOEUsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLDJGQUEyRixDQUFDLENBQUM7SUFFeEcsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGJ1aWxkbG9nX2ZvbGxvdyB0b29sIC0gUmV0dXJuIHByb21wdHMgZnJvbSBhIGJ1aWxkbG9nIGZvcm1hdHRlZCBmb3IgZXhlY3V0aW9uXG4gKi9cblxuaW1wb3J0IHsgYXBpQ2xpZW50IH0gZnJvbSBcIi4uL2FwaS9jbGllbnRcIjtcbmltcG9ydCB7IEZvbGxvd1BhcmFtcywgRm9sbG93T3V0cHV0LCBGb2xsb3dQcm9tcHQsIEZvbGxvd05vdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IGZvbGxvd1Rvb2xEZWZpbml0aW9uID0ge1xuICBuYW1lOiBcImJ1aWxkbG9nX2ZvbGxvd1wiLFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIkdldCBwcm9tcHRzIGZyb20gYSBidWlsZGxvZyBmb3JtYXR0ZWQgZm9yIGV4ZWN1dGlvbi4gUmV0dXJucyB0aGUgcHJvbXB0cyBpbiBvcmRlciB3aXRoIGNvbnRleHQsIFwiICtcbiAgICBcInNvIHlvdSBjYW4gZm9sbG93IHRoZSBzYW1lIHdvcmtmbG93IGluIHlvdXIgY3VycmVudCBwcm9qZWN0LiBVc2UgdGhpcyB0byByZXBsaWNhdGUgYSBwcm92ZW4gd29ya2Zsb3cuXCIsXG4gIGlucHV0U2NoZW1hOiB7XG4gICAgdHlwZTogXCJvYmplY3RcIiBhcyBjb25zdCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBzbHVnOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBidWlsZGxvZyBzbHVnIG9yIGZ1bGwgVVJMXCIsXG4gICAgICB9LFxuICAgICAgc3RlcDoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTdGFydCBmcm9tIGEgc3BlY2lmaWMgc3RlcCBudW1iZXIgKDEtaW5kZXhlZCkuIE9taXQgdG8gZ2V0IGFsbCBwcm9tcHRzLlwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbXCJzbHVnXCJdLFxuICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUZvbGxvdyhwYXJhbXM6IEZvbGxvd1BhcmFtcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVpbGRsb2cgPSBhd2FpdCBhcGlDbGllbnQuZ2V0KHBhcmFtcy5zbHVnKTtcbiAgICBcbiAgICBjb25zdCBwcm9tcHRzOiBGb2xsb3dQcm9tcHRbXSA9IFtdO1xuICAgIGNvbnN0IG5vdGVzOiBGb2xsb3dOb3RlW10gPSBbXTtcbiAgICBcbiAgICAvLyBGaWx0ZXIgc3RlcHMgc3RhcnRpbmcgZnJvbSB0aGUgc3BlY2lmaWVkIHN0ZXAgKGlmIHByb3ZpZGVkKVxuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBwYXJhbXMuc3RlcCA/IHBhcmFtcy5zdGVwIC0gMSA6IDA7XG4gICAgY29uc3QgcmVsZXZhbnRTdGVwcyA9IGJ1aWxkbG9nLnN0ZXBzLnNsaWNlKHN0YXJ0SW5kZXgpO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVsZXZhbnRTdGVwcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3RlcCA9IHJlbGV2YW50U3RlcHNbaV07XG4gICAgICBjb25zdCBzdGVwTnVtYmVyID0gc3RhcnRJbmRleCArIGkgKyAxOyAvLyAxLWluZGV4ZWRcbiAgICAgIFxuICAgICAgaWYgKHN0ZXAudHlwZSA9PT0gXCJwcm9tcHRcIikge1xuICAgICAgICBwcm9tcHRzLnB1c2goe1xuICAgICAgICAgIHN0ZXA6IHN0ZXBOdW1iZXIsXG4gICAgICAgICAgcHJvbXB0OiBzdGVwLmNvbnRlbnQsXG4gICAgICAgICAgY29udGV4dDogc3RlcC5jb250ZXh0LFxuICAgICAgICAgIGludGVudDogc3RlcC5pbnRlbnQsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChzdGVwLnR5cGUgPT09IFwibm90ZVwiKSB7XG4gICAgICAgIG5vdGVzLnB1c2goe1xuICAgICAgICAgIHN0ZXA6IHN0ZXBOdW1iZXIsXG4gICAgICAgICAgbm90ZTogc3RlcC5jb250ZW50LFxuICAgICAgICAgIGNhdGVnb3J5OiBzdGVwLmNhdGVnb3J5LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoc3RlcC50eXBlID09PSBcImFjdGlvblwiICYmIHN0ZXAuYXBwcm9hY2gpIHtcbiAgICAgICAgLy8gSW5jbHVkZSBhcHByb2FjaCBub3RlcyBhcyBoaW50c1xuICAgICAgICBub3Rlcy5wdXNoKHtcbiAgICAgICAgICBzdGVwOiBzdGVwTnVtYmVyLFxuICAgICAgICAgIG5vdGU6IGBBcHByb2FjaDogJHtzdGVwLmFwcHJvYWNofWAsXG4gICAgICAgICAgY2F0ZWdvcnk6IFwiZGVjaXNpb25cIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByb21wdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcIk5vIHByb21wdHMgZm91bmQgaW4gdGhpcyBidWlsZGxvZ1wiLFxuICAgICAgICB0aXRsZTogYnVpbGRsb2cubWV0YWRhdGEudGl0bGUsXG4gICAgICAgIHRvdGFsU3RlcHM6IGJ1aWxkbG9nLnN0ZXBzLmxlbmd0aCxcbiAgICAgICAgcHJvbXB0czogW10sXG4gICAgICAgIG5vdGVzLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0cHV0OiBGb2xsb3dPdXRwdXQgPSB7XG4gICAgICB0aXRsZTogYnVpbGRsb2cubWV0YWRhdGEudGl0bGUsXG4gICAgICBkZXNjcmlwdGlvbjogYnVpbGRsb2cubWV0YWRhdGEuZGVzY3JpcHRpb24sXG4gICAgICB0b3RhbFN0ZXBzOiBidWlsZGxvZy5zdGVwcy5sZW5ndGgsXG4gICAgICBwcm9tcHRzLFxuICAgICAgbm90ZXMsXG4gICAgICBpbnN0cnVjdGlvbnM6IGdlbmVyYXRlSW5zdHJ1Y3Rpb25zKGJ1aWxkbG9nLm1ldGFkYXRhLCBwcm9tcHRzLmxlbmd0aCksXG4gICAgfTtcblxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgLi4ub3V0cHV0LFxuICAgICAgaGludDogXCJFeGVjdXRlIGVhY2ggcHJvbXB0IGluIHNlcXVlbmNlLCBhZGFwdGluZyBmaWxlIHBhdGhzIGFuZCBuYW1lcyB0byB5b3VyIHByb2plY3Qgc3RydWN0dXJlLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvciBvY2N1cnJlZFwiLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW5zdHJ1Y3Rpb25zKFxuICBtZXRhZGF0YTogeyBsYW5ndWFnZT86IHN0cmluZzsgZnJhbWV3b3JrPzogc3RyaW5nOyByZXBsaWNhYmxlOiBib29sZWFuIH0sXG4gIHByb21wdENvdW50OiBudW1iZXJcbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzID0gW1xuICAgIGBFeGVjdXRlIGVhY2ggb2YgdGhlICR7cHJvbXB0Q291bnR9IHByb21wdHMgaW4gb3JkZXIsIGFkYXB0aW5nIHRvIHlvdXIgY3VycmVudCBwcm9qZWN0IGNvbnRleHQuYCxcbiAgXTtcblxuICBpZiAobWV0YWRhdGEubGFuZ3VhZ2UgfHwgbWV0YWRhdGEuZnJhbWV3b3JrKSB7XG4gICAgY29uc3Qgc3RhY2sgPSBbbWV0YWRhdGEuZnJhbWV3b3JrLCBtZXRhZGF0YS5sYW5ndWFnZV0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIgLyBcIik7XG4gICAgcGFydHMucHVzaChgVGhpcyB3b3JrZmxvdyB3YXMgYnVpbHQgd2l0aCAke3N0YWNrfS5gKTtcbiAgfVxuXG4gIGlmICghbWV0YWRhdGEucmVwbGljYWJsZSkge1xuICAgIHBhcnRzLnB1c2goXCJOb3RlOiBUaGUgb3JpZ2luYWwgYXV0aG9yIG1hcmtlZCB0aGlzIGFzIHBvdGVudGlhbGx5IGRpZmZpY3VsdCB0byByZXBsaWNhdGUuXCIpO1xuICB9XG5cbiAgcGFydHMucHVzaChcIkFkanVzdCBmaWxlIHBhdGhzLCB2YXJpYWJsZSBuYW1lcywgYW5kIGltcGxlbWVudGF0aW9uIGRldGFpbHMgYXMgbmVlZGVkIGZvciB5b3VyIHByb2plY3QuXCIpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFwiKTtcbn1cbiJdfQ==