"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchConfig = fetchConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
async function fetchConfig(configPath) {
    // Check if it's a URL
    if (configPath.startsWith('http://') || configPath.startsWith('https://')) {
        return await fetchConfigFromUrl(configPath);
    }
    else {
        return await fetchConfigFromFile(configPath);
    }
}
async function fetchConfigFromFile(filePath) {
    try {
        // Resolve the absolute path
        const absolutePath = path.resolve(filePath);
        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Config file not found: ${absolutePath}`);
        }
        // Read the file content
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        return fileContent;
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to read config file: ${String(error)}`);
    }
}
async function fetchConfigFromUrl(url) {
    try {
        const response = await axios_1.default.get(url, {
            timeout: 10000, // 10 seconds timeout
            responseType: 'text',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'mcp-rest-api/1.0.0'
            }
        });
        return response.data;
    }
    catch (error) {
        if (error?.isAxiosError || error?.response || error?.request) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout: Failed to fetch config within 10 seconds');
            }
            else if (error.response) {
                throw new Error(`Failed to fetch config from URL: HTTP ${error.response.status} ${error.response.statusText}`);
            }
            else if (error.request) {
                throw new Error(`Network error: Unable to reach ${url}`);
            }
        }
        throw new Error(`Failed to load config from URL: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=config-fetcher.js.map