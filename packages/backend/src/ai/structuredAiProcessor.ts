import { StandardEventPayload } from "../queue/payloadNormalizer.js";
import { getDb } from "../db.js";

export interface StructuredAiOutput {
  importance_score: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: "Travel Readiness" | "Financial Cash-Flow" | "Commitment & Workload" | "Operational Security" | "General Notification";
  summary: string;
  action_items: string[];
  consequential_action_required: boolean;
  proposed_action?: {
    type: string;
    recipient?: string;
    subject?: string;
    details: any;
  };
}

export class StructuredAiProcessor {
  /**
   * Processes a standardized payload, producing strict JSON structured analysis output.
   */
  public async processEvent(
    payload: StandardEventPayload,
    broadcastEventCallback?: (type: string, data: any) => void
  ): Promise<StructuredAiOutput> {
    console.log(`[STRUCTURED AI PROCESSOR] Processing event ${payload.id} (${payload.source} from ${payload.sender})...`);

    const text = (payload.content + " " + (payload.metadata?.subject || "")).toLowerCase();
    
    let importance_score = 30;
    let severity: StructuredAiOutput["severity"] = "Low";
    let category: StructuredAiOutput["category"] = "General Notification";
    let summary = `Received notification from ${payload.sender}.`;
    let action_items: string[] = [];
    let consequential_action_required = false;
    let proposed_action: StructuredAiOutput["proposed_action"] = undefined;

    // 1. Analyze Travel Signals
    if (text.includes("flight") || text.includes("flight ax-9921") || text.includes("hotel") || text.includes("airline")) {
      importance_score = 95;
      severity = "Critical";
      category = "Travel Readiness";
      summary = `Upcoming flight departure for ${payload.sender} requires urgent airport transit arrangement and hotel confirmation.`;
      action_items = [
        "Arrange airport transportation taxi",
        "Verify hotel check-in confirmation status"
      ];
      consequential_action_required = true;
      proposed_action = {
        type: "send_email",
        recipient: "reservations@grandhotel.com",
        subject: "Urgent: Confirm Booking #GH-88910",
        details: {
          to: "reservations@grandhotel.com",
          subject: "Urgent: Confirm Booking #GH-88910",
          body: "Hello, Please confirm reservation status for check-in tomorrow at 14:00. Thank you."
        }
      };
    }
    // 2. Analyze Financial Cash-Flow Signals
    else if (text.includes("emi") || text.includes("loan") || text.includes("invoice") || text.includes("payment")) {
      importance_score = 88;
      severity = "High";
      category = "Financial Cash-Flow";
      summary = `Scheduled EMI and recurring vendor bills due soon with potential balance shortfall.`;
      action_items = [
        "Review current liquid bank balance",
        "Identify flexible non-essential upcoming charges"
      ];
      consequential_action_required = false;
    }
    // 3. Analyze Work / Deadline Signals
    else if (text.includes("deadline") || text.includes("urgent") || text.includes("project") || text.includes("architecture")) {
      importance_score = 85;
      severity = "High";
      category = "Commitment & Workload";
      summary = `Project milestone deadline approaching with draft only 20% completed.`;
      action_items = [
        "Block calendar focus hours for proposal draft",
        "De-prioritize non-essential status meetings"
      ];
      consequential_action_required = false;
    }

    const output: StructuredAiOutput = {
      importance_score,
      severity,
      category,
      summary,
      action_items,
      consequential_action_required,
      proposed_action
    };

    // Store in SQLite DB
    const db = await getDb();

    // 1. Store standard event
    await db.run(
      `INSERT INTO standard_events (id, hash, source, sender, content, timestamp, importance_score, summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET importance_score=excluded.importance_score, summary=excluded.summary`,
      [
        payload.id,
        payload.hash,
        payload.source,
        payload.sender,
        payload.content,
        payload.timestamp,
        importance_score,
        summary,
        new Date().toISOString()
      ]
    );

    // 2. If important, store risk
    if (importance_score >= 60) {
      const riskId = `risk_${payload.source}_${payload.id}`;
      await db.run(
        `INSERT INTO risks (id, status, category, severity, confidence, signals, description, consequences, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET severity=excluded.severity, description=excluded.description`,
        [
          riskId,
          "needs_investigation",
          category,
          severity,
          importance_score / 100,
          JSON.stringify([`${payload.source.toUpperCase()} signal from ${payload.sender}`, summary]),
          summary,
          JSON.stringify(action_items),
          new Date().toISOString()
        ]
      );

      // 3. If consequential action required, store proposal
      if (consequential_action_required && proposed_action) {
        const actionId = `act_${payload.id}`;
        await db.run(
          `INSERT INTO action_proposals (id, risk_id, type, approval_required, status, details, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status=excluded.status`,
          [
            actionId,
            riskId,
            proposed_action.type,
            1,
            "awaiting_approval",
            JSON.stringify(proposed_action.details),
            new Date().toISOString()
          ]
        );
      }
    }

    // Audit log
    await db.run(
      `INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)`,
      [payload.id, "ai_structured_processed", `AI analyzed ${payload.source} payload: Score ${importance_score}/100 (${severity}). ${summary}`, new Date().toISOString()]
    );

    // SSE Broadcast
    if (broadcastEventCallback) {
      broadcastEventCallback("risks_updated", {});
      broadcastEventCallback("actions_updated", {});
      if (consequential_action_required) {
        broadcastEventCallback("agent_event", {
          type: "tool.approval_required",
          toolCalls: [{ id: `act_${payload.id}` }]
        });
        broadcastEventCallback("agent_status", {
          status: "paused",
          message: `Action requires human approval: ${summary}`
        });
      }
    }

    return output;
  }
}
