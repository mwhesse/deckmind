import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile as _execFile } from 'node:child_process';

const execFile = promisify(_execFile);
const router = express.Router();

const WORKSPACES_DIR = process.env.WORKSPACES_DIR || '/host/workspaces';

function getWorkspaceRoot(agentId) {
  const root = path.resolve(path.join(WORKSPACES_DIR, agentId));
  return root;
}

function safeJoin(root, rel = '') {
  const p = path.resolve(path.join(root, rel || ''));
  if (!p.startsWith(root)) throw new Error('Path traversal');
  return p;
}

router.get('/:agentId/tree', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const rel = req.query.path ? String(req.query.path) : '';
    const root = getWorkspaceRoot(agentId);
    const abs = safeJoin(root, rel);
    const entries = await fs.promises.readdir(abs, { withFileTypes: true });
    const items = await Promise.all(entries.map(async (d) => {
      const full = path.join(abs, d.name);
      const st = await fs.promises.stat(full).catch(() => null);
      return {
        name: d.name,
        path: path.posix.join(rel || '', d.name).replace(/\\/g, '/'),
        type: d.isDirectory() ? 'dir' : 'file',
        size: st?.size || 0,
        mtimeMs: st?.mtimeMs || 0,
      };
    }));
    items.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1));
    res.json({ root: `/${agentId}`, path: rel || '', items, workspaceDir: root, repoDir: path.join(root, 'repo') });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

router.get('/:agentId/file', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const rel = String(req.query.path || '');
    const root = getWorkspaceRoot(agentId);
    const abs = safeJoin(root, rel);
    const st = await fs.promises.stat(abs);
    if (st.isDirectory()) return res.status(400).json({ error: 'Path is a directory' });
    const data = await fs.promises.readFile(abs);
    res.type('text/plain').send(data);
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

router.put('/:agentId/file', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const { path: rel, content } = req.body || {};
    if (!rel) return res.status(400).json({ error: 'path required' });
    const root = getWorkspaceRoot(agentId);
    const abs = safeJoin(root, String(rel));
    await fs.promises.mkdir(path.dirname(abs), { recursive: true });
    await fs.promises.writeFile(abs, String(content ?? ''), 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

// Simple Git helpers (operate inside repo subdir)
function repoPath(agentId) {
  return path.join(getWorkspaceRoot(agentId), 'repo');
}

async function ensureSafeDirectory(repo) {
  try {
    const { stdout } = await execFile('git', ['config', '--global', '--get-all', 'safe.directory']);
    const list = (stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (list.includes(repo)) return;
  } catch (_) {
    // No entries yet
  }
  // Add repo as a safe directory for git, to avoid "dubious ownership" under Docker mappings
  await execFile('git', ['config', '--global', '--add', 'safe.directory', repo]).catch(() => {});
}

router.get('/:agentId/git/status', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const repo = repoPath(agentId);
    const gitFolder = path.join(repo, '.git');
    const exists = await fs.promises.stat(gitFolder).then((s) => s.isDirectory()).catch(() => false);
    if (!exists) {
      return res.type('text/plain').send(`Not a git repo: ${repo}`);
    }
    await ensureSafeDirectory(repo);
    const { stdout } = await execFile('git', ['status', '--porcelain=v1', '--branch'], { cwd: repo });
    res.type('text/plain').send(stdout);
  } catch (e) {
    // Return as text so UI shows the message instead of a generic failure
    res.type('text/plain').send(`git status error: ${String(e?.message || e)}`);
  }
});

router.post('/:agentId/git/commit', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const repo = repoPath(agentId);
    const { message, addAll } = req.body || {};
    await ensureSafeDirectory(repo);
    if (addAll) await execFile('git', ['add', '-A'], { cwd: repo });
    const { stdout, stderr } = await execFile('git', ['commit', '-m', String(message || 'WIP')], { cwd: repo }).catch(async (err) => {
      // If nothing to commit, return message
      if (err?.stdout || err?.stderr) return { stdout: err.stdout || '', stderr: err.stderr || '' };
      throw err;
    });
    res.type('text/plain').send((stdout || '') + (stderr || ''));
  } catch (e) {
    res.type('text/plain').send(`git commit error: ${String(e?.message || e)}`);
  }
});

router.post('/:agentId/git/push', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const repo = repoPath(agentId);
    // Determine current branch and push
    await ensureSafeDirectory(repo);
    const { stdout: branch } = await execFile('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo });
    const br = branch.trim();
    const { stdout, stderr } = await execFile('git', ['push', 'origin', br], { cwd: repo });
    res.type('text/plain').send((stdout || '') + (stderr || ''));
  } catch (e) {
    res.type('text/plain').send(`git push error: ${String(e?.message || e)}`);
  }
});

export default router;
