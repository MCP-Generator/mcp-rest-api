/**
 * HTTP request handler with parameter binding and response processing
 */
import { ApiConfiguration, ToolDefinition } from '../types/McpConfig';
import { Logger } from '../utils/Logger';
export interface RequestContext {
    tool: ToolDefinition;
    args: Record<string, any>;
}
export interface RequestResult {
    success: boolean;
    data?: any;
    error?: string;
    statusCode?: number;
    headers?: Record<string, string>;
}
/**
 * Handles HTTP request execution for MCP tools
 */
export declare class RequestHandler {
    private axiosInstance;
    private apiConfig;
    private logger;
    constructor(apiConfig: ApiConfiguration, logger?: Logger);
    /**
     * Create configured axios instance
     */
    private createAxiosInstance;
    /**
     * Execute a tool request
     */
    executeRequest(context: RequestContext): Promise<RequestResult>;
    /**
     * Build axios request configuration from tool definition
     */
    private buildRequestConfig;
    /**
     * Build URL with path parameter substitution
     */
    private buildUrl;
    /**
     * Clean parameters by removing undefined/null values
     */
    private cleanParams;
    /**
     * Process successful response
     */
    private processResponse;
    /**
     * Extract data from response using dot notation path
     */
    private extractResponseData;
    /**
     * Extract relevant headers from response
     */
    private extractRelevantHeaders;
    /**
     * Process request errors
     */
    private processError;
    /**
     * Validate that required arguments are provided
     */
    validateRequiredArguments(tool: ToolDefinition, args: Record<string, any>): string[];
    /**
     * Log outgoing HTTP request details
     */
    private logRequest;
    /**
     * Log HTTP response details
     */
    private logResponse;
    /**
     * Log HTTP error response details
     */
    private logErrorResponse;
    /**
     * Sanitize headers by masking sensitive information
     */
    private sanitizeHeaders;
    /**
     * Get the size of data for logging purposes
     */
    private getDataSize;
}
//# sourceMappingURL=RequestHandler.d.ts.map