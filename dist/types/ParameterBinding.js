"use strict";
/**
 * Parameter binding and expression parsing utilities
 * Handles {args.param}, {env.VAR}, and {args.param || default} syntax
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterBindingError = exports.ParameterBinder = void 0;
/**
 * Regular expression to match parameter binding expressions
 * Supports:
 * - {args.paramName}
 * - {env.VAR_NAME}
 * - {args.paramName || defaultValue}
 */
const EXPRESSION_REGEX = /\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}/g;
/**
 * Parse and resolve parameter binding expressions
 */
class ParameterBinder {
    constructor(args, env = process.env) {
        this.context = { args, env };
    }
    /**
     * Resolve a value that may contain parameter binding expressions
     */
    resolve(value) {
        if (typeof value === 'string') {
            return this.resolveString(value);
        }
        if (Array.isArray(value)) {
            return value.map(item => this.resolve(item));
        }
        if (typeof value === 'object' && value !== null) {
            const resolved = {};
            for (const [key, val] of Object.entries(value)) {
                resolved[key] = this.resolve(val);
            }
            return resolved;
        }
        return value;
    }
    /**
     * Resolve parameter expressions in a string value
     */
    resolveString(value) {
        // If the entire string is a single expression, return the resolved value directly
        const singleExpressionMatch = value.match(/^\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}$/);
        if (singleExpressionMatch) {
            const expression = this.parseExpression(singleExpressionMatch);
            return expression.value;
        }
        // Replace all expressions in the string
        return value.replace(EXPRESSION_REGEX, match => {
            const expressionMatch = match.match(/^\{(args|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}$/);
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
    parseExpression(match) {
        const [, type, key, defaultValue] = match;
        let value;
        if (type === 'args') {
            value = this.context.args[key];
            if (value === undefined && defaultValue !== undefined) {
                value = this.parseDefaultValue(defaultValue);
            }
        }
        else if (type === 'env') {
            value = this.context.env[key];
            if (value === undefined && defaultValue !== undefined) {
                value = this.parseDefaultValue(defaultValue);
            }
        }
        return {
            type: type,
            key,
            defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined,
            value
        };
    }
    /**
     * Parse default value, handling basic type conversion
     */
    parseDefaultValue(defaultValue) {
        const trimmed = defaultValue.trim();
        // Handle quoted strings
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
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
    static extractExpressions(value) {
        const expressions = [];
        if (typeof value === 'string') {
            const matches = value.match(EXPRESSION_REGEX);
            if (matches) {
                expressions.push(...matches);
            }
        }
        else if (Array.isArray(value)) {
            for (const item of value) {
                expressions.push(...this.extractExpressions(item));
            }
        }
        else if (typeof value === 'object' && value !== null) {
            for (const val of Object.values(value)) {
                expressions.push(...this.extractExpressions(val));
            }
        }
        return expressions;
    }
    /**
     * Get all required argument parameters from expressions
     */
    static getRequiredArgs(expressions) {
        const required = new Set();
        for (const expr of expressions) {
            const match = expr.match(/^\{args\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}$/);
            if (match) {
                const [, key, defaultValue] = match;
                // Only required if no default value
                if (defaultValue === undefined) {
                    required.add(key);
                }
            }
        }
        return Array.from(required);
    }
    /**
     * Get all environment variables referenced in expressions
     */
    static getRequiredEnvVars(expressions) {
        const envVars = new Set();
        for (const expr of expressions) {
            const match = expr.match(/^\{env\.([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\|\|\s*([^}]+))?\}$/);
            if (match) {
                const [, key] = match;
                envVars.add(key);
            }
        }
        return Array.from(envVars);
    }
}
exports.ParameterBinder = ParameterBinder;
/**
 * Validation error for parameter binding
 */
class ParameterBindingError extends Error {
    constructor(message, expression, parameter) {
        super(message);
        this.expression = expression;
        this.parameter = parameter;
        this.name = 'ParameterBindingError';
    }
}
exports.ParameterBindingError = ParameterBindingError;
//# sourceMappingURL=ParameterBinding.js.map