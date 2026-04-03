# 🚀 章鱼经纪人 - 生产环境部署指南

## 📋 目录

- [数据库持久化存储](#数据库持久化存储)
- [环境变量配置](#环境变量配置)
- [生产环境域名和 HTTPS](#生产环境域名和-https)
- [安全配置](#安全配置)
- [部署步骤](#部署步骤)
- [验证清单](#验证清单)

---

## 🗄️ 数据库持久化存储

### ✅ 已完成配置

**1. Supabase 数据库已集成**
- 项目已配置 Supabase 客户端（`server/src/storage/database/supabase-client.ts`）
- 已创建所有业务表（用户、客户、房源、租约、账单等）
- 已配置 RLS（Row Level Security）策略，确保数据隔离

**2. 数据表清单**

| 表名 | 用途 | RLS 策略 |
|-----|------|---------|
| `users` | 用户表 | 场景 D：用户私有数据 |
| `customers` | 客户表 | 场景 D：用户私有数据 |
| `follow_ups` | 跟进记录表 | 场景 D：用户私有数据 |
| `properties` | 房源表 | 场景 D：用户私有数据 |
| `leases` | 租约表 | 场景 D：用户私有数据 |
| `bills` | 账单表 | 场景 D：用户私有数据 |
| `reminders` | 提醒表 | 场景 D：用户私有数据 |
| `providers` | 服务商表 | 场景 A：公开读取 |
| `services` | 服务记录表 | 场景 D：用户私有数据 |
| `service_requests` | 服务需求表 | 场景 D：用户私有数据 |
| `user_settings` | 用户设置表 | 场景 D：用户私有数据 |

**3. 数据隔离机制**

- 每个经纪人只能访问自己创建的数据
- 服务商信息对所有用户公开（仅读取）
- 使用 PostgreSQL RLS 策略实现数据库层面的权限控制

**4. 数据库迁移已完成**

```bash
# 已执行命令
coze-coding-ai db upgrade

# 输出结果
✔ Database schema updated successfully
```

### 📝 数据库使用说明

**在代码中使用数据库：**

```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 服务端操作（绕过 RLS）
const client = getSupabaseClient()

// 带用户认证操作（受 RLS 约束）
const client = getSupabaseClient(token)

// 查询示例
const { data, error } = await client
  .from('customers')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) throw new Error(`查询失败: ${error.message}`)
```

**关键规范：**
- ✅ 字段名使用 `snake_case`（如 `user_id`）
- ✅ 每次操作必须检查 `error` 并处理
- ✅ 使用 `.maybeSingle()` 查询单条记录
- ❌ 禁止使用 `select('*')`，只查询需要的字段
- ❌ 禁止在循环中查询（N+1 问题）

---

## 🔐 环境变量配置

### 1. 必需环境变量

**在 `server/.env` 文件中配置：**

```bash
# ==================== 微信小程序配置 ====================
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d

# ==================== JWT 密钥配置 ====================
# ⚠️ 警告：生产环境必须修改为强密码！
# 建议使用：openssl rand -base64 32
JWT_SECRET=your-super-strong-jwt-secret-key-at-least-32-chars-long

# ==================== Supabase 数据库配置 ====================
# 由 Coze 平台自动注入，无需手动配置
# COZE_SUPABASE_URL=your-supabase-url
# COZE_SUPABASE_ANON_KEY=your-supabase-anon-key
# COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 环境变量说明

| 变量名 | 说明 | 获取方式 |
|-------|------|---------|
| `WX_APP_ID` | 微信小程序 AppID | 已配置 |
| `WX_APP_SECRET` | 微信小程序 AppSecret | 已配置 |
| `JWT_SECRET` | JWT 签名密钥 | **必须修改！** |
| `COZE_SUPABASE_URL` | Supabase 项目 URL | Coze 平台自动注入 |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Coze 平台自动注入 |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | Coze 平台自动注入 |

### 3. 生成强密码 JWT_SECRET

**方法一：使用 OpenSSL（推荐）**
```bash
openssl rand -base64 32
```

**方法二：使用 Node.js**
```javascript
const crypto = require('crypto')
console.log(crypto.randomBytes(32).toString('base64'))
```

**方法三：在线生成**
访问：https://www.uuidgenerator.net/ 生成 UUID 并拼接

**示例输出：**
```
K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

---

## 🌐 生产环境域名和 HTTPS

### 1. 微信小程序域名配置

**登录微信小程序后台：**
https://mp.weixin.qq.com

**配置路径：**
开发 → 开发管理 → 服务器域名

**必须配置的域名：**

| 域名类型 | 说明 | 示例 |
|---------|------|------|
| request 合法域名 | API 接口域名 | `https://api.yourdomain.com` |
| uploadFile 合法域名 | 文件上传域名 | `https://upload.yourdomain.com` |
| downloadFile 合法域名 | 文件下载域名 | `https://download.yourdomain.com` |

**配置要求：**
- ✅ 必须使用 HTTPS 协议
- ✅ 域名必须经过 ICP 备案
- ✅ 域名不能使用 IP 地址或端口号
- ✅ 不支持通配符域名

### 2. HTTPS 证书配置

**方案一：使用 Let's Encrypt（免费）**

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

**方案二：使用阿里云/腾讯云 SSL 证书**

1. 登录云服务商控制台
2. 申请免费 SSL 证书（有效期 1 年）
3. 下载 Nginx 格式证书
4. 配置到服务器

**Nginx 配置示例：**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. 域名解析配置

**在域名服务商配置 DNS 解析：**

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|-------|-----|
| A | api | 服务器IP | 600 |
| A | upload | 服务器IP | 600 |
| CNAME | www | yourdomain.com | 600 |

---

## 🔒 安全配置

### 1. 修改默认密钥（必做）

**⚠️ 严重安全警告：**
当前 JWT_SECRET 使用弱密码，生产环境**必须修改**！

**修改步骤：**

1. **生成新密钥**
```bash
openssl rand -base64 32
```

2. **更新 server/.env**
```bash
# 替换为新生成的密钥
JWT_SECRET=你生成的强密码密钥
```

3. **重启服务**
```bash
# 重启后端服务
pnpm build:server
# 重启应用
pm2 restart your-app-name
```

**影响范围：**
- ⚠️ 所有已登录用户的 token 将失效，需要重新登录
- ✅ 不影响数据库中的数据

### 2. CORS 安全配置

**在 `server/src/main.ts` 中配置：**

```typescript
app.enableCors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://mp.weixin.qq.com', // 微信小程序
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

### 3. 安全响应头配置

**使用 Helmet 中间件：**

```bash
pnpm add helmet --filter server
```

**在 `server/src/main.ts` 中启用：**

```typescript
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.use(helmet())
  
  await app.listen(3000)
}
```

### 4. 速率限制（防暴力破解）

**安装依赖：**

```bash
pnpm add @nestjs/throttler --filter server
```

**在 `server/src/app.module.ts` 中配置：**

```typescript
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 时间窗口：60秒
      limit: 10,     // 限制次数：10次
    }]),
    // ... 其他模块
  ],
})
export class AppModule {}
```

### 5. 敏感信息保护

**禁止事项：**
- ❌ 禁止在代码中硬编码密钥
- ❌ 禁止将 `.env` 文件提交到 Git
- ❌ 禁止在前端暴露 `service_role_key`
- ❌ 禁止在日志中输出用户敏感信息

**最佳实践：**
- ✅ 使用环境变量管理密钥
- ✅ `.gitignore` 中添加 `.env`
- ✅ 前端只使用 `anon_key`
- ✅ 日志脱敏处理

---

## 🚀 部署步骤

### 方案一：使用 Coze 平台自动部署（推荐）

**1. 构建项目**

```bash
# 构建所有平台
pnpm build

# 或单独构建
pnpm build:server    # 构建后端
pnpm build:weapp     # 构建微信小程序
pnpm build:web       # 构建 H5
```

**2. 部署到 Coze 平台**

```bash
# 项目会自动部署到 Coze 云服务
# 访问地址：
# - H5: https://your-app-id.dev.coze.site
# - 后端 API: https://your-app-id.dev.coze.site/api
```

**3. 配置微信小程序**

在微信开发者工具中：
1. 导入项目（dist-weapp 目录）
2. 配置服务器域名
3. 上传代码并提交审核

### 方案二：自建服务器部署

**1. 服务器要求**

- CPU: 2核及以上
- 内存: 4GB 及以上
- 存储: 40GB 及以上
- 系统: Ubuntu 20.04 LTS
- Node.js: v18.x 及以上
- PostgreSQL: 14.x 及以上（如使用 Supabase 则不需要）

**2. 安装依赖**

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（进程管理器）
npm install -g pm2
```

**3. 部署后端**

```bash
# 克隆代码
git clone your-repo-url
cd your-project

# 安装依赖
pnpm install

# 配置环境变量
cp server/.env.example server/.env
vim server/.env  # 编辑配置文件

# 构建项目
pnpm build:server

# 启动服务
pm2 start server/dist/main.js --name "octopus-broker-api"

# 保存 PM2 配置
pm2 save
pm2 startup
```

**4. 配置 Nginx 反向代理**

```nginx
# /etc/nginx/sites-available/api.yourdomain.com
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**5. 部署前端（H5）**

```bash
# 构建 H5
pnpm build:web

# 将 dist-web 目录上传到服务器
scp -r dist-web/* user@server:/var/www/h5/

# Nginx 配置静态文件服务
server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;

    root /var/www/h5;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ✅ 验证清单

### 部署前检查

**环境配置：**
- [ ] 已修改 JWT_SECRET 为强密码
- [ ] 已配置微信小程序 AppID 和 AppSecret
- [ ] 已配置 HTTPS 证书
- [ ] 已在微信后台配置服务器域名
- [ ] 已配置 CORS 白名单

**安全检查：**
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 敏感信息未暴露在前端代码中
- [ ] 数据库 RLS 策略已配置
- [ ] API 接口有权限验证

**功能检查：**
- [ ] 微信登录功能正常
- [ ] 客户管理 CRUD 正常
- [ ] 房源管理 CRUD 正常
- [ ] 租约和账单生成正常
- [ ] 服务商管理正常

### 部署后验证

**API 验证：**

```bash
# 测试后端健康检查
curl https://api.yourdomain.com/api/hello

# 测试开发模式登录
curl -X POST https://api.yourdomain.com/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'
```

**前端验证：**
- [ ] H5 页面可正常访问
- [ ] 小程序可正常打开
- [ ] 登录功能正常
- [ ] 数据可正常显示

**性能验证：**
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 图片加载正常
- [ ] 无内存泄漏

---

## 🆘 常见问题

### 1. 数据库连接失败

**问题：** `Failed to connect to Supabase`

**解决方案：**
```bash
# 检查环境变量
echo $COZE_SUPABASE_URL
echo $COZE_SUPABASE_ANON_KEY

# 检查网络连接
ping your-project.supabase.co
```

### 2. 微信登录失败

**问题：** `code无效` 或 `获取openid失败`

**解决方案：**
- 检查 `WX_APP_ID` 和 `WX_APP_SECRET` 是否正确
- 确认小程序已发布或添加体验版权限
- 检查微信后台服务器域名配置

### 3. RLS 权限错误

**问题：** `new row violates row-level security policy`

**解决方案：**
```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 临时禁用 RLS（仅用于调试）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 重新启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 4. HTTPS 证书问题

**问题：** 小程序提示"不在以下 request 合法域名列表中"

**解决方案：**
- 确认域名已配置 HTTPS
- 确认证书有效且未过期
- 在微信后台配置合法域名
- 小程序开发工具勾选"不校验合法域名"（仅开发环境）

---

## 📞 技术支持

如遇到部署问题，请检查：
1. 后端日志：`tail -f /var/log/pm2/octopus-broker-api.log`
2. Nginx 日志：`tail -f /var/log/nginx/error.log`
3. Supabase 日志：登录 Supabase 控制台查看

---

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [NestJS 官方文档](https://docs.nestjs.com)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Taro 框架文档](https://docs.taro.zone/)

---

**最后更新时间：** 2026-04-03
**版本：** v1.0.0
