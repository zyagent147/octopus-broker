import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 数据库初始化 SQL
const INIT_SQL = `
-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    openid varchar(128) UNIQUE NOT NULL,
    nickname varchar(128),
    avatar varchar(512),
    phone varchar(20),
    role varchar(20) NOT NULL DEFAULT 'broker',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 2. 客户表
CREATE TABLE IF NOT EXISTS customers (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(64) NOT NULL,
    phone varchar(20),
    budget varchar(100),
    contract_end_date date,
    contract_type varchar(20),
    birthday date,
    requirements text,
    status varchar(20) NOT NULL DEFAULT 'pending',
    last_follow_time timestamp with time zone,
    reminder_days_contract integer DEFAULT 3,
    reminder_days_birthday integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 3. 跟进记录表
CREATE TABLE IF NOT EXISTS follow_ups (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id varchar(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    next_follow_date date,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

-- 4. 房源表
CREATE TABLE IF NOT EXISTS properties (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community varchar(128) NOT NULL,
    building varchar(64),
    address varchar(256),
    layout varchar(32),
    area decimal(10, 2),
    price decimal(12, 2),
    status varchar(20) NOT NULL DEFAULT 'available',
    images jsonb DEFAULT '[]',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 5. 租约表
CREATE TABLE IF NOT EXISTS leases (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id varchar(36) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_name varchar(64) NOT NULL,
    tenant_phone varchar(20),
    start_date date NOT NULL,
    end_date date NOT NULL,
    monthly_rent decimal(12, 2) NOT NULL,
    deposit decimal(12, 2),
    payment_method varchar(20) NOT NULL DEFAULT 'monthly',
    status varchar(20) NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 6. 账单表
CREATE TABLE IF NOT EXISTS bills (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id varchar(36) NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_date date NOT NULL,
    amount decimal(12, 2) NOT NULL,
    bill_type varchar(20) NOT NULL DEFAULT 'rent',
    status varchar(20) NOT NULL DEFAULT 'pending',
    paid_date date,
    remark text,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 7. 服务商表
CREATE TABLE IF NOT EXISTS providers (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type varchar(20) NOT NULL,
    name varchar(128) NOT NULL,
    contact_person varchar(64),
    phone varchar(20) NOT NULL,
    wechat varchar(64),
    address varchar(256),
    description text,
    price_range varchar(100),
    rating integer DEFAULT 5,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 8. 服务记录表
CREATE TABLE IF NOT EXISTS services (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id varchar(36) REFERENCES providers(id) ON DELETE SET NULL,
    service_type varchar(20) NOT NULL,
    property_id varchar(36) REFERENCES properties(id) ON DELETE SET NULL,
    scheduled_date date NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    cost decimal(12, 2),
    remark text,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 9. 提醒表
CREATE TABLE IF NOT EXISTS reminders (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type varchar(32) NOT NULL,
    ref_id varchar(36),
    title varchar(128) NOT NULL,
    content text,
    remind_date date NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

-- 10. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_enabled boolean DEFAULT true,
    reminder_time varchar(10) DEFAULT '09:00',
    theme varchar(20) DEFAULT 'light',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_user_id ON leases(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
`;

/**
 * 初始化数据库
 */
async function initDatabase() {
  console.log('[DB Init] 开始初始化数据库...');
  
  // 获取数据库连接信息
  const databaseUrl = process.env.PGDATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('[DB Init] 未找到数据库连接信息，跳过初始化');
    return true;
  }
  
  console.log('[DB Init] 使用 PostgreSQL 连接初始化数据库');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // 执行初始化 SQL
    await pool.query(INIT_SQL);
    console.log('[DB Init] 数据库表初始化成功！');
    return true;
  } catch (error: any) {
    console.error('[DB Init] 初始化失败:', error.message);
    // 即使失败也继续启动，可能表已存在
    return true;
  } finally {
    await pool.end();
  }
}

// 执行初始化
initDatabase()
  .then(() => {
    console.log('[DB Init] 数据库初始化完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[DB Init] 数据库初始化异常:', error);
    process.exit(0); // 即使失败也返回 0，不影响启动
  });
