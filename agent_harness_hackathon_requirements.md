# The Agent Harness Hackathon

## Give AI models a License to Act

You get an agent working in an afternoon. Then you point it at something that matters and it can't reach your tools, can't run its own code safely, and can't be stopped before it does damage. Build one that can do all three, on TrueForge, TrueFoundry's open-source agent harness, and ship it the way you would at work: every change through a pull request, reviewed by Qodo before it merges.

---

# Points to Keep in Mind Throughout Project Development

The following requirements and tracks should actively guide the project from the beginning. The goal is not simply to build an agent, but to ensure that the final project clearly demonstrates the capabilities of TrueForge, follows a professional development workflow, provides a usable interface, and documents the work effectively.

## Best Use of TrueForge

For the agent that gets the most out of the harness:

- Real tools connected through MCP.
- Generated code running in a sandbox.
- A pause for human approval before anything irreversible.
- Work handed to subagents.
- A session that holds together across reconnects.
- Any domain and any use case are allowed.
- What matters is that the harness is doing the work rather than sitting underneath a thin wrapper.

## Best Code Quality

For the team that treats a hackathon repository like real software:

- Every submission works through pull requests reviewed by Qodo.
- This track goes to the team that used Qodo best.
- Set it up on day one.
- Deal with what Qodo finds before merging.
- Ship something a stranger could clone, understand, and extend.
- Judges read the review trail.

## Best UI

For the team whose agent is something a stranger could pick up and drive:

- Create an interface that clearly shows what the agent is doing.
- Show what the agent is waiting on.
- Show what the agent has already done.
- Ask for approval before the irreversible step, rather than after it.
- The UI is judged based on both the demo video and the running project, not just a screenshot.

## Best Blog Post

Write up what was built, including:

- The job given to the agent.
- How the agent was wired up.
- What TrueForge handled.
- What broke along the way.
- Screenshots where useful.
- A demo clip where useful.

Publish it anywhere and add the link to the final submission.

## Top 10 Social Posts

Share what is being built while building it, for example:

- A clip of the agent working.
- Something surprising discovered during development.
- A bug that took an hour to solve.
- Interesting development progress.

Tag **WeMakeDevs**, **TrueFoundry**, and **Qodo** so the posts can be found.

---

# 02 / The Challenge

> A chatbot answers questions. An agent acts on them.

## Code Review

### Every Pull Request Goes Through Qodo

Code review is part of the build.

Every submission, whether solo or team-based, runs its substantive changes through a GitHub pull request reviewed by Qodo before merge.

Direct pushes to `main` do **not** count as reviewed work.

### 01 — Set It Up Once Per Team

One team member with admin access to the repository:

1. Signs in to Qodo.
2. Opens **Integrations > SaaS > GitHub > Add installation**.
3. Authorises Qodo for the hackathon repository.
4. Opens a pull request.

Qodo should start automatically. If it does not, comment the following on the PR:

```text
/agentic_review
```

Additional points:

- One installation covers the whole team.
- Teammates do not need individual Qodo accounts.
- The 14-day trial requires no card.
- Setting it up at kickoff covers the hackathon week.

### 02 — Run Every Substantive Merge Through It

The expected workflow is:

**Branch → Pull Request → Qodo Review → Team Decision → Follow-up Review → Human Merge**

Requirements:

- Fix every valid **High-severity** finding.
- If a High finding is wrong, deferred, or intentional, dismiss it in the Qodo thread and record the reason.
- Medium and Low findings are an engineering decision for the team.
- After making changes, push the updates and run the review again.
- The PR should record what was resolved or intentionally dismissed.
- Qodo supports the review process, but the team still owns the final merge decision.

### How a Review Is Triggered

Open a pull request and Qodo should review it automatically. If it does not, use:

```text
/agentic_review
```

### 03 — Put the Proof in Your README

Add the following section to the public README:

```md
## Qodo Code Review Evidence
```

This section must include:

- A link to at least one representative merged PR containing meaningful hackathon code.
- One or two sentences explaining what Qodo surfaced.
- What was changed or intentionally dismissed.
- PR history showing:
  - The completed review.
  - The team's decisions.
  - A follow-up review against the final code.

The **public pull request link is the required evidence**.

Screenshots may add context, but they **cannot replace the PR link**.

Judges may inspect other substantive merges to confirm that Qodo review was part of the development process rather than a one-time submission step.

---

# 03 / Tools

## The Harness, the Reviewer, and the Credits

TrueFoundry builds the harness every submission runs on.

Qodo reviews the code written around it.

OpenAI covers the experiments in the room.

---

## TrueFoundry

**Main sponsor · Agent harness**

TrueFoundry builds the infrastructure companies use to run AI in production, across any model and any cloud, in their own environment.

TrueForge is its open-source agent harness:

- It is the runtime layer around a model that turns it into a working agent.
- It is the foundation that every submission this week runs on.

TrueForge can be driven in three ways:

1. A chat UI.
2. An HTTP API.
3. A TypeScript library.

Additional points:

- Open source.
- No account required.

### What the Harness Handles for You

The hackathon emphasizes that the harness should visibly perform the core agent infrastructure work rather than simply sit beneath a thin model wrapper.

The broader production stack can also include TrueFoundry's:

- AI Gateway.
- MCP Gateway.

Once an agent is running for real users, these can help answer:

- What it costs.
- What it did.
- What it is allowed to touch.

Neither is required for this hackathon.

---

## Qodo

**Main sponsor · Code review**

Qodo is an AI code review platform used by engineering teams at:

- NVIDIA.
- Intel.
- Walmart.
- Intuit.

Instead of reading only the lines changed, its review agents build an understanding of:

- The whole repository.
- Its structure.
- Its dependencies.
- Its history.

It then uses that context to judge whether a change is actually safe.

Qodo works:

- In VS Code.
- In JetBrains.
- On pull requests through GitHub.
- From the command line.

It supports all major languages.

It is free for open-source projects.

### What It Does on a Pull Request

The goal is to avoid accumulating the kind of mess that makes a repository unreadable.

An open-source project only gets picked up if it is worth picking up.

That is what the **Best Code Quality** track rewards.

---

# 04 / Getting Started

## One Command, and the Harness Is Running

No account, nothing to clone, and no agent experience needed.

This is the whole of day one.

## Start the Harness

### Standalone

```bash
npx @truefoundry/trueforge
```

One command, nothing to clone.

This is the recommended quick-start option.

### Production Ready

```bash
git clone git@github.com:truefoundry/trueforge.git
cd trueforge && docker compose up
```

This runs the whole stack under Docker Compose and is intended for situations where the agent is doing real work.

---

## Two Things Turn a Running Harness Into an Agent

A running harness becomes an agent when it has:

1. A model to think with.
2. Tools it is allowed to reach.

Key next steps:

- Connect a model.
- Configure MCP servers.
- Read the documentation.

Without tools, an agent can talk, but it cannot meaningfully act.

---

# Your First Hour

## 01 — Register

Free, one form, about a minute.

Registration is how the stream link and submission form reach participants.

**Register now**

## 02 — Start the Harness

One command.

Nothing to clone.

No account required.

Both startup methods are listed above.

## 03 — Give It a Model and Tools

The agent needs:

- A model to think with.
- MCP servers containing the tools it is allowed to reach.

Without the second one, it can talk but not act.

**Connect a model and MCP servers**

## 04 — Set Up Qodo

This is required for **every submission**, not only for teams targeting the Best Code Quality track.

One teammate with admin access to the repository should:

1. Sign in to Qodo.
2. Connect GitHub.
3. Open a pull request.

From that point onward:

- Every substantive change should go through a reviewed pull request.
- The README should link to at least one representative reviewed PR.

**Sign in to Qodo**

---

## Stuck?

Every video, document, and example is available on one resources page.

Additional support options:

- Open the resources page.
- Ask in the WeMakeDevs Discord.
- Open an issue on TrueForge.

---

# What Every Submission Needs

Every submission must include all of the following:

- An agent running on TrueForge.
- The harness visibly doing the work.
- A real tool reached through the agent.
- Code run in a sandbox.
- A pause before anything irreversible.
- Qodo set up at the start of development.
- Pull requests reviewed by Qodo.
- A **Qodo Code Review Evidence** section in the README linking to at least one reviewed PR.
- Only tools, data, and accounts that the team owns or is authorized to connect.
- API keys, secrets, and personal data kept out of the repository and demo video.
- A public repository.
- A README that a stranger can follow.
- A demo of approximately three minutes showing the agent working.

---

# 07 / Judging

## What the Judges Are Looking For

There are **six criteria**, and they are **weighted equally**.

The demo is scored as hard as the code.

The project must therefore be developed with all six criteria in mind from the beginning.

---

## 01 — Potential Impact

**Question:** Does the agent do a clear, useful job that someone would actually hand over?

### Development Requirement

The project should solve a meaningful and understandable problem.

The agent should perform a real job rather than simply demonstrate AI conversation.

The use case should make it obvious why an autonomous or semi-autonomous agent is useful.

---

## 02 — Creativity and Originality

**Question:** Is this an inventive job to give an agent, or an inventive way of doing it?

### Development Requirement

The project should include a genuinely interesting use case, workflow, interaction model, or technical approach.

Originality can come from:

- The job assigned to the agent.
- The combination of tools.
- The workflow used by the agent.
- The way human approval is integrated.
- The way subagents collaborate.
- The way the user interacts with the agent.

---

## 03 — Technical Excellence

**Question:** Is the implementation complete, reliable, and well structured?

### Development Requirement

The implementation should be:

- Complete enough to demonstrate the full workflow.
- Reliable during the demo.
- Well structured.
- Easy to understand.
- Easy for another developer to extend.
- Documented clearly.
- Developed using meaningful pull requests and code reviews.

The project should avoid being a prototype that only works under one exact condition.

---

## 04 — Use of Sponsor Tools

**Question:** Is TrueForge central to the project rather than a thin wrapper around a model, and did Qodo review the pull requests on the way there?

### Development Requirement

TrueForge must be central to the architecture.

The project should visibly demonstrate the harness doing meaningful work, including as many relevant capabilities as possible:

- Real tools connected through MCP.
- Generated code running safely in a sandbox.
- Human approval before irreversible actions.
- Work delegated to subagents.
- Sessions that persist across reconnects.

Qodo must also be integrated into the development workflow:

- Set up from the beginning.
- Used for substantive pull requests.
- Findings reviewed and addressed or intentionally dismissed with reasons.
- Follow-up reviews performed after changes.
- Evidence linked in the README.

The project must **not** simply use TrueForge as a thin wrapper around a single model call.

---

## 05 — Control and Safety

**Question:** Does the agent run its code somewhere safe and stop for a human before anything irreversible?

### Development Requirement

This is a core architectural requirement.

The agent should:

1. Run generated or dynamic code in a safe sandboxed environment.
2. Clearly identify actions that may be irreversible or high impact.
3. Pause before performing those actions.
4. Present the action to a human for review.
5. Wait for explicit approval before continuing.

Examples of potentially irreversible actions include:

- Sending an external message.
- Deleting data.
- Publishing or posting content.
- Executing a transaction.
- Modifying important records.
- Triggering an external workflow with consequences.

The UI should make the approval state obvious and should ask **before**, not after, the action is performed.

---

## 06 — Presentation

**Question:** Does the demo clearly explain the problem, the agent working, and where the harness fits?

### Development Requirement

The approximately three-minute demo should clearly show:

1. **The problem** — what job the agent is solving.
2. **The workflow** — how the agent receives and processes the task.
3. **The agent working** — visible execution rather than only talking about it.
4. **TrueForge's role** — where the harness fits and what it is handling.
5. **Tools and MCP** — at least one real tool being reached.
6. **Sandbox execution** — generated or dynamic code running safely.
7. **Human approval** — the agent pausing before an irreversible action.
8. **The result** — what the agent successfully accomplished.

The demo should be understandable even to someone who has never seen the project before.

---

# Master Development Checklist

The following checklist should be treated as a living requirement list throughout the project.

## Core Agent and TrueForge

- [ ] Build an agent that runs on TrueForge.
- [ ] Ensure TrueForge is central to the architecture.
- [ ] Avoid using TrueForge as a thin wrapper around a model.
- [ ] Connect at least one real tool through MCP.
- [ ] Include generated or dynamic code execution in a sandbox.
- [ ] Include a clear human approval checkpoint before an irreversible action.
- [ ] Use subagents where they add meaningful value.
- [ ] Support sessions that remain coherent across reconnects where applicable.
- [ ] Make the harness visibly responsible for important parts of the workflow.

## Control and Safety

- [ ] Identify potentially irreversible actions.
- [ ] Pause before executing irreversible actions.
- [ ] Show the pending action clearly to the user.
- [ ] Require explicit human approval.
- [ ] Prevent execution until approval is received.
- [ ] Run generated or dynamic code in a safe sandbox.
- [ ] Keep secrets, API keys, and personal data out of the repository.
- [ ] Use only tools, accounts, and data that the team owns or is authorized to connect.

## Code Quality and Qodo

- [ ] Set up Qodo on day one.
- [ ] Connect Qodo to the GitHub hackathon repository.
- [ ] Use branches for substantive work.
- [ ] Create pull requests for substantive changes.
- [ ] Ensure Qodo reviews each substantive pull request before merge.
- [ ] Fix valid High-severity findings.
- [ ] Record reasons for High findings that are wrong, deferred, or intentional.
- [ ] Make engineering decisions for Medium and Low findings.
- [ ] Push fixes and run follow-up reviews.
- [ ] Ensure a human performs the final merge.
- [ ] Maintain a visible PR review history.

## README and Repository

- [ ] Keep the repository public.
- [ ] Write a README that a stranger can clone and follow.
- [ ] Explain the problem the agent solves.
- [ ] Explain the architecture.
- [ ] Explain where TrueForge fits.
- [ ] Explain the MCP tools used.
- [ ] Explain the sandbox and safety model.
- [ ] Explain the human approval workflow.
- [ ] Include setup and run instructions.
- [ ] Add a `## Qodo Code Review Evidence` section.
- [ ] Link to at least one representative merged PR containing meaningful hackathon code.
- [ ] Explain what Qodo surfaced.
- [ ] Explain what was changed or intentionally dismissed.
- [ ] Ensure the linked PR shows the review, decisions, and follow-up review against final code.

## UI

- [ ] Build an interface that a stranger can understand and use.
- [ ] Show what the agent is currently doing.
- [ ] Show what the agent is waiting on.
- [ ] Show what the agent has already done.
- [ ] Clearly show tool usage and agent progress where useful.
- [ ] Clearly show sandbox execution where useful.
- [ ] Clearly show when human approval is required.
- [ ] Ask for approval before the irreversible step.
- [ ] Make the final result easy to understand.
- [ ] Test the running UI, not just screenshots.

## Judging Criteria

### Potential Impact
- [ ] The agent performs a clear and useful job.
- [ ] The job is something a real person or organization could actually hand over.

### Creativity and Originality
- [ ] The use case or implementation approach is inventive.
- [ ] The project is more than a generic chatbot with tools.

### Technical Excellence
- [ ] The implementation is complete.
- [ ] The implementation is reliable.
- [ ] The architecture is well structured.
- [ ] The project is understandable and extensible.

### Use of Sponsor Tools
- [ ] TrueForge performs meaningful harness work.
- [ ] Real MCP tools are used.
- [ ] Sandbox execution is demonstrated.
- [ ] Human approval is demonstrated.
- [ ] Qodo reviews substantive pull requests throughout development.
- [ ] Qodo evidence is included in the README.

### Control and Safety
- [ ] Code execution happens safely.
- [ ] The agent pauses before irreversible actions.
- [ ] Human approval is required before proceeding.

### Presentation
- [ ] The demo clearly explains the problem.
- [ ] The demo shows the agent actually working.
- [ ] The demo explains where TrueForge fits.
- [ ] The demo shows the important harness capabilities.
- [ ] The demo is approximately three minutes.

## Supporting Deliverables

- [ ] Prepare a working demo of approximately three minutes.
- [ ] Record the agent actually performing its workflow.
- [ ] Show the problem, process, safety controls, and final result.
- [ ] Publish a blog post explaining what was built.
- [ ] Include the job given to the agent.
- [ ] Include how the project was wired up.
- [ ] Include what TrueForge handled.
- [ ] Include what broke and how it was addressed.
- [ ] Add screenshots where useful.
- [ ] Add a demo clip where useful.
- [ ] Add the blog post link to the submission.
- [ ] Share development progress on social media.
- [ ] Tag WeMakeDevs, TrueFoundry, and Qodo.

---

# Final Project Principle

The project should not be developed as **"a chatbot with a few tools."**

The goal is to build an agent that can **act responsibly in the real world**:

- It can reach real tools.
- It can generate and execute code safely.
- It can delegate work when appropriate.
- It can maintain a coherent session.
- It can show the user what it is doing.
- It can stop when human judgment is required.
- It can wait for approval before irreversible actions.
- It is built with TrueForge doing meaningful harness work.
- It is developed through substantive pull requests reviewed by Qodo.
- It is reliable, understandable, extendable, and demonstrable.

Throughout development, every architectural and product decision should be checked against the six equally weighted judging criteria:

1. **Potential Impact**
2. **Creativity and Originality**
3. **Technical Excellence**
4. **Use of Sponsor Tools**
5. **Control and Safety**
6. **Presentation**

A strong final submission should make it easy for a judge, developer, or stranger to answer **yes** to every one of those criteria.
