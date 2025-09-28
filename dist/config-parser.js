"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonConfig = parseJsonConfig;
exports.validateAndParseMcpConfig = validateAndParseMcpConfig;
exports.loadAndParseMcpConfig = loadAndParseMcpConfig;
exports.validateConfig = validateConfig;
exports.loadAndParseConfig = loadAndParseConfig;
const McpConfig_1 = require("./types/McpConfig");
const ValidationSchemas_1 = require("./types/ValidationSchemas");
function parseJsonConfig(configContent) {
    try {
        return JSON.parse(configContent);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in config: ${error.message}`);
        }
        throw new Error(`Failed to parse config: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function validateAndParseMcpConfig(config, logger) {
    // Basic type guard check
    if (!(0, McpConfig_1.isMcpServerConfig)(config)) {
        throw new Error('Config must be a valid MCP server configuration with server, api, and tools sections');
    }
    // Comprehensive validation
    const validationResult = (0, ValidationSchemas_1.validateMcpConfig)(config);
    if (!validationResult.valid) {
        throw (0, ValidationSchemas_1.createValidationError)(validationResult);
    }
    // Log warnings if any
    if (validationResult.warnings.length > 0 && logger) {
        logger.warn('Configuration warnings:');
        validationResult.warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }
    return config;
}
async function loadAndParseMcpConfig(configPath, fetchConfig, logger) {
    try {
        logger?.info(`Loading MCP configuration from: ${configPath}`);
        const configContent = await fetchConfig(configPath);
        const rawConfig = parseJsonConfig(configContent);
        const mcpConfig = validateAndParseMcpConfig(rawConfig, logger);
        logger?.info(`Successfully loaded MCP config: ${mcpConfig.server.name} v${mcpConfig.server.version}`);
        logger?.info(`  Description: ${mcpConfig.server.description}`);
        logger?.info(`  Base URL: ${mcpConfig.api.baseUrl}`);
        logger?.info(`  Tools: ${mcpConfig.tools.length} registered`);
        return mcpConfig;
    }
    catch (error) {
        logger?.error('Failed to load MCP configuration:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
function validateConfig(config) {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Config must be a valid JSON object');
    }
}
async function loadAndParseConfig(configPath, fetchConfig) {
    console.warn('loadAndParseConfig is deprecated. Use loadAndParseMcpConfig for type-safe MCP configuration loading.');
    try {
        const configContent = await fetchConfig(configPath);
        const config = parseJsonConfig(configContent);
        validateConfig(config);
        return config;
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=config-parser.js.map