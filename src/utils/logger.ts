/**
 * Simple logging utility for MCP server
 */
export const log = (message: string, debug: boolean = true): void => {
  if (debug) {
    console.error(`[WEBSETS-MCP-DEBUG] ${message}`);
  }
};

export const createRequestLogger = (requestId: string, toolName: string, debug: boolean = false) => {
  return {
    log: (message: string): void => {
      log(`[${requestId}] [${toolName}] ${message}`, debug);
    },
    start: (operation: string): void => {
      log(`[${requestId}] [${toolName}] Starting: ${operation}`, debug);
    },
    error: (error: unknown): void => {
      log(`[${requestId}] [${toolName}] Error: ${error instanceof Error ? error.message : String(error)}`, debug);
    },
    complete: (): void => {
      log(`[${requestId}] [${toolName}] Successfully completed request`, debug);
    }
  };
};
