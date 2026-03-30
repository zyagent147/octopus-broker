# 微信云托管部署配置 - 章鱼经纪人
# 多阶段构建，优化镜像大小

# ================================
# 阶段1: 安装依赖
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# 安装 pnpm 和 Python（用于 coze_workload_identity）
RUN apk add --no-cache python3 py3-pip && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

# 复制根目录的 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# ================================
# 阶段2: 构建
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# 复制源代码
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/ ./server/
COPY tsconfig.json ./

# 构建
WORKDIR /app/server
RUN pnpm build

# ================================
# 阶段3: 生产镜像
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 Python 和必要工具（用于 coze_workload_identity）
RUN apk add --no-cache python3 py3-pip curl && \
    pip3 install --no-cache-dir --break-system-packages coze-workload-identity

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./

# 设置权限
RUN chown -R nestjs:nodejs /app

# 切换用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/hello || exit 1

# 启动服务
CMD ["node", "dist/main.js"]
