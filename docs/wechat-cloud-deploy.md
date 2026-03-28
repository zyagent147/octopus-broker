# 微信云托管部署指南

## 📋 前置要求

1. 已开通微信云托管服务
2. 已创建云托管环境（环境ID: `prod-9gchot580b331407`）
3. 已创建云托管服务（服务名: `express-xhvf`）

## 🚀 部署步骤

### 1. 配置环境变量

在微信云托管控制台配置以下环境变量：

```bash
# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# Supabase 数据库配置
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# 对象存储配置
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET=your-s3-bucket
S3_REGION=your-s3-region
S3_ENDPOINT=your-s3-endpoint
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

1. **文件上传**：云托管调用不支持文件上传，需要使用传统 HTTP 方式或微信云存储

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
