# 微信云托管部署配置
# 构建命令: docker build -t octopus-broker .
# 运行命令: docker run -p 3000:3000 octopus-broker

# ================================
# 阶段1: 构建依赖
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 package 文件
COPY server/package.json ./
COPY pnpm-lock.yaml ../
COPY pnpm-workspace.yaml ../

# 安装依赖
RUN pnpm install --prod --frozen-lockfile

# ================================
# 阶段2: 构建
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 package 文件
COPY server/package.json ./
COPY pnpm-lock.yaml ../
COPY pnpm-workspace.yaml ../

# 安装所有依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY server/ ./
COPY server/tsconfig.json ./

# 构建
RUN pnpm build

# ================================
# 阶段3: 生产镜像
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/main.js"]
