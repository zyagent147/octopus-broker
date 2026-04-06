# 章鱼经纪人 - 项目说明文档

> 本文档用于扣子（Coze）平台理解项目架构和需求

---

## 一、项目概述

**章鱼经纪人** 是一款房产经纪人个人办公工具小程序，帮助经纪人管理客户、房源、租约账单和生活服务。

- **项目名称**: zhangyu-broker
- **微信 AppID**: wxd244b605ba704aab
- **目标平台**: 微信小程序 + H5

---

## 二、技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Taro | 4.1.9 | 跨端框架 |
| React | 18.0 | UI 框架 |
| TypeScript | 5.4.5 | 类型安全 |
| Tailwind CSS | 4.1 | 样式方案 |
| Zustand | 5.0.9 | 状态管理（本地持久化） |
| lucide-react-taro | 1.4.1 | 图标库 |

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| NestJS | 10.x | 后端框架 |
| Supabase | 2.95.3 | PostgreSQL 数据库 |
| JWT | 11.0 | 认证方案 |
| Passport | 0.7 | 认证中间件 |

---

## 三、数据存储架构

### ⚠️ 重要：数据存储策略说明

当前项目采用**混合存储策略**，存在数据不一致风险：

| 模块 | 存储位置 | 是否同步云端 | 换设备影响 |
|------|----------|--------------|------------|
| 用户信息 | Supabase | ✅ 是 | 多端同步 |
| 租金账单提醒 | Supabase | ✅ 是 | 多端同步 |
| 服务商信息 | Supabase | ✅ 是 | 共享数据 |
| **客户管理** | 本地 Zustand | ❌ 否 | **数据丢失** |
| **房源管理** | 本地 Zustand | ❌ 否 | **数据丢失** |
| **租约管理** | 本地 Zustand | ❌ 否 | **数据丢失** |
| **账单管理** | 本地 Zustand | ❌ 否 | **数据丢失** |
| **生活服务预约** | 本地 Zustand | ❌ 否 | **数据丢失** |

### 本地存储 Key 列表

```
user-storage              # 用户登录信息
octopus-broker-customers  # 客户数据
property-storage          # 房源数据
lease-storage             # 租约数据
bill-storage              # 账单数据
```

---

## 四、数据库表结构

### 已创建的表（11张）

```sql
-- 用户表
users (id, openid, nickname, avatar, phone, role, created_at, updated_at)

-- 客户表
customers (id, user_id, name, phone, budget, contract_type, contract_end_date, 
           birthday, requirements, status, last_follow_time, 
           reminder_days_contract, reminder_days_birthday, created_at, updated_at)

-- 跟进记录表
follow_ups (id, customer_id, user_id, content, follow_time, created_at)

-- 房源表
properties (id, user_id, community, building, address, layout, area, price, 
            status, images, created_at, updated_at)

-- 租约表（⚠️ 后端无模块）
leases (id, property_id, user_id, tenant_name, tenant_phone, start_date, end_date,
        monthly_rent, deposit, payment_method, status, created_at, updated_at)

-- 账单表（⚠️ 后端无模块）
bills (id, lease_id, user_id, property_id, period_index, period_start, period_end,
       due_date, amount, status, paid_at, paid_amount, remark, created_at, updated_at)

-- 租金账单提醒表（✅ 在用）
rent_bills (id, user_id, property_id, tenant_name, tenant_phone, amount,
            payment_cycle, custom_days, bill_date, next_due_date, status, 
            paid_at, created_at, updated_at)

-- 服务商表
providers (id, service_type, name, contact_person, phone, wechat, address,
           description, price_range, rating, is_active, sort_order, created_at, updated_at)

-- 生活服务预约表
services (id, user_id, service_type, title, provider_id, provider_name, 
          provider_phone, price, status, scheduled_date, address, notes, 
          created_at, updated_at)

-- 提醒表（❌ 未使用）
reminders (id, user_id, type, ref_id, title, content, remind_date, is_read, created_at)

-- 用户设置表
user_settings (id, user_id, reminder_enabled, reminder_time, theme, created_at, updated_at)
```

---

## 五、后端 API 接口清单

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| POST | `/login` | 微信登录 | ✅ 前端已调用 |
| POST | `/dev-login` | 开发模式登录（密码: DEV2024） | ✅ 前端已调用 |
| GET | `/me` | 获取当前用户信息 | ✅ 前端已调用 |
| POST | `/update-info` | 更新用户信息 | ✅ 前端已调用 |

### 客户模块 `/api/customers`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/` | 获取客户列表 | ❌ **前端未调用** |
| GET | `/:id` | 获取客户详情 | ❌ **前端未调用** |
| POST | `/` | 创建客户 | ❌ **前端未调用** |
| PUT | `/:id` | 更新客户 | ❌ **前端未调用** |
| DELETE | `/:id` | 删除客户 | ❌ **前端未调用** |
| GET | `/:id/follow-ups` | 获取跟进记录 | ❌ **前端未调用** |
| POST | `/:id/follow-ups` | 创建跟进记录 | ❌ **前端未调用** |

### 房源模块 `/api/properties`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/` | 获取房源列表 | ❌ **前端未调用** |
| GET | `/:id` | 获取房源详情 | ❌ **前端未调用** |
| POST | `/` | 创建房源 | ❌ **前端未调用** |
| PUT | `/:id` | 更新房源 | ❌ **前端未调用** |
| DELETE | `/:id` | 删除房源 | ❌ **前端未调用** |

### 租金账单模块 `/api/rent-bills`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/upcoming?days=7` | 获取即将到期账单 | ✅ 前端已调用 |
| GET | `/pending` | 获取所有待收账单 | ✅ 前端已调用 |
| GET | `/property/:propertyId` | 获取房源的账单 | ✅ 前端已调用 |
| GET | `/:id` | 获取账单详情 | ✅ 前端已调用 |
| POST | `/` | 创建账单 | ✅ 前端已调用 |
| PUT | `/:id` | 更新账单 | ✅ 前端已调用 |
| POST | `/:id/mark-paid` | 标记已收款 | ✅ 前端已调用 |
| DELETE | `/:id` | 删除账单 | ✅ 前端已调用 |

### 服务商模块 `/api/providers`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/` | 获取服务商列表 | ✅ 前端已调用 |
| GET | `/:id` | 获取服务商详情 | ✅ 前端已调用 |
| POST | `/` | 创建服务商（管理员） | ✅ 前端已调用 |
| PUT | `/:id` | 更新服务商（管理员） | ✅ 前端已调用 |
| DELETE | `/:id` | 删除服务商（管理员） | ✅ 前端已调用 |

### 生活服务模块 `/api/services`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/` | 获取服务列表 | ❌ **前端未调用** |
| POST | `/` | 创建服务预约 | ❌ **前端未调用** |
| PUT | `/:id` | 更新服务状态 | ❌ **前端未调用** |
| DELETE | `/:id` | 删除服务 | ❌ **前端未调用** |

### 文件上传模块 `/api/upload`

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| POST | `/` | 上传文件 | ✅ 前端已调用 |

---

## 六、前端页面结构

```
src/pages/
├── login/                 # 登录页
│   └── index.tsx
├── customers/             # 客户管理
│   ├── index.tsx         # 客户列表
│   ├── detail.tsx        # 客户详情
│   ├── form.tsx          # 新建/编辑客户
│   └── follow-up.tsx     # 添加跟进记录
├── properties/            # 房源管理
│   ├── index.tsx         # 房源列表
│   ├── detail.tsx        # 房源详情（含租约和账单）
│   └── form.tsx          # 新建/编辑房源
├── lease/                 # 租约管理
│   └── form.tsx          # 新建/编辑租约
├── services/              # 生活服务
│   ├── index.tsx         # 服务列表
│   └── form.tsx          # 预约服务
├── admin/                 # 管理后台
│   └── providers/        # 服务商管理
│       ├── index.tsx
│       └── form.tsx
├── profile/               # 个人中心
│   └── index.tsx
└── agreement/             # 协议页面
    ├── privacy.tsx
    └── terms.tsx
```

---

## 七、前端状态管理

### Zustand Store 列表

| Store 文件 | 用途 | 数据存储 Key |
|------------|------|--------------|
| `user.ts` | 用户登录状态 | `user-storage` |
| `customer.ts` | 客户数据（本地） | `octopus-broker-customers` |
| `property.ts` | 房源数据（本地） | `property-storage` |
| `lease.ts` | 租约数据（本地） | `lease-storage` |
| `bill.ts` | 账单数据（本地） | `bill-storage` |
| `reminder.ts` | 提醒数据（本地） | - |

---

## 八、环境变量配置

### 必需配置

```bash
# 微信小程序
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=<从微信公众平台获取>

# JWT
JWT_SECRET=<自定义强随机字符串>

# Supabase
COZE_SUPABASE_URL=https://xxx.supabase.co
COZE_SUPABASE_ANON_KEY=<从 Supabase 控制台获取>
COZE_SUPABASE_SERVICE_ROLE_KEY=<从 Supabase 控制台获取>
COZE_SUPABASE_DB_PASSWORD=<从 Supabase 控制台获取>
```

### 可选配置（文件上传）

```bash
COS_SECRET_ID=<腾讯云密钥>
COS_SECRET_KEY=<腾讯云密钥>
COS_BUCKET_NAME=<存储桶名称>
COS_REGION=ap-shanghai
```

---

## 九、已知问题与风险

### 🔴 高优先级问题

1. **核心数据仅本地存储**
   - 客户、房源、租约、账单数据存在本地 Zustand
   - 换设备或清除缓存会导致数据永久丢失
   - 后端已实现完整 CRUD 接口，但前端未调用

2. **租约/账单模块后端缺失**
   - 数据库表已创建（`leases`、`bills`）
   - 但 `server/src/modules/` 下无对应模块
   - `app.module.ts` 未导入这些模块

3. **数据存储策略不一致**
   - 租金提醒使用云端 `rent_bills` 表
   - 租约账单使用本地 `bill-storage`
   - 两套系统并行，容易混淆

### 🟡 中优先级问题

4. **reminders 表未使用**
   - 表已创建但前端使用本地 store

5. **字段不一致**
   - 前端 Customer 有 `remark` 字段，后端表无

---

## 十、修复建议

### 方案 A：快速上线（保持本地存储）

1. 在用户界面添加明确提示："数据仅保存在本机，更换设备将丢失"
2. 添加数据导出/备份功能（导出为 JSON 文件）

### 方案 B：正式产品（推荐）

1. **修改前端调用后端 API**
   - 将 `useCustomerStore` 改为调用 `/api/customers`
   - 将 `usePropertyStore` 改为调用 `/api/properties`

2. **补充后端缺失模块**
   - 创建 `leases.module.ts`
   - 创建 `bills.module.ts`
   - 统一使用一套账单系统

3. **数据迁移**
   - 提供本地数据导入到云端的工具

---

## 十一、部署检查清单

```
□ 1. 配置所有环境变量
□ 2. 在微信公众平台配置服务器域名
□ 3. 在微信公众平台配置业务域名（H5）
□ 4. 上传小程序代码并提交审核
□ 5. 配置隐私保护指引
□ 6. 测试微信登录流程
□ 7. 测试数据库表自动初始化
□ 8. 测试租金提醒功能
□ 9. 测试文件上传功能
```

---

## 十二、文件目录结构

```
projects/
├── src/                    # 前端源码
│   ├── pages/             # 页面
│   ├── stores/            # Zustand 状态管理
│   ├── components/        # 公共组件
│   ├── network.ts         # 网络请求封装
│   └── app.tsx            # 入口文件
├── server/                 # 后端源码
│   ├── src/
│   │   ├── modules/       # 业务模块
│   │   ├── storage/       # 数据库连接
│   │   ├── interceptors/  # 拦截器
│   │   ├── app.module.ts  # 根模块
│   │   └── main.ts        # 入口（含数据库初始化）
│   └── package.json
├── config/                 # Taro 构建配置
│   ├── index.ts
│   ├── dev.ts
│   └── prod.ts
├── project.config.json     # 小程序配置
├── package.json            # 前端依赖
├── FEATURES.md             # 功能清单
├── ENV_CONFIG.md           # 环境配置说明
└── PROJECT_SPEC.md         # 本文档
```

---

## 附录：前端数据类型定义

### Customer 客户

```typescript
interface Customer {
  id: string
  name: string
  phone: string | null
  budget: string | null
  status: 'pending' | 'following' | 'completed' | 'abandoned'
  contract_type: 'rent' | 'buy' | null
  contract_end_date: string | null
  birthday: string | null
  requirements: string | null
  last_follow_time: string | null
  reminder_days_contract: number
  reminder_days_birthday: number
  remark: string | null
  created_at: string
  updated_at: string | null
}
```

### Property 房源

```typescript
interface Property {
  id: string
  community: string
  building: string | null
  address: string
  layout: string | null
  area: number | null
  price: number | null
  status: 'available' | 'rented' | 'sold'
  images: string[]
  remark: string | null
  created_at: string
  updated_at: string | null
}
```

### Lease 租约

```typescript
type PaymentMethod = 'monthly' | 'quarterly' | 'semiannual' | 'annual'

interface Lease {
  id: string
  property_id: string
  landlord_name: string
  landlord_phone: string
  tenant_name: string
  tenant_phone: string
  monthly_rent: number
  payment_method: PaymentMethod
  start_date: string
  end_date: string
  reminder_days: number
  status: 'active' | 'ended'
  created_at: string
  updated_at: string | null
}
```

### Bill 账单

```typescript
interface Bill {
  id: string
  lease_id: string
  property_id: string
  period_index: number
  period_start: string
  period_end: string
  due_date: string
  amount: number
  status: 'pending' | 'paid'
  paid_at: string | null
  paid_amount: number | null
  remark: string | null
  created_at: string
  updated_at: string | null
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-04-06  
**生成工具**: OpenClaw Agent
