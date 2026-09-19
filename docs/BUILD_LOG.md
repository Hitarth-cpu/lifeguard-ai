# LifeGuard - Build Log & Technical Milestones

A chronological log of engineering milestones, architectural decisions, and verification steps for LifeGuard.

---

## Milestone 1: Local Monorepo & Desktop Sentinel
- Initialized TypeScript monorepo with `packages/backend`, `packages/frontend`, `packages/desktop`, and `packages/mcp-server`.
- Built Deep Risk Reasoning Engine (`riskEngine.ts`) calculating multi-dimensional threat scores across 5 metrics (Lookahead Horizon, Financial Shortage Index, Cascading Risk, Urgency, Actionability).
- Created Electron desktop UI with real-time SSE audit trail and human-in-the-loop approval dialogs.

---

## Milestone 2: Live Google APIs & Real OAuth2 PKCE Sign-In
- Implemented `googleOAuthService.ts` supporting PKCE authorization code flow with minimum scopes (`gmail.readonly`, `calendar.readonly`, `tasks.readonly`, `openid email profile`).
- Created live API wrappers for Gmail (`gmailService.ts`), Google Calendar (`calendarService.ts`), and Google Tasks (`googleTasksService.ts`).
- Added header profile badge, disconnect & token revocation flow (`https://oauth2.googleapis.com/revoke`).

---

## Milestone 3: AWS Cloud Serverless & Bedrock Migration
- Designed AWS CDK Infrastructure Stack (`packages/infra/lib/lifeguard-stack.ts`) deploying Node.js 20.x Lambda handlers on arm64, API Gateway, DynamoDB (on-demand), Cognito User Pool, and KMS encryption key.
- Created `StorageAdapter` providing dual persistence (DynamoDB for Cloud with KMS envelope encryption, SQLite for local desktop development).
- Built Amazon Bedrock Converse API Agent Engine (`bedrockAgentEngine.ts`) with typed tools (`get_emails`, `get_calendar_events`, `get_tasks`, `record_risk`, `propose_action`) and prompt injection defense tags (`<untrusted_email_data>`).
- Implemented parameter hash binding `hash(run_id, action_type, params)` (SHA-256) to ensure proposed action parameters cannot be altered post-approval.
- Configured AWS Budgets Alarm ($10 threshold) and exponential backoff with jitter on Google API rate-limit responses (`429` / `403`).
