# Gemini Agent Home Directory

This directory contains configuration files for the Google Gemini CLI agent used in the DevAgent project.

## Description

The Gemini agent home provides the necessary configuration for running Google Gemini-based AI agents in a containerized environment. It includes API credentials and Git configuration for seamless operation.

## Prerequisites

- Valid Google Gemini API key from Google AI Studio
- Google Cloud Project ID
- Docker environment for building and running the agent
- Git repository access for the agent's operations

## Required Files

### .gemini.json
Your Gemini API authentication file. This should contain:

```json
{
  "api_key": "your-gemini-api-key",
  "project_id": "your-google-cloud-project-id",
  "region": "us-central1"
}
```

### .gitconfig
Your Git configuration for commits:

```ini
[user]
    name = Your Full Name
    email = your.email@example.com
```

## Setup Instructions

1. **Get your Gemini API key** from Google AI Studio
2. **Create .gemini.json** with your API credentials
3. **Configure .gitconfig** with your Git identity
4. **Build the Docker image**:
   ```bash
   docker-compose build gemini-agent
   ```

## Usage

Once configured, the agent can be used through the DevAgent platform for AI-assisted development tasks using Google Gemini.

## Security Note

Never commit these credential files to version control. They are automatically excluded by .gitignore.