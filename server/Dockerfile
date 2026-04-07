# 微信云托管部署
FROM node:20-slim

WORKDIR /app

# 设置镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装所有依赖（包括 devDependencies，因为需要 @nestjs/cli 构建）
COPY package.json ./
RUN npm install

COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY src/ ./src/
COPY nest-cli.json ./

# 构建
RUN npm run build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
