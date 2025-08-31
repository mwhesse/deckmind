FROM node:22-alpine

ENV AGENT_PORT=8080

# Minimal tools: Git (repo ops), curl/jq (handy), bash (for entrypoint)
RUN apk add --no-cache git curl jq bash nano tmux tini shadow util-linux expect tcl su-exec && \
    node -v && npm -v && git --version

WORKDIR /app

# Create non-root user to run Claude safely (auto UID/GID) with a valid shell
RUN addgroup -S agent \
 && adduser -S -G agent -h /home/agent -s /bin/sh agent \
 && mkdir -p /home/agent \
 && chown -R agent:agent /home/agent
ENV HOME=/home/agent

# Copy authentication files for non-root user (optional)
# COPY home/ /home/agent/
COPY home/.gitconfig /home/agent/.gitconfig
COPY home/.claude.json /home/agent/.claude.json
COPY home/.claude/ /home/agent/.claude/
RUN chown -R agent:agent /home/agent

# Install Claude Code globally within the container
RUN npm install -g @anthropic-ai/claude-code

# Workspace for checked out repos and INSTRUCTIONS.md
RUN mkdir -p /workspace && chown -R root:root /workspace
VOLUME ["/workspace"]

# Copy signal-aware entrypoint and use tini as PID 1 to forward signals
COPY entrypoint.sh /usr/local/bin/agent-entrypoint.sh
RUN chmod +x /usr/local/bin/agent-entrypoint.sh && chown agent:agent /usr/local/bin/agent-entrypoint.sh

# Expect script to bootstrap Claude with instructions, then hand over control
COPY run-claude.expect /usr/local/bin/run-claude.expect
RUN chmod +x /usr/local/bin/run-claude.expect && chown agent:agent /usr/local/bin/run-claude.expect

# Bootstrap as root to fix workspace perms, then drop to agent
COPY boot.sh /usr/local/bin/boot.sh
RUN chmod +x /usr/local/bin/boot.sh

# Fix npm permissions
RUN chown -R agent:agent /home/agent/.npm

USER root
ENTRYPOINT ["/sbin/tini", "-g", "--", "/usr/local/bin/boot.sh"]
