const { User } = require("../../../models/user");
const { reqBody, userFromSession } = require("../../../utils/http");
const { searchMemory, shouldUseMem0 } = require("../../../utils/memoryProvider");
const axios = require("axios");

const BASE_URL = process.env.MEM0_ENDPOINT;
const API_KEY = process.env.MEM0_API_KEY;
const headers = API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};

async function getAllUserMemories(userId) {
  if (!BASE_URL || !API_KEY) return [];
  try {
    const { data } = await axios.get(
      `${BASE_URL.replace(/\/$/, "")}/memories`,
      { 
        params: { user_id: String(userId) },
        headers 
      }
    );
    return data || [];
  } catch (err) {
    console.error("[mem0] getAllUserMemories error", err?.message || err);
    return [];
  }
}

async function deleteUserMemory(memoryId) {
  if (!BASE_URL || !API_KEY) return { success: false, error: "Mem0 not configured" };
  try {
    await axios.delete(
      `${BASE_URL.replace(/\/$/, "")}/memories/${memoryId}`,
      { headers }
    );
    return { success: true };
  } catch (err) {
    console.error("[mem0] deleteUserMemory error", err?.message || err);
    return { success: false, error: err?.message || "Failed to delete memory" };
  }
}

function apiUserMemoryEndpoints(app) {
  if (!app) return;

  app.get("/user/memories", async (request, response) => {
    /*
      #swagger.tags = ['User Memory']
      #swagger.description = 'Get current user memories from Mem0'
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                memories: [
                  {
                    id: "mem_123",
                    memory: "User prefers technical explanations",
                    created_at: "2024-01-01T12:00:00Z",
                    updated_at: "2024-01-01T12:00:00Z"
                  }
                ]
              }
            }
          }
        }
      }
      #swagger.responses[401] = {
        description: "Invalid auth token provided.",
      }
      #swagger.responses[403] = {
        description: "Mem0 not enabled for this user.",
      }
    */
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        return response
          .status(401)
          .json({ error: "Invalid auth token provided." });
      }

      if (!shouldUseMem0(user)) {
        return response
          .status(403)
          .json({ error: "Mem0 not enabled for this user." });
      }

      const memories = await getAllUserMemories(user.id);
      response.status(200).json({ memories });
    } catch (e) {
      console.error(e.message, e);
      response.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/user/memories/:memoryId", async (request, response) => {
    /*
      #swagger.tags = ['User Memory']
      #swagger.description = 'Delete a specific memory by ID'
      #swagger.parameters['memoryId'] = {
        in: 'path',
        description: 'The ID of the memory to delete',
        required: true,
        type: 'string'
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                message: "Memory deleted successfully"
              }
            }
          }
        }
      }
      #swagger.responses[401] = {
        description: "Invalid auth token provided.",
      }
      #swagger.responses[403] = {
        description: "Mem0 not enabled for this user.",
      }
    */
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        return response
          .status(401)
          .json({ error: "Invalid auth token provided." });
      }

      if (!shouldUseMem0(user)) {
        return response
          .status(403)
          .json({ error: "Mem0 not enabled for this user." });
      }

      const { memoryId } = request.params;
      const result = await deleteUserMemory(memoryId);
      
      if (result.success) {
        response.status(200).json({ 
          success: true, 
          message: "Memory deleted successfully" 
        });
      } else {
        response.status(500).json({ 
          error: result.error || "Failed to delete memory" 
        });
      }
    } catch (e) {
      console.error(e.message, e);
      response.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/user/memories", async (request, response) => {
    /*
      #swagger.tags = ['User Memory']
      #swagger.description = 'Delete all memories for current user'
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                message: "All memories deleted successfully"
              }
            }
          }
        }
      }
      #swagger.responses[401] = {
        description: "Invalid auth token provided.",
      }
      #swagger.responses[403] = {
        description: "Mem0 not enabled for this user.",
      }
    */
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        return response
          .status(401)
          .json({ error: "Invalid auth token provided." });
      }

      if (!shouldUseMem0(user)) {
        return response
          .status(403)
          .json({ error: "Mem0 not enabled for this user." });
      }

      // Delete all memories for this user via Mem0 API
      if (!BASE_URL || !API_KEY) {
        return response.status(500).json({ error: "Mem0 not configured" });
      }

      try {
        await axios.delete(
          `${BASE_URL.replace(/\/$/, "")}/memories`,
          { 
            params: { user_id: String(user.id) },
            headers 
          }
        );
        
        response.status(200).json({ 
          success: true, 
          message: "All memories deleted successfully" 
        });
      } catch (err) {
        console.error("[mem0] deleteAllUserMemories error", err?.message || err);
        response.status(500).json({ 
          error: "Failed to delete all memories" 
        });
      }
    } catch (e) {
      console.error(e.message, e);
      response.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/user/memories/search", async (request, response) => {
    /*
      #swagger.tags = ['User Memory']
      #swagger.description = 'Search user memories by query'
      #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for memories'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 10)'
                }
              },
              required: ['query']
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                results: [
                  {
                    id: "mem_123",
                    content: "User prefers technical explanations",
                    score: 0.95
                  }
                ]
              }
            }
          }
        }
      }
    */
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        return response
          .status(401)
          .json({ error: "Invalid auth token provided." });
      }

      if (!shouldUseMem0(user)) {
        return response
          .status(403)
          .json({ error: "Mem0 not enabled for this user." });
      }

      const { query, limit = 10 } = reqBody(request);
      if (!query) {
        return response.status(400).json({ error: "Query is required" });
      }

      const results = await searchMemory(user.id, query, limit);
      response.status(200).json({ results });
    } catch (e) {
      console.error(e.message, e);
      response.status(500).json({ error: "Internal server error" });
    }
  });
}

module.exports = { apiUserMemoryEndpoints };