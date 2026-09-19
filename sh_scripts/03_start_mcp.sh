#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 03_start_mcp.sh
# Starts the LifeGuard MCP Tool Server (Port 3001)
# ==============================================================================

set -e

echo "🔌 Starting LifeGuard MCP Server on Port 3001..."
cd "$(dirname "$0")/.."

export PORT=3001

npm run dev --workspace=packages/mcp-server
