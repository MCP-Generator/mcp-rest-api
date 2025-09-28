import { Command } from 'commander';
export interface CliOptions {
    config: string;
    log: string;
}
export declare function createCliParser(): Command;
export declare function parseCliArguments(argv?: string[]): CliOptions;
//# sourceMappingURL=cli.d.ts.map