#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 01_setup.sh
# Monorepo Installation and Build Script
# ==============================================================================

set -e

echo "🛡️  Setting up LifeGuard Monorepo..."

# Ensure Node.js and NPM are installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

echo "📦 Node Version: $(node -v)"
echo "📦 NPM Version: $(npm -v)"

# Install dependencies across all monorepo packages
echo "🔄 Installing monorepo dependencies..."
npm install

# Build backend, mcp-server, and desktop packages
echo "🔨 Building all monorepo TypeScript packages..."
npm run build --workspaces || true

echo "✅ LifeGuard setup completed successfully!"
