import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AgentWorkspace from './components/AgentWorkspace';
import TemplateSelector from './components/TemplateSelector';
import { Agent, Project } from './types';

const App: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [agentHomes, setAgentHomes] = useState<Record<string, Array<{id: string, name: string, path: string}>>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [launchForm, setLaunchForm] = useState({
    project: '',
    branchSlug: '',
    instructions: '',
    agentType: 'claude',
    agentHome: '',
  });

  useEffect(() => {
    loadAgents();
    loadProjects();
    loadAgentHomes();
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval as any);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await axios.get('/api/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadAgentHomes = async () => {
    try {
      const response = await axios.get('/api/agents/homes');
      setAgentHomes(response.data || {});
    } catch (error) {
      console.error('Failed to load agent homes:', error);
    }
  };

  const handleLaunchAgent = async () => {
    try {
      await axios.post('/api/agents', {
        repoUrl: launchForm.project,
        branchSlug: launchForm.branchSlug,
        instructions: launchForm.instructions,
        agentType: launchForm.agentType,
        agentHome: launchForm.agentHome,
      });
      setShowLaunchDialog(false);
      setLaunchForm({ project: '', branchSlug: '', instructions: '', agentType: 'claude', agentHome: '' });
      loadAgents();
    } catch (error) {
      console.error('Failed to launch agent:', error);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      await axios.delete(`/api/agents/${agentId}`);
      loadAgents();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setLaunchForm({
      project: '',
      branchSlug: `implement-${template.id}`,
      instructions: template.instructions,
      agentType: 'claude',
      agentHome: '',
    });
    setShowLaunchDialog(true);
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running': return 'success';
      case 'exited': return 'error';
      default: return 'default';
    }
  };

  if (selectedAgent) {
    return (
      <AgentWorkspace
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onAgentUpdate={loadAgents}
      />
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(135deg, #0b1020 0%, #1a1a2e 100%)' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #7c3aed 0%, #22d3ee 100%)', boxShadow: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Deckmind
          </Typography>
          <Button color="inherit" startIcon={<GitHubIcon />}>
            GitHub
          </Button>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Launch Agent Section */}
          <Grid item xs={12} md={4}>
            <Card sx={{ background: 'rgba(22, 28, 48, 0.6)', backdropFilter: 'blur(8px)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon />
                  Launch New Agent
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={launchForm.project}
                    onChange={(e) => setLaunchForm({ ...launchForm, project: e.target.value })}
                    label="Project"
                  >
                    {projects.map((project) => (
                      <MenuItem key={project} value={project}>
                        {project}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Agent Type</InputLabel>
                  <Select
                    value={launchForm.agentType}
                    onChange={(e) => setLaunchForm({ ...launchForm, agentType: e.target.value, agentHome: '' })}
                    label="Agent Type"
                  >
                    <MenuItem value="claude">Claude (Anthropic)</MenuItem>
                    <MenuItem value="codex">Codex (OpenAI)</MenuItem>
                    <MenuItem value="gemini">Gemini (Google)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Agent Profile</InputLabel>
                  <Select
                    value={launchForm.agentHome}
                    onChange={(e) => setLaunchForm({ ...launchForm, agentHome: e.target.value })}
                    label="Agent Profile"
                    disabled={!launchForm.agentType || !agentHomes[launchForm.agentType]?.length}
                  >
                    {agentHomes[launchForm.agentType]?.map((home) => (
                      <MenuItem key={home.id} value={home.id}>
                        {home.name} ({home.id})
                      </MenuItem>
                    )) || []}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Branch Slug"
                  value={launchForm.branchSlug}
                  onChange={(e) => setLaunchForm({ ...launchForm, branchSlug: e.target.value })}
                  sx={{ mb: 2 }}
                  placeholder="add-cool-feature"
                />
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={4}
                  value={launchForm.instructions}
                  onChange={(e) => setLaunchForm({ ...launchForm, instructions: e.target.value })}
                  placeholder="Describe what the agent should do..."
                />
              </CardContent>
              <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowTemplateSelector(true)}
                  sx={{ mb: 1 }}
                >
                  Choose from Templates
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleLaunchAgent}
                  disabled={!launchForm.project || !launchForm.branchSlug}
                >
                  Launch Agent
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Agents List */}
          <Grid item xs={12} md={8}>
            <Card sx={{ background: 'rgba(22, 28, 48, 0.6)', backdropFilter: 'blur(8px)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon />
                  Active Agents ({agents.length})
                </Typography>
                <List>
                  {agents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No agents running. Launch one to get started!
                    </Typography>
                  ) : (
                    agents.map((agent) => (
                      <ListItem
                        key={agent.id}
                        sx={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                        }}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {agent.name || agent.shortId}
                              </Typography>
                              <Chip
                                label={agent.state}
                                size="small"
                                color={getStatusColor(agent.state)}
                              />
                              <Chip
                                label={agent.agentType || 'claude'}
                                size="small"
                                variant="outlined"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {agent.repoUrl}
                              </Typography>
                              {agent.branchSlug && (
                                <Typography variant="body2" color="text.secondary">
                                  Branch: feature/{agent.branchSlug}
                                </Typography>
                              )}
                              {agent.instructionsPreview && (
                                <Typography variant="body2" color="text.secondary">
                                  {agent.instructionsPreview}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStopAgent(agent.id);
                            }}
                            color="error"
                          >
                            <StopIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Button for Quick Launch */}
      <Tooltip title="Launch New Agent">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowLaunchDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Template Selector Dialog */}
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </Box>
  );
};

export default App;