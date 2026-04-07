# 微信云托管部署 - 章鱼经纪人 v3
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 py3-pip curl bash postgresql-client && \
    pip3 install --no-cache-dir --break-system-packages coze-workload-identity || true && \
    corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY server/ ./server/
COPY tsconfig.json ./

WORKDIR /app/server
RUN pnpm build

EXPOSE 3000

CMD ["sh", "-c", "cd /app/server && node dist/main.js"]
