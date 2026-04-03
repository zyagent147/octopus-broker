# 🔐 微信云托管环境变量详细配置指南

## 📋 目录

- [环境变量清单](#环境变量清单)
- [详细配置步骤](#详细配置步骤)
- [如何获取每个变量的值](#如何获取每个变量的值)
- [在微信云托管中配置](#在微信云托管中配置)
- [配置验证](#配置验证)
- [常见问题](#常见问题)

---

## 📊 环境变量清单

### 必需环境变量（共 10 个）

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|---------|
| `NODE_ENV` | 运行环境 | `production` | 固定值 |
| `PORT` | 服务端口 | `3000` | 固定值 |
| `WX_APP_ID` | 微信小程序 AppID | `wxd244b605ba704aab` | 已配置 |
| `WX_APP_SECRET` | 微信小程序 AppSecret | `ca31d883d8f0587...` | 微信后台 |
| `JWT_SECRET` | JWT 签名密钥 | `K7gNU3sdo+OL0wN...` | **自己生成** |
| `JWT_EXPIRES_IN` | Token 有效期 | `30d` | 固定值 |
| `COZE_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` | Supabase 控制台 |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJI...` | Supabase 控制台 |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhbGciOiJI...` | Supabase 控制台 |
| `COS_SECRET_ID` | 腾讯云 COS 密钥 ID | `AKIDxxxxx` | 腾讯云控制台 |
| `COS_SECRET_KEY` | 腾讯云 COS 密钥 | `xxxxx` | 腾讯云控制台 |
| `COS_BUCKET_NAME` | COS 存储桶名称 | `bucket-123456` | 腾讯云控制台 |
| `COS_REGION` | COS 地域 | `ap-shanghai` | 固定值 |

---

## 🔧 详细配置步骤

### 一、固定值环境变量（直接填写）

```bash
# 1. 运行环境
NODE_ENV=production

# 2. 服务端口
PORT=3000

# 3. Token 有效期
JWT_EXPIRES_IN=30d

# 4. COS 地域
COS_REGION=ap-shanghai
```

---

### 二、微信小程序配置

#### 1. 获取 AppID 和 AppSecret

**步骤：**

1. 登录微信小程序后台：https://mp.weixin.qq.com/
2. 左侧菜单：开发 → 开发管理
3. 点击「开发设置」标签
4. 找到「开发者ID」区域

**你将看到：**

```
AppID(小程序ID): wxd244b605ba704aab
AppSecret(小程序密钥): ca31d883d8f0587be93e9a10a8b8b85d
```

**⚠️ 如果 AppSecret 显示为空或需要重置：**

1. 点击「AppSecret(小程序密钥)」旁边的「重置」按钮
2. 需要管理员扫码验证
3. 验证通过后，会显示新的 AppSecret
4. **立即复制保存**（只显示一次！）

**配置环境变量：**

```bash
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=你的真实AppSecret
```

---

### 三、JWT 密钥配置（自己生成）

#### 方法一：使用 OpenSSL（推荐）

**在终端执行：**

```bash
openssl rand -base64 32
```

**输出示例：**

```
K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

#### 方法二：使用 Node.js

**在终端执行：**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 方法三：在线生成

访问：https://www.uuidgenerator.net/

生成一个 UUID，然后拼接成密钥：

```
your-jwt-secret-550e8400-e29b-41d4-a716-446655440000
```

**配置环境变量：**

```bash
JWT_SECRET=你生成的强密码密钥
```

**⚠️ 重要：**
- 密钥长度至少 32 个字符
- 不要使用简单密码（如 `123456`、`password`）
- 不要在代码中硬编码密钥
- 生产环境必须使用强密码

---

### 四、Supabase 数据库配置

#### 1. 登录 Supabase 控制台

访问：https://supabase.com/dashboard

#### 2. 选择你的项目

在项目列表中，找到你的项目（项目名称可能是 `octopus-broker` 或其他名称）。

#### 3. 获取项目 URL 和密钥

**步骤：**

1. 点击项目进入
2. 左侧菜单：Settings（设置）→ API
3. 在「Project URL」区域找到：
   ```
   URL: https://br-right-kea-1c046413.supabase.co
   ```
4. 在「Project API keys」区域找到：
   ```
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**⚠️ 重要：**
- `anon public` 是公开密钥，可以暴露给前端
- `service_role secret` 是服务密钥，**绝对不能暴露**，拥有完全权限

#### 4. 配置环境变量

```bash
# Supabase 项目 URL
COZE_SUPABASE_URL=https://你的项目ID.supabase.co

# Supabase 匿名密钥（anon public）
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase 服务密钥（service_role secret）
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 五、腾讯云 COS 配置（可选，如需文件上传功能）

#### 1. 登录腾讯云控制台

访问：https://console.cloud.tencent.com

#### 2. 获取密钥

**步骤：**

1. 点击右上角头像 → 访问管理
2. 左侧菜单：访问密钥 → API 密钥管理
3. 点击「新建密钥」或查看现有密钥
4. 你将看到：
   ```
   SecretId: AKIDxxxxxxxxxxxxxxxxxxxx
   SecretKey: xxxxxxxxxxxxxxxxxxxx
   ```

**⚠️ 安全提醒：**
- 密钥只显示一次，立即保存
- 不要泄露 SecretKey

#### 3. 创建存储桶

**步骤：**

1. 进入对象存储 COS 控制台：https://console.cloud.tencent.com/cos
2. 点击「存储桶列表」→「创建存储桶」
3. 填写信息：
   ```
   名称: octopus-broker-123456（自定义）
   地域: 上海（ap-shanghai）
   访问权限: 公有读、私有写（或私有读写）
   ```
4. 创建成功后，在存储桶列表中看到：
   ```
   存储桶名称: octopus-broker-123456
   地域: ap-shanghai
   ```

#### 4. 配置环境变量

```bash
# 腾讯云 COS 密钥
COS_SECRET_ID=AKIDxxxxx（你的 SecretId）
COS_SECRET_KEY=xxxxx（你的 SecretKey）

# 存储桶配置
COS_BUCKET_NAME=octopus-broker-123456（你的存储桶名称）
COS_REGION=ap-shanghai
```

---

## 🎯 在微信云托管中配置

### 步骤一：打开环境变量配置页面

1. 登录微信云托管控制台：https://cloud.weixin.qq.com/
2. 选择你的服务
3. 点击「服务设置」
4. 点击「环境变量」标签

### 步骤二：添加环境变量

**方式一：逐个添加（推荐新手）**

点击「添加环境变量」按钮，逐个添加：

```
变量名: NODE_ENV
变量值: production

变量名: PORT
变量值: 3000

变量名: WX_APP_ID
变量值: wxd244b605ba704aab

变量名: WX_APP_SECRET
变量值: 你的真实AppSecret

变量名: JWT_SECRET
变量值: 你生成的强密码密钥

变量名: JWT_EXPIRES_IN
变量值: 30d

变量名: COZE_SUPABASE_URL
变量值: https://你的项目ID.supabase.co

变量名: COZE_SUPABASE_ANON_KEY
变量值: eyJhbGciOiJI...

变量名: COZE_SUPABASE_SERVICE_ROLE_KEY
变量值: eyJhbGciOiJI...

变量名: COS_SECRET_ID
变量值: AKIDxxxxx

变量名: COS_SECRET_KEY
变量值: xxxxx

变量名: COS_BUCKET_NAME
变量值: 你的存储桶名称

变量名: COS_REGION
变量值: ap-shanghai
```

**方式二：批量导入（推荐高级用户）**

点击「批量导入」按钮，粘贴以下内容：

```bash
NODE_ENV=production
PORT=3000
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=你的真实AppSecret
JWT_SECRET=你生成的强密码密钥
JWT_EXPIRES_IN=30d
COZE_SUPABASE_URL=https://你的项目ID.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
COS_SECRET_ID=AKIDxxxxx
COS_SECRET_KEY=xxxxx
COS_BUCKET_NAME=你的存储桶名称
COS_REGION=ap-shanghai
```

### 步骤三：保存配置

点击「保存」按钮，环境变量会立即生效。

**⚠️ 注意：**
- 如果服务正在运行，可能需要重启才能加载新的环境变量
- 环境变量修改后，不会自动触发重新部署

---

## ✅ 配置验证

### 方法一：查看服务日志

1. 在微信云托管控制台，点击「日志」标签
2. 重启服务
3. 查看启动日志，确认没有环境变量缺失的错误

### 方法二：测试 API 接口

**测试健康检查：**

```bash
curl https://你的服务域名/api/hello
```

**预期返回：**

```json
{
  "message": "Hello World!"
}
```

**测试登录接口：**

```bash
curl -X POST https://你的服务域名/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'
```

**预期返回：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "xxx",
      "openid": "xxx",
      "nickname": "开发者"
    }
  }
}
```

---

## ❓ 常见问题

### 1. 环境变量配置后不生效？

**原因：** 服务未重启

**解决：**
- 在微信云托管控制台，点击「重启服务」
- 或重新发布新版本

### 2. 服务启动失败：JWT_SECRET is not defined？

**原因：** JWT_SECRET 未配置或配置错误

**解决：**
1. 检查环境变量名称是否正确（区分大小写）
2. 检查变量值是否为空
3. 保存后重启服务

### 3. 数据库连接失败？

**原因：** Supabase 配置错误

**解决：**
1. 检查 `COZE_SUPABASE_URL` 是否正确（包含 `https://` 前缀）
2. 检查密钥是否正确复制（没有多余空格或换行）
3. 在 Supabase 控制台测试连接

### 4. 微信登录失败？

**原因：** `WX_APP_ID` 或 `WX_APP_SECRET` 配置错误

**解决：**
1. 登录微信小程序后台确认 AppID 和 AppSecret
2. 如果 AppSecret 显示为空，点击「重置」生成新密钥
3. 在微信云托管中更新环境变量

### 5. 环境变量值包含特殊字符怎么办？

**原因：** 特殊字符可能被解析错误

**解决：**
- 用双引号包裹变量值
- 例如：`JWT_SECRET="K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols="`

---

## 📝 配置清单（复制使用）

**完整环境变量配置清单：**

```bash
# ==================== 基础配置 ====================
NODE_ENV=production
PORT=3000

# ==================== 微信小程序配置 ====================
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=<替换为你的真实AppSecret>

# ==================== JWT 配置 ====================
JWT_SECRET=<替换为你生成的强密码>
JWT_EXPIRES_IN=30d

# ==================== Supabase 数据库配置 ====================
COZE_SUPABASE_URL=https://<替换为你的项目ID>.supabase.co
COZE_SUPABASE_ANON_KEY=<替换为你的anon key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<替换为你的service_role key>

# ==================== 腾讯云 COS 配置 ====================
COS_SECRET_ID=<替换为你的SecretId>
COS_SECRET_KEY=<替换为你的SecretKey>
COS_BUCKET_NAME=<替换为你的存储桶名称>
COS_REGION=ap-shanghai
```

---

## 🎯 快速配置模板

**如果你已有所有信息，可以直接复制以下模板并替换：**

```bash
NODE_ENV=production
PORT=3000
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=<从微信后台获取>
JWT_SECRET=<使用 openssl rand -base64 32 生成>
JWT_EXPIRES_IN=30d
COZE_SUPABASE_URL=<从Supabase控制台获取>
COZE_SUPABASE_ANON_KEY=<从Supabase控制台获取>
COZE_SUPABASE_SERVICE_ROLE_KEY=<从Supabase控制台获取>
COS_SECRET_ID=<从腾讯云控制台获取>
COS_SECRET_KEY=<从腾讯云控制台获取>
COS_BUCKET_NAME=<从腾讯云控制台获取>
COS_REGION=ap-shanghai
```

---

**最后更新时间：** 2026-04-03
**版本：** v1.0.0
