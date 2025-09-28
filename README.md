# 🚀 MCP REST API Server

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/mcp-rest-api.svg)](https://www.npmjs.com/package/mcp-rest-api)

> 🔧 **A powerful, type-safe, configurable CLI tool** that transforms any REST API into MCP (Model Context Protocol) tools for LLM agents

## 🌟 What is this?

The **MCP REST API Server** is a generic bridge that allows you to wrap **any REST API** and expose it as callable tools for AI assistants and LLM agents through the Model Context Protocol. Simply provide a JSON configuration file, and your API becomes instantly accessible to AI tools!

**✨ The easiest way to get started is with `npx -y mcp-rest-api`** - no installation required!

## 🤖 AI-Powered Config Generator

**🚀 NEW: Generate configs instantly with AI!** Visit [**api-mcp-generator.vercel.app**](https://api-mcp-generator.vercel.app/) to automatically generate JSON configurations from any REST API documentation. Just paste your API docs and let AI create the perfect MCP config for you!

### 🎯 Key Features

- 🔄 **Universal REST API Wrapper** - Works with any REST API
- 📝 **JSON Configuration Driven** - No coding required, just configure
- 🛡️ **Type-Safe & Validated** - Full TypeScript support with runtime validation
- 🔑 **Smart Parameter Binding** - Support for `{args.param}` and `{env.VAR}` expressions
- 🚀 **CLI Ready** - Install globally or use with npx
- 🔧 **Developer Friendly** - Hot reload, linting, and comprehensive tooling
- 🌍 **Environment Aware** - Seamless environment variable integration
- 📋 **Flexible Logging** - Silent, console, or file-based logging options
- ✅ **Robust Validation** - Comprehensive config validation with helpful error messages

## 📦 Installation & Usage

1. **Visit**: [**api-mcp-generator.vercel.app**](https://api-mcp-generator.vercel.app/)
2. **Input**: Describe your REST API by pasting the url/documentation test in prompt
3. **Generate**: AI analyzes the docs and creates a perfect JSON configuration
4. **Copy & Run**: Copy MCP configuration and use it in your preferred AI tool (claude code, cursor, windsurf etc.)  

✨ **Perfect for**: Any API with existing documentation - the AI understands various API doc formats and generates comprehensive, production-ready configurations.


### 🚀 Quick Start with npx (Recommended)
```bash
# Run directly without installation (most convenient)
npx -y mcp-rest-api --config /path/to/your/config.json

# The -y flag skips confirmation prompts for faster execution
```

### Global Installation (Alternative)
```bash
npm install -g mcp-rest-api
mcp-rest-api --config /path/to/your/config.json
```

### Development Setup
```bash
git clone https://github.com/MCP-Generator/mcp-rest-api.git
cd mcp-rest-api
npm install
npm run build
```


### CLI Options
```bash
# Required: Specify configuration file
npx -y mcp-rest-api --config /path/to/config.json

# Optional: Control logging output
npx -y mcp-rest-api --config config.json --log stdio        # Log to console
npx -y mcp-rest-api --config config.json --log /path/file   # Log to file
npx -y mcp-rest-api --config config.json --log none        # No logging (default)
```

## 🚀 Two Ways to Create Configuration


### ✍️ Method 2: Manual Configuration

Create a JSON config file manually for full control. See the [Configuration Deep Dive](#-configuration-deep-dive) section below for detailed examples and parameter binding options.

## 🏗️ Architecture Overview

The system follows a clean **three-layer architecture**:

```
┌─────────────────────────┐
│   🎯 CLI/Config Layer   │  ← Entry point & config loading (cli.ts)
├─────────────────────────┤
│   🔧 MCP Server Layer   │  ← Protocol implementation & tool registry (McpServer.ts)
├─────────────────────────┤
│   📡 HTTP Client Layer  │  ← REST API communication & parameter binding (RequestHandler.ts)
└─────────────────────────┘
```

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

**✨ Get started in seconds:** Generate configs with AI at [api-mcp-generator.vercel.app](https://api-mcp-generator.vercel.app/) → `npx -y mcp-rest-api --config your-config.json`

Made with ❤️ for the LLM community

</div>

## 🎯 Why Use This Tool?

- **🤖 AI-Powered Generation**: Use [api-mcp-generator.vercel.app](https://api-mcp-generator.vercel.app/) to generate configs from API docs instantly
- **🚀 Zero Installation Required**: Use `npx -y mcp-rest-api` to run immediately
- **⚡ Instant Setup**: From REST API to AI tool in minutes, not hours
- **🔧 No Coding**: Pure JSON configuration - no programming required
- **🌐 Universal**: Works with any REST API (PagerDuty, GitHub, Slack, custom APIs)
- **🛡️ Production Ready**: Type-safe, validated, with proper error handling
- **🔍 MCP Standard**: Full Model Context Protocol compliance for maximum compatibility
