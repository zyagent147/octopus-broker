import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '@/interceptors/http-status.interceptor';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';

// 手动加载 .env 文件（必须在 AppModule 初始化之前）
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 数据库初始化 SQL
const INIT_TABLES_SQL = `
-- 用户表
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

-- 客户表
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

-- 跟进记录表
CREATE TABLE IF NOT EXISTS follow_ups (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id varchar(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    follow_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

-- 房源表
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

-- 租约表
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

-- 账单表（关联租约，用于租约账单管理）
CREATE TABLE IF NOT EXISTS bills (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id varchar(36) NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id varchar(36) REFERENCES properties(id) ON DELETE SET NULL,
    period_index integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    amount decimal(12, 2) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    paid_at timestamp with time zone,
    paid_amount decimal(12, 2),
    remark text,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 租金账单表（关联房源，用于租金提醒）
CREATE TABLE IF NOT EXISTS rent_bills (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id varchar(36) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_name varchar(64),
    tenant_phone varchar(20),
    amount decimal(12, 2) NOT NULL,
    payment_cycle varchar(20) NOT NULL DEFAULT 'monthly',
    custom_days integer,
    bill_date integer NOT NULL,
    next_due_date date NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 服务商表
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

-- 服务预约表（生活服务）
CREATE TABLE IF NOT EXISTS services (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type varchar(20),
    title varchar(100) NOT NULL,
    provider_id varchar(36) REFERENCES providers(id) ON DELETE SET NULL,
    provider_name varchar(64),
    provider_phone varchar(20),
    price decimal(12, 2),
    status varchar(20) NOT NULL DEFAULT 'pending',
    scheduled_date date,
    address varchar(256),
    notes text,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

-- 提醒表
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

-- 用户设置表
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
CREATE INDEX IF NOT EXISTS idx_follow_ups_customer_id ON follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_user_id ON leases(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_lease_id ON bills(lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_bills_user_id ON rent_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_bills_property_id ON rent_bills(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_bills_status ON rent_bills(status);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
`;

/**
 * 初始化数据库表
 */
async function initDatabase() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const dbPassword = process.env.COZE_SUPABASE_DB_PASSWORD;
  
  if (!supabaseUrl) {
    console.log('[Database] 未找到 COZE_SUPABASE_URL，跳过自动初始化');
    return;
  }
  
  // 从 Supabase URL 提取项目 ref
  const match = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) {
    console.log('[Database] 无法解析 Supabase URL，跳过自动初始化');
    return;
  }
  
  const projectRef = match[1];
  
  // 构建数据库连接字符串
  // Supabase PostgreSQL 连接格式: postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  // 或直接连接: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
  
  let connectionString = process.env.COZE_DATABASE_URL;
  
  // 如果没有直接的数据库 URL，尝试使用密码构建
  if (!connectionString && dbPassword) {
    // 使用 pooler 连接（推荐用于服务端）
    connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  }
  
  if (!connectionString) {
    console.log('[Database] 未找到数据库连接信息，跳过自动初始化');
    console.log('[Database] 提示：请设置 COZE_DATABASE_URL 或 COZE_SUPABASE_DB_PASSWORD 环境变量');
    return;
  }
  
  console.log('[Database] 检查并初始化数据库表...');
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    await pool.query(INIT_TABLES_SQL);
    console.log('[Database] 数据库表初始化完成');
  } catch (error: any) {
    console.error('[Database] 初始化异常:', error.message);
  } finally {
    await pool.end();
  }
}

function parsePort(): number {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('-p');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1], 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      return port;
    }
  }
  return 3000;
}

async function bootstrap() {
  // 初始化数据库表
  await initDatabase();
  
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 全局拦截器：统一将 POST 请求的 201 状态码改为 200
  app.useGlobalInterceptors(new HttpStatusInterceptor());
  // 1. 开启优雅关闭 Hooks (关键!)
  app.enableShutdownHooks();

  // 2. 解析端口
  const port = parsePort();
  try {
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${port} 被占用! 请运行 'npx kill-port ${port}' 然后重试。`);
      process.exit(1);
    } else {
      throw err;
    }
  }
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();
