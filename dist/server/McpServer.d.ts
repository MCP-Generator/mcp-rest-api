/**
 * Main MCP Server implementation
 */
import { McpServerConfig } from '../types/McpConfig';
import { Logger } from '../utils/Logger';
/**
 * Generic MCP Server that loads REST API configurations
 */
export declare class McpServer {
    private server;
    private config;
    private requestHandler;
    private toolRegistry;
    private logger;
    private isRunning;
    constructor(config: McpServerConfig, logger?: Logger);
    /**
     * Setup MCP protocol handlers
     */
    private setupHandlers;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
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
    };
    /**
     * Get detailed information about a specific tool
     */
    getToolInfo(toolName: string): {
        found: boolean;
        definition?: any;
        mcpTool?: any;
    };
    /**
     * Test tool execution with sample arguments
     */
    testTool(toolName: string, args: Record<string, any>): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    /**
     * Validate the server configuration
     */
    validateConfiguration(): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}
//# sourceMappingURL=McpServer.d.ts.map