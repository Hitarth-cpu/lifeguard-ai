#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 07_run_tests.sh
# Runs automated TAP test suites across all LifeGuard components
# ==============================================================================

set -e

echo "🧪 Running LifeGuard TAP Test Suite..."
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1. Monorepo TypeScript Build Verification
echo "🔎 Verifying TypeScript builds..."
npm run build --workspaces

# 2. Run TAP Test Suites
echo "--------------------------------------------------------"
echo "RUNNING: tests/lifeguard-scripts.test.sh"
bash tests/lifeguard-scripts.test.sh

echo "RUNNING: tests/lifeguard-backend.test.sh"
bash tests/lifeguard-backend.test.sh

echo "RUNNING: tests/lifeguard-desktop.test.sh"
bash tests/lifeguard-desktop.test.sh
echo "--------------------------------------------------------"

echo "✅ All LifeGuard TAP test suites passed cleanly!"
