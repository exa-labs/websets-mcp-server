/**
 * Simple logging utility for MCP server
 */
export const log = (message: string): void => {
  console.error(`[WEBSETS-MCP-DEBUG] ${message}`);
};

export const createRequestLogger = (requestId: string, toolName: string) => {
  return {
    log: (message: string): void => {
      log(`[${requestId}] [${toolName}] ${message}`);
    },
    start: (operation: string): void => {
      log(`[${requestId}] [${toolName}] Starting: ${operation}`);
    },
    error: (error: unknown): void => {
      log(`[${requestId}] [${toolName}] Error: ${error instanceof Error ? error.message : String(error)}`);
    },
    complete: (): void => {
      log(`[${requestId}] [${toolName}] Successfully completed request`);
    }
  };
};
