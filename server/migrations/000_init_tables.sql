-- 章鱼经纪人小程序 - 数据库初始化脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    openid varchar(128) UNIQUE NOT NULL,
    nickname varchar(128),
    avatar varchar(512),
    phone varchar(20),
    role varchar(20) NOT NULL DEFAULT 'broker',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT valid_role CHECK (role IN ('admin', 'broker'))
);

CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);

-- ============================================
-- 2. 客户表
-- ============================================
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
    updated_at timestamp with time zone,
    CONSTRAINT valid_customer_status CHECK (status IN ('pending', 'active', 'deal', 'lost'))
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- ============================================
-- 3. 跟进记录表
-- ============================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id varchar(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    next_follow_date date,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_customer_id ON follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);

-- ============================================
-- 4. 房源表
-- ============================================
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
    updated_at timestamp with time zone,
    CONSTRAINT valid_property_status CHECK (status IN ('available', 'rented', 'sold'))
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- ============================================
-- 5. 租约表
-- ============================================
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
    updated_at timestamp with time zone,
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
    CONSTRAINT valid_lease_status CHECK (status IN ('active', 'ended', 'terminated'))
);

CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_user_id ON leases(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);

-- ============================================
-- 6. 账单表
-- ============================================
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
    updated_at timestamp with time zone,
    CONSTRAINT valid_bill_type CHECK (bill_type IN ('rent', 'deposit', 'utility', 'other')),
    CONSTRAINT valid_bill_status CHECK (status IN ('pending', 'paid', 'overdue'))
);

CREATE INDEX IF NOT EXISTS idx_bills_lease_id ON bills(lease_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- ============================================
-- 7. 服务商表
-- ============================================
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
    rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT valid_service_type CHECK (service_type IN ('move', 'clean', 'repair', 'decoration', 'housekeeping'))
);

CREATE INDEX IF NOT EXISTS idx_providers_service_type ON providers(service_type);
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active);

-- ============================================
-- 8. 服务记录表
-- ============================================
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
    updated_at timestamp with time zone,
    CONSTRAINT valid_service_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- ============================================
-- 9. 提醒表
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_date ON reminders(remind_date);
CREATE INDEX IF NOT EXISTS idx_reminders_is_read ON reminders(is_read);

-- ============================================
-- 10. 用户设置表
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_enabled boolean DEFAULT true,
    reminder_time varchar(10) DEFAULT '09:00',
    theme varchar(20) DEFAULT 'light',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 完成
-- ============================================
-- 所有表已创建完成
-- 服务端使用 service_role 密钥，已绕过 RLS，无需配置 RLS 策略
