const request = require('supertest');
const express = require('express');
const workspacesRouter = require('../routes/workspaces');
const fs = require('fs').promises;
const path = require('path');

// Mock file system
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  }
}));

describe('Workspaces API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/workspaces', workspacesRouter);
  });

  describe('GET /api/workspaces/:agentId/tree', () => {
    it('should return file tree structure', async () => {
      // Mock file system structure
      const mockFiles = [
        { name: 'repo', type: 'dir' },
        { name: 'INSTRUCTIONS.md', type: 'file' }
      ];

      const mockRepoFiles = [
        { name: 'src', type: 'dir' },
        { name: 'package.json', type: 'file' },
        { name: 'README.md', type: 'file' }
      ];

      fs.promises.readdir
        .mockResolvedValueOnce(mockFiles) // Root directory
        .mockResolvedValueOnce(mockRepoFiles); // Repo subdirectory

      fs.promises.stat
        .mockResolvedValue({ isDirectory: () => true })
        .mockResolvedValue({ isDirectory: () => false });

      const response = await request(app)
        .get('/api/workspaces/test-agent/tree')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should handle file system errors', async () => {
      fs.promises.readdir.mockRejectedValue(new Error('File system error'));

      const response = await request(app)
        .get('/api/workspaces/test-agent/tree')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/workspaces/:agentId/file', () => {
    it('should return file contents', async () => {
      const mockContent = 'console.log("Hello World");';
      fs.promises.readFile.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/workspaces/test-agent/file?path=src/index.js')
        .expect(200);

      expect(response.text).toBe(mockContent);
    });

    it('should handle file not found', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/workspaces/test-agent/file?path=nonexistent.js')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/workspaces/:agentId/file', () => {
    it('should update file contents', async () => {
      const newContent = 'console.log("Updated content");';
      fs.promises.writeFile.mockResolvedValue();

      const response = await request(app)
        .put('/api/workspaces/test-agent/file')
        .send({
          path: 'src/index.js',
          content: newContent
        })
        .expect(200);

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('src/index.js'),
        newContent,
        'utf8'
      );
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .put('/api/workspaces/test-agent/file')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/workspaces/:agentId/git/commit', () => {
    it('should commit changes successfully', async () => {
      // Mock successful git operations
      const { execFile } = require('child_process');
      const mockExecFile = jest.fn().mockResolvedValue({ stdout: '', stderr: '' });
      jest.doMock('child_process', () => ({ execFile: mockExecFile }));

      const response = await request(app)
        .post('/api/workspaces/test-agent/git/commit')
        .send({
          message: 'Test commit',
          addAll: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should handle git errors', async () => {
      const { execFile } = require('child_process');
      const mockExecFile = jest.fn().mockRejectedValue(new Error('Git error'));
      jest.doMock('child_process', () => ({ execFile: mockExecFile }));

      const response = await request(app)
        .post('/api/workspaces/test-agent/git/commit')
        .send({
          message: 'Test commit'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/workspaces/:agentId/git/push', () => {
    it('should push changes successfully', async () => {
      const response = await request(app)
        .post('/api/workspaces/test-agent/git/push')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});