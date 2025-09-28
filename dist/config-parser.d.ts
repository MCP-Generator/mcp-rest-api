import { McpServerConfig } from './types/McpConfig';
import { Logger } from './utils/Logger';
export declare function parseJsonConfig(configContent: string): any;
export declare function validateAndParseMcpConfig(config: any, logger?: Logger): McpServerConfig;
export declare function loadAndParseMcpConfig(configPath: string, fetchConfig: (path: string) => Promise<string>, logger?: Logger): Promise<McpServerConfig>;
export interface ConfigData {
    [key: string]: any;
}
export declare function validateConfig(config: ConfigData): void;
export declare function loadAndParseConfig(configPath: string, fetchConfig: (path: string) => Promise<string>): Promise<ConfigData>;
//# sourceMappingURL=config-parser.d.ts.map