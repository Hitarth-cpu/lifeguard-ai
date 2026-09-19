# AI Usage Disclosure — LifeGuard

This document records all AI tools and models utilized during the design, development, and runtime operations of LifeGuard.

---

## 1. Development & Pair-Programming Assistant

- **Tool**: Antigravity AI Coding Agent (Google Deepmind / Advanced Agentic Coding).
- **Usage**: Architecture design, pair-programming code generation, AWS CDK stack creation, unit test writing, and technical specification compliance validation.

---

## 2. Runtime Model Orchestration (AWS Cloud)

- **Provider**: Amazon Bedrock.
- **Models**:
  - `anthropic.claude-3-5-sonnet-20240620-v1:0` (Primary model for multi-dimensional deep risk reasoning and structured tool proposals).
  - `amazon.nova-pro-v1:0` / `amazon.nova-micro-v1:0` (Fallback models for lightweight email signal classification and workload capacity calculations).
- **Tool Calling API**: Amazon Bedrock Converse API (`ConverseCommand`).

---

## 3. Data Privacy & Model Safety

- **No Training on User Data**: User inbox emails and calendar data are processed strictly in-memory during observation turns and are never used to train Bedrock or external models.
- **Prompt Injection Isolation**: Email bodies are encapsulated within `<untrusted_email_data>` delimiters to enforce strict instruction isolation.
