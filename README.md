# Deckmind

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)

<p align="center">
  <img src="assets/deckmind-icon.svg" alt="Deckmind Logo" width="96" height="96">
</p>

<h3 align="center">🤖 AI-powered development agent orchestration platform</h3>

<p align="center">
  <em>Launch, monitor, and control autonomous AI development agents with real-time terminal access and Git integration</em>
</p>

<p align="center">
  <a href="#-agent-setup">🔐 Setup</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-api-documentation">📚 API Docs</a> •
  <a href="#-contributing">🤝 Contributing</a>
</p>

---

**AI-powered development agent orchestration platform**

Deckmind is a modern web-based cockpit for launching, monitoring, and controlling multiple autonomous development agents. Each agent runs in a Docker container with full development tools, follows Git workflows, and provides real-time terminal access and code editing capabilities.

## ✨ Features

- 🚀 **Launch Agents**: Start development agents with custom instructions and repository URLs
- 🤖 **Multiple AI Models**: Support for Claude (Anthropic) and Codex (OpenAI) agents
- 📊 **Real-time Monitoring**: Track agent status, logs, and performance metrics
- 🖥️ **Interactive Terminal**: Direct terminal access to running agents via WebSocket
- 📝 **Code Editor**: Integrated file browser and code editor with syntax highlighting
- 🔄 **Git Integration**: Full Git workflow support (status, commit, push, pull)
- 🎨 **Modern UI**: Beautiful Material-UI interface with dark/light theme support
- 🐳 **Docker Native**: Containerized architecture for easy deployment
- 🔧 **Extensible**: Plugin system for custom agent types and tools

## 🏗️ Architecture

### Components

- **Frontend**: React TypeScript application with Material-UI
- **Backend**: Node.js Express API server
- **Agent Runtime**: Ubuntu-based Docker containers with development tools
- **AI Models**: Support for Claude (Anthropic) and Codex (OpenAI) agents
- **Database**: File-based storage (easily replaceable with any database)

### System Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│   Express API   │────│   Docker Engine │
│   (React App)   │    │   (Node.js)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  File Browser   │    │   Agent Mgmt    │    │   Agent         │
│  Code Editor    │    │   Workspaces    │    │   Containers    │
│  Git Controls   │    │   Projects      │    │   (Ubuntu + AI) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Agent Setup

Before building the agent Docker images, you need to configure the authentication credentials for each AI provider.

### Claude Agent Setup

1. **Copy Claude credentials:**
   ```bash
   # Copy your Claude configuration from your home directory
   cp ~/.claude.json claude-agent/home/
   cp -r ~/.claude claude-agent/home/
   ```

2. **Configure Git:**
   ```bash
   # Edit the Git configuration
   nano claude-agent/home/.gitconfig
   ```
   Add your Git user information:
   ```ini
   [user]
       name = Your Full Name
       email = your.email@example.com
   ```

### Codex Agent Setup

1. **Copy Codex credentials:**
   ```bash
   # Copy your Codex authentication file
   mkdir codex-agent/home/.codex/
   cp ~/.codex/auth.json codex-agent/home/.codex/auth.json
   ```

2. **Configure Git:**
   ```bash
   # Create Git configuration
   nano codex-agent/home/.gitconfig
   ```
   Add your Git user information:
   ```ini
   [user]
       name = Your Full Name
       email = your.email@example.com
   ```

### Important Notes

- **Security:** Never commit these credential files to version control
- **Permissions:** Ensure the files are readable by the Docker build process
- **Updates:** Rebuild Docker images after updating credentials
- **Multiple Users:** Each user should set up their own credentials

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git
- Internet connection (for AI model access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mwhesse/deckmind.git
   cd deckmind
   ```

2. **Configure environment**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env

   # Edit with your API keys
   nano server/.env
   ```

3. **Build and run**
   ```bash
   # Build agent Docker image
   docker build -t deckmind/agent:latest ./claude-agent

   # Install server dependencies
   cd server && npm install

   # Start the application
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:8088
   ```

### Docker Compose (Recommended)

```bash
# Build and start everything
docker compose up --build

# Or run in background
docker compose up -d --build
```

## 📖 Usage

### Launching an Agent

1. Select a project from the dropdown (or enter a Git repository URL)
2. Choose an agent type: **Claude** (Anthropic) or **Codex** (OpenAI)
3. Enter a branch slug (e.g., `add-user-auth`)
4. Provide instructions for the agent
5. Click "Launch Agent"

### Working with Agents

- **Terminal Access**: Click on any running agent to open the workspace
- **File Browser**: Navigate through the project files in the left panel
- **Code Editor**: Click on files to edit them with syntax highlighting
- **Git Operations**: Use the Git panel to commit and push changes
- **Stop Agent**: Use the stop button to terminate an agent

### Example Instructions

```
Implement user authentication with JWT tokens:
1. Create login/register API endpoints
2. Add password hashing with bcrypt
3. Implement JWT token generation and validation
4. Add authentication middleware
5. Create protected routes
6. Add logout functionality
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8088` |
| `AGENT_IMAGE` | Docker image for agents | `deckmind/agent:latest` |
| `DEFAULT_AGENT_PORT` | Internal port for agents | `8080` |
| `PROJECTS_ROOT` | Local projects directory | `/host/projects` |
| `WORKSPACES_DIR` | Agent workspaces directory | `/host/workspaces` |
| `ANTHROPIC_API_KEY` | Claude API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |

### Agent Configuration

Agents are configured through environment variables passed to containers:

- `AGENT_INSTRUCTIONS`: Task description for the agent
- `AGENT_ID`: Unique identifier for the agent
- `FEATURE_BRANCH`: Git branch to work on
- `GIT_USERNAME`: Git user name for commits
- `GIT_EMAIL`: Git email for commits

## 🔌 API Documentation

### Agents Endpoints

#### GET `/api/agents`
List all agents
```json
[
  {
    "id": "abc123",
    "name": "deckmind-add-user-auth-abc123",
    "state": "running",
    "status": "Up 5 minutes",
    "agentId": "abc123",
    "agentType": "claude",
    "repoUrl": "/path/to/project",
    "branchSlug": "add-user-auth",
    "port": null
  }
]
```

#### POST `/api/agents`
Launch new agent
```json
{
  "repoUrl": "/path/to/project",
  "branchSlug": "feature-name",
  "agentType": "claude",
  "instructions": "Implement user authentication..."
}
```

**Parameters:**
- `repoUrl` (string, required): Path to the Git repository
- `branchSlug` (string, required): Slug for the feature branch
- `agentType` (string, optional): "claude" or "codex" (default: "claude")
- `instructions` (string, optional): Task description for the agent

#### GET `/api/agents/:id`
Get agent details

#### DELETE `/api/agents/:id`
Stop agent

#### GET `/api/agents/:id/logs`
Get agent logs

### Projects Endpoints

#### GET `/api/projects`
List available projects
```json
{
  "projects": [
    "/path/to/project1",
    "/path/to/project2"
  ]
}
```

### Workspaces Endpoints

#### GET `/api/workspaces/:agentId/tree`
Get file tree for agent workspace

#### GET `/api/workspaces/:agentId/file`
Get file contents

#### PUT `/api/workspaces/:agentId/file`
Update file contents

#### POST `/api/workspaces/:agentId/git/commit`
Commit changes

#### POST `/api/workspaces/:agentId/git/push`
Push changes

## 🛠️ Development

### Project Structure

```
deckmind/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── types/          # TypeScript types
│   └── public/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Express middleware
│   └── public/             # Static files
├── claude-agent/           # Docker agent image
│   ├── Dockerfile
│   └── scripts/
└── docker-compose.yml
```

### Running in Development

```bash
# Terminal 1: Start the React development server
cd client && npm start

# Terminal 2: Start the Node.js development server
cd server && npm run dev

# Terminal 3: Build agent image (if needed)
docker build -t deckmind/agent:latest ./claude-agent
```

### Building for Production

```bash
# Build and run everything with Docker Compose
docker compose up --build

# Or build individual components:
# Build React app
cd client && npm run build

# Build server with client included
docker build -t deckmind/server:latest .

# Build agent image
docker build -t deckmind/agent:latest ./claude-agent
```

### Production Deployment

The production setup uses a unified Docker container that includes both the built React client and the Node.js server:

```bash
# Quick start with Docker Compose
docker compose up --build

# Or build and run manually
docker build -t deckmind/server:latest .
docker run -p 8088:8088 --env-file server/.env deckmind/server:latest

# Access the application at http://localhost:8088
```

**Container Architecture:**
- **Multi-stage build**: Separate build stages for client and server optimization
- **Security**: Non-root user execution with dedicated deckmind user
- **Health checks**: Built-in health monitoring at `/api/health`
- **Single container**: Client and server packaged together for simplicity
- **Optimized build**: .dockerignore reduces build context from 372MB to ~4KB
- **Production ready**: TypeScript compilation and minified assets

**Build Output:**
- Client bundle: 223.45 kB (gzipped)
- CSS bundle: 931 B (gzipped)
- Total image size: ~250MB (includes Node.js runtime and dependencies)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/deckmind.git`
3. Install dependencies: `npm install` (in both client and server directories)
4. Start development servers: `npm run dev`
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use conventional commits
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [OpenAI](https://openai.com) for GPT models
- [Docker](https://docker.com) for containerization
- [Material-UI](https://mui.com) for the UI framework

## 📞 Support

- 🐛 [Issue Tracker](https://github.com/mwhesse/deckmind/issues)
- 💬 [Discussions](https://github.com/mwhesse/deckmind/discussions)

---

**Deckmind** - Revolutionizing development workflows with AI-powered agents.

Key Concepts
- Agent parameters: repo URL and instructions (string). More params can be added (env, branch, tools).
- Identification: containers labeled with `com.deckmind.cockpit=true` and `com.deckmind.agentId`.
- Ports: each agent exposes 8080 internally; the server reports the published host port.

Quick Start
1) Prereqs: Docker, Node 18+, and internet access to build images.
2) Configure API keys: copy `server/.env.example` to `server/.env` and set keys.
3) Install server deps: `cd server && npm install`.
4) Build agent image: `docker build -t deckmind/agent:latest ./claude-agent`.
5) Run server: `npm start` then open http://localhost:8088.

Docker Compose (optional)
- See `docker-compose.yml` to run the server with a single command: `docker compose up --build`.

Security & Secrets
- Provide `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` via server `.env` or per-agent env vars.
- Git settings can be passed via `GIT_USERNAME`, `GIT_EMAIL`.
- API keys are encrypted and securely stored.

Extensibility
- Add more agent params by extending `server/src/routes/agents.js` and reading them in the agent container.
- Modern React-based UI with plugin system for custom extensions.
- Support for multiple AI models and custom agent templates.

Features
- Real-time terminal access to agents
- Integrated code editor with syntax highlighting
- Git workflow management (status, commit, push)
- Agent monitoring and analytics dashboard
- Collaboration features for team development
- Plugin system for extensibility

Notes
- Building the agent image downloads packages from apt/pip; ensure network access.
- The cockpit lists and manages only containers labeled as Deckmind agents.

