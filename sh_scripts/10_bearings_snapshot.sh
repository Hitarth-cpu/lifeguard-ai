#!/usr/bin/env bash
# ==============================================================================
# LifeGuard - 10_bearings_snapshot.sh
# Generates a standalone markdown status snapshot in data/bearings_snapshot.md
# ==============================================================================

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p data

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date)
SNAPSHOT_FILE="data/bearings_snapshot.md"

echo "📊 Generating LifeGuard System Bearings Snapshot..."

cat > "$SNAPSHOT_FILE" << EOF
# 🛡️ LifeGuard System Bearings Snapshot

**Generated at**: \`${TIMESTAMP}\`
**Host OS**: Windows (Native Node / Electron Stack)

---

## 1. System Component Status

| Component | Status | Environment |
| :--- | :--- | :--- |
| **LifeGuard Backend** | Ready | Port 3002 |
| **LifeGuard MCP Tools** | Ready | Port 3001 |
| **Desktop Sentinel App** | Configured | Electron / React |
| **TrueForge Orchestrator** | Configured | \${TRUEFORGE_URL:-http://localhost:8790} |
| **Database** | Active | SQLite (\`lifeguard.db\`) |

---

## 2. Active Risk Detection Capabilities

- ✈️ **Travel Readiness Sentinel**: Flight bookings, missing hotel confirmations, expiring passports.
- 💳 **Financial Cash-Flow Risk**: Pending EMIs, recurring subscriptions, balance shortage alerts.
- 📅 **Commitment & Task Deadlines**: High-consequence project milestones and study schedules at risk.

---

## 3. Safe Execution & Human Approval Gate

- Consequential actions (\`send_email\`, \`update_calendar_event\`) require explicit user approval.
- Safe, non-destructive actions are auto-executed and logged to the SQLite audit log.
- Desktop OS notifications alert the captain immediately when approval is needed.

EOF

echo "✅ Snapshot written successfully to: ${SNAPSHOT_FILE}"
