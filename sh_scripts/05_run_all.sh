#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 05_run_all.sh
# Master script to run Backend, MCP Server, Frontend, and Desktop App concurrently
# ==============================================================================

set -e

echo "🚀 Starting entire LifeGuard System Stack..."
cd "$(dirname "$0")/.."

# Check if concurrently is available in node_modules
if npx concurrently --version &> /dev/null; then
    npx concurrently \
        --names "MCP,BACKEND,FRONTEND,DESKTOP" \
        --prefix-colors "cyan,magenta,blue,yellow" \
        "bash sh_scripts/03_start_mcp.sh" \
        "bash sh_scripts/02_start_backend.sh" \
        "npm run dev --workspace=packages/frontend" \
        "bash sh_scripts/04_start_desktop.sh"
else
    echo "⚠️ npx concurrently not found, starting services sequentially..."
    bash sh_scripts/03_start_mcp.sh &
    bash sh_scripts/02_start_backend.sh &
    npm run dev --workspace=packages/frontend &
    bash sh_scripts/04_start_desktop.sh &
    wait
fi
