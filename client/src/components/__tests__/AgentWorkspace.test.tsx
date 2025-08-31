import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentWorkspace from '../AgentWorkspace';
import { Agent } from '../../types';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock xterm
jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn().mockImplementation(() => ({
    loadAddon: jest.fn(),
    open: jest.fn(),
    write: jest.fn(),
    onData: jest.fn(),
    dispose: jest.fn(),
    cols: 80,
    rows: 24,
  }))
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn().mockImplementation(() => ({
    fit: jest.fn()
  }))
}));

const mockAgent: Agent = {
  id: 'test-agent-id',
  shortId: 'abc123',
  name: 'test-agent',
  state: 'running',
  status: 'Up 5 minutes',
  agentId: 'test-agent-id',
  repoUrl: '/test/repo',
  branchSlug: 'test-feature',
  instructionsPreview: 'Test instructions for agent'
};

const mockProps = {
  agent: mockAgent,
  onClose: jest.fn(),
  onAgentUpdate: jest.fn()
};

describe('AgentWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios responses
    axios.get.mockImplementation((url: string) => {
      if (url.includes('/tree')) {
        return Promise.resolve({
          data: {
            items: [
              { name: 'src', type: 'dir', path: 'src' },
              { name: 'package.json', type: 'file', path: 'package.json' }
            ]
          }
        });
      }
      if (url.includes('/git/status')) {
        return Promise.resolve({
          data: 'On branch feature/test-feature\nChanges to be committed:\n  modified: package.json\n'
        });
      }
      if (url.includes('/terminal-ready')) {
        return Promise.resolve({ data: { ready: true } });
      }
      return Promise.resolve({ data: '' });
    });

    axios.put.mockResolvedValue({ data: {} });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  it('renders agent workspace with correct title', () => {
    render(<AgentWorkspace {...mockProps} />);

    expect(screen.getByText('Deckmind Agent Workspace - test-agent')).toBeInTheDocument();
    expect(screen.getByText('Status: running | Branch: feature/test-feature')).toBeInTheDocument();
  });

  it('loads file tree on mount', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workspaces/test-agent-id/tree?path=');
    });
  });

  it('loads git status on mount', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workspaces/test-agent-id/git/status');
    });
  });

  it('displays file tree structure', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });
  });

  it('displays git status', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/On branch feature\/test-feature/)).toBeInTheDocument();
    });
  });

  it('handles file selection', async () => {
    axios.get.mockImplementation((url: string) => {
      if (url.includes('/file?path=package.json')) {
        return Promise.resolve({ data: '{"name": "test"}' });
      }
      return Promise.resolve({ data: { items: [] } });
    });

    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      const fileElement = screen.getByText('package.json');
      fireEvent.click(fileElement);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workspaces/test-agent-id/file?path=package.json');
    });
  });

  it('handles file saving', async () => {
    const { container } = render(<AgentWorkspace {...mockProps} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    // Find and click save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(axios.put).toHaveBeenCalledWith('/api/workspaces/test-agent-id/file', {
      path: '',
      content: ''
    });
  });

  it('handles git commit', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Commit')).toBeInTheDocument();
    });

    const commitButton = screen.getByText('Commit');
    const commitInput = screen.getByPlaceholderText('Commit message');

    fireEvent.change(commitInput, { target: { value: 'Test commit message' } });
    fireEvent.click(commitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/workspaces/test-agent-id/git/commit', {
        message: 'Test commit message',
        addAll: true
      });
    });
  });

  it('handles git push', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Push')).toBeInTheDocument();
    });

    const pushButton = screen.getByText('Push');
    fireEvent.click(pushButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/workspaces/test-agent-id/git/push', {});
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<AgentWorkspace {...mockProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows terminal status', async () => {
    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
  });

  it('handles terminal not ready', async () => {
    axios.get.mockImplementation((url: string) => {
      if (url.includes('/terminal-ready')) {
        return Promise.resolve({ data: { ready: false } });
      }
      return Promise.resolve({ data: { items: [] } });
    });

    render(<AgentWorkspace {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Not ready')).toBeInTheDocument();
    });
  });
});