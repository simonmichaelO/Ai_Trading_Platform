# ─ Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx tsc || true

# ── Stage 2: Production ──
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.production.json ./tsconfig.production.json
EXPOSE 5000
ENV TS_CONFIG_PATH=./tsconfig.production.json
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
