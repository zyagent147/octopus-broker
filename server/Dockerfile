# 微信云托管部署 - 简化版
FROM node:20-slim

WORKDIR /app

# 设置镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm@9 && \
    pnpm install --ignore-scripts

# 复制源代码
COPY tsconfig.json ./
COPY src/ ./src/
COPY nest-cli.json ./

# 构建
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
