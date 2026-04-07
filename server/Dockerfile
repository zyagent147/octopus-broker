# 微信云托管部署
FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

# 注意：需要同时上传根目录的 pnpm-lock.yaml
COPY pnpm-lock.yaml ./
COPY package.json ./

RUN npm install -g pnpm@9 && pnpm install --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
COPY nest-cli.json ./

RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
