# 微信云托管部署 - 章鱼经纪人后端
# 使用多阶段构建，端口 80

# ====================
# 阶段1: 构建
# ====================
FROM node:20 AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖（--ignore-scripts 避免 postinstall 脚本问题）
RUN npm install -g pnpm@9 && \
    pnpm install --no-frozen-lockfile --ignore-scripts

# 复制源代码
COPY tsconfig.json ./
COPY src/ ./src/
COPY nest-cli.json ./

# 构建
RUN pnpm build

# ====================
# 阶段2: 运行
# ====================
FROM node:20-slim

WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# 健康检查 - 注意 NestJS 使用 /api 前缀
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
