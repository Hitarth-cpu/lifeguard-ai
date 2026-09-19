import crypto from "crypto";

export interface StandardEventPayload {
  id: string;
  hash: string;
  source: "gmail" | "whatsapp" | "slack" | "discord" | "calendar" | "general";
  sender: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PayloadNormalizer {
  public static normalize(raw: any): StandardEventPayload {
    let source: StandardEventPayload["source"] = "general";
    let sender = "unknown";
    let content = "";
    let timestamp = new Date().toISOString();
    let metadata: Record<string, any> = {};

    // 1. Detect WhatsApp payload
    if (raw.whatsapp || raw.phone || (raw.from && raw.text) || (raw.message && raw.message.from)) {
      source = "whatsapp";
      sender = raw.from || raw.phone || raw.sender || raw.message?.from || "WhatsApp User";
      content = raw.text || raw.body || raw.message?.text || raw.content || "";
      timestamp = raw.timestamp || raw.time || new Date().toISOString();
      metadata = { phone: sender, platform: "WhatsApp" };
    }
    // 2. Detect Gmail payload
    else if (raw.gmail || raw.subject || (raw.from && raw.body) || (raw.sender && raw.subject)) {
      source = "gmail";
      sender = raw.from || raw.sender || "Gmail Sender";
      const subject = raw.subject || "";
      const body = raw.body || raw.text || raw.snippet || "";
      content = subject ? `Subject: ${subject}\n\n${body}` : body;
      timestamp = raw.date || raw.timestamp || new Date().toISOString();
      metadata = { subject, sender };
    }
    // 3. Detect Slack / Discord payload
    else if (raw.slack || raw.discord || raw.channel || raw.user) {
      source = raw.discord ? "discord" : "slack";
      sender = raw.user || raw.author || raw.sender || "Workspace User";
      content = raw.text || raw.content || raw.message || "";
      timestamp = raw.ts || raw.timestamp || new Date().toISOString();
      metadata = { channel: raw.channel || "general" };
    }
    // 4. Detect Calendar payload
    else if (raw.calendar || raw.summary || raw.start) {
      source = "calendar";
      sender = raw.organizer || raw.sender || "Calendar System";
      const summary = raw.summary || raw.title || "Calendar Event";
      const start = raw.start || "";
      const end = raw.end || "";
      content = `Event: ${summary} (${start} - ${end})`;
      timestamp = start || new Date().toISOString();
      metadata = { summary, start, end, location: raw.location || "" };
    }
    // 5. Fallback generic payload
    else {
      sender = raw.sender || raw.from || raw.author || "System Payload";
      content = typeof raw === "string" ? raw : (raw.content || raw.message || raw.body || JSON.stringify(raw));
      timestamp = raw.timestamp || new Date().toISOString();
    }

    // Compute SHA-256 hash for idempotency checking
    const hash = crypto
      .createHash("sha256")
      .update(`${source}:${sender.trim().toLowerCase()}:${content.trim()}:${timestamp}`)
      .digest("hex");

    const id = `evt_${hash.substring(0, 12)}`;

    return {
      id,
      hash,
      source,
      sender,
      content,
      timestamp,
      metadata
    };
  }
}
