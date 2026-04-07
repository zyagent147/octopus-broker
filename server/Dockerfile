# 微信云托管部署 - server 目录
FROM node:20-slim

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制依赖文件（从 server/ 目录复制到 /app/）
COPY .npmrc package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

# 复制构建所需文件
COPY tsconfig.json nest-cli.json ./
COPY src/ ./src/

# 构建
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
