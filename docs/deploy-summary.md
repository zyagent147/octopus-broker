# 🚀 微信云托管快速部署

## 一键配置清单

### 环境变量（复制到微信云托管控制台）

```
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d
JWT_SECRET=zhangyu-broker-jwt-secret-2024-production
JWT_EXPIRES_IN=30d
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=xgpkRt89wVt40gHoJeAczLcgX9WhiU0G
COS_BUCKET_NAME=7072-prod-9gchot580b331407-1416950024
COS_REGION=ap-shanghai
COZE_SUPABASE_URL=https://br-right-kea-1c046413.supabase2.aidap-global.cn-beijing.volces.com
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTUxOTc1MTEsInJvbGUiOiJhbm9uIn0.fhHIWFyG7cuJJhcbgJrnqhBgcUmVup-THZe_HhihcO8
```

## 三步部署

### 第一步：创建云托管服务

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「云托管」→「服务管理」→「新建服务」
3. 服务名称：`octopus-broker`

### 第二步：配置并部署

1. 在服务设置中添加上方环境变量
2. 选择「本地上传」或「代码库拉取」
3. 使用 `server/Dockerfile` 构建

### 第三步：更新小程序

1. 修改 `src/config/cloud.ts` 中的 `env` 为你的云托管环境ID
2. 运行 `pnpm build:weapp`
3. 上传小程序审核

## 详细文档

- [完整部署指南](./wechat-cloud-deploy-guide.md)
- [环境变量模板](../server/.env.production.example)
