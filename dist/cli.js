"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCliParser = createCliParser;
exports.parseCliArguments = parseCliArguments;
const commander_1 = require("commander");
const Logger_1 = require("./utils/Logger");
function createCliParser() {
    const program = new commander_1.Command();
    program
        .name('mcp-rest-api')
        .description('A CLI tool that serves as an MCP Server for REST API interactions')
        .version('1.0.0')
        .requiredOption('-c, --config <path>', 'JSON config file path or URL')
        .option('-l, --log <destination>', 'Log destination: "none" (default), "stdio", or file path', 'none')
        .configureOutput({
        writeErr: error => process.stderr.write(`${error}`)
    });
    return program;
}
function parseCliArguments(argv) {
    const program = createCliParser();
    program.parse(argv);
    const options = program.opts();
    // Validate log destination
    const validation = Logger_1.Logger.validateDestination(options.log);
    if (!validation.valid) {
        console.error(`Error: ${validation.error}`);
        process.exit(1);
    }
    return options;
}
//# sourceMappingURL=cli.js.map