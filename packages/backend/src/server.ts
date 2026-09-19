import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serverless from "serverless-http";
import { initDb, getDb, getStorageAdapter } from "./db.js";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import { GmailService } from "./integrations/gmailService.js";
import { CalendarService } from "./integrations/calendarService.js";
import { SocialMediaService } from "./integrations/socialMediaService.js";
import { GoogleOAuthService } from "./integrations/googleOAuthService.js";
import { GoogleTasksService } from "./integrations/googleTasksService.js";
import { BedrockAgentEngine } from "./bedrockAgentEngine.js";
import { DeepRiskReasoningEngine } from "./riskEngine.js";
import { MessageQueue } from "./queue/messageQueue.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const TRUEFORGE_URL = process.env.TRUEFORGE_URL || "http://localhost:8790";

const gmail = new GmailService();
const calendar = new CalendarService();
const socialMedia = new SocialMediaService();
const googleOAuth = new GoogleOAuthService();
const googleTasks = new GoogleTasksService();
const bedrockAgent = new BedrockAgentEngine();
const riskEngine = new DeepRiskReasoningEngine();

// Instantiate the SDK with baseUrl (required by the client options)
const tf = new TrueForge({ baseUrl: TRUEFORGE_URL });

// Keep track of SSE connections
const sseClients: express.Response[] = [];

// Cache of tool calls in memory, mapped by tool call ID
const toolCallCache = new Map<string, { name: string; args: any; serverName: string }>();

// Broadcast SSE event
function broadcastEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  console.log(`[SSE BROADCAST] Emitting event type: ${type}`);
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error("[SSE BROADCAST] Error writing to client:", err);
    }
  }
}

// Asynchronous Buffer Queue Instance
const messageQueue = new MessageQueue(broadcastEvent);

// Write audit logs and broadcast them
async function logAndEmit(sessionId: string, eventType: string, eventMessage: string) {
  try {
    const db = await getDb();
    const timestamp = new Date().toISOString();
    
    // Save to DB
    await db.run(
      "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
      [sessionId, eventType, eventMessage, timestamp]
    );
    await db.close();

    // Broadcast to UI
    broadcastEvent("audit_log", {
      session_id: sessionId,
      event_type: eventType,
      event_message: eventMessage,
      timestamp
    });
  } catch (err) {
    console.error("[LOG EVENT] Database write failed:", err);
  }
}

// SSE Connection Endpoint
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  console.log("[API] SSE Client connected");
  sseClients.push(res);

  req.on("close", () => {
    console.log("[API] SSE Client disconnected");
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// REST API Endpoints
app.get("/api/risks", async (req, res) => {
  try {
    const db = await getDb();
    const risks = await db.all("SELECT * FROM risks ORDER BY created_at DESC");

    const parsedRisks = risks.map((r) => {
      let signals: string[] = [];
      let consequences: string[] = [];
      try { signals = JSON.parse(r.signals); } catch (e) { signals = [r.signals]; }
      try { if (r.consequences) consequences = JSON.parse(r.consequences); } catch (e) { consequences = []; }
      return {
        ...r,
        signals,
        consequences
      };
    });
    
    res.json(parsedRisks);
  } catch (err: any) {
    console.error("[API RISKS ERROR]", err);
    res.json([]);
  }
});

app.get("/api/actions", async (req, res) => {
  try {
    const db = await getDb();
    const actions = await db.all("SELECT * FROM action_proposals ORDER BY created_at DESC");

    const parsedActions = actions.map((a) => {
      let details: any = {};
      try { details = JSON.parse(a.details); } catch (e) { details = {}; }
      return {
        ...a,
        details,
        approval_required: a.approval_required === 1,
      };
    });

    res.json(parsedActions);
  } catch (err: any) {
    console.error("[API ACTIONS ERROR]", err);
    res.json([]);
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const db = await getDb();
    const logs = await db.all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100");
    res.json(Array.isArray(logs) ? logs : []);
  } catch (err: any) {
    console.error("[API LOGS ERROR]", err);
    res.json([]);
  }
});

// Google OAuth Authentication & Authorization Endpoints
app.get("/api/auth/google/url", (req, res) => {
  res.json({
    url: googleOAuth.getAuthUrl(),
    configured: googleOAuth.isConfigured()
  });
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    console.error("[GOOGLE OAUTH CALLBACK ERROR]", error);
    res.redirect(`${FRONTEND_URL}/?auth=error&message=` + encodeURIComponent(error));
    return;
  }

  if (!code) {
    res.redirect(`${FRONTEND_URL}/?auth=nocode`);
    return;
  }

  try {
    console.log("[GOOGLE OAUTH CALLBACK] Received code from Google redirect. Exchanging...");
    await googleOAuth.exchangeCodeForTokens(code);
    // Redirect back to frontend dashboard
    res.redirect(`${FRONTEND_URL}/?auth=success`);
  } catch (err: any) {
    console.error("[GOOGLE OAUTH CALLBACK EXCEPTION]", err);
    res.redirect(`${FRONTEND_URL}/?auth=error&message=` + encodeURIComponent(err.message));
  }
});

app.post("/api/auth/google/code", async (req, res) => {
  try {
    const { code } = req.body;
    const userProfile = await googleOAuth.exchangeCodeForTokens(code || "demo_code_authorized");
    res.json({ success: true, user: userProfile });
  } catch (err: any) {
    console.error("[API GOOGLE AUTH CODE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/google/user", async (req, res) => {
  try {
    const user = await googleOAuth.getConnectedUser();
    res.json({ connected: !!user, user });
  } catch (err: any) {
    console.error("[API GOOGLE USER ERROR]", err);
    res.json({ connected: false, user: null });
  }
});

app.post("/api/auth/google/disconnect", async (req, res) => {
  try {
    await googleOAuth.disconnectUser();
    res.json({ success: true });
  } catch (err: any) {
    console.error("[API GOOGLE DISCONNECT ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Integrations Status Endpoint
app.get("/api/integrations", async (req, res) => {
  const gmailConnected = await gmail.isConfigured();
  const calendarConnected = await calendar.isConfigured();
  const user = await googleOAuth.getConnectedUser();

  res.json({
    gmail: { connected: gmailConnected, service: "Google Gmail API" },
    calendar: { connected: calendarConnected, service: "Google Calendar API" },
    tasks: { connected: !!user, service: "Google Tasks REST API" },
    socialMedia: { connected: socialMedia.isConfigured(), service: "Slack / Discord / X Workspace Feeds" },
    user: user || null
  });
});

// Live Workspace Data Endpoint (Gmail Inbox, Google Calendar Events, Tasks)
app.get("/api/workspace", async (req, res) => {
  try {
    const emails = await gmail.fetchLiveEmails();
    const calendarEvents = await calendar.fetchLiveCalendarEvents();
    const tasks = await googleTasks.fetchLiveTasks();
    res.json({ emails, calendarEvents, tasks });
  } catch (err: any) {
    console.error("[API WORKSPACE ERROR]", err);
    res.json({ emails: [], calendarEvents: [], tasks: [] });
  }
});

// Calendar Management API Endpoints
app.delete("/api/calendar/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API CALENDAR DELETE] Deleting calendar event ID: ${id}...`);
    const result = await calendar.deleteCalendarEvent(id);
    if (result.success) {
      await logAndEmit("calendar_service", "event_deleted", `Deleted Google Calendar event ID ${id}`);
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    console.error("[API CALENDAR DELETE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/calendar/events", async (req, res) => {
  try {
    const { title, startIso, endIso, location } = req.body;
    console.log(`[API CALENDAR CREATE] Creating event: "${title}"...`);
    const result = await calendar.createCalendarEvent(title, startIso, endIso, location);
    if (result.success) {
      await logAndEmit("calendar_service", "event_created", `Created Google Calendar event "${title}"`);
      res.json({ success: true, eventId: result.eventId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    console.error("[API CALENDAR CREATE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Email Delivery API Endpoint (Send email directly via Gmail API)
app.post("/api/emails/send", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      res.status(400).json({ error: "Missing required fields: to, subject, body" });
      return;
    }

    console.log(`[API EMAIL SEND] Dispatching email to ${to} (Subject: ${subject})...`);
    const result = await gmail.sendEmail(to, subject, body);

    if (result.success) {
      await logAndEmit("email_service", "email_sent", `Successfully sent email to ${to} (Subject: ${subject})`);
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    console.error("[API EMAIL SEND ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Autonomous Email Auto-Responder & Summary Engine API
// Unescape HTML entities utility
function unescapeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export interface ParsedDateTime {
  year: number;
  month: number;
  day: number;
  startHour: number;
  startMinute: number;
  durationHours: number;
  dateStr: string;
  formattedTime: string;
  startIso: string;
  endIso: string;
}

// Dynamic Date & Time Parser
export function parseDateTimeFromText(text: string): ParsedDateTime {
  const lower = (text || "").toLowerCase();

  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  let year = 2026;
  let month = 8; // Default September
  let day = 24;  // Default 24th

  const monthDayRegex = /(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s*(\d{1,2})(?:st|nd|rd|th)?/i;
  const dayMonthRegex = /(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)/i;

  let mMatch = lower.match(monthDayRegex);
  if (mMatch) {
    month = monthMap[mMatch[1].toLowerCase()] ?? 8;
    day = parseInt(mMatch[2], 10);
  } else {
    let dMatch = lower.match(dayMonthRegex);
    if (dMatch) {
      day = parseInt(dMatch[1], 10);
      month = monthMap[dMatch[2].toLowerCase()] ?? 8;
    } else {
      const standaloneDayMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
      if (standaloneDayMatch) {
        day = parseInt(standaloneDayMatch[1], 10);
      }
    }
  }

  const yearMatch = lower.match(/\b(202[5-9])\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  let startHour = 14; // Default 2:00 PM (14:00)
  let startMinute = 0;

  const specificTimeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b|\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|ist)?\b/i;
  const timeMatch = lower.match(specificTimeRegex);

  if (timeMatch) {
    let rawHour = 14;
    let rawMin = 0;
    let ampm = "";

    if (timeMatch[1]) {
      rawHour = parseInt(timeMatch[1], 10);
      rawMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      ampm = (timeMatch[3] || "").toLowerCase();
    } else if (timeMatch[4]) {
      rawHour = parseInt(timeMatch[4], 10);
      rawMin = parseInt(timeMatch[5], 10);
    } else if (timeMatch[6]) {
      rawHour = parseInt(timeMatch[6], 10);
      rawMin = timeMatch[7] ? parseInt(timeMatch[7], 10) : 0;
      ampm = (timeMatch[8] || "").toLowerCase();
    }

    if (ampm === "pm" && rawHour < 12) {
      startHour = rawHour + 12;
    } else if (ampm === "am" && rawHour === 12) {
      startHour = 0;
    } else if (ampm === "am" || ampm === "pm") {
      startHour = rawHour;
    } else if (rawHour >= 1 && rawHour <= 7) {
      startHour = rawHour + 12;
    } else {
      startHour = rawHour;
    }
    startMinute = rawMin;
  }

  const durationHours = (lower.includes("interview") || lower.includes("prep") || lower.includes("block")) ? 3 : 1;

  const pad = (num: number) => (num < 10 ? `0${num}` : `${num}`);
  const padMonth = pad(month + 1);
  const padDay = pad(day);

  const dateStr = `${year}-${padMonth}-${padDay}`;
  const startIso = `${dateStr}T${pad(startHour)}:${pad(startMinute)}:00+05:30`;

  let endHour = startHour + durationHours;
  let endMinute = startMinute;
  const endIso = `${dateStr}T${pad(endHour)}:${pad(endMinute)}:00+05:30`;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const displayHour = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
  const displayAmpm = startHour >= 12 ? "PM" : "AM";
  const displayMinStr = startMinute > 0 ? `:${pad(startMinute)}` : ":00";
  const formattedTime = `${monthNames[month]} ${day}, ${year} at ${displayHour}${displayMinStr} ${displayAmpm} IST`;

  return {
    year,
    month,
    day,
    startHour,
    startMinute,
    durationHours,
    dateStr,
    formattedTime,
    startIso,
    endIso
  };
}

// Unified Schedule Evaluation, Overlap Conflict Sentinel & Auto-Reply Dispatch Engine
async function evaluateEmailScheduleAndConflicts(
  sender: string,
  subject: string,
  body: string,
  userInstruction: string = ""
) {
  const cleanSender = unescapeHtmlEntities(sender);
  const cleanSubject = unescapeHtmlEntities(subject);
  const cleanBody = unescapeHtmlEntities(body);
  const cleanInstruction = unescapeHtmlEntities(userInstruction);

  const combinedText = `${cleanSubject} ${cleanBody} ${cleanInstruction}`;
  const parsed = parseDateTimeFromText(combinedText);

  // Fetch live Google Calendar events
  const liveEvents = await calendar.fetchLiveCalendarEvents(14);

  const reqStart = new Date(parsed.startIso).getTime();
  const reqEnd = new Date(parsed.endIso).getTime();

  // Evaluate overlapping calendar events
  const overlappingEvents = liveEvents.filter(e => {
    const eStart = new Date(e.start).getTime();
    const eEnd = new Date(e.end).getTime();
    return reqStart < eEnd && reqEnd > eStart;
  });

  const recipientName = cleanSender.split("@")[0].replace(/[\._]/g, " ");
  const greetingName = recipientName.charAt(0).toUpperCase() + recipientName.slice(1);
  const systemFooter = `\n\n--\n[LifeGuard AI Sentinel — System Generated Response on behalf of Hitarth Sherathiya]`;

  let isConflict = overlappingEvents.length > 0 || cleanInstruction.toLowerCase().includes("reschedule");
  let replyBody = "";
  let summaryText = "";

  if (isConflict) {
    const conflictingTitle = overlappingEvents[0]?.title || "Scheduled Calendar Event";

    // Calculate alternate slot (try 4:30 PM same day, 11:00 AM same day, or 2:00 PM next day)
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const candidateSlots = [
      { startHour: 16, startMin: 30, dayOffset: 0, label: `September ${parsed.day} at 4:30 PM IST` },
      { startHour: 11, startMin: 0, dayOffset: 0, label: `September ${parsed.day} at 11:00 AM IST` },
      { startHour: 14, startMin: 0, dayOffset: 1, label: `September ${parsed.day + 1} at 2:00 PM IST` }
    ];

    let chosenSlot = candidateSlots[0];
    let altStartIso = "";
    let altEndIso = "";

    for (const cand of candidateSlots) {
      const candDay = parsed.day + cand.dayOffset;
      const candMonthStr = pad(parsed.month + 1);
      const candDayStr = pad(candDay);
      const cDateStr = `${parsed.year}-${candMonthStr}-${candDayStr}`;
      
      const cStartIso = `${cDateStr}T${pad(cand.startHour)}:${pad(cand.startMin)}:00+05:30`;
      const cEndIso = `${cDateStr}T${pad(cand.startHour + parsed.durationHours)}:${pad(cand.startMin)}:00+05:30`;

      const cStart = new Date(cStartIso).getTime();
      const cEnd = new Date(cEndIso).getTime();

      const candOverlaps = liveEvents.filter(e => {
        const eStart = new Date(e.start).getTime();
        const eEnd = new Date(e.end).getTime();
        return cStart < eEnd && cEnd > eStart;
      });

      if (candOverlaps.length === 0) {
        chosenSlot = cand;
        altStartIso = cStartIso;
        altEndIso = cEndIso;
        break;
      }
    }

    if (!altStartIso) {
      altStartIso = `${parsed.dateStr}T16:30:00+05:30`;
      altEndIso = `${parsed.dateStr}T19:30:00+05:30`;
    }

    // Delete original conflicting events from Google Calendar to eliminate double-booking / overlap
    for (const ov of overlappingEvents) {
      if (ov.id) {
        console.log(`[CALENDAR OVERLAP SENTINEL] Deleting original conflicting event ID ${ov.id} ("${ov.title}") from Google Calendar...`);
        try {
          await calendar.deleteCalendarEvent(ov.id);
        } catch (delErr: any) {
          console.warn("[CALENDAR OVERLAP SENTINEL] Event deletion note:", delErr.message);
        }
      }
    }

    replyBody = `Hi ${greetingName},\n\nThank you for reaching out regarding "${cleanSubject}". I appreciate your email.\n\nUpon analyzing my Google Calendar, I noticed that ${parsed.formattedTime} had a scheduling conflict with "${conflictingTitle}". I have removed the conflicting original slot and rescheduled our session to ${chosenSlot.label} instead.\n\nMy schedule is now updated and confirmed in Google Calendar for ${chosenSlot.label}. Please let me know if this works for you.\n\nWarm regards,\nHitarth Sherathiya${systemFooter}`;

    summaryText = `## Autonomous AI Email & Calendar Overlap Sentinel\n\n• **Sender**: **${cleanSender}**\n• **Requested Date & Time**: **${parsed.formattedTime}**\n• **Schedule Conflict Action**: Removed original conflicting event **"${conflictingTitle}"** from Google Calendar.\n• **AI Over-Scheduling Resolution**: Auto-reply sent to ${cleanSender} proposing confirmed rescheduled slot **(${chosenSlot.label})**.\n• **Calendar Protection**: Confirmed rescheduled focus block added to Google Calendar at ${chosenSlot.label}.\n• **Notification Status**: Zero double-booking. Sentinel protection complete.`;

    // Confirm & add rescheduled event to Google Calendar
    await calendar.createCalendarEvent(`Confirmed (Rescheduled): ${cleanSubject}`, altStartIso, altEndIso);
  } else {
    // No conflict! Confirm slot & create calendar event
    replyBody = `Hi ${greetingName},\n\nThank you for reaching out regarding "${cleanSubject}". I appreciate your message.\n\nI have received your email and confirmed the time slot for ${parsed.formattedTime}. My calendar schedule has been checked and verified — zero overlaps detected.\n\nEverything is set and synced with my Google Calendar. Should you need any additional details, please feel free to reach out.\n\nWarm regards,\nHitarth Sherathiya${systemFooter}`;

    summaryText = `## Autonomous Email Auto-Responder & Calendar Synthesis\n\n• **Sender**: **${cleanSender}**\n• **Requested Date & Time**: **${parsed.formattedTime}**\n• **Calendar Schedule Check**: Evaluated Google Calendar schedule — zero meeting overlaps.\n• **Calendar Action**: Event "${cleanSubject}" automatically added to Google Calendar.\n• **Automated Reply**: Sent confirmation reply to ${cleanSender} with warm sentiments & system footer.\n• **Notification Status**: Calendar updated smoothly.`;

    // Automatically create event in Google Calendar at exact requested start/end time
    await calendar.createCalendarEvent(`Confirmed: ${cleanSubject}`, parsed.startIso, parsed.endIso);
  }

  // Send email reply via Gmail API
  const replySubject = cleanSubject.startsWith("Re:") ? cleanSubject : `Re: ${cleanSubject}`;
  const sendRes = await gmail.sendEmail(cleanSender, replySubject, replyBody);

  return {
    cleanSender,
    cleanSubject,
    replySubject,
    replyBody,
    summaryText,
    isConflict,
    parsed,
    sendRes
  };
}

// Autonomous Email Auto-Responder & Summary Engine API
app.post("/api/emails/auto-respond", async (req, res) => {
  try {
    const { sender, subject, body } = req.body;
    const rawSender = sender || "recruiter@amazon.com";
    const rawSubject = subject || "Amazon Technical Interview Confirmation & Logistics";
    const rawBody = body || "Hi Hitarth, confirming your technical interview scheduled for September 24 at 2:00 PM IST. Please confirm if you received this.";

    console.log(`[API AUTO-RESPOND] Processing incoming email from ${rawSender}...`);

    const result = await evaluateEmailScheduleAndConflicts(rawSender, rawSubject, rawBody);

    // Emit live SSE audit & reasoning event
    await logAndEmit("auto_responder", "auto_reply_sent", `Autonomous Agent answered email from ${result.cleanSender} and notified operator.`);
    broadcastEvent("agent_response", {
      prompt: `Autonomous Auto-Response: ${result.cleanSubject}`,
      reasoning: result.summaryText
    });

    res.json({
      success: true,
      sender: result.cleanSender,
      subject: result.cleanSubject,
      autoReplySent: result.sendRes.success,
      summary: result.summaryText
    });
  } catch (err: any) {
    console.error("[API AUTO-RESPOND ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Smart AI Email Reply Builder Endpoint (Builds complete email around user's brief points & sends automatically)
app.post("/api/emails/smart-reply-builder", async (req, res) => {
  try {
    const { sender, subject, incomingBody, userInstruction } = req.body;

    const rawSender = sender || "recruiter@techcorp.com";
    const rawSubject = subject || "Routine Query & Proposal Confirmation";
    const rawIncomingBody = incomingBody || "";
    const rawUserInstruction = userInstruction || "";

    console.log(`[SMART EMAIL BUILDER] Building AI response for ${rawSender}...`);

    const result = await evaluateEmailScheduleAndConflicts(rawSender, rawSubject, rawIncomingBody, rawUserInstruction);

    // Log & Emit SSE Event to notify Captain instantly
    await logAndEmit("smart_email_reply", "auto_email_dispatched", `Autonomous Agent built & sent reply to ${result.cleanSender}.`);
    broadcastEvent("agent_response", {
      prompt: `AI Auto-Reply Dispatched: ${result.replySubject}`,
      reasoning: result.summaryText
    });

    res.json({
      success: true,
      recipient: result.cleanSender,
      subject: result.replySubject,
      replyBody: result.replyBody,
      summaryText: result.summaryText,
      messageId: result.sendRes.messageId
    });
  } catch (err: any) {
    console.error("[SMART EMAIL BUILDER ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// External Webhook Payload Ingestion API Endpoint
app.post("/api/events/ingest", async (req, res) => {
  try {
    const rawPayload = req.body;
    console.log("[API INGEST] Received incoming webhook payload:", typeof rawPayload === "object" ? Object.keys(rawPayload) : typeof rawPayload);
    const enqueueResult = await messageQueue.enqueue(rawPayload);
    res.json(enqueueResult);
  } catch (err: any) {
    console.error("[API INGEST ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Approve Pending Action
app.post("/api/actions/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body;

  try {
    console.log(`[API] Approving action: ${id} (Session: ${sessionId})`);
    
    const db = await getDb();
    const action = await db.get("SELECT * FROM action_proposals WHERE id = ?", [id]);
    if (!action) {
      res.status(404).json({ error: "Action not found" });
      await db.close();
      return;
    }

    if (action.status !== "awaiting_approval") {
      res.status(400).json({ error: "Action is not awaiting approval" });
      await db.close();
      return;
    }

    // Update local DB
    await db.run("UPDATE action_proposals SET status = 'approved' WHERE id = ?", [id]);
    await db.run(
      "INSERT INTO approvals (id, action_id, decision, approved_at) VALUES (?, ?, ?, ?)",
      [`appr_${Date.now()}`, id, "approved", new Date().toISOString()]
    );
    await db.close();

    await logAndEmit(sessionId || "system", "user_approval", `Approved proposed action: ${action.type}`);

    // Call TrueForge to resume turn with approval
    broadcastEvent("agent_status", { status: "resuming", message: "Resuming agent execution loop..." });

    // Submit the tool approval event input item
    console.log(`[TRUEFORGE] Resuming session ${sessionId} with approval for ${id}`);
    try {
      const stream = await tf.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.tool_approval",
            toolCallId: id,
            threadId: "main",
            approval: { status: "allow" }
          }
        ]
      });
      handleAgentStream(sessionId, stream);
    } catch (streamErr: any) {
      let details: any = {};
      try { details = JSON.parse(action.details); } catch (e) {}

      if (action.type === "create_calendar_event" || action.type === "add_event") {
        const title = details.title || "Interview Prep Session (3 hrs)";
        const startIso = details.startIso || "2026-09-24T11:00:00+05:30";
        const endIso = details.endIso || "2026-09-24T14:00:00+05:30";
        await calendar.createCalendarEvent(title, startIso, endIso);
        console.log(`[ACTION EXECUTED] Created Google Calendar event: ${title} (${startIso} - ${endIso})`);
      } else if (action.type === "delete_calendar_event" || action.type === "delete_event") {
        const eventId = details.eventId;
        if (eventId) {
          await calendar.deleteCalendarEvent(eventId);
          console.log(`[ACTION EXECUTED] Deleted Google Calendar event: ${eventId}`);
        }
      } else if (action.type === "send_email" && details.recipient) {
        await gmail.sendEmail(details.recipient, details.subject || "Verification", details.body || "Confirmed.");
      }

      await logAndEmit(sessionId || "standalone", "action_executed", `Action ${id} (${action.type}) approved by user and executed successfully.`);
      broadcastEvent("agent_status", { status: "done", message: "Human approval received. Action executed successfully." });
      
      const db2 = await getDb();
      await db2.run("UPDATE risks SET status = 'resolved' WHERE status = 'needs_investigation'");
      await db2.close();
      broadcastEvent("risks_updated", {});
      broadcastEvent("actions_updated", {});
    }

    res.json({ success: true, status: "approved" });
  } catch (err: any) {
    console.error("[API] Approve error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reject Pending Action
app.post("/api/actions/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { sessionId, reason } = req.body;

  try {
    console.log(`[API] Rejecting action: ${id} (Session: ${sessionId})`);

    const db = await getDb();
    const action = await db.get("SELECT * FROM action_proposals WHERE id = ?", [id]);
    if (!action) {
      res.status(404).json({ error: "Action not found" });
      await db.close();
      return;
    }

    // Update local DB
    await db.run("UPDATE action_proposals SET status = 'rejected' WHERE id = ?", [id]);
    await db.run(
      "INSERT INTO approvals (id, action_id, decision, reason, approved_at) VALUES (?, ?, ?, ?, ?)",
      [`appr_${Date.now()}`, id, "rejected", reason || "Rejected by user", new Date().toISOString()]
    );
    await db.close();

    await logAndEmit(sessionId || "system", "user_rejection", `Rejected proposed action: ${action.type}. Reason: ${reason || "None"}`);

    // Call TrueForge to resume turn with rejection
    broadcastEvent("agent_status", { status: "resuming", message: "Resuming agent with rejection..." });

    try {
      const stream = await tf.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.tool_approval",
            toolCallId: id,
            threadId: "main",
            approval: { status: "deny", reason: reason || "Rejected by user" }
          }
        ]
      });
      handleAgentStream(sessionId, stream);
    } catch (streamErr: any) {
      console.warn("[API] TrueForge stream offline, logging rejection in Standalone Sentinel mode:", streamErr.message);
      await logAndEmit(sessionId || "standalone", "action_cancelled", `Action ${id} (${action.type}) rejected by user.`);
      broadcastEvent("agent_status", { status: "done", message: "Human rejection received. Action cancelled." });
    }

    res.json({ success: true, status: "rejected" });
  } catch (err: any) {
    console.error("[API] Reject error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger New Observation Cycle
app.post("/api/trigger", async (req, res) => {
  const { prompt } = req.body;
  const targetPrompt = prompt || "Perform a full system check. Review emails, calendar, and files to detect any risks or commitments that are at risk or need attention.";

  try {
    console.log(`[API] Triggering observation with prompt: "${targetPrompt}"`);
    
    // Create new session
    const session = await tf.sessions.create({
      agent: { name: "lifeguard-agent" }
    });

    // Session ID is nested inside response data
    const sessionId = session.data.id;
    console.log(`[TRUEFORGE] Session created: ${sessionId}`);

    // Clear risks & proposals to start fresh in the dashboard
    const db = await getDb();
    await db.run("DELETE FROM risks");
    await db.run("DELETE FROM action_proposals");
    await db.run("DELETE FROM approvals");
    await db.close();

    await logAndEmit(sessionId, "session_start", "LifeGuard active monitoring sequence initialized.");

    // Trigger turn stream
    const stream = await tf.sessions.createTurnStream(sessionId, {
      input: [
        {
          type: "user.message",
          content: [
            {
              type: "text",
              text: targetPrompt
            }
          ]
        }
      ]
    });

    // Handle stream asynchronously
    handleAgentStream(sessionId, stream);

    res.json({ success: true, sessionId });
  } catch (err: any) {
    console.warn("[API] TrueForge harness unreachable, switching to Standalone Sentinel Mode:", err.message);
    const fallbackSessionId = `standalone_${Date.now()}`;
    runStandaloneObservation(fallbackSessionId, targetPrompt);
    res.json({ success: true, sessionId: fallbackSessionId, mode: "standalone" });
  }
});

// Standalone Demonstration & Observation Runner
async function runStandaloneObservation(sessionId: string, prompt: string) {
  console.log(`[LIVE SENTINEL] Executing multi-dimensional observation for session: ${sessionId}`);
  
  const db = await getDb();
  await db.run("DELETE FROM risks");
  await db.run("DELETE FROM action_proposals");
  await db.run("DELETE FROM approvals");

  await logAndEmit(sessionId, "session_start", "LifeGuard active monitoring sequence initialized.");
  await logAndEmit(sessionId, "observation_start", "Scanning authorized live environments (Gmail, Google Calendar, Social Feeds)...");

  // Fetch signals from live integration services
  const emails = await gmail.fetchLiveEmails();
  const calendarEvents = await calendar.fetchLiveCalendarEvents(14);
  const tasks = await googleTasks.fetchLiveTasks();
  const workspaceSignals = await socialMedia.fetchLiveWorkspaceFeeds();

  let bedrockProposals: any[] = [];
  // Run AWS Bedrock AI Agent Observation Cycle (Using AWS_BEARER_TOKEN_BEDROCK)
  try {
    const bedrockResult = await bedrockAgent.runObservationCycle(prompt, emails, calendarEvents, tasks);
    bedrockProposals = bedrockResult.proposals || [];
    if (bedrockResult.reasoning) {
      await logAndEmit(sessionId, "agent_message", bedrockResult.reasoning);
      broadcastEvent("agent_response", { prompt, reasoning: bedrockResult.reasoning });
    }
  } catch (bErr: any) {
    console.warn("[LIVE SENTINEL] Bedrock invocation note:", bErr.message);
  }

  // Evaluate multi-dimensional risk scores
  const risks = riskEngine.analyzeEnvironment(emails, calendarEvents, workspaceSignals, 14);

  for (const r of risks) {
    await db.run(
      "INSERT INTO risks (id, status, category, severity, confidence, signals, description, consequences, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        r.id,
        "needs_investigation",
        r.category,
        r.severity,
        r.confidence,
        JSON.stringify(r.signals),
        r.description,
        JSON.stringify(r.consequences),
        new Date().toISOString()
      ]
    );
  }

  // Insert any proposals generated by Bedrock AI
  if (bedrockProposals && bedrockProposals.length > 0) {
    for (const p of bedrockProposals) {
      await db.run(
        "INSERT INTO action_proposals (id, risk_id, type, approval_required, status, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          p.id,
          p.risk_id,
          p.type,
          p.approval_required ? 1 : 0,
          "awaiting_approval",
          JSON.stringify(p.details),
          new Date().toISOString()
        ]
      );
    }
  }

  await db.close();

  await logAndEmit(sessionId, "risk_detected", `Detected ${risks.length} active risks across Travel Readiness, Financial Cash-Flow, and Workload Capacity.`);
  await logAndEmit(sessionId, "approval_required", "Consequential action requires explicit human approval before proceeding.");

  broadcastEvent("risks_updated", {});
  broadcastEvent("actions_updated", {});
  
  if (bedrockProposals && bedrockProposals.length > 0) {
    broadcastEvent("agent_event", {
      type: "tool.approval_required",
      toolCalls: [{ id: bedrockProposals[0].id }]
    });
    broadcastEvent("agent_status", {
      status: "paused",
      message: "Agent is waiting for human approval on consequential action."
    });
  } else {
    broadcastEvent("agent_status", {
      status: "done",
      message: "LifeGuard observation complete."
    });
  }
}

// Stream Event Handler
async function handleAgentStream(sessionId: string, stream: any) {
  console.log(`[TRUEFORGE] Listening to agent stream for session: ${sessionId}`);
  broadcastEvent("agent_status", { status: "running", message: "Agent is actively reasoning..." });

  try {
    for await (const event of stream) {
      console.log(`[TRUEFORGE EVENT] Type: ${event.type}`);

      // Emit event directly to frontend
      broadcastEvent("agent_event", event);

      switch (event.type) {
        case "turn.created":
          await logAndEmit(sessionId, "agent_turn_start", `Agent turn created: ${event.id}`);
          break;

        case "model.message":
          // Parse text content if present
          if (event.content && Array.isArray(event.content)) {
            for (const part of event.content) {
              if (part.type === "text" && part.text) {
                // If it's a message, log it
                await logAndEmit(sessionId, "agent_message", part.text);
              }
            }
          }

          // Cache tool call arguments so we can retrieve them in tool.approval_required
          if (event.toolCalls && Array.isArray(event.toolCalls)) {
            for (const call of event.toolCalls) {
              const callId = call.id;
              const name = call.function?.name || call.toolInfo?.name;
              let args = {};
              try {
                args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
              } catch (e) {}

              console.log(`[TOOL CALL CACHE] Cached ${callId}: ${name} with args:`, args);
              toolCallCache.set(callId, {
                name,
                args,
                serverName: call.toolInfo?.serverName || "lifeguard-mcp"
              });
            }
          }
          break;

        case "tool.response":
          // Log tool response
          const toolResult = event.content && event.content[0]?.text;
          await logAndEmit(sessionId, "tool_response", `Tool response received: ${toolResult ? toolResult.substring(0, 200) : "No result text"}`);
          break;

        case "sandbox.created":
          await logAndEmit(sessionId, "sandbox_created", `Daytona isolated sandbox created successfully. Sandbox ID: ${event.sandboxId}`);
          break;

        case "tool.approval_required":
          console.log("[TRUEFORGE] Intercepted tool approval requirement event. Awaiting user response.");
          await logAndEmit(sessionId, "approval_required", "Consequential action requires user approval.");
          
          // Map toolCallRefs back to our cached info so frontend gets full details
          const proposals: any[] = [];
          if (event.toolCalls && Array.isArray(event.toolCalls)) {
            const db = await getDb();
            for (const ref of event.toolCalls) {
              const cached = toolCallCache.get(ref.id) || { name: "Unknown", args: {}, serverName: "unknown" };
              
              // We will save to DB as proposed action awaiting approval
              const detailsText = JSON.stringify(cached.args);
              await db.run(
                "INSERT INTO action_proposals (id, risk_id, type, approval_required, status, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status='awaiting_approval'",
                [ref.id, "active_risks", cached.name, 1, "awaiting_approval", detailsText, new Date().toISOString()]
              );
              
              proposals.push({
                id: ref.id,
                type: cached.name,
                details: cached.args
              });
            }
            await db.close();
          }

          broadcastEvent("agent_status", { status: "paused", message: "Agent is waiting for approval on consequential action(s)." });
          break;

        case "turn.done":
          const hasPending = event.state?.pendingActions && event.state.pendingActions.length > 0;
          if (hasPending) {
            broadcastEvent("agent_status", { status: "paused", message: "Turn complete. Awaiting human-in-the-loop actions." });
            await logAndEmit(sessionId, "turn_done_paused", "Agent turn completed. Awaiting user approvals.");
          } else {
            broadcastEvent("agent_status", { status: "done", message: "Agent execution complete. All actions executed successfully." });
            await logAndEmit(sessionId, "session_complete", "LifeGuard active monitoring sequence completed.");
            
            // Mark all risks associated with this run as resolved
            const db = await getDb();
            await db.run("UPDATE risks SET status = 'resolved' WHERE status = 'needs_investigation'");
            await db.close();
            broadcastEvent("risks_updated", {});
          }
          break;

        default:
          break;
      }
    }
  } catch (err: any) {
    console.error("[TRUEFORGE STREAM ERROR]", err);
    await logAndEmit(sessionId, "error", `Orchestrator error occurred: ${err.message}`);
    broadcastEvent("agent_status", { status: "error", message: `Agent error: ${err.message}` });
  }
}

// Auto-Configuration of TrueForge components on startup
async function setupTrueForge() {
  console.log("[TRUEFORGE SETUP] Initializing setup sequence...");

  try {
    // 1. Setup OpenAI Model Provider if key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      console.log("[TRUEFORGE SETUP] Registering OpenAI model provider...");
      try {
        await tf.settings.modelProviders.create({
          manifest: {
            type: "openai",
            auth: { apiKey },
            models: [
              { modelId: "gpt-4o-mini", name: "gpt-4o-mini", properties: {} },
              { modelId: "gpt-4o", name: "gpt-4o", properties: {} }
            ]
          }
        });
        console.log("[TRUEFORGE SETUP] OpenAI model provider registered successfully.");
      } catch (err: any) {
        // If it already exists or errors, log it but don't fail
        console.log("[TRUEFORGE SETUP] Model provider registration note:", err.message);
      }
    } else {
      console.warn("[TRUEFORGE SETUP] WARNING: OPENAI_API_KEY env variable not found. Auto-configuration of model provider skipped.");
    }

    // 2. Setup Daytona Sandbox Provider if Daytona key is set
    const daytonaKey = process.env.DAYTONA_API_KEY;
    if (daytonaKey) {
      console.log("[TRUEFORGE SETUP] Registering Daytona sandbox provider...");
      try {
        await tf.settings.sandboxProviders.createOrUpdate({
          manifest: {
            type: "daytona",
            auth: { apiKey: daytonaKey },
            autoArchiveIntervalInMinutes: 60,
            autoDeleteIntervalInMinutes: 1440,
            autoStopIntervalInMinutes: 15,
            execTimeoutMs: 30000
          }
        });
        console.log("[TRUEFORGE SETUP] Daytona sandbox provider registered successfully.");
      } catch (err: any) {
        console.log("[TRUEFORGE SETUP] Sandbox provider registration note:", err.message);
      }
    }

    // 3. Register custom MCP server
    console.log("[TRUEFORGE SETUP] Registering LifeGuard MCP server...");
    try {
      await tf.settings.mcpServers.create({
        manifest: {
          name: "lifeguard-mcp",
          description: "LifeGuard environment observation and communication tools",
          type: "remote",
          url: "http://localhost:3001/sse"
        }
      });
      console.log("[TRUEFORGE SETUP] LifeGuard MCP server registered successfully.");
    } catch (err: any) {
      console.log("[TRUEFORGE SETUP] MCP registration note:", err.message);
    }

    // 4. Create the LifeGuard Agent specification
    console.log("[TRUEFORGE SETUP] Registering LifeGuard Agent...");
    const systemPrompt = `You are LifeGuard, a proactive multi-agent risk detection and recovery system.
Your goal is to monitor the user's authorized environments (email, calendar, documents) using your MCP tools, detect potential risks, analyze their consequences, run calculations in a sandbox, compile recovery options, and execute permitted safe actions.

CRITICAL STEPS:
1. GATHER SIGNALS:
   - Call "get_emails", "get_calendar_events", and "get_documents" to collect environment signals.

2. DETECT RISKS:
   - Analyze emails, calendar events, and documents to check for:
     * Travel Readiness issues (e.g., flight tomorrow but no hotel booking, transport missing, passport expiring in under 1 month).
     * Commitment/Task Deadlines at risk (e.g., client deadline on Friday, but draft document is only 10% done and calendar is full of meetings on Thursday/Friday).
     * Subscription / Financial risks (e.g., active recurring subscriptions with zero/low recent utility).
     * Other critical tasks or schedule conflicts missed.

3. SANDBOX CALCULATIONS:
   - If you detect dates, deadlines, or workload calculations, you MUST run a sandbox code snippet to verify them.
   - For example: write a python code to calculate date differences (e.g. flight date vs passport expiry date) or estimate workload capacities (remaining hours in calendar vs required study/writing hours).
   - Show that you are running code in the Daytona sandbox to calculate these statistics.

4. RECORD DISCOVERED RISKS:
   - When you identify a risk, you MUST call the "record_risk" tool with a unique ID (e.g., risk_travel_01), category, severity, confidence, signals list, description, and consequences list.
   - This records it in the system database for the dashboard interface.

5. GENERATE RECOVERY OPTIONS:
   - For every risk, compile clear options (e.g., Option A, Option B).
   - If an option requires an external or destructive action (like "send_email" to a hotel or client, or "update_calendar_event" to move things):
     * You MUST register this action by calling "propose_action" (setting "approval_required" to true, and providing details).
     * Do NOT call "send_email" or "update_calendar_event" directly inside this turn, since they will require approval and TrueForge will pause! Just propose them via the tool.
   - For non-consequential options (like "Generate checklist"), you can propose them with "approval_required" to false, and execute them safely.

6. AWAIT APPROVAL:
   - After you have recorded the risks and proposed actions, provide a clear structured markdown summary to the user explaining:
     * What was observed.
     * The confidence and severity of the risk.
     * The sandbox calculation results.
     * The recovery options available.
     * State clearly that you are pausing for human approval on the proposed actions.`;

    try {
      await tf.agents.create({
        name: "lifeguard-agent",
        manifest: {
          instructions: systemPrompt,
          model: {
            name: "openai/gpt-4o-mini"
          },
          mcpServers: [
            {
              name: "lifeguard-mcp",
              enableTools: ["@all"],
              requireApprovalForTools: ["send_email", "update_calendar_event"]
            }
          ],
          config: {
            sandbox: {
              enabled: true
            }
          }
        }
      });
      console.log("[TRUEFORGE SETUP] LifeGuard Agent registered successfully.");
    } catch (err: any) {
      console.log("[TRUEFORGE SETUP] Agent registration note:", err.message);
    }

    console.log("[TRUEFORGE SETUP] Setup sequence completed successfully.");
  } catch (err: any) {
    console.error("[TRUEFORGE SETUP] Setup failed:", err);
  }
}

// Start Express Server locally
async function start() {
  await initDb();
  await setupTrueForge();
  
  app.listen(PORT, () => {
    console.log(`[BACKEND] Server running on http://localhost:${PORT}`);
  });
}

// Export Lambda handler & default Express app for Vercel / AWS Cloud Serverless deployment
export const handler = serverless(app);
export default app;

// Start Express Server locally if not running in AWS Lambda / Vercel Serverless
if (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL) {
  start().catch((err: any) => {
    console.error("[BACKEND] Critical failure starting server:", err);
    process.exit(1);
  });
}
