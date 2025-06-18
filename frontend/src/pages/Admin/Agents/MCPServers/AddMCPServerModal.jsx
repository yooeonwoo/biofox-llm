import React, { useState } from "react";
import { X, Plus, Copy, Check } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";

export default function AddMCPServerModal({
  isOpen,
  onClose,
  onServerAdded,
}) {
  const [mode, setMode] = useState("smithery"); // "smithery" or "json" or "manual"
  const [smitheryCommand, setSmitheryCommand] = useState("");
  const [jsonConfig, setJsonConfig] = useState("");
  const [manualConfig, setManualConfig] = useState({
    name: "",
    command: "",
    args: [],
    env: {},
  });
  const [loading, setLoading] = useState(false);
  const [argInput, setArgInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  const resetForm = () => {
    setSmitheryCommand("");
    setJsonConfig("");
    setManualConfig({
      name: "",
      command: "",
      args: [],
      env: {},
    });
    setArgInput("");
    setEnvKey("");
    setEnvValue("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSmitherySubmit = async () => {
    if (!smitheryCommand.trim()) {
      showToast("Please enter a Smithery command or JSON configuration", "error");
      return;
    }

    setLoading(true);
    try {
      const parseResult = await MCPServers.parseSmitheryCommand(smitheryCommand);
      if (!parseResult.success) {
        showToast(parseResult.error || "Failed to parse command", "error");
        return;
      }

      const { name, serverConfig } = parseResult.config;
      const createResult = await MCPServers.createServer(name, serverConfig);
      
      if (createResult.success) {
        showToast(`MCP Server "${name}" added successfully!`, "success");
        onServerAdded();
        handleClose();
      } else {
        showToast(createResult.error || "Failed to create server", "error");
      }
    } catch (error) {
      showToast(error.message || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualConfig.name.trim() || !manualConfig.command.trim()) {
      showToast("Please enter server name and command", "error");
      return;
    }

    setLoading(true);
    try {
      const serverConfig = {
        command: manualConfig.command,
        args: manualConfig.args,
        env: manualConfig.env,
      };

      const createResult = await MCPServers.createServer(manualConfig.name, serverConfig);
      
      if (createResult.success) {
        showToast(`MCP Server "${manualConfig.name}" added successfully!`, "success");
        onServerAdded();
        handleClose();
      } else {
        showToast(createResult.error || "Failed to create server", "error");
      }
    } catch (error) {
      showToast(error.message || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const addArgument = () => {
    if (argInput.trim()) {
      setManualConfig({
        ...manualConfig,
        args: [...manualConfig.args, argInput.trim()],
      });
      setArgInput("");
    }
  };

  const removeArgument = (index) => {
    setManualConfig({
      ...manualConfig,
      args: manualConfig.args.filter((_, i) => i !== index),
    });
  };

  const addEnvironmentVariable = () => {
    if (envKey.trim() && envValue.trim()) {
      setManualConfig({
        ...manualConfig,
        env: {
          ...manualConfig.env,
          [envKey.trim()]: envValue.trim(),
        },
      });
      setEnvKey("");
      setEnvValue("");
    }
  };

  const removeEnvironmentVariable = (key) => {
    const newEnv = { ...manualConfig.env };
    delete newEnv[key];
    setManualConfig({
      ...manualConfig,
      env: newEnv,
    });
  };

  const copyExample = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border max-h-[90vh] overflow-y-auto">
        <div className="relative p-6 border-b rounded-t border-theme-modal-border">
          <h3 className="text-xl font-semibold text-white">Add MCP Server</h3>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-red-500"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setMode("smithery")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === "smithery"
                    ? "bg-primary-button text-white"
                    : "bg-theme-settings-input-bg text-theme-text-secondary hover:bg-theme-bg-primary"
                }`}
              >
                Smithery / JSON
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === "manual"
                    ? "bg-primary-button text-white"
                    : "bg-theme-settings-input-bg text-theme-text-secondary hover:bg-theme-bg-primary"
                }`}
              >
                Manual Configuration
              </button>
            </div>
          </div>

          {/* Smithery/JSON Mode */}
          {mode === "smithery" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Smithery CLI Command or JSON Configuration
                </label>
                <textarea
                  value={smitheryCommand}
                  onChange={(e) => setSmitheryCommand(e.target.value)}
                  placeholder="Paste Smithery install command or JSON configuration here..."
                  rows={6}
                  className="w-full p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                />
              </div>

              {/* Examples */}
              <div className="bg-theme-bg-primary p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Examples:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-theme-settings-input-bg p-2 rounded">
                    <code className="text-green-400 flex-1">
                      npx -y @smithery/cli@latest install @HelloGGX/shadcn-vue-mcp --key your-key-here
                    </code>
                    <button
                      onClick={() => copyExample("npx -y @smithery/cli@latest install @HelloGGX/shadcn-vue-mcp --key your-key-here")}
                      className="ml-2 text-theme-text-secondary hover:text-white"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-theme-settings-input-bg p-2 rounded">
                    <code className="text-green-400 flex-1 text-xs">
                      {`{
  "mcpServers": {
    "shadcn-vue-mcp": {
      "command": "npx",
      "args": ["-y", "@smithery/cli@latest", "run", "@HelloGGX/shadcn-vue-mcp", "--key", "your-key"]
    }
  }
}`}
                    </code>
                    <button
                      onClick={() => copyExample('{\n  "mcpServers": {\n    "shadcn-vue-mcp": {\n      "command": "npx",\n      "args": ["-y", "@smithery/cli@latest", "run", "@HelloGGX/shadcn-vue-mcp", "--key", "your-key"]\n    }\n  }\n}')}
                      className="ml-2 text-theme-text-secondary hover:text-white"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSmitherySubmit}
                  disabled={loading || !smitheryCommand.trim()}
                  className="px-6 py-2 bg-primary-button text-white rounded-lg hover:bg-primary-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Server"}
                </button>
              </div>
            </div>
          )}

          {/* Manual Configuration Mode */}
          {mode === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  value={manualConfig.name}
                  onChange={(e) => setManualConfig({ ...manualConfig, name: e.target.value })}
                  placeholder="e.g., my-custom-mcp"
                  className="w-full p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Command *
                </label>
                <input
                  type="text"
                  value={manualConfig.command}
                  onChange={(e) => setManualConfig({ ...manualConfig, command: e.target.value })}
                  placeholder="e.g., npx, python, node"
                  className="w-full p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                />
              </div>

              {/* Arguments */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Arguments
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={argInput}
                    onChange={(e) => setArgInput(e.target.value)}
                    placeholder="Add argument"
                    className="flex-1 p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && addArgument()}
                  />
                  <button
                    onClick={addArgument}
                    className="px-4 py-2 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white hover:bg-theme-bg-primary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {manualConfig.args.length > 0 && (
                  <div className="space-y-1">
                    {manualConfig.args.map((arg, index) => (
                      <div key={index} className="flex items-center justify-between bg-theme-bg-primary p-2 rounded">
                        <code className="text-green-400">{arg}</code>
                        <button
                          onClick={() => removeArgument(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Environment Variables */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Environment Variables
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={envKey}
                    onChange={(e) => setEnvKey(e.target.value)}
                    placeholder="Variable name"
                    className="flex-1 p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={envValue}
                    onChange={(e) => setEnvValue(e.target.value)}
                    placeholder="Variable value"
                    className="flex-1 p-3 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white placeholder-theme-text-secondary focus:ring-2 focus:ring-primary-button focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && addEnvironmentVariable()}
                  />
                  <button
                    onClick={addEnvironmentVariable}
                    className="px-4 py-2 bg-theme-settings-input-bg border border-theme-modal-border rounded-lg text-white hover:bg-theme-bg-primary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {Object.entries(manualConfig.env).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(manualConfig.env).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-theme-bg-primary p-2 rounded">
                        <code className="text-green-400">{key}={value}</code>
                        <button
                          onClick={() => removeEnvironmentVariable(key)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleManualSubmit}
                  disabled={loading || !manualConfig.name.trim() || !manualConfig.command.trim()}
                  className="px-6 py-2 bg-primary-button text-white rounded-lg hover:bg-primary-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Server"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}