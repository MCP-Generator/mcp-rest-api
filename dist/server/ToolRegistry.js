"use strict";
/**
 * Dynamic tool registration and management for MCP server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const Logger_1 = require("../utils/Logger");
/**
 * Manages dynamic tool registration from MCP configuration
 */
class ToolRegistry {
    constructor(requestHandler, logger) {
        this.tools = new Map();
        this.requestHandler = requestHandler;
        this.logger = logger || Logger_1.Logger.createSilent();
    }
    /**
     * Register all tools from MCP configuration
     */
    registerToolsFromConfig(config) {
        this.tools.clear();
        for (const toolDef of config.tools) {
            try {
                const mcpTool = this.createMcpTool(toolDef);
                this.tools.set(toolDef.name, {
                    definition: toolDef,
                    mcpTool
                });
            }
            catch (error) {
                this.logger.error(`Failed to register tool "${toolDef.name}":`, error);
                throw error;
            }
        }
        this.logger.info(`Registered ${this.tools.size} tools successfully`);
    }
    /**
     * Create MCP Tool from tool definition
     */
    createMcpTool(toolDef) {
        return {
            name: toolDef.name,
            description: toolDef.description,
            inputSchema: this.convertJsonSchemaToMcp(toolDef.inputSchema)
        };
    }
    /**
     * Convert our JSON Schema format to MCP-compatible schema
     */
    convertJsonSchemaToMcp(schema) {
        // MCP uses JSON Schema, so we can pass through most properties
        // but ensure we have the right structure
        const mcpSchema = {
            type: schema.type,
            properties: {},
            required: schema.required || [],
            additionalProperties: schema.additionalProperties !== undefined ? schema.additionalProperties : false
        };
        if (schema.properties) {
            mcpSchema.properties = {};
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                mcpSchema.properties[propName] = this.convertPropertySchema(propSchema);
            }
        }
        // Add other schema properties
        if (schema.description)
            mcpSchema.description = schema.description;
        if (schema.default !== undefined)
            mcpSchema.default = schema.default;
        return mcpSchema;
    }
    /**
     * Convert property schema to MCP format
     */
    convertPropertySchema(propSchema) {
        const converted = {
            type: propSchema.type
        };
        // Copy over supported properties
        const supportedProps = [
            'description',
            'default',
            'enum',
            'minimum',
            'maximum',
            'minLength',
            'maxLength',
            'pattern',
            'format'
        ];
        for (const prop of supportedProps) {
            if (propSchema[prop] !== undefined) {
                converted[prop] = propSchema[prop];
            }
        }
        // Handle nested objects
        if (propSchema.type === 'object' && propSchema.properties) {
            converted.properties = {};
            for (const [nestedName, nestedSchema] of Object.entries(propSchema.properties)) {
                converted.properties[nestedName] = this.convertPropertySchema(nestedSchema);
            }
            if (propSchema.required) {
                converted.required = propSchema.required;
            }
        }
        // Handle arrays
        if (propSchema.type === 'array' && propSchema.items) {
            converted.items = this.convertPropertySchema(propSchema.items);
        }
        return converted;
    }
    /**
     * Get all registered MCP tools
     */
    getMcpTools() {
        return Array.from(this.tools.values()).map(tool => tool.mcpTool);
    }
    /**
     * Get tool definition by name
     */
    getToolDefinition(name) {
        return this.tools.get(name)?.definition;
    }
    /**
     * Execute a tool call
     */
    async executeTool(name, args) {
        const registeredTool = this.tools.get(name);
        if (!registeredTool) {
            throw new Error(`Tool "${name}" not found`);
        }
        const toolDef = registeredTool.definition;
        // Validate required arguments
        const validationErrors = this.requestHandler.validateRequiredArguments(toolDef, args);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }
        // Validate argument types against schema
        const typeValidationErrors = this.validateArgumentTypes(toolDef, args);
        if (typeValidationErrors.length > 0) {
            throw new Error(`Type validation failed: ${typeValidationErrors.join(', ')}`);
        }
        // Create request context and execute
        const context = {
            tool: toolDef,
            args
        };
        const result = await this.requestHandler.executeRequest(context);
        if (!result.success) {
            throw new Error(result.error || 'Request failed');
        }
        return result.data;
    }
    /**
     * Validate argument types against JSON schema
     */
    validateArgumentTypes(toolDef, args) {
        const errors = [];
        if (!toolDef.inputSchema.properties) {
            return errors;
        }
        for (const [argName, argValue] of Object.entries(args)) {
            const propSchema = toolDef.inputSchema.properties[argName];
            if (!propSchema) {
                // Unknown property - could warn but not error for flexibility
                continue;
            }
            const validationError = this.validateValueType(argValue, propSchema, argName);
            if (validationError) {
                errors.push(validationError);
            }
        }
        return errors;
    }
    /**
     * Validate a single value against a schema property
     */
    validateValueType(value, schema, fieldName) {
        if (value === undefined || value === null) {
            return null; // null/undefined values are handled by required validation
        }
        switch (schema.type) {
            case 'string':
                if (typeof value !== 'string') {
                    return `${fieldName} must be a string, got ${typeof value}`;
                }
                if (schema.minLength && value.length < schema.minLength) {
                    return `${fieldName} must be at least ${schema.minLength} characters long`;
                }
                if (schema.maxLength && value.length > schema.maxLength) {
                    return `${fieldName} must be at most ${schema.maxLength} characters long`;
                }
                if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                    return `${fieldName} does not match required pattern`;
                }
                if (schema.enum && !schema.enum.includes(value)) {
                    return `${fieldName} must be one of: ${schema.enum.join(', ')}`;
                }
                break;
            case 'number':
            case 'integer':
                const isValidNumber = typeof value === 'number' && !isNaN(value);
                const isInteger = schema.type === 'integer' && Number.isInteger(value);
                if (!isValidNumber || (schema.type === 'integer' && !isInteger)) {
                    return `${fieldName} must be a ${schema.type}`;
                }
                if (schema.minimum !== undefined && value < schema.minimum) {
                    return `${fieldName} must be at least ${schema.minimum}`;
                }
                if (schema.maximum !== undefined && value > schema.maximum) {
                    return `${fieldName} must be at most ${schema.maximum}`;
                }
                if (schema.enum && !schema.enum.includes(value)) {
                    return `${fieldName} must be one of: ${schema.enum.join(', ')}`;
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return `${fieldName} must be a boolean, got ${typeof value}`;
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    return `${fieldName} must be an array, got ${typeof value}`;
                }
                if (schema.items) {
                    for (let i = 0; i < value.length; i++) {
                        const itemError = this.validateValueType(value[i], schema.items, `${fieldName}[${i}]`);
                        if (itemError) {
                            return itemError;
                        }
                    }
                }
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    return `${fieldName} must be an object, got ${typeof value}`;
                }
                if (schema.properties) {
                    for (const [propName, propValue] of Object.entries(value)) {
                        const propSchema = schema.properties[propName];
                        if (propSchema) {
                            const propError = this.validateValueType(propValue, propSchema, `${fieldName}.${propName}`);
                            if (propError) {
                                return propError;
                            }
                        }
                    }
                }
                break;
        }
        return null;
    }
    /**
     * Get summary of registered tools
     */
    getToolsSummary() {
        const tools = Array.from(this.tools.values()).map(tool => ({
            name: tool.definition.name,
            method: tool.definition.method,
            description: tool.definition.description
        }));
        return {
            total: tools.length,
            tools
        };
    }
    /**
     * Check if a tool exists
     */
    hasTool(name) {
        return this.tools.has(name);
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map