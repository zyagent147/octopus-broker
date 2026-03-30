# 微信云托管部署指南

## 📋 前置要求

1. 已开通微信云托管服务
2. 已创建云托管环境（环境ID: `prod-9gchot580b331407`）
3. 已创建云托管服务（服务名: `express-xhvf`）
4. 已开通腾讯云 COS 对象存储（桶名: `7072-prod-9gchot580b331407-1416950024`）

## 🚀 部署步骤

### 1. 获取腾讯云 API 密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cam/capi)
2. 访问「访问管理」→「访问密钥」→「API密钥管理」
3. 创建密钥，记录 `SecretId` 和 `SecretKey`

### 2. 配置环境变量

在微信云托管控制台配置以下环境变量：

```bash
# 微信小程序配置
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d

# JWT 配置
JWT_SECRET=zhangyu-broker-jwt-secret-2024-production
JWT_EXPIRES_IN=30d

# 腾讯云 COS 对象存储配置
COS_SECRET_ID=your-secret-id-here
COS_SECRET_KEY=your-secret-key-here
COS_BUCKET_NAME=7072-prod-9gchot580b331407-1416950024
COS_REGION=ap-shanghai

# Supabase 数据库配置（系统自动注入，无需手动配置）
# COZE_SUPABASE_URL=xxx
# COZE_SUPABASE_ANON_KEY=xxx
```

### 2. 构建并推送镜像

#### 方式一：使用微信云托管控制台
1. 进入微信云托管控制台
2. 选择对应服务
3. 点击「新建版本」
4. 选择「代码库拉取」或「本地上传」
5. 选择 `server/Dockerfile` 作为构建文件
6. 点击「构建」

#### 方式二：使用命令行
```bash
# 构建镜像
cd server
docker build -t octopus-broker .

# 标记镜像
docker tag octopus-broker ccr.ccs.tencentyun.com/your-namespace/octopus-broker:latest

# 推送镜像
docker push ccr.ccs.tencentyun.com/your-namespace/octopus-broker:latest
```

### 3. 配置服务

在云托管控制台设置：

| 配置项 | 推荐值 |
|--------|--------|
| 实例规格 | 1核512MB |
| 最小实例数 | 1 |
| 最大实例数 | 5 |
| 端口 | 3000 |
| 健康检查 | `/api/hello` |

### 4. 发布服务

1. 选择构建好的版本
2. 点击「发布」
3. 等待服务启动完成

## 📱 小程序端配置

### 1. 更新云托管配置

修改 `src/config/cloud.ts`：

```typescript
export const WX_CLOUD_CONFIG = {
  env: 'prod-9gchot580b331407',    // 你的云托管环境ID
  service: 'express-xhvf',          // 你的服务名
  enabled: true,
}
```

### 2. 小程序 app.json 配置

确保 `app.json` 中已添加云开发能力：

```json
{
  "cloud": true
}
```

### 3. 编译小程序

```bash
pnpm build:weapp
```

## 🔍 验证部署

### 1. 检查服务状态

在云托管控制台查看：
- 服务是否正常运行
- 实例是否健康
- 日志是否有错误

### 2. 测试接口

在小程序开发者工具中调用：

```javascript
wx.cloud.callContainer({
  config: {
    env: 'prod-9gchot580b331407'
  },
  path: '/api/hello',
  header: {
    'X-WX-SERVICE': 'express-xhvf'
  },
  method: 'GET'
}).then(res => {
  console.log('服务正常:', res)
}).catch(err => {
  console.error('服务异常:', err)
})
```

## ⚠️ 注意事项

1. **文件上传与存储**：
   - 开发环境自动使用 Coze 内置存储（无需额外配置）
   - 生产环境（微信云托管）自动使用腾讯云 COS（需配置 COS_SECRET_ID 和 COS_SECRET_KEY）
   - 系统会通过 `KUBERNETES_SERVICE_HOST` 环境变量自动识别运行环境
   - 图片上传后会返回签名 URL，有效期 7 天（COS）或 30 天（Coze 存储）

2. **跨域问题**：云托管调用不存在跨域问题，因为请求通过微信服务器转发

3. **域名配置**：如果同时支持 H5，需要在微信公众平台配置服务器域名

4. **冷启动**：服务长时间未访问会休眠，首次请求可能较慢（可设置最小实例数为 1 避免）

5. **日志查看**：在云托管控制台的「日志」页面查看服务运行日志

## 📊 监控与告警

建议配置：
- 实例 CPU 使用率告警（>80%）
- 实例内存使用率告警（>80%）
- 请求错误率告警（>5%）
- 响应时间告警（>3s）

## 🔄 CI/CD 自动部署

可配置 GitHub Actions 或其他 CI 工具实现自动部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to WeChat Cloud

on:
  push:
    branches: [main]
    paths:
      - 'server/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Push
        run: |
          # 构建推送逻辑
```
