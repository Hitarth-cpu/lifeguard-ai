# LifeGuard System Architecture

LifeGuard is a proactive multi-agent personal risk detection and recovery system. It connects authorized environmental signals (email, calendar, documents, tasks) into a cohesive context model, detects potential risks before they cause damage, runs sandbox calculations, and executes recovery plans with human-in-the-loop approval before consequential actions.

---

## The Decision Loop

```
┌─────────────────────────────────────────┐
│       AUTHORIZED DATA SOURCES           │
│  Emails · Calendar Events · Documents   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           OBSERVATION LAYER             │
│   Normalize events and environment info │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│        RISK DETECTION AGENT             │
│  Detect travel, financial, task risks   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│      DAYTONA ISOLATED SANDBOX           │
│  Execute code calculations & metrics   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│        RECOVERY PLAN GENERATOR          │
│  Formulate Option A / Option B actions  │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  SAFE AUTO ACTION       CONSEQUENTIAL ACTION
  (Log & notify)            (Pause turn)
         │                       │
         ▼                       ▼
      Execute            DESKTOP OS NOTIFICATION
                                 │
                                 ▼
                          HUMAN APPROVAL
                                 │
                                 ▼
                              Execute
```

---

## Core Components

1. **LifeGuard Backend (`packages/backend`)**: Express API server + TrueForge SDK integration + SQLite audit database (`lifeguard.db`). Handles SSE event broadcasts for real-time risk updates.
2. **LifeGuard MCP Server (`packages/mcp-server`)**: Custom Remote MCP server implementing observation tools (`get_emails`, `get_calendar_events`, `get_documents`, `record_risk`, `propose_action`).
3. **LifeGuard Desktop Window App (`packages/desktop`)**: Native Electron desktop window with background sentinel monitoring, system tray integration, and native OS notifications when human approval is required.
4. **LifeGuard Web UI (`packages/frontend`)**: React + Vite interface rendered inside the desktop app displaying risk status, pending approvals modal, and audit logs timeline.

---

## Operating Policies

- **Strict Explicit Authorization**: LifeGuard only monitors data sources explicitly connected by the user.
- **Human-in-the-Loop Gate**: Any external or destructive action (`send_email`, `update_calendar_event`) pauses execution until the user explicitly approves or rejects it in the Desktop window.
- **Zero Placeholder Data**: All risk signals and consequences are computed dynamically from environment tools and sandbox evaluations.
