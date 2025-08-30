/* Minimal SPA logic for DevAgent Cockpit */

const $ = (sel) => document.querySelector(sel);
const agentsEl = $('#agents');
const listViewEl = $('#listView');
const detailsViewEl = $('#detailsView');
const closeModalBtn = $('#closeModalBtn');
const terminalEl = $('#terminal');
const terminalStatusEl = $('#terminalStatus');
const projectSelectEl = $('#projectSelect');
const refreshProjectsBtn = $('#refreshProjectsBtn');
const instructionsEl = $('#instructions');
const branchSlugEl = $('#branchSlug');
const launchBtn = $('#launchBtn');

let agents = [];
let selectedContainerId = null; // Docker container ID
let selectedAgentId = null;     // Logical agentId label
let term = null;
let fitAddon = null;
let termSocket = null;
let projects = [];
let termResizeObserver = null;

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

function renderAgents() {
  agentsEl.innerHTML = '';
  if (!agents.length) {
    agentsEl.innerHTML = '<div class="muted">No agents yet. Launch one above.</div>';
    return;
  }
  for (const a of agents) {
    const div = document.createElement('div');
    div.className = 'agent';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <div><strong>${a.name || a.shortId || a.id}</strong> <span class="muted">(${a.state})</span></div>
          ${a.branchSlug ? `<div class="muted" style="font-size:12px;">branch: feature/${a.branchSlug}</div>` : ''}
          <div class="muted" style="font-size:12px;">agentId: ${a.agentId || '-'} · port: ${a.port ?? '-'} </div>
          <div class="muted" style="font-size:12px;">repo: ${a.repoUrl || '-'}</div>
          ${a.instructionsPreview ? `<div class="muted" style="font-size:12px;">${a.instructionsPreview}</div>` : ''}
        </div>
        <div>
          <button data-action="select" data-id="${a.id}">Inspect</button>
          <button data-action="stop" data-id="${a.id}" style="margin-left:6px;">Stop</button>
        </div>
      </div>
    `;
    div.addEventListener('click', async (e) => {
      const target = e.target;
      const id = target.getAttribute('data-id') || a.id;
      const action = target.getAttribute('data-action') || 'select';
      if (action === 'stop') {
        e.stopPropagation();
        await stopAgent(id);
        return;
      }
      selectAgent(id);
    });
    agentsEl.appendChild(div);
  }
}

async function refreshAgents() {
  try {
    const res = await api('/api/agents');
    agents = await res.json();
    renderAgents();
  } catch (e) {
    console.error('Failed to load agents', e);
  }
}

async function refreshProjects() {
  try {
    const res = await api('/api/projects');
    const data = await res.json();
    projects = data.projects || [];
    projectSelectEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = projects.length ? 'Select a project…' : 'No projects found';
    projectSelectEl.appendChild(placeholder);
    for (const name of projects) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      projectSelectEl.appendChild(opt);
    }
  } catch (e) {
    console.error('Failed to load projects', e);
    projectSelectEl.innerHTML = '<option value="">Failed to load projects</option>';
  }
}

function selectAgent(id) {
  selectedContainerId = id;
  const a = agents.find(x => x.id === id);
  if (!a) {
    return;
  }
  selectedAgentId = a.agentId || null;
  detailsViewEl.style.display = 'block';
  loadTree('');
  refreshGitStatus();
  // Reset terminal session on selection change
  closeTerminal();
  refreshTerminalStatus();
  // Auto-open terminal when inspecting an agent
  // Small delay to let the DOM render and status update
  setTimeout(() => { if (selectedContainerId === id) openTerminal(); }, 150);
  initColumnResizer();
}

function initTerminal() {
  if (term) return;
  term = new window.Terminal({
    convertEol: true,
    fontSize: 13,
    scrollback: 1000,
    theme: { background: '#0b1020' },
  });
  try {
    if (window.FitAddon && window.FitAddon.FitAddon) {
      fitAddon = new window.FitAddon.FitAddon();
      term.loadAddon(fitAddon);
    }
  } catch (e) {
    // Fit addon unavailable; continue without it
    fitAddon = null;
  }
  term.open(terminalEl);
  fitTerminal();
  window.addEventListener('resize', () => {
    if (!term) return;
    fitTerminal();
  });
  if ('ResizeObserver' in window && terminalEl) {
    termResizeObserver = new ResizeObserver(() => {
      fitTerminal();
    });
    termResizeObserver.observe(terminalEl);
  }
}

function sendResize() {
  if (!term || !termSocket || termSocket.readyState !== WebSocket.OPEN) return;
  const cols = term.cols || 80;
  const rows = term.rows || 24;
  termSocket.send(JSON.stringify({ type: 'resize', cols, rows }));
}

function closeTerminal() {
  try { if (termSocket) termSocket.close(); } catch {}
  termSocket = null;
  if (term) {
    term.dispose();
    term = null;
    fitAddon = null;
    terminalEl.innerHTML = '';
  }
  try { if (termResizeObserver) termResizeObserver.disconnect(); } catch {}
  termResizeObserver = null;
}

async function openTerminal() {
  if (!selectedContainerId) { alert('Select an agent first'); return; }
  initTerminal();
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss' : 'ws';
  const cols = term.cols || 80;
  const rows = term.rows || 24;
  const url = `${proto}://${loc.host}/api/agents/terminal?id=${encodeURIComponent(selectedContainerId)}&cols=${cols}&rows=${rows}`;
  const ws = new WebSocket(url);
  termSocket = ws;
  ws.binaryType = 'arraybuffer';
  ws.onopen = () => {
    term.focus();
    fitTerminal();
  };
  ws.onmessage = (evt) => {
    const data = evt.data;
    if (data instanceof ArrayBuffer) {
      term.write(new Uint8Array(data));
    } else {
      term.write(data);
    }
  };
  ws.onclose = () => {
    term.write('\r\n[terminal closed]\r\n');
  };
  ws.onerror = () => {
    term.write('\r\n[terminal error]\r\n');
  };
  term.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }));
    }
  });
}


async function refreshTerminalStatus() {
  if (!selectedContainerId) { terminalStatusEl.textContent = 'No agent selected'; return; }
  try {
    terminalStatusEl.textContent = 'Checking…';
    const res = await api(`/api/agents/${selectedContainerId}/terminal-ready`);
    const data = await res.json();
    if (data.ready) {
      terminalStatusEl.textContent = 'Ready';
    } else {
      terminalStatusEl.textContent = 'Not ready';
    }
  } catch (e) {
    terminalStatusEl.textContent = 'Unavailable';
  }
}

setInterval(() => { if (selectedContainerId) refreshTerminalStatus(); }, 4000);

async function stopAgent(id) {
  try {
    await api(`/api/agents/${id}`, { method: 'DELETE' });
    if (id === selectedContainerId) {
      selectedContainerId = null;
      selectedAgentId = null;
    }
    await refreshAgents();
  } catch (e) {
    alert('Failed to stop agent');
  }
}

async function launchAgent() {
  const repoUrl = (projectSelectEl.value || '').trim();
  const instructions = (instructionsEl.value || '').trim();
  const branchSlug = (branchSlugEl.value || '').trim();
  if (!repoUrl) {
    alert('Please select a project');
    return;
  }
  if (!branchSlug) {
    alert('Please enter a branch slug');
    return;
  }
  launchBtn.disabled = true;
  launchBtn.textContent = 'Starting...';
  try {
    await api('/api/agents', {
      method: 'POST',
      body: JSON.stringify({ repoUrl, instructions, branchSlug }),
    });
    instructionsEl.value = '';
    branchSlugEl.value = '';
    await refreshAgents();
  } catch (e) {
    alert('Failed to start agent');
  } finally {
    launchBtn.disabled = false;
    launchBtn.textContent = 'Start Agent';
  }
}

launchBtn.addEventListener('click', () => launchAgent());
refreshProjectsBtn.addEventListener('click', () => refreshProjects());

// Initial load
refreshAgents();
setInterval(refreshAgents, 5000);
refreshProjects();

// ---- Workspace browser + editor ----
const fileTreeEl = $('#fileTree');
const editorEl = $('#editor');
const editorHeaderEl = $('#editorHeader');
const saveFileBtn = $('#saveFileBtn');
const gitStatusEl = $('#gitStatus');
const commitMsgEl = $('#commitMsg');
const commitBtn = $('#commitBtn');
const pushBtn = $('#pushBtn');
const workspaceEl = $('#workspace');
const colResizerEl = $('#colResizer');

let currentPath = '';

// Collapsible tree with lazy loading
const treeCache = new Map(); // path -> items
const expandedDirs = new Set(); // set of dir paths expanded

async function fetchDir(relPath) {
  if (!selectedAgentId) return [];
  if (treeCache.has(relPath)) return treeCache.get(relPath);
  const res = await api(`/api/workspaces/${selectedAgentId}/tree?path=${encodeURIComponent(relPath)}`);
  const data = await res.json();
  // On first load update the workspace path label
  if (relPath === '') {
    const wsPath = (data && data.repoDir) ? data.repoDir : '';
    const workspacePathEl = document.getElementById('workspacePath');
    if (workspacePathEl) workspacePathEl.textContent = wsPath || '-';
  }
  treeCache.set(relPath, data.items || []);
  return data.items || [];
}

async function loadTree() {
  treeCache.clear();
  expandedDirs.clear();
  await fetchDir('');
  renderTree();
}

function treeRow(label, depth, isDir, caret, onClick) {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '6px';
  row.style.padding = '2px 4px';
  row.style.cursor = 'pointer';
  row.style.paddingLeft = `${8 + depth * 14}px`;
  const caretEl = document.createElement('span');
  caretEl.textContent = caret;
  caretEl.style.width = '10px';
  caretEl.style.display = 'inline-block';
  caretEl.style.color = '#64748b';
  if (!isDir) caretEl.textContent = '';
  const icon = document.createElement('span');
  icon.textContent = isDir ? '📁' : '📄';
  const text = document.createElement('span');
  text.textContent = label;
  row.appendChild(caretEl);
  row.appendChild(icon);
  row.appendChild(text);
  row.onclick = onClick;
  row.onmouseenter = () => row.style.background = '#f8fafc';
  row.onmouseleave = () => row.style.background = 'transparent';
  return row;
}

function renderTree() {
  fileTreeEl.innerHTML = '';
  const container = document.createElement('div');
  fileTreeEl.appendChild(container);
  renderDirInto('', 0, container);
}

function renderDirInto(relPath, depth, container) {
  const items = treeCache.get(relPath) || [];
  for (const it of items) {
    if (it.type === 'dir') {
      const isOpen = expandedDirs.has(it.path);
      const row = treeRow(it.name, depth, true, isOpen ? '▼' : '▶', async () => {
        if (expandedDirs.has(it.path)) {
          expandedDirs.delete(it.path);
          renderTree();
        } else {
          expandedDirs.add(it.path);
          // Lazy load children before re-render
          await fetchDir(it.path).catch(() => {});
          renderTree();
        }
      });
      container.appendChild(row);
      if (isOpen) {
        const childWrap = document.createElement('div');
        container.appendChild(childWrap);
        renderDirInto(it.path, depth + 1, childWrap);
      }
    } else {
      const row = treeRow(it.name, depth, false, '', () => openFile(it.path));
      container.appendChild(row);
    }
  }
}

async function openFile(relPath) {
  if (!selectedAgentId) return;
  const res = await api(`/api/workspaces/${selectedAgentId}/file?path=${encodeURIComponent(relPath)}`);
  const text = await res.text();
  currentPath = relPath;
  editorHeaderEl.textContent = relPath || 'No file selected';
  editorEl.value = text;
}

saveFileBtn?.addEventListener('click', async () => {
  if (!selectedAgentId || !currentPath) return alert('No file selected');
  await api(`/api/workspaces/${selectedAgentId}/file`, { method: 'PUT', body: JSON.stringify({ path: currentPath, content: editorEl.value }) });
  await refreshGitStatus();
});

async function refreshGitStatus() {
  if (!selectedAgentId) return;
  try {
    const res = await api(`/api/workspaces/${selectedAgentId}/git/status`);
    gitStatusEl.textContent = await res.text();
  } catch (e) {
    gitStatusEl.textContent = 'Failed to read status';
  }
}

commitBtn?.addEventListener('click', async () => {
  if (!selectedAgentId) return;
  const message = (commitMsgEl.value || '').trim() || 'WIP';
  try {
    await api(`/api/workspaces/${selectedAgentId}/git/commit`, { method: 'POST', body: JSON.stringify({ message, addAll: true }) });
    commitMsgEl.value = '';
    await refreshGitStatus();
  } catch (e) {
    alert('Commit failed');
  }
});

pushBtn?.addEventListener('click', async () => {
  if (!selectedAgentId) return;
  try {
    await api(`/api/workspaces/${selectedAgentId}/git/push`, { method: 'POST', body: JSON.stringify({}) });
    await refreshGitStatus();
  } catch (e) {
    alert('Push failed');
  }
});

closeModalBtn?.addEventListener('click', () => {
  // Close modal and reset transient state
  closeTerminal();
  detailsViewEl.style.display = 'none';
  selectedContainerId = null;
  selectedAgentId = null;
  currentPath = '';
  editorEl.value = '';
  editorHeaderEl.textContent = 'No file selected';
  refreshAgents();
  teardownColumnResizer();
});
function fitTerminal() {
  try {
    if (fitAddon && term) {
      fitAddon.fit();
      sendResize();
    }
  } catch (e) {
    // ignore
  }
}

// ----- Resizable columns (editor | terminal) -----
let isResizing = false;
let startX = 0;
let startEditorW = 0;
let startTermW = 0;
const RESIZER_WIDTH = 6;

function applyCols(editorPx, termPx) {
  if (!workspaceEl) return;
  workspaceEl.style.gridTemplateColumns = `300px ${editorPx}px ${RESIZER_WIDTH}px ${termPx}px`;
  fitTerminal();
}

function initColumnResizer() {
  if (!colResizerEl || !workspaceEl) return;
  const rightTotal = workspaceEl.clientWidth - 300 - RESIZER_WIDTH - 2 * 12; // total space for editor+terminal minus gaps
  // Default split 60/40
  let editorPx = Math.max(320, Math.floor(rightTotal * 0.6));
  let termPx = Math.max(320, rightTotal - editorPx);
  applyCols(editorPx, termPx);

  const onMove = (e) => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    let newEditor = Math.max(320, startEditorW + dx);
    let newTerm = Math.max(320, startTermW - dx);
    const total = newEditor + newTerm;
    if (total > rightTotal) {
      const overflow = total - rightTotal;
      if (dx > 0) newEditor -= overflow; else newTerm -= overflow;
    }
    applyCols(newEditor, newTerm);
  };
  const onUp = () => { isResizing = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  colResizerEl.onmousedown = (e) => {
    isResizing = true;
    startX = e.clientX;
    const styles = window.getComputedStyle(workspaceEl);
    const cols = styles.gridTemplateColumns.split(' ');
    startEditorW = parseInt(cols[1]);
    startTermW = parseInt(cols[3]);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  };
}

function teardownColumnResizer() {
  if (colResizerEl) colResizerEl.onmousedown = null;
}
