# 微信云托管部署
FROM node:20-slim

WORKDIR /app

# 复制 .npmrc 和 package.json
COPY .npmrc package.json ./

# 安装指定版本的 pnpm
RUN npm install -g pnpm@8.15.0

# 安装依赖（使用国内镜像，跳过 frozen-lockfile）
RUN pnpm install --no-frozen-lockfile

COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY nest-cli.json ./
COPY src/ ./src/

# 构建
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
