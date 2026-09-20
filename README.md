# LifeGuard AI — Autonomous Personal Sentinel & Schedule Protection Engine

LifeGuard AI is an autonomous, proactive personal sentinel connected to Google Workspace (Gmail, Google Calendar, Google Tasks) and AWS Bedrock Mantle / TrueForge. 

Unlike standard chatbots that sit idle waiting for commands, LifeGuard continuously monitors authorized workspace channels to detect travel delays, financial EMI deadlines, schedule overlaps, and incoming emails. It extracts date/time commitments, evaluates calendar conflicts against live events, automatically reschedules overlapping slots, dispatches polite auto-responses, and updates Google Calendar—all while preserving strict Human-in-the-Loop approval for consequential actions.

---

## Problem Statement & Target User

### Problem
Modern professionals face overwhelming inbox clutter, missed travel logistics, late payment penalties, and double-booked calendar meetings. Existing calendar tools lack context-aware AI intelligence to read email text, detect overlaps against existing bookings, politely negotiate rescheduled timings with senders, and update Google Calendar automatically.

### Target User
Busy professionals, software engineers, recruiters, students, and executives who need an autonomous personal assistant to manage inbox inquiries, calculate focus preparation blocks, eliminate double-booking, and protect their calendar schedule 24/7.

---

## What Was Built During First Commit (Sep 17–20)

- **Autonomous Email Date/Time Parsing & Calendar Overlap Sentinel**:
  - Dynamic extraction of event dates (e.g. September 24) and time slots (e.g. 2:00 PM IST) from email text.
  - Live overlap detection against Google Calendar events.
  - Automatic deletion of original conflicting events to eliminate double-booking.
  - Automatic calculation of alternate non-conflicting slots (e.g. 4:30 PM IST).
  - Autonomous dispatch of polite reschedule/confirmation email replies via Gmail API.
  - Automated booking of confirmed rescheduled events in Google Calendar.

- **AI Executive Inbox & Key Event Timing Display**:
  - Prominent visual pill badges rendering extracted key event timings directly inside email cards.
  - Categorization across Work/Career, Financial Statements, and General emails.

- **60 FPS Hardware-Accelerated Glassmorphic Interface**:
  - Smooth composite scrolling for workspace panes and custom dark-mode scrollbars.
  - Responsive layout for calendar cards and delete button bounds.

- **Human-in-the-Loop Approval System**:
  - Real-time SSE streaming of agent status, risk detection, and consequential action proposals.
  - 1-click human authorization (`Allow & Execute` / `Reject`).

---

## Architecture & Component Overview

```
┌────────────────────────────────────────────────────────┐
│               React Frontend Dashboard (Vite)          │
│   (Live Inbox, Google Calendar, SSE Event Stream, UI)  │
└───────────▲──────────────────────────────────┬─────────┘
            │ Real-time SSE Broadcast          │ REST API / Approvals
┌───────────┴──────────────────────────────────▼─────────┐
│               Express Backend (Node.js/TS)             │
│   (Schedule Evaluator, Gmail & Calendar Integration)   │
└───────────▲──────────────────────────────────┬─────────┘
            │ OpenAI-Compatible API            │ AWS Bedrock SDK
┌───────────┴──────────────────────────────────▼─────────┐
│              AWS Bedrock Mantle / Runtime              │
│    (Claude 3.5 Sonnet / OpenAI GPT-OSS-120B Engine)    │
└────────────────────────────────────────────────────────┘
```

### Components
1. **`packages/frontend`**: Glassmorphic React (Vite) dashboard displaying active risks, Gmail messages, Google Calendar events, and AI reasoning.
2. **`packages/backend`**: Express server on port `3002` managing SQLite database records, SSE streaming, Google OAuth 2.0 token management, Gmail API delivery, and Google Calendar API synchronization.
3. **`packages/mcp-server`**: Custom Model Context Protocol (MCP) server running on port `3001` exposing mock signal integrations.
4. **`packages/desktop`**: Electron desktop application wrapper for native OS notifications.

---

## AWS Services & Tools Used

- **AWS Bedrock Mantle**: OpenAI-compatible serverless AI inference endpoint for multi-agent reasoning, risk categorization, and tool call generation.
- **AWS Bedrock Runtime SDK**: `@aws-sdk/client-bedrock-runtime` for fallback inference using Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20240620-v1:0`).

---

## Setup & Run Instructions

### Prerequisites
- Node.js v20 or newer
- Google Cloud Console OAuth 2.0 Client ID & Secret (with Gmail API & Google Calendar API scopes enabled)
- AWS Bedrock Bearer Token or API credentials

### 1. Installation
```bash
git clone https://github.com/Hitarth-cpu/lifeguard-ai.git
cd lifeguard-ai
npm install
```

### 2. Environment Configuration
Create a `.env` file in `packages/backend/.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback

AWS_BEARER_TOKEN_BEDROCK=your_aws_bedrock_bearer_token
OPENAI_API_KEY=your_aws_bedrock_bearer_token
OPENAI_BASE_URL=https://bedrock-mantle.us-east-1.api.aws/v1
BEDROCK_MODEL_ID=openai.gpt-oss-120b

AWS_REGION=us-east-1
PORT=3002
FRONTEND_URL=http://localhost:5173
```

### 3. Build & Run locally
```bash
# Build all monorepo packages
npm run build

# Start backend server & frontend dev dashboard concurrently
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## AI Tools Used

- **Antigravity (Google DeepMind AI Coding Assistant)**: Used for architecture design, monorepo refactoring, TypeScript type safety, CSS hardware acceleration, and dynamic date/time regex parser development.

---

## Third-Party Credits & Licences

- **Express**: MIT License
- **React**: MIT License
- **Vite**: MIT License
- **AWS SDK for JavaScript (`@aws-sdk/client-bedrock-runtime`)**: Apache 2.0 License
- **OpenAI Node SDK**: Apache 2.0 License
- **SQLite3 / `sqlite`**: MIT License

---

## Limitations & Future Roadmap

- Currently requires Google OAuth authorization for live Gmail and Google Calendar access; offline/demo mode simulates responses when unauthenticated.
- Future roadmap includes multi-calendar support (Outlook/Apple Calendar) and WhatsApp notification integration.

---

## Demo Video & Repository Links

- **GitHub Repository**: [https://github.com/Hitarth-cpu/lifeguard-ai](https://github.com/Hitarth-cpu/lifeguard-ai)
- **Demo Video**: [https://youtu.be/cg4CR_BggXY](https://youtu.be/cg4CR_BggXY)
