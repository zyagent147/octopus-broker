# 生产环境变量配置清单

## 微信云托管环境变量配置

在微信云托管控制台 → 服务设置 → 环境变量 中配置以下变量：

### 必需配置（影响登录功能）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `WX_APP_ID` | 微信小程序 AppID | 微信公众平台 → 开发 → 开发设置 |
| `WX_APP_SECRET` | 微信小程序 AppSecret | 微信公众平台 → 开发 → 开发设置（重置后获取） |
| `JWT_SECRET` | JWT 密钥 | 自定义随机字符串，建议 32 位以上 |

### 必需配置（影响数据库功能）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `COZE_SUPABASE_URL` | Supabase 项目 URL | Supabase 控制台 → Settings → API |
| `COZE_SUPABASE_ANON_KEY` | 匿名密钥 | Supabase 控制台 → Settings → API |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥 | Supabase 控制台 → Settings → API |
| `COZE_SUPABASE_DB_PASSWORD` | 数据库密码（用于建表） | Supabase 控制台 → Settings → Database → Connection string |

### 可选配置（影响文件上传）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `COS_SECRET_ID` | 腾讯云 COS 密钥 ID | 腾讯云控制台 → 访问管理 → API 密钥 |
| `COS_SECRET_KEY` | 腾讯云 COS 密钥 Key | 腾讯云控制台 → 访问管理 → API 密钥 |
| `COS_BUCKET_NAME` | COS 存储桶名称 | 腾讯云 COS 控制台 |
| `COS_REGION` | COS 存储桶地域 | 如 `ap-shanghai` |

## 配置示例

```
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=your_app_secret_here
JWT_SECRET=your_secure_random_string_here

COZE_SUPABASE_URL=https://xxxxxx.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COZE_SUPABASE_DB_PASSWORD=your_database_password_here
```

## 注意事项

1. **WX_APP_SECRET** 非常重要，每次重置后需要同步更新环境变量
2. **COZE_SUPABASE_DB_PASSWORD** 用于服务启动时自动创建数据库表
3. **JWT_SECRET** 用于生成用户登录凭证，请使用强随机字符串
4. 所有密钥请妥善保管，不要提交到代码仓库
