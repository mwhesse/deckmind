# Codex Agent Home Directory

This directory contains configuration files for the OpenAI Codex CLI agent used in the DevAgent project.

## Description

The Codex agent home provides the necessary configuration for running OpenAI Codex-based AI agents in a containerized environment. It includes authentication credentials and Git configuration for seamless operation.

## Prerequisites

- Valid OpenAI API credentials (OAuth tokens)
- Docker environment for building and running the agent
- Git repository access for the agent's operations

## Required Files

### .codex.json
Your OpenAI Codex API authentication file containing valid OAuth tokens. Copy this from your home directory.

For detailed authentication setup, refer to:
- [Connecting on a Headless Machine](https://github.com/openai/codex/blob/main/docs/authentication.md#connecting-on-a-headless-machine)
- [Non-Interactive / CI Mode](https://github.com/openai/codex/blob/main/docs/advanced.md#non-interactive--ci-mode)

### .gitconfig
Git configuration for commits and operations performed by the agent:

```ini
[user]
    name = Your Full Name
    email = your.email@example.com
```

## Setup Instructions

1. **Copy credentials**: Copy `.codex.json` with valid OAuth tokens from your home directory to this folder
2. **Configure Git**: Add `.gitconfig` with your Git identity for agent commits
3. **Build the agent image**:
   ```bash
   docker-compose build codex-agent
   ```

## Usage

Once configured, the agent can be used through the DevAgent platform for AI-assisted development tasks using OpenAI Codex.

## Security Note

Never commit credential files (`.codex.json`) to version control. These files contain sensitive authentication information and are automatically excluded by `.gitignore`.