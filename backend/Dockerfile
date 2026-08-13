FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev --no-optional --prefer-offline --no-audit --no-fund

COPY . .

RUN npx tsc

EXPOSE 5000

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
