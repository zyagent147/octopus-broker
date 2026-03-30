# 微信云托管部署完整指南

## 📋 部署前准备

### 1. 必需账号和服务

| 服务 | 用途 | 获取方式 |
|------|------|---------|
| 微信小程序 | 前端应用 | [微信公众平台](https://mp.weixin.qq.com) |
| 微信云托管 | 后端服务部署 | 微信公众平台 → 云托管 |
| 腾讯云 COS | 文件存储 | [腾讯云控制台](https://console.cloud.tencent.com/cos) |
| Supabase | 数据库 | [Supabase](https://supabase.com) 或 Coze 平台 |

### 2. 获取配置信息

#### 微信小程序信息
```
AppID: wxd244b605ba704aab
AppSecret: ca31d883d8f0587be93e9a10a8b8b85d
```

#### 腾讯云 COS 信息
```
SecretId: your-cos-secret-id
SecretKey: xgpkRt89wVt40gHoJeAczLcgX9WhiU0G
Bucket: 7072-prod-9gchot580b331407-1416950024
Region: ap-shanghai
```

#### Supabase 数据库信息（需要获取）
- **方式一**：从 Coze 平台获取
  1. 登录 Coze 平台
  2. 进入项目设置
  3. 查找 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY`

- **方式二**：自建 Supabase
  1. 访问 https://supabase.com 创建项目
  2. 在项目设置 → API 中获取 URL 和 anon key
  3. 运行数据库迁移脚本

---

## 🚀 部署步骤

### 第一步：创建微信云托管服务

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「云托管」→「服务管理」
3. 点击「新建服务」
4. 填写服务信息：
   - 服务名称：`octopus-broker`（或自定义）
   - 服务描述：章鱼经纪人后端服务

### 第二步：配置环境变量

在云托管服务中配置以下环境变量：

```bash
# 微信小程序配置
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d

# JWT 配置
JWT_SECRET=zhangyu-broker-jwt-secret-2024-production
JWT_EXPIRES_IN=30d

# 腾讯云 COS 存储
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=xgpkRt89wVt40gHoJeAczLcgX9WhiU0G
COS_BUCKET_NAME=7072-prod-9gchot580b331407-1416950024
COS_REGION=ap-shanghai

# Supabase 数据库（需要替换为实际值）
COZE_SUPABASE_URL=your-supabase-url
COZE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 第三步：上传代码部署

#### 方式一：本地上传（推荐）

1. 构建 Docker 镜像：
```bash
cd server
docker build -t octopus-broker .
```

2. 上传镜像到腾讯云容器镜像服务：
```bash
# 登录腾讯云容器镜像服务
docker login ccr.ccs.tencentyun.com

# 标记镜像
docker tag octopus-broker ccr.ccs.tencentyun.com/your-namespace/octopus-broker:v1.0.0

# 推送镜像
docker push ccr.ccs.tencentyun.com/your-namespace/octopus-broker:v1.0.0
```

3. 在云托管控制台选择镜像部署

#### 方式二：代码库拉取

1. 在云托管控制台选择「代码库拉取」
2. 授权 GitHub/GitLab
3. 选择代码仓库
4. 配置构建参数：
   - Dockerfile 路径：`server/Dockerfile`
   - 构建上下文：`server`

### 第四步：配置服务参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 实例规格 | 0.5核 512MB | 初期配置 |
| 最小实例数 | 1 | 避免冷启动 |
| 最大实例数 | 5 | 自动扩容上限 |
| 端口 | 3000 | 服务端口 |
| 健康检查 | /api/hello | 健康检查路径 |

### 第五步：更新小程序配置

修改 `src/config/cloud.ts`：

```typescript
export const WX_CLOUD_CONFIG = {
  env: '你的云托管环境ID',     // 从云托管控制台获取
  service: 'octopus-broker',   // 你的服务名
  enabled: true,
}
```

### 第六步：构建并上传小程序

```bash
# 构建小程序
pnpm build:weapp

# 使用微信开发者工具上传
# 或使用 miniprogram-ci 自动化上传
```

---

## 🔍 验证部署

### 1. 检查服务状态

在云托管控制台确认：
- [ ] 服务状态为「运行中」
- [ ] 实例健康检查通过
- [ ] 日志无错误信息

### 2. 测试接口

```bash
# 获取服务访问地址
curl https://your-service-url/api/hello

# 应返回
{"code":200,"msg":"Hello from Octopus Broker!","data":null}
```

### 3. 小程序测试

在微信开发者工具中：
1. 添加合法域名：`https://your-service-url`
2. 真机调试测试云托管调用
3. 验证登录、数据读写功能

---

## ⚠️ 常见问题

### Q1: Supabase 连接失败

**解决方案**：
1. 确认环境变量 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY` 已正确配置
2. 检查 Supabase 项目是否暂停（免费版会自动暂停）
3. 确认 Supabase 项目的连接池设置

### Q2: 图片上传失败

**解决方案**：
1. 确认 COS 配置正确
2. 检查 COS Bucket 权限设置
3. 确认 SecretId/SecretKey 有正确的权限

### Q3: 服务冷启动慢

**解决方案**：
1. 设置最小实例数为 1
2. 优化镜像大小
3. 开启镜像缓存

### Q4: 小程序调用超时

**解决方案**：
1. 检查服务是否正常运行
2. 确认云托管环境 ID 配置正确
3. 检查小程序合法域名配置

---

## 📊 成本估算

### 微信云托管费用（参考）

| 配置 | 预估月费用 |
|------|-----------|
| 0.5核 512MB × 1实例 | ¥30-50 |
| 流量费用 | ¥0.8/GB |

### 腾讯云 COS 费用（参考）

| 项目 | 单价 |
|------|------|
| 存储空间 | ¥0.118/GB/月 |
| 外网下行流量 | ¥0.5/GB |

### Supabase 费用

- 免费版：500MB 数据库，1GB 文件存储
- Pro 版：$25/月，8GB 数据库，100GB 文件存储

---

## 🔄 更新部署

### 更新后端服务

```bash
# 修改代码后重新构建
cd server
docker build -t octopus-broker:v1.0.1 .

# 推送新版本
docker push ccr.ccs.tencentyun.com/your-namespace/octopus-broker:v1.0.1

# 在云托管控制台发布新版本
```

### 更新小程序

```bash
# 构建新版本
pnpm build:weapp

# 上传审核
```

---

## 📞 技术支持

遇到问题可以通过以下方式获取帮助：
- 微信云托管文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/
- 项目 GitHub Issues
