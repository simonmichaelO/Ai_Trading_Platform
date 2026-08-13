# ============================================
# AI Trading Platform — Backend Dockerfile
# ============================================
# Multi-stage build for production-ready container.
# 
# Usage:
#   docker build -t ai-trading-backend ./backend
#   docker run -p 5000:5000 --env-file backend/.env ai-trading-backend

# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Production
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]
