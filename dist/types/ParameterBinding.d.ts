/**
 * Parameter binding and expression parsing utilities
 * Handles {args.param}, {env.VAR}, and {args.param || default} syntax
 */
export interface ParameterContext {
    args: Record<string, any>;
    env: Record<string, string>;
}
export interface ParsedExpression {
    type: 'args' | 'env' | 'literal';
    key?: string;
    defaultValue?: any;
    value: any;
}
/**
 * Parse and resolve parameter binding expressions
 */
export declare class ParameterBinder {
    private context;
    constructor(args: Record<string, any>, env?: Record<string, string>);
    /**
     * Resolve a value that may contain parameter binding expressions
     */
    resolve(value: any): any;
    /**
     * Resolve parameter expressions in a string value
     */
    private resolveString;
    /**
     * Parse a single parameter expression
     */
    private parseExpression;
    /**
     * Parse default value, handling basic type conversion
     */
    private parseDefaultValue;
    /**
     * Extract all parameter expressions from a value
     */
    static extractExpressions(value: any): string[];
    /**
     * Get all required argument parameters from expressions
     */
    static getRequiredArgs(expressions: string[]): string[];
    /**
     * Get all environment variables referenced in expressions
     */
    static getRequiredEnvVars(expressions: string[]): string[];
}
/**
 * Validation error for parameter binding
 */
export declare class ParameterBindingError extends Error {
    expression?: string | undefined;
    parameter?: string | undefined;
    constructor(message: string, expression?: string | undefined, parameter?: string | undefined);
}
//# sourceMappingURL=ParameterBinding.d.ts.map