# 微信云托管部署
FROM node:20-slim

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm（设置超时）
RUN npm install -g pnpm@9 --prefer-offline

COPY package.json pnpm-lock.yaml ./

# 安装依赖（忽略脚本，避免 native 模块编译失败）
RUN pnpm install --ignore-scripts --no-frozen-lockfile || \
    pnpm install --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
COPY nest-cli.json ./

# 构建项目
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
