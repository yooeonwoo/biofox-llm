#!/usr/bin/env python3
import os

# Create a new mem0 configuration with adjusted settings
config_content = '''import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field

from mem0 import Memory

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load environment variables
load_dotenv()

POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "postgres")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
POSTGRES_COLLECTION_NAME = os.environ.get("POSTGRES_COLLECTION_NAME", "memories")

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USERNAME = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "mem0graph")

MEMGRAPH_URI = os.environ.get("MEMGRAPH_URI", "bolt://localhost:7687")
MEMGRAPH_USERNAME = os.environ.get("MEMGRAPH_USERNAME", "memgraph")
MEMGRAPH_PASSWORD = os.environ.get("MEMGRAPH_PASSWORD", "mem0graph")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
HISTORY_DB_PATH = os.environ.get("HISTORY_DB_PATH", "/app/history/history.db")

DEFAULT_CONFIG = {
    "version": "v1.1",
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "host": "qdrant",
            "port": 6333,
            "collection_name": "mem0",
        },
    },
    "llm": {
        "provider": "openai", 
        "config": {
            "api_key": OPENAI_API_KEY, 
            "temperature": 0.7,  # Increased from 0.2 for more flexible fact extraction
            "model": "gpt-4o"
        }
    },
    "embedder": {"provider": "openai", "config": {"api_key": OPENAI_API_KEY, "model": "text-embedding-3-small"}},
    "history_db_path": HISTORY_DB_PATH,
}

MEMORY_INSTANCE = Memory.from_config(DEFAULT_CONFIG)

app = FastAPI(
    title="Mem0 REST APIs",
    description="A REST API for managing and searching memories for your AI Agents and Apps.",
    version="1.0.0",
)
'''

# Write the rest of the file content (keeping everything else the same)
rest_of_file = '''

class Message(BaseModel):
    role: str = Field(..., description="Role of the message (user or assistant).")
    content: str = Field(..., description="Message content.")


class MemoryCreate(BaseModel):
    messages: List[Message] = Field(..., description="List of messages to store.")
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    run_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query.")
    user_id: Optional[str] = None
    run_id: Optional[str] = None
    agent_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    top_k: int = Field(5, description="Number of top results to return.")


@app.post("/configure", summary="Configure Mem0")
def set_config(config: Dict[str, Any]):
    """Set memory configuration."""
    global MEMORY_INSTANCE
    MEMORY_INSTANCE = Memory.from_config(config)
    return {"message": "Configuration set successfully"}


@app.post("/memories", summary="Create memories")
def add_memory(memory_create: MemoryCreate):
    """Store new memories."""
    if not any([memory_create.user_id, memory_create.agent_id, memory_create.run_id]):
        raise HTTPException(status_code=400, detail="At least one identifier (user_id, agent_id, run_id) is required.")

    params = {k: v for k, v in memory_create.model_dump().items() if v is not None and k != "messages"}
    try:
        response = MEMORY_INSTANCE.add(messages=[m.model_dump() for m in memory_create.messages], **params)
        return JSONResponse(content=response)
    except Exception as e:
        logging.error(f"Error creating memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memories", summary="Get memories")
def get_memories(
    user_id: Optional[str] = None, agent_id: Optional[str] = None, run_id: Optional[str] = None, limit: int = 100
):
    """Get list of memories based on filters."""
    if not any([user_id, agent_id, run_id]):
        raise HTTPException(
            status_code=400, detail="At least one identifier (user_id, agent_id, run_id) is required."
        )

    params = {"user_id": user_id, "agent_id": agent_id, "run_id": run_id, "limit": limit}
    params = {k: v for k, v in params.items() if v is not None}

    try:
        memories = MEMORY_INSTANCE.get_all(**params)
        return {"results": memories}
    except Exception as e:
        logging.error(f"Error getting memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memories/{memory_id}", summary="Get specific memory")
def get_memory(memory_id: str):
    """Get a specific memory by ID."""
    try:
        memory = MEMORY_INSTANCE.get(memory_id)
        if memory:
            return {"result": memory}
        else:
            raise HTTPException(status_code=404, detail="Memory not found")
    except Exception as e:
        logging.error(f"Error getting memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", summary="Search memories")
def search_memories(search_request: SearchRequest):
    """Search memories based on query."""
    if not any([search_request.user_id, search_request.agent_id, search_request.run_id]):
        raise HTTPException(
            status_code=400, detail="At least one identifier (user_id, agent_id, run_id) is required."
        )

    params = {k: v for k, v in search_request.model_dump().items() if v is not None and v != search_request.query}
    try:
        memories = MEMORY_INSTANCE.search(query=search_request.query, **params)
        return {"results": memories}
    except Exception as e:
        logging.error(f"Error searching memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/memories/{memory_id}", summary="Delete specific memory")
def delete_memory(memory_id: str):
    """Delete a specific memory by ID."""
    try:
        MEMORY_INSTANCE.delete(memory_id)
        return {"message": f"Memory {memory_id} deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/memories", summary="Delete all memories")
def delete_all_memories(user_id: Optional[str] = None, agent_id: Optional[str] = None, run_id: Optional[str] = None):
    """Delete all memories based on filters."""
    if not any([user_id, agent_id, run_id]):
        raise HTTPException(
            status_code=400, detail="At least one identifier (user_id, agent_id, run_id) is required."
        )

    params = {"user_id": user_id, "agent_id": agent_id, "run_id": run_id}
    params = {k: v for k, v in params.items() if v is not None}

    try:
        MEMORY_INSTANCE.delete_all(**params)
        return {"message": "Memories deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/memories/{memory_id}", summary="Update memory")
def update_memory(memory_id: str, data: str):
    """Update an existing memory."""
    try:
        result = MEMORY_INSTANCE.update(memory_id, data)
        return {"result": result}
    except Exception as e:
        logging.error(f"Error updating memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", include_in_schema=False)
def read_root():
    return RedirectResponse(url="/docs")


@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "healthy"}


@app.get("/history/{session_id}", summary="Get history")
def get_history(session_id: str):
    """Get history for a session."""
    try:
        history = MEMORY_INSTANCE.history(session_id)
        return {"results": history}
    except Exception as e:
        logging.error(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
'''

print(config_content + rest_of_file)