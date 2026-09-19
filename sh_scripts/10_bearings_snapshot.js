const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const timestamp = new Date().toISOString();
const snapshotFile = path.join(dataDir, 'bearings_snapshot.md');

const content = `# 🛡️ LifeGuard System Bearings Snapshot

**Generated at**: \`${timestamp}\`
**Host OS**: Windows (Native Node.js & Electron Stack)

---

## 1. System Component Status

| Component | Status | Environment |
| :--- | :--- | :--- |
| **LifeGuard Backend** | Ready | Port 3002 |
| **LifeGuard MCP Tools** | Ready | Port 3001 |
| **Desktop Sentinel App** | Configured | Electron / React |
| **TrueForge Orchestrator** | Configured | http://localhost:8790 |
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
`;

fs.writeFileSync(snapshotFile, content, 'utf8');
console.log(`✅ Snapshot written successfully to: ${snapshotFile}`);
