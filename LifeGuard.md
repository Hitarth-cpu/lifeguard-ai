LifeGuard reverses this model.

Authorized data sources and environments
        ↓
LifeGuard observes meaningful signals
        ↓
Detects unusual situations, risks, or missed commitments
        ↓
Investigates context and root causes
        ↓
Estimates consequences and urgency
        ↓
Creates possible recovery plans
        ↓
Executes only permitted safe actions
        ↓
Pauses for human approval before consequential actions
        ↓
Records what happened and maintains session context

## Core Principle

LifeGuard is not another chatbot with a collection of tools.

It is a proactive agent system designed to answer:

"What is likely to go wrong in the environments I have authorized you to monitor, and what can we do before it becomes a bigger problem?"

The long-term vision is a Life Operating System: an agent layer that helps a person manage intent across fragmented digital systems.

The hackathon MVP must remain focused. It should demonstrate one or more complete, believable scenarios deeply rather than pretending to manage every part of a person's life.

## 2. The Problem

Modern life is distributed across many disconnected systems:

Email
Calendar
Documents
Tasks
Financial notifications
Subscription services
Travel bookings
Cloud storage
Accounts
Work systems
Messages
Personal notes

The user is expected to connect information manually.

For example:

A calendar knows about an upcoming trip.
Email contains a passport warning or booking confirmation.
A document folder contains required travel documents.
A transport booking has not been made.
A hotel confirmation is missing.

No single application necessarily understands the entire situation.

LifeGuard attempts to connect authorized signals into a contextual model.

The value is not:

"Here are all your notifications."

The value is:

"Several independent signals together indicate that you may have a problem."

## 3. What LifeGuard Is

LifeGuard is a proactive, multi-agent risk detection and recovery system.

It has five primary responsibilities:

Observe authorized environments.
Detect risks, anomalies, commitments, and incomplete situations.
Investigate relevant context using tools and specialized subagents.
Plan possible responses and estimate consequences.
Act safely, with human approval before consequential or irreversible actions.

### The LifeGuard Decision Loop

```
┌──────────────────────────────┐
│  AUTHORIZED DATA SOURCES     │
│                              │
│ Email · Calendar · Docs      │
│ Tasks · MCP Tools · APIs     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       OBSERVATION LAYER      │
│  Normalize events and state  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      RISK DETECTION AGENT    │
│ Detect anomalies and signals │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   CONTEXT / INVESTIGATION    │
│        SUBAGENTS             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      CONSEQUENCE ANALYSIS    │
│  What happens if ignored?    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       RECOVERY PLANNER       │
│ Generate possible actions    │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
SAFE / REVERSIBLE   CONSEQUENTIAL
AUTO ACTION          ACTION
       │                │
       ▼                ▼
    Execute        HUMAN APPROVAL
                        │
                        ▼
                     Execute
                        │
                        ▼
┌──────────────────────────────┐
│ MEMORY + AUDIT + UI TIMELINE │
└──────────────────────────────┘
```

## 4. What LifeGuard Can Monitor

LifeGuard must only monitor sources that the user explicitly authorizes.

Potential sources include:

Email
Calendar
Task managers
Documents and cloud storage
Subscription information
Booking information
Financial notifications
Work platforms
Notes
Custom APIs
MCP-connected services

### Important Rule

No source is connected or monitored implicitly.

Every integration must be explicitly authorized.

The user must be able to:

Connect a source.
See what permissions it has.
Disconnect it.
Restrict its capabilities.
Delete stored context where technically possible.

## 5. Example Use Cases

These examples are not separate products.

They are demonstrations of the same core LifeGuard capability:

Observe → Detect → Investigate → Predict → Plan → Approve → Act

### 5.1 Travel Risk Detection

#### Situation

The user has an upcoming flight.

LifeGuard observes:

Calendar event for a flight.
Flight confirmation email.
Missing hotel confirmation.
Missing transport arrangement.
A document expiry warning.

#### Agent Flow

```
Upcoming flight detected
        ↓
Collect relevant booking information
        ↓
Check associated travel requirements
        ↓
Search authorized documents
        ↓
Identify missing preparation
        ↓
Calculate urgency
```

#### Example Output

```
TRAVEL RISK DETECTED

Flight:
Tomorrow at 08:30

Issues detected:
🔴 Airport transport not arranged
🟡 Hotel confirmation not found
🟡 Important travel document expires soon

Potential consequences:
- Missed flight
- Check-in or travel complications
- Accommodation issue

Prepared actions:
1. Find transport options
2. Contact accommodation provider
3. Generate travel preparation checklist

External booking or communication requires approval.
```

LifeGuard should not automatically book transport or spend money unless the user has explicitly configured such permission and approved the action where required.

### 5.2 Financial Risk Detection

LifeGuard is not required to provide investment or regulated financial advice.

The MVP can focus on ordinary financial operations and notifications.

#### Situation

The agent observes:

Upcoming EMI: ₹25,000
Current balance: ₹28,000
Other scheduled payments: ₹12,000

#### Investigation

The agent can investigate authorized information such as:

Upcoming payments.
Known incoming funds.
Flexible payment dates.
Subscription renewals.
Existing payment commitments.

#### Example Output

```
FINANCIAL CASH-FLOW RISK

A payment shortage may occur within 4 days.

Known obligations:
- EMI: ₹25,000
- Scheduled payments: ₹12,000

Estimated available balance may be insufficient.

Possible actions:
A. Review flexible payments
B. Identify non-essential upcoming charges
C. Prepare a payment schedule
D. Draft a reminder or provider communication

No money movement will occur without approval.
```

### 5.3 Study or Personal Schedule Recovery

LifeGuard can monitor productivity and schedule commitments without making medical or psychological claims.

#### Situation

```
Exam: 14 days away
Planned syllabus completion: 80%
Actual progress: 20%
Calendar conflicts: 12 hours
```

#### Agent Reasoning

```
Deadline
    +
Required workload
    +
Completed work
    +
Available calendar capacity
        ↓
Schedule feasibility analysis
```

#### Example Output

```
SCHEDULE RISK DETECTED

At the current pace, the planned study workload
is unlikely to be completed before the exam.

I found:
- 12 hours of conflicting calendar activity
- Several incomplete planned topics

Recovery options:
1. Compress the study schedule
2. Reprioritize high-value topics
3. Move selected calendar events
4. Create a revised daily plan

No calendar changes will be made without approval.
```

### 5.4 Digital Security Event Investigation

The system should not claim certainty when evidence is incomplete.

#### Situation

LifeGuard detects a combination of signals:

Password reset email.
Login notification from an unfamiliar location.
New device connection.

Any individual event may be legitimate.

Together, they may justify investigation.

#### Example Output

```
SECURITY ANOMALY DETECTED

Confidence: Medium

Related signals:
- Password reset event
- Login from an unfamiliar location
- New device activity

I cannot confirm unauthorized access.

Recommended investigation:
1. Review recent account activity
2. Identify active sessions
3. Check connected devices
4. Prepare account recovery actions

Logging out devices or changing security settings
requires explicit approval.
```

### 5.5 Subscription and Digital Expense Management

#### Situation

The agent detects:

Several active subscriptions.
Low or no recent usage where usage information is authorized.
Upcoming renewal dates.
Potentially overlapping services.

#### Investigation

The agent should consider:

Whether cancellation could cause data loss.
Whether a subscription is used by another family or team member.
Whether cancellation is reversible.
The renewal date and price.

#### Example Output

```
POSSIBLE RECURRING EXPENSE WASTE

I identified three services with low recent activity.

Estimated potential annual savings: ₹X

Before cancellation:
- Data retention must be reviewed
- Shared usage may exist
- Cancellation consequences are listed

Candidate actions:
[Review Service A]
[Review Service B]
[Review Service C]

Cancellation requires approval.
```

### 5.6 Commitment and Promise Tracking

LifeGuard can identify explicit commitments in authorized text.

Examples:

"I'll send the proposal tomorrow."
"I'll look into this by Friday."
"I'll pay you next week."
"Let's schedule this next month."

#### Flow

```
Authorized communication
        ↓
Explicit commitment detected
        ↓
Extract:
- What
- Who
- When
        ↓
Track supporting evidence
        ↓
Check completion status
```

#### Example

```
COMMITMENT AT RISK

Commitment:
Send project proposal

Deadline:
Tomorrow

Status:
No draft found

Relevant context:
Previous conversation and project documents located.

Suggested action:
Prepare a first draft.

The agent will not send the proposal without approval.
```

#### Critical Functional Rule

The agent must distinguish between:

Explicit commitments.
Hypothetical statements.
Jokes.
Uncertain intentions.

It must assign confidence and avoid treating every sentence as a task.

### 5.7 Small Business Monitoring

The same architecture can monitor a business environment when the owner explicitly connects the relevant systems.

Potential signals:

Sales decline.
Inventory approaching shortage.
Customer communication unanswered.
Website availability issue.
Failed recurring payment.
Deadline risk.
Operational workload imbalance.

#### Example

```
BUSINESS OPERATIONAL RISK

Three signals were detected:

1. Sales dropped significantly compared with the recent baseline.
2. Two high-value customer messages remain unanswered.
3. Inventory for Product X may be insufficient.

Investigation status:
- Sales trend analysis complete
- Customer messages collected
- Inventory dependency identified

Suggested next step:
Generate an operational recovery plan.
```

## 6. The Core Architecture

LifeGuard should be designed as a system of cooperating components, not one giant prompt.

### 6.1 TrueForge as the Agent Harness

TrueForge must be central to the project.

It should handle meaningful agent-runtime responsibilities rather than simply wrapping one model call.

The architecture should visibly use the harness for:

Agent orchestration.
Tool access.
MCP-connected tools.
Subagent delegation.
Session continuity.
Human approval / interrupt handling where supported.
Safe execution workflows.
Observability of agent actions.

The exact implementation must follow the available TrueForge APIs and documentation.

Do not invent unsupported TrueForge functionality. Verify the actual API during implementation.

### 6.2 Recommended Agent Roles

#### 1. Orchestrator Agent

Responsible for:

Understanding the overall situation.
Deciding whether additional investigation is required.
Delegating work.
Combining subagent results.
Selecting the next safe state.

The Orchestrator should not directly perform every operation.

#### 2. Observation Agent

Responsible for:

Receiving normalized events.
Tracking changes.
Detecting new or relevant information.
Triggering candidate investigations.

Example events:

```
calendar.event.upcoming
email.received
subscription.renewal.upcoming
document.expiry.detected
task.deadline.approaching
```

#### 3. Risk Detection Agent

Responsible for identifying:

Deadlines at risk.
Missing requirements.
Conflicting information.
Unusual patterns.
Cascading risks.
Unfulfilled commitments.

It should produce structured findings rather than vague natural-language conclusions.

Example:

```json
{
  "risk_id": "risk_123",
  "category": "travel_preparation",
  "severity": "high",
  "confidence": 0.87,
  "signals": [
    "flight_detected",
    "transport_missing",
    "document_expiry_near"
  ],
  "status": "needs_investigation"
}
```

#### 4. Investigation Agents

Specialized subagents investigate specific sources or domains.

Examples:

Email Investigation Agent.
Calendar Investigation Agent.
Document Investigation Agent.
Financial Notification Agent.
Task and Commitment Agent.
Security Signal Agent.

Each agent should receive the minimum necessary context.

#### 5. Consequence Analysis Agent

Responsible for answering:

"What is likely to happen if this is ignored?"

It should:

Identify dependencies.
Estimate urgency.
Identify affected commitments.
Explain uncertainty.
Avoid presenting predictions as facts.

Example:

```
Potential consequence:
High probability of schedule conflict.

Confidence:
0.76

Reason:
Two mandatory events overlap and no alternative
time was found in the available calendar window.
```

#### 6. Recovery Planner Agent

Responsible for generating options rather than blindly selecting one.

Example:

```
OPTION A — Move Event
Impact:
- Resolves direct conflict
- Requires approval

OPTION B — Change Task Schedule
Impact:
- Preserves calendar
- Increases workload tomorrow

OPTION C — Do Nothing
Impact:
- Existing conflict remains
```

The user should understand:

What will happen.
What may happen.
What information is uncertain.
What the action costs or changes.

#### 7. Action Agent

Responsible for performing approved actions through MCP tools or authorized APIs.

The Action Agent must be the most constrained component.

It should:

Receive explicit action instructions.
Validate permissions.
Validate approval requirements.
Execute only authorized operations.
Return a structured result.
Never expand its own scope.

## 7. MCP Tool Architecture

MCP is a core part of the project.

Potential tools may include:

```
LifeGuard
    │
    ├── Email MCP
    ├── Calendar MCP
    ├── Task MCP
    ├── Document / Storage MCP
    ├── Notification MCP
    └── Custom Demo MCP
```

### Tool Design Principle

Each tool should expose narrowly defined operations.

Good:

```
calendar.list_events
calendar.find_conflicts
calendar.create_event
```

Riskier:

```
calendar.do_anything
```

Tools should follow least-privilege design.

An agent that only needs to read events should not automatically receive permission to delete events.

## 8. Sandbox Execution

The hackathon explicitly values generated code running safely in a sandbox.

LifeGuard should include at least one meaningful sandbox use case.

Possible uses:

Schedule feasibility calculations.
Dependency analysis.
Data aggregation.
Scenario simulation.
Financial notification arithmetic.
Parsing and analyzing structured data.

Example:

```
Risk detected
      ↓
Agent creates analysis plan
      ↓
Generated analysis code
      ↓
Run inside isolated sandbox
      ↓
Collect result
      ↓
Validate result
      ↓
Use result in recovery plan
```

### Sandbox Rules

Generated code must not:

Have unrestricted host filesystem access.
Access secrets unless explicitly and safely injected.
Receive unnecessary network access.
Modify production systems directly.
Escape the execution environment.

The exact sandbox technology can be selected during implementation.

## 9. Human-in-the-Loop Approval

This is a non-negotiable architectural principle.

### Action Categories

#### Category A — Read-Only

Examples:

Reading an email.
Checking calendar events.
Analyzing a document.
Calculating a schedule.

These can generally execute automatically once authorized.

#### Category B — Reversible or Low-Impact Actions

Examples:

Creating a draft.
Preparing a checklist.
Generating a suggested schedule.
Creating a non-sent message draft.

These may execute automatically if explicitly permitted by the user's policy.

#### Category C — Consequential Actions

Examples:

Sending a message.
Changing an important calendar event.
Cancelling a subscription.
Logging out active sessions.
Modifying important records.
Triggering an external workflow.

These require human approval.

#### Category D — Financial, Destructive, or Highly Sensitive Actions

Examples:

Moving money.
Deleting important data.
Purchasing something.
Cancelling a service with major consequences.

The MVP should avoid automatically executing these actions.

If demonstrated, they must require clear confirmation and should preferably use a safe demo environment.

## 10. Approval Flow

```
Agent proposes action
        ↓
Permission policy check
        ↓
Is approval required?
        │
    ┌───┴────┐
    │        │
   NO       YES
    │        │
    ▼        ▼
Execute    PAUSE
             │
             ▼
      Show user:
      - Action
      - Reason
      - Expected result
      - Possible consequence
      - Reversibility
             │
        ┌────┴────┐
        ▼         ▼
      Reject    Approve
        │         │
        ▼         ▼
     Record     Execute
     decision      │
                   ▼
                Record
                result
```

### Approval Requirements

Approval must be:

Explicit.
Bound to a specific action or action bundle.
Recorded.
Time-limited where appropriate.
Invalidated if the action meaningfully changes after approval.

The system must never interpret:

"Okay"

as universal permission for unrelated future actions.

## 11. Functional Requirements

### FR-01 — Explicit Authorization

The system shall not connect to or monitor a source without explicit user authorization.

### FR-02 — Permission Visibility

The UI shall show connected tools and their granted capabilities.

### FR-03 — Event Normalization

Incoming information should be transformed into a common event format.

Example:

```json
{
  "event_id": "evt_001",
  "source": "calendar",
  "type": "calendar.event.upcoming",
  "timestamp": "ISO-8601 timestamp",
  "summary": "Flight to destination",
  "metadata": {}
}
```

### FR-04 — Risk Confidence

Every non-trivial risk finding should include a confidence estimate or confidence category.

### FR-05 — Evidence

The agent should be able to explain which authorized signals contributed to a finding.

### FR-06 — No Unsupported Certainty

The agent must distinguish:

Fact.
Inference.
Prediction.
Unknown information.

### FR-07 — Investigation Before Escalation

A weak signal should not immediately trigger an alarming action when additional context can reasonably be collected.

### FR-08 — Severity Classification

Suggested levels:

Informational.
Low.
Medium.
High.
Critical.

Severity must consider:

Urgency.
Potential impact.
Reversibility.
Confidence.

### FR-09 — Duplicate Prevention

The same underlying issue should not create repeated independent alerts.

The system should support:

Deduplication.
Correlation.
Risk lifecycle tracking.

### FR-10 — Action State Machine

Actions should have explicit states:

```
proposed
→ awaiting_approval
→ approved / rejected / expired
→ executing
→ completed / failed / partially_completed
```

### FR-11 — Approval Enforcement

The Action Agent must reject execution when a required approval does not exist.

### FR-12 — Idempotency

Where possible, action execution should use idempotency mechanisms to prevent duplicate side effects.

### FR-13 — Auditability

Every important agent decision and tool call should be traceable.

### FR-14 — Session Continuity

The system should preserve relevant task context across reconnects or interrupted sessions.

### FR-15 — Context Minimization

Subagents should receive only the context necessary to complete their assigned task.

### FR-16 — Failure Handling

Tool failures must not be silently treated as successful actions.

The UI should show:

```
Action failed
Reason known / unknown
Retry available?
Human intervention required?
```

### FR-17 — Human Override

The user must be able to:

Stop an action.
Reject an action.
Disconnect a tool.
Disable proactive monitoring.
Override a recommendation.

## 12. Risk Model

A useful internal representation:

```
Risk Score =
Severity × Confidence × Urgency × Dependency Impact
```

This should be treated as an engineering heuristic rather than an objective truth.

Example dimensions:

### Severity

How harmful could the outcome be?

### Confidence

How strongly does available evidence support the finding?

### Urgency

How quickly must action be taken?

### Dependency Impact

How many other commitments or systems may be affected?

The final formula can be adjusted after testing.

The UI should avoid pretending that a single number is perfectly accurate.

## 13. Persistent Memory and Session Context

LifeGuard needs memory, but memory must be carefully scoped.

### Useful Memory

Examples:

An ongoing travel situation.
A pending approval.
A known user preference.
A previously detected risk.
A recovery plan currently in progress.

### Memory Rules

The system should avoid storing unnecessary raw personal information permanently.

Recommended separation:

```
Session Memory
    ↓
Short-lived context for active workflows

Project / Case Memory
    ↓
Information relevant to an ongoing risk

User Preferences
    ↓
Explicitly saved long-term preferences
```

Every memory entry should ideally have:

Source.
Timestamp.
Purpose.
Retention policy.

## 14. Recommended Data Model

The exact database is flexible.

Core entities could include:

User
Integration
Permission
Event
Signal
Risk
Investigation
Evidence
RecoveryPlan
ActionProposal
Approval
Execution
AuditLog
Session

### Risk

```json
{
  "id": "risk_001",
  "status": "investigating",
  "category": "schedule",
  "severity": "high",
  "confidence": 0.82,
  "created_at": "timestamp"
}
```

### Action Proposal

```json
{
  "id": "action_001",
  "risk_id": "risk_001",
  "type": "calendar.create_event",
  "approval_required": true,
  "status": "awaiting_approval",
  "idempotency_key": "unique-key"
}
```

### Approval

```json
{
  "id": "approval_001",
  "action_id": "action_001",
  "decision": "approved",
  "approved_at": "timestamp"
}
```

## 15. Recommended UI

The UI should make the agent understandable to a stranger.

It should answer three questions immediately:

What is LifeGuard doing?
What does LifeGuard think is wrong?
What is LifeGuard waiting for?

### Main Dashboard

```
┌─────────────────────────────────────┐
│ LifeGuard                           │
│ Environment Status: ATTENTION       │
├─────────────────────────────────────┤
│                                     │
│ 🔴 1 High Priority Risk             │
│ 🟠 2 Investigations                 │
│ 🟢 4 Recently Resolved              │
│                                     │
└─────────────────────────────────────┘
```

### Activity Timeline

```
09:01  Signal detected
09:02  Investigation started
09:03  Calendar Agent completed analysis
09:04  Document Agent found missing file
09:05  Recovery plan generated
09:06  Awaiting human approval
```

### Risk Detail View

The user should see:

What was detected.
Evidence.
Confidence.
Potential consequence.
Recovery options.
Actions requiring approval.

### Approval Screen

```
ACTION REQUIRES APPROVAL

Action:
Send message to accommodation provider

Why:
Booking confirmation could not be found.

Expected result:
Request confirmation.

Possible consequence:
An external communication will be sent.

[Reject]     [Approve]
```

The approval should happen before the action.

## 16. Hackathon MVP Scope

Do not attempt to integrate every real-world service.

The recommended MVP should demonstrate the architecture with a small number of high-quality integrations.

### Recommended MVP Scenario Set

#### Scenario A — Travel Readiness

Demonstrates:

Calendar.
Email.
Documents.
Risk correlation.
Recovery planning.
Human approval.

#### Scenario B — Commitment at Risk

Demonstrates:

Communication analysis.
Commitment extraction.
Deadline reasoning.
Document retrieval.
Draft generation.
Approval before sending.

#### Scenario C — Schedule Conflict

Demonstrates:

Calendar analysis.
Sandbox calculation.
Consequence analysis.
Alternative generation.
Approval before changing events.

These scenarios can all use the same core architecture.

This is important.

The project should demonstrate:

One reusable agent architecture handling multiple domains.

Not:

Three unrelated AI demos.

## 17. Recommended Hackathon Demonstration

A strong approximately three-minute demo can follow this structure.

### Part 1 — The Problem

Explain:

"Modern life is fragmented across applications. Problems often appear as small signals in different places, and the user has to manually connect them."

### Part 2 — A Risk Appears

Show:

Upcoming event.
Missing information.
A conflicting signal.

### Part 3 — LifeGuard Investigates

Show the agent:

Calling MCP tools.
Delegating to subagents.
Gathering evidence.
Updating the activity timeline.

### Part 4 — Sandbox Analysis

Show generated or dynamic analysis running in a safe environment.

### Part 5 — Recovery Plan

Show:

```
Problem
↓
Evidence
↓
Potential consequence
↓
Multiple recovery options
```

### Part 6 — Human Approval

Show the agent pause.

The user approves one consequential action.

### Part 7 — Execution and Result

Show:

MCP action.
Result.
Updated timeline.
Risk status changed to resolved or mitigated.

### Part 8 — TrueForge

Explicitly explain where TrueForge is central:

Agent orchestration.
Tool interaction.
Subagents.
Session handling.
Approval / interruption workflow.
Runtime execution.

## 18. Development Rules

These rules should be followed throughout implementation.

### Rule 1 — Do Not Build a Generic Chatbot

The primary product experience should be proactive monitoring and investigation.

A chat interface may exist, but it must not be the entire product.

### Rule 2 — Every Major Capability Must Be Real

Avoid fake architecture.

If the UI says:

"Investigating Calendar"

the system should actually call a calendar tool or a meaningful controlled equivalent.

If the UI says:

"Running analysis"

actual code should run inside a sandbox.

If the UI says:

"Waiting for approval"

execution must genuinely be blocked.

### Rule 3 — Do Not Simulate Safety

Approval must be enforced server-side or by the agent execution layer.

A disabled button in the frontend alone is not sufficient.

### Rule 4 — Prefer Narrow Tools

Use least privilege.

Do not give one agent unrestricted access when a read-only or narrowly scoped tool is sufficient.

### Rule 5 — Explain Agent Reasoning Through Evidence, Not Hidden Thought

The UI should expose:

Observed facts.
Tool results.
Evidence.
Decisions.
Planned actions.

It should not expose private model chain-of-thought.

Use concise structured summaries instead.

### Rule 6 — Every External Side Effect Must Have a Trace

Record:

Who or what initiated it.
Which risk triggered it.
Why it was selected.
Whether approval was required.
Who approved it.
The execution result.

### Rule 7 — Design for Failure

Assume that:

MCP tools can fail.
APIs can time out.
Permissions can be revoked.
Users can disconnect.
Sessions can be interrupted.
The agent can produce uncertain conclusions.

Every critical workflow needs a failure state.

### Rule 8 — Never Treat Uncertainty as Fact

Prefer:

"The available signals suggest..."

instead of:

"This will definitely happen."

### Rule 9 — Keep Domain Logic Modular

Travel logic, schedule logic, commitment logic, and other domain-specific behavior should be modular.

The core system should remain:

```
Observe
→ Detect
→ Investigate
→ Analyze
→ Plan
→ Approve
→ Execute
```

This makes the project extensible.

## 19. Security and Privacy Requirements

Because LifeGuard may handle sensitive personal information, security and privacy are architectural requirements.

Minimum expectations:

Do not commit API keys or secrets.
Use environment variables or a secret manager.
Do not expose secrets in logs.
Do not expose personal data unnecessarily in the demo.
Request the minimum permissions necessary.
Restrict subagent context.
Record tool access.
Allow integrations to be disconnected.
Clearly distinguish real integrations from demo data.

For the hackathon:

Use only tools, accounts, and data that the team owns or is authorized to connect.

## 20. Suggested Technology Structure

The final technology choices can change, but a practical architecture could look like:

```
Frontend
│
├── React / Next.js
│   ├── Dashboard
│   ├── Risk Timeline
│   ├── Investigation View
│   └── Approval Interface
│
Backend
│
├── TypeScript / Node.js
│   ├── TrueForge Agent Runtime
│   ├── Orchestrator
│   ├── Subagents
│   ├── Permission Engine
│   └── API Layer
│
Integrations
│
├── MCP Servers
│   ├── Email
│   ├── Calendar
│   ├── Documents
│   └── Demo / Custom Tools
│
Execution
│
├── Isolated Sandbox
│
Persistence
│
├── PostgreSQL or equivalent
│   ├── Risks
│   ├── Actions
│   ├── Approvals
│   ├── Sessions
│   └── Audit Logs
```

The project should prioritize reliability and demonstrability over unnecessary technology complexity.

## 21. Qodo and Development Workflow

The project must follow the hackathon's code-review requirements.

Every substantive change should follow:

```
Create branch
      ↓
Implement change
      ↓
Open Pull Request
      ↓
Qodo review
      ↓
Address valid findings
      ↓
Record intentional dismissals
      ↓
Run follow-up review
      ↓
Human merge
```

Requirements:

Set up Qodo at the beginning.
Do not rely on direct pushes to main for substantive work.
Fix valid High-severity findings.
Explain intentional or incorrect High findings when dismissing them.
Run follow-up reviews after changes.
Keep meaningful PR history.

The README must contain:

```
## Qodo Code Review Evidence
```

Include:

A representative merged PR link.
What Qodo surfaced.
What changed or was intentionally dismissed.
Evidence of the follow-up review.

## 22. Mapping LifeGuard to the Judging Criteria

### 1. Potential Impact

LifeGuard addresses a universal problem:

People manage increasingly complex lives through disconnected systems and often discover problems too late.

The project aims to shift from reactive assistance to proactive prevention.

### 2. Creativity and Originality

The core novelty is not a single tool.

It is the reusable architecture:

```
Environment signals
        ↓
Contextual correlation
        ↓
Risk detection
        ↓
Investigation
        ↓
Consequence prediction
        ↓
Recovery planning
        ↓
Human-approved action
```

The same architecture can operate across multiple domains.

### 3. Technical Excellence

Demonstrate:

Modular architecture.
Structured state.
Multi-agent delegation.
MCP integration.
Sandbox execution.
Explicit action state machines.
Failure handling.
Persistent context.
Audit logs.

### 4. Use of Sponsor Tools

TrueForge should be central to:

Agent execution.
Tool usage.
Subagents.
Session continuity.
Control flow.

Qodo should be part of the real development process.

### 5. Control and Safety

LifeGuard explicitly demonstrates:

Least-privilege tools.
Safe sandbox execution.
Risk classification.
Approval gates.
Human override.
Action audit trails.

### 6. Presentation

The UI should visibly show:

What LifeGuard observed.
What it detected.
What it investigated.
What it concluded.
What it recommends.
What requires approval.
What action was taken.

## 23. Master Development Checklist

### Foundation

- [ ] Define the MVP scenarios.
- [ ] Define the reusable risk lifecycle.
- [ ] Set up the repository.
- [ ] Set up Qodo before substantive development.
- [ ] Set up TrueForge.
- [ ] Define environment variables and secret handling.

### Core Agent

- [ ] Implement the Orchestrator Agent.
- [ ] Implement the Observation layer.
- [ ] Implement Risk Detection.
- [ ] Implement at least two specialized Investigation Agents.
- [ ] Implement Consequence Analysis.
- [ ] Implement Recovery Planning.
- [ ] Implement constrained Action execution.

### MCP

- [ ] Connect at least one real MCP tool.
- [ ] Demonstrate meaningful tool usage.
- [ ] Apply least-privilege permissions.
- [ ] Handle MCP failures.
- [ ] Record tool calls.

### Sandbox

- [ ] Select sandbox technology.
- [ ] Implement one meaningful generated-code analysis.
- [ ] Prevent unnecessary host access.
- [ ] Capture execution output safely.
- [ ] Show sandbox execution in the demo.

### Approval

- [ ] Define action categories.
- [ ] Implement the action state machine.
- [ ] Require approval for consequential actions.
- [ ] Record approval decisions.
- [ ] Prevent execution without required approval.
- [ ] Implement rejection and expiration.

### Persistence

- [ ] Store active risks.
- [ ] Store investigations.
- [ ] Store action proposals.
- [ ] Store approvals.
- [ ] Store execution results.
- [ ] Support interrupted sessions.

### UI

- [ ] Build dashboard.
- [ ] Build activity timeline.
- [ ] Build risk detail view.
- [ ] Build evidence view.
- [ ] Build recovery options.
- [ ] Build approval interface.
- [ ] Build execution status.

### Quality

- [ ] Add error handling.
- [ ] Add tests for approval enforcement.
- [ ] Add tests for duplicate action prevention.
- [ ] Add tests for permission checks.
- [ ] Run Qodo on substantive PRs.
- [ ] Resolve or document findings.

### Submission

- [ ] Public repository.
- [ ] Clear README.
- [ ] Architecture diagram.
- [ ] Setup instructions.
- [ ] Demo scenario instructions.
- [ ] Qodo Code Review Evidence.
- [ ] Approximately three-minute demo.
- [ ] Blog post.
- [ ] Social posts tagging relevant sponsors.

## 24. Final Product Definition

### LifeGuard AI

LifeGuard is a proactive AI agent that monitors user-authorized digital environments, detects meaningful risks by correlating signals across systems, investigates their context through specialized agents and real tools, safely analyzes possible outcomes, prepares recovery plans, and pauses for explicit human approval before taking consequential action.

Its defining workflow is:

```
OBSERVE
   ↓
DETECT
   ↓
INVESTIGATE
   ↓
UNDERSTAND CONTEXT
   ↓
ANALYZE CONSEQUENCES
   ↓
PLAN RECOVERY
   ↓
SAFE ACTION?
   │
   ├── YES → Execute
   │
   └── NO / CONSEQUENTIAL
             ↓
        HUMAN APPROVAL
             ↓
           Execute
             ↓
       RECORD + UPDATE
```

The MVP should prove that this is a reusable architecture.

A travel risk, missed commitment, and schedule conflict should feel like different instances of the same intelligent system—not separate hard-coded demos.

## 25. Final Development Principle

Every feature should answer at least one of these questions:

Does this help LifeGuard understand an environment?
Does this help it detect a meaningful problem?
Does this improve contextual investigation?
Does this make recovery planning more useful?
Does this make execution safer?
Does this make the agent's behavior more understandable?
Does this demonstrate TrueForge doing meaningful harness work?
Does this improve the project's reliability or extensibility?

If the answer is no, the feature should be questioned before development.

The goal is not to build an AI that claims it can manage everything.

The goal is to build a believable foundation for a future in which people can say:

"Watch the parts of my life I authorize, tell me when something meaningful is going wrong, investigate it, and help me fix it—but never cross an important boundary without me."
