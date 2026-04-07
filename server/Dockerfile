# 微信云托管部署 - server 目录
# 此文件用于本地构建，部署时请使用根目录的 Dockerfile
FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json nest-cli.json ./
COPY src/ ./src/

RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
