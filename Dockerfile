# 微信云托管部署 - 章鱼经纪人
# 使用多阶段构建，减小镜像体积

# ====================
# 阶段1: 构建
# ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 安装依赖（包括 devDependencies）
RUN pnpm install

# 复制源代码
COPY server/ ./server/
COPY tsconfig.json ./

# 构建项目
WORKDIR /app/server
RUN pnpm build

# ====================
# 阶段2: 运行
# ====================
FROM node:20-alpine

WORKDIR /app

# 只复制运行时需要的文件
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./package.json

# 安装运行时依赖
RUN apk add --no-cache curl bash postgresql-client

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

CMD ["node", "dist/main.js"]
