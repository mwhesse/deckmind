# Gemini Agent Home Directory

This directory contains configuration files for the Gemini CLI agent.

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
   docker build -t deckmind/gemini-agent:latest ./agents/gemini-agent
   ```

## Security Note

Never commit these credential files to version control. They are automatically excluded by .gitignore.