/**
 * Configurable logging utility for MCP REST API Server
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogDestination = 'none' | 'stdio' | string;
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}
/**
 * Configurable logger that supports silent, stdio, and file output
 */
export declare class Logger {
    private destination;
    constructor(destination?: LogDestination);
    /**
     * Log info level message
     */
    info(message: string, data?: any): void;
    /**
     * Log warning level message
     */
    warn(message: string, data?: any): void;
    /**
     * Log error level message
     */
    error(message: string, data?: any): void;
    /**
     * Log debug level message
     */
    debug(message: string, data?: any): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Log to stdout/stderr
     */
    private logToStdio;
    /**
     * Log to file (append mode)
     */
    private logToFile;
    /**
     * Format log message
     */
    private formatMessage;
    /**
     * Ensure log file directory exists
     */
    private ensureLogDirectory;
    /**
     * Get current log destination
     */
    getDestination(): LogDestination;
    /**
     * Check if logging is enabled
     */
    isEnabled(): boolean;
    /**
     * Create a silent logger (no output)
     */
    static createSilent(): Logger;
    /**
     * Create a stdio logger
     */
    static createStdio(): Logger;
    /**
     * Create a file logger
     */
    static createFile(filePath: string): Logger;
    /**
     * Parse log destination from CLI argument
     */
    static parseDestination(destination: string): LogDestination;
    /**
     * Validate log destination
     */
    static validateDestination(destination: string): {
        valid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=Logger.d.ts.map