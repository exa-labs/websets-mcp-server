#!/usr/bin/env node
import { createServer } from "./server.js";

const { app } = createServer({ exaApiKey: process.env.EXA_API_KEY || '' });

const PORT = process.env.PORT || 7860;

app.listen(PORT, () => {
  console.log(`Websets MCP Server running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/message`);
});
