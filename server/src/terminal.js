import { WebSocketServer } from 'ws';
import { createDocker } from './docker.js';

export function attachTerminalServer(httpServer) {
  const docker = createDocker();
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname !== '/api/agents/terminal') return socket.destroy();
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, url.searchParams);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, params) => {
    const id = params.get('id');
    const cols = Number(params.get('cols') || '80');
    const rows = Number(params.get('rows') || '24');
    if (!id) {
      ws.close(1008, 'id required');
      return;
    }
    try {
      const container = docker.getContainer(id);
      // Attach to existing tmux session or create one (detached) running Claude, then attach
      // Ensures we don't end up in a plain shell if the session doesn't exist yet
      const cmd = [
        '/bin/sh',
        '-lc',
        'su-exec agent tmux has-session -t agent 2>/dev/null || su-exec agent tmux new-session -d -s agent -c /workspace/repo "/usr/local/bin/run-claude.expect"; su-exec agent tmux set -gq aggressive-resize on; su-exec agent tmux set -gq mouse on; su-exec agent tmux set -gq status off; su-exec agent tmux attach -t agent',
      ];
      const exec = await container.exec({
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: true,
        Tty: true,
        Cmd: cmd,
      });
      const stream = await exec.start({ hijack: true, Tty: true });

      // Initial resize (best-effort)
      await exec.resize({ h: rows, w: cols }).catch(() => {});

      // Pipe container -> ws
      stream.on('data', (chunk) => {
        try { ws.send(chunk); } catch { /* ignore */ }
      });

      // Pipe ws -> container
      ws.on('message', async (raw, isBinary) => {
        try {
          // Interpret all text frames as JSON control messages
          if (!isBinary) {
            const text = (typeof raw === 'string') ? raw : raw.toString('utf8');
            try {
              const m = JSON.parse(text);
              if (m && m.type === 'resize' && m.cols && m.rows) {
                await exec.resize({ w: Number(m.cols), h: Number(m.rows) }).catch(() => {});
                return;
              }
              if (m && m.type === 'input' && typeof m.data === 'string') {
                stream.write(m.data);
                return;
              }
            } catch {
              // If parsing fails, ignore (avoid echoing JSON into the shell)
              return;
            }
            return;
          }
          // Binary data (not expected from browser) -> pass through
          stream.write(raw);
        } catch {
          /* ignore */
        }
      });

      const cleanup = () => {
        try { stream.end(); } catch {}
        try { ws.close(); } catch {}
      };
      ws.on('close', cleanup);
      stream.on('end', cleanup);
      stream.on('error', cleanup);
    } catch (e) {
      try { ws.close(1011, String(e?.message || e)); } catch { /* ignore */ }
    }
  });

  return wss;
}
