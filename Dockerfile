# 微信云托管部署 - 章鱼经纪人
# 放在项目根目录，Dockerfile 路径填写: Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 py3-pip curl bash postgresql-client

# 安装 pnpm
RUN npm install -g pnpm@9

ENV NODE_ENV=production
ENV PORT=3000

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY server/ ./server/
COPY tsconfig.json ./

# 构建项目
WORKDIR /app/server
RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main.js"]
