"use strict";
/**
 * Type-safe interfaces for MCP-Config Builder JSON format
 * Based on the three-tier architecture: server, api, tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpConfigValidationError = void 0;
exports.isMcpServerConfig = isMcpServerConfig;
exports.validateServerMetadata = validateServerMetadata;
exports.validateApiConfiguration = validateApiConfiguration;
exports.validateToolDefinition = validateToolDefinition;
/**
 * Configuration validation error
 */
class McpConfigValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'McpConfigValidationError';
    }
}
exports.McpConfigValidationError = McpConfigValidationError;
/**
 * Type guard to check if object is a valid McpServerConfig
 */
function isMcpServerConfig(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.server === 'object' &&
        typeof obj.api === 'object' &&
        Array.isArray(obj.tools));
}
/**
 * Validate server metadata section
 */
function validateServerMetadata(server) {
    return (typeof server === 'object' &&
        server !== null &&
        typeof server.name === 'string' &&
        server.name.length > 0 &&
        typeof server.version === 'string' &&
        server.version.length > 0 &&
        typeof server.description === 'string' &&
        server.description.length > 0);
}
/**
 * Validate API configuration section
 */
function validateApiConfiguration(api) {
    return (typeof api === 'object' &&
        api !== null &&
        typeof api.baseUrl === 'string' &&
        api.baseUrl.length > 0 &&
        (api.timeout === undefined || typeof api.timeout === 'number') &&
        (api.rejectUnauthorized === undefined || typeof api.rejectUnauthorized === 'boolean') &&
        (api.headers === undefined || (typeof api.headers === 'object' && api.headers !== null)));
}
/**
 * Validate tool definition
 */
function validateToolDefinition(tool) {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    return (typeof tool === 'object' &&
        tool !== null &&
        typeof tool.name === 'string' &&
        tool.name.length > 0 &&
        typeof tool.description === 'string' &&
        tool.description.length > 0 &&
        validMethods.includes(tool.method) &&
        typeof tool.path === 'string' &&
        tool.path.length > 0 &&
        typeof tool.inputSchema === 'object' &&
        tool.inputSchema !== null);
}
//# sourceMappingURL=McpConfig.js.map