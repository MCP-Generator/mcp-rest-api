"use strict";
/**
 * Main MCP Server implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const RequestHandler_1 = require("./RequestHandler");
const ToolRegistry_1 = require("./ToolRegistry");
const Logger_1 = require("../utils/Logger");
/**
 * Generic MCP Server that loads REST API configurations
 */
class McpServer {
    constructor(config, logger) {
        this.isRunning = false;
        this.config = config;
        this.logger = logger || Logger_1.Logger.createSilent();
        this.server = new index_js_1.Server({
            name: config.server.name,
            version: config.server.version,
            description: config.server.description
        }, {
            capabilities: {
                tools: {}
            }
        });
        // Initialize components
        this.requestHandler = new RequestHandler_1.RequestHandler(config.api, this.logger);
        this.toolRegistry = new ToolRegistry_1.ToolRegistry(this.requestHandler, this.logger);
        // Register tools from config
        this.toolRegistry.registerToolsFromConfig(config);
        // Setup MCP handlers
        this.setupHandlers();
    }
    /**
     * Setup MCP protocol handlers
     */
    setupHandlers() {
        // Handle tool listing
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = this.toolRegistry.getMcpTools();
            return { tools };
        });
        // Handle tool execution
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                this.logger.debug(`Executing tool: ${name} with args:`, args);
                if (!this.toolRegistry.hasTool(name)) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool "${name}" not found`);
                }
                const result = await this.toolRegistry.executeTool(name, args || {});
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string'
                                ? result
                                : JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                this.logger.error(`Tool execution failed for "${name}":`, error);
                // Handle different error types
                if (error instanceof types_js_1.McpError) {
                    throw error;
                }
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
            }
        });
        // Error handling
        this.server.onerror = error => {
            this.logger.error('[MCP Server Error]', error);
        };
        // Process exit handling
        process.on('SIGINT', () => {
            this.stop();
        });
        process.on('SIGTERM', () => {
            this.stop();
        });
    }
    /**
     * Start the MCP server
     */
    async start() {
        if (this.isRunning) {
            this.logger.warn('MCP Server is already running');
            return;
        }
        try {
            this.logger.info(`Starting MCP Server: ${this.config.server.name} v${this.config.server.version}`);
            this.logger.info(`Description: ${this.config.server.description}`);
            this.logger.info(`Base URL: ${this.config.api.baseUrl}`);
            const toolsSummary = this.toolRegistry.getToolsSummary();
            this.logger.info(`Registered ${toolsSummary.total} tools:`);
            toolsSummary.tools.forEach(tool => {
                this.logger.info(`  - ${tool.name} (${tool.method}): ${tool.description}`);
            });
            const transport = new stdio_js_1.StdioServerTransport();
            await this.server.connect(transport);
            this.isRunning = true;
            this.logger.info('MCP Server started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start MCP Server:', error);
            throw error;
        }
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.logger.info('Stopping MCP Server...');
            await this.server.close();
            this.isRunning = false;
            this.logger.info('MCP Server stopped');
        }
        catch (error) {
            this.logger.error('Error stopping MCP Server:', error);
            throw error;
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        const toolsSummary = this.toolRegistry.getToolsSummary();
        return {
            running: this.isRunning,
            config: {
                name: this.config.server.name,
                version: this.config.server.version,
                description: this.config.server.description,
                baseUrl: this.config.api.baseUrl
            },
            tools: {
                total: toolsSummary.total,
                names: toolsSummary.tools.map(t => t.name)
            }
        };
    }
    /**
     * Get detailed information about a specific tool
     */
    getToolInfo(toolName) {
        const definition = this.toolRegistry.getToolDefinition(toolName);
        if (!definition) {
            return { found: false };
        }
        const mcpTools = this.toolRegistry.getMcpTools();
        const mcpTool = mcpTools.find(t => t.name === toolName);
        return {
            found: true,
            definition,
            mcpTool
        };
    }
    /**
     * Test tool execution with sample arguments
     */
    async testTool(toolName, args) {
        try {
            const result = await this.toolRegistry.executeTool(toolName, args);
            return {
                success: true,
                result
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Validate the server configuration
     */
    validateConfiguration() {
        const errors = [];
        const warnings = [];
        // Validate server metadata
        if (!this.config.server.name.match(/^[a-z][a-z0-9_-]*$/)) {
            errors.push('Server name must be lowercase with hyphens or underscores');
        }
        // Validate API configuration
        try {
            new URL(this.config.api.baseUrl);
        }
        catch {
            errors.push('Invalid base URL in API configuration');
        }
        // Validate tools
        const toolNames = new Set();
        for (const tool of this.config.tools) {
            if (toolNames.has(tool.name)) {
                errors.push(`Duplicate tool name: ${tool.name}`);
            }
            toolNames.add(tool.name);
            if (!tool.name.match(/^[a-z][a-z0-9_]*$/)) {
                errors.push(`Tool name "${tool.name}" must be lowercase snake_case`);
            }
            // Check for unresolved path parameters
            const pathPlaceholders = (tool.path.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1));
            const pathParams = tool.pathParams ? Object.keys(tool.pathParams) : [];
            for (const placeholder of pathPlaceholders) {
                if (!pathParams.includes(placeholder)) {
                    errors.push(`Missing pathParam for placeholder "{${placeholder}}" in tool "${tool.name}"`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.McpServer = McpServer;
//# sourceMappingURL=McpServer.js.map