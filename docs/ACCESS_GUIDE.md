# 章鱼经纪人 - 访问与部署指南

## 📍 当前环境信息

### 开发环境（DEV）
- **前端公网地址**: https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site
- **后端 API 地址**: https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api
- **项目名称**: 房产经纪人小助手
- **项目环境**: DEV

---

## 🌐 一、开发环境访问方式

### 1. 前端访问（H5 网页版）

#### 方式 A：右侧预览区（推荐）
- 直接在右侧预览区查看 H5 页面
- 支持 hot reload，修改代码自动刷新

#### 方式 B：公网访问
```
https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site
```

**登录方式**：
1. H5 环境自动识别，显示"开发模式登录"按钮
2. 输入开发码：`DEV2024`
3. 点击登录即可进入系统

---

### 2. 后端 API 访问

#### 公网 API 地址
```
https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api
```

#### 可用接口列表

**健康检查**
```bash
curl https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/health
```

**开发模式登录**
```bash
curl -X POST https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'
```

**微信登录**（需在小程序环境）
```bash
curl -X POST https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"微信登录code"}'
```

**获取用户信息**（需 token）
```bash
curl https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**获取服务商列表**
```bash
curl https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/providers
```

---

### 3. 小程序访问

#### 方式 A：微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择项目根目录
3. AppID 已配置：`wxd244b605ba704aab`
4. 编译预览即可

#### 方式 B：扫码预览
1. 在右侧预览区配置并绑定开放平台 AppID
2. 完成授权后自动生成二维码
3. 微信扫码即可预览

---

## 🚀 二、部署后访问方式

### 1. 部署流程

项目会自动部署到 Coze 平台，部署后的域名格式：
```
https://{project-id}.{env}.coze.site
```

### 2. 生产环境访问

部署完成后，访问地址会变更：

**生产环境（PROD）**
```
前端：https://{project-id}.prod.coze.site
后端：https://{project-id}.prod.coze.site/api
```

### 3. 登录方式

#### 小程序端
1. 使用真实微信账号登录
2. 调用 `Taro.login()` 获取 code
3. 后端换取 openid 并创建用户
4. 第一个登录的用户自动成为管理员

#### H5 端
- 生产环境需要实现真实的登录逻辑
- 开发模式登录（`DEV2024`）仅限开发环境

---

## 🔐 三、API 认证机制

### JWT Token 认证

**获取 Token**
```bash
# 开发模式
curl -X POST https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'

# 微信登录（小程序）
curl -X POST https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"微信code"}'
```

**使用 Token**
```bash
curl https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Token 有效期**: 30天

---

## 📱 四、测试账号

### 开发环境测试账号

| 环境 | 账号 | 密码/开发码 | 角色 |
|------|------|-------------|------|
| H5 开发模式 | 自动创建 | `DEV2024` | 管理员 |
| 小程序 | 微信授权 | 无需密码 | 第一个用户为管理员 |

### 用户角色说明

- **admin**: 管理员，可以管理服务商、查看所有数据
- **broker**: 经纪人，只能查看和管理自己的数据

---

## 🛠️ 五、常见问题

### Q1: 开发环境登录失败？
**解决方案**：
1. 确保使用开发码 `DEV2024`
2. 检查数据库迁移是否执行（见 `server/migrations/`）
3. 查看后端日志排查错误

### Q2: 小程序无法登录？
**解决方案**：
1. 确认已配置正确的 AppID
2. 在微信公众平台配置服务器域名
3. 检查网络请求是否正常

### Q3: API 返回 500 错误？
**解决方案**：
1. 检查数据库连接是否正常
2. 查看后端日志：`tail -50 /tmp/coze-logs/dev.log`
3. 确认数据库表结构已创建

### Q4: 跨域问题？
**解决方案**：
- 开发环境已配置 CORS，允许所有来源
- 生产环境需在微信公众平台配置合法域名

---

## 📊 六、网络请求示例

### 前端代码示例

```typescript
import { Network } from '@/network'

// 登录
const loginRes = await Network.request({
  url: '/api/auth/dev-login',
  method: 'POST',
  data: { devCode: 'DEV2024' }
})

// 获取客户列表
const customers = await Network.request({
  url: '/api/customers',
  method: 'GET'
})

// 创建房源
const result = await Network.request({
  url: '/api/properties',
  method: 'POST',
  data: {
    title: '精装修两室一厅',
    price: 3500,
    address: '北京市朝阳区'
  }
})
```

---

## 🔧 七、调试技巧

### 1. 查看网络请求
所有网络请求都会在控制台打印：
```
📤 Network Request: { url, method, data, header }
📥 Network Response: { url, status, data }
```

### 2. 查看后端日志
```bash
tail -50 /tmp/coze-logs/dev.log
```

### 3. 测试 API 接口
使用 curl 或 Postman 测试：
```bash
# 健康检查
curl https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/health

# 开发登录
curl -X POST https://c95a3f35-a531-4fd7-b122-1faa2d7ff161.dev.coze.site/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"devCode":"DEV2024"}'
```

---

## 📝 八、注意事项

1. **开发环境 vs 生产环境**
   - 开发环境：使用开发码登录，自动创建测试账号
   - 生产环境：需要真实微信授权登录

2. **数据隔离**
   - 每个经纪人只能查看自己的数据
   - 管理员可以查看所有服务商数据

3. **数据库迁移**
   - 部署前务必执行数据库迁移脚本
   - 路径：`server/migrations/001_add_role_and_providers.sql`

4. **安全配置**
   - 生产环境关闭开发模式登录
   - 配置微信小程序合法域名
   - 定期更换 JWT Secret

---

**更新时间**: 2026-03-27
**项目版本**: v1.0.0
