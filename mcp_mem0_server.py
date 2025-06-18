#!/usr/bin/env python3
"""
MCP Server for mem0 integration with AnythingLLM
Provides memory management capabilities through MCP protocol
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

# MCP imports
try:
    from mcp.server import Server
    from mcp.server.models import InitializationOptions
    from mcp.server.stdio import stdio_server
    from mcp.types import Resource, Tool, TextContent, ImageContent, EmbeddedResource
except ImportError:
    print("MCP server dependencies not available. Install mcp package.", file=sys.stderr)
    sys.exit(1)

# mem0 client simulation (using requests to our mem0 API)
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration from environment variables
MEM0_BASE_URL = os.getenv("MEM0_BASE_URL", "http://mem0:8000")
MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")

class Mem0MCPServer:
    def __init__(self):
        self.server = Server("mem0-advanced-memory")
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def search_memories(self, user_id: str, query: str, top_k: int = 5) -> List[Dict]:
        """Search memories using mem0 API"""
        try:
            url = f"{MEM0_BASE_URL}/search"
            headers = {"Authorization": f"Bearer {MEM0_API_KEY}"} if MEM0_API_KEY else {}
            
            async with self.session.post(
                url,
                json={"user_id": user_id, "query": query, "top_k": top_k},
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("results", [])
                else:
                    logger.error(f"Failed to search memories: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []

    async def add_memory(self, user_id: str, messages: List[Dict]) -> Dict:
        """Add memory using mem0 API"""
        try:
            url = f"{MEM0_BASE_URL}/memories"
            headers = {"Authorization": f"Bearer {MEM0_API_KEY}"} if MEM0_API_KEY else {}
            
            async with self.session.post(
                url,
                json={"user_id": user_id, "messages": messages},
                headers=headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Failed to add memory: {response.status}")
                    return {"error": "Failed to add memory"}
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return {"error": str(e)}

    async def get_memories(self, user_id: str) -> List[Dict]:
        """Get all memories for user"""
        try:
            url = f"{MEM0_BASE_URL}/memories"
            headers = {"Authorization": f"Bearer {MEM0_API_KEY}"} if MEM0_API_KEY else {}
            
            async with self.session.get(
                url,
                params={"user_id": user_id},
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("results", [])
                else:
                    logger.error(f"Failed to get memories: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error getting memories: {e}")
            return []

    def setup_handlers(self):
        """Set up MCP handlers"""
        
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            """List available tools"""
            return [
                Tool(
                    name="search_memories",
                    description="Search user memories by query",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User identifier"},
                            "query": {"type": "string", "description": "Search query"},
                            "top_k": {"type": "integer", "default": 5, "description": "Number of results"}
                        },
                        "required": ["user_id", "query"]
                    }
                ),
                Tool(
                    name="add_memory",
                    description="Add new memory from conversation",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User identifier"},
                            "messages": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "role": {"type": "string"},
                                        "content": {"type": "string"}
                                    }
                                }
                            }
                        },
                        "required": ["user_id", "messages"]
                    }
                ),
                Tool(
                    name="get_all_memories",
                    description="Get all memories for a user",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User identifier"}
                        },
                        "required": ["user_id"]
                    }
                )
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Handle tool calls"""
            try:
                if name == "search_memories":
                    user_id = arguments["user_id"]
                    query = arguments["query"]
                    top_k = arguments.get("top_k", 5)
                    
                    memories = await self.search_memories(user_id, query, top_k)
                    
                    if memories:
                        result = "Found memories:\n"
                        for i, mem in enumerate(memories, 1):
                            result += f"{i}. {mem.get('memory', mem.get('content', 'No content'))}\n"
                    else:
                        result = "No memories found for the query."
                    
                    return [TextContent(type="text", text=result)]
                
                elif name == "add_memory":
                    user_id = arguments["user_id"]
                    messages = arguments["messages"]
                    
                    result = await self.add_memory(user_id, messages)
                    
                    return [TextContent(type="text", text=f"Memory added: {json.dumps(result)}")]
                
                elif name == "get_all_memories":
                    user_id = arguments["user_id"]
                    
                    memories = await self.get_memories(user_id)
                    
                    if memories:
                        result = f"User has {len(memories)} memories:\n"
                        for i, mem in enumerate(memories, 1):
                            result += f"{i}. {mem.get('memory', mem.get('content', 'No content'))}\n"
                    else:
                        result = "User has no memories."
                    
                    return [TextContent(type="text", text=result)]
                
                else:
                    return [TextContent(type="text", text=f"Unknown tool: {name}")]
                    
            except Exception as e:
                logger.error(f"Error in tool call {name}: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]

async def main():
    """Main server entry point"""
    logger.info("Starting mem0 MCP Server...")
    
    async with Mem0MCPServer() as server:
        server.setup_handlers()
        
        async with stdio_server() as (read_stream, write_stream):
            await server.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="mem0-advanced-memory",
                    server_version="1.0.0",
                    capabilities=server.server.get_capabilities(
                        notification_options=None,
                        experimental_capabilities=None,
                    ),
                ),
            )

if __name__ == "__main__":
    asyncio.run(main())