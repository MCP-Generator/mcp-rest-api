/**
 * Configurable logging utility for MCP REST API Server
 */

import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogDestination = 'none' | 'stdio' | string; // string for file path

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

/**
 * Configurable logger that supports silent, stdio, and file output
 */
export class Logger {
    private destination: LogDestination;

    constructor(destination: LogDestination = 'none') {
        this.destination = destination;

        // Ensure file directory exists if logging to file
        if (this.destination !== 'none' && this.destination !== 'stdio') {
            this.ensureLogDirectory(this.destination);
        }
    }

    /**
     * Log info level message
     */
    info(message: string, data?: any): void {
        this.log('info', message, data);
    }

    /**
     * Log warning level message
     */
    warn(message: string, data?: any): void {
        this.log('warn', message, data);
    }

    /**
     * Log error level message
     */
    error(message: string, data?: any): void {
        this.log('error', message, data);
    }

    /**
     * Log debug level message
     */
    debug(message: string, data?: any): void {
        this.log('debug', message, data);
    }

    /**
     * Core logging method
     */
    private log(level: LogLevel, message: string, data?: any): void {
        if (this.destination === 'none') {
            return; // Silent mode
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };

        if (this.destination === 'stdio') {
            this.logToStdio(entry);
        } else {
            this.logToFile(entry, this.destination);
        }
    }

    /**
     * Log to stdout/stderr
     */
    private logToStdio(entry: LogEntry): void {
        const output = this.formatMessage(entry, false); // No timestamp for stdio

        switch (entry.level) {
            case 'error':
                process.stderr.write(output + '\n');
                break;
            case 'warn':
                process.stderr.write(output + '\n');
                break;
            case 'info':
            case 'debug':
            default:
                process.stdout.write(output + '\n');
                break;
        }
    }

    /**
     * Log to file (append mode)
     */
    private logToFile(entry: LogEntry, filePath: string): void {
        try {
            const output = this.formatMessage(entry, true); // Include timestamp for file
            fs.appendFileSync(filePath, output + '\n', 'utf8');
        } catch (error) {
            // If file logging fails, fall back to stderr
            process.stderr.write(
                `Logger Error: Failed to write to ${filePath}: ${error instanceof Error ? error.message : String(error)}\n`
            );
            process.stderr.write(`Original message: ${entry.message}\n`);
        }
    }

    /**
     * Format log message
     */
    private formatMessage(entry: LogEntry, includeTimestamp: boolean): string {
        const levelTag = `[${entry.level.toUpperCase()}]`;
        const timestamp = includeTimestamp ? `${entry.timestamp} ` : '';

        let message = `${timestamp}${levelTag} ${entry.message}`;

        if (entry.data !== undefined) {
            const dataStr =
                typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data);
            message += ` ${dataStr}`;
        }

        return message;
    }

    /**
     * Ensure log file directory exists
     */
    private ensureLogDirectory(filePath: string): void {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (error) {
            throw new Error(
                `Cannot create log directory for ${filePath}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Get current log destination
     */
    getDestination(): LogDestination {
        return this.destination;
    }

    /**
     * Check if logging is enabled
     */
    isEnabled(): boolean {
        return this.destination !== 'none';
    }

    /**
     * Create a silent logger (no output)
     */
    static createSilent(): Logger {
        return new Logger('none');
    }

    /**
     * Create a stdio logger
     */
    static createStdio(): Logger {
        return new Logger('stdio');
    }

    /**
     * Create a file logger
     */
    static createFile(filePath: string): Logger {
        return new Logger(filePath);
    }

    /**
     * Parse log destination from CLI argument
     */
    static parseDestination(destination: string): LogDestination {
        if (destination === 'none' || destination === 'stdio') {
            return destination;
        }

        // Treat anything else as a file path
        return destination;
    }

    /**
     * Validate log destination
     */
    static validateDestination(destination: string): { valid: boolean; error?: string } {
        if (destination === 'none' || destination === 'stdio') {
            return { valid: true };
        }

        // Validate file path
        try {
            const resolved = path.resolve(destination);
            const dir = path.dirname(resolved);

            // Check if we can create the directory
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                fs.rmSync(dir, { recursive: true }); // Clean up test directory
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: `Invalid log file path: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
