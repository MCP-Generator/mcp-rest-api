"use strict";
/**
 * Configurable logging utility for MCP REST API Server
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Configurable logger that supports silent, stdio, and file output
 */
class Logger {
    constructor(destination = 'none') {
        this.destination = destination;
        // Ensure file directory exists if logging to file
        if (this.destination !== 'none' && this.destination !== 'stdio') {
            this.ensureLogDirectory(this.destination);
        }
    }
    /**
     * Log info level message
     */
    info(message, data) {
        this.log('info', message, data);
    }
    /**
     * Log warning level message
     */
    warn(message, data) {
        this.log('warn', message, data);
    }
    /**
     * Log error level message
     */
    error(message, data) {
        this.log('error', message, data);
    }
    /**
     * Log debug level message
     */
    debug(message, data) {
        this.log('debug', message, data);
    }
    /**
     * Core logging method
     */
    log(level, message, data) {
        if (this.destination === 'none') {
            return; // Silent mode
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        if (this.destination === 'stdio') {
            this.logToStdio(entry);
        }
        else {
            this.logToFile(entry, this.destination);
        }
    }
    /**
     * Log to stdout/stderr
     */
    logToStdio(entry) {
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
    logToFile(entry, filePath) {
        try {
            const output = this.formatMessage(entry, true); // Include timestamp for file
            fs.appendFileSync(filePath, output + '\n', 'utf8');
        }
        catch (error) {
            // If file logging fails, fall back to stderr
            process.stderr.write(`Logger Error: Failed to write to ${filePath}: ${error instanceof Error ? error.message : String(error)}\n`);
            process.stderr.write(`Original message: ${entry.message}\n`);
        }
    }
    /**
     * Format log message
     */
    formatMessage(entry, includeTimestamp) {
        const levelTag = `[${entry.level.toUpperCase()}]`;
        const timestamp = includeTimestamp ? `${entry.timestamp} ` : '';
        let message = `${timestamp}${levelTag} ${entry.message}`;
        if (entry.data !== undefined) {
            const dataStr = typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data);
            message += ` ${dataStr}`;
        }
        return message;
    }
    /**
     * Ensure log file directory exists
     */
    ensureLogDirectory(filePath) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
        catch (error) {
            throw new Error(`Cannot create log directory for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get current log destination
     */
    getDestination() {
        return this.destination;
    }
    /**
     * Check if logging is enabled
     */
    isEnabled() {
        return this.destination !== 'none';
    }
    /**
     * Create a silent logger (no output)
     */
    static createSilent() {
        return new Logger('none');
    }
    /**
     * Create a stdio logger
     */
    static createStdio() {
        return new Logger('stdio');
    }
    /**
     * Create a file logger
     */
    static createFile(filePath) {
        return new Logger(filePath);
    }
    /**
     * Parse log destination from CLI argument
     */
    static parseDestination(destination) {
        if (destination === 'none' || destination === 'stdio') {
            return destination;
        }
        // Treat anything else as a file path
        return destination;
    }
    /**
     * Validate log destination
     */
    static validateDestination(destination) {
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
        }
        catch (error) {
            return {
                valid: false,
                error: `Invalid log file path: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map