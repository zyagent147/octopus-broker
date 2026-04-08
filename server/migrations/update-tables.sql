-- 更新数据库表结构
USE wechat_cloud;

-- 更新 reminders 表以匹配代码
ALTER TABLE reminders
MODIFY COLUMN customer_id VARCHAR(36),
ADD COLUMN customer_id VARCHAR(36) AFTER user_id,
ADD COLUMN description TEXT AFTER title,
CHANGE COLUMN remind_date reminder_date DATE,
ADD COLUMN is_completed BOOLEAN DEFAULT 0 AFTER reminder_date,
ADD COLUMN completed_at DATETIME AFTER is_completed,
ADD COLUMN updated_at DATETIME AFTER completed_at;

-- 添加索引
CREATE INDEX idx_customer_id ON reminders(customer_id);

-- 更新 follow_ups 表以匹配代码
ALTER TABLE follow_ups
ADD COLUMN type VARCHAR(20) AFTER user_id,
ADD COLUMN result VARCHAR(20) AFTER content,
CHANGE COLUMN follow_time follow_up_date DATETIME;

-- 更新 users 表添加提醒天数字段
ALTER TABLE users
ADD COLUMN reminder_days_contract INT DEFAULT 3 AFTER role,
ADD COLUMN reminder_days_birthday INT DEFAULT 3 AFTER reminder_days_contract;
