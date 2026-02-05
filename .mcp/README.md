# MCP (Model Context Protocol) Servers

This directory contains configuration for MCP servers used in this project.

## Configured Servers

### 1. shadcn MCP Server (Managed)

**Status**: ✅ Configured

The shadcn MCP server provides tools for:

- Adding shadcn/ui components
- managing component dependencies

**Configuration**:
Located in `.mcp/config.json`.
It uses the locally installed `shadcn` package in `node_modules`.

## Usage

Start your MCP-enabled editor or agent. It should automatically detect the `mcpServers` configuration in `.mcp/config.json`.

### Troubleshooting

If the shadcn server fails to start:

1. Ensure `npm install` has been run in the project root.
2. Verify `node_modules/shadcn/dist/index.js` exists.
3. Try running `npx shadcn mcp` manually to see if it errors.
