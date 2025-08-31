import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Grid,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Close as CloseIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Save as SaveIcon,
  GitHub as GitHubIcon,
  PlayArrow as PlayIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import axios from 'axios';
import { Agent, FileItem, GitStatus } from '../types';

interface AgentWorkspaceProps {
  agent: Agent;
  onClose: () => void;
  onAgentUpdate: () => void;
}

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({ agent, onClose, onAgentUpdate }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [gitStatus, setGitStatus] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [terminalReady, setTerminalReady] = useState<boolean>(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const rightClickHandler = useRef<((event: MouseEvent) => void) | null>(null);

  useEffect(() => {
    loadFileTree();
    loadGitStatus();
    checkTerminalReady();
    initTerminal();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
      // Clean up right-click handler
      const terminalElement = terminalRef.current;
      if (terminalElement && rightClickHandler.current) {
        terminalElement.removeEventListener('contextmenu', rightClickHandler.current);
      }
    };
  }, [agent.id]);

  const loadFileTree = async (path: string = '') => {
    try {
      const response = await axios.get(`/api/workspaces/${agent.agentId}/tree?path=${encodeURIComponent(path)}`);
      if (path === '') {
        setFiles(response.data.items || []);
      } else {
        // Update nested directory
        setFiles(prev => updateDirectoryContents(prev, path, response.data.items || []));
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const updateDirectoryContents = (items: FileItem[], path: string, newContents: FileItem[]): FileItem[] => {
    return items.map(item => {
      if (item.path === path && item.type === 'dir') {
        return { ...item, children: newContents };
      }
      if (item.type === 'dir' && item.children) {
        return { ...item, children: updateDirectoryContents(item.children, path, newContents) };
      }
      return item;
    });
  };

  const loadGitStatus = async () => {
    try {
      const response = await axios.get(`/api/workspaces/${agent.agentId}/git/status`);
      setGitStatus(response.data);
    } catch (error) {
      console.error('Failed to load git status:', error);
      setGitStatus('Failed to load git status');
    }
  };

  const checkTerminalReady = async () => {
    try {
      const response = await axios.get(`/api/agents/${agent.id}/terminal-ready`);
      setTerminalReady(response.data.ready);
    } catch (error) {
      console.error('Failed to check terminal ready:', error);
    }
  };

  const initTerminal = () => {
    if (!terminalRef.current) return;

    terminalInstance.current = new Terminal({
      fontSize: 14,
      fontFamily: 'ui-monospace, Menlo, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      theme: {
        background: '#0b1020',
        foreground: '#e5e7eb',
        cursor: '#22d3ee',
      },
      scrollback: 1000,
      rightClickSelectsWord: false, // Disable right-click selection to allow paste
      allowTransparency: true,
    });

    fitAddon.current = new FitAddon();
    terminalInstance.current.loadAddon(fitAddon.current);
    terminalInstance.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Add right-click paste support
    terminalInstance.current.attachCustomKeyEventHandler((event) => {
      // Allow Ctrl+V for paste
      if (event.ctrlKey && event.key === 'v') {
        navigator.clipboard.readText().then(text => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', data: text }));
          }
        });
        return false; // Prevent default
      }
      return true;
    });

    // Handle right-click for paste
    rightClickHandler.current = async (event: MouseEvent) => {
      event.preventDefault(); // Prevent context menu
      try {
        const text = await navigator.clipboard.readText();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input', data: text }));
        }
      } catch (error) {
        console.error('Failed to paste:', error);
      }
    };

    // Add right-click handler to terminal element
    const terminalElement = terminalRef.current;
    if (terminalElement && rightClickHandler.current) {
      terminalElement.addEventListener('contextmenu', rightClickHandler.current);
    }

    // Connect to WebSocket for terminal
    connectTerminal();
  };

  const connectTerminal = () => {
    if (!terminalInstance.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/agents/terminal?id=${encodeURIComponent(agent.id)}&cols=${terminalInstance.current.cols}&rows=${terminalInstance.current.rows}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Terminal WebSocket connected');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        terminalInstance.current?.write(event.data);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            terminalInstance.current?.write(new Uint8Array(reader.result));
          }
        };
        reader.readAsArrayBuffer(event.data);
      }
    };

    ws.onclose = () => {
      terminalInstance.current?.write('\r\n[Connection closed]\r\n');
    };

    ws.onerror = (error) => {
      console.error('Terminal WebSocket error:', error);
      terminalInstance.current?.write('\r\n[Connection error]\r\n');
    };

    terminalInstance.current.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'dir') {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
        await loadFileTree(file.path);
      }
      setExpandedDirs(newExpanded);
    } else {
      setSelectedFile(file.path);
      try {
        const response = await axios.get(`/api/workspaces/${agent.agentId}/file?path=${encodeURIComponent(file.path)}`);
        setFileContent(response.data);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      await axios.put(`/api/workspaces/${agent.agentId}/file`, {
        path: selectedFile,
        content: fileContent,
      });
      await loadGitStatus();
      alert('File saved successfully!');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    try {
      await axios.post(`/api/workspaces/${agent.agentId}/git/commit`, {
        message: commitMessage,
        addAll: true,
      });
      setCommitMessage('');
      await loadGitStatus();
    } catch (error) {
      console.error('Failed to commit:', error);
      alert('Failed to commit changes');
    }
  };

  const handlePush = async () => {
    try {
      await axios.post(`/api/workspaces/${agent.agentId}/git/push`);
      await loadGitStatus();
    } catch (error) {
      console.error('Failed to push:', error);
      alert('Failed to push changes');
    }
  };

  const renderFileTree = (items: FileItem[], level: number = 0): React.ReactNode => {
    return items.map((item) => (
      <React.Fragment key={item.path}>
        <ListItem
          button
          onClick={() => handleFileClick(item)}
          sx={{ pl: level * 2 + 2 }}
        >
          <ListItemIcon>
            {item.type === 'dir' ? (
              expandedDirs.has(item.path) ? <FolderOpenIcon /> : <FolderIcon />
            ) : (
              <FileIcon />
            )}
          </ListItemIcon>
          <ListItemText primary={item.name} />
        </ListItem>
        {item.type === 'dir' && expandedDirs.has(item.path) && (
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderFileTree(item.children || [], level + 1)}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #7c3aed 0%, #22d3ee 100%)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Deckmind Agent Workspace - {agent.name || agent.shortId}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Status: {agent.state} | Branch: feature/{agent.branchSlug}
          </Typography>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 6px 1fr', gridTemplateRows: '1fr 200px', gap: 1, p: 1 }}>
        {/* File Tree */}
        <Paper sx={{ p: 1, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>Files</Typography>
          <List dense>
            {renderFileTree(files)}
          </List>
        </Paper>

        {/* Code Editor */}
        <Paper sx={{ p: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              {selectedFile || 'No file selected'}
            </Typography>
            {selectedFile && (
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveFile}
              >
                Save
              </Button>
            )}
          </Box>
          <TextField
            multiline
            fullWidth
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            sx={{
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'flex-start',
              },
              '& .MuiInputBase-input': {
                fontFamily: 'ui-monospace, monospace',
                fontSize: '14px',
              },
            }}
            disabled={!selectedFile}
          />
        </Paper>

        {/* Resizer Handle */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #7c3aed, #22d3ee)',
            cursor: 'col-resize',
            borderRadius: 1,
          }}
        />

        {/* Terminal */}
        <Paper sx={{ p: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TerminalIcon />
              Terminal
            </Typography>
            <Typography variant="body2" color={terminalReady ? 'success.main' : 'warning.main'}>
              {terminalReady ? 'Ready' : 'Not Ready'}
            </Typography>
          </Box>
          <Box
            ref={terminalRef}
            sx={{
              flex: 1,
              backgroundColor: '#0b1020',
              borderRadius: 1,
              p: 1,
            }}
          />
        </Paper>

        {/* Git Status and Controls */}
        <Paper sx={{ p: 1, gridColumn: '1 / 5', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Git Status</Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#0b1020',
                color: '#e5e7eb',
                p: 1,
                borderRadius: 1,
                fontSize: '12px',
                fontFamily: 'ui-monospace, monospace',
                overflow: 'auto',
                maxHeight: '150px',
                m: 0,
              }}
            >
              {gitStatus}
            </Box>
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>Commit & Push</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<GitHubIcon />}
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                fullWidth
              >
                Commit
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={handlePush}
                fullWidth
              >
                Push
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AgentWorkspace;