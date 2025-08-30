DevAgent Cockpit

Overview
- Web-based cockpit to launch, monitor, and control multiple autonomous dev agents running as Docker containers.
- Each agent boots with a repo and instructions, has web dev tools, follows Git workflows, and exposes a lightweight HTTP API for inspection.

Architecture
- Server: Node.js (Express) API orchestrates Docker (via Dockerode) and serves a minimal web UI.
- Agent Image: Ubuntu-based container with Git, Node.js, Python, and clients for Claude (Anthropic) and Codex/OpenAI pre-installed. An agent runtime (Flask) clones the repo, initializes a branch, and exposes status endpoints.
- UI: Single-page app (vanilla JS) shows agents, statuses, logs, and a form to start new agents.

Key Concepts
- Agent parameters: repo URL and instructions (string). More params can be added (env, branch, tools).
- Identification: containers labeled with `com.devagent.cockpit=true` and `com.devagent.agentId`.
- Ports: each agent exposes 8080 internally; the server reports the published host port.

Quick Start
1) Prereqs: Docker, Node 18+, and internet access to build images.
2) Configure API keys: copy `server/.env.example` to `server/.env` and set keys.
3) Install server deps: `cd server && npm install`.
4) Build agent image: `docker build -t devagent/agent:latest ./agent`.
5) Run server: `npm start` then open http://localhost:8088.

Docker Compose (optional)
- See `docker-compose.yml` to run the server with a single command: `docker compose up --build`.

Security & Secrets
- Provide `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` via server `.env` or per-agent env vars.
- Git settings can be passed via `GIT_USERNAME`, `GIT_EMAIL`.

Extensibility
- Add more agent params by extending `server/src/routes/agents.js` and reading them in `agent/main.py`.
- Swap the UI with a React frontend later; the API is stable.

Notes
- Building the agent image downloads packages from apt/pip; ensure network access.
- The cockpit lists and manages only containers labeled as DevAgent agents.

