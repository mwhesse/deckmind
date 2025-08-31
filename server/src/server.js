import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import dotenv from 'dotenv';
import agentsRouter from './routes/agents.js';
import { attachTerminalServer } from './terminal.js';
import workspacesRouter from './routes/workspaces.js';
import projectsRouter from './routes/projects.js';
import templatesRouter from './routes/templates.js';
import { createDocker } from './docker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/agents', agentsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Catch-all handler: send back index.html for client-side routing
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(publicDir, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

const port = Number(process.env.PORT || 8088);
const server = http.createServer(app);
attachTerminalServer(server);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Deckmind server listening on http://localhost:${port}`);
});

// Scan for existing containers labeled as Deckmind agents on startup
const docker = createDocker();
async function scanExistingAgents() {
  try {
    const list = await docker.listContainers({ all: true, filters: { label: ['com.deckmind.cockpit=true'] } });
    const summaries = list.map((c) => {
      const labels = c.Labels || {};
      const ports = c.Ports || [];
      return {
        id: c.Id.substring(0, 12),
        name: c.Names?.[0]?.replace(/\//, '') || '',
        state: c.State,
        status: c.Status,
        agentId: labels['com.deckmind.agentId'] || '',
      };
    });
    // Stash for potential diagnostics
    app.locals.knownAgents = summaries;
    // eslint-disable-next-line no-console
    console.log(`Startup scan: found ${summaries.length} Deckmind container(s).`);
    summaries.forEach(s => {
      // eslint-disable-next-line no-console
      console.log(` - ${s.name || s.id} [agentId=${s.agentId}] state=${s.state} port=${s.port ?? '-'} `);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Startup scan failed:', e?.message || e);
  }
}
scanExistingAgents();
