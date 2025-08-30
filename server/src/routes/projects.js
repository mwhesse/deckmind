import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();
const PROJECTS_ROOT = process.env.PROJECTS_ROOT || '/host/projects';

router.get('/', async (req, res) => {
  try {
    // If root doesn't exist, return empty list gracefully
    const exists = fs.existsSync(PROJECTS_ROOT);
    if (!exists) return res.json({ root: PROJECTS_ROOT, projects: [] });

    const entries = await fs.promises.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const dirs = entries
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort((a, b) => a.localeCompare(b));
    res.json({ root: PROJECTS_ROOT, projects: dirs });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

export default router;

