import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const MCPServers = {
  /**
   * Forces a reload of the MCP Hypervisor and its servers
   * @returns {Promise<{success: boolean, error: string | null, servers: Array<{name: string, running: boolean, tools: Array<{name: string, description: string, inputSchema: Object}>, error: string | null, process: {pid: number, cmd: string} | null}>}>}
   */
  forceReload: async () => {
    return await fetch(`${API_BASE}/mcp-servers/force-reload`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        servers: [],
        success: false,
        error: e.message,
      }));
  },

  /**
   * List all available MCP servers in the system
   * @returns {Promise<{success: boolean, error: string | null, servers: Array<{name: string, running: boolean, tools: Array<{name: string, description: string, inputSchema: Object}>, error: string | null, process: {pid: number, cmd: string} | null}>}>}
   */
  listServers: async () => {
    return await fetch(`${API_BASE}/mcp-servers/list`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        servers: [],
      }));
  },

  /**
   * Toggle the MCP server (start or stop)
   * @param {string} name - The name of the MCP server to toggle
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  toggleServer: async (name) => {
    return await fetch(`${API_BASE}/mcp-servers/toggle`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Delete the MCP server - will also remove it from the config file
   * @param {string} name - The name of the MCP server to delete
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  deleteServer: async (name) => {
    return await fetch(`${API_BASE}/mcp-servers/delete`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Create a new MCP server
   * @param {string} name - The name of the MCP server
   * @param {Object} serverConfig - The server configuration
   * @returns {Promise<{success: boolean, error: string | null, server: Object | null}>}
   */
  createServer: async (name, serverConfig) => {
    return await fetch(`${API_BASE}/mcp-servers/create`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name, serverConfig }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        server: null,
      }));
  },

  /**
   * Parse Smithery CLI command and get server configuration
   * @param {string} command - The Smithery CLI command or JSON config
   * @returns {Promise<{success: boolean, error: string | null, config: Object | null}>}
   */
  parseSmitheryCommand: async (command) => {
    return await fetch(`${API_BASE}/mcp-servers/parse-smithery`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ command }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        config: null,
      }));
  },
};

export default MCPServers;
