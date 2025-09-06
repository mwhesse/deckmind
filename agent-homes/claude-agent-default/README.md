# Claude Agent Home Directory

This directory contains configuration files for the Claude CLI agent used in the DevAgent project.

## Description

The Claude agent home provides the necessary configuration for running Claude-based AI agents in a containerized environment. It includes authentication credentials and Git configuration for seamless operation.

## Prerequisites

- Valid Claude API credentials (OAuth tokens)
- Docker environment for building and running the agent
- Git repository access for the agent's operations

## Required Files

### .claude.json
Your Claude API authentication file containing valid OAuth tokens. Copy this from your home directory.

### .gitconfig
Git configuration for commits and operations performed by the agent:

```ini
[user]
    name = Your Full Name
    email = your.email@example.com
```

## Setup Instructions

1. **Copy credentials**: Copy `.claude.json` with valid OAuth tokens from your home directory to this folder
2. **Clean projects**: Remove existing projects from `.claude.json` and delete project directories under `./claude/projects`
3. **Configure Git**: Add `.gitconfig` with your Git identity for agent commits
4. **Build the agent image**:
   ```bash
   docker-compose build claude-agent
   ```

## Usage

Once configured, the agent can be used through the DevAgent platform for AI-assisted development tasks.

## Security Note

Never commit credential files (`.claude.json`) to version control. These files contain sensitive authentication information and are automatically excluded by `.gitignore`.