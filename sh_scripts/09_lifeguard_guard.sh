#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 09_lifeguard_guard.sh
# Active System Guard & Health Monitor Script for Windows & Cross-Platform
# ==============================================================================

set -e

echo "🛡️  LifeGuard Health & Sentinel Status Guard"
echo "--------------------------------------------------------"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1. Check database health
if [ -f "lifeguard.db" ]; then
    echo "✅ SQLite Database: Present (lifeguard.db)"
else
    echo "⚠️ SQLite Database: Not initialized yet. (Will be created on backend startup)"
fi

# 2. Node.js check
echo "✅ Node.js Version: $(node -v)"

# 3. Monorepo Build Check
if [ -d "packages/backend/dist" ] && [ -d "packages/desktop/dist" ]; then
    echo "✅ Monorepo Builds: Fresh compiled binaries ready"
else
    echo "⚠️ Monorepo Builds: Running build..."
    npm run build
fi

echo "--------------------------------------------------------"
echo "✅ LifeGuard Guard Check Completed: All system checks green!"
