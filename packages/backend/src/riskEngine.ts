import { LiveEmail } from "./integrations/gmailService.js";
import { LiveCalendarEvent } from "./integrations/calendarService.js";
import { LiveWorkspaceSignal } from "./integrations/socialMediaService.js";

export interface RiskAnalysisResult {
  id: string;
  category: "Travel Readiness" | "Financial Cash-Flow" | "Commitment & Workload" | "Operational Security";
  severity: "Critical" | "High" | "Medium" | "Low";
  confidence: number;
  signals: string[];
  description: string;
  consequences: string[];
  timeHorizonDays: number;
  financialImpactScore: number; // 0.0 to 1.0
  cascadingRiskFactor: number;   // 0.0 to 1.0
  urgencyWeight: number;        // 0.0 to 1.0
  actionabilityScore: number;   // 0.0 to 1.0
}

export class DeepRiskReasoningEngine {
  /**
   * Evaluates environment signals across emails, calendar, and workspace messages
   * to compute multi-dimensional risk scores.
   */
  public analyzeEnvironment(
    emails: LiveEmail[],
    calendar: LiveCalendarEvent[],
    workspaceSignals: LiveWorkspaceSignal[],
    timeHorizonDays: number = 14
  ): RiskAnalysisResult[] {
    console.log(`[DEEP RISK ENGINE] Running multi-dimensional analysis (Horizon: ${timeHorizonDays} days)...`);
    const results: RiskAnalysisResult[] = [];

    // 1. Travel Readiness Analysis
    const flightEmail = emails.find(e => e.category === "travel" || e.subject.toLowerCase().includes("flight") || e.subject.toLowerCase().includes("airline") || e.subject.toLowerCase().includes("booking"));
    const flightEvent = calendar.find(c => c.title.toLowerCase().includes("flight") || c.title.toLowerCase().includes("travel") || c.title.toLowerCase().includes("trip"));

    if (flightEmail || flightEvent) {
      const title = flightEmail ? flightEmail.subject : flightEvent?.title || "Upcoming Flight / Travel Event";
      const snippet = flightEmail ? flightEmail.body : (flightEvent?.location ? `Location: ${flightEvent.location}` : "Scheduled travel event");

      results.push({
        id: `risk_travel_${Date.now()}`,
        category: "Travel Readiness",
        severity: "Critical",
        confidence: 0.95,
        signals: [
          title,
          "Transit and airport transfer verification required",
          snippet.substring(0, 80)
        ],
        description: `Travel commitment detected: "${title}". Ensure airport transit and hotel reservations are confirmed.`,
        consequences: [
          "Potential departure delays if transport is not scheduled",
          "Unverified accommodation status upon arrival"
        ],
        timeHorizonDays: 1,
        financialImpactScore: 0.65,
        cascadingRiskFactor: 0.92,
        urgencyWeight: 0.96,
        actionabilityScore: 0.90
      });
    }

    // 2. Financial Cash-Flow & EMI Analysis
    const financialEmails = emails.filter(e => e.category === "financial" || e.subject.toLowerCase().includes("emi") || e.subject.toLowerCase().includes("bill") || e.subject.toLowerCase().includes("invoice") || e.subject.toLowerCase().includes("due"));
    if (financialEmails.length > 0) {
      const signals = financialEmails.slice(0, 3).map(e => `${e.subject} (${e.sender})`);

      results.push({
        id: `risk_finance_${Date.now()}`,
        category: "Financial Cash-Flow",
        severity: "High",
        confidence: 0.89,
        signals,
        description: `Active financial obligations / upcoming debits detected across ${financialEmails.length} messages.`,
        consequences: [
          "Potential overdraft or bank bounce fees if balance is insufficient",
          "Service interruption on recurring bills"
        ],
        timeHorizonDays: 4,
        financialImpactScore: 0.88,
        cascadingRiskFactor: 0.85,
        urgencyWeight: 0.80,
        actionabilityScore: 0.85
      });
    }

    // 3. Commitment & Workload Capacity Analysis
    const workEmails = emails.filter(e => e.category === "work" || e.subject.toLowerCase().includes("project") || e.subject.toLowerCase().includes("deadline") || e.subject.toLowerCase().includes("urgent"));
    const deadlineEvent = calendar.find(c => c.title.toLowerCase().includes("deadline") || c.title.toLowerCase().includes("due") || c.title.toLowerCase().includes("review"));

    if (workEmails.length > 0 || deadlineEvent) {
      const workTitle = deadlineEvent ? deadlineEvent.title : workEmails[0]?.subject || "Active Project Milestone";

      results.push({
        id: `risk_workload_${Date.now()}`,
        category: "Commitment & Workload",
        severity: "High",
        confidence: 0.87,
        signals: [
          workTitle,
          `Monitored work deliverables: ${workEmails.length} relevant items`,
          "Calendar schedule check recommended"
        ],
        description: `Deliverable/Milestone approaching: "${workTitle}". Review schedule to ensure adequate dedicated work time.`,
        consequences: [
          "Risk of delay on project deliverables",
          "Schedule overload leading to last-minute rush"
        ],
        timeHorizonDays: 3,
        financialImpactScore: 0.70,
        cascadingRiskFactor: 0.88,
        urgencyWeight: 0.82,
        actionabilityScore: 0.95
      });
    }

    // 4. Proactive Forgotten Sender Follow-Up & Unplanned Event Sentinel
    const pendingFollowUpEmails = emails.filter(e => {
      const s = e.subject.toLowerCase();
      return s.includes("interview") || s.includes("confirmation") || s.includes("proposal") || s.includes("query") || s.includes("test");
    });

    if (pendingFollowUpEmails.length > 0) {
      const topPending = pendingFollowUpEmails[0];
      results.push({
        id: `risk_followup_${Date.now()}`,
        category: "Commitment & Workload",
        severity: "High",
        confidence: 0.92,
        signals: [
          `Sender: ${topPending.sender}`,
          `Subject: "${topPending.subject}"`,
          "Pending response reminder flag active"
        ],
        description: `Forgotten Follow-Up Sentinel: You haven't replied to "${topPending.subject}" from ${topPending.sender}. Use AI Auto-Reply to dispatch a response.`,
        consequences: [
          "Potential missed opportunity or delayed communication",
          "Sender awaiting official confirmation"
        ],
        timeHorizonDays: 1,
        financialImpactScore: 0.60,
        cascadingRiskFactor: 0.85,
        urgencyWeight: 0.90,
        actionabilityScore: 0.98
      });
    }

    // Check for unplanned upcoming calendar events (e.g. F1 Race or Interview coming up without prep)
    const upcomingUnplannedEvents = calendar.filter(c => {
      const t = c.title.toLowerCase();
      return (t.includes("interview") || t.includes("race") || t.includes("f1") || t.includes("grand prix")) && !calendar.some(c2 => c2.title.toLowerCase().includes("prep"));
    });

    if (upcomingUnplannedEvents.length > 0) {
      const targetEvt = upcomingUnplannedEvents[0];
      results.push({
        id: `risk_unplanned_${Date.now()}`,
        category: "Commitment & Workload",
        severity: "Medium",
        confidence: 0.88,
        signals: [
          `Upcoming Event: "${targetEvt.title}"`,
          `Scheduled Start: ${targetEvt.start}`,
          "No dedicated preparation block found"
        ],
        description: `Unplanned Horizon Event: "${targetEvt.title}" is approaching. AI recommends calculating a 3-hour focus window before event.`,
        consequences: [
          "Potential lack of preparation time before event",
          "Unplanned calendar schedule overlap"
        ],
        timeHorizonDays: 2,
        financialImpactScore: 0.50,
        cascadingRiskFactor: 0.75,
        urgencyWeight: 0.85,
        actionabilityScore: 0.92
      });
    }

    return results;
  }

  /**
   * Forecasts financial liquidity vs upcoming obligations over lookahead window.
   */
  public forecastFinancialCashFlow(currentBalance: number, scheduledOutflows: { name: string; amount: number; dueDays: number }[]) {
    const totalOutflow = scheduledOutflows.reduce((sum, item) => sum + item.amount, 0);
    const projectedBalance = currentBalance - totalOutflow;

    return {
      currentBalance,
      totalOutflow,
      projectedBalance,
      isShortage: projectedBalance < 0,
      shortageAmount: projectedBalance < 0 ? Math.abs(projectedBalance) : 0
    };
  }
}
