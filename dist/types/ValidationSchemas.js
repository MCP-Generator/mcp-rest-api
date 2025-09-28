"use strict";
/**
 * JSON Schema validation utilities and enhanced validation functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMcpConfig = validateMcpConfig;
exports.createValidationError = createValidationError;
const McpConfig_1 = require("./McpConfig");
const ParameterBinding_1 = require("./ParameterBinding");
/**
 * Validate complete MCP server configuration
 */
function validateMcpConfig(config) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    // Basic structure validation
    if (typeof config !== 'object' || config === null) {
        result.valid = false;
        result.errors.push({
            field: 'root',
            message: 'Configuration must be a valid JSON object',
            value: config
        });
        return result;
    }
    // Validate server section
    if (!config.server) {
        result.valid = false;
        result.errors.push({
            field: 'server',
            message: 'Missing required "server" section'
        });
    }
    else if (!(0, McpConfig_1.validateServerMetadata)(config.server)) {
        result.valid = false;
        result.errors.push({
            field: 'server',
            message: 'Invalid server metadata. Must have name, version, and description fields',
            value: config.server
        });
    }
    else {
        // Validate server name format (lowercase, snake_case)
        if (!/^[a-z][a-z0-9_-]*$/.test(config.server.name)) {
            result.errors.push({
                field: 'server.name',
                message: 'Server name must be lowercase, snake_case identifier',
                value: config.server.name
            });
            result.valid = false;
        }
    }
    // Validate API section
    if (!config.api) {
        result.valid = false;
        result.errors.push({
            field: 'api',
            message: 'Missing required "api" section'
        });
    }
    else if (!(0, McpConfig_1.validateApiConfiguration)(config.api)) {
        result.valid = false;
        result.errors.push({
            field: 'api',
            message: 'Invalid API configuration. Must have valid baseUrl',
            value: config.api
        });
    }
    else {
        // Validate baseUrl format
        try {
            const binder = new ParameterBinding_1.ParameterBinder({});
            if (config.api.baseUrl) {
                config.api.baseUrl = binder.resolve(config.api.baseUrl);
            }
            new URL(config.api.baseUrl);
        }
        catch {
            result.valid = false;
            result.errors.push({
                field: 'api.baseUrl',
                message: 'baseUrl must be a valid URL',
                value: config.api.baseUrl
            });
        }
    }
    // Validate tools section
    if (!config.tools) {
        result.valid = false;
        result.errors.push({
            field: 'tools',
            message: 'Missing required "tools" array'
        });
    }
    else if (!Array.isArray(config.tools)) {
        result.valid = false;
        result.errors.push({
            field: 'tools',
            message: 'Tools must be an array',
            value: config.tools
        });
    }
    else {
        const toolNames = new Set();
        config.tools.forEach((tool, index) => {
            const toolResult = validateToolConfiguration(tool, index);
            result.errors.push(...toolResult.errors);
            result.warnings.push(...toolResult.warnings);
            if (!toolResult.valid) {
                result.valid = false;
            }
            // Check for duplicate tool names
            if (tool && typeof tool.name === 'string') {
                if (toolNames.has(tool.name)) {
                    result.valid = false;
                    result.errors.push({
                        field: `tools[${index}].name`,
                        message: `Duplicate tool name: ${tool.name}`,
                        value: tool.name
                    });
                }
                else {
                    toolNames.add(tool.name);
                }
            }
        });
    }
    return result;
}
/**
 * Validate individual tool configuration
 */
function validateToolConfiguration(tool, index) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    if (!(0, McpConfig_1.validateToolDefinition)(tool)) {
        result.valid = false;
        result.errors.push({
            field: `tools[${index}]`,
            message: 'Invalid tool definition',
            value: tool
        });
        return result;
    }
    // Validate tool name format (lowercase, snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) {
        result.valid = false;
        result.errors.push({
            field: `tools[${index}].name`,
            message: 'Tool name must be lowercase, snake_case identifier',
            value: tool.name
        });
    }
    // Validate path parameters consistency
    const pathPlaceholders = extractPathPlaceholders(tool.path);
    const pathParams = tool.pathParams ? Object.keys(tool.pathParams) : [];
    for (const placeholder of pathPlaceholders) {
        if (!pathParams.includes(placeholder)) {
            result.valid = false;
            result.errors.push({
                field: `tools[${index}].pathParams`,
                message: `Missing pathParam for placeholder "{${placeholder}}" in path`,
                value: tool.path
            });
        }
    }
    for (const param of pathParams) {
        if (!pathPlaceholders.includes(param)) {
            result.warnings.push(`Unused pathParam "${param}" in tool "${tool.name}"`);
        }
    }
    // Validate input schema
    const schemaResult = validateJsonSchema(tool.inputSchema, `tools[${index}].inputSchema`);
    result.errors.push(...schemaResult.errors);
    result.warnings.push(...schemaResult.warnings);
    if (!schemaResult.valid) {
        result.valid = false;
    }
    return result;
}
/**
 * Extract path placeholders from a URL path
 */
function extractPathPlaceholders(path) {
    const matches = path.match(/\{([^}]+)\}/g);
    if (!matches)
        return [];
    return matches.map(match => match.slice(1, -1)); // Remove { and }
}
/**
 * Validate JSON Schema structure
 */
function validateJsonSchema(schema, fieldPath) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    if (typeof schema !== 'object' || schema === null) {
        result.valid = false;
        result.errors.push({
            field: fieldPath,
            message: 'Schema must be a valid object'
        });
        return result;
    }
    // Validate required type field
    const validTypes = ['object', 'string', 'number', 'integer', 'boolean', 'array', 'null'];
    if (!schema.type || !validTypes.includes(schema.type)) {
        result.valid = false;
        result.errors.push({
            field: `${fieldPath}.type`,
            message: `Schema type must be one of: ${validTypes.join(', ')}`,
            value: schema.type
        });
    }
    // Validate properties if type is object
    if (schema.type === 'object') {
        if (schema.properties && typeof schema.properties === 'object') {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const propResult = validateJsonSchema(propSchema, `${fieldPath}.properties.${propName}`);
                result.errors.push(...propResult.errors);
                result.warnings.push(...propResult.warnings);
                if (!propResult.valid) {
                    result.valid = false;
                }
            }
        }
        // Validate required array
        if (schema.required && !Array.isArray(schema.required)) {
            result.valid = false;
            result.errors.push({
                field: `${fieldPath}.required`,
                message: 'Required field must be an array of strings'
            });
        }
        else if (schema.required) {
            for (const reqField of schema.required) {
                if (typeof reqField !== 'string') {
                    result.valid = false;
                    result.errors.push({
                        field: `${fieldPath}.required`,
                        message: 'Required field names must be strings',
                        value: reqField
                    });
                }
                else if (schema.properties && !schema.properties[reqField]) {
                    result.warnings.push(`Required field "${reqField}" not found in properties at ${fieldPath}`);
                }
            }
        }
    }
    // Validate items if type is array
    if (schema.type === 'array' && schema.items) {
        const itemsResult = validateJsonSchema(schema.items, `${fieldPath}.items`);
        result.errors.push(...itemsResult.errors);
        result.warnings.push(...itemsResult.warnings);
        if (!itemsResult.valid) {
            result.valid = false;
        }
    }
    return result;
}
/**
 * Create a validation error from a validation result
 */
function createValidationError(result) {
    const errorMessages = result.errors.map(err => `${err.field}: ${err.message}`).join('\n');
    return new McpConfig_1.McpConfigValidationError(`Configuration validation failed:\n${errorMessages}`);
}
//# sourceMappingURL=ValidationSchemas.js.map