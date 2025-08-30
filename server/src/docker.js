import Docker from 'dockerode';

export function createDocker() {
  const opts = {};
  if (process.env.DOCKER_HOST) {
    // Support DOCKER_HOST like tcp://...
    opts.host = process.env.DOCKER_HOST;
  }
  return new Docker(opts);
}

export function agentLabels(agentId) {
  return {
    'com.devagent.cockpit': 'true',
    'com.devagent.agentId': agentId,
  };
}
