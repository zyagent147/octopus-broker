# 微信云托管部署配置 - 章鱼经纪人
# 放在项目根目录，简化构建配置

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖和 pnpm
RUN apk add --no-cache python3 py3-pip curl bash && \
    pip3 install --no-cache-dir --break-system-packages coze-workload-identity || true && \
    corepack enable && corepack prepare pnpm@9.0.0 --activate

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 复制 patches 目录（必需）
COPY patches/ ./patches/

# 安装所有依赖（生产环境使用 frozen-lockfile）
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码和配置
COPY server/ ./server/
COPY tsconfig.json ./

# 构建项目
WORKDIR /app/server
RUN pnpm build

# 删除开发依赖
RUN pnpm prune --prod

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/main.js"]
