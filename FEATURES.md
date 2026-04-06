# 章鱼经纪人 - 功能清单

## 一、应用概述

**章鱼经纪人** 是一款房产经纪人个人办公工具小程序，帮助经纪人管理客户、房源、租约账单和生活服务。

---

## 二、技术架构

### 前端
- **框架**: Taro 4.1.9 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand (本地持久化存储)
- **图标**: lucide-react-taro

### 后端
- **框架**: NestJS 10
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + 微信登录

### 数据存储方式
| 模块 | 存储位置 | 说明 |
|------|----------|------|
| 用户信息 | 后端 Supabase | 多设备同步 |
| 租金账单提醒 | 后端 Supabase | 支持推送提醒 |
| 服务商信息 | 后端 Supabase | 全局共享 |
| 客户管理 | 本地 Zustand | 仅本设备 |
| 房源管理 | 本地 Zustand | 仅本设备 |
| 租约账单 | 本地 Zustand | 仅本设备 |
| 生活服务预约 | 本地 Zustand | 仅本设备 |

---

## 三、功能模块

### 1. 登录模块 (`/pages/login`)

**功能**:
- 微信一键登录（小程序端）
- 开发模式登录（H5 端，密码: `DEV2024`）
- 隐私政策弹窗（必须同意才能登录）
- 用户协议和隐私政策查看页面

**后端接口**:
- `POST /api/auth/login` - 微信登录
- `POST /api/auth/dev-login` - 开发模式登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/update-info` - 更新用户信息

**数据库表**: `users`

---

### 2. 客户管理模块 (`/pages/customers`)

**页面**:
- `pages/customers/index` - 客户列表
- `pages/customers/detail` - 客户详情
- `pages/customers/form` - 新建/编辑客户
- `pages/customers/follow-up` - 添加跟进记录

**功能**:
- 客户增删改查
- 客户状态管理（待跟进/跟进中/已完成/已放弃）
- 按状态筛选
- 搜索客户
- 跟进记录管理
- 客户详情展示

**数据存储**: 本地 Zustand (`useCustomerStore`)

**后端接口** (已实现但前端未调用):
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/:id` - 获取客户详情
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户
- `GET /api/customers/:id/follow-ups` - 获取跟进记录
- `POST /api/customers/:id/follow-ups` - 创建跟进记录

**数据库表**: `customers`, `follow_ups`

---

### 3. 房源管理模块 (`/pages/properties`)

**页面**:
- `pages/properties/index` - 房源列表
- `pages/properties/detail` - 房源详情（含租约和账单）
- `pages/properties/form` - 新建/编辑房源

**功能**:
- 房源增删改查
- 房源状态管理（待租/已租/已售）
- 按状态筛选
- 搜索房源
- 房源图片管理（上传到对象存储）
- 关联租约和账单展示
- 租约账单收租提醒

**数据存储**: 本地 Zustand (`usePropertyStore`)

**后端接口** (已实现但前端未调用):
- `GET /api/properties` - 获取房源列表
- `GET /api/properties/:id` - 获取房源详情
- `POST /api/properties` - 创建房源
- `PUT /api/properties/:id` - 更新房源
- `DELETE /api/properties/:id` - 删除房源

**数据库表**: `properties`

---

### 4. 租约账单模块

**页面**:
- `pages/lease/form` - 新建/编辑租约

**功能**:
- 租约管理（关联房源）
- 根据付款方式自动生成账单（月付/季付/半年付/年付）
- 账单收租状态管理
- 逾期账单标记
- 收租提醒

**数据存储**: 本地 Zustand (`useLeaseStore`, `useBillStore`)

**后端接口**: 无（前端未调用后端）

**注意**: 租约和账单数据存储在本地，不会同步到后端数据库

---

### 5. 租金账单提醒模块

**组件**: `RentBillReminder`

**功能**:
- 显示即将到期的租金账单（7天内）
- 逾期账单提醒
- 快速标记已收款
- 查看房源详情
- 一键拨打电话

**数据存储**: 后端 Supabase (`rent_bills` 表)

**后端接口**:
- `GET /api/rent-bills/upcoming?days=7` - 获取即将到期账单
- `GET /api/rent-bills/pending` - 获取所有待收账单
- `GET /api/rent-bills/property/:propertyId` - 获取房源的账单
- `GET /api/rent-bills/:id` - 获取账单详情
- `POST /api/rent-bills` - 创建账单
- `PUT /api/rent-bills/:id` - 更新账单
- `POST /api/rent-bills/:id/mark-paid` - 标记已收款
- `DELETE /api/rent-bills/:id` - 删除账单

**数据库表**: `rent_bills`

---

### 6. 生活服务模块 (`/pages/services`)

**页面**:
- `pages/services/index` - 服务列表
- `pages/services/form` - 预约服务

**功能**:
- 服务预约（搬家/保洁/维修/其他）
- 服务状态管理（待处理/处理中/已完成）
- 关联服务商
- 服务商列表展示

**数据存储**: 本地 Zustand + 后端 Supabase (`providers` 表)

**后端接口**:
- `GET /api/providers` - 获取服务商列表
- `GET /api/providers/:id` - 获取服务商详情
- `POST /api/providers` - 创建服务商（管理员）
- `PUT /api/providers/:id` - 更新服务商（管理员）
- `DELETE /api/providers/:id` - 删除服务商（管理员）
- `GET /api/services` - 获取服务列表
- `POST /api/services` - 创建服务
- `PUT /api/services/:id` - 更新服务
- `DELETE /api/services/:id` - 删除服务

**数据库表**: `providers`, `services`

---

### 7. 管理后台模块 (`/pages/admin`)

**页面**:
- `pages/admin/providers/index` - 服务商管理
- `pages/admin/providers/form` - 添加/编辑服务商

**功能**:
- 服务商增删改查（仅管理员）
- 服务商状态管理

**权限**: 需要 `role = 'admin'`

---

### 8. 个人中心模块 (`/pages/profile`)

**功能**:
- 用户信息展示
- 本月统计数据（新增客户/新增房源/在租房源）
- 待收账单统计
- 退出登录

---

## 四、数据库表结构

### 已创建的表

| 表名 | 说明 | 字段数 |
|------|------|--------|
| `users` | 用户表 | 8 |
| `customers` | 客户表 | 15 |
| `follow_ups` | 跟进记录表 | 6 |
| `properties` | 房源表 | 12 |
| `leases` | 租约表 | 13 |
| `bills` | 租约账单表 | 14 |
| `rent_bills` | 租金账单提醒表 | 13 |
| `providers` | 服务商表 | 14 |
| `services` | 生活服务表 | 13 |
| `reminders` | 提醒表 | 9 |
| `user_settings` | 用户设置表 | 7 |

---

## 五、已实现 vs 未实现

### ✅ 已实现

| 功能 | 前端 | 后端 | 数据库 | 备注 |
|------|------|------|--------|------|
| 微信登录 | ✅ | ✅ | ✅ | 完整实现 |
| 隐私政策 | ✅ | - | - | 完整实现 |
| 客户管理 | ✅ | ✅ | ✅ | 前端用本地存储 |
| 房源管理 | ✅ | ✅ | ✅ | 前端用本地存储 |
| 租约管理 | ✅ | ❌ | ✅ | 仅本地存储 |
| 租约账单 | ✅ | ❌ | ✅ | 仅本地存储 |
| 租金提醒 | ✅ | ✅ | ✅ | 完整实现 |
| 生活服务 | ✅ | ✅ | ✅ | 前端用本地存储 |
| 服务商管理 | ✅ | ✅ | ✅ | 完整实现 |
| 文件上传 | ✅ | ✅ | - | 支持 COS/S3 |

### ❌ 未实现

| 功能 | 说明 |
|------|------|
| 订阅消息提醒 | 需要配置微信订阅消息 |
| 数据云同步 | 客户/房源/租约数据未同步到云端 |
| 多设备数据同步 | 因使用本地存储，换设备数据丢失 |
| 提醒功能 | `reminders` 表已创建但未使用 |

---

## 六、关键配置项

### 环境变量

```
# 微信小程序
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=***

# JWT
JWT_SECRET=***

# Supabase
COZE_SUPABASE_URL=https://xxx.supabase.co
COZE_SUPABASE_ANON_KEY=***
COZE_SUPABASE_SERVICE_ROLE_KEY=***
COZE_SUPABASE_DB_PASSWORD=***

# 文件上传（可选）
COS_SECRET_ID=***
COS_SECRET_KEY=***
COS_BUCKET_NAME=***
COS_REGION=ap-shanghai
```

---

## 七、已知问题

1. **数据存储不一致**: 前端大部分数据存储在本地 Zustand，未与后端 API 同步
2. **租约账单未持久化**: 租约和账单数据仅存在本地，不会同步到云端
3. **微信 AppSecret**: 每次重置后需要同步更新环境变量
4. **数据库初始化**: 首次部署需要配置 `COZE_SUPABASE_DB_PASSWORD`

---

## 八、部署说明

1. 在微信云托管控制台配置环境变量（见 ENV_CONFIG.md）
2. 确保所有必需环境变量已配置
3. 部署后检查日志确认数据库表初始化成功
4. 测试登录功能

---

## 九、文件结构

```
src/
├── pages/                 # 页面
│   ├── login/            # 登录
│   ├── customers/        # 客户管理
│   ├── properties/       # 房源管理
│   ├── lease/            # 租约
│   ├── services/         # 生活服务
│   ├── admin/            # 管理后台
│   ├── profile/          # 个人中心
│   └── agreement/        # 协议页面
├── stores/               # Zustand 状态管理
│   ├── user.ts          # 用户状态
│   ├── customer.ts      # 客户状态（本地）
│   ├── property.ts      # 房源状态（本地）
│   ├── lease.ts         # 租约状态（本地）
│   ├── bill.ts          # 账单状态（本地）
│   └── reminder.ts      # 提醒状态
├── components/          # 公共组件
├── network.ts           # 网络请求封装

server/
├── src/modules/         # 业务模块
│   ├── auth/           # 认证模块
│   ├── customers/      # 客户模块
│   ├── properties/     # 房源模块
│   ├── rent-bills/     # 租金提醒模块
│   ├── providers/      # 服务商模块
│   ├── services/       # 生活服务模块
│   ├── upload/         # 文件上传模块
│   └── users/          # 用户统计模块
└── main.ts             # 入口（含数据库初始化）
```
