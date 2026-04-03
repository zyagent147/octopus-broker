# 🚀 微信云托管快速部署

## ⚠️ 重要：构建配置

### 正确的构建配置

| 配置项 | 填写内容 | 说明 |
|--------|---------|------|
| **Dockerfile 路径** | `server/Dockerfile` | 注意是相对路径 |
| **构建上下文** | `.` | 项目根目录，不是 server 目录 |

### 配置示意

```
┌─────────────────────────────────────────────────────────────┐
│  构建配置                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dockerfile 路径:  [ server/Dockerfile        ]  ← 必须这样填│
│                                                              │
│  构建上下文:       [ .                         ]  ← 项目根目录│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 环境变量（复制到微信云托管控制台）

```
WX_APP_ID=your-wechat-app-id
WX_APP_SECRET=your-wechat-app-secret
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=30d
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=your-cos-secret-key
COS_BUCKET_NAME=your-cos-bucket-name
COS_REGION=ap-shanghai
COZE_SUPABASE_URL=your-supabase-url
COZE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 三步部署

### 第一步：创建云托管服务

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「云托管」→「服务管理」→「新建服务」
3. 服务名称：`octopus-broker`

### 第二步：配置构建参数

⚠️ **关键配置**：
- Dockerfile 路径：`server/Dockerfile`
- 构建上下文：`.`

### 第三步：配置环境变量

复制上方环境变量到控制台

---

## 📖 详细文档

| 文档 | 说明 |
|------|------|
| [构建配置说明](./wechat-cloud-build-config.md) | 解决构建失败问题 |
| [详细配置指南](./wechat-cloud-settings.md) | 所有配置项说明 |
| [完整部署指南](./wechat-cloud-deploy-guide.md) | 端到端部署流程 |

---

## 🆘 构建失败？

1. 确认 Dockerfile 路径：`server/Dockerfile`
2. 确认构建上下文：`.` (项目根目录)
3. 查看完整错误日志
4. 参考 [构建配置说明](./wechat-cloud-build-config.md)
