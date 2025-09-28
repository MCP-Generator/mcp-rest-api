import { Command } from 'commander';
import { Logger } from './utils/Logger';

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
