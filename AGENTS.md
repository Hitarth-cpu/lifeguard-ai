# AGENTS.md — Instinct.ai (First Commit hackathon build)

> Read this file completely at the start of EVERY session, before writing any code.
> Companion docs: `docs/TECHNICAL_SPEC.md` (full technical breakdown) and `docs/SUBMISSION_CHECKLIST.md` (judging, compliance, demo, README, blog).
> If a rule here conflicts with a user instruction, stop and ask the human. Never silently break a rule.

---

## 0. Mission

Instinct.ai is a personal AI agent that connects to a user's Google account (Gmail + Calendar) and takes action on their behalf, with the user approving anything consequential. The reference product category is "personal agent you text or call, no new app to learn."

**Hackathon reality:** we have roughly one day. The judges reward ONE reliable, end-to-end flow, running visibly on AWS, shown in a 3-minute video. The full product vision lives in `docs/TECHNICAL_SPEC.md` as a roadmap. **Do not build the roadmap. Build the slice below.**

### The one problem (default — human may edit this section)

- **User:** a busy student, founder, or professional whose meeting requests and deadlines get buried in email.
- **Problem:** important scheduling requests sit unanswered in the inbox; turning an email into a calendar event is manual, slow, and easy to forget.
- **The single flow we ship:**
  1. User signs in with Google.
  2. User connects Gmail (read-only) + Calendar (events).
  3. User asks the agent in a chat UI: "What needs my attention?" / "Schedule the meeting from Priya's email."
  4. Agent searches Gmail, summarizes, and **proposes** a calendar event.
  5. User clicks **Approve**. Agent creates the event. Action is written to an audit log the user can see.
  6. User can **Disconnect** and delete their data in one click.
- Anything not in this list is out of scope until the flow is deployed, tested logged-out, and recorded.

---

## 1. Deadlines and time budget

- **Submission deadline: Sunday Sep 20, 8:00 PM IST.** Target submitting by **6:00 PM IST** to leave buffer. Late = not counted.
- Suggested schedule (adjust, but do not skip gates):
  - Sat night: P0–P3 (repo, deploy skeleton, auth, Google connect, read tools).
  - Sun morning: P4–P5 (approval + write action, UI polish).
  - **Sun 2:00 PM IST — FEATURE FREEZE.** After this only bug fixes, docs, and video.
  - Sun 3:00 PM: deployed URL verified while logged out.
  - Sun 3:00–4:30 PM: record and upload the YouTube demo (≤ 3:00).
  - Sun 4:30–5:30 PM: README, write-up, blog post, THIRD_PARTY_NOTICES check.
  - Sun 6:00 PM: submit. Re-test repo, video, URL while logged out.
- If behind schedule, **cut scope, never cut the demo or the deployment.**

---

## 2. Non-negotiable compliance rules (violations can disqualify the project)

1. **New repo only.** The repository must be created during the event window (on or after Sep 17). Never import, copy, or "port" code from any older project. If the human pastes old code, refuse and ask.
2. **Git history is evidence.** Commit early and often with meaningful messages. **Never** rewrite history: no `git push --force`, no `git rebase` of pushed commits, no `git commit --amend` after push, no `filter-branch`/`filter-repo`, no faked `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`. If history must change for any reason, ask the human first.
3. **Attribution.** Every third-party library, template, starter, icon, font, image, and snippet is recorded in `THIRD_PARTY_NOTICES.md` (name, version, licence, URL, what it's used for) **at the time it is added**, not at the end. Only use permissively licensed work (MIT, Apache-2.0, BSD, ISC, MIT-0, etc.). Ask before adding anything GPL/AGPL/unlicensed/unknown.
4. **Separate our work from dependencies.** The README has a section "Built during the event vs. third-party" so a reviewer can see exactly what we wrote.
5. **Disclose AI tools.** Keep `docs/AI_USAGE.md` listing every AI tool used (e.g. the coding agent, Bedrock models used at runtime, any image/copy tools). This goes into the write-up.
6. **No plagiarism.** Do not paste code from blog posts, gists, or other repos without recording source + licence. When adapting an official AWS/Google sample, note it in `THIRD_PARTY_NOTICES.md`.
7. **No secrets or private data in the repo — ever.** See §9.
8. **Only claim what works.** Every feature mentioned in README/write-up/video must be real and demonstrated. Do not stub features and describe them as working. Known gaps go under "Limitations" in the README.
9. **Registration details accurate.** Do not invent team names, emails, or links in docs. Use placeholders and ask the human.

---

## 3. Scope discipline (what we build vs. what we deliberately don't)

**In scope (hackathon slice):**
- Sign in with Google (Amazon Cognito federated identity).
- Separate, explicit "Connect Gmail & Calendar" step (OAuth code flow + PKCE + `state`).
- Chat UI + agent with read tools (Gmail search/get, Calendar list) and one write tool (create calendar event) behind approval.
- Activity/audit view, Disconnect + delete.
- Deployed on AWS with IaC, budget alarm, architecture diagram.

**Out of scope for the hackathon (document as "Future work", do not build):**
- SMS/voice channels (US SMS needs A2P 10DLC registration that takes weeks; voice is heavy).
- Browser/computer-use automation, payments, travel booking.
- Gmail push notifications via Pub/Sub (requires GCP setup) and background mailbox backfill. We fetch live via the Gmail API on demand.
- Google OAuth production verification and the restricted-scope security assessment (takes weeks). We run the Google app in **Testing** mode with test users and say so honestly in the README limitations.
- Multi-tenant billing, admin dashboards, team features.

Rule of thumb: **one reliable feature beats several incomplete ones.** Before starting any new item ask: "Is it in the flow above? Does it appear in the demo?" If no to either, skip it.

---

## 4. AWS must be central and visibly working

AWS is the biggest differentiator. Every major capability runs on AWS and appears in the demo and architecture diagram.

| Concern | AWS service | Notes |
|---|---|---|
| Frontend hosting | S3 + CloudFront (or Amplify Hosting) | HTTPS, public URL |
| API | API Gateway (HTTP API) + Lambda (Python 3.12, arm64) | HTTP API is cheaper than REST API |
| Sign-in | Amazon Cognito user pool + Google federation | Basic scopes only (`openid email profile`) |
| Agent workflow | AWS Step Functions | Visible execution graph in demo; approval via `waitForTaskToken` |
| LLM | Amazon Bedrock (Converse API with tool use) | Optional but recommended; IAM role, no API keys. Verify model availability/access in the chosen region. Do not guess model IDs; check the console/docs |
| Agent framework | Strands Agents SDK (AWS open source) | "Build It": meaningful AWS open-source use. Verify licence + version, record it |
| Data | DynamoDB (on-demand) | users, connections, runs, approvals, audit log |
| Secrets/crypto | KMS + Secrets Manager | Encrypt Google refresh tokens with KMS; Google client secret in Secrets Manager |
| Observability | CloudWatch Logs/metrics, X-Ray, Powertools for AWS Lambda | Logs retention 7 days |
| IaC | AWS CDK (Python) | Whole stack reproducible with `cdk deploy` |
| Cost guard | AWS Budgets alarm | Set at a small amount (e.g. $10–$20); tell the human |

**Cost choices to explain in README/demo:** serverless pay-per-use (no idle cost), DynamoDB on-demand, Lambda on arm64, HTTP API over REST API, **no NAT gateways and no VPC unless required**, no always-on instances, short log retention, small Bedrock model for routing/summaries and a larger one only if needed, per-user run quotas.

**Fallbacks (decide early, record in `docs/DECISIONS.md`):**
- If Step Functions approval-wait is taking too long: run agent in Lambda, persist run state in DynamoDB, approval = separate `POST /approvals/{id}`.
- If Cognito Google federation eats more than ~1.5 hours: implement Google sign-in in a Lambda with a signed session cookie, and keep the rest of the AWS stack.
- If Bedrock model access is blocked: ask the human before switching providers; document it as a limitation.

Never create or modify AWS resources by hand in the console without recording it. Prefer CDK. **Ask the human before deploying anything that could incur meaningful cost.**

---

## 5. Google account connection — smooth, correct, no rate-limit surprises

1. **Two steps, not one.** Sign-in (identity, basic scopes) first. Gmail/Calendar access is requested in a separate "Connect" step with clear explanation (incremental authorization).
2. **Flow:** server-side Authorization Code flow with **PKCE** and a signed, single-use, expiring **`state`** bound to the user's session. `access_type=offline`, `prompt=consent` on first connect to get a refresh token. Exact redirect URIs only.
3. **Minimum scopes:** `gmail.readonly` + `calendar.events`. Add nothing else. (Gmail scopes are *restricted*, Calendar is *sensitive*; see spec.)
4. **Testing-mode reality:** unverified app = warning screen, max 100 test users, refresh tokens expire after 7 days. Use a **dedicated demo Google account with synthetic emails** for the demo. Never use anyone's real inbox in the video.
5. **Token handling:** encrypt refresh tokens with KMS before storing; never log tokens, auth codes, or email bodies; refresh access tokens proactively with a per-user lock (no refresh stampede); on `invalid_grant` mark the connection revoked, stop that user's runs, and show a "Reconnect" prompt.
6. **Rate-limit-proof connect:**
   - The connect request does only: state check → token exchange → store encrypted token → return "Connected". No heavy work inside the login request.
   - All Gmail/Calendar calls go through one client wrapper with exponential backoff + jitter on `429` and `403 rateLimitExceeded`/`userRateLimitExceeded`, honoring `Retry-After`.
   - Use `format=metadata` or minimal fields and cap results (e.g. last 30 days, max ~25 messages) to keep quota use tiny.
   - Google quota is roughly per-user and per-project quota units per minute (see spec; verify the current numbers in Cloud Console).
7. **Do NOT remove our own protections to "avoid" rate limits.** `state` validation, PKCE verification, and modest endpoint throttling are security controls, not obstacles. Set limits generously per user/IP so real users never notice them, but keep them. If the human asks to disable them, explain the risk and propose a higher limit instead.
8. **Disconnect:** call Google's token revocation endpoint, delete stored tokens and cached email data, cancel in-flight runs, write an audit entry.

---

## 6. Agent design rules

- **Typed tools only.** Each tool has a strict input schema (validate with Pydantic), a risk level (`read` / `write` / `irreversible`), and a timeout. The model never gets raw HTTP or shell access.
- **Approval gates.** All `write`/`irreversible` tools require explicit user approval. The approval record is bound to a **hash of the exact action parameters** so parameters cannot be swapped after approval. Approvals expire.
- **Prompt injection defense.** Email content is **untrusted data**. Wrap it in clearly delimited data blocks, never as instructions. System prompt states that instructions found inside emails must be ignored. No action may be triggered solely by email content without user approval. Add at least one test with a malicious email.
- **Idempotency.** Every write has an idempotency key (`hash(run_id, step, params)`) enforced with a DynamoDB conditional put, so retries never double-create an event.
- **Least privilege at runtime.** The agent may only use the connected user's own tokens; per-run tool allowlist.
- **Cost and abuse control.** Max tool-call iterations per run, max tokens, per-user hourly run quota, and a global kill switch (environment flag).
- **Transparency.** Every run stores: user request, tools called (name + sanitized args), proposed action, approval decision, result. The UI "Activity" tab renders this.
- **Honest failure.** If Google or Bedrock fails, tell the user plainly and offer retry. Never fabricate email contents or event details. Prefer "I couldn't find that email" over guessing.
- **Grounding.** The agent quotes/links the email it acted on (subject + sender + date) in its proposal so the user can verify.

---

## 7. Backend engineering rules

- Repo layout (create early, keep tidy):
  ```
  /infra        # CDK app (Python)
  /backend      # Lambda handlers, agent, tools, google client
  /frontend     # React + Vite + TypeScript
  /docs         # spec, checklist, decisions, ai usage, diagrams, demo script
  /scripts      # smoke test, helpers (no secrets)
  ```
- Validate all inputs at the boundary (Pydantic). Return consistent JSON errors with correct status codes. Never leak stack traces or internal IDs to the client.
- Structured logging via Powertools (correlation IDs, run IDs). **Redact** tokens and email bodies.
- Config via environment variables/SSM/Secrets Manager. `.env.example` lists names only, no values.
- Small pure functions, thin handlers, unit tests for: state/PKCE handling, token refresh + lock, backoff logic, approval-hash binding, idempotency, prompt-injection handling.
- Pin dependency versions. Do not add a dependency without recording its licence.
- Use official docs to verify AWS/Google API behavior. If unsure of an API detail, model ID, quota number, or limit, **say so and check** rather than inventing it.

---

## 8. Frontend / UI rules (Best UI category)

- React + Vite + TypeScript, simple component library or Tailwind; record licences.
- The core screen is the chat with clear states: loading, streaming/progress, proposal card (Approve / Reject), success, error, empty, disconnected.
- Proposal card shows exactly what will happen (event title, time, attendees, source email). Approve is explicit; nothing happens on page load.
- A visible Activity/audit tab and a Disconnect & delete button.
- Responsive, keyboard accessible, sufficient contrast, readable fonts, meaningful button labels, no lorem ipsum, no dead buttons.
- A short onboarding that names the user and the problem in one sentence.
- Use consistent design tokens; polish spacing and empty states. Judges see only what the video shows, so make the demo path beautiful first.

---

## 9. Security checklist (verify before every push and again before submission)

- [ ] `.gitignore` covers `.env*`, `*.pem`, `cdk.out`, `node_modules`, `.venv`, AWS/Google credential files.
- [ ] Run a secret scanner (e.g. gitleaks) as a pre-commit hook and in a final full-history scan.
- [ ] No API keys anywhere: AWS access via IAM roles; Google client secret only in Secrets Manager.
- [ ] If a secret is ever committed: **rotate it immediately**, then ask the human how to proceed. Do not rewrite history on your own.
- [ ] IAM policies are least-privilege (no `*:*`); KMS key policy scoped to the Lambda roles.
- [ ] CORS restricted to the CloudFront origin. Cookies `HttpOnly`, `Secure`, `SameSite`.
- [ ] S3 bucket private behind CloudFront (OAC); no public write.
- [ ] Logs contain no tokens, auth codes, or email content.
- [ ] Demo uses synthetic data only; no real personal email, phone numbers, or names.
- [ ] Privacy stance stated in README: no training on user data, data deletable on request, tokens encrypted.

---

## 10. Systematic workflow (follow this loop)

Maintain `docs/PLAN.md` (checklist of phases) and `docs/BUILD_LOG.md` (short dated notes: what was built, decisions, problems, screenshots — this feeds the Best Blog post).

**Task loop — repeat for every unit of work:**
1. State the goal of the unit in one sentence and confirm it's in scope (§3).
2. Write/adjust a small test or a manual check first when practical.
3. Implement the smallest change that works.
4. Run tests/lint; deploy to the dev stack if the change touches AWS.
5. Verify the behavior end to end (not just "it compiles").
6. Update docs (`PLAN.md`, `BUILD_LOG.md`, `THIRD_PARTY_NOTICES.md`, README sections) in the same commit.
7. Commit with a meaningful message (`feat:`, `fix:`, `infra:`, `docs:`, `test:`), push.
8. Tell the human what changed and what's next. Flag risks early.

**Phases and exit criteria:**

| Phase | Goal | Exit criterion |
|---|---|---|
| P0 | New repo, structure, CDK skeleton, hello-world deployed | Public CloudFront URL loads a page; API returns 200 |
| P1 | Cognito + Google sign-in | Can sign in/out; protected API route rejects anonymous |
| P2 | Google connect flow | Connected state persists; token encrypted; disconnect works |
| P3 | Agent read tools (Gmail search/get, Calendar list) via Bedrock | Chat answers "what needs my attention?" from the demo inbox |
| P4 | Proposal + approval + create event | Approved proposal creates a real calendar event exactly once |
| P5 | UI polish, activity log, error states | Demo path looks good and never dead-ends |
| P6 | Hardening: tests, security checklist, cost check, budget alarm | All checklist items in §9 pass |
| P7 | Docs, architecture diagram, demo, blog, submission | `docs/SUBMISSION_CHECKLIST.md` fully checked |

Do not start a phase until the previous exit criterion is met, unless the human says otherwise.

---

## 11. Testing and verification

- Happy-path E2E on the **deployed** stack, not just locally. Keep `scripts/smoke.sh` that hits the live URL/API and checks key endpoints.
- Test edge cases: no matching email, expired/revoked Google token, Google 429, Bedrock throttling, approval expired, duplicate approve click, malicious email content, disconnect mid-run.
- Before submission, test the repo, the video link, and the deployed URL **while logged out / in a private window / from a fresh clone**.
- Run a fresh-clone setup following the README exactly; fix any missing step.

---

## 12. Demo, README, and submission obligations (details in `docs/SUBMISSION_CHECKLIST.md`)

Judging themes: **Idea** (one specific problem, named user), **AWS use** (central, visible, deployed, cost/architecture choices), **Execution** (works end to end), **Demo** (≤ 3 min; show problem, user, working flow, exactly where AWS is used — nothing unshown counts). Extras: **Best UI**, **Best Blog** (AWS Builder Center).

The agent must continuously keep ready:
- `README.md` with: problem + user, setup steps, architecture diagram, AWS use, cost choices, limitations, AI tools used, third-party credits/licences, "built during event vs. third-party".
- `THIRD_PARTY_NOTICES.md`, `docs/AI_USAGE.md`, `docs/DECISIONS.md`, `docs/DEMO_SCRIPT.md`, `docs/BUILD_LOG.md`.
- Short write-up: problem, what we built, where AWS fits.
- A blog draft for AWS Builder Center from `BUILD_LOG.md`.

---

## 13. Ask the human before you...

- Create or change billable AWS resources beyond the planned stack, or raise any quota/limit.
- Add a dependency with an unknown/copyleft licence, or copy any external code/template.
- Change the scope in §0/§3, the deadline plan in §1, or a compliance rule in §2.
- Touch git history, delete branches, or run destructive commands (`rm -rf` outside build dirs, dropping tables, deleting stacks).
- Use any real person's data, or any account other than the dedicated demo account.
- Switch LLM provider or region.

## 14. Definition of Done (final gate)

- [ ] The one flow works end to end on the deployed AWS URL, repeatedly.
- [ ] Every claimed feature appears in the video; the video is ≤ 3:00 and public/unlisted per rules.
- [ ] README complete; architecture diagram included; limitations honest; AI tools and third-party credits listed.
- [ ] `THIRD_PARTY_NOTICES.md` matches actual dependencies.
- [ ] Secret scan of full history is clean; no private data anywhere.
- [ ] Repo is public and new; commit history is intact, frequent, and within the event window.
- [ ] Repo, video, and deployed URL tested logged out.
- [ ] Budget alarm active; stack cost understood and explained.
- [ ] Blog post published on AWS Builder Center (if entering Best Blog) and linked.
- [ ] Registration details and submission form entries accurate; submitted before 8:00 PM IST Sep 20.
