#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 02_start_backend.sh
# Starts the LifeGuard Backend API & Orchestrator Server (Port 3002)
# ==============================================================================

set -e

echo "🛡️  Starting LifeGuard Backend Server on Port 3002..."
cd "$(dirname "$0")/.."

export PORT=3002
export TRUEFORGE_URL=${TRUEFORGE_URL:-"http://localhost:8790"}

npm run dev --workspace=packages/backend
