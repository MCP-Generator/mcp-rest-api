/**
 * Parameter binding and expression parsing utilities
 * Handles {args.param}, {env.VAR}, {args.param || default}, and {args.param?} syntax
 */

/**
 * Special marker to indicate a parameter should be omitted from the request
 */
export const OMIT_MARKER = Symbol('OMIT');

export interface ParameterContext {
    args: Record<string, any>;
    env: Record<string, string>;
}

export interface ParsedExpression {
    type: 'args' | 'env' | 'literal';
    key?: string;
    defaultValue?: any;
    optional?: boolean;
    value: any;
}

/**
 * Regular expression to match parameter binding expressions
 * Supports:
 * - {args.paramName}
 * - {env.VAR_NAME}
 * - {args.paramName || defaultValue}
 * - {args.paramName?} (optional - omit if not provided)
 */
const EXPRESSION_REGEX = /\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\??\s*(?:\|\|\s*([^}]+))?\}/g;

/**
 * Parse and resolve parameter binding expressions
 */
export class ParameterBinder {
    private context: ParameterContext;

    constructor(
        args: Record<string, any>,
        env: Record<string, string> = process.env as Record<string, string>
    ) {
        this.context = { args, env };
    }

    /**
     * Resolve a value that may contain parameter binding expressions
     */
    resolve(value: any): any {
        if (typeof value === 'string') {
            return this.resolveString(value);
        }

        if (Array.isArray(value)) {
            return value.map(item => this.resolve(item));
        }

        if (typeof value === 'object' && value !== null) {
            const resolved: Record<string, any> = {};
            for (const [key, val] of Object.entries(value)) {
                const resolvedVal = this.resolve(val);
                // Only include the key if the resolved value is not the OMIT_MARKER
                if (resolvedVal !== OMIT_MARKER) {
                    resolved[key] = resolvedVal;
                }
            }
            return resolved;
        }

        return value;
    }

    /**
     * Resolve parameter expressions in a string value
     */
    private resolveString(value: string): any {
        // If the entire string is a single expression, return the resolved value directly
        const singleExpressionMatch = value.match(
            /^\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\??\s*(?:\|\|\s*([^}]+))?\}$/
        );
        if (singleExpressionMatch) {
            const expression = this.parseExpression(singleExpressionMatch);
            return expression.value;
        }

        // Replace all expressions in the string
        return value.replace(EXPRESSION_REGEX, match => {
            const expressionMatch = match.match(
                /^\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\??\s*(?:\|\|\s*([^}]+))?\}$/
            );
            if (expressionMatch) {
                const expression = this.parseExpression(expressionMatch);
                return String(expression.value);
            }
            return match;
        });
    }

    /**
     * Parse a single parameter expression
     */
    private parseExpression(match: RegExpMatchArray): ParsedExpression {
        const fullMatch = match[0];
        const type = match[1];
        const key = match[2];
        const defaultValue = match[3];

        // Check if this is an optional parameter (ends with ?)
        const isOptional = fullMatch.includes('?');

        let value: any;

        if (type === 'args') {
            value = this.context.args[key];
            if (value === undefined) {
                if (defaultValue !== undefined) {
                    value = this.parseDefaultValue(defaultValue);
                } else if (isOptional) {
                    value = OMIT_MARKER;
                }
            }
        } else if (type === 'env') {
            value = this.context.env[key];
            if (value === undefined) {
                if (defaultValue !== undefined) {
                    value = this.parseDefaultValue(defaultValue);
                } else if (isOptional) {
                    value = OMIT_MARKER;
                }
            }
        }

        return {
            type: type as 'args' | 'env',
            key,
            defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined,
            optional: isOptional,
            value
        };
    }

    /**
     * Parse default value, handling basic type conversion
     */
    private parseDefaultValue(defaultValue: string): any {
        const trimmed = defaultValue.trim();

        // Handle quoted strings
        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
            return trimmed.slice(1, -1);
        }

        // Handle numbers
        if (/^\d+$/.test(trimmed)) {
            return parseInt(trimmed, 10);
        }

        if (/^\d+\.\d+$/.test(trimmed)) {
            return parseFloat(trimmed);
        }

        // Handle booleans
        if (trimmed === 'true') {
            return true;
        }
        if (trimmed === 'false') {
            return false;
        }

        // Handle null/undefined
        if (trimmed === 'null') {
            return null;
        }
        if (trimmed === 'undefined') {
            return undefined;
        }

        // Return as string for everything else
        return trimmed;
    }

    /**
     * Extract all parameter expressions from a value
     */
    static extractExpressions(value: any): string[] {
        const expressions: string[] = [];

        if (typeof value === 'string') {
            const matches = value.match(EXPRESSION_REGEX);
            if (matches) {
                expressions.push(...matches);
            }
        } else if (Array.isArray(value)) {
            for (const item of value) {
                expressions.push(...this.extractExpressions(item));
            }
        } else if (typeof value === 'object' && value !== null) {
            for (const val of Object.values(value)) {
                expressions.push(...this.extractExpressions(val));
            }
        }

        return expressions;
    }

    /**
     * Get all required argument parameters from expressions
     */
    static getRequiredArgs(expressions: string[]): string[] {
        const required: Set<string> = new Set();

        for (const expr of expressions) {
            const match = expr.match(
                /^\{args\.([a-zA-Z_][a-zA-Z0-9_]*)\??\s*(?:\|\|\s*([^}]+))?\}$/
            );
            if (match) {
                const [, key, defaultValue] = match;
                const isOptional = expr.includes('?');
                // Only required if no default value and not optional
                if (defaultValue === undefined && !isOptional) {
                    required.add(key);
                }
            }
        }

        return Array.from(required);
    }

    /**
     * Get all environment variables referenced in expressions
     */
    static getRequiredEnvVars(expressions: string[]): string[] {
        const envVars: Set<string> = new Set();

        for (const expr of expressions) {
            const match = expr.match(
                /^\{env\.([a-zA-Z_][a-zA-Z0-9_]*)\??\s*(?:\|\|\s*([^}]+))?\}$/
            );
            if (match) {
                const [, key] = match;
                envVars.add(key);
            }
        }

        return Array.from(envVars);
    }
}

/**
 * Validation error for parameter binding
 */
export class ParameterBindingError extends Error {
    constructor(
        message: string,
        public expression?: string,
        public parameter?: string
    ) {
        super(message);
        this.name = 'ParameterBindingError';
    }
}
