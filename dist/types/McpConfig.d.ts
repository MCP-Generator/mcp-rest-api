/**
 * Type-safe interfaces for MCP-Config Builder JSON format
 * Based on the three-tier architecture: server, api, tools
 */
export interface McpServerConfig {
    server: ServerMetadata;
    api: ApiConfiguration;
    tools: ToolDefinition[];
}
export interface ServerMetadata {
    name: string;
    version: string;
    description: string;
}
export interface ApiConfiguration {
    baseUrl: string;
    timeout?: number;
    rejectUnauthorized?: boolean;
    headers?: Record<string, string>;
}
export interface ToolDefinition {
    name: string;
    description: string;
    method: HttpMethod;
    path: string;
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
    bodyTemplate?: Record<string, any> | string;
    responseTransform?: string;
    inputSchema: JsonSchema;
}
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/**
 * JSON Schema interface for input validation
 */
export interface JsonSchema {
    type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'null';
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
    items?: JsonSchemaProperty;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    description?: string;
    default?: any;
}
export interface JsonSchemaProperty {
    type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'null';
    description?: string;
    default?: any;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    items?: JsonSchemaProperty;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
}
/**
 * Configuration validation error
 */
export declare class McpConfigValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * Type guard to check if object is a valid McpServerConfig
 */
export declare function isMcpServerConfig(obj: any): obj is McpServerConfig;
/**
 * Validate server metadata section
 */
export declare function validateServerMetadata(server: any): server is ServerMetadata;
/**
 * Validate API configuration section
 */
export declare function validateApiConfiguration(api: any): api is ApiConfiguration;
/**
 * Validate tool definition
 */
export declare function validateToolDefinition(tool: any): tool is ToolDefinition;
//# sourceMappingURL=McpConfig.d.ts.map