const MCPHypervisor = require("./hypervisor");

class MCPCompatibilityLayer extends MCPHypervisor {
  static _instance;

  constructor() {
    super();
    if (MCPCompatibilityLayer._instance) return MCPCompatibilityLayer._instance;
    MCPCompatibilityLayer._instance = this;
  }

  /**
   * Get all of the active MCP servers as plugins we can load into agents.
   * This will also boot all MCP servers if they have not been started yet.
   * @returns {Promise<string[]>} Array of flow names in @@mcp_{name} format
   */
  async activeMCPServers() {
    await this.bootMCPServers();
    return Object.keys(this.mcps).flatMap((name) => `@@mcp_${name}`);
  }

  /**
   * Convert an MCP server name to an AnythingLLM Agent plugin
   * @param {string} name - The base name of the MCP server to convert - not the tool name. eg: `docker-mcp` not `docker-mcp:list-containers`
   * @param {Object} aibitat - The aibitat object to pass to the plugin
   * @returns {Promise<{name: string, description: string, plugin: Function}[]|null>} Array of plugin configurations or null if not found
   */
  async convertServerToolsToPlugins(name, _aibitat = null) {
    const mcp = this.mcps[name];
    if (!mcp) return null;

    const tools = (await mcp.listTools()).tools;
    if (!tools.length) return null;

    const plugins = [];
    for (const tool of tools) {
      plugins.push({
        name: `${name}-${tool.name}`,
        description: tool.description,
        plugin: function () {
          return {
            name: `${name}-${tool.name}`,
            setup: (aibitat) => {
              aibitat.function({
                super: aibitat,
                name: `${name}-${tool.name}`,
                controller: new AbortController(),
                description: tool.description,
                examples: [],
                parameters: {
                  $schema: "http://json-schema.org/draft-07/schema#",
                  ...tool.inputSchema,
                },
                handler: async function (args = {}) {
                  try {
                    aibitat.handlerProps.log(
                      `Executing MCP server: ${name}:${tool.name} with args:`,
                      args
                    );
                    aibitat.introspect(
                      `Executing MCP server: ${name} with ${JSON.stringify(args, null, 2)}`
                    );
                    const result = await mcp.callTool({
                      name: tool.name,
                      arguments: args,
                    });
                    aibitat.handlerProps.log(
                      `MCP server: ${name}:${tool.name} completed successfully`,
                      result
                    );
                    aibitat.introspect(
                      `MCP server: ${name}:${tool.name} completed successfully`
                    );
                    return typeof result === "object"
                      ? JSON.stringify(result)
                      : String(result);
                  } catch (error) {
                    aibitat.handlerProps.log(
                      `MCP server: ${name}:${tool.name} failed with error:`,
                      error
                    );
                    aibitat.introspect(
                      `MCP server: ${name}:${tool.name} failed with error:`,
                      error
                    );
                    return `The tool ${name}:${tool.name} failed with error: ${error?.message || "An unknown error occurred"}`;
                  }
                },
              });
            },
          };
        },
        toolName: `${name}:${tool.name}`,
      });
    }

    return plugins;
  }

  /**
   * Returns the MCP servers that were loaded or attempted to be loaded
   * so that we can display them in the frontend for review or error logging.
   * @returns {Promise<{
   *   name: string,
   *   running: boolean,
   *   tools: {name: string, description: string, inputSchema: Object}[],
   *   process: {pid: number, cmd: string}|null,
   *   error: string|null
   * }[]>} - The active MCP servers
   */
  async servers() {
    await this.bootMCPServers();
    const servers = [];
    for (const [name, result] of Object.entries(this.mcpLoadingResults)) {
      const config = this.mcpServerConfigs.find((s) => s.name === name);

      if (result.status === "failed") {
        servers.push({
          name,
          config: config?.server || null,
          running: false,
          tools: [],
          error: result.message,
          process: null,
        });
        continue;
      }

      const mcp = this.mcps[name];
      if (!mcp) {
        delete this.mcpLoadingResults[name];
        delete this.mcps[name];
        continue;
      }

      const online = !!(await mcp.ping());
      const tools = online ? (await mcp.listTools()).tools : [];
      servers.push({
        name,
        config: config?.server || null,
        running: online,
        tools,
        error: null,
        process: {
          pid: mcp.transport?.process?.pid || null,
        },
      });
    }
    return servers;
  }

  /**
   * Toggle the MCP server (start or stop)
   * @param {string} name - The name of the MCP server to toggle
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  async toggleServerStatus(name) {
    const server = this.mcpServerConfigs.find((s) => s.name === name);
    if (!server)
      return {
        success: false,
        error: `MCP server ${name} not found in config file.`,
      };
    const mcp = this.mcps[name];
    const online = !!mcp ? !!(await mcp.ping()) : false; // If the server is not in the mcps object, it is not running

    if (online) {
      const killed = this.pruneMCPServer(name);
      return {
        success: killed,
        error: killed ? null : `Failed to kill MCP server: ${name}`,
      };
    } else {
      const startupResult = await this.startMCPServer(name);
      return { success: startupResult.success, error: startupResult.error };
    }
  }

  /**
   * Delete the MCP server - will also remove it from the config file
   * @param {string} name - The name of the MCP server to delete
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  async deleteServer(name) {
    const server = this.mcpServerConfigs.find((s) => s.name === name);
    if (!server)
      return {
        success: false,
        error: `MCP server ${name} not found in config file.`,
      };

    const mcp = this.mcps[name];
    const online = !!mcp ? !!(await mcp.ping()) : false; // If the server is not in the mcps object, it is not running
    if (online) this.pruneMCPServer(name);
    this.removeMCPServerFromConfig(name);

    delete this.mcps[name];
    delete this.mcpLoadingResults[name];
    this.log(`MCP server was killed and removed from config file: ${name}`);
    return { success: true, error: null };
  }

  /**
   * Add a new MCP server to the config file
   * @param {string} name - The name of the MCP server
   * @param {Object} serverConfig - The server configuration
   * @returns {Promise<{success: boolean, error: string | null, server: Object | null}>}
   */
  async addServer(name, serverConfig) {
    try {
      // Check if server name already exists
      const existingServer = this.mcpServerConfigs.find((s) => s.name === name);
      if (existingServer) {
        return {
          success: false,
          error: `MCP server with name '${name}' already exists.`,
          server: null,
        };
      }

      // Validate server configuration
      const validation = this.validateServerConfig(serverConfig);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          server: null,
        };
      }

      // Add to config file
      const result = this.addMCPServerToConfig(name, serverConfig);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          server: null,
        };
      }

      this.log(`MCP server added to config: ${name}`);
      return {
        success: true,
        error: null,
        server: { name, config: serverConfig },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        server: null,
      };
    }
  }

  /**
   * Parse Smithery CLI command and convert to MCP server config
   * @param {string} command - The Smithery CLI command
   * @returns {Promise<{success: boolean, error: string | null, config: Object | null}>}
   */
  async parseSmitheryCommand(command) {
    try {
      // Parse npx command: npx -y @smithery/cli@latest install @HelloGGX/shadcn-vue-mcp --client cursor --key a4fd3a4d-c9fd-40f7-8a5f-647cd24b431e
      const installMatch = command.match(/npx\s+-y\s+@smithery\/cli@latest\s+install\s+([^\s]+)(?:\s+--client\s+([^\s]+))?(?:\s+--key\s+([^\s]+))?/);
      
      if (installMatch) {
        const [, packageName, client, key] = installMatch;
        const serverName = packageName.split('/').pop().replace(/-mcp$/, '-mcp');
        
        const config = {
          command: "npx",
          args: [
            "-y",
            "@smithery/cli@latest",
            "run",
            packageName,
            "--key",
            key || "your-key-here"
          ]
        };

        return {
          success: true,
          error: null,
          config: {
            name: serverName,
            serverConfig: config
          }
        };
      }

      // Also handle direct JSON config
      try {
        const jsonConfig = JSON.parse(command);
        if (jsonConfig.mcpServers) {
          const serverNames = Object.keys(jsonConfig.mcpServers);
          if (serverNames.length > 0) {
            const firstServerName = serverNames[0];
            const serverConfig = jsonConfig.mcpServers[firstServerName];
            
            return {
              success: true,
              error: null,
              config: {
                name: firstServerName,
                serverConfig: serverConfig
              }
            };
          }
        }
      } catch (jsonError) {
        // Not JSON, continue with other parsing
      }

      return {
        success: false,
        error: "Unable to parse command. Please provide a valid Smithery CLI install command or JSON configuration.",
        config: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: null
      };
    }
  }

  /**
   * Validate server configuration
   * @param {Object} serverConfig - The server configuration to validate
   * @returns {{valid: boolean, error: string | null}}
   */
  validateServerConfig(serverConfig) {
    if (!serverConfig || typeof serverConfig !== 'object') {
      return { valid: false, error: "Server configuration must be an object." };
    }

    // For stdio servers (command-based)
    if (serverConfig.command) {
      if (typeof serverConfig.command !== 'string') {
        return { valid: false, error: "Command must be a string." };
      }
      if (serverConfig.args && !Array.isArray(serverConfig.args)) {
        return { valid: false, error: "Args must be an array." };
      }
      if (serverConfig.env && typeof serverConfig.env !== 'object') {
        return { valid: false, error: "Environment variables must be an object." };
      }
      return { valid: true, error: null };
    }

    // For HTTP servers
    if (serverConfig.url) {
      if (typeof serverConfig.url !== 'string') {
        return { valid: false, error: "URL must be a string." };
      }
      try {
        new URL(serverConfig.url);
      } catch {
        return { valid: false, error: "Invalid URL format." };
      }
      return { valid: true, error: null };
    }

    return { valid: false, error: "Server configuration must have either 'command' or 'url' property." };
  }
}
module.exports = MCPCompatibilityLayer;
