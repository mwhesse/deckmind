const request = require('supertest');
const express = require('express');
const agentsRouter = require('../routes/agents');

// Mock Docker
jest.mock('dockerode');
const Docker = require('dockerode');

describe('Agents API', () => {
  let app;
  let mockDocker;
  let mockContainer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/agents', agentsRouter);

    // Mock Docker
    mockContainer = {
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
      }
    };

    mockDocker = {
      listContainers: jest.fn().mockResolvedValue([mockContainer]),
      getContainer: jest.fn().mockReturnValue({
        inspect: jest.fn().mockResolvedValue(mockContainer),
        stop: jest.fn().mockResolvedValue(),
        remove: jest.fn().mockResolvedValue(),
        logs: jest.fn().mockResolvedValue(Buffer.from('test logs')),
        exec: jest.fn().mockResolvedValue({
          start: jest.fn().mockResolvedValue(),
          inspect: jest.fn().mockResolvedValue({ ExitCode: 0 })
        })
      }),
      createContainer: jest.fn().mockResolvedValue({
        start: jest.fn().mockResolvedValue(),
        inspect: jest.fn().mockResolvedValue(mockContainer)
      })
    };

    Docker.mockImplementation(() => mockDocker);
  });

  describe('GET /api/agents', () => {
    it('should return list of agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', 'test-container-id');
      expect(response.body[0]).toHaveProperty('agentId', 'test-agent-id');
    });

    it('should handle Docker errors', async () => {
      mockDocker.listContainers.mockRejectedValue(new Error('Docker error'));

      const response = await request(app)
        .get('/api/agents')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/agents', () => {
    const validAgentData = {
      repoUrl: '/test/repo',
      branchSlug: 'test-feature',
      instructions: 'Implement test feature'
    };

    it('should create new agent successfully', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send(validAgentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('agentId');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate branchSlug format', async () => {
      const invalidData = {
        ...validAgentData,
        branchSlug: ''
      };

      const response = await request(app)
        .post('/api/agents')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle repository path validation', async () => {
      const invalidData = {
        ...validAgentData,
        repoUrl: '/nonexistent/path'
      };

      const response = await request(app)
        .post('/api/agents')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should stop and remove agent', async () => {
      const response = await request(app)
        .delete('/api/agents/test-container-id')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
    });

    it('should handle container not found', async () => {
      mockDocker.getContainer().stop.mockRejectedValue(new Error('Container not found'));

      const response = await request(app)
        .delete('/api/agents/test-container-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/agents/:id/logs', () => {
    it('should return container logs', async () => {
      const response = await request(app)
        .get('/api/agents/test-container-id/logs')
        .expect(200);

      expect(response.text).toBe('test logs');
      expect(response.type).toBe('text/plain');
    });
  });

  describe('GET /api/agents/:id/terminal-ready', () => {
    it('should check terminal readiness', async () => {
      const response = await request(app)
        .get('/api/agents/test-container-id/terminal-ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready', true);
    });
  });
});