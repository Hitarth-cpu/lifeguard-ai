# LifeGuard - Agent Parameters & Live Integration Guide

This guide details all parameters, live OAuth API credentials, deep risk reasoning metrics, and data encryption guidelines for LifeGuard.

---

## 1. Live Environment Integration Credentials

LifeGuard connects to real user environments via environment variables configured in `.env` (or set on the host system):

### Gmail API Integration (`packages/backend/src/integrations/gmailService.ts`)
```env
GMAIL_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-google-client-secret"
GMAIL_REFRESH_TOKEN="1//your-oauth-refresh-token"
GMAIL_ACCESS_TOKEN="ya29.your-oauth-access-token"
```

### Google Calendar API Integration (`packages/backend/src/integrations/calendarService.ts`)
```env
GOOGLE_CALENDAR_API_KEY="your-google-calendar-api-key"
GOOGLE_ACCESS_TOKEN="ya29.your-oauth-access-token"
```

### Social Media & Workspace Feeds (`packages/backend/src/integrations/socialMediaService.ts`)
```env
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
DISCORD_BOT_TOKEN="your-discord-bot-token"
TWITTER_BEARER_TOKEN="your-twitter-bearer-token"
```

---

## 2. Multi-Dimensional Deep Risk Parameters

The Deep Risk Reasoning Engine (`packages/backend/src/riskEngine.ts`) evaluates environmental signals across 5 core parameters:

| Parameter | Type / Range | Purpose |
| :--- | :--- | :--- |
| `timeHorizonDays` | `7` to `90` days | Lookahead window for scanning upcoming commitments, EMIs, and flights |
| `financialImpactScore` | `0.0` to `1.0` | Monetary risk index (shortage amount vs total liquid balance) |
| `cascadingRiskFactor` | `0.0` to `1.0` | Chain-reaction probability (e.g. missed flight → missed board meeting → lost contract) |
| `urgencyWeight` | `0.0` to `1.0` | Hours remaining until non-reversible deadline or flight departure |
| `actionabilityScore` | `0.0` to `1.0` | Availability of clear, safe recovery options |

---

## 3. Data Encryption & Financial Security Roadmap

> [!IMPORTANT]
> **Upcoming Financial & Sensitive Data Encryption**:
> - All stored financial details (EMI amounts, account balances, transaction logs) will be encrypted at rest using AES-256-GCM.
> - Encryption keys are stored securely using system keychain / environment secrets.
