#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 04_start_desktop.sh
# Starts the LifeGuard Desktop Window Application (Electron)
# ==============================================================================

set -e

echo "🖥️  Launching LifeGuard Desktop Window Application..."
cd "$(dirname "$0")/.."

npm run dev --workspace=packages/desktop
