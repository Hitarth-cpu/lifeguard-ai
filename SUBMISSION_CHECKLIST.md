# Submission Checklist — First Commit hackathon

**Deadline: Sunday Sep 20, 8:00 PM IST.** Target submission: 6:00 PM IST. No live judging: anything not shown in the video or written down may not count.

## 1. Judging parameters (no numeric weights are published)

| Parameter | What judges look for | What we do |
|---|---|---|
| **Idea** | One real, specific problem; user clearly named; why it matters | README/video open with: "Busy [user] loses meeting requests in their inbox; Instinct.ai turns them into approved calendar events." |
| **AWS use** (biggest differentiator) | AWS central and visibly working in the demo. Build It: meaningful AWS open-source use. Ship It: live AWS deployment, working URL, clear architecture and cost choices. Bedrock optional | Lambda, API Gateway, Cognito, Step Functions, DynamoDB, KMS, S3/CloudFront, Bedrock, CDK; Strands Agents + Powertools + CDK as open-source use; architecture diagram and cost section |
| **Execution** | Works end to end; one reliable feature beats several incomplete ones | Single flow, tested on the deployed stack repeatedly |
| **Demo** | Max 3 minutes; show problem, target user, working flow, exactly where AWS is used | Storyboard in §5; every claim shown |

**Extra categories:** Best UI (design and usability) and Best Blog (build story published on AWS Builder Center).

## 2. What to submit

- [ ] New **public** repository
- [ ] 2–3 minute **YouTube demo** (never over 3:00)
- [ ] Short **write-up**: problem, what you built, where AWS fits (name AI tools used)
- [ ] **Ship It:** working deployed AWS URL
- [ ] **Best Blog:** AWS Builder Center post link
- [ ] Registration details accurate

## 3. Compliance checklist

**Allowed:** public libraries, frameworks, APIs, boilerplate, starter templates; AI coding tools if named in the write-up; third-party work with attribution and a permitted licence.

**Not allowed:** any project started before Sep 17; rewriting old work and presenting it as new; plagiarism or unlicensed borrowed work; repository history outside the event window.

**Protect yourself:**
- [ ] New repo created during the event (check first commit date: `git log --reverse --format='%ad %s' | head`)
- [ ] Frequent, meaningful commits; dates never rewritten (no force-push/rebase/amend after push)
- [ ] Every template/dependency source and licence recorded
- [ ] `THIRD_PARTY_NOTICES.md` present and accurate
- [ ] README clearly separates what was built during First Commit from dependencies

## 4. Before submitting

- [ ] Remove secrets, keys, passwords, and private data (run a secret scan over the full history)
- [ ] README includes: setup steps, architecture, AWS use, limitations, AI tools used, third-party credits/licences
- [ ] Test repo, video, and deployed URL **while logged out** (private window / fresh clone)
- [ ] Every claimed feature appears in the video
- [ ] Registration details accurate

### README required sections (template)

```
# Instinct.ai
## Problem and target user
## What it does (the one flow)
## Demo video + live URL
## Architecture (diagram)
## Where AWS is used (service by service, and why)
## Cost choices
## Setup and deploy steps (fresh clone works)
## Security and privacy design
## Limitations (Testing-mode Google app, no SMS/voice, etc.)
## AI tools used
## Built during First Commit vs. third-party
## Third-party credits and licences (link THIRD_PARTY_NOTICES.md)
## Future work
```

### THIRD_PARTY_NOTICES.md template

```
# Third-Party Notices
| Name | Version | Licence | Source URL | Used for |
|---|---|---|---|---|
| (add each dependency/template/asset when it is introduced) | | | | |

## Built during First Commit
All application code in /backend, /frontend, /infra, /scripts and /docs was written during the event window, except the items listed above.
```

### AI usage (docs/AI_USAGE.md)
List the coding agent/tools used, the Bedrock model(s) used at runtime, and any other AI tools (copy, images, video editing). Reuse it verbatim in the write-up.

## 5. Demo video storyboard (max 3:00, aim for 2:40)

| Time | Show | Say |
|---|---|---|
| 0:00–0:20 | Title + the problem: a cluttered inbox with a buried meeting request | Name the user and why it matters |
| 0:20–0:45 | Sign in with Google; then the explicit "Connect Gmail & Calendar" step | Minimal scopes, tokens encrypted (KMS) |
| 0:45–1:30 | Ask "What needs my attention?" then "Schedule the meeting from Priya's email" | Agent runs on Bedrock via Strands |
| 1:30–2:00 | Proposal card → click **Approve** → event appears in Google Calendar | Nothing happens without approval; idempotent |
| 2:00–2:30 | **AWS in action:** Step Functions execution graph, CloudWatch logs, DynamoDB audit item, CDK/architecture diagram | Say exactly which service does what and the cost choices |
| 2:30–2:50 | Activity log, Disconnect & delete; Limitations; Future work | Be honest |

Rules: use only the synthetic demo account; no secrets or real emails on screen; no claims that aren't shown; rehearse once and time it.

## 6. Write-up template (short)

- **Problem:** who, what pain, why it matters (2–3 sentences).
- **What I built:** the one flow, in plain language.
- **Where AWS fits:** service-by-service bullets, deployed URL, architecture and cost choices.
- **AI tools used:** from `docs/AI_USAGE.md`.
- **Limitations:** Testing-mode Google OAuth (test-user cap, warning screen), no SMS/voice, on-demand Gmail fetch only.

## 7. Best Blog outline (AWS Builder Center)

1. The problem and who it's for.
2. Architecture and why each AWS service was chosen (with diagram and cost notes).
3. Hard parts: Google OAuth in Testing mode, quota-safe Gmail calls, approval-bound actions, prompt-injection defense.
4. What broke and how it was fixed (from `docs/BUILD_LOG.md`).
5. Results, limitations, and what's next.
Publish it early enough to link in the submission.

## 8. Final pre-submit gate (logged out)

- [ ] Open repo in a private window: public, README renders, no secrets
- [ ] Open the YouTube link in a private window: plays, ≤ 3:00, visibility allows judges to view
- [ ] Open the deployed URL in a private window: loads, sign-in works, flow completes
- [ ] Fresh clone + README setup steps succeed
- [ ] Blog link opens
- [ ] Submission form values match the repo, video, and registration details
- [ ] Submitted before 8:00 PM IST, Sep 20
