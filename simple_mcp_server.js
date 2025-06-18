#!/usr/bin/env node
/**
 * Ultra-simple MCP Server for testing
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const server = new Server({
  name: 'simple-test-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'hello_world',
        description: 'Simple hello world test',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name to greet' }
          },
          required: ['name']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'hello_world') {
    return {
      content: [{
        type: 'text',
        text: `Hello, ${args.name}! MCP is working!`
      }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Simple MCP server running');
}

main().catch(console.error);