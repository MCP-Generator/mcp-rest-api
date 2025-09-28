/**
 * Main MCP Server implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { McpServerConfig } from '../types/McpConfig';
import { RequestHandler } from './RequestHandler';
import { ToolRegistry } from './ToolRegistry';
import { Logger } from '../utils/Logger';

/**
 * Generic MCP Server that loads REST API configurations
 */
export class McpServer {
    private server: Server;
    private config: McpServerConfig;
    private requestHandler: RequestHandler;
    private toolRegistry: ToolRegistry;
    private logger: Logger;
    private isRunning: boolean = false;

    constructor(config: McpServerConfig, logger?: Logger) {
        this.config = config;
        this.logger = logger || Logger.createSilent();
        this.server = new Server(
            {
                name: config.server.name,
                version: config.server.version,
                description: config.server.description
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        // Initialize components
        this.requestHandler = new RequestHandler(config.api, this.logger);
        this.toolRegistry = new ToolRegistry(this.requestHandler, this.logger);

        // Register tools from config
        this.toolRegistry.registerToolsFromConfig(config);

        // Setup MCP handlers
        this.setupHandlers();
    }

    /**
     * Setup MCP protocol handlers
     */
    private setupHandlers(): void {
        // Handle tool listing
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.toolRegistry.getMcpTools();
            return { tools };
        });

        // Handle tool execution
        this.server.setRequestHandler(CallToolRequestSchema, async request => {
            const { name, arguments: args } = request.params;

            try {
                this.logger.debug(`Executing tool: ${name} with args:`, args);

                if (!this.toolRegistry.hasTool(name)) {
                    throw new McpError(ErrorCode.MethodNotFound, `Tool "${name}" not found`);
                }

                const result = await this.toolRegistry.executeTool(name, args || {});

                return {
                    content: [
                        {
                            type: 'text',
                            text:
                                typeof result === 'string'
                                    ? result
                                    : JSON.stringify(result, null, 2)
                        }
                    ]
                };
            } catch (error) {
                this.logger.error(`Tool execution failed for "${name}":`, error);

                // Handle different error types
                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    error instanceof Error ? error.message : String(error)
                );
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
    async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('MCP Server is already running');
            return;
        }

        try {
            this.logger.info(
                `Starting MCP Server: ${this.config.server.name} v${this.config.server.version}`
            );
            this.logger.info(`Description: ${this.config.server.description}`);
            this.logger.info(`Base URL: ${this.config.api.baseUrl}`);

            const toolsSummary = this.toolRegistry.getToolsSummary();
            this.logger.info(`Registered ${toolsSummary.total} tools:`);
            toolsSummary.tools.forEach(tool => {
                this.logger.info(`  - ${tool.name} (${tool.method}): ${tool.description}`);
            });

            const transport = new StdioServerTransport();
            await this.server.connect(transport);

            this.isRunning = true;
            this.logger.info('MCP Server started successfully');
        } catch (error) {
            this.logger.error('Failed to start MCP Server:', error);
            throw error;
        }
    }

    /**
     * Stop the MCP server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            this.logger.info('Stopping MCP Server...');
            await this.server.close();
            this.isRunning = false;
            this.logger.info('MCP Server stopped');
        } catch (error) {
            this.logger.error('Error stopping MCP Server:', error);
            throw error;
        }
    }

    /**
     * Get server status
     */
    getStatus(): {
        running: boolean;
        config: {
            name: string;
            version: string;
            description: string;
            baseUrl: string;
        };
        tools: {
            total: number;
            names: string[];
        };
    } {
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
    getToolInfo(toolName: string): {
        found: boolean;
        definition?: any;
        mcpTool?: any;
    } {
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
    async testTool(
        toolName: string,
        args: Record<string, any>
    ): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        try {
            const result = await this.toolRegistry.executeTool(toolName, args);
            return {
                success: true,
                result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Validate the server configuration
     */
    validateConfiguration(): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate server metadata
        if (!this.config.server.name.match(/^[a-z][a-z0-9_-]*$/)) {
            errors.push('Server name must be lowercase with hyphens or underscores');
        }

        // Validate API configuration
        try {
            new URL(this.config.api.baseUrl);
        } catch {
            errors.push('Invalid base URL in API configuration');
        }

        // Validate tools
        const toolNames = new Set<string>();
        for (const tool of this.config.tools) {
            if (toolNames.has(tool.name)) {
                errors.push(`Duplicate tool name: ${tool.name}`);
            }
            toolNames.add(tool.name);

            if (!tool.name.match(/^[a-z][a-z0-9_]*$/)) {
                errors.push(`Tool name "${tool.name}" must be lowercase snake_case`);
            }

            // Check for unresolved path parameters
            const pathPlaceholders = (tool.path.match(/\{([^}]+)\}/g) || []).map(p =>
                p.slice(1, -1)
            );
            const pathParams = tool.pathParams ? Object.keys(tool.pathParams) : [];

            for (const placeholder of pathPlaceholders) {
                if (!pathParams.includes(placeholder)) {
                    errors.push(
                        `Missing pathParam for placeholder "{${placeholder}}" in tool "${tool.name}"`
                    );
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
