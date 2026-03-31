# 数据迁移指南

## 📊 容量规划

### 开发环境（当前）

| 资源 | 配置 | 适用场景 |
|------|------|---------|
| Supabase 数据库 | 500MB | 开发测试 |
| 文件存储 | 1GB | 图片上传 |
| 后端服务 | Coze 托管 | 开发调试 |

**⚠️ 不适合正式运营！仅用于开发和测试。**

---

### 生产环境（推荐配置）

#### 小规模运营（< 1000 日活）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| 微信云托管 | 0.5核 512MB × 2实例 | ¥60-100 |
| 腾讯云 COS | 10GB 存储 | ¥1-2 |
| Supabase Pro | 8GB 数据库 | $25/月 |
| **合计** | - | **¥300-400/月** |

#### 中等规模运营（1000-5000 日活）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| 微信云托管 | 1核 1GB × 3实例 | ¥150-200 |
| 腾讯云 COS | 50GB 存储 | ¥5-10 |
| Supabase Pro | 8GB 数据库 | $25/月 |
| **合计** | - | **¥400-500/月** |

#### 大规模运营（> 5000 日活）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| 微信云托管 | 2核 2GB × 5实例 | ¥400-500 |
| 腾讯云 COS | 100GB 存储 | ¥10-20 |
| 阿里云 RDS | 4GB MySQL | ¥200-300 |
| **合计** | - | **¥700-900/月** |

---

## 🔄 数据迁移方案

### 方案一：升级 Supabase（最简单）

**适用场景**：用户量 < 5000，不想折腾

**步骤**：
1. 访问 https://supabase.com
2. 升级到 Pro 版（$25/月）
3. 获得 8GB 数据库 + 100GB 文件存储
4. 无需迁移数据，直接使用

**优点**：零迁移成本，自动备份
**缺点**：数据在海外，可能较慢

---

### 方案二：迁移到国内云数据库（推荐）

**适用场景**：用户量 > 5000，需要高性能

#### 目标数据库选择

| 云服务商 | 产品 | 价格 | 特点 |
|---------|------|------|------|
| 腾讯云 | 云数据库 MySQL | ¥100-300/月 | 与微信云托管同地域，延迟低 |
| 阿里云 | RDS MySQL | ¥100-300/月 | 稳定可靠 |
| 华为云 | RDS MySQL | ¥100-300/月 | 性价比高 |

#### 迁移步骤

```bash
# 第一步：导出 Supabase 数据
# 在 Supabase 控制台 → Database → Backups → Export

# 或使用 pg_dump
pg_dump "postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres" > backup.sql

# 第二步：创建目标数据库
# 在腾讯云/阿里云控制台创建 MySQL 实例

# 第三步：转换数据格式
# PostgreSQL → MySQL 需要转换

# 第四步：导入数据
mysql -h target-host -u root -p database < converted_data.sql

# 第五步：修改后端配置
# 更新 server/.env.production 中的数据库连接信息
```

---

### 方案三：自建服务器（完全控制）

**适用场景**：用户量 > 10000，需要完全控制

```
┌─────────────────────────────────────────────────────────────┐
│  自建架构                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户请求                                                    │
│      ↓                                                      │
│  [微信小程序]                                                │
│      ↓                                                      │
│  [微信云托管 / 自建云服务器]                                 │
│      ↓                                                      │
│  [云数据库 MySQL / PostgreSQL]                              │
│      ↓                                                      │
│  [对象存储 COS / OSS]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 数据迁移脚本

### 导出数据

```bash
# 创建迁移脚本
cat > scripts/export-data.sh << 'EOF'
#!/bin/bash

# Supabase 连接信息
SUPABASE_URL="https://br-right-kea-1c046413.supabase2.aidap-global.cn-beijing.volces.com"
SUPABASE_KEY="your-anon-key"

# 导出所有表
echo "正在导出数据..."

# 使用 Supabase REST API 导出
curl -X GET "${SUPABASE_URL}/rest/v1/users?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  > data/users.json

curl -X GET "${SUPABASE_URL}/rest/v1/customers?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  > data/customers.json

curl -X GET "${SUPABASE_URL}/rest/v1/properties?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  > data/properties.json

# ... 其他表

echo "导出完成！"
EOF

chmod +x scripts/export-data.sh
```

### 导入数据到 MySQL

```javascript
// scripts/import-to-mysql.js
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importData() {
  const connection = await mysql.createConnection({
    host: 'your-mysql-host',
    user: 'root',
    password: 'your-password',
    database: 'octopus_broker'
  });

  // 读取导出的 JSON 数据
  const users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
  
  // 插入到 MySQL
  for (const user of users) {
    await connection.execute(
      'INSERT INTO users (id, openid, name, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.openid, user.name, user.role, user.created_at]
    );
  }

  console.log('导入完成！');
  await connection.end();
}

importData();
```

---

## ⚠️ 迁移注意事项

### 1. 数据一致性

- 选择业务低峰期迁移
- 提前通知用户维护时间
- 迁移期间暂停服务

### 2. 数据备份

```bash
# 迁移前必须备份
pg_dump "your-supabase-url" > backup-$(date +%Y%m%d).sql
```

### 3. 测试验证

- 先在测试环境验证迁移脚本
- 检查数据完整性
- 验证功能正常

### 4. DNS 切换

- 提前配置新数据库连接
- 逐步切换流量
- 保留回滚方案

---

## 📈 扩容时间节点建议

| 用户量 | 建议操作 | 时间点 |
|--------|---------|--------|
| < 100 | 保持开发环境 | 开发测试阶段 |
| 100-500 | 升级 Supabase Pro | 正式上线 |
| 500-2000 | 增加云托管实例 | 用户增长期 |
| 2000-5000 | 考虑迁移国内数据库 | 稳定运营期 |
| > 5000 | 自建服务器或托管数据库 | 规模化运营 |

---

## 🆘 需要帮助？

如果需要数据迁移，我可以：
1. 生成完整的迁移脚本
2. 提供数据库表结构转换
3. 协助配置新的数据库连接

请告诉我：
- 当前用户量/预期用户量
- 是否需要迁移到国内数据库
- 预算范围
