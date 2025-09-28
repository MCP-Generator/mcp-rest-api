# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Language Preferences

Although I may ask questions and communicate with you in Hebrew, please respond to me in English unless I explicitly request otherwise. This helps maintain consistency in our technical discussions and documentation.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Project Overview

This is a **Generic MCP (Model Context Protocol) REST API Server** - a type-safe, configurable tool that can wrap any REST API and expose it as MCP tools for LLM agents. The server loads JSON configurations that define how to interact with external REST APIs and automatically registers them as callable MCP tools.

## Essential Commands

### Development Workflow
```bash
npm run dev                    # Start development server with hot reload
npm run dev:config             # Development mode with PagerDuty config
npm run build                  # Compile TypeScript to JavaScript
npm run start                  # Run compiled server (requires build first)
npm run build-start            # Build and start (pass args with --)
```

### Code Quality
```bash
npm run lint         # Check code quality and style
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # Run TypeScript type checking only
```

### Running the Server
```bash
# Convenient shortcut for PagerDuty example
npm run start:pagerduty

# Generic command with any config file
npm run build-start -- --config /path/to/config.json

# Direct execution (after build)
node dist/index.js --config /path/to/config.json
```

### Global Installation
```bash
# Install globally as 'mcp-rest-api' command
npm run install:global

# Uninstall global command
npm run uninstall:global

# Reinstall (useful after making changes)
npm run reinstall:global
```

### Using the Global Command
```bash
# Direct global command (after installation)
mcp-rest-api --config /path/to/config.json

# Using npx (preferred - works without global installation)
npx mcp-rest-api --config /path/to/config.json
```

## Architecture Overview

The system follows a **three-layer architecture** that transforms JSON configurations into MCP tools:

### 1. Configuration Layer (`src/types/`)
- **`McpConfig.ts`**: Type-safe interfaces for the MCP-Config Builder JSON format
- **`ParameterBinding.ts`**: Handles `{args.param}` and `{env.VAR}` expression parsing
- **`ValidationSchemas.ts`**: Comprehensive runtime validation

### 2. MCP Server Layer (`src/mcp/`)
- **`McpServer.ts`**: Main MCP protocol server implementation using Anthropic's MCP SDK
- **`ToolRegistry.ts`**: Dynamically registers JSON-defined tools as MCP tools
- **`RequestHandler.ts`**: Executes HTTP requests with parameter binding and error handling

### 3. CLI/Config Layer (`src/`)
- **`index.ts`**: Main entry point and CLI orchestration
- **`cli.ts`**: Command-line argument parsing using Commander
- **`config-parser.ts`**: Type-safe JSON config loading and validation
- **`config-fetcher.ts`**: Loads configs from local files or URLs

## Configuration Format

The JSON configuration follows a **three-tier structure**:

```json
{
  "server": {
    "name": "api-server-name",
    "version": "1.0.0",
    "description": "LLM-oriented description of when to use this API"
  },
  "api": {
    "baseUrl": "https://api.example.com",
    "timeout": 30000,
    "headers": {
      "Authorization": "Bearer {env.API_TOKEN}"
    }
  },
  "tools": [
    {
      "name": "service_resource_action",
      "description": "What this tool does and when to use it",
      "method": "GET",
      "path": "/users/{id}",
      "pathParams": { "id": "{args.user_id}" },
      "queryParams": { "include": "{args.include || 'basic'}" },
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "description": "User ID" }
        },
        "required": ["user_id"]
      }
    }
  ]
}
```

## Key Design Patterns

### Parameter Binding System
The system supports sophisticated parameter expressions:
- `{args.paramName}` - Maps to tool input arguments
- `{env.VAR_NAME}` - References environment variables
- `{args.param || defaultValue}` - Provides fallback values

### Tool Naming Convention
Tools follow the pattern: `{service}_{resource}_{action}`
Examples: `pagerduty_users_list`, `github_repos_get`, `slack_messages_send`

### Type Safety Strategy
- All configurations are validated at runtime using comprehensive JSON schemas
- TypeScript interfaces ensure compile-time safety
- Parameter binding expressions are parsed and validated before execution

## Development Guidelines

### Adding New Configuration Support
1. Extend interfaces in `src/types/McpConfig.ts` if needed
2. Update validation logic in `src/types/ValidationSchemas.ts`
3. Test with sample configurations in `samples-config/`

### Modifying Parameter Binding
- Core logic is in `ParameterBinder` class in `src/types/ParameterBinding.ts`
- Expression parsing uses regex: `/\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}/g`
- Add new expression types by extending the `ParsedExpression` interface

### Error Handling Strategy
- Configuration validation errors use `McpConfigValidationError`
- Parameter binding errors use `ParameterBindingError`
- HTTP request errors are wrapped in `RequestResult` with detailed context
- MCP protocol errors use standard MCP error codes

## Testing Configurations

Sample configuration files are in `samples-config/`. The PagerDuty example demonstrates:
- Authentication with environment variables
- Multiple related tools (users, teams, schedules)
- Parameter binding with defaults
- Proper JSON Schema validation

Use `npm run build-start -- --config samples-config/pagerduty-api-server.json` to test the server with the sample configuration.