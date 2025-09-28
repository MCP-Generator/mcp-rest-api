import { isMcpServerConfig, McpServerConfig } from './types/McpConfig.js';
import { createValidationError, validateMcpConfig } from './types/ValidationSchemas.js';
import { Logger } from './utils/Logger.js';

export function parseJsonConfig(configContent: string): any {
    try {
        return JSON.parse(configContent);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in config: ${error.message}`);
        }
        throw new Error(
            `Failed to parse config: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export function validateAndParseMcpConfig(config: any, logger?: Logger): McpServerConfig {
    // Basic type guard check
    if (!isMcpServerConfig(config)) {
        throw new Error(
            'Config must be a valid MCP server configuration with server, api, and tools sections'
        );
    }

    // Comprehensive validation
    const validationResult = validateMcpConfig(config);
    if (!validationResult.valid) {
        throw createValidationError(validationResult);
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0 && logger) {
        logger.warn('Configuration warnings:');
        validationResult.warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }

    return config as McpServerConfig;
}

export async function loadAndParseMcpConfig(
    configPath: string,
    fetchConfig: (path: string) => Promise<string>,
    logger?: Logger
): Promise<McpServerConfig> {
    try {
        logger?.info(`Loading MCP configuration from: ${configPath}`);

        const configContent = await fetchConfig(configPath);
        const rawConfig = parseJsonConfig(configContent);
        const mcpConfig = validateAndParseMcpConfig(rawConfig, logger);

        logger?.info(
            `Successfully loaded MCP config: ${mcpConfig.server.name} v${mcpConfig.server.version}`
        );
        logger?.info(`  Description: ${mcpConfig.server.description}`);
        logger?.info(`  Base URL: ${mcpConfig.api.baseUrl}`);
        logger?.info(`  Tools: ${mcpConfig.tools.length} registered`);

        return mcpConfig;
    } catch (error) {
        logger?.error(
            'Failed to load MCP configuration:',
            error instanceof Error ? error.message : String(error)
        );
        throw error;
    }
}

// Legacy function for backward compatibility
export interface ConfigData {
    [key: string]: any;
}

export function validateConfig(config: ConfigData): void {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Config must be a valid JSON object');
    }
}

export async function loadAndParseConfig(
    configPath: string,
    fetchConfig: (path: string) => Promise<string>
): Promise<ConfigData> {
    console.warn(
        'loadAndParseConfig is deprecated. Use loadAndParseMcpConfig for type-safe MCP configuration loading.'
    );

    try {
        const configContent = await fetchConfig(configPath);
        const config = parseJsonConfig(configContent);
        validateConfig(config);
        return config;
    } catch (error) {
        throw error;
    }
}
