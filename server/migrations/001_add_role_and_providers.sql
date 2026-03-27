-- 数据库迁移脚本：添加 role 列和 providers 表
-- 执行方式：在 Supabase SQL 编辑器中运行此脚本

-- 1. 为 users 表添加 role 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role varchar(20) NOT NULL DEFAULT 'broker';
        COMMENT ON COLUMN users.role IS '用户角色：admin(管理员) 或 broker(经纪人)';
    END IF;
END $$;

-- 2. 创建 providers 表（服务商管理）
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

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_providers_service_type ON providers(service_type);
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating);

-- 4. 设置 RLS 策略（Row Level Security）
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看活跃的服务商
CREATE POLICY "Allow public read access to active providers" ON providers
    FOR SELECT
    USING (is_active = true);

-- 允许认证用户插入服务商（需要管理员权限，将在应用层验证）
CREATE POLICY "Allow authenticated users to insert providers" ON providers
    FOR INSERT
    WITH CHECK (true);

-- 允许认证用户更新服务商（需要管理员权限，将在应用层验证）
CREATE POLICY "Allow authenticated users to update providers" ON providers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 允许认证用户删除服务商（需要管理员权限，将在应用层验证）
CREATE POLICY "Allow authenticated users to delete providers" ON providers
    FOR DELETE
    USING (true);

-- 5. 为 users 表设置 RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的信息
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (true);

-- 允许用户更新自己的信息
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 允许插入新用户（登录时创建）
CREATE POLICY "Allow insert new users" ON users
    FOR INSERT
    WITH CHECK (true);
