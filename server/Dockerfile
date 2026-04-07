# 微信云托管部署配置 - 章鱼经纪人
# 简化为单层结构，兼容 server/Dockerfile 路径

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 py3-pip curl bash postgresql-client && \
    pip3 install --no-cache-dir --break-system-packages coze-workload-identity || true && \
    corepack enable && corepack prepare pnpm@latest --activate

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY server/ ./server/
COPY tsconfig.json ./
COPY patches/ ./patches/ 2>/dev/null || true

# 构建项目
WORKDIR /app/server
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["sh", "-c", "cd /app/server && node dist/main.js"]
