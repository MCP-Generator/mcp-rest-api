/**
 * JSON Schema validation utilities and enhanced validation functions
 */
import { McpConfigValidationError } from './McpConfig';
/**
 * Comprehensive validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
/**
 * Validate complete MCP server configuration
 */
export declare function validateMcpConfig(config: any): ValidationResult;
/**
 * Create a validation error from a validation result
 */
export declare function createValidationError(result: ValidationResult): McpConfigValidationError;
//# sourceMappingURL=ValidationSchemas.d.ts.map