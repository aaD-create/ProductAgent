# Copilot Studio Agent – Production-ready Internal Chat UI (Web)

This project provides a **ChatGPT-like** internal web UI that talks to your **Microsoft Copilot Studio** agent using the **Bot Framework Direct Line** channel.

## Why this architecture?

- **Security**: The Direct Line **secret** never goes to the browser. The browser calls our backend to mint a **short-lived Direct Line token**.
- **Production-readiness**: Adds security headers, rate limiting, logging, and environment-based configuration.
- **Simple**: Single deployable service (Node/Express) that hosts both the UI and API.

## Prerequisites

- A Copilot Studio agent already configured with your knowledge (documents).
- Direct Line secret available for your agent (Copilot Studio settings).
- Node.js 18+ (Node 20 LTS recommended).

## 1) Configure Copilot Studio

1. Open your agent in Copilot Studio.
2. Go to **Settings → Security → Web channel security**.
3. Enable **Require secured access** and generate/copy a **Direct Line secret**.

> ⚠️ Note: Security setting changes can take time to propagate.

## 2) Run locally

```bash
cd backend
cp .env.example .env
# edit .env and set DIRECT_LINE_SECRET
npm install
npm start
```

Open: http://localhost:3000

## 3) Deploy (recommended: Azure App Service)

- Create an App Service (Linux) with Node 20.
- Set application settings:
  - `DIRECT_LINE_SECRET`
  - `DIRECT_LINE_BASE_URL` (default is global)
  - optional `ALLOWED_ORIGINS`
- Deploy this repo (zip deploy or GitHub actions).

## 4) Operations checklist

- Store `DIRECT_LINE_SECRET` in Azure Key Vault and reference it from App Service.
- Restrict inbound access:
  - IP allow list, or
  - private endpoint + internal network.
- Turn on HTTPS only.
- Monitor logs.

## Enhancements

- Add Microsoft Entra ID SSO and pass user identity to the agent.
- Add telemetry (Application Insights).

Generated: 2026-01-28
