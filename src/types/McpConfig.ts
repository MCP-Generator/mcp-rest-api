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
export class McpConfigValidationError extends Error {
    constructor(
        message: string,
        public field?: string
    ) {
        super(message);
        this.name = 'McpConfigValidationError';
    }
}

/**
 * Type guard to check if object is a valid McpServerConfig
 */
export function isMcpServerConfig(obj: any): obj is McpServerConfig {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.server === 'object' &&
        typeof obj.api === 'object' &&
        Array.isArray(obj.tools)
    );
}

/**
 * Validate server metadata section
 */
export function validateServerMetadata(server: any): server is ServerMetadata {
    return (
        typeof server === 'object' &&
        server !== null &&
        typeof server.name === 'string' &&
        server.name.length > 0 &&
        typeof server.version === 'string' &&
        server.version.length > 0 &&
        typeof server.description === 'string' &&
        server.description.length > 0
    );
}

/**
 * Validate API configuration section
 */
export function validateApiConfiguration(api: any): api is ApiConfiguration {
    return (
        typeof api === 'object' &&
        api !== null &&
        typeof api.baseUrl === 'string' &&
        api.baseUrl.length > 0 &&
        (api.timeout === undefined || typeof api.timeout === 'number') &&
        (api.rejectUnauthorized === undefined || typeof api.rejectUnauthorized === 'boolean') &&
        (api.headers === undefined || (typeof api.headers === 'object' && api.headers !== null))
    );
}

/**
 * Validate tool definition
 */
export function validateToolDefinition(tool: any): tool is ToolDefinition {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    return (
        typeof tool === 'object' &&
        tool !== null &&
        typeof tool.name === 'string' &&
        tool.name.length > 0 &&
        typeof tool.description === 'string' &&
        tool.description.length > 0 &&
        validMethods.includes(tool.method) &&
        typeof tool.path === 'string' &&
        tool.path.length > 0 &&
        typeof tool.inputSchema === 'object' &&
        tool.inputSchema !== null
    );
}
