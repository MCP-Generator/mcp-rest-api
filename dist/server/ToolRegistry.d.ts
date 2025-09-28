/**
 * Dynamic tool registration and management for MCP server
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolDefinition, McpServerConfig } from '../types/McpConfig';
import { RequestHandler } from './RequestHandler';
import { Logger } from '../utils/Logger';
export interface RegisteredTool {
    definition: ToolDefinition;
    mcpTool: Tool;
}
/**
 * Manages dynamic tool registration from MCP configuration
 */
export declare class ToolRegistry {
    private tools;
    private requestHandler;
    private logger;
    constructor(requestHandler: RequestHandler, logger?: Logger);
    /**
     * Register all tools from MCP configuration
     */
    registerToolsFromConfig(config: McpServerConfig): void;
    /**
     * Create MCP Tool from tool definition
     */
    private createMcpTool;
    /**
     * Convert our JSON Schema format to MCP-compatible schema
     */
    private convertJsonSchemaToMcp;
    /**
     * Convert property schema to MCP format
     */
    private convertPropertySchema;
    /**
     * Get all registered MCP tools
     */
    getMcpTools(): Tool[];
    /**
     * Get tool definition by name
     */
    getToolDefinition(name: string): ToolDefinition | undefined;
    /**
     * Execute a tool call
     */
    executeTool(name: string, args: Record<string, any>): Promise<any>;
    /**
     * Validate argument types against JSON schema
     */
    private validateArgumentTypes;
    /**
     * Validate a single value against a schema property
     */
    private validateValueType;
    /**
     * Get summary of registered tools
     */
    getToolsSummary(): {
        total: number;
        tools: Array<{
            name: string;
            method: string;
            description: string;
        }>;
    };
    /**
     * Check if a tool exists
     */
    hasTool(name: string): boolean;
}
//# sourceMappingURL=ToolRegistry.d.ts.map