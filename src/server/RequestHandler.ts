/**
 * HTTP request handler with parameter binding and response processing
 */

import axios from 'axios';
import { ApiConfiguration, ToolDefinition } from '../types/McpConfig';
import { ParameterBinder, ParameterBindingError } from '../types/ParameterBinding';
import { Logger } from '../utils/Logger';
import AxiosInstance = Axios.AxiosInstance;

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
export class RequestHandler {
    private axiosInstance: AxiosInstance;
    private apiConfig: ApiConfiguration;
    private logger: Logger;

    constructor(apiConfig: ApiConfiguration, logger?: Logger) {
        this.apiConfig = apiConfig;
        this.logger = logger || Logger.createSilent();
        this.axiosInstance = this.createAxiosInstance();
    }

    /**
     * Create configured axios instance
     */
    private createAxiosInstance(): AxiosInstance {
        const config: any = {
            baseURL: this.apiConfig.baseUrl,
            timeout: this.apiConfig.timeout || 30000,
            headers: {
                ...this.apiConfig.headers
            }
        };
        const binder = new ParameterBinder({});
        if (this.apiConfig.headers) {
            const resolvedHeaders = binder.resolve(this.apiConfig.headers);
            config.headers = { ...config.headers, ...resolvedHeaders };
        }

        if (this.apiConfig.rejectUnauthorized === false) {
            // Note: This is for development/testing only
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        }

        return axios.create(config);
    }

    /**
     * Execute a tool request
     */
    async executeRequest(context: RequestContext): Promise<RequestResult> {
        try {
            // Create parameter binder
            const binder = new ParameterBinder(context.args);

            // Build the request configuration
            const requestConfig = await this.buildRequestConfig(context.tool, binder);

            // Log the outgoing request
            this.logRequest(context.tool, requestConfig);

            // Execute the request
            const response = await this.axiosInstance.request(requestConfig);

            // Log the response
            this.logResponse(context.tool, response);

            // Process the response
            return this.processResponse(response, context.tool);
        } catch (error) {
            // Log the error response if it's an HTTP error
            if (error && (error as any).isAxiosError && (error as any).response) {
                this.logErrorResponse(context.tool, (error as any).response);
            }
            return this.processError(error);
        }
    }

    /**
     * Build axios request configuration from tool definition
     */
    private async buildRequestConfig(tool: ToolDefinition, binder: ParameterBinder): Promise<any> {
        const config: any = {
            method: tool.method.toLowerCase() as any,
            url: this.buildUrl(tool, binder),
            headers: {},
            params: {},
            data: undefined
        };

        // Resolve headers
        if (tool.headers) {
            const resolvedHeaders = binder.resolve(tool.headers);
            config.headers = { ...config.headers, ...resolvedHeaders };
        }

        // Resolve query parameters
        if (tool.queryParams) {
            const resolvedParams = binder.resolve(tool.queryParams);
            config.params = this.cleanParams(resolvedParams);
        }

        // Resolve request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(tool.method) && tool.bodyTemplate) {
            config.data = binder.resolve(tool.bodyTemplate);
        }

        return config;
    }

    /**
     * Build URL with path parameter substitution
     */
    private buildUrl(tool: ToolDefinition, binder: ParameterBinder): string {
        let url = tool.path;

        if (tool.pathParams) {
            const resolvedPathParams = binder.resolve(tool.pathParams);

            for (const [param, value] of Object.entries(resolvedPathParams)) {
                if (value !== undefined && value !== null) {
                    url = url.replace(`{${param}}`, encodeURIComponent(String(value)));
                }
            }
        }

        // Check for unresolved placeholders
        const unresolvedPlaceholders = url.match(/\{[^}]+\}/g);
        if (unresolvedPlaceholders) {
            throw new ParameterBindingError(
                `Unresolved path parameters: ${unresolvedPlaceholders.join(', ')}`,
                undefined,
                unresolvedPlaceholders[0]
            );
        }

        return url;
    }

    /**
     * Clean parameters by removing undefined/null values
     */
    private cleanParams(params: Record<string, any>): Record<string, any> {
        const cleaned: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value;
            }
        }

        return cleaned;
    }

    /**
     * Process successful response
     */
    private processResponse(response: any, tool: ToolDefinition): RequestResult {
        let data = response.data;

        // Apply response transformation if specified
        if (tool.responseTransform) {
            try {
                // Simple dot-notation path access for now
                data = this.extractResponseData(data, tool.responseTransform);
            } catch (error) {
                this.logger.warn(`Response transformation failed for tool ${tool.name}:`, error);
                // Continue with original data if transformation fails
            }
        }

        return {
            success: true,
            data,
            statusCode: response.status,
            headers: this.extractRelevantHeaders(response.headers)
        };
    }

    /**
     * Extract data from response using dot notation path
     */
    private extractResponseData(data: any, path: string): any {
        const parts = path.split('.');
        let result = data;

        for (const part of parts) {
            if (result && typeof result === 'object' && part in result) {
                result = result[part];
            } else {
                throw new Error(`Path "${path}" not found in response data`);
            }
        }

        return result;
    }

    /**
     * Extract relevant headers from response
     */
    private extractRelevantHeaders(headers: any): Record<string, string> {
        const relevant: Record<string, string> = {};
        const relevantHeaderNames = [
            'content-type',
            'content-length',
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'x-ratelimit-reset'
        ];

        for (const headerName of relevantHeaderNames) {
            if (headers[headerName]) {
                relevant[headerName] = headers[headerName];
            }
        }

        return relevant;
    }

    /**
     * Process request errors
     */
    private processError(error: any): RequestResult {
        if (error instanceof ParameterBindingError) {
            return {
                success: false,
                error: `Parameter binding error: ${error.message}`,
                statusCode: 400
            };
        }

        if (error && error.isAxiosError) {
            const statusCode = error.response?.status || 500;
            let errorMessage = 'Request failed';

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
            } else if (error.response) {
                errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
                if (error.response.data && typeof error.response.data === 'object') {
                    const errorData = error.response.data as any;
                    if (errorData.error) {
                        errorMessage += ` - ${errorData.error}`;
                    } else if (errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                }
            } else if (error.request) {
                errorMessage = 'Network error: Unable to reach the server';
            }

            return {
                success: false,
                error: errorMessage,
                statusCode,
                data: error.response?.data
            };
        }

        return {
            success: false,
            error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
            statusCode: 500
        };
    }

    /**
     * Validate that required arguments are provided
     */
    validateRequiredArguments(tool: ToolDefinition, args: Record<string, any>): string[] {
        const errors: string[] = [];

        if (tool.inputSchema.required) {
            for (const requiredField of tool.inputSchema.required) {
                if (
                    !(requiredField in args) ||
                    args[requiredField] === undefined ||
                    args[requiredField] === null
                ) {
                    errors.push(`Missing required argument: ${requiredField}`);
                }
            }
        }

        return errors;
    }

    /**
     * Log outgoing HTTP request details
     */
    private logRequest(tool: ToolDefinition, requestConfig: any): void {
        const fullUrl = `${this.apiConfig.baseUrl}${requestConfig.url}`;

        this.logger.info(`🔄 HTTP Request [${tool.name}]`);
        this.logger.info(`   Method: ${requestConfig.method.toUpperCase()}`);
        this.logger.info(`   URL: ${fullUrl}`);

        if (Object.keys(requestConfig.params || {}).length > 0) {
            this.logger.info('   Query Params:', requestConfig.params);
        }

        if (Object.keys(requestConfig.headers || {}).length > 0) {
            const sanitizedHeaders = this.sanitizeHeaders(requestConfig.headers);
            this.logger.info('   Headers:', sanitizedHeaders);
        }

        if (requestConfig.data !== undefined) {
            this.logger.info('   Body:', requestConfig.data);
        }
    }

    /**
     * Log HTTP response details
     */
    private logResponse(tool: ToolDefinition, response: any): void {
        this.logger.info(`✅ HTTP Response [${tool.name}]`);
        this.logger.info(`   Status: ${response.status} ${response.statusText}`);

        if (Object.keys(response.headers || {}).length > 0) {
            const sanitizedHeaders = this.sanitizeHeaders(response.headers);
            this.logger.info('   Headers:', sanitizedHeaders);
        }

        if (response.data !== undefined) {
            const dataSize = this.getDataSize(response.data);
            if (dataSize > 1000) {
                this.logger.info(
                    `   Body: [${dataSize} chars] ${JSON.stringify(response.data).substring(0, 200)}...`
                );
            } else {
                this.logger.info('   Body:', response.data);
            }
        }
    }

    /**
     * Log HTTP error response details
     */
    private logErrorResponse(tool: ToolDefinition, errorResponse: any): void {
        this.logger.error(`❌ HTTP Error Response [${tool.name}]`);
        this.logger.error(`   Status: ${errorResponse.status} ${errorResponse.statusText}`);

        if (Object.keys(errorResponse.headers || {}).length > 0) {
            const sanitizedHeaders = this.sanitizeHeaders(errorResponse.headers);
            this.logger.error('   Headers:', sanitizedHeaders);
        }

        if (errorResponse.data !== undefined) {
            this.logger.error('   Error Body:', errorResponse.data);
        }
    }

    /**
     * Sanitize headers by masking sensitive information
     */
    private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};
        const sensitiveHeaders = [
            'authorization',
            'x-api-key',
            'x-auth-token',
            'cookie',
            'set-cookie'
        ];

        for (const [key, value] of Object.entries(headers || {})) {
            if (sensitiveHeaders.includes(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Get the size of data for logging purposes
     */
    private getDataSize(data: any): number {
        if (typeof data === 'string') {
            return data.length;
        } else if (data && typeof data === 'object') {
            return JSON.stringify(data).length;
        }
        return 0;
    }
}
