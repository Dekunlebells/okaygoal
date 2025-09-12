# Multi-stage Dockerfile for OkayGoal
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Build backend
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production

# Install security updates and necessary packages
RUN apk update && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S okaygoal -u 1001

# Set working directory
WORKDIR /app

# Copy backend build and node_modules
COPY --from=backend-builder --chown=okaygoal:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=okaygoal:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=okaygoal:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder --chown=okaygoal:nodejs /app/frontend/dist ./frontend/dist

# Copy additional necessary files
COPY --chown=okaygoal:nodejs backend/src/database/migrations ./backend/dist/database/migrations
COPY --chown=okaygoal:nodejs backend/src/database/seeds ./backend/dist/database/seeds

# Create logs directory
RUN mkdir -p /app/logs && chown okaygoal:nodejs /app/logs

# Switch to non-root user
USER okaygoal

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/dist/server.js"]