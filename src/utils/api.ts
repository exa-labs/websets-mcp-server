import axios, { AxiosInstance, AxiosError } from "axios";
import { API_CONFIG } from "../tools/config.js";

export class ExaApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("EXA_API_KEY is required. Please provide it in the configuration.");
    }

    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 30000
    });
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export interface McpErrorResponse {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
}

export function handleApiError(
  error: unknown, 
  logger: { log: (msg: string) => void, error: (err: unknown) => void },
  contextMessage: string,
  helpTextGenerator?: (statusCode: number) => string
): McpErrorResponse {
  logger.error(error);
  
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status || 'unknown';
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data?.details || '';
    
    logger.log(`API error (${statusCode}): ${errorMessage}`);
    
    let helpText = '';
    if (helpTextGenerator && typeof statusCode === 'number') {
      helpText = helpTextGenerator(statusCode);
    }
    
    return {
      content: [{
        type: "text" as const,
        text: `Error ${contextMessage} (${statusCode}): ${errorMessage}${errorDetails ? '\nDetails: ' + errorDetails : ''}${helpText}`
      }],
      isError: true,
    };
  }
  
  return {
    content: [{
      type: "text" as const,
      text: `Error ${contextMessage}: ${error instanceof Error ? error.message : String(error)}`
    }],
    isError: true,
  };
}
