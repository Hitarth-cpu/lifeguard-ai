import dotenv from "dotenv";
import { getDb } from "../db.js";

dotenv.config();

export interface LiveEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  category?: "travel" | "financial" | "work" | "general";
}

import { GoogleOAuthService } from "./googleOAuthService.js";

const googleOAuthInstance = new GoogleOAuthService();

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

export class GmailService {
  private clientId: string | null;
  private clientSecret: string | null;
  private refreshToken: string | null;
  private accessToken: string | null;

  constructor() {
    this.clientId = process.env.GMAIL_CLIENT_ID || null;
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET || null;
    this.refreshToken = process.env.GMAIL_REFRESH_TOKEN || null;
    this.accessToken = process.env.GMAIL_ACCESS_TOKEN || null;
  }

  public async isConfigured(): Promise<boolean> {
    const activeToken = await googleOAuthInstance.getAccessToken();
    return !!(activeToken || this.accessToken || (this.clientId && this.refreshToken));
  }

  public async fetchLiveEmails(): Promise<LiveEmail[]> {
    console.log("[GMAIL SERVICE] Fetching live user inbox emails...");

    const activeToken = await googleOAuthInstance.getAccessToken() || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=in:inbox", {
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];

          // Fetch message details in parallel
          const msgDetails = await Promise.all(
            messages.slice(0, 25).map(async (msg: any) => {
              try {
                const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                  headers: { Authorization: `Bearer ${activeToken}` }
                });
                return msgRes.ok ? msgRes.json() : null;
              } catch {
                return null;
              }
            })
          );

          const liveEmails: LiveEmail[] = [];
          for (const msgData of msgDetails) {
            if (!msgData) continue;
            const headers = msgData.payload?.headers || [];
            const rawSubject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
            const rawSender = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
            const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || new Date().toISOString();
            const snippet = msgData.snippet || "";

            const subject = unescapeHtmlEntities(rawSubject);
            const sender = unescapeHtmlEntities(rawSender);
            const body = unescapeHtmlEntities(snippet);

            const rawTimestamp = msgData.internalDate ? parseInt(msgData.internalDate, 10) : (new Date(date).getTime() || Date.now());

            liveEmails.push({
              id: msgData.id,
              sender,
              subject,
              body,
              date: new Date(rawTimestamp).toISOString(),
              category: this.categorizeEmail(subject, body)
            });
          }

          // Sort strictly newest first using Unix epoch timestamps
          liveEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          console.log(`[GMAIL SERVICE] Successfully fetched ${liveEmails.length} live emails from Gmail inbox.`);
          return liveEmails;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[GMAIL SERVICE] Gmail API warning (Status ${response.status}):`, errData.error?.message || response.statusText);
        }
      } catch (err: any) {
        console.warn("[GMAIL SERVICE] Direct API call warning:", err.message);
      }
    }

    return [];
  }

  public async sendEmail(to: string, subject: string, bodyText: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[GMAIL SERVICE] Preparing live email delivery to ${to}...`);

    const db = await getDb();
    const record = await db.get("SELECT access_token FROM google_auth WHERE id = 'primary'");
    const activeToken = record?.access_token || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
        const messageParts = [
          `To: ${to}`,
          `Subject: ${utf8Subject}`,
          "Content-Type: text/plain; charset=utf-8",
          "MIME-Version: 1.0",
          "",
          bodyText
        ];
        const rawMessage = messageParts.join("\r\n");
        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: encodedMessage })
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[GMAIL SERVICE] Live email sent successfully! Message ID: ${data.id}`);
          return { success: true, messageId: data.id };
        } else {
          const errData = await res.json();
          console.warn("[GMAIL SERVICE] Gmail API send error:", errData);
          return { success: false, error: errData.error?.message || "Failed to send email" };
        }
      } catch (err: any) {
        console.error("[GMAIL SERVICE] Exception while sending email:", err);
        return { success: false, error: err.message };
      }
    }

    console.log(`[GMAIL SERVICE] [DEMO MODE] Simulated email delivery to ${to} (Subject: ${subject})`);
    return { success: true, messageId: `msg_simulated_${Date.now()}` };
  }

  private categorizeEmail(subject: string, snippet: string): "travel" | "financial" | "work" | "general" {
    const text = (subject + " " + snippet).toLowerCase();
    if (text.includes("flight") || text.includes("hotel") || text.includes("booking") || text.includes("airline")) return "travel";
    if (text.includes("emi") || text.includes("invoice") || text.includes("payment") || text.includes("bank") || text.includes("subscription")) return "financial";
    if (text.includes("deadline") || text.includes("project") || text.includes("proposal") || text.includes("client")) return "work";
    return "general";
  }
}
