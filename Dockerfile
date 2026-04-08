# 微信云托管部署 - 根目录 Dockerfile
# 代码目标目录: server/
FROM node:20-slim

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json 和 pnpm-lock.yaml
COPY server/package.json server/pnpm-lock.yaml ./
COPY server/.npmrc ./

# 安装 pnpm 和依赖
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile=false

# 复制构建所需文件
COPY server/tsconfig.json ./
COPY server/nest-cli.json ./
COPY server/src/ ./src/
COPY server/.env.production ./.env

# 打印文件列表用于调试
RUN ls -la src/modules/ | head -20

# 构建
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
