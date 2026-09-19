# Instinct.ai — Technical Spec

Full technical breakdown for a personal AI agent of the "Instinct" type: MVP scope, backend, integrations, security, Google account connection, and rate limiting. This is the **product roadmap**. The hackathon slice is defined in `AGENTS.md` §0 and §3, and section 9 of this document maps roadmap to hackathon scope.

## 1. Reference product

Instinct (Spear Street Technology) is a personal AI agent that connects to a user's email, messaging, screen, audio and location and acts on their behalf via text or phone call. Public reports mention tasks such as answering emails, coordinating calendars, arranging transportation, and shopping for insurance. It is invite-only, and its internal architecture and model are not public. Early testers criticized: a perpetual, irrevocable licence to reuse user data for training, plain-text email storage, phishing susceptibility, and an agent that kept acting on Gmail after access was revoked. This spec designs against each of those.

## 2. MVP scope (product)

**Must-have**
- Onboarding with phone-number verification (SMS OTP) plus Google sign-in.
- Google connection for Gmail and Calendar.
- Two-way text channel (SMS first; WhatsApp/iMessage-style later).
- Agent core that can read/summarize the inbox, draft and send replies, and find/create/reschedule calendar events.
- User memory: preferences, contacts, writing style, standing rules.
- Approval gates: the agent asks before sending, paying, or deleting.
- Audit log of every action; one-tap disconnect and data deletion.

**Post-MVP**
- Voice calls (realtime speech-to-speech).
- Browser/computer-use automation.
- Payments, travel, food, rides; more integrations (Outlook, Slack, Drive, Contacts).
- Proactive workflows (follow up on dropped threads).
- Billing tiers and admin tooling.

## 3. Backend architecture

- **Channel gateway.** Twilio (or similar) webhooks for inbound/outbound SMS. US SMS needs A2P 10DLC registration, which takes weeks, so start early. Per-user number or routing scheme. Verify webhook signatures, dedupe by message ID, queue outbound with retries and delivery receipts.
- **Agent orchestrator.** LLM with tool calling in a plan → act → observe loop. Model routing (cheap model for simple requests, stronger model for hard ones). Strict typed tool schemas. Long tasks run as durable workflows (Temporal, Inngest, Step Functions, or queue + state machine) so they survive crashes. Every tool call is idempotent.
- **Memory and context.** Postgres (or DynamoDB) for structured data; vector store for semantic recall over emails and history; rolling per-user summary to keep prompts small.
- **Integration layer.** Tool registry where each integration exposes typed actions (`gmail.search`, `gmail.send`, `calendar.create_event`), handles auth, and declares a risk level (read / write / irreversible).
- **Data stores.** Relational or key-value DB, Redis (locks, rate-limit counters, sessions), object storage for attachments, append-only event log.
- **Async infrastructure.** Priority job queues, dead-letter queues, per-user concurrency limits so one user's backfill can't starve others.
- **Observability.** Trace per agent run, token and cost tracking per user, error alerting, an eval set of real task transcripts to catch regressions when prompts or models change.

## 4. Security

- **Tokens and data.** Envelope-encrypt refresh tokens and email content at rest (KMS). Isolate per-tenant data. Never train on user data by default.
- **Prompt injection.** Every email is untrusted input. Treat content as data, never as instructions. Any action triggered by email content requires user approval.
- **Approval and limits.** Confirmation for sends/payments, spending caps, recipient/domain allowlists, per-user kill switch. Bind approvals to the exact action parameters.
- **Revocation.** On revocation or `invalid_grant`: stop all jobs for that user, purge queued tasks, notify the user. On disconnect: call Google's revoke endpoint, delete tokens and cached data.
- **Compliance.** Privacy policy, consent screens, data export and deletion, GDPR/CCPA readiness.
- **Secrets hygiene.** No secrets in source control, least-privilege IAM, short log retention, no tokens or email bodies in logs.

## 5. Google login and connection

Split it into two steps:

1. **Sign in with Google (identity).** Request only `openid email profile` (non-sensitive, no scary warning screen).
2. **Connect Gmail and Calendar (authorization).** Ask later, in context ("Want me to manage your inbox?"), using incremental authorization.

| Scope group | Examples | Google review needed |
|---|---|---|
| Basic | `openid`, `email`, `profile` | None |
| Sensitive | `calendar`, `calendar.events` | OAuth verification |
| Restricted | `gmail.readonly`, `gmail.modify`, `gmail.send` | Verification plus annual third-party security assessment (CASA) |

**Gotchas**
- Gmail scopes are restricted: verification and the security assessment can take weeks. Start well before launch.
- While the OAuth app is in "Testing" status you're capped at 100 test users and refresh tokens expire after 7 days. Move to "In production" for real launch.
- Configure the consent screen properly: verified domain, privacy policy, homepage, exact redirect URIs.

**Flow design**
- Server-side Authorization Code flow with PKCE and a signed `state` parameter tied to the session.
- `access_type=offline` and `prompt=consent` on first connect to reliably get a refresh token.
- Refresh proactively with a per-user lock so parallel jobs don't all refresh at once.
- Show "Connected" immediately; load the mailbox in the background.

**Sync (full product)**
- **Gmail:** one-time backfill with paginated `messages.list` and batched `get`; then `users.watch` with Pub/Sub push and `history.list` for incremental sync. `watch` expires within 7 days: renew daily. On 404 for an old `historyId`, do a full resync.
- **Calendar:** `events.watch` channels plus `syncToken` for incremental sync; renew channels before expiry.
- Verify the JWT on Pub/Sub push requests.

## 6. Rate limiting during the Google connection

Goal: users never see rate-limit errors while connecting.

- The connect step is light: token exchange, profile fetch, start watch. The heavy part (mailbox backfill) runs asynchronously, never inside the login request.
- Use a token bucket per user and per project against Google's quotas. Gmail limits are quota-unit based: roughly 15,000 units per user per minute and 1.2 million per project per minute; typical costs are about 5 units for a read (`messages.list`/`get`), 2 for `history.list`, and about 100 for `send` or `watch`. **Verify current numbers in Google Cloud Console/docs before relying on them.**
- On `429` or `403 rateLimitExceeded`, use exponential backoff with jitter and honor `Retry-After`. Use batch requests. Request a quota increase before scaling.
- Backfill the most recent 30–90 days first, then older mail at low priority.
- **Keep** rate limiting and validation on our own OAuth endpoints. `state` and PKCE checks are CSRF protection, and endpoint limits stop abuse and token-farming bots. Set limits generously per user/IP so real users never notice them, but keep them on.

## 7. Suggested stack

**Full product:** TypeScript (NestJS) or Python (FastAPI); Postgres + pgvector; Redis; Temporal or Inngest; Twilio; AWS or GCP with KMS; lightweight web app for onboarding/settings (main interface is text).

**Hackathon (AWS-central):** Python 3.12 Lambda + API Gateway HTTP API; Cognito; Step Functions; Bedrock (Converse API, tool use); Strands Agents SDK; DynamoDB; KMS + Secrets Manager; S3 + CloudFront; CloudWatch/X-Ray + Powertools; AWS CDK (Python); React + Vite + TypeScript frontend. Verify each library's licence and version before use and record in `THIRD_PARTY_NOTICES.md`.

## 8. Suggested build order (full product)

1. Google Cloud project, consent screen, verification submission (start immediately).
2. Auth, phone verification, encrypted token storage.
3. Gmail and Calendar sync pipeline.
4. Agent core with read-only tools, then write tools behind approval gates.
5. SMS gateway and memory.
6. Audit log, disconnect and delete flows, evals.
7. Closed beta, then voice, browser automation, more integrations.

## 9. Roadmap → hackathon mapping

| Roadmap item | Hackathon decision | Reason |
|---|---|---|
| Google sign-in | **Build** (Cognito federation) | Core, and shows AWS |
| Gmail + Calendar connect | **Build**, Testing mode, minimal scopes | Verification takes weeks; be honest in README |
| Agent with read + one write tool | **Build** (Bedrock + Strands + Step Functions) | The one reliable flow |
| Approval gates, audit log, disconnect | **Build** | Trust and safety are central to the idea |
| Prompt-injection defense | **Build** (with a test) | Real risk for email agents |
| SMS / voice | Future work | A2P 10DLC and realtime audio too heavy for one day |
| Gmail push (Pub/Sub) + backfill | Future work | Needs GCP; on-demand fetch is enough |
| Browser/computer-use, payments, travel | Future work | Out of scope |
| Memory/vector store | Optional, only if time remains | Not needed for the demo flow |
| Billing/admin | Future work | Not judged |

## 10. Rate-limit and quota summary for the deployed hackathon app

- Google API: on-demand only, capped result counts, backoff wrapper, no background sync.
- Bedrock: iteration caps, max tokens, per-user hourly run quota, global kill switch.
- API Gateway: default stage throttling set generously; light throttling on OAuth start/callback routes.
- Cost: AWS Budgets alarm active; no NAT gateways; on-demand DynamoDB; arm64 Lambda; 7-day log retention.
