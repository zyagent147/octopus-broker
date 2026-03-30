# 微信云托管部署配置 - 章鱼经纪人
# 适用于构建上下文为项目根目录的情况
# 在云托管控制台配置：
#   Dockerfile路径: server/Dockerfile
#   构建上下文: . (项目根目录)

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖和 pnpm
RUN apk add --no-cache python3 py3-pip curl bash && \
    pip3 install --no-cache-dir --break-system-packages coze-workload-identity || true && \
    corepack enable && corepack prepare pnpm@latest --activate

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# ===== 从项目根目录复制文件 =====
# 复制 package 文件（根目录和 server 目录）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源代码和配置
COPY server/ ./server/
COPY tsconfig.json ./

# 构建项目
WORKDIR /app/server
RUN pnpm build

# 删除开发依赖，只保留生产依赖
RUN pnpm prune --prod

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/main.js"]
