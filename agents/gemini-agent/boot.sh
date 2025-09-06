#!/bin/sh
set -euo pipefail

# Ensure agent home has the right permissions
chown -R agent:agent /home/agent

# Ensure workspace exists and is writable by non-root user
mkdir -p /workspace /workspace/repo || true

# Try to chown; on some hosts (e.g., Docker Desktop) this may be a no-op but is harmless
if getent passwd agent >/dev/null 2>&1; then
  chown -R agent:agent /workspace || true
  # chown -R agent:agent /home/agent/.npm || true
fi

# Exec the real entrypoint as the non-root user
exec su-exec agent /usr/local/bin/agent-entrypoint.sh

