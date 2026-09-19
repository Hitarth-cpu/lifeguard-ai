import { getDb } from "../db.js";
import { GoogleOAuthService } from "./googleOAuthService.js";

const googleOAuthInstance = new GoogleOAuthService();

export interface LiveGoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
}

export class GoogleTasksService {
  public async fetchLiveTasks(): Promise<LiveGoogleTask[]> {
    console.log("[GOOGLE TASKS SERVICE] Scanning Google Tasks API...");

    const accessToken = await googleOAuthInstance.getAccessToken();

    if (accessToken && accessToken !== "live_auth_access_token_active") {
      try {
        const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          const liveTasks: LiveGoogleTask[] = items.map((item: any) => ({
            id: item.id,
            title: item.title || "Untitled Task",
            notes: item.notes || "",
            due: item.due || new Date(Date.now() + 86400000 * 3).toISOString(),
            status: item.status || "needsAction"
          }));
          console.log(`[GOOGLE TASKS SERVICE] Successfully fetched ${liveTasks.length} tasks from Google Tasks API.`);
          return liveTasks;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[GOOGLE TASKS SERVICE] API warning (Status ${res.status}):`, errData.error?.message || res.statusText);
        }
      } catch (err: any) {
        console.warn("[GOOGLE TASKS SERVICE] API call warning:", err.message);
      }
    }

    return [];
  }
}
