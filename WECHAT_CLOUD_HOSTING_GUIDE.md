# 🚀 微信云托管快速部署指南

## 📋 目录

- [为什么选择微信云托管](#为什么选择微信云托管)
- [前置条件](#前置条件)
- [快速部署步骤](#快速部署步骤)
- [环境变量配置](#环境变量配置)
- [数据库集成](#数据库集成)
- [域名和HTTPS配置](#域名和https配置)
- [小程序对接](#小程序对接)
- [常见问题](#常见问题)

---

## ✨ 为什么选择微信云托管

### 核心优势

**1. 零配置 HTTPS**
- ✅ 自动提供 HTTPS 证书
- ✅ 无需购买域名和证书
- ✅ 无需配置 Nginx

**2. 一键部署**
- ✅ 支持 Docker 容器化部署
- ✅ 自动构建和发布
- ✅ 支持灰度发布和回滚

**3. 自动扩缩容**
- ✅ 根据流量自动扩容
- ✅ 流量低时自动缩容省钱
- ✅ 无需手动运维

**4. 微信生态集成**
- ✅ 小程序访问免白名单
- ✅ 微信登录免鉴权
- ✅ 开放能力免申请

**5. 运维监控**
- ✅ 实时日志查看
- ✅ 性能监控
- ✅ 告警通知

### 成本对比

| 方案 | 服务器成本 | HTTPS证书 | 运维成本 | 上线时间 |
|-----|----------|----------|---------|---------|
| **微信云托管** | 按量付费（≈¥30/月） | 免费 | 零运维 | **1小时** |
| 自建服务器 | ¥100+/月 | 免费/付费 | 高 | 1-2天 |
| Coze平台 | 平台配额 | 自动 | 零运维 | 10分钟 |

**结论：** 如果你的应用主要服务微信小程序，**微信云托管是最快、最省心的方案**。

---

## 📦 前置条件

### 必需条件

1. **微信小程序账号**
   - 已注册微信小程序
   - 有开发者权限
   - AppID 和 AppSecret 已获取

2. **数据库准备**
   - ✅ 已集成 Supabase（推荐，RLS 已配置）
   - 或使用微信云数据库（需迁移数据）

3. **代码仓库**
   - 代码已提交到 Git 仓库
   - 支持 GitHub / GitLab / Gitee

### 可选条件

- 自定义域名（如需绑定）
- ICP 备案（自定义域名需要）

---

## 🚀 快速部署步骤

### 第一步：登录微信云托管控制台

1. 访问 [微信云托管控制台](https://cloud.weixin.qq.com/)
2. 使用微信扫码登录
3. 选择你的小程序账号

### 第二步：创建服务

**方式一：代码库导入（推荐）**

1. 点击「新建服务」
2. 选择「代码库」
3. 授权 GitHub/GitLab/Gitee
4. 选择你的代码仓库
5. 配置构建设置：
   ```
   Dockerfile路径: server/Dockerfile
   构建上下文: . (项目根目录)
   ```
6. 点击「开始构建」

**方式二：镜像部署**

```bash
# 1. 本地构建镜像
cd /workspace/projects
docker build -f server/Dockerfile -t octopus-broker-api .

# 2. 推送到镜像仓库
docker tag octopus-broker-api registry.cn-hangzhou.aliyuncs.com/your-namespace/octopus-broker-api
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/octopus-broker-api

# 3. 在微信云托管选择「镜像」部署
```

### 第三步：配置环境变量

**在「服务设置」→「环境变量」中添加：**

```bash
# 必需配置
NODE_ENV=production
PORT=3000

# 微信小程序配置
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d

# JWT 密钥（⚠️ 必须修改！）
JWT_SECRET=<使用 openssl rand -base64 32 生成>

# Supabase 数据库配置
COZE_SUPABASE_URL=https://xxxxx.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**生成 JWT_SECRET：**

```bash
# 方法一：使用 OpenSSL
openssl rand -base64 32

# 方法二：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 示例输出：
K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

### 第四步：配置容器规格

**推荐配置：**

| 配置项 | 推荐值 | 说明 |
|-------|-------|------|
| CPU | 0.5核 | 初期足够 |
| 内存 | 512MB | 初期足够 |
| 最小副本 | 1 | 保证服务可用 |
| 最大副本 | 10 | 自动扩容上限 |

**扩缩容策略：**
- CPU 使用率 > 70% 触发扩容
- 内存使用率 > 80% 触发扩容

### 第五步：配置健康检查

**在「服务设置」→「健康检查」中配置：**

```yaml
存活检查:
  路径: /api/hello
  初始延迟: 30秒
  检查间隔: 10秒
  超时时间: 5秒
  失败阈值: 3次

就绪检查:
  路径: /api/hello
  初始延迟: 10秒
  检查间隔: 5秒
  超时时间: 3秒
  失败阈值: 3次
```

### 第六步：发布服务

1. 点击「发布」按钮
2. 选择「全量发布」或「灰度发布」
3. 等待构建完成（约 3-5 分钟）
4. 查看服务状态

### 第七步：获取访问地址

**发布成功后，微信云托管会自动分配域名：**

```
https://你的服务ID.ap-shanghai.run.tcloudbase.com
```

**测试服务：**

```bash
# 测试健康检查
curl https://你的服务ID.ap-shanghai.run.tcloudbase.com/api/hello

# 测试登录
curl -X POST https://你的服务ID.ap-shanghai.run.tcloudbase.com/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'
```

---

## 🔧 环境变量配置

### 必需环境变量清单

| 变量名 | 说明 | 获取方式 |
|-------|------|---------|
| `NODE_ENV` | 运行环境 | 固定值：`production` |
| `PORT` | 服务端口 | 固定值：`3000` |
| `WX_APP_ID` | 小程序 AppID | 已配置 |
| `WX_APP_SECRET` | 小程序 AppSecret | 已配置 |
| `JWT_SECRET` | JWT 签名密钥 | **必须生成强密码** |
| `COZE_SUPABASE_URL` | Supabase 项目 URL | Coze 平台 |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Coze 平台 |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | Coze 平台 |

### 获取 Supabase 配置

**方式一：从 Coze 平台获取**

1. 登录 Coze 平台
2. 进入你的项目
3. 查看「环境变量」配置
4. 复制 Supabase 相关变量

**方式二：从 Supabase 控制台获取**

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入「Settings」→「API」
4. 复制：
   - Project URL → `COZE_SUPABASE_URL`
   - anon public → `COZE_SUPABASE_ANON_KEY`
   - service_role → `COZE_SUPABASE_SERVICE_ROLE_KEY`

---

## 🗄️ 数据库集成

### 方案一：继续使用 Supabase（推荐）

**优势：**
- ✅ 无需迁移数据
- ✅ RLS 策略已配置
- ✅ 数据隔离已实现
- ✅ 免费额度充足

**配置步骤：**

1. 在微信云托管配置 Supabase 环境变量
2. 确保后端代码使用环境变量连接
3. 测试数据库连接

**验证连接：**

```bash
# 测试登录接口（会查询数据库）
curl -X POST https://你的服务ID.ap-shanghai.run.tcloudbase.com/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'

# 预期返回：
{
  "code": 200,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

### 方案二：迁移到微信云数据库

**适用场景：**
- 需要微信生态深度集成
- 需要数据库免运维
- 数据量较大（> 1GB）

**迁移步骤：**

1. 在微信云托管创建 PostgreSQL 数据库
2. 导出 Supabase 数据
   ```bash
   pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql
   ```
3. 导入到微信云数据库
4. 修改后端连接配置
5. 重新配置 RLS 策略

**⚠️ 注意：** 迁移后需要重新配置 RLS 策略，工作量大。

---

## 🌐 域名和HTTPS配置

### 使用微信云托管默认域名

**优势：**
- ✅ 无需配置
- ✅ 自动 HTTPS
- ✅ 小程序免白名单

**访问地址：**
```
https://你的服务ID.ap-shanghai.run.tcloudbase.com
```

### 绑定自定义域名

**前置条件：**
- 域名已备案
- 域名解析已配置

**配置步骤：**

1. 在「服务设置」→「域名管理」
2. 点击「添加域名」
3. 输入你的域名（如 `api.yourdomain.com`）
4. 下载验证文件
5. 配置域名解析：
   ```
   CNAME api 你的服务ID.ap-shanghai.run.tcloudbase.com
   ```
6. 等待验证通过
7. HTTPS 证书自动颁发

---

## 📱 小程序对接

### 方式一：使用微信云托管域名（推荐）

**无需配置服务器域名白名单！**

```typescript
// src/network/index.ts
const API_BASE_URL = 'https://你的服务ID.ap-shanghai.run.tcloudbase.com'

export const Network = {
  async request(options: Taro.request.Option) {
    const url = options.url.startsWith('http')
      ? options.url
      : `${API_BASE_URL}${options.url}`

    return Taro.request({
      ...options,
      url,
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
    })
  },
}
```

### 方式二：使用自定义域名

**需要在微信后台配置服务器域名：**

1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 开发 → 开发管理 → 服务器域名
3. 添加 `request 合法域名`：
   ```
   https://api.yourdomain.com
   ```

**前端配置：**

```typescript
const API_BASE_URL = 'https://api.yourdomain.com'
```

### 测试小程序连接

```typescript
// 在小程序中测试
import { Network } from '@/network'

// 测试健康检查
const res = await Network.request({
  url: '/api/hello'
})
console.log('服务状态:', res.data)

// 测试登录
const loginRes = await Network.request({
  url: '/api/auth/dev-login',
  method: 'POST',
  data: { devCode: 'DEV2024' }
})
console.log('登录结果:', loginRes.data)
```

---

## ❓ 常见问题

### 1. 构建失败：Dockerfile 路径错误

**问题：** `Dockerfile not found`

**解决方案：**
- 确认 Dockerfile 路径为 `server/Dockerfile`
- 确认构建上下文为 `.`（项目根目录）
- 检查 Dockerfile 是否已提交到 Git

### 2. 构建失败：依赖安装超时

**问题：** `pnpm install timeout`

**解决方案：**
```dockerfile
# 在 Dockerfile 中添加淘宝镜像
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm install --frozen-lockfile
```

### 3. 服务启动失败：环境变量缺失

**问题：** `JWT_SECRET is not defined`

**解决方案：**
- 在微信云托管控制台检查环境变量配置
- 确认所有必需变量都已添加
- 重启服务使环境变量生效

### 4. 数据库连接失败

**问题：** `Failed to connect to Supabase`

**解决方案：**
```bash
# 检查环境变量
COZE_SUPABASE_URL=https://xxxxx.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGci...

# 测试连接
curl https://xxxxx.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

### 5. 小程序请求失败

**问题：** `request:fail url not in domain list`

**解决方案：**
- 方案一：使用微信云托管域名（免白名单）
- 方案二：在微信后台添加服务器域名
- 开发环境可勾选「不校验合法域名」

### 6. 自动扩缩容不生效

**问题：** 服务不会自动扩容

**解决方案：**
- 检查扩缩容配置是否启用
- 检查 CPU/内存阈值设置
- 确认流量是否达到阈值
- 查看服务监控数据

---

## 📊 成本估算

### 微信云托管计费

**按量付费模式：**

| 资源 | 单价 | 预估用量/月 | 费用 |
|-----|------|-----------|------|
| CPU | ¥0.055/核/小时 | 360小时 (0.5核) | ¥9.9 |
| 内存 | ¥0.015/GB/小时 | 360小时 (0.5GB) | ¥2.7 |
| 流量 | ¥0.8/GB | 10GB | ¥8 |
| **合计** | - | - | **≈¥20/月** |

**包年包月模式：**

| 规格 | 月费 | 适用场景 |
|-----|------|---------|
| 0.5核 512MB | ¥30 | 个人项目、测试 |
| 1核 1GB | ¥60 | 小型项目 |
| 2核 2GB | ¥120 | 中型项目 |

**结论：** 个人项目预估成本 **¥20-30/月**，远低于自建服务器。

---

## ✅ 部署验证清单

### 部署前检查

- [ ] 环境变量已配置完整
- [ ] JWT_SECRET 已修改为强密码
- [ ] 数据库连接配置正确
- [ ] Dockerfile 已提交到 Git

### 部署后验证

- [ ] 服务状态为「运行中」
- [ ] 健康检查通过
- [ ] API 接口可正常访问
- [ ] 登录功能正常
- [ ] 数据库查询正常

### 小程序对接验证

- [ ] 小程序可正常请求 API
- [ ] 登录功能正常
- [ ] 数据展示正常
- [ ] 上传功能正常

---

## 🎯 下一步

部署成功后：

1. **配置监控告警**
   - 设置 CPU/内存告警阈值
   - 配置错误日志告警

2. **性能优化**
   - 开启 CDN 加速
   - 优化数据库查询
   - 启用 Redis 缓存（如需要）

3. **安全加固**
   - 配置 IP 白名单（如需要）
   - 启用 WAF（如需要）
   - 定期更新依赖

---

## 📚 相关文档

- [微信云托管官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/)
- [Docker 官方文档](https://docs.docker.com/)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Supabase 官方文档](https://supabase.com/docs)

---

**最后更新时间：** 2026-04-03
**版本：** v1.0.0
