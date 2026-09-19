import dotenv from "dotenv";
import { getDb } from "../db.js";

dotenv.config();

export interface LiveCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  isMandatory?: boolean;
}

import { GoogleOAuthService } from "./googleOAuthService.js";

const googleOAuthInstance = new GoogleOAuthService();

export class CalendarService {
  private apiKey: string | null;
  private accessToken: string | null;

  constructor() {
    this.apiKey = process.env.GOOGLE_CALENDAR_API_KEY || null;
    this.accessToken = process.env.GOOGLE_ACCESS_TOKEN || null;
  }

  public async isConfigured(): Promise<boolean> {
    const activeToken = await googleOAuthInstance.getAccessToken();
    return !!(activeToken || this.apiKey || this.accessToken);
  }

  public async fetchLiveCalendarEvents(daysAhead?: number): Promise<LiveCalendarEvent[]> {
    console.log(`[CALENDAR SERVICE] Fetching live user calendar events...`);

    const activeToken = await googleOAuthInstance.getAccessToken() || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          const currentYear = new Date().getFullYear();

          const liveEvents: LiveCalendarEvent[] = items
            .filter((item: any) => item.status !== "cancelled")
            .map((item: any) => {
              const rawStart = item.start?.dateTime || item.start?.date || new Date().toISOString();
              const rawEnd = item.end?.dateTime || item.end?.date || rawStart;

              let startDate = new Date(rawStart);
              let endDate = new Date(rawEnd);

              // Normalize past year events (e.g. F1 2022 calendar import) to current year (2026)
              if (!isNaN(startDate.getTime()) && startDate.getFullYear() < currentYear) {
                const yearDiff = currentYear - startDate.getFullYear();
                startDate.setFullYear(currentYear);
                endDate.setFullYear(endDate.getFullYear() + yearDiff);
              }

              // Clean outdated year labels in title (e.g. "F1 2022 - Race" -> "F1 2026 - Race")
              let title = item.summary || "Untitled Event";
              title = title.replace(/\b202[0-5]\b/g, `${currentYear}`);

              return {
                id: item.id,
                title,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                location: item.location || "",
                isMandatory: true
              };
            });

          // Filter events from today onwards (active window till date and further)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const upcomingEvents = liveEvents.filter((evt) => {
            const evtDate = new Date(evt.end || evt.start);
            return evtDate.getTime() >= todayStart.getTime() - (2 * 24 * 60 * 60 * 1000);
          });

          // Sort chronologically by start date
          upcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          console.log(`[CALENDAR SERVICE] Successfully fetched & normalized ${upcomingEvents.length} active/upcoming calendar events for current date onwards.`);
          return upcomingEvents;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[CALENDAR SERVICE] Calendar API warning (Status ${res.status}):`, errData.error?.message || res.statusText);
        }
      } catch (err: any) {
        console.warn("[CALENDAR SERVICE] Direct API call warning:", err.message);
      }
    }

    return [];
  }

  public async updateCalendarEvent(eventId: string, title?: string, startIso?: string, endIso?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    console.log(`[CALENDAR SERVICE] Rescheduling/updating event ID ${eventId}...`);

    const db = await getDb();
    const record = await db.get("SELECT access_token FROM google_auth WHERE id = 'primary'");
    const activeToken = record?.access_token || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const patchBody: any = {};
        if (title) patchBody.summary = title;
        if (startIso) patchBody.start = { dateTime: startIso };
        if (endIso) patchBody.end = { dateTime: endIso };

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(patchBody)
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[CALENDAR SERVICE] Event ${eventId} updated successfully.`);
          return { success: true, eventId: data.id };
        } else {
          const errData = await res.json();
          return { success: false, error: errData.error?.message || "Failed to update calendar event" };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    console.log(`[CALENDAR SERVICE] [DEMO MODE] Simulated calendar event update for ${eventId}`);
    return { success: true, eventId };
  }

  public async createCalendarEvent(title: string, startIso: string, endIso: string, location?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    console.log(`[CALENDAR SERVICE] Creating new Google Calendar event: "${title}"...`);

    const db = await getDb();
    const record = await db.get("SELECT access_token FROM google_auth WHERE id = 'primary'");
    const activeToken = record?.access_token || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const eventBody: any = {
          summary: title,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          location: location || ""
        };

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(eventBody)
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[CALENDAR SERVICE] Event created successfully with ID: ${data.id}`);
          return { success: true, eventId: data.id };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error?.message || "Failed to create event" };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, eventId: `event_${Date.now()}` };
  }

  public async deleteCalendarEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[CALENDAR SERVICE] Deleting Google Calendar event ID: ${eventId}...`);

    const activeToken = await googleOAuthInstance.getAccessToken() || this.accessToken;

    if (activeToken && activeToken !== "live_auth_access_token_active") {
      try {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${activeToken}` }
        });

        if (res.ok || res.status === 204 || res.status === 410) {
          console.log(`[CALENDAR SERVICE] Event ${eventId} deleted successfully.`);
          return { success: true };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error?.message || "Failed to delete calendar event" };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    console.log(`[CALENDAR SERVICE] [DEMO MODE] Deleted simulated calendar event ${eventId}`);
    return { success: true };
  }
}
