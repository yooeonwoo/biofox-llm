#!/usr/bin/env node
/**
 * Simple MCP Server for mem0 coding preferences
 * Provides basic memory tools through MCP protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError 
} = require('@modelcontextprotocol/sdk/types.js');

const axios = require('axios');

// Configuration
const MEM0_BASE_URL = process.env.MEM0_BASE_URL || 'http://mem0:8000';
const MEM0_API_KEY = process.env.MEM0_API_KEY || '';

class Mem0SimpleMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mem0-coding-preferences',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_coding_preferences',
            description: 'Get user coding preferences and patterns from memory',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: {
                  type: 'string',
                  description: 'User identifier'
                },
                query: {
                  type: 'string',
                  description: 'Specific preference query (optional)',
                  default: 'coding preferences'
                }
              },
              required: ['user_id']
            }
          },
          {
            name: 'save_coding_preference',
            description: 'Save user coding preference to memory',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: {
                  type: 'string',
                  description: 'User identifier'
                },
                preference: {
                  type: 'string',
                  description: 'Coding preference to save'
                }
              },
              required: ['user_id', 'preference']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_coding_preferences':
            return await this.getCodingPreferences(args.user_id, args.query || 'coding preferences');
            
          case 'save_coding_preference':
            return await this.saveCodingPreference(args.user_id, args.preference);
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async getCodingPreferences(userId, query) {
    try {
      const response = await axios.post(`${MEM0_BASE_URL}/search`, {
        user_id: userId,
        query: query,
        top_k: 10
      }, {
        headers: MEM0_API_KEY ? { 'Authorization': `Bearer ${MEM0_API_KEY}` } : {}
      });

      const memories = response.data.results || [];
      
      if (memories.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No coding preferences found for this user.'
            }
          ]
        };
      }

      let result = 'Coding preferences found:\n\n';
      memories.forEach((mem, index) => {
        result += `${index + 1}. ${mem.memory || mem.content}\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ]
      };
    } catch (error) {
      console.error('Error getting coding preferences:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving preferences: ${error.message}`
          }
        ]
      };
    }
  }

  async saveCodingPreference(userId, preference) {
    try {
      const response = await axios.post(`${MEM0_BASE_URL}/memories`, {
        user_id: userId,
        messages: [
          {
            role: 'user',
            content: `My coding preference: ${preference}`
          },
          {
            role: 'assistant',
            content: 'I\'ll remember this coding preference for you.'
          }
        ]
      }, {
        headers: MEM0_API_KEY ? { 'Authorization': `Bearer ${MEM0_API_KEY}` } : {}
      });

      const result = response.data;

      return {
        content: [
          {
            type: 'text',
            text: `Coding preference saved successfully: ${JSON.stringify(result)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error saving coding preference:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error saving preference: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('mem0 simple MCP server running on stdio');
  }
}

// Start the server
async function main() {
  const server = new Mem0SimpleMCPServer();
  await server.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

module.exports = { Mem0SimpleMCPServer };