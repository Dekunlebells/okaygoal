# Backend-only Dockerfile for Railway deployment
FROM node:20-alpine

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

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend
ENV NODE_ENV=production
RUN npm run build

# Create logs and database directories
RUN mkdir -p /app/logs && \
    mkdir -p /app/database/migrations && \
    mkdir -p /app/database/seeds && \
    chown -R okaygoal:nodejs /app

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
CMD ["npm", "start"]