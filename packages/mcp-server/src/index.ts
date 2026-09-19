import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";

// Shared database connection
const dbPath = path.join(process.cwd(), "lifeguard.db");

async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

// Mock digital environment states
let emails = [
  {
    id: "mail_001",
    sender: "airline@fly-fast.com",
    subject: "Your booking confirmation for LH190",
    body: "Thank you for booking flight LH190. Flight date: August 28, 2026. Departure: 08:30 AM from airport. Arrival: London."
  },
  {
    id: "mail_002",
    sender: "client@bigbiz.com",
    subject: "Urgent: Project proposal deadline",
    body: "Hi, just a reminder that I need the final project proposal on my desk by Friday morning, August 28, 2026. Let me know if there are any issues."
  },
  {
    id: "mail_003",
    sender: "netflix@netflix.com",
    subject: "Your subscription renewal",
    body: "This is to inform you that your Netflix Premium subscription will auto-renew on September 1st, 2026 for ₹649."
  },
  {
    id: "mail_004",
    sender: "prime@amazon.com",
    subject: "Your subscription renewal",
    body: "This is to inform you that your Amazon Prime membership will auto-renew on September 2nd, 2026 for ₹1499."
  }
];

let calendarEvents = [
  {
    id: "cal_001",
    title: "Flight to London (LH190)",
    start: "2026-08-28T08:30:00",
    end: "2026-08-28T11:30:00"
  },
  {
    id: "cal_002",
    title: "Weekly status update meeting",
    start: "2026-08-27T10:00:00",
    end: "2026-08-27T11:00:00"
  },
  {
    id: "cal_003",
    title: "Client feedback session",
    start: "2026-08-27T14:00:00",
    end: "2026-08-27T15:30:00"
  },
  {
    id: "cal_004",
    title: "Board alignment presentation",
    start: "2026-08-28T09:00:00",
    end: "2026-08-28T11:00:00"
  }
];

let documents = [
  {
    id: "doc_001",
    name: "passport_scan.pdf",
    path: "/docs/passport_scan.pdf",
    content: "Passport Holder: John Doe. Expiry Date: September 10, 2026."
  },
  {
    id: "doc_002",
    name: "proposal_draft.md",
    path: "/docs/proposal_draft.md",
    content: "# Project Proposal Draft\nStatus: Draft (10% complete)\n\n## Introduction\nWe propose an AI integration..."
  }
];

const server = new Server(
  {
    name: "lifeguard-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_emails",
        description: "Retrieve list of all authorized emails from user inbox",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_calendar_events",
        description: "Retrieve list of all calendar events from user schedule",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_documents",
        description: "Retrieve list of all authorized documents",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "send_email",
        description: "Send an email to a recipient. REQUIRES APPROVAL.",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Email address of recipient" },
            subject: { type: "string", description: "Email subject line" },
            body: { type: "string", description: "Email body text" }
          },
          required: ["to", "subject", "body"]
        }
      },
      {
        name: "update_calendar_event",
        description: "Modify an existing calendar event times. REQUIRES APPROVAL.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the event to modify" },
            start: { type: "string", description: "ISO timestamp for new start time" },
            end: { type: "string", description: "ISO timestamp for new end time" }
          },
          required: ["id", "start", "end"]
        }
      },
      {
        name: "record_risk",
        description: "Record a newly detected risk in the LifeGuard database.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique string ID for the risk (e.g. risk_travel_01)" },
            category: { type: "string", description: "Category of risk (e.g. travel, commitment, schedule, finance)" },
            severity: { type: "string", description: "Severity level (e.g. critical, high, medium, low)" },
            confidence: { type: "number", description: "Confidence score between 0.0 and 1.0" },
            signals: { type: "array", items: { type: "string" }, description: "Signal tags contributing to this risk" },
            description: { type: "string", description: "Detailed description of what is at risk" },
            consequences: { type: "array", items: { type: "string" }, description: "Possible negative consequences if ignored" }
          },
          required: ["id", "category", "severity", "confidence", "signals", "description", "consequences"]
        }
      },
      {
        name: "propose_action",
        description: "Propose a recovery action proposal associated with a detected risk.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique string ID for the action (e.g. act_email_01)" },
            risk_id: { type: "string", description: "The associated risk ID" },
            type: { type: "string", description: "Action type (e.g. send_email, update_calendar_event)" },
            approval_required: { type: "boolean", description: "Whether this action requires human approval" },
            details: { type: "object", description: "Arguments/parameters for the execution of the action" }
          },
          required: ["id", "risk_id", "type", "approval_required", "details"]
        }
      }
    ]
  };
});

// Define tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_emails":
        return {
          content: [{ type: "text", text: JSON.stringify(emails, null, 2) }]
        };

      case "get_calendar_events":
        return {
          content: [{ type: "text", text: JSON.stringify(calendarEvents, null, 2) }]
        };

      case "get_documents":
        return {
          content: [{ type: "text", text: JSON.stringify(documents, null, 2) }]
        };

      case "send_email": {
        const { to, subject, body } = args as { to: string; subject: string; body: string };
        console.error(`[MCP WORKFLOW] Executing approved email send to ${to}: ${subject}`);
        
        // Log in DB audit trail
        const db = await getDb();
        await db.run(
          "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
          ["system", "action_execution", `Email successfully sent to ${to}: ${subject}`, new Date().toISOString()]
        );
        await db.close();

        return {
          content: [{ type: "text", text: `Success: Email sent to ${to} with subject "${subject}"` }]
        };
      }

      case "update_calendar_event": {
        const { id, start, end } = args as { id: string; start: string; end: string };
        const eventIndex = calendarEvents.findIndex(evt => evt.id === id);
        if (eventIndex === -1) {
          throw new Error(`Event with ID ${id} not found`);
        }
        calendarEvents[eventIndex].start = start;
        calendarEvents[eventIndex].end = end;
        console.error(`[MCP WORKFLOW] Executing approved calendar event update: ${id}`);

        // Log in DB audit trail
        const db = await getDb();
        await db.run(
          "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
          ["system", "action_execution", `Calendar event ${id} updated to start at ${start}`, new Date().toISOString()]
        );
        await db.close();

        return {
          content: [{ type: "text", text: `Success: Event ${id} rescheduled to ${start} - ${end}` }]
        };
      }

      case "record_risk": {
        const { id, category, severity, confidence, signals, description, consequences } = args as any;
        const db = await getDb();
        
        // Check if exists, else insert
        await db.run(`
          INSERT INTO risks (id, status, category, severity, confidence, signals, description, consequences, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status=excluded.status,
            severity=excluded.severity,
            confidence=excluded.confidence,
            signals=excluded.signals,
            description=excluded.description,
            consequences=excluded.consequences
        `, [
          id,
          "needs_investigation",
          category,
          severity,
          confidence,
          JSON.stringify(signals),
          description,
          JSON.stringify(consequences),
          new Date().toISOString()
        ]);
        
        await db.run(
          "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
          ["system", "risk_detected", `Detected ${severity} severity ${category} risk: ${description}`, new Date().toISOString()]
        );

        await db.close();
        return {
          content: [{ type: "text", text: `Recorded risk ${id} successfully.` }]
        };
      }

      case "propose_action": {
        const { id, risk_id, type, approval_required, details } = args as any;
        const db = await getDb();
        
        await db.run(`
          INSERT INTO action_proposals (id, risk_id, type, approval_required, status, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status=excluded.status,
            details=excluded.details
        `, [
          id,
          risk_id,
          type,
          approval_required ? 1 : 0,
          approval_required ? "awaiting_approval" : "proposed",
          JSON.stringify(details),
          new Date().toISOString()
        ]);

        await db.run(
          "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
          ["system", "action_proposed", `Proposed action ${type} for risk ${risk_id} (Approval Required: ${approval_required})`, new Date().toISOString()]
        );

        await db.close();
        return {
          content: [{ type: "text", text: `Recorded proposed action ${id} successfully.` }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message || "Unknown error occurred" }]
    };
  }
});

const app = express();
app.use(express.json());

// Enable basic CORS for remote UI / testing
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

let transport: SSEServerTransport | undefined = undefined;

app.get("/sse", async (req, res) => {
  console.error("[MCP SERVER] Client connected to SSE endpoint");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  console.error("[MCP SERVER] Received message POST request");
  if (!transport) {
    res.status(400).send("SSE connection not established");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.error(`[MCP SERVER] Running SSE server on http://localhost:${PORT}`);
});
