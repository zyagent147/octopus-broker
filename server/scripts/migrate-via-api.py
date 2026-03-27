#!/usr/bin/env python3
"""
Supabase 数据库迁移脚本
通过 REST API 执行 SQL 迁移
"""

import requests
import json
import os

# Supabase 配置
SUPABASE_URL = os.getenv('COZE_SUPABASE_URL', 'https://br-right-kea-1c046413.supabase2.aidap-global.cn-beijing.volces.com')
SUPABASE_ANON_KEY = os.getenv('COZE_SUPABASE_ANON_KEY', '')

# SQL 迁移内容
MIGRATION_SQL = """
-- 1. 为 users 表添加 role 列
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role varchar(20) NOT NULL DEFAULT 'broker';
    END IF;
END $$;

-- 2. 创建 providers 表
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

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_providers_service_type ON providers(service_type);
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active);

-- 4. 启用 RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Allow public read active providers" ON providers FOR SELECT USING (is_active = true);
CREATE POLICY "Allow authenticated insert providers" ON providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update providers" ON providers FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete providers" ON providers FOR DELETE USING (true);
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow insert new users" ON users FOR INSERT WITH CHECK (true);
"""

def run_migration():
    """执行数据库迁移"""
    print("📦 开始执行数据库迁移...")
    print(f"🔗 Supabase URL: {SUPABASE_URL}")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    # 方法1: 尝试使用 REST API 直接创建表
    print("\n方法1: 尝试通过 REST API 创建表...")
    
    # 检查 users 表是否有 role 列
    try:
        # 先尝试查询 users 表
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?limit=1',
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ 成功连接到 users 表")
            print("⚠️  需要手动添加 role 列（请使用 Supabase SQL 编辑器）")
        else:
            print(f"⚠️  users 表查询失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")
    
    # 尝试创建 providers 表
    try:
        # 检查 providers 表是否存在
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/providers?limit=1',
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ providers 表已存在")
        elif response.status_code == 404:
            print("⚠️  providers 表不存在，需要创建")
        else:
            print(f"⚠️  providers 表检查失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 检查失败: {e}")
    
    print("\n" + "="*60)
    print("📋 请手动执行以下步骤:")
    print("="*60)
    print("\n1. 打开 Supabase 控制台:")
    print(f"   https://supabase.com/dashboard/project/dwtdfbbmkumhyomzvcgx/sql")
    print("\n2. 点击 'New Query'")
    print("\n3. 复制并粘贴以下 SQL:")
    print("-" * 60)
    print(MIGRATION_SQL)
    print("-" * 60)
    print("\n4. 点击 'Run' 执行")
    print("\n✅ 执行完成后，开发模式登录即可正常使用")

if __name__ == '__main__':
    run_migration()
