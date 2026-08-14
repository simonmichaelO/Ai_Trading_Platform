FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx tsc || true

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.production.json ./tsconfig.json
EXPOSE 5000
CMD ["node", "-r", "./bootstrap.js", "-r", "tsconfig-paths/register", "dist/server.js"]
