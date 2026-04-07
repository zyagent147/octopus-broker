-- 微信云托管 MySQL 数据库初始化脚本
-- 执行方式: mysql -h host -u user -p database < init-mysql.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS wechat_cloud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wechat_cloud;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    openid VARCHAR(128) UNIQUE NOT NULL,
    nickname VARCHAR(128),
    avatar VARCHAR(512),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'broker',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    phone VARCHAR(20),
    budget VARCHAR(100),
    contract_end_date DATE,
    contract_type VARCHAR(20),
    birthday DATE,
    requirements TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    last_follow_time DATETIME,
    reminder_days_contract INT DEFAULT 3,
    reminder_days_birthday INT DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 跟进记录表
CREATE TABLE IF NOT EXISTS follow_ups (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    follow_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 房源表
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    community VARCHAR(128) NOT NULL,
    building VARCHAR(64),
    address VARCHAR(256),
    layout VARCHAR(32),
    area DECIMAL(10, 2),
    price DECIMAL(12, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    images JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 租约表
CREATE TABLE IF NOT EXISTS leases (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    tenant_name VARCHAR(64) NOT NULL,
    tenant_phone VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(12, 2) NOT NULL,
    deposit DECIMAL(12, 2),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'monthly',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_property_id (property_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 账单表（关联租约）
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(36) PRIMARY KEY,
    lease_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36),
    period_index INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at DATETIME,
    paid_amount DECIMAL(12, 2),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_lease_id (lease_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 租金账单表（关联房源）
CREATE TABLE IF NOT EXISTS rent_bills (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    tenant_name VARCHAR(64),
    tenant_phone VARCHAR(20),
    amount DECIMAL(12, 2) NOT NULL,
    payment_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    custom_days INT,
    bill_date INT NOT NULL,
    next_due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_property_id (property_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 服务商表
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(36) PRIMARY KEY,
    service_type VARCHAR(20) NOT NULL,
    name VARCHAR(128) NOT NULL,
    contact_person VARCHAR(64),
    phone VARCHAR(20) NOT NULL,
    wechat VARCHAR(64),
    address VARCHAR(256),
    description TEXT,
    price_range VARCHAR(100),
    rating INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_service_type (service_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 服务预约表
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    service_type VARCHAR(20),
    title VARCHAR(100) NOT NULL,
    provider_id VARCHAR(36),
    provider_name VARCHAR(64),
    provider_phone VARCHAR(20),
    price DECIMAL(12, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    scheduled_date DATE,
    address VARCHAR(256),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 提醒表
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(32) NOT NULL,
    ref_id VARCHAR(36),
    title VARCHAR(128) NOT NULL,
    content TEXT,
    remind_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_remind_date (remind_date),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_time VARCHAR(10) DEFAULT '09:00',
    theme VARCHAR(20) DEFAULT 'light',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
