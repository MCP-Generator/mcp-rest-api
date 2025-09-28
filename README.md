# 🚀 MCP REST API Server

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

> 🔧 **A powerful, type-safe, configurable tool** that transforms any REST API into MCP (Model Context Protocol) tools for LLM agents

## 🌟 What is this?

The **MCP REST API Server** is a generic bridge that allows you to wrap **any REST API** and expose it as callable tools for AI assistants and LLM agents through the Model Context Protocol. Simply provide a JSON configuration file, and your API becomes instantly accessible to AI tools!

### 🎯 Key Features

- 🔄 **Universal REST API Wrapper** - Works with any REST API
- 📝 **JSON Configuration Driven** - No coding required, just configure
- 🛡️ **Type-Safe & Validated** - Full TypeScript support with runtime validation
- 🔑 **Smart Parameter Binding** - Support for `{args.param}` and `{env.VAR}` expressions
- 🚀 **CLI Ready** - Install globally or use with npx
- 🔧 **Developer Friendly** - Hot reload, linting, and comprehensive tooling
- 🌍 **Environment Aware** - Seamless environment variable integration

## 📦 Installation

### Global Installation
```bash
npm install -g mcp-rest-api
mcp-rest-api --config /path/to/your/config.json
```

### Using npx (Recommended)
```bash
# From npm registry (once published)
npx mcp-rest-api --config /path/to/your/config.json

# Directly from GitHub
npx -y github:MCP-Generator/mcp-rest-api --config /path/to/your/config.json
```

### Clone & Build
```bash
git clone <your-repo-url>
cd mcp-rest-api
npm install
npm run build
```

## 🚀 Quick Start

### 1. Create Your API Configuration

Create a JSON config file (e.g., `my-api-config.json`):

```json
{
  "server": {
    "name": "my-awesome-api",
    "version": "1.0.0",
    "description": "My API wrapper for LLM agents"
  },
  "api": {
    "baseUrl": "https://api.example.com",
    "timeout": 30000,
    "headers": {
      "Authorization": "Bearer {env.API_TOKEN}",
      "Content-Type": "application/json"
    }
  },
  "tools": [
    {
      "name": "users_get",
      "description": "Get user information by ID",
      "method": "GET",
      "path": "/users/{id}",
      "pathParams": {
        "id": "{args.user_id}"
      },
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "description": "The user ID to fetch"
          }
        },
        "required": ["user_id"]
      }
    }
  ]
}
```

### 2. Set Environment Variables
```bash
export API_TOKEN="your-secret-token-here"
```

### 3. Run the Server
```bash
npx mcp-rest-api --config my-api-config.json
```

🎉 **That's it!** Your API is now available as MCP tools!

## 📋 Sample Configurations

We provide ready-to-use examples in the `samples/` directory:

### 🚨 PagerDuty API
```bash
export PAGERDUTY_API_TOKEN="your-token"
npm run dev:config
# or
npx mcp-rest-api --config samples/pagerduty-api-server.json
```

### 📰 Hacker News API
```bash
npx mcp-rest-api --config samples/hackernews-api-server.json
```

## ⚡ Development Workflow

### Essential Commands

| Command | Description | Usage |
|---------|-------------|--------|
| `npm run dev` | 🔥 Development with hot reload | Start coding |
| `npm run build` | 🔨 Compile TypeScript | Before deployment |
| `npm run start` | ▶️ Run compiled server | Production mode |
| `npm run lint` | 🔍 Check code quality | Code review |
| `npm run typecheck` | ✅ Type validation | Catch type errors |

### Development Commands
```bash
# Start development server with hot reload
npm run dev

# Development with sample PagerDuty config
npm run dev:config

# Build and start in one command
npm run build-start -- --config /path/to/config.json
```

### Code Quality
```bash
# Check everything
npm run check

# Fix formatting and linting issues
npm run fix

# Individual commands
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
npm run typecheck      # TypeScript validation
npm run format         # Prettier formatting
```

### Global Installation Management
```bash
# Install as global command
npm run install:global

# Uninstall global command
npm run uninstall:global

# Reinstall (useful after changes)
npm run reinstall:global
```

## 🏗️ Architecture Overview

The system follows a clean **three-layer architecture**:

```
┌─────────────────────────┐
│   🎯 CLI/Config Layer   │  ← Entry point & config loading
├─────────────────────────┤
│   🔧 MCP Server Layer   │  ← Protocol implementation & tool registry
├─────────────────────────┤
│   📡 HTTP Client Layer  │  ← REST API communication & parameter binding
└─────────────────────────┘
```

### Key Components

- **📋 Configuration Layer** (`src/types/`) - Type-safe config interfaces & validation
- **🔌 MCP Server Layer** (`src/server/`) - Protocol server & dynamic tool registration
- **🌐 HTTP Client Layer** - Request handling with smart parameter binding
- **⚙️ CLI Layer** (`src/`) - Command-line interface & config loading

## 🔧 Configuration Deep Dive

### Parameter Binding Magic ✨

The system supports powerful expression binding:

```json
{
  "pathParams": {
    "id": "{args.user_id}"           // Maps to input parameter
  },
  "queryParams": {
    "limit": "{args.limit || 25}",   // Default value fallback
    "token": "{env.API_TOKEN}"       // Environment variable
  },
  "headers": {
    "Authorization": "Bearer {env.TOKEN}"
  }
}
```

### Tool Naming Convention 📛

Follow the pattern: `{service}_{resource}_{action}`

**Examples:**
- `pagerduty_users_list`
- `github_repos_get`
- `slack_messages_send`
- `jira_issues_create`

## 🔍 Troubleshooting

### Common Issues

**🚫 "Config file not found"**
```bash
# Use absolute paths
npx mcp-rest-api --config /full/path/to/config.json
```

**🔑 "Environment variable not set"**
```bash
# Check your environment variables
echo $API_TOKEN
export API_TOKEN="your-token-here"
```

**📡 "Request failed"**
- Verify API base URL is correct
- Check authentication token/headers
- Ensure API endpoint paths are valid
- Review rate limits and timeouts

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. ✅ Run tests and linting (`npm run check`)
4. 📝 Commit your changes (`git commit -m 'Add amazing feature'`)
5. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
6. 📬 Open a Pull Request

## 📜 License

This project is licensed under the ISC License.

---

<div align="center">

**🎯 Transform any REST API into AI-ready tools with just JSON configuration!**

Made with ❤️ for the LLM community

</div>