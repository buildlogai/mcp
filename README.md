# @buildlogai/mcp

MCP server for Buildlog - search, follow, and record AI coding workflows.

This server gives AI agents direct access to the buildlog ecosystem, enabling them to:
- **Search** for relevant workflows before starting a task
- **Follow** proven buildlog recipes in their current context
- **Record** their own sessions as they work
- **Upload** completed buildlogs for others to learn from

## Installation

```bash
npm install -g @buildlogai/mcp
```

## Configuration

Set your API key for uploads (optional for search/follow, required for upload):

```bash
export BUILDLOG_API_KEY=your-api-key
```

## Usage

### Claude Desktop

Add to your Claude Desktop config (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "buildlog": {
      "command": "buildlog-mcp"
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "buildlog": {
      "command": "npx",
      "args": ["@buildlogai/mcp"]
    }
  }
}
```

### OpenClaw

OpenClaw supports MCP servers natively:

```json
{
  "mcp": {
    "servers": ["buildlog-mcp"]
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `buildlog_search` | Search buildlog.ai for relevant workflows |
| `buildlog_get` | Fetch a specific buildlog by slug or URL |
| `buildlog_get_steps` | Get just the steps from a buildlog |
| `buildlog_follow` | Get prompts formatted for execution |
| `buildlog_record_start` | Begin recording a session |
| `buildlog_record_step` | Log a step (prompt, action, terminal, note) |
| `buildlog_record_stop` | End recording, get the buildlog |
| `buildlog_upload` | Upload to buildlog.ai |
| `buildlog_fork` | Start recording from an existing buildlog |

## Tool Details

### buildlog_search

Search buildlog.ai for relevant workflows.

```
Parameters:
- query (required): Search query (e.g., "stripe nextjs integration")
- language (optional): Filter by language (e.g., "typescript")
- framework (optional): Filter by framework (e.g., "nextjs")
- limit (optional): Max results (default: 10)
```

### buildlog_get

Fetch a complete buildlog by slug or URL.

```
Parameters:
- slug (required): Buildlog slug or full URL
```

### buildlog_get_steps

Get just the steps from a buildlog (lighter response).

```
Parameters:
- slug (required): Buildlog slug or full URL
```

### buildlog_follow

Get prompts from a buildlog formatted for execution. This is the key tool for replicating workflows.

```
Parameters:
- slug (required): Buildlog slug or full URL
- step (optional): Start from a specific step number
```

### buildlog_record_start

Begin recording a new session.

```
Parameters:
- title (required): Title for the recording
- description (optional): Longer description
```

### buildlog_record_step

Log a step to the active recording.

```
Parameters:
- type (required): "prompt" | "action" | "terminal" | "note"
- content (required): The step content
- metadata (optional): Additional data (filesCreated, filesModified, etc.)
```

### buildlog_record_stop

End recording and return the buildlog.

```
Parameters:
- outcome (optional): "success" | "partial" | "failure"
- summary (optional): Summary of what was accomplished
```

### buildlog_upload

Upload a buildlog to buildlog.ai.

```
Parameters:
- buildlog (required): The buildlog object
- public (optional): Whether publicly visible (default: true)
```

### buildlog_fork

Start a new recording based on an existing buildlog.

```
Parameters:
- slug (required): Source buildlog slug
- title (required): Title for the new buildlog
- fromStep (optional): Only copy steps up to this number
```

## Example Workflows

### Search and Follow

```
Agent: Use buildlog_search to find "stripe nextjs integration"
→ Returns list of relevant buildlogs

Agent: Use buildlog_follow on buildlog "abc123"
→ Returns prompts to execute in order

Agent: Execute each prompt, adapting to current project
```

### Record a Session

```
Agent: Use buildlog_record_start with title "Building auth system"

Agent: ... does work ...
Agent: Use buildlog_record_step for each significant action

Agent: Use buildlog_record_stop when done
→ Returns completed buildlog

Agent: Use buildlog_upload to share
→ Returns URL to view buildlog
```

### Fork and Extend

```
Agent: Use buildlog_fork on "abc123" with title "Extended auth with MFA"
→ Starts recording with inherited steps

Agent: Use buildlog_record_step for new work
Agent: Use buildlog_record_stop
Agent: Use buildlog_upload
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BUILDLOG_API_KEY` | API key for uploads (get from buildlog.ai/settings) |
| `BUILDLOG_API_URL` | Custom API URL (default: https://buildlog.ai/api) |

## VS Code Extension Interop

When recording, steps are also written to `~/.buildlog/agent-feed.jsonl` (if the directory exists). This allows the VS Code extension to incorporate MCP-based recordings into its capture flow.

## Links

- [buildlog.ai](https://buildlog.ai)
- [Documentation](https://buildlog.ai/docs)
- [GitHub](https://github.com/buildlog/mcp)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=buildlog.buildlog-recorder)

## License

MIT
