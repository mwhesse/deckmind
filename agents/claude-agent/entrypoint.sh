#!/bin/sh
set -euo pipefail

# Start a tmux session in the repo
tmux new-session -d -s agent -c /workspace/repo


# Configure tmux for better UX and responsive resizing
tmux set -gq mouse on
tmux set -gq status off
tmux set -gq aggressive-resize on
tmux set -gq default-terminal "screen-256color"

# Start Claude via an Expect script that sends INSTRUCTIONS.md, then stays interactive
tmux send-keys -t agent:0 "/usr/local/bin/run-claude.expect" C-m

echo "[agent] Claude started in tmux session 'agent' (attach via cockpit terminal)"

# Handle termination cleanly
term() {
  echo "[agent] Stopping..."
  tmux kill-session -t agent >/dev/null 2>&1 || true
  kill -TERM "$SLEEP_PID" 2>/dev/null || true
}
trap term TERM INT

# Keep container alive for terminal access
sleep infinity &
SLEEP_PID=$!
wait "$SLEEP_PID"
