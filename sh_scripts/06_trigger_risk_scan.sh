#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 06_trigger_risk_scan.sh
# Triggers an active environment risk observation sequence via API
# ==============================================================================

set -e

BACKEND_URL=${BACKEND_URL:-"http://localhost:3002"}
PROMPT=${1:-"Perform a full system check. Review emails, calendar, and files to detect any risks or commitments that are at risk or need attention."}

echo "🔍 Triggering LifeGuard Risk Observation Scan..."
echo "📡 Target: ${BACKEND_URL}/api/trigger"
echo "💬 Prompt: ${PROMPT}"

if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/trigger" \
        -H "Content-Type: application/json" \
        -d "{\"prompt\": \"${PROMPT}\"}")
    echo "✅ Response: ${RESPONSE}"
else
    echo "❌ Error: curl is required to run this script."
    exit 1
fi
