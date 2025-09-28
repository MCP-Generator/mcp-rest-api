#!/usr/bin/env node

import { Command } from 'commander';
import { Logger } from './utils/Logger.js';
import { fetchConfig } from './config-fetcher.js';
import { loadAndParseMcpConfig } from './config-parser.js';
import { McpServer } from './server/McpServer.js';

export interface CliOptions {
    config: string;
    log: string;
}

export function createCliParser(): Command {
    const program = new Command();

    program
        .name('mcp-rest-api')
        .description('A CLI tool that serves as an MCP Server for REST API interactions')
        .version('1.0.0')
        .requiredOption('-c, --config <path>', 'JSON config file path or URL')
        .option(
            '-l, --log <destination>',
            'Log destination: "none" (default), "stdio", or file path',
            'none'
        )
        .configureOutput({
            writeErr: error => process.stderr.write(`${error}`)
        });

    return program;
}

export function parseCliArguments(argv?: string[]): CliOptions {
    const program = createCliParser();
    program.parse(argv);
    const options = program.opts<CliOptions>();

    // Validate log destination
    const validation = Logger.validateDestination(options.log);
    if (!validation.valid) {
        console.error(`Error: ${validation.error}`);
        process.exit(1);
    }

    return options;
}

async function main(): Promise<void> {
    try {
        const options = parseCliArguments();

        // Initialize logger based on CLI options
        const logger = new Logger(Logger.parseDestination(options.log));

        logger.info('Generic MCP REST API Server');
        logger.info('============================');

        // Load and validate configuration
        const config = await loadAndParseMcpConfig(options.config, fetchConfig, logger);

        // Validate configuration
        const mcpServer = new McpServer(config, logger);
        const validation = mcpServer.validateConfiguration();

        if (!validation.valid) {
            logger.error('Configuration validation failed:');
            validation.errors.forEach(error => logger.error(`  - ${error}`));
            process.exit(1);
        }

        if (validation.warnings.length > 0) {
            logger.warn('Configuration warnings:');
            validation.warnings.forEach(warning => logger.warn(`  - ${warning}`));
        }

        logger.info('\nStarting MCP server...');

        // Start the MCP server
        await mcpServer.start();

        // The server will run indefinitely until terminated
    } catch (error) {
        // Use stderr for critical startup errors (even if logging is disabled)
        console.error(
            'Error starting MCP server:',
            error instanceof Error ? error.message : String(error)
        );

        if (error instanceof Error && error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }

        process.exit(1);
    }
}

// Handle graceful shutdown - use stderr for critical errors
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the CLI if this file is executed directly
if (require.main === module) {
    main();
}
