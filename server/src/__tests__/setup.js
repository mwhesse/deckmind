// Jest setup file for server tests
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.PORT = '3001';
process.env.AGENT_IMAGE = 'deckmind/agent:test';
process.env.PROJECTS_ROOT = '/tmp/test-projects';
process.env.WORKSPACES_DIR = '/tmp/test-workspaces';

// Mock Docker socket path for testing
process.env.DOCKER_HOST = 'unix:///var/run/docker.sock';

// Global test utilities
global.testUtils = {
  // Helper to create mock containers
  createMockContainer: (overrides = {}) => ({
    Id: 'test-container-id',
    Names: ['/test-agent'],
    State: 'running',
    Status: 'Up 2 minutes',
    Labels: {
      'com.deckmind.cockpit': 'true',
      'com.deckmind.agentId': 'test-agent-id',
      'com.deckmind.repoUrl': '/test/repo',
      'com.deckmind.branchSlug': 'test-branch',
      'com.deckmind.instructionsPreview': 'Test instructions...'
    },
    Ports: [{ PrivatePort: 8080, PublicPort: 8080 }],
    ...overrides
  }),

  // Helper to create mock file system structure
  createMockFileTree: () => ({
    items: [
      { name: 'repo', type: 'dir', path: 'repo' },
      { name: 'INSTRUCTIONS.md', type: 'file', path: 'INSTRUCTIONS.md' }
    ]
  }),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});