import { useState, useEffect } from "react";

// Interfaces
interface Risk {
  id: string;
  status: string;
  category: string;
  severity: string;
  confidence: number;
  signals: string[];
  description: string;
  consequences: string[];
  created_at: string;
}

interface ActionProposal {
  id: string;
  risk_id: string;
  type: string;
  approval_required: boolean;
  status: string;
  details: any;
  created_at: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  connected_at: string;
}

interface IntegrationsStatus {
  gmail: { connected: boolean; service: string };
  calendar: { connected: boolean; service: string };
  tasks: { connected: boolean; service: string };
  socialMedia: { connected: boolean; service: string };
  user: GoogleUser | null;
}

const BACKEND_URL = "http://localhost:3002";

const unescapeHtmlEntities = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
};

// Dynamic Technical & Event Timing Extractor for Email Display
const extractTimingBadge = (subject: string, body: string): string | null => {
  const combined = `${subject} ${body}`;
  const text = combined.toLowerCase();

  const monthDayTimeRegex = /(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|ist)?)/i;
  const dayMonthTimeRegex = /(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s*(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|ist)?)/i;

  const m1 = combined.match(monthDayTimeRegex);
  if (m1) return `${m1[1]} ${m1[2]} at ${m1[3]}`;

  const m2 = combined.match(dayMonthTimeRegex);
  if (m2) return `${m2[1]} ${m2[2]} at ${m2[3]}`;

  const timeRegex = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|IST)?|\d{1,2}\s*(?:AM|PM)\s*IST?)\b/i;
  const m3 = combined.match(timeRegex);
  if (m3 && (text.includes("interview") || text.includes("schedule") || text.includes("meeting") || text.includes("confirm"))) {
    return `Event Time: ${m3[1]}`;
  }

  return null;
};

// Web Audio API Subtle Chime Sound Engine
const playUiSound = (type: "click" | "success" | "notification") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "click") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "success") {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "notification") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio permission blocks
  }
};

// Clean SVG Vector Icons (Zero Emojis)
const ShieldIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const CompassIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);
const SparklesIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/><path d="M5 3 4 6 1 7l3 1 1 3 1-3 3-1-3-1-1-3z"/></svg>
);
const LifeBuoyIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>
);
const CalendarIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const DollarSignIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const PlaneIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.1.5l-1 1.7c-.2.4-.1.9.2 1.2l5.5 4.5-3.5 3.5-2.5-.5c-.4-.1-.8.1-1 .4l-.7.7c-.2.3-.2.8.1 1.1l2.5 2.5 2.5 2.5c.3.3.8.3 1.1.1l.7-.7c.3-.2.5-.6.4-1l-.5-2.5 3.5-3.5 4.5 5.5c.3.3.8.4 1.2.2l1.7-1c.4-.2.6-.6.5-1.1z"/></svg>
);
const BriefcaseIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const MailIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const CheckIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
);
const XIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SendIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const UserIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const CpuIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
);
const EyeOffIcon = () => (
  <svg className="icon" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

interface LiveEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  category?: "travel" | "financial" | "work" | "general";
}

interface LiveCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  isMandatory?: boolean;
}

interface LiveGoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
}

interface WorkspaceData {
  emails: LiveEmail[];
  calendarEvents: LiveCalendarEvent[];
  tasks: LiveGoogleTask[];
}

// Premium Formatted AI Text & Reasoning Component (Clean Markdown Renderer)
const FormattedAiText = ({ text }: { text: string }) => {
  if (!text) return null;

  // Split text by triple backtick code blocks
  const codeBlockRegex = /```([a-z]*)\n?([\s\S]*?)```/g;
  const sections: Array<{ type: "code" | "text"; language?: string; content: string }> = [];

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      sections.push({ type: "text", content: text.substring(lastIndex, match.index) });
    }
    sections.push({ type: "code", language: match[1], content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    sections.push({ type: "text", content: text.substring(lastIndex) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {sections.map((sec, sIdx) => {
        if (sec.type === "code") {
          return (
            <div
              key={sIdx}
              style={{
                background: "#020617",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "14px 18px",
                borderRadius: "14px",
                color: "#38bdf8",
                fontSize: "12px",
                lineHeight: 1.6,
                fontFamily: "monospace",
                overflowX: "auto",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)"
              }}
            >
              <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, marginBottom: "8px", letterSpacing: "0.5px" }}>
                AI Expanded Email Body / Code Snippet
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>{sec.content}</div>
            </div>
          );
        }

        // Process text content: split into lines
        const rawLines = sec.content.split("\n").map(l => l.trim()).filter(Boolean);
        return rawLines.map((line, lIdx) => {
          // Header check
          if (line.startsWith("#") || (line.startsWith("**") && line.endsWith("**") && !line.includes(":"))) {
            const headerClean = line.replace(/^[#\*]+\s*/, "").replace(/\*+$/, "");
            return (
              <div key={`${sIdx}-${lIdx}`} style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "10px 14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#6366f1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SparklesIcon />
                </div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.2px" }}>
                  {headerClean}
                </h4>
              </div>
            );
          }

          // Bullet list item check
          const isBullet = /^[•\-\d+\.]/.test(line);
          if (isBullet) {
            const cleanLine = line.replace(/^[•\-\d+\.]\s*/, "").trim();
            if (!cleanLine) return null;

            const boldMatch = cleanLine.match(/^\*\*(.*?)\*\*:?\s*(.*)/);
            let titlePart = "";
            let bodyPart = cleanLine;

            if (boldMatch) {
              titlePart = boldMatch[1];
              bodyPart = boldMatch[2];
            }

            return (
              <div key={`${sIdx}-${lIdx}`} style={{ background: "rgba(2, 6, 23, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 14px", borderRadius: "12px", fontSize: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ color: "#38bdf8", marginTop: "2px", flexShrink: 0 }}>
                  <CheckIcon />
                </div>
                <div style={{ lineHeight: 1.6, color: "#cbd5e1" }}>
                  {titlePart && <span style={{ fontWeight: 800, color: "#f8fafc", marginRight: "6px", background: "rgba(99, 102, 241, 0.15)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(99, 102, 241, 0.3)" }}>{titlePart}</span>}
                  <span>{bodyPart.replace(/\*\*/g, "")}</span>
                </div>
              </div>
            );
          }

          // Plain text line
          return (
            <div key={`${sIdx}-${lIdx}`} style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", lineHeight: 1.6, color: "#e2e8f0" }}>
              {line.replace(/\*\*/g, "")}
            </div>
          );
        });
      })}
    </div>
  );
};

export default function App() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [actions, setActions] = useState<ActionProposal[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedLogo, setSelectedLogo] = useState<"shield" | "compass" | "sparkle" | "lifebuoy">("sparkle");
  const [aiResponse, setAiResponse] = useState<{ prompt: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "emails" | "calendar" | "risks">("all");

  // Functional Category Filter and Dismiss States
  const [emailCategoryFilter, setEmailCategoryFilter] = useState<"all" | "work" | "financial" | "general">("all");
  const [dismissedEmailIds, setDismissedEmailIds] = useState<string[]>([]);

  // Email Compose & Auto-Responder Modal States
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<string | null>(null);
  const [isAutoResponding, setIsAutoResponding] = useState(false);

  // AI Smart Email Reply Builder States
  const [selectedEmailForReply, setSelectedEmailForReply] = useState<LiveEmail | null>(null);
  const [quickReplyInstruction, setQuickReplyInstruction] = useState("");
  const [isBuildingSmartReply, setIsBuildingSmartReply] = useState(false);

  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    emails: [],
    calendarEvents: [],
    tasks: []
  });

  // Google OAuth states
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [authUrl, setAuthUrl] = useState("");

  const getSeverityTag = (sev: string) => {
    const s = (sev || "low").toLowerCase();
    return `severity-tag ${s}`;
  };

  const loadData = async (forceOverwrite: boolean = false) => {
    try {
      const [risksRes, actionsRes, integrationsRes, workspaceRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/risks`),
        fetch(`${BACKEND_URL}/api/actions`),
        fetch(`${BACKEND_URL}/api/integrations`),
        fetch(`${BACKEND_URL}/api/workspace`)
      ]);

      const [risksData, actionsData, integrationsData, workspaceJson] = await Promise.all([
        risksRes.json(),
        actionsRes.json(),
        integrationsRes.json(),
        workspaceRes.json()
      ]);

      setRisks(Array.isArray(risksData) ? risksData : []);
      setActions(Array.isArray(actionsData) ? actionsData : []);
      setIntegrations(integrationsData);

      setWorkspaceData((prev) => {
        const fetchedEmails = Array.isArray(workspaceJson?.emails) ? workspaceJson.emails : [];
        const fetchedEvents = Array.isArray(workspaceJson?.calendarEvents) ? workspaceJson.calendarEvents : [];
        const fetchedTasks = Array.isArray(workspaceJson?.tasks) ? workspaceJson.tasks : [];

        // Preserve previous non-empty workspace data if transient sync returns empty array
        const finalEmails = (fetchedEmails.length > 0 || forceOverwrite || prev.emails.length === 0) ? fetchedEmails : prev.emails;
        const finalEvents = (fetchedEvents.length > 0 || forceOverwrite || prev.calendarEvents.length === 0) ? fetchedEvents : prev.calendarEvents;
        const finalTasks = (fetchedTasks.length > 0 || forceOverwrite || prev.tasks.length === 0) ? fetchedTasks : prev.tasks;

        return {
          emails: finalEmails,
          calendarEvents: finalEvents,
          tasks: finalTasks
        };
      });

      if (integrationsData?.user) {
        setGoogleUser(integrationsData.user);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const fetchAuthUrl = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google/url`);
      const data = await res.json();
      if (data.url) setAuthUrl(data.url);
    } catch (err) {
      console.error("Error fetching auth URL:", err);
    }
  };

  useEffect(() => {
    loadData();
    fetchAuthUrl();

    let interval: any = null;
    if (isAutoSyncEnabled) {
      interval = setInterval(() => {
        loadData(false);
      }, 15000);
    }

    // Check query params for OAuth redirect landing
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");
    if (authStatus === "success") {
      loadData(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const eventSource = new EventSource(`${BACKEND_URL}/api/events`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "agent_status") {
          const st = payload.data?.status;
          if (st === "running" || st === "resuming") {
            setIsTriggering(true);
          } else if (st === "done" || st === "paused" || st === "error") {
            setTimeout(() => setIsTriggering(false), 1200);
          }
        } else if (payload.type === "audit_log") {
          if (payload.data?.event_type === "agent_message" && payload.data?.event_message) {
            setAiResponse((prev: any) => ({ prompt: prev?.prompt || "LifeGuard Monitoring Check", text: payload.data.event_message }));
          }
        } else if (payload.type === "agent_response") {
          setAiResponse({ prompt: payload.data.prompt || "User Question", text: payload.data.reasoning });
          setIsTriggering(false);
        } else if (payload.type === "risks_updated" || payload.type === "actions_updated") {
          loadData();
        }
      } catch (err) {
        console.error("Failed to parse SSE event data:", err);
      }
    };

    return () => {
      if (interval) clearInterval(interval);
      eventSource.close();
    };
  }, [isAutoSyncEnabled]);

  const handleGoogleSignIn = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/google/disconnect`, { method: "POST" });
      setGoogleUser(null);
      loadData();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  const triggerObservation = async (promptText?: string) => {
    const query = promptText || customPrompt || "Perform a full system check. Review emails, calendar, and tasks.";
    setIsTriggering(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query })
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setCustomPrompt("");
        loadData();
      }
    } catch (err) {
      console.error("Trigger error:", err);
    } finally {
      // Ensure thinking indicator stays visible smoothly for at least 2.5 seconds
      setTimeout(() => {
        setIsTriggering(false);
      }, 2500);
    }
  };

  const handleApprove = async (actionId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/actions/${actionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      loadData();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/actions/${actionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, reason: "Declined by operator." })
      });
      loadData();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calendar/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        playUiSound("success");
        loadData();
      }
    } catch (err) {
      console.error("Delete event error:", err);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setIsSendingEmail(true);
    setEmailSendStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody })
      });
      const data = await res.json();
      if (data.success) {
        playUiSound("success");
        setEmailSendStatus("Email sent successfully!");
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        setTimeout(() => {
          setShowComposeModal(false);
          setEmailSendStatus(null);
        }, 1500);
      } else {
        setEmailSendStatus(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setEmailSendStatus(`Error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTestAutoRespond = async () => {
    setIsAutoResponding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/emails/auto-respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: googleUser?.email || "recruiter@amazon.com",
          subject: "Technical Interview Schedule & Logistics Confirmation",
          body: "Hi Hitarth, confirming your technical interview scheduled for September 24 at 2:00 PM IST."
        })
      });
      const data = await res.json();
      if (data.success) {
        playUiSound("success");
        loadData();
      }
    } catch (err) {
      console.error("Auto respond error:", err);
    } finally {
      setIsAutoResponding(false);
    }
  };

  const handleBuildAndSendSmartReply = async (emailItem?: LiveEmail) => {
    const targetEmail = emailItem || selectedEmailForReply;
    if (!targetEmail) return;

    setIsBuildingSmartReply(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/emails/smart-reply-builder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: targetEmail.sender,
          subject: targetEmail.subject,
          incomingBody: targetEmail.body,
          userInstruction: quickReplyInstruction
        })
      });
      const data = await res.json();
      if (data.success) {
        playUiSound("success");
        setQuickReplyInstruction("");
        setSelectedEmailForReply(null);
        loadData();
      }
    } catch (err) {
      console.error("Smart reply builder error:", err);
    } finally {
      setIsBuildingSmartReply(false);
    }
  };

  const dismissEmail = (id: string) => {
    playUiSound("click");
    setDismissedEmailIds(prev => [...prev, id]);
  };

  const pendingAction = actions.find((a: ActionProposal) => a.status === "awaiting_approval");

  const visibleEmails = workspaceData.emails
    .filter(e => !dismissedEmailIds.includes(e.id))
    .filter(e => {
      if (emailCategoryFilter === "all") return true;
      if (emailCategoryFilter === "work") {
        return e.category === "work" || e.subject.toLowerCase().includes("interview") || e.subject.toLowerCase().includes("hiring") || e.subject.toLowerCase().includes("ppi");
      }
      if (emailCategoryFilter === "financial") {
        return e.category === "financial" || e.subject.toLowerCase().includes("statement") || e.subject.toLowerCase().includes("account") || e.subject.toLowerCase().includes("fund") || e.subject.toLowerCase().includes("emi");
      }
      if (emailCategoryFilter === "general") {
        return e.category === "general" || (!e.category && !e.subject.toLowerCase().includes("interview") && !e.subject.toLowerCase().includes("statement"));
      }
      return true;
    });

  return (
    <div style={{ background: "#090d16", minHeight: "100vh", color: "#f8fafc" }}>
      
      {/* Interactive Brand Logo Selector Bar */}
      <div style={{ background: "#020617", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8" }}>
          <SparklesIcon />
          <span style={{ fontWeight: 600 }}>Choose Brand Logo Concept:</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setSelectedLogo("shield")}
            className={`btn-secondary ${selectedLogo === "shield" ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: "11px" }}
          >
            <ShieldIcon /> Option 1: Shield Pulse
          </button>
          <button
            onClick={() => setSelectedLogo("compass")}
            className={`btn-secondary ${selectedLogo === "compass" ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: "11px" }}
          >
            <CompassIcon /> Option 2: Compass Star
          </button>
          <button
            onClick={() => setSelectedLogo("sparkle")}
            className={`btn-secondary ${selectedLogo === "sparkle" ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: "11px" }}
          >
            <SparklesIcon /> Option 3: AI Spark
          </button>
          <button
            onClick={() => setSelectedLogo("lifebuoy")}
            className={`btn-secondary ${selectedLogo === "lifebuoy" ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: "11px" }}
          >
            <LifeBuoyIcon /> Option 4: Guardian Ring
          </button>
        </div>
      </div>

      {/* Header Bar */}
      <header className="app-header" style={{ background: "rgba(15, 23, 42, 0.9)", padding: "16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="logo-badge" style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}>
            {selectedLogo === "shield" && <ShieldIcon />}
            {selectedLogo === "compass" && <CompassIcon />}
            {selectedLogo === "sparkle" && <SparklesIcon />}
            {selectedLogo === "lifebuoy" && <LifeBuoyIcon />}
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>LifeGuard</h1>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Autonomous Life & Task Protection System</p>
          </div>
        </div>

        {/* Live Service Badges, Sync & Compose Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", background: "rgba(2, 6, 23, 0.6)", padding: "6px 12px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: integrations?.gmail?.connected ? "#34d399" : "#94a3b8", fontWeight: 600 }}>
              <MailIcon /> {integrations?.gmail?.connected ? "Gmail Connected" : "Gmail Offline"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: integrations?.calendar?.connected ? "#34d399" : "#94a3b8", fontWeight: 600 }}>
              <CalendarIcon /> {integrations?.calendar?.connected ? "Calendar Connected" : "Calendar Offline"}
            </div>
          </div>

          <button
            onClick={() => {
              playUiSound("click");
              setIsAutoSyncEnabled(!isAutoSyncEnabled);
            }}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: isAutoSyncEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
              borderColor: isAutoSyncEnabled ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.1)",
              color: isAutoSyncEnabled ? "#34d399" : "#94a3b8"
            }}
            title="Toggle 15-second continuous background sync"
          >
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isAutoSyncEnabled ? "#34d399" : "#94a3b8", animation: isAutoSyncEnabled ? "pulse 1.5s infinite" : "none" }} />
            {isAutoSyncEnabled ? "Auto-Sync: ON" : "Auto-Sync: OFF"}
          </button>

          <button
            onClick={() => {
              playUiSound("click");
              setIsRefreshing(true);
              loadData(true).finally(() => setTimeout(() => setIsRefreshing(false), 800));
            }}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <div style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none", display: "flex", alignItems: "center" }}>
              <CompassIcon />
            </div>
            {isRefreshing ? "Syncing..." : "Refresh Live Data"}
          </button>

          <button
            onClick={() => {
              playUiSound("click");
              setShowComposeModal(true);
            }}
            className="trigger-btn"
            style={{ background: "linear-gradient(135deg, #38bdf8, #6366f1)", color: "white", padding: "6px 14px", fontSize: "11px", borderRadius: "14px" }}
          >
            <MailIcon /> Compose Email
          </button>
        </div>

        {/* User Profile & Background Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="status-badge healthy" style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399" }}>
            <div className="status-dot"></div>
            Background Protection Active
          </div>

          {googleUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "6px 14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img src={googleUser.picture} alt="User" style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>{googleUser.name}</span>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>{googleUser.email}</span>
              </div>
              <button onClick={handleGoogleDisconnect} style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", marginLeft: "6px" }} title="Disconnect">
                <XIcon />
              </button>
            </div>
          ) : (
            <button className="trigger-btn" onClick={handleGoogleSignIn} style={{ background: "#6366f1", color: "white" }}>
              <UserIcon /> Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="app-container" style={{ gridTemplateColumns: "320px 1fr 320px", padding: "16px 24px", gap: "16px", maxWidth: "100vw", boxSizing: "border-box", overflow: "hidden" }}>
        
        {/* Left Column: Smart Assistant */}
        <div className="pane">
          <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px" }}>
                <CpuIcon /> Smart Assistant
              </div>
              <span style={{ background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", fontSize: "11px", padding: "3px 8px", borderRadius: "10px", fontWeight: 600 }}>Always Active</span>
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, marginBottom: "16px" }}>
              LifeGuard quietly checks your email, schedule, and tasks in the background so you never miss an important event, bill, or deadline.
            </p>

            {/* Interactive Functional Stats Counter Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div
                onClick={() => {
                  playUiSound("click");
                  setActiveTab("risks");
                }}
                style={{ background: "#020617", padding: "12px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(244, 63, 94, 0.3)", cursor: "pointer", transition: "all 0.2s ease" }}
                title="Click to view urgent risks and forgotten follow-up reminders"
              >
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Attention Needed</div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "#f43f5e" }}>{risks.length}</div>
              </div>
              <div
                onClick={() => {
                  playUiSound("click");
                  setActiveTab("all");
                  const el = document.getElementById("pending-action-card");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ background: "#020617", padding: "12px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(251, 191, 36, 0.3)", cursor: "pointer", transition: "all 0.2s ease" }}
                title="Click to view pending approval proposals"
              >
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Pending Approval</div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "#fbbf24" }}>{actions.filter(a => a.status === "awaiting_approval").length}</div>
              </div>
            </div>

            {/* Multiline Prompt Box UX & Suggested Action Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <textarea
                  placeholder="Ask agent to check anything... (Press Enter to submit, Shift+Enter for newline)"
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      triggerObservation();
                    }
                  }}
                  style={{
                    width: "100%",
                    background: "#020617",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    color: "white",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    resize: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Shift + Enter for new line</span>
                  <button className="trigger-btn" onClick={() => triggerObservation()} disabled={isTriggering} style={{ background: "#6366f1", color: "white", padding: "6px 14px", fontSize: "12px" }}>
                    <SendIcon /> {isTriggering ? "Thinking..." : "Check"}
                  </button>
                </div>
              </div>

              {/* Functional Prompt Chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    playUiSound("click");
                    setActiveTab("calendar");
                    triggerObservation("Check my upcoming Formula 1 race events and calendar schedule");
                  }}
                  style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "#a78bfa", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <CalendarIcon /> Check Race Schedule
                </button>
                <button
                  onClick={() => {
                    playUiSound("click");
                    setActiveTab("emails");
                    setEmailCategoryFilter("all");
                    triggerObservation("Summarize all my important Gmail inbox messages");
                  }}
                  style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <MailIcon /> Summarize Emails
                </button>
                <button
                  onClick={() => {
                    playUiSound("click");
                    setActiveTab("calendar");
                    triggerObservation("Check my upcoming schedule for any conflicts and calculate prep slots");
                  }}
                  style={{ background: "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fbbf24", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <BriefcaseIcon /> Schedule Check
                </button>
              </div>
            </div>
          </div>

          <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>HOW LIFEGUARD HELPS YOU</h3>
            
            <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#818cf8", display: "flex", alignItems: "center", gap: "6px" }}>
                <PlaneIcon /> Prevents Travel Delays
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Detects missing airport rides or unconfirmed hotel bookings automatically.</p>
            </div>

            <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "6px" }}>
                <DollarSignIcon /> Smart Financial Reminders
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Notifies you before upcoming bill debits so you avoid bank bounce fees.</p>
            </div>

            <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                <BriefcaseIcon /> Schedule Protection
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Helps protect your focus time when work deadlines are near.</p>
            </div>
          </div>
        </div>

        {/* Center Feed: Important Updates & Action Items */}
        <div className="pane">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>Workspace Intelligence</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Real-time Gmail inbox, Google Calendar, and AI Sentinel reasoning</p>
            </div>

            <button
              onClick={() => {
                playUiSound("click");
                setIsRefreshing(true);
                loadData().finally(() => setTimeout(() => setIsRefreshing(false), 800));
              }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "6px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none", display: "flex", alignItems: "center" }}>
                <CompassIcon />
              </div>
              Refresh Sync
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div style={{ display: "flex", gap: "8px", background: "rgba(2, 6, 23, 0.6)", padding: "4px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px" }}>
            <button
              onClick={() => { playUiSound("click"); setActiveTab("all"); }}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: activeTab === "all" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", color: activeTab === "all" ? "white" : "#94a3b8", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Overview
            </button>
            <button
              onClick={() => { playUiSound("click"); setActiveTab("emails"); }}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: activeTab === "emails" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", color: activeTab === "emails" ? "white" : "#94a3b8", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <MailIcon /> Emails ({visibleEmails.length})
            </button>
            <button
              onClick={() => { playUiSound("click"); setActiveTab("calendar"); }}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: activeTab === "calendar" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", color: activeTab === "calendar" ? "white" : "#94a3b8", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <CalendarIcon /> Calendar ({workspaceData.calendarEvents.length})
            </button>
            <button
              onClick={() => { playUiSound("click"); setActiveTab("risks"); }}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "none", background: activeTab === "risks" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", color: activeTab === "risks" ? "white" : "#94a3b8", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Risks ({risks.length})
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Proactive AI Sentinel Alert Banner */}
            {risks.length > 0 && (activeTab === "all" || activeTab === "risks") && (
              <div className="glass" style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))", borderRadius: "18px", padding: "16px 20px", border: "1px solid rgba(239, 68, 68, 0.4)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "14px", color: "#f43f5e" }}>
                    <ShieldIcon /> Proactive AI Sentinel Alert ({risks.length} Action Items Detected)
                  </div>
                  <button
                    onClick={() => { playUiSound("click"); setActiveTab("risks"); }}
                    style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.5)", color: "#f43f5e", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                  >
                    View All Reminders
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "#f8fafc", lineHeight: 1.5, background: "#020617", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong>Top Sentinel Alert:</strong> {risks[0].description}
                </div>
              </div>
            )}

            {/* AI Agent Thinking & Loading Status Indicator */}
            {isTriggering && (
              <div className="glass" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))", borderRadius: "18px", padding: "18px", border: "1px solid rgba(139, 92, 246, 0.5)", display: "flex", alignItems: "center", gap: "14px", animation: "pulse 1.5s infinite" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "3px solid rgba(168, 85, 247, 0.3)", borderTopColor: "#a78bfa", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#a78bfa", display: "flex", alignItems: "center", gap: "8px" }}>
                    <SparklesIcon /> AI Sentinel Thinking & Fetching Data...
                  </div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "2px" }}>Scanning live Gmail inbox, calendar events, and computing focus time & risks...</div>
                </div>
              </div>
            )}

            {/* AI Assistant Reasoning Card */}
            {aiResponse && (activeTab === "all" || activeTab === "risks") && (
              <div className="glass" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))", borderRadius: "20px", padding: "20px", border: "1px solid rgba(139, 92, 246, 0.4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <SparklesIcon />
                  <span style={{ fontWeight: 800, fontSize: "15px", color: "#a78bfa" }}>AWS Bedrock AI Assistant Intelligence</span>
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px", fontWeight: 600 }}>User Query: "{aiResponse.prompt}"</div>
                <div style={{ background: "#020617", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <FormattedAiText text={aiResponse.text} />
                </div>
              </div>
            )}

            {/* Live Emails Tab View */}
            {(activeTab === "all" || activeTab === "emails") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MailIcon /> Live Gmail Messages ({visibleEmails.length})
                  </h3>

                  {/* Category Filter Pills */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      onClick={() => { playUiSound("click"); setEmailCategoryFilter("all"); }}
                      style={{ background: emailCategoryFilter === "all" ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: emailCategoryFilter === "all" ? "white" : "#94a3b8", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { playUiSound("click"); setEmailCategoryFilter("work"); }}
                      style={{ background: emailCategoryFilter === "work" ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: emailCategoryFilter === "work" ? "#34d399" : "#94a3b8", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Work
                    </button>
                    <button
                      onClick={() => { playUiSound("click"); setEmailCategoryFilter("financial"); }}
                      style={{ background: emailCategoryFilter === "financial" ? "rgba(251, 191, 36, 0.3)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: emailCategoryFilter === "financial" ? "#fbbf24" : "#94a3b8", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Financial
                    </button>
                    <button
                      onClick={() => { playUiSound("click"); setEmailCategoryFilter("general"); }}
                      style={{ background: emailCategoryFilter === "general" ? "rgba(168, 85, 247, 0.3)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: emailCategoryFilter === "general" ? "#a78bfa" : "#94a3b8", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                    >
                      General
                    </button>
                  </div>
                </div>

                {/* AI Executive Inbox Synthesis Box with Functional Clickable Categories */}
                {workspaceData.emails.length > 0 && (
                  <div style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.1))", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "14px 18px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontWeight: 800, fontSize: "13px" }}>
                      <SparklesIcon /> AI Executive Inbox Synthesis
                    </div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.5 }}>
                      Processed <strong>{workspaceData.emails.length} inbox messages</strong> across Work, Financial Statements, and Opportunities:
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      <button
                        onClick={() => {
                          playUiSound("click");
                          setEmailCategoryFilter("work");
                          setActiveTab("emails");
                        }}
                        style={{ background: emailCategoryFilter === "work" ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        {workspaceData.emails.filter(e => e.category === "work" || e.subject.toLowerCase().includes("interview") || e.subject.toLowerCase().includes("hiring")).length} Career & Interviews
                      </button>
                      <button
                        onClick={() => {
                          playUiSound("click");
                          setEmailCategoryFilter("financial");
                          setActiveTab("emails");
                        }}
                        style={{ background: emailCategoryFilter === "financial" ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251, 191, 36, 0.4)", color: "#fbbf24", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        {workspaceData.emails.filter(e => e.category === "financial" || e.subject.toLowerCase().includes("statement") || e.subject.toLowerCase().includes("account")).length} Financial Statements
                      </button>
                      <button
                        onClick={() => {
                          playUiSound("click");
                          setEmailCategoryFilter("general");
                          setActiveTab("emails");
                        }}
                        style={{ background: emailCategoryFilter === "general" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a78bfa", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        {workspaceData.emails.filter(e => e.category === "general").length} General & Subscriptions
                      </button>
                    </div>
                  </div>
                )}

                {visibleEmails.length === 0 ? (
                  <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "16px", padding: "24px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
                    No emails match the selected category filter. Click "All" to reset view.
                  </div>
                ) : (
                  visibleEmails.slice(0, 15).map((mail) => (
                    <div key={mail.id} style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{unescapeHtmlEntities(mail.subject)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={() => {
                              playUiSound("click");
                              setSelectedEmailForReply(selectedEmailForReply?.id === mail.id ? null : mail);
                            }}
                            style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a78bfa", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            title="Build & send AI auto-reply around your brief direction"
                          >
                            <SparklesIcon /> AI Auto-Reply
                          </button>
                          <span style={{ background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            {mail.category || "general"}
                          </span>
                          <button
                            onClick={() => dismissEmail(mail.id)}
                            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                            title="Dismiss email from top view"
                          >
                            <EyeOffIcon />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>From: {unescapeHtmlEntities(mail.sender)}</div>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5, background: "#020617", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", margin: 0 }}>
                        {unescapeHtmlEntities(mail.body)}
                      </p>

                      {/* Technical & Important Event Timing Badge */}
                      {(() => {
                        const extractedTime = extractTimingBadge(mail.subject, mail.body);
                        if (!extractedTime) return null;
                        return (
                          <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "8px", padding: "6px 12px", marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "11px", fontWeight: 700 }}>
                            <CalendarIcon /> Key Event Timing: {extractedTime}
                          </div>
                        );
                      })()}

                      {/* Smart AI Auto-Reply Drawer */}
                      {selectedEmailForReply?.id === mail.id && (
                        <div style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.15))", border: "1px solid rgba(99, 102, 241, 0.4)", borderRadius: "12px", padding: "14px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, color: "#a78bfa", display: "flex", alignItems: "center", gap: "6px" }}>
                            <SparklesIcon /> Autonomous AI Email Reply Builder
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            Suggest key points or answer direction (Optional). AI will build a complete, professional email and send it via Gmail API:
                          </div>
                          <textarea
                            rows={2}
                            placeholder="e.g. 'Accept proposal, confirm meeting at 2 PM, ask for Zoom link'"
                            value={quickReplyInstruction}
                            onChange={(e) => setQuickReplyInstruction(e.target.value)}
                            style={{ width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 10px", color: "white", fontSize: "12px", resize: "none" }}
                          />
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button onClick={() => setSelectedEmailForReply(null)} className="btn-secondary" style={{ padding: "4px 10px", fontSize: "11px" }}>Cancel</button>
                            <button
                              onClick={() => handleBuildAndSendSmartReply(mail)}
                              disabled={isBuildingSmartReply}
                              className="trigger-btn"
                              style={{ background: "#6366f1", color: "white", padding: "4px 12px", fontSize: "11px" }}
                            >
                              <SendIcon /> {isBuildingSmartReply ? "Building & Sending..." : "Build & Send Full Email"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Live Calendar Events Tab View */}
            {(activeTab === "all" || activeTab === "calendar") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarIcon /> Google Calendar Events ({workspaceData.calendarEvents.length})
                </h3>
                {workspaceData.calendarEvents.length === 0 ? (
                  <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "16px", padding: "24px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
                    No calendar events fetched yet. Click "Check" to sync your Google Calendar.
                  </div>
                ) : (
                  workspaceData.calendarEvents.slice(0, 30).map((evt) => {
                    const badge = (() => {
                      const t = (evt.title || "").toLowerCase();
                      if (t.includes("race") || t.includes("f1") || t.includes("grand prix") || t.includes("formula")) {
                        return { label: "F1 Race", color: "#c084fc", bg: "rgba(168, 85, 247, 0.2)", border: "rgba(168, 85, 247, 0.5)" };
                      }
                      if (t.includes("interview")) {
                        return { label: "Interview", color: "#34d399", bg: "rgba(16, 185, 129, 0.2)", border: "rgba(16, 185, 129, 0.5)" };
                      }
                      if (t.includes("train") || t.includes("flight") || t.includes("travel")) {
                        return { label: "Travel", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.2)", border: "rgba(56, 189, 248, 0.5)" };
                      }
                      if (t.includes("meet") || t.includes("prep") || t.includes("zoom")) {
                        return { label: "Meeting", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)", border: "rgba(251, 191, 36, 0.5)" };
                      }
                      return { label: "Upcoming", color: "#818cf8", bg: "rgba(99, 102, 241, 0.2)", border: "rgba(99, 102, 241, 0.3)" };
                    })();

                    const dateFormatted = new Date(evt.start).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={evt.id}
                        style={{
                          background: "rgba(15, 23, 42, 0.65)",
                          borderRadius: "16px",
                          padding: "14px 18px",
                          border: `1px solid ${badge.border}`,
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          overflow: "hidden"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: "1 1 240px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              background: badge.bg,
                              color: badge.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            <CalendarIcon />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "white", wordBreak: "break-word" }}>{evt.title}</span>
                              <span style={{ background: badge.bg, color: badge.color, padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, border: `1px solid ${badge.border}`, flexShrink: 0 }}>
                                {badge.label}
                              </span>
                            </div>
                            {evt.location && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Location: {evt.location}</div>}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "auto" }}>
                          <div style={{ fontSize: "11px", color: badge.color, fontWeight: 700, background: "#020617", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, whiteSpace: "nowrap" }}>
                            {dateFormatted}
                          </div>
                          <button
                            onClick={() => handleDeleteCalendarEvent(evt.id)}
                            style={{ background: "rgba(244, 63, 94, 0.18)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "#f43f5e", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                            title="Delete event from Google Calendar"
                          >
                            <XIcon /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Detected Risks Tab View */}
            {(activeTab === "all" || activeTab === "risks") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldIcon /> Detected Risks & Forgotten Follow-Up Reminders ({risks.length})
                </h3>
                {risks.length === 0 ? (
                  <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "30px", textAlign: "center" }}>
                    <CheckIcon />
                    <h3 style={{ fontSize: "15px", fontWeight: 700, marginTop: "8px" }}>No Urgent Risks Detected</h3>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>LifeGuard is monitoring your connected Gmail and Calendar in the background.</p>
                  </div>
                ) : (
                  risks.map((r) => (
                    <div key={r.id} className={`risk-card ${r.severity.toLowerCase()}`} style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", borderLeft: r.severity.toLowerCase() === "critical" ? "4px solid #f43f5e" : r.severity.toLowerCase() === "high" ? "4px solid #fbbf24" : "4px solid #38bdf8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {r.category.toLowerCase().includes("travel") ? <PlaneIcon /> : r.category.toLowerCase().includes("financial") ? <DollarSignIcon /> : <BriefcaseIcon />}
                          </div>
                          <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>{r.description}</h3>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Category: {r.category} · Confidence: {Math.round((r.confidence || 0.9) * 100)}%</span>
                          </div>
                        </div>
                        <span className={getSeverityTag(r.severity)} style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
                          {r.severity}
                        </span>
                      </div>

                      {Array.isArray(r.signals) && r.signals.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "12px 0" }}>
                          {r.signals.map((sig, sIdx) => (
                            <span key={sIdx} className="signal-pill" style={{ background: "#020617", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}>
                              {sig}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick Sentinel Resolution Action Buttons */}
                      {r.description.includes("Forgotten Follow-Up") && (
                        <button
                          onClick={() => {
                            playUiSound("click");
                            setActiveTab("emails");
                          }}
                          style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a78bfa", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}
                        >
                          <SparklesIcon /> Open AI Auto-Reply Builder
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Permission Required Card & Autonomous Agent Status */}
        <div className="pane">
          {pendingAction ? (
            <div id="pending-action-card" className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(251, 191, 36, 0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 700, fontSize: "14px" }}>
                  <ShieldIcon /> Action Permission Required
                </div>
                <span style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", fontSize: "11px", padding: "3px 8px", borderRadius: "10px", fontWeight: 600 }}>Needs Authorization</span>
              </div>

              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px", lineHeight: 1.5 }}>
                {pendingAction.details?.summary || `LifeGuard generated an automated action (${pendingAction.type}) that requires your explicit approval.`}
              </p>

              <div style={{ background: "#020617", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", marginBottom: "16px" }}>
                {pendingAction.details?.recipient && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Recipient</span>
                    <span style={{ fontWeight: 600, color: "white" }}>{pendingAction.details.recipient}</span>
                  </div>
                )}
                {pendingAction.details?.subject && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Subject</span>
                    <span style={{ fontWeight: 600, color: "white" }}>{pendingAction.details.subject}</span>
                  </div>
                )}
                {pendingAction.details?.body && (
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Message Body</span>
                    <p style={{ background: "rgba(255,255,255,0.04)", padding: "8px", borderRadius: "6px", marginTop: "4px", color: "#cbd5e1", fontSize: "11px", lineHeight: 1.5 }}>
                      "{pendingAction.details.body}"
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    playUiSound("success");
                    handleApprove(pendingAction.id);
                  }}
                  className="trigger-btn"
                  style={{ flex: 1, background: "#059669", color: "white", justifyContent: "center" }}
                >
                  <CheckIcon /> Allow & Execute
                </button>
                <button
                  onClick={() => {
                    playUiSound("click");
                    handleReject(pendingAction.id);
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, color: "#f43f5e", borderColor: "rgba(244, 63, 94, 0.3)" }}
                >
                  <XIcon /> Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto" }}>
                <CheckIcon />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>All Actions Clear</h3>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Autonomous sentinel protection is active. Proposals requiring approval will surface here.</p>
            </div>
          )}

          {/* Autonomous Executive Control Panel */}
          <div className="glass" style={{ background: "rgba(15, 23, 42, 0.65)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px", color: "white" }}>
                <CpuIcon /> Autonomous Sentinel Status
              </div>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", fontSize: "10px", padding: "3px 8px", borderRadius: "8px", fontWeight: 800 }}>LIVE</span>
            </div>

            <div style={{ background: "#020617", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "#94a3b8" }}>Observation Engine</span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>Continuous 15s Background Sync</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "#94a3b8" }}>Proactive Follow-Up Sentinel</span>
                <span style={{ color: "#34d399", fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "#94a3b8" }}>AWS Bedrock Mantle</span>
                <span style={{ color: "#a78bfa", fontWeight: 700 }}>Connected</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "#94a3b8" }}>Low-Priority Auto-Reply</span>
                <button
                  onClick={handleTestAutoRespond}
                  disabled={isAutoResponding}
                  style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: 700 }}
                >
                  {isAutoResponding ? "Responding..." : "Test Auto-Reply & Notify"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Compose & Send Email Modal */}
      {showComposeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass" style={{ background: "#0f172a", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                <MailIcon /> Compose & Send Live Email
              </h3>
              <button onClick={() => setShowComposeModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <XIcon />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>TO RECIPIENT EMAIL</label>
                <input
                  type="email"
                  placeholder="e.g. recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  style={{ width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: "white", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>SUBJECT</label>
                <input
                  type="text"
                  placeholder="Email subject..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  style={{ width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: "white", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px" }}>EMAIL BODY MESSAGE</label>
                <textarea
                  rows={5}
                  placeholder="Type your message body..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  style={{ width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: "white", fontSize: "12px", resize: "none" }}
                />
              </div>

              {emailSendStatus && (
                <div style={{ fontSize: "12px", color: emailSendStatus.includes("successfully") ? "#34d399" : "#f43f5e", fontWeight: 700 }}>
                  {emailSendStatus}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={() => setShowComposeModal(false)} className="btn-secondary" style={{ padding: "8px 16px" }}>Cancel</button>
              <button onClick={handleSendEmail} disabled={isSendingEmail} className="trigger-btn" style={{ background: "#6366f1", color: "white", padding: "8px 20px" }}>
                <SendIcon /> {isSendingEmail ? "Sending..." : "Dispatch Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
