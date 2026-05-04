import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { initializeMcpServer } from "../mcp-handler.js";
type JsonSchemaProperty = {
  type?: string;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
};

const JsonSchemaPropertySchema: z.ZodType<JsonSchemaProperty> = z.lazy(() => z.object({
  type: z.string().optional(),
  items: JsonSchemaPropertySchema.optional(),
  properties: z.record(JsonSchemaPropertySchema).optional()
}).passthrough());

const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string()
});

async function createTestClient(enabledTools: string[]) {
  const server = new McpServer({
    name: "websets-server-test",
    version: "1.0.1"
  });
  initializeMcpServer(server, { enabledTools });

  const client = new Client({
    name: "websets-test-client",
    version: "1.0.0"
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport)
  ]);

  return { client, close: () => client.close() };
}

describe("scope input schemas", () => {
  it("exposes create_search.scope as an array schema", async () => {
    const { client, close } = await createTestClient(["create_search"]);

    try {
      const { tools } = await client.listTools();
      const createSearch = tools.find((tool) => tool.name === "create_search");
      expect(createSearch).toBeDefined();

      const scope = JsonSchemaPropertySchema.parse(createSearch?.inputSchema.properties?.scope);
      expect(scope?.type).toBe("array");
      expect(scope?.items?.properties?.source?.type).toBe("string");
      expect(scope?.items?.properties?.id?.type).toBe("string");
      expect(scope?.items?.properties?.relationship?.type).toBe("object");
    } finally {
      await close();
    }
  });

  it("accepts array scope and rejects object scope for create_search", async () => {
    const { client, close } = await createTestClient(["create_search"]);

    try {
      const accepted = await client.callTool({
        name: "create_search",
        arguments: {
          websetId: "webset_123",
          query: "AI startups",
          scope: [{ source: "import", id: "import_123" }]
        }
      });
      const acceptedContent = z.object({ content: z.array(TextContentSchema).min(1) }).parse(accepted);
      const acceptedText = acceptedContent.content[0].text;
      expect(acceptedText).toContain("Error creating search");
      expect(acceptedText).not.toContain("Input validation error");

      const rejected = await client.callTool({
        name: "create_search",
        arguments: {
          websetId: "webset_123",
          query: "AI startups",
          scope: { source: "import", id: "import_123" }
        }
      });
      expect(rejected.isError).toBe(true);
      const rejectedContent = z.object({ content: z.array(TextContentSchema).min(1) }).parse(rejected);
      const rejectedText = rejectedContent.content[0].text;
      expect(rejectedText).toContain("Input validation error");
      expect(rejectedText).toContain("Expected array");
    } finally {
      await close();
    }
  });

  it("exposes create_webset.searchScope as an array schema", async () => {
    const { client, close } = await createTestClient(["create_webset"]);

    try {
      const { tools } = await client.listTools();
      const createWebset = tools.find((tool) => tool.name === "create_webset");
      expect(createWebset).toBeDefined();

      const searchScope = JsonSchemaPropertySchema.parse(
        createWebset?.inputSchema.properties?.searchScope
      );
      expect(searchScope?.type).toBe("array");
      expect(searchScope?.items?.properties?.source?.type).toBe("string");
      expect(searchScope?.items?.properties?.id?.type).toBe("string");
      expect(searchScope?.items?.properties?.relationship?.type).toBe("object");
    } finally {
      await close();
    }
  });

  it("accepts array searchScope and rejects object searchScope for create_webset", async () => {
    const { client, close } = await createTestClient(["create_webset"]);

    try {
      const accepted = await client.callTool({
        name: "create_webset",
        arguments: {
          searchQuery: "AI startups",
          searchScope: [{ source: "import", id: "import_123" }]
        }
      });
      const acceptedContent = z.object({ content: z.array(TextContentSchema).min(1) }).parse(accepted);
      const acceptedText = acceptedContent.content[0].text;
      expect(acceptedText).toContain("Error creating webset");
      expect(acceptedText).not.toContain("Input validation error");

      const rejected = await client.callTool({
        name: "create_webset",
        arguments: {
          searchQuery: "AI startups",
          searchScope: { source: "import", id: "import_123" }
        }
      });
      expect(rejected.isError).toBe(true);
      const rejectedContent = z.object({ content: z.array(TextContentSchema).min(1) }).parse(rejected);
      const rejectedText = rejectedContent.content[0].text;
      expect(rejectedText).toContain("Input validation error");
      expect(rejectedText).toContain("Expected array");
    } finally {
      await close();
    }
  });
});
