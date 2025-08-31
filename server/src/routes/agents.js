import express from 'express';
import { createDocker, agentLabels } from '../docker.js';
import path from 'node:path';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { execFile as _execFile } from 'node:child_process';

const execFile = promisify(_execFile);

const router = express.Router();
const docker = createDocker();

const AGENT_IMAGE = process.env.AGENT_IMAGE || 'deckmind/agent:latest';
const CLAUDE_AGENT_IMAGE = process.env.CLAUDE_AGENT_IMAGE || 'deckmind/claude-agent:latest';
const CODEX_AGENT_IMAGE = process.env.CODEX_AGENT_IMAGE || 'deckmind/codex-agent:latest';
const DEFAULT_AGENT_PORT = Number(process.env.DEFAULT_AGENT_PORT || '8080');
const PROJECTS_ROOT = process.env.PROJECTS_ROOT || '/host/projects';
const WORKSPACES_DIR = process.env.WORKSPACES_DIR || '/host/workspaces';
const PROJECTS_ROOT_HOST = process.env.PROJECTS_ROOT_HOST || process.env.PROJECTS_ROOT || PROJECTS_ROOT;
const WORKSPACES_DIR_HOST = process.env.WORKSPACES_DIR_HOST || process.env.WORKSPACES_DIR || WORKSPACES_DIR;

function normalizeAndValidateSource(raw) {
  if (!raw) throw new Error('repoUrl required');
  let src = String(raw).trim();
  // file:// URI
  if (src.startsWith('file://')) {
    const u = new URL(src);
    let p = decodeURIComponent(u.pathname);
    // On Windows, strip leading slash from /C:/...
    if (process.platform === 'win32' && /^[\/][A-Za-z]:/.test(p)) p = p.slice(1);
    src = p;
  }
  // Windows drive path like C:\ or C:/
  const isWinPath = /^[A-Za-z]:[\\\/]/.test(src);
  if (isWinPath && process.platform !== 'win32') {
    throw new Error('Windows-style path provided, but server is not running on Windows. Please run server on Windows or provide a local path accessible to the server host.');
  }
  // Expand ~ on POSIX
  if (src.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    src = path.join(home, src.slice(1));
  }
  // If it's not absolute after the above, treat as relative to PROJECTS_ROOT
  if (!path.isAbsolute(src) && !/^[A-Za-z]:[\\\/]/.test(src)) {
    src = path.join(PROJECTS_ROOT, src);
  }
  const absolute = path.resolve(src);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Local path does not exist: ${absolute}`);
  }
  return absolute;
}

async function cloneLocalRepo(source, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  // Use --local to clone from an existing local repo and avoid network
  // --no-hardlinks to improve portability when the source may move
  await execFile('git', ['clone', '--local', '--no-hardlinks', source, dest]);
}

async function checkoutBranch(repoPath, branch) {
  if (!branch) return;
  try {
    await execFile('git', ['-C', repoPath, 'rev-parse', '--verify', branch]);
    await execFile('git', ['-C', repoPath, 'checkout', branch]);
  } catch {
    // Branch doesn't exist locally; create it from current HEAD
    await execFile('git', ['-C', repoPath, 'checkout', '-b', branch]);
  }
}

async function ensureOriginRemote(repoPath, sourcePath) {
  try {
    await execFile('git', ['-C', repoPath, 'remote', 'get-url', 'origin']);
    // If exists, set to sourcePath to be explicit
    await execFile('git', ['-C', repoPath, 'remote', 'set-url', 'origin', sourcePath]);
  } catch {
    await execFile('git', ['-C', repoPath, 'remote', 'add', 'origin', sourcePath]);
  }
}

function toAgentSummary(containerInfo) {
  const labels = containerInfo.Labels || {};
  const ports = containerInfo.Ports || [];
  const pub = ports.find(p => p.PrivatePort === DEFAULT_AGENT_PORT);
  return {
    id: containerInfo.Id, // full ID for reliability
    shortId: containerInfo.Id.substring(0, 12),
    name: containerInfo.Names?.[0]?.replace(/\//, '') || '',
    state: containerInfo.State,
    status: containerInfo.Status,
    agentId: labels['com.deckmind.agentId'] || '',
    agentType: labels['com.deckmind.agentType'] || 'claude',
    repoUrl: labels['com.deckmind.repoUrl'] || '',
    instructionsPreview: labels['com.deckmind.instructionsPreview'] || '',
    branchSlug: labels['com.deckmind.branchSlug'] || '',
    port: pub?.PublicPort || null,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const list = await docker.listContainers({ all: true, filters: { label: ['com.deckmind.cockpit=true'] } });
    res.json(list.map(toAgentSummary));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { repoUrl, instructions, branchSlug, agentType } = req.body || {};
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

    // Determine which agent image to use
    let selectedAgentImage = AGENT_IMAGE; // default fallback
    if (agentType === 'claude') {
      selectedAgentImage = CLAUDE_AGENT_IMAGE;
    } else if (agentType === 'codex') {
      selectedAgentImage = CODEX_AGENT_IMAGE;
    }

    // Enforce local-only workflow and normalize platform-specific paths
    let localSource;
    try {
      localSource = normalizeAndValidateSource(repoUrl);
    } catch (err) {
      return res.status(400).json({ error: String(err.message || err) });
    }

    // Normalize a safe slug for naming and branch
    const normalizeSlug = (s) => {
      if (!s) return '';
      let x = String(s).trim().toLowerCase();
      if (x.startsWith('feature/')) x = x.slice('feature/'.length);
      x = x.replace(/[^a-z0-9-]+/g, '-');
      x = x.replace(/-{2,}/g, '-');
      x = x.replace(/^-+|-+$/g, '');
      return x;
    };
    const slug = normalizeSlug(branchSlug);
    if (!slug) return res.status(400).json({ error: 'branchSlug required' });
    const fullBranchName = `feature/${slug}`;

    const agentId = (Math.random().toString(36).slice(2, 10));

    // Prepare workspace paths: WORKSPACES_DIR/<agentId>/repo
    const workspacesRoot = WORKSPACES_DIR;
    const workspaceDir = path.join(workspacesRoot, agentId);
    const hostRepoPath = path.join(workspaceDir, 'repo');
    // Host-side absolute paths for Docker binds
    const workspaceDirHost = path.join(WORKSPACES_DIR_HOST, agentId);
    const hostRepoPathHost = path.join(workspaceDirHost, 'repo');

    // Clone locally from source into hostRepoPath
    await cloneLocalRepo(localSource, hostRepoPath);
    await ensureOriginRemote(hostRepoPath, localSource);
    // Write INSTRUCTIONS.md at the workspace root next to repo (write via container path)
    await fs.promises.mkdir(workspaceDir, { recursive: true });
    const instructionsPath = path.join(workspaceDir, 'INSTRUCTIONS.md');
    await fs.promises.writeFile(instructionsPath, (instructions || ''), 'utf-8');

    const labels = {
      ...agentLabels(agentId),
      'com.deckmind.repoUrl': localSource,
      'com.deckmind.instructionsPreview': (instructions || '').slice(0, 80),
      'com.deckmind.agentType': agentType || 'claude',
      ...(slug ? { 'com.deckmind.branchSlug': slug } : {}),
    };

    const env = [
      `AGENT_INSTRUCTIONS=${instructions || ''}`,
      `AGENT_ID=${agentId}`,
      `FEATURE_BRANCH=${fullBranchName}`,
      `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
      `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
      `ANTHROPIC_MODEL=${process.env.ANTHROPIC_MODEL || ''}`,
      `OPENAI_MODEL=${process.env.OPENAI_MODEL || ''}`,
      `GIT_USERNAME=${process.env.GIT_USERNAME || ''}`,
      `GIT_EMAIL=${process.env.GIT_EMAIL || ''}`,
      `AGENT_PORT=${DEFAULT_AGENT_PORT}`,
      // Inform agent where workspace is mounted (defaults to /workspace)
      `WORKSPACE_DIR=/workspace`,
    ];

    const containerName = ['deckmind', slug, agentId].filter(Boolean).join('-');

    // Prepare the branch in the workspace before launching the agent
    await checkoutBranch(hostRepoPath, fullBranchName);

    const container = await docker.createContainer({
      ...(containerName ? { name: containerName } : {}),
      Image: selectedAgentImage,
      Labels: labels,
      Env: env,
      // No ports needed; agent runs AI CLI and exits
      HostConfig: {
        // Mount the entire workspace at /workspace so agent sees /workspace and /workspace/repo
        Binds: [
          `${workspaceDirHost}:/workspace:rw`,
        ],
        AutoRemove: true,
      },
    });
    await container.start();
    const info = await container.inspect();
    res.status(201).json({ id: info.Id, agentId, port: null });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();
    res.json(info);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop({ t: 5 }).catch(() => {});
    await container.remove({ force: true }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/:id/logs', async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const logs = await container.logs({ stdout: true, stderr: true, tail: 200, timestamps: false });
    res.type('text/plain').send(logs.toString('utf8'));
  } catch (e) { next(e); }
});

// Terminal readiness: check if tmux session 'agent' exists
router.get('/:id/terminal-ready', async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const exec = await container.exec({
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Cmd: ['/bin/sh', '-lc', 'su-exec agent tmux has-session -t agent'],
    });
    const stream = await exec.start({ hijack: true, Tty: false });
    await new Promise((resolve) => {
      let resolved = false;
      stream.on('end', () => { if (!resolved) { resolved = true; resolve(); } });
      setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, 500);
    });
    const info = await exec.inspect();
    res.json({ ready: info?.ExitCode === 0 });
  } catch (e) { next(e); }
});

export default router;
