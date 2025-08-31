export interface Agent {
  id: string;
  shortId: string;
  name?: string;
  state: string;
  status: string;
  agentId: string;
  repoUrl: string;
  instructionsPreview?: string;
  branchSlug?: string;
  port?: number;
}

export interface Project {
  name: string;
  path: string;
  description?: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  modified?: string;
  children?: FileItem[];
}

export interface GitStatus {
  branch: string;
  status: string;
  staged: string[];
  modified: string[];
  untracked: string[];
}

export interface WorkspaceInfo {
  repoDir: string;
  workspaceDir: string;
  agentId: string;
}