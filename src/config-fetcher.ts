import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export async function fetchConfig(configPath: string): Promise<string> {
    // Check if it's a URL
    if (configPath.startsWith('http://') || configPath.startsWith('https://')) {
        return await fetchConfigFromUrl(configPath);
    } else {
        return await fetchConfigFromFile(configPath);
    }
}

async function fetchConfigFromFile(filePath: string): Promise<string> {
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
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to read config file: ${String(error)}`);
    }
}

async function fetchConfigFromUrl(url: string): Promise<string> {
    try {
        const response = await axios.get<string>(url, {
            timeout: 10000, // 10 seconds timeout
            responseType: 'text',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'mcp-rest-api/1.0.0'
            }
        });

        return response.data;
    } catch (error: any) {
        if (error?.isAxiosError || error?.response || error?.request) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout: Failed to fetch config within 10 seconds');
            } else if (error.response) {
                throw new Error(
                    `Failed to fetch config from URL: HTTP ${error.response.status} ${error.response.statusText}`
                );
            } else if (error.request) {
                throw new Error(`Network error: Unable to reach ${url}`);
            }
        }
        throw new Error(
            `Failed to load config from URL: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
