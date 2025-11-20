/**
 * HTTP utilities for Websets MCP server
 * 
 * Provides shared axios client creation and error handling to reduce code duplication
 * across tool implementations.
 * 
 * Header author: Devin AI (claude-sonnet-4-20250514)
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { API_CONFIG } from "../tools/config.js";

export interface HttpConfig {
  exaApiKey?: string;
  debug?: boolean;
}

/**
 * Creates a configured axios instance for Websets API calls
 * 
 * @param config - Configuration including API key and debug flag
 * @returns Configured axios instance
 * @throws Error if API key is missing
 */
export function createAxiosClient(config?: HttpConfig): AxiosInstance {
  const apiKey = config?.exaApiKey || process.env.EXA_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'Missing EXA_API_KEY: Please provide an API key via the exaApiKey config parameter or EXA_API_KEY environment variable. ' +
      'Get your API key at https://dashboard.exa.ai/api-keys'
    );
  }

  return axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'x-api-key': apiKey
    },
    timeout: 30000
  });
}

/**
 * Formats an error response for MCP tool output
 * 
 * @param error - The error to format
 * @param toolName - Name of the tool that encountered the error
 * @param includeHelp - Whether to include helpful format examples for 400 errors
 * @returns Formatted error message
 */
export function formatApiError(
  error: unknown,
  toolName: string,
  includeHelp: boolean = false
): string {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status || 'unknown';
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data?.details || '';
    
    let message = `Error in ${toolName} (${statusCode}): ${errorMessage}`;
    
    if (errorDetails) {
      message += `\nDetails: ${errorDetails}`;
    }
    
    if (statusCode === 401) {
      message += '\n\nThis error indicates your API key is invalid or missing. Please check your EXA_API_KEY.';
    } else if (statusCode === 404) {
      message += '\n\nThe requested resource was not found. Please verify the ID is correct.';
    } else if (statusCode === 429) {
      message += '\n\nRate limit exceeded. Please wait before making more requests.';
    }
    
    if (includeHelp && statusCode === 400) {
      message += '\n\nCommon issues:\n' +
        '- criteria must be array of objects: [{description: "criterion"}]\n' +
        '- entity must be object: {type: "company"}\n' +
        '- options must be array of objects: [{label: "option"}]\n' +
        '- Numeric parameters must be positive integers';
    }
    
    return message;
  }
  
  return `Error in ${toolName}: ${error instanceof Error ? error.message : String(error)}`;
}
