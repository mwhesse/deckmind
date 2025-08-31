# Multi-stage build for Deckmind
# Stage 1: Build the React client
FROM node:18-alpine AS client-builder

WORKDIR /client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the client
RUN npm run build

# Stage 2: Build the server with client included
FROM node:18-alpine AS server

# Install git (needed for some operations)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built client from client-builder stage
COPY --from=client-builder /client/build ./public

# Create non-root user for security
#RUN addgroup -g 1001 -S nodejs && \
#    adduser -S deckmind -u 1001

# Change ownership of the app directory
#RUN chown -R deckmind:nodejs /app
#USER deckmind
USER root

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8088/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "src/server.js"]